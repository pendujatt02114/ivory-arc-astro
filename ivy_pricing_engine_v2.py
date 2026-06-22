"""
ivy_pricing_engine_v2.py — North India Tours pricing engine (Rulebook v1.0).

This REPLACES the previous per-day/group-discount engine with the profit-first
model in `North_India_Tours_Pricing_Rulebook.pdf`, driven entirely by the data
in `Final_Sheet_with_helper_columns_v2.xlsx` (parsed into PRICING_DATA.json).

Model summary (see the rulebook for the authority):
  * Vehicles: sedan / suv / tempo / highend, each with a MINIMUM ADULT BILLING
    BASIS (3 / 5 / 10 / 3) — small groups pay the floor; we never bill below it.
  * Children are FREE for transport but COUNT toward seating capacity.
  * Delhi-origin single-city  -> destination base fare from the sheet.
  * Extra nights in a city     -> + that city's daily block per extra night.
  * Multi-city circuit:
        first sector (Delhi -> A) = 60% x A's Delhi-origin base fare
        onward A -> B             = B's sector rate x billable_km
        final  X -> Delhi         = X's sector rate x billable_km
        billable_km = max(315, actual_route_km x 1.05)
  * Monuments / activities are NEVER in transport; added only if selected, priced
    per the sheet (per-person x chargeable adults, or flat per-group/vehicle).
  * Hotels are a separate layer (live rate + 10% convenience fee) handled outside
    this engine.

TWO OWNER DECISIONS are isolated as flags at the top (your uploaded docs conflict
on these — see CHILD_TRANSPORT_PRICING and GST_PCT). Flip either in one line.
"""
import json, os, re

# ============================ PRICING CONSTANTS ============================
# Resolved per CLAUDE MASTER PROMPT v3.0:
#  - Children are FREE for transport (Section 6).            -> CHILD_TRANSPORT_PCT = 0.0
#  - GST is 5%, applied ONCE at the very end on the subtotal  -> GST_PCT = 0.05
#    (transport + selected add-ons + accommodation incl. 10% hotel fee), shown as
#    a separate line. Never folded into transport/hotel line items (Section 12).
CHILD_TRANSPORT_PCT = 0.0        # children free for transport (master prompt + sheet)
GST_PCT = 0.05                   # 5% GST on the subtotal, at the end (LOCKED)
# Children at monuments/activities: never auto-priced (rulebook) -> confirm at booking.
CHILD_MONUMENTS_AUTO = False
# FX: sheet is INR. 1 unit of currency = N INR. Confirm these with finance.
FX_INR_PER_UNIT = {"INR": 1.0, "USD": 85.0, "EUR": 100.0, "GBP": 108.0}
# Onward-sector billable-km rule.
MIN_BILLABLE_KM = 315
KM_BUFFER = 1.05
FIRST_SECTOR_PCT = 0.60
HOTEL_CONVENIENCE_PCT = 0.10     # added to live hotel cost only (handled by caller)
# =============================================================================

_DATA_PATH = os.environ.get("IVY_PRICING_DATA",
                            os.path.join(os.path.dirname(__file__), "PRICING_DATA.json"))
DATA = json.load(open(_DATA_PATH, encoding="utf-8"))
DEST = DATA["destinations"]
ATTRACTIONS = DATA["attractions"]
VEHICLES = DATA["vehicles_order"]
_ATTR_BY_DEST = {}
for a in ATTRACTIONS:
    _ATTR_BY_DEST.setdefault(a["destination"], []).append(a)


# ----------------------------- helpers -----------------------------
def _round(x):
    return int(round(x))


def _convert(amount_inr, currency):
    fx = FX_INR_PER_UNIT.get(currency, 1.0)
    return round(amount_inr / fx, 2) if currency != "INR" else _round(amount_inr)


def dest_key(name):
    k = str(name).strip().lower().replace("&", "and")
    k = re.sub(r"[()']", "", k)
    return re.sub(r"[^a-z0-9]+", "_", k).strip("_")


def parse_price(raw):
    """Classify a sheet price cell. Returns (kind, low, high) with kind in
    {exact, approx, range, free, unknown}. Never fabricates a number."""
    if raw is None:
        return ("unknown", None, None)
    if isinstance(raw, (int, float)):
        return ("exact", float(raw), float(raw))
    s = str(raw).strip()
    nums = [float(n.replace(",", "")) for n in re.findall(r"[\d][\d,]*(?:\.\d+)?", s)]
    if not nums:
        if re.search(r"free|no charge|\bnil\b", s, re.I):
            return ("free", 0.0, 0.0)
        return ("unknown", None, None)
    if len(nums) >= 2 and re.search(r"[–\-]|to\b", s):
        return ("range", min(nums), max(nums))
    if re.search(r"approx", s, re.I):
        return ("approx", nums[0], nums[0])
    return ("exact", nums[0], nums[0])


def billable_km(actual_km):
    """Onward / return billable km = max(315, actual x 1.05). If actual is unknown
    (None), fall back to the 315 minimum and flag it."""
    if actual_km is None:
        return MIN_BILLABLE_KM, True   # (km, assumed_minimum)
    return _round(max(MIN_BILLABLE_KM, actual_km * KM_BUFFER)), False


# ----------------------------- capacity -----------------------------
def check_capacity(vehicle, adults, children):
    v = DEST[next(iter(DEST))]["vehicles"][vehicle]   # caps are uniform across destinations
    max_ad, max_pax = v["max_adults"], v["max_pax"]
    total = adults + children
    if adults > max_ad or total > max_pax:
        # recommend the smallest vehicle that fits
        rec = None
        for cand in VEHICLES:
            cv = DEST[next(iter(DEST))]["vehicles"][cand]
            if adults <= cv["max_adults"] and total <= cv["max_pax"]:
                rec = cand
                break
        return {"ok": False, "reason": "exceeds_capacity", "max_adults": max_ad,
                "max_pax": max_pax, "recommend": rec}
    tight = (adults == max_ad) or (total == max_pax)
    return {"ok": True, "tight": tight, "max_adults": max_ad, "max_pax": max_pax}


# ----------------------------- transport -----------------------------
def _veh(dkey, vehicle):
    d = DEST.get(dkey)
    if not d:
        return None
    return d["vehicles"].get(vehicle)


def quote_transport(legs, vehicle, adults, children):
    """legs = [{destination, nights, in_km(optional)}...] in travel order, starting
    after Delhi. in_km is the ACTUAL road km of the leg INTO that city (from the
    previous city, or from Delhi for the first leg). Returns components + total."""
    missing = [l["destination"] for l in legs if not _veh(l["destination"], vehicle)]
    if missing:
        return {"error": "unpriceable_destinations", "destinations": missing,
                "message": "Not in the pricing sheet — the team will confirm these."}

    basis = _veh(legs[0]["destination"], vehicle)["billing_basis"]
    billed_adults = max(adults, basis)
    components = []
    assumed_km = False
    total = 0

    # standard included nights per city (from sheet) determine "extra" nights
    n_cities = len(legs)
    if n_cities == 1:
        # Delhi-origin single-city: base fare + extra-night blocks
        l = legs[0]
        d = DEST[l["destination"]]
        v = _veh(l["destination"], vehicle)
        components.append({"label": "Delhi \u2192 %s (base fare)" % d["display"],
                           "amount_inr": _round(v["base_fare"]), "kind": "base_fare"})
        total += v["base_fare"]
        extra = max(0, int(l.get("nights", d["nights"])) - int(d["nights"]))
        if extra:
            amt = v["daily_block"] * extra
            components.append({"label": "%s extra night x %d (daily block)" % (d["display"], extra),
                               "amount_inr": _round(amt), "kind": "daily_block"})
            total += amt
    else:
        # Multi-city circuit
        for i, l in enumerate(legs):
            d = DEST[l["destination"]]
            v = _veh(l["destination"], vehicle)
            if i == 0:
                amt = FIRST_SECTOR_PCT * v["base_fare"]
                components.append({"label": "Delhi \u2192 %s (60%% first sector)" % d["display"],
                                   "amount_inr": _round(amt), "kind": "first_sector"})
                total += amt
            else:
                bkm, assumed = billable_km(l.get("in_km"))
                assumed_km = assumed_km or assumed
                amt = bkm * v["sector_rate"]
                components.append({"label": "%s \u2192 %s (%d km x \u20b9%.2f/km)" % (
                                       DEST[legs[i-1]["destination"]]["display"], d["display"],
                                       bkm, v["sector_rate"]),
                                   "amount_inr": _round(amt), "kind": "onward_sector"})
                total += amt
            # extra nights in this city
            extra = max(0, int(l.get("nights", d["nights"])) - int(d["nights"]))
            if extra:
                amt = v["daily_block"] * extra
                components.append({"label": "%s extra night x %d (daily block)" % (d["display"], extra),
                                   "amount_inr": _round(amt), "kind": "daily_block"})
                total += amt
        # final return to Delhi using the LAST city's sector rate
        last = legs[-1]
        lv = _veh(last["destination"], vehicle)
        bkm, assumed = billable_km(last.get("return_km"))
        assumed_km = assumed_km or assumed
        amt = bkm * lv["sector_rate"]
        components.append({"label": "%s \u2192 Delhi (%d km x \u20b9%.2f/km)" % (
                               DEST[last["destination"]]["display"], bkm, lv["sector_rate"]),
                           "amount_inr": _round(amt), "kind": "return_sector"})
        total += amt

    total = _round(total)
    total_days = sum(int(l.get("nights", DEST[l["destination"]]["nights"])) for l in legs) + 1
    # PPPD: single-city uses the sheet PPPD; multi-city derives it
    if n_cities == 1:
        pppd = _round(_veh(legs[0]["destination"], vehicle)["pppd"])
    else:
        pppd = _round(total / billed_adults / max(total_days, 1))
    return {"components": components, "transport_total_inr": total,
            "vehicle": vehicle, "billing_basis": basis, "billed_adults": billed_adults,
            "actual_adults": adults, "children": children,
            "pppd_inr": pppd, "child_pppd_inr": _round(pppd * CHILD_TRANSPORT_PCT),
            "total_trip_days": total_days, "assumed_min_km": assumed_km}


# ----------------------------- monuments / activities -----------------------------
def list_attractions(dkey):
    return _ATTR_BY_DEST.get(dest_key(dkey), [])


def parse_sell_status(raw):
    """For the v5 'IVY Sell Price / Quote Status' column. Returns (status, value):
    status in {price, range, free, included, excursion, unknown}. value is a number
    (price), a (low,high) tuple (range), or None."""
    if raw is None:
        return ("unknown", None)
    if isinstance(raw, (int, float)):
        return ("price", float(raw))
    s = str(raw).strip()
    if re.search(r"excursion", s, re.I):
        return ("excursion", None)
    if re.search(r"included|no separate", s, re.I):
        return ("included", None)
    nums = [float(n.replace(",", "")) for n in re.findall(r"[\d][\d,]*(?:\.\d+)?", s)]
    if not nums:
        if re.search(r"free", s, re.I):
            return ("free", 0.0)
        return ("unknown", None)
    if len(nums) >= 2 and re.search(r"[–\-]|to\b", s):
        return ("range", (min(nums), max(nums)))
    if re.search(r"approx", s, re.I):
        return ("range", (nums[0], nums[0]))
    return ("price", nums[0])


def _addon_price(a):
    """Resolve a single attraction's price. Prefers the v5 'IVY Sell Price /
    Quote Status' column; falls back to the v2 'Foreigner Ticket' column. Returns
    (status, low, high) with status in {price, range, free, included, excursion,
    unknown}."""
    if a.get("is_excursion"):
        return ("excursion", None, None)
    if a.get("ivy_sell_price") is not None:      # v5
        st, val = parse_sell_status(a["ivy_sell_price"])
        if st == "price":
            return ("price", val, val)
        if st == "range":
            return ("range", val[0], val[1])
        return (st, None, None) if st in ("free", "included", "excursion", "unknown") else ("unknown", None, None)
    # v2 fallback: foreigner ticket
    raw = a.get("foreigner_ticket") if a.get("foreigner_ticket") is not None else a.get("foreigner_ticket_raw")
    kind, low, high = parse_price(raw)
    kind = {"exact": "price", "approx": "range"}.get(kind, kind)   # unify vocabulary
    return (kind, low, high)


_THEME_SHEET_ALIAS = {"food_local_life": "food"}   # theme map key -> workbook Theme Alignment token


def shortlist_addons(destination, themes=None, interests=None, limit=5, include_excursions=False):
    """Theme/interest-filtered shortlist for a city (master prompt Sections 14-18).
    Scores each attraction on Theme Alignment + Experience Bucket + Claude Interest
    Tags (v5). On v2 (no theme columns) every score is 0, so this returns the first
    `limit` items in sheet order — still safe, just unfiltered until v5 lands."""
    dk = dest_key(destination)
    themes = [_THEME_SHEET_ALIAS.get(t.lower(), t.lower()) for t in (themes or [])]
    interests = [i.lower() for i in (interests or [])]
    scored = []
    for a in _ATTR_BY_DEST.get(dk, []):
        if a.get("is_excursion") and not include_excursions:
            continue
        ta = (a.get("theme_alignment") or "").lower()
        eb = (a.get("experience_bucket") or "").lower()
        tags = (a.get("claude_interest_tags") or "").lower()
        score = 0
        if themes and any(t in ta for t in themes):
            score += 3
        if interests and (any(i in eb for i in interests) or any(i in tags for i in interests)):
            score += 2
        st, low, high = _addon_price(a)
        if st in ("price", "free"):     # iconic/clear-priced items rank a touch higher
            score += 1
        scored.append((score, a))
    scored.sort(key=lambda x: -x[0])
    return [a for _s, a in scored[:limit]]


def price_monuments(selected, adults, children):
    """selected = [{destination, name}...]. Prices each (v5 sell price, else v2
    ticket). Firm items (exact price / free) are summed into the add-on total;
    range/approx/unknown are returned for display only; EXCURSIONS are returned
    separately and NEVER folded into the total (master prompt Section 17)."""
    chargeable = adults + (children if CHILD_MONUMENTS_AUTO else 0)
    firm_total = 0
    lines, excursions = [], []
    for sel in selected:
        dk = dest_key(sel["destination"])
        name = sel.get("name", "")
        match = next((a for a in _ATTR_BY_DEST.get(dk, []) if a["name"].lower() == name.lower()), None)
        if not match:
            lines.append({"destination": dk, "name": name, "status": "not_found",
                          "note": "Confirmed at booking."})
            continue
        st, low, high = _addon_price(match)
        per_person = match["charge_kind"] == "per_person"
        base = {"destination": dk, "name": match["name"], "basis": match["charge_basis"],
                "bucket": match.get("experience_bucket", ""), "theme": match.get("theme_alignment", "")}
        if st == "excursion":
            excursions.append(dict(base, status="excursion",
                                   note="Excursion — affects routing; transport priced separately if included."))
        elif st == "included":
            lines.append(dict(base, status="included", note="Included / no separate add-on."))
        elif st in ("price", "free"):
            unit = low or 0
            amount = _round(unit * (chargeable if per_person else 1))
            firm_total += amount
            lines.append(dict(base, status="firm", unit_inr=_round(unit),
                              qty=(chargeable if per_person else 1), amount_inr=amount))
        elif st == "range":
            lines.append(dict(base, status="estimate", approx_low_inr=_round(low),
                              approx_high_inr=_round(high), per_person=per_person,
                              note="Approximate; team confirms operator pricing."))
        else:
            lines.append(dict(base, status="confirm", note="Confirmed at booking."))
    return {"firm_total_inr": _round(firm_total), "lines": lines,
            "excursions": excursions, "chargeable_travellers": chargeable}


# ----------------------------- top-level quote -----------------------------
def quote(payload):
    """Full quote. payload = {legs:[{destination,nights,in_km,return_km}], vehicle,
    adults, children, currency, monuments:[{destination,name}], hotel_total_inr?}."""
    vehicle = payload.get("vehicle")
    if vehicle not in VEHICLES:
        return {"error": "bad_vehicle", "allowed": VEHICLES}
    adults = int(payload.get("adults") or 0)
    children = int(payload.get("children") or 0)
    currency = payload.get("currency", "INR")
    legs = payload.get("legs") or []
    if not legs or adults < 1:
        return {"error": "need_legs_and_adults"}

    cap = check_capacity(vehicle, adults, children)
    if not cap["ok"]:
        return {"capacity": cap, "error": "exceeds_capacity"}

    t = quote_transport(legs, vehicle, adults, children)
    if "error" in t:
        return t
    mon = price_monuments(payload.get("monuments") or [], adults, children)

    transport = t["transport_total_inr"]
    activities = mon["firm_total_inr"]
    hotels = _round(payload.get("hotel_total_inr") or 0)   # already incl. 10% if provided
    subtotal = transport + activities + hotels              # Subtotal Before GST
    gst = _round(subtotal * GST_PCT)                        # GST @ 5% (at the end)
    final_committed = subtotal + gst                        # Final Committed Price

    def cur(x):
        return _convert(x, currency)

    def _disp_line(ln):
        out = dict(ln)
        for k_inr, k_disp in (("amount_inr", "amount"), ("unit_inr", "unit"),
                              ("approx_low_inr", "approx_low"), ("approx_high_inr", "approx_high")):
            if ln.get(k_inr) is not None:
                out[k_disp] = cur(ln[k_inr])
        return out

    out = {
        "currency": currency,
        "capacity": cap,
        "vehicle": vehicle,
        "pricing_basis_adults": t["billing_basis"],
        "travelling_party": {"adults": adults, "children": children},
        "pppd": cur(t["pppd_inr"]),
        "child_transport_free": CHILD_TRANSPORT_PCT == 0.0,
        "transport_components": [dict(c, amount=cur(c["amount_inr"])) for c in t["components"]],
        "transport_total": cur(transport),
        "monuments": [_disp_line(ln) for ln in mon["lines"]],
        "monuments_firm_total": cur(activities),
        "excursions": mon["excursions"],            # shown separately; NOT in totals until priced
        "hotels_total": cur(hotels),
        "subtotal_before_gst": cur(subtotal),
        "gst_pct": GST_PCT,
        "gst": cur(gst),
        "final_committed_price": cur(final_committed),
        "_inr": {"transport": transport, "activities": activities, "hotels": hotels,
                 "subtotal_before_gst": subtotal, "gst": gst, "final_committed": final_committed},
        "_flags": {"assumed_min_km": t["assumed_min_km"],
                   "child_transport_pct": CHILD_TRANSPORT_PCT, "gst_pct": GST_PCT},
        "total_trip_days": t["total_trip_days"],
    }
    return out


# ----------------------------- self-tests -----------------------------
if __name__ == "__main__":
    # Capacity: 4 adults can't go in a Sedan (max 3), recommend SUV
    c = check_capacity("sedan", 4, 0); assert not c["ok"] and c["recommend"] == "suv", c
    c = check_capacity("sedan", 2, 1); assert c["ok"] and not c["tight"], c
    c = check_capacity("sedan", 3, 1); assert c["ok"] and c["tight"], c       # 4 total = cap, tight
    c = check_capacity("sedan", 2, 2); assert c["ok"], c

    # Single-city Delhi -> Agra, Sedan, 2A+1C: base fare 20160, child free, PPPD 3400
    # subtotal 20160 -> GST@5% 1008 -> final committed 21168
    q = quote({"legs": [{"destination": "agra", "nights": 1}], "vehicle": "sedan",
               "adults": 2, "children": 1, "currency": "INR"})
    assert q["_inr"]["transport"] == 20160, q["_inr"]
    assert q["pppd"] == 3400 and q["child_transport_free"] is True, q
    assert q["_inr"]["subtotal_before_gst"] == 20160, q["_inr"]
    assert q["_inr"]["gst"] == 1008 and q["_inr"]["final_committed"] == 21168, q["_inr"]

    # Extra night in Agra adds one Sedan daily block (10200)
    q2 = quote({"legs": [{"destination": "agra", "nights": 2}], "vehicle": "sedan",
                "adults": 2, "children": 0, "currency": "INR"})
    assert q2["_inr"]["transport"] == 20160 + 10200, q2["_inr"]

    # Multi-city Delhi -> Agra -> Jaipur -> Delhi, Sedan, standard nights, known leg km
    #   first: 60% x Agra base 20160 = 12096
    #   Agra->Jaipur: actual 240 -> billable max(315,252)=315 x Jaipur sector
    #   Jaipur->Delhi: actual 280 -> billable max(315,294)=315 x Jaipur sector
    jaipur_sector = DEST["jaipur"]["vehicles"]["sedan"]["sector_rate"]
    jn = DEST["jaipur"]["nights"]; an = DEST["agra"]["nights"]
    q3 = quote({"legs": [{"destination": "agra", "nights": an, "in_km": 240},
                         {"destination": "jaipur", "nights": jn, "in_km": 240, "return_km": 280}],
                "vehicle": "sedan", "adults": 2, "children": 0, "currency": "INR"})
    exp = round(0.60*20160) + round(315*jaipur_sector) + round(315*jaipur_sector)
    assert q3["_inr"]["transport"] == exp, (q3["_inr"]["transport"], exp)
    assert q3["pppd"] > 0, q3
    # one extra night in Jaipur adds exactly one Jaipur daily block
    jblock = DEST["jaipur"]["vehicles"]["sedan"]["daily_block"]
    q3b = quote({"legs": [{"destination": "agra", "nights": an, "in_km": 240},
                          {"destination": "jaipur", "nights": jn+1, "in_km": 240, "return_km": 280}],
                 "vehicle": "sedan", "adults": 2, "children": 0, "currency": "INR"})
    assert q3b["_inr"]["transport"] == exp + jblock, (q3b["_inr"]["transport"], exp, jblock)

    # Jodhpur sector-rate sanity vs rulebook (41736/1302 ~ 32.06)
    js = DEST["jodhpur"]["vehicles"]["sedan"]
    assert abs(js["sector_rate"] - js["base_fare"]/DEST["jodhpur"]["roundtrip_km"]) < 0.1

    # Monuments: Taj + Agra Fort for 2 adults, priced from whatever the data says
    # (v2 foreigner ticket, or v5 sell price) — derive the expectation dynamically.
    taj = next(a for a in ATTRACTIONS if a["destination"] == "agra" and a["name"] == "Taj Mahal")
    fort = next(a for a in ATTRACTIONS if a["destination"] == "agra" and a["name"] == "Agra Fort")
    taj_unit = _addon_price(taj)[1]; fort_unit = _addon_price(fort)[1]
    exp_addons = _round((taj_unit + fort_unit) * 2)              # 2 adults; children not auto-charged
    m = quote({"legs": [{"destination": "agra", "nights": 1}], "vehicle": "sedan",
               "adults": 2, "children": 1, "currency": "INR",
               "monuments": [{"destination": "agra", "name": "Taj Mahal"},
                             {"destination": "agra", "name": "Agra Fort"}]})
    assert m["monuments_firm_total"] == exp_addons, (m["monuments_firm_total"], exp_addons)
    sub = 20160 + exp_addons
    assert m["_inr"]["subtotal_before_gst"] == sub, m["_inr"]
    assert m["_inr"]["final_committed"] == sub + round(sub*0.05), m["_inr"]

    # Currency conversion (USD): final committed converted at 85 INR/USD
    u = quote({"legs": [{"destination": "agra", "nights": 1}], "vehicle": "sedan",
               "adults": 2, "children": 0, "currency": "USD"})
    fc_inr = 20160 + round(20160*0.05)
    assert abs(u["final_committed_price"] - round(fc_inr/85.0, 2)) < 0.01, u["final_committed_price"]

    # Shortlist falls back gracefully on v2 (no theme columns) -> returns items
    sl = shortlist_addons("agra", themes=["heritage"], interests=["heritage visits"], limit=4)
    assert len(sl) <= 4 and all("name" in a for a in sl), sl

    print("ivy_pricing_engine_v2: all rulebook + GST self-tests passed.")
    print("  Agra single-city: transport %d | subtotal %d | GST %d | final %d" % (
        q["_inr"]["transport"], q["_inr"]["subtotal_before_gst"], q["_inr"]["gst"], q["_inr"]["final_committed"]))
    print("  Golden-Triangle Sedan transport INR:", q3["_inr"]["transport"], "| PPPD:", q3["pppd"])
    print("  flags -> child_transport_pct:", CHILD_TRANSPORT_PCT, "| gst_pct:", GST_PCT,
          "| v5 add-on columns:", DATA.get("_has_v5_addon_columns"))
