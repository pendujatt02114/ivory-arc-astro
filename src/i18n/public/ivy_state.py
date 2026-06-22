"""
ivy_state.py — the Customer State Object for IVY.

A compact, per-conversation record of everything known about a traveller. It is
the primary context the model is given (alongside a short rolling brief and the
most recent raw turns) instead of the full history — see the cost design.

Two ways it is filled, by design:
  * DETERMINISTICALLY, with zero model cost — `merge_frame` folds in each NLU
    frame (party, nationality, destinations, duration, interests, hotel tier,
    currency) and `merge_quote_call` folds in every price_quote (legs + the
    resulting estimate). Anything a rule can extract, a rule extracts.
  * Via the model, only for what rules cannot see — `apply_update` records the
    qualitative deltas IVY notices (preferences, constraints, objections,
    decisions, open questions, name, lead score) through the update_state tool.

`render` emits only the populated fields as compact JSON, keeping the dynamic
layer light. The store itself lives server-side (SESSIONS); this module is pure
data + merges and has no I/O, so it is trivially testable.
"""

import json, hashlib, time

_LIST_FIELDS = ("preferences", "constraints", "objections", "decisions", "open_questions")


def new_state(wa_id=""):
    """A fresh, empty state. `phone` is seeded from the channel-verified wa_id."""
    return {
        "language": "",     # preferred conversation language (e.g. "Hindi"); model-set via update_state
        "lead":    {"name": "", "phone": wa_id, "score": ""},
        "party":   {"adults": None, "children": None, "nationality": ""},
        "journey": {"destinations": [], "legs": [], "duration_days": None,
                    "dates": "", "interests": [], "hotel_tier": "", "currency": ""},
        "estimate": {},     # {amount, symbol, basis, total_inr} from the latest quote
        "itinerary": [],    # last priced legs: [{destination, days}, ...]
        "preferences": [], "constraints": [], "objections": [],
        "decisions": [], "open_questions": [], "notes": "",
        "followups": {"date": "", "count": 0, "last_interaction_ts": 0.0,
                      "paused": False, "human_takeover": False},   # proactive-nudge throttle + suppression
        # Estimate identity, stable across the whole lead lifecycle. `number` is
        # minted once (deterministically from the phone, so it survives restarts
        # and is identical across workers) and reused for every re-quote, hotel
        # change, follow-up and team alert. `rev` bumps when the customer changes
        # the trip and we re-price (shown as EST-...-R1). `trip_seq` lets a
        # genuinely new trip mint a new base number. `locked` flips at payment.
        # `alert_sent` records which transfer alert ("warm"/"cold") already fired,
        # so the team is notified exactly once. These are server-internal: render()
        # exposes only the customer-facing estimate number, never this bookkeeping.
        "quote_ref": {"number": "", "rev": 0, "trip_seq": 0, "locked": False, "alert_sent": ""},
    }


# ----------------------------- estimate number (stable, deterministic) -----------------------------
def _digits(s, n=4):
    """A stable n-digit string derived from `s` (sha1 -> decimal, first n digits)."""
    h = int(hashlib.sha1(str(s).encode("utf-8")).hexdigest(), 16)
    return str(h)[:n].rjust(n, "0")


def estimate_number(wa_id, trip_seq=0):
    """Deterministic estimate number for a lead: EST-AAAA-BBBB. A pure function of
    the phone (+ trip sequence), so the SAME number is produced on every worker
    and after any restart — no shared store needed for the base identity."""
    return "EST-%s-%s" % (_digits(wa_id, 4), _digits("%s|%d" % (wa_id, trip_seq), 4))


def ensure_estimate_number(state):
    """Mint the estimate number once (on the first quote OR the first transfer
    alert, whichever comes first) and keep it stable thereafter. Returns the
    full customer-facing ref (with any -Rn revision suffix)."""
    qr = state.setdefault("quote_ref", {"number": "", "rev": 0, "trip_seq": 0, "locked": False, "alert_sent": ""})
    if not qr.get("number"):
        qr["number"] = estimate_number(state["lead"].get("phone", ""), qr.get("trip_seq", 0))
    return full_estimate_ref(state)


def full_estimate_ref(state):
    """Customer-facing ref: 'EST-3242-9434', or 'EST-3242-9434-R1' once revised."""
    qr = state.get("quote_ref") or {}
    num = qr.get("number", "")
    if not num:
        return ""
    rev = qr.get("rev", 0)
    return num + ("-R%d" % rev if rev else "")


def start_new_trip(state):
    """Mint a NEW base estimate number for a genuinely different trip (resets the
    revision counter). Used only when the customer is clearly starting over."""
    qr = state.setdefault("quote_ref", {"number": "", "rev": 0, "trip_seq": 0, "locked": False, "alert_sent": ""})
    qr["trip_seq"] = qr.get("trip_seq", 0) + 1
    qr["rev"] = 0
    qr["locked"] = False
    qr["number"] = estimate_number(state["lead"].get("phone", ""), qr["trip_seq"])
    return full_estimate_ref(state)


def lock_quote(state):
    """Mark the estimate locked (the customer is moving to payment)."""
    state.setdefault("quote_ref", {})["locked"] = True
    return state


# ----------------------------- transfer-ready (cold lead) + alert bookkeeping -----------------------------
def transfer_ready(state):
    """True once a (cold) lead has given enough to hand to the team: party size,
    at least one destination, and either a duration or dates. Deterministic, so
    the server can fire the cold-transfer alert without relying on the model."""
    p = state.get("party") or {}
    j = state.get("journey") or {}
    has_party = p.get("adults") is not None
    has_dest = bool(j.get("destinations"))
    has_when = bool(j.get("duration_days") or j.get("dates"))
    return has_party and has_dest and has_when


def alert_already_sent(state):
    return bool((state.get("quote_ref") or {}).get("alert_sent"))


def mark_alert_sent(state, source):
    """Record that the warm/cold transfer alert fired, so it never double-sends."""
    state.setdefault("quote_ref", {})["alert_sent"] = source
    return state


def _add_unique(lst, items):
    for it in items:
        if it is not None and it != "" and it not in lst:
            lst.append(it)


# ----------------------------- deterministic merges -----------------------------
def merge_frame(state, frame):
    """Fold one NLU frame (the deterministic parse of a user turn) into state."""
    if not isinstance(frame, dict):
        return state
    g = frame.get("group") or {}
    if g.get("adults") is not None:
        state["party"]["adults"] = g["adults"]
    if g.get("children") is not None:
        state["party"]["children"] = g["children"]
    if frame.get("nationality"):
        state["party"]["nationality"] = frame["nationality"]
    if frame.get("currency"):
        state["journey"]["currency"] = frame["currency"]
    d = frame.get("duration") or {}
    if d.get("days"):
        state["journey"]["duration_days"] = d["days"]
    if frame.get("interests"):
        _add_unique(state["journey"]["interests"], frame["interests"])
    if frame.get("hotel_tier"):
        state["journey"]["hotel_tier"] = frame["hotel_tier"]
    if frame.get("destinations"):
        _add_unique(state["journey"]["destinations"],
                    [x.get("key") for x in frame["destinations"]])
    return state


def merge_warm_brief(state, brief):
    """Fold a structured warm-transfer brief (website estimator -> backend getLead)
    into the Customer State Object so IVY never re-asks what the traveller already
    gave the site. Pricing is NOT done here; IVY prices live afterwards."""
    if not isinstance(brief, dict):
        return state
    if brief.get("name"):
        state["lead"]["name"] = brief["name"]
    p = state["party"]
    if brief.get("adults") is not None:
        p["adults"] = brief["adults"]
    if brief.get("children") is not None:
        p["children"] = brief["children"]
    if brief.get("nationality"):
        p["nationality"] = brief["nationality"]
    j = state["journey"]
    if brief.get("currency"):
        j["currency"] = brief["currency"]
    if brief.get("start_date"):
        j["dates"] = brief["start_date"]
    legs = brief.get("legs") or []
    if legs:
        j["legs"] = [{"destination": l.get("destination"), "nights": l.get("nights")}
                     for l in legs if l.get("destination")]
        _add_unique(j["destinations"], [l["destination"] for l in j["legs"]])
        nights = [l.get("nights") for l in legs if isinstance(l.get("nights"), int)]
        if nights:
            j["duration_days"] = sum(nights)
    if brief.get("themes"):
        _add_unique(j["interests"], [str(t) for t in brief["themes"]])
    prefs = []
    if brief.get("start_city"):
        prefs.append("Start city: " + str(brief["start_city"]).title())
    if brief.get("occasion") and brief["occasion"] != "none":
        prefs.append("Occasion: " + str(brief["occasion"]))
    if brief.get("first_time_india") is not None:
        prefs.append("First trip to India" if brief["first_time_india"] else "Has visited India before")
    if brief.get("vehicle"):
        prefs.append("Vehicle preference: " + str(brief["vehicle"]))
    if brief.get("experience_prefs"):
        prefs.append("Experience interests: " + ", ".join(str(x) for x in brief["experience_prefs"]))
    if prefs:
        _add_unique(state["preferences"], prefs)
    addons = brief.get("addonsSelected") or []
    if addons:
        names = ", ".join("%s (%s)" % (a.get("name"), a.get("destination"))
                          for a in addons if a.get("name"))
        if names:
            note = "Pre-selected experiences from the site: " + names
            state["notes"] = (note if not state["notes"] else state["notes"] + " | " + note)[:600]
    return state


def merge_quote_call(state, args, result):
    """Fold a price_quote call (its payload + result) into state. Party-level
    facts are valid whatever the pricing outcome; legs/itinerary/estimate are
    recorded ONLY on a successful quote, so an unpriceable handoff leg never
    lands in the confirmed destinations — it becomes an open question instead."""
    args = args or {}
    if args.get("adults") is not None:
        state["party"]["adults"] = args["adults"]
    if args.get("children") is not None:
        state["party"]["children"] = args["children"]
    if args.get("nationality"):
        state["party"]["nationality"] = args["nationality"]
    if args.get("currency"):
        state["journey"]["currency"] = args["currency"]
    tier = (args.get("hotel") or {}).get("tier")
    if tier:
        state["journey"]["hotel_tier"] = tier

    if isinstance(result, dict):
        err = result.get("error")
        new_total = (result.get("_inr") or {}).get("final")
        if new_total is None:
            new_total = result.get("total_inr")          # tolerate legacy shape
        if result.get("handoff") or err in ("unpriceable_destinations", "exceeds_capacity", "bad_vehicle"):
            _add_unique(state["open_questions"],
                        ["leg/vehicle needs a change or a human — see quote result"])
        elif new_total is not None:
            # Snapshot the PREVIOUS quote before overwriting, to tell a fresh
            # estimate from a revision of the same trip.
            prev = state.get("estimate") or {}
            prev_had_number = bool(prev.get("number"))
            prev_total = prev.get("total_inr")
            prev_legs = state["journey"].get("legs")

            legs = args.get("legs")
            new_legs = ([{"destination": l.get("destination"),
                          "nights": l.get("nights", l.get("days"))} for l in legs]
                        if legs else prev_legs)
            if legs:
                state["journey"]["legs"] = new_legs
                _add_unique(state["journey"]["destinations"],
                            [l.get("destination") for l in legs])

            # Estimate identity: mint once, then keep stable. If the trip changed
            # (route or final total) AND a number was already shown, this is a
            # formal revision -> bump the -Rn suffix; otherwise the ref is unchanged.
            ensure_estimate_number(state)
            changed = prev_had_number and (
                (prev_total is not None and new_total != prev_total) or (new_legs != prev_legs))
            if changed:
                state["quote_ref"]["rev"] = state["quote_ref"].get("rev", 0) + 1

            sym = {"INR": "\u20b9", "USD": "$", "EUR": "\u20ac", "GBP": "\u00a3"}.get(
                result.get("currency", "INR"), "\u20b9")
            state["estimate"] = {"number": full_estimate_ref(state),
                                 "amount": result.get("final_committed_price"),
                                 "symbol": sym,
                                 "basis": ("min %s adults" % result.get("pricing_basis_adults")
                                           if result.get("pricing_basis_adults") else ""),
                                 "total_inr": new_total}
            if state["journey"]["legs"]:
                state["itinerary"] = [dict(l) for l in state["journey"]["legs"]]
    return state


# ----------------------------- model-supplied update -----------------------------
def apply_update(state, patch):
    """Apply an update_state patch (the qualitative deltas the model noticed)."""
    if not isinstance(patch, dict):
        return state
    if patch.get("traveller_name"):
        state["lead"]["name"] = patch["traveller_name"]
    if patch.get("language"):
        state["language"] = patch["language"]
    if patch.get("lead_score"):
        state["lead"]["score"] = patch["lead_score"]
    if patch.get("pause_followups") is not None:
        set_followup_pause(state, bool(patch["pause_followups"]))
    if patch.get("dates"):
        state["journey"]["dates"] = patch["dates"]
    for f in _LIST_FIELDS:
        v = patch.get(f)
        if v:
            items = v if isinstance(v, list) else [v]
            _add_unique(state[f], [str(x).strip() for x in items if str(x).strip()])
    if patch.get("notes"):
        note = str(patch["notes"]).strip()
        state["notes"] = (note if not state["notes"] else state["notes"] + " | " + note)[:600]
    return state


# ----------------------------- proactive follow-up throttle -----------------------------
# A "follow-up" is an UNPROMPTED message IVY initiates (a scheduled re-engagement
# nudge), NOT a reply to an inbound message. Replies are never counted or capped.
# These helpers cap nudges per lead per calendar day; any proactive sender MUST
# gate on followups_left_today() and call record_followup() after a successful send.
def _today():
    import datetime
    return datetime.date.today().isoformat()


def followups_left_today(state, cap):
    """How many proactive nudges this lead may still receive today (>=0)."""
    fu = state.get("followups") or {}
    used = fu.get("count", 0) if fu.get("date") == _today() else 0
    return max(cap - used, 0)


def record_followup(state):
    """Record that one proactive nudge was sent today (rolls over at midnight)."""
    today = _today()
    fu = state.get("followups")
    if not isinstance(fu, dict) or fu.get("date") != today:
        state["followups"] = {"date": today, "count": 1,
                              "last_interaction_ts": (state.get("followups") or {}).get("last_interaction_ts", 0.0),
                              "paused": (state.get("followups") or {}).get("paused", False),
                              "human_takeover": (state.get("followups") or {}).get("human_takeover", False)}
    else:
        fu["count"] = fu.get("count", 0) + 1
    return state


def _fu(state):
    fu = state.get("followups")
    if not isinstance(fu, dict):
        fu = state["followups"] = {"date": "", "count": 0, "last_interaction_ts": 0.0,
                                   "paused": False, "human_takeover": False}
    return fu


def note_interaction(state, ts=None):
    """Stamp the time of the latest interaction (inbound or our reply). The
    scheduler uses this to leave active and recently-contacted leads alone."""
    _fu(state)["last_interaction_ts"] = float(ts if ts is not None else time.time())
    return state


def set_followup_pause(state, paused=True):
    """The traveller asked to pause / come back later — stop proactive nudges."""
    _fu(state)["paused"] = bool(paused)
    return state


def set_human_takeover(state, taken=True):
    """A human Journey Manager has the lead — IVY must not proactively nudge."""
    _fu(state)["human_takeover"] = bool(taken)
    return state


def can_followup(state, cap, cooldown_hours, quiet_hours):
    """Full suppression gate for a PROACTIVE nudge. Returns (ok, reason). Blocks
    when a human has taken over, the traveller asked to pause, there is no
    estimate to nudge about, the lead was contacted/active too recently, or the
    daily cap is spent. Reactive replies never go through here."""
    fu = _fu(state)
    if fu.get("human_takeover"):
        return False, "human_takeover"
    if fu.get("paused"):
        return False, "paused"
    if not full_estimate_ref(state):
        return False, "no_estimate"
    last = fu.get("last_interaction_ts", 0.0)
    if not last:
        return False, "no_interaction_yet"
    elapsed_h = (time.time() - last) / 3600.0
    if elapsed_h < max(cooldown_hours, quiet_hours):
        return False, "too_recent"
    if followups_left_today(state, cap) <= 0:
        return False, "daily_cap_reached"
    return True, "ok"


def followup_text(state):
    """A short, estimate-linked nudge (deterministic template — no model call, so
    the scheduler stays cheap and predictable). A model-written, localised variant
    can be plugged in later via the scheduler's optional composer."""
    name = (state.get("lead") or {}).get("name") or "there"
    ref = full_estimate_ref(state)
    return ("Hi %s — just following up on your Ivory Arc estimate %s. "
            "Happy to adjust the hotels, nights or anything else whenever you're ready — "
            "shall I hold it for you?" % (name, ref))


# ----------------------------- render for the prompt -----------------------------
def _prune(o):
    if isinstance(o, dict):
        out = {}
        for k, v in o.items():
            pv = _prune(v)
            if pv not in (None, "", [], {}):
                out[k] = pv
        return out
    if isinstance(o, list):
        return [pv for pv in (_prune(x) for x in o) if pv not in (None, "", [], {})]
    return o


def render(state):
    """Compact JSON of only the populated fields ('' when nothing is known yet).
    Server-internal bookkeeping is never shown to the model: the follow-up
    throttle is dropped entirely, and quote_ref is collapsed to just the
    customer-facing estimate number (with its -Rn suffix) plus a `locked` flag —
    the trip-sequence and alert state stay server-side."""
    public = {k: v for k, v in state.items() if k not in ("followups", "quote_ref")}
    ref = full_estimate_ref(state)
    if ref:
        qr = state.get("quote_ref") or {}
        public["estimate_no"] = ref
        if qr.get("locked"):
            public["quote_locked"] = True
    pruned = _prune(public)
    if not pruned:
        return ""
    return json.dumps(pruned, ensure_ascii=False, separators=(",", ":"))


# ----------------------------- rolling summary (one small LLM call) -----------------------------
# The summary is the ONLY place IVY spends model tokens on memory. The server
# makes the API call with SUMMARY_SYSTEM (cacheable) + build_summary_messages();
# this module just assembles a tiny, JSON-free input from the recent text turns,
# so the summary call itself stays cheap.
SUMMARY_SYSTEM = (
    "You compress a luxury-travel sales chat into a compact rolling brief for an "
    "AI travel consultant. Output <=120 words of plain prose — no preamble, no "
    "lists. Keep only what shapes the next reply: decisions, itinerary changes, "
    "firm preferences and constraints, objections raised and how they were "
    "handled, and open questions. Omit pleasantries and anything already obvious "
    "from the structured state (names, party size, dates). If a previous brief is "
    "supplied, revise it in place rather than repeating it."
)


def _msg_text(m):
    """Plain text from a stored history message, whether its content is a string
    (user turn), a list of SDK content blocks (assistant turn), or a list of
    tool_result dicts (skipped — already captured in structured state)."""
    c = m.get("content")
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        parts = []
        for b in c:
            t = getattr(b, "type", None) if not isinstance(b, dict) else b.get("type")
            if t == "text":
                parts.append(getattr(b, "text", None) if not isinstance(b, dict) else b.get("text"))
        return " ".join(p for p in parts if p)
    return ""


def build_summary_messages(prev_summary, history, max_lines=24):
    """Cheap input for the summary call: previous brief + a plain-text rendering
    of the recent text turns. Never includes tool JSON or the cached prefix."""
    lines = []
    for m in history:
        txt = _msg_text(m)
        if txt:
            lines.append(("Traveller: " if m.get("role") == "user" else "IVY: ") + txt)
    convo = "\n".join(lines[-max_lines:])
    prior = ("Previous brief:\n%s\n\n" % prev_summary) if prev_summary else ""
    return [{"role": "user",
             "content": prior + "Recent exchange:\n" + convo + "\n\nWrite the updated brief."}]


# ----------------------------- self-test -----------------------------
if __name__ == "__main__":
    st = new_state("919812345678")
    merge_frame(st, {"group": {"adults": 2, "children": 1}, "nationality": "foreign",
                     "currency": "USD", "duration": {"days": 7, "nights": 6},
                     "interests": ["heritage", "food"], "hotel_tier": "premium",
                     "destinations": [{"key": "delhi"}, {"key": "agra"}]})
    assert st["party"]["adults"] == 2 and st["party"]["children"] == 1
    assert st["party"]["nationality"] == "foreign" and st["journey"]["currency"] == "USD"
    assert st["journey"]["duration_days"] == 7
    assert st["journey"]["destinations"] == ["delhi", "agra"]
    assert st["lead"]["phone"] == "919812345678"

    # second frame merges, doesn't duplicate
    merge_frame(st, {"destinations": [{"key": "agra"}, {"key": "jaipur"}],
                     "interests": ["food", "luxury"]})
    assert st["journey"]["destinations"] == ["delhi", "agra", "jaipur"]
    assert st["journey"]["interests"] == ["heritage", "food", "luxury"]

    # a quote fills legs + estimate
    merge_quote_call(st,
        {"legs": [{"destination": "delhi", "nights": 2}, {"destination": "agra", "nights": 1},
                  {"destination": "jaipur", "nights": 2}], "adults": 2, "children": 1,
         "nationality": "foreign", "currency": "USD", "hotel": {"tier": "premium"}},
        {"_inr": {"final": 250000}, "currency": "USD", "final_committed_price": 410,
         "pricing_basis_adults": 5})
    assert st["estimate"]["amount"] == 410 and st["estimate"]["symbol"] == "$"
    assert len(st["itinerary"]) == 3

    # a handoff result records an open question instead of an estimate
    merge_quote_call(st, {"legs": [{"destination": "spiti", "nights": 2}]},
                     {"handoff": True, "whatsapp": "+91 74550 37397"})
    assert any("human" in q for q in st["open_questions"])

    # model-supplied qualitative deltas
    apply_update(st, {"traveller_name": "Aarav", "lead_score": "hot", "language": "Hindi",
                      "preferences": ["boutique heritage hotels", "slow pace"],
                      "constraints": ["no early starts"], "objections": ["worried about heat"],
                      "decisions": ["skip Jaipur"], "open_questions": ["confirm anniversary date"],
                      "notes": "celebrating 10th anniversary"})
    assert st["lead"]["name"] == "Aarav" and st["lead"]["score"] == "hot"
    assert st["language"] == "Hindi"
    assert "slow pace" in st["preferences"] and "skip Jaipur" in st["decisions"]
    # lists append + dedupe across calls
    apply_update(st, {"preferences": ["slow pace", "vegetarian"]})
    assert st["preferences"].count("slow pace") == 1 and "vegetarian" in st["preferences"]

    r = render(st)
    assert r and "919812345678" in r and "Aarav" in r and "Hindi" in r and "spiti" not in r  # only populated fields
    assert json.loads(r)  # valid compact JSON

    # rolling-summary input assembly: text turns in, tool JSON out
    class _B:
        type = "text"; text = "That sounds wonderful."
    sm = build_summary_messages("earlier: chose Udaipur",
                                [{"role": "user", "content": "we love lakes"},
                                 {"role": "assistant", "content": [_B()]},
                                 {"role": "user", "content": [{"type": "tool_result", "content": "{}"}]}])
    sb = sm[0]["content"]
    assert "earlier: chose Udaipur" in sb and "Traveller: we love lakes" in sb
    assert "IVY: That sounds wonderful." in sb and "tool_result" not in sb

    # follow-up throttle: cap respected, rolls per day, render hides it
    fs = new_state("91999")
    assert followups_left_today(fs, 2) == 2
    record_followup(fs); assert followups_left_today(fs, 2) == 1
    record_followup(fs); assert followups_left_today(fs, 2) == 0
    assert "followups" not in render(fs)            # server-internal, never sent to model
    fs["followups"]["date"] = "2000-01-01"           # simulate a previous day
    assert followups_left_today(fs, 2) == 2          # resets at midnight

    # estimate number: deterministic, stable across re-quote, revises on change
    es = new_state("9198761111")
    assert full_estimate_ref(es) == ""                          # none until quoted
    q_args = {"legs": [{"destination": "agra", "days": 1}, {"destination": "jaipur", "days": 1}],
              "adults": 2, "nationality": "foreign", "currency": "INR"}
    merge_quote_call(es, q_args, {"total_inr": 100000, "headline": {"display": {"amount": 5, "symbol": "₹"}}})
    ref1 = es["estimate"]["number"]
    assert ref1.startswith("EST-") and ref1.count("-") == 2     # EST-AAAA-BBBB, no revision yet
    assert ref1 == estimate_number("9198761111")                # deterministic from phone
    # identical re-quote (same trip, same total) -> SAME ref, no revision
    merge_quote_call(es, q_args, {"total_inr": 100000, "headline": {"display": {"amount": 5, "symbol": "₹"}}})
    assert es["estimate"]["number"] == ref1, es["estimate"]["number"]
    # customer changes the trip (adds a leg, new total) -> SAME base, -R1
    q_args2 = {"legs": q_args["legs"] + [{"destination": "jodhpur", "days": 1}],
               "adults": 2, "nationality": "foreign", "currency": "INR"}
    merge_quote_call(es, q_args2, {"total_inr": 150000, "headline": {"display": {"amount": 6, "symbol": "₹"}}})
    assert es["estimate"]["number"] == ref1 + "-R1", es["estimate"]["number"]
    assert es["quote_ref"]["number"] == ref1                    # base number unchanged
    # the ref survives a "restart": a brand-new state for the same phone recomputes the same base
    assert estimate_number("9198761111") == ref1
    # render shows the customer-facing ref but hides trip_seq/alert_sent
    rr = render(es)
    assert ref1 + "-R1" in rr and "trip_seq" not in rr and "alert_sent" not in rr

    # transfer-ready gate (cold lead): needs party + destination + when
    cs = new_state("9198762222")
    assert not transfer_ready(cs)
    merge_frame(cs, {"group": {"adults": 2}, "destinations": [{"key": "delhi"}]})
    assert not transfer_ready(cs)                               # still no dates/duration
    merge_frame(cs, {"duration": {"days": 5}})
    assert transfer_ready(cs)                                   # now transfer-ready
    # alert bookkeeping fires once
    assert not alert_already_sent(cs)
    mark_alert_sent(cs, "cold"); assert alert_already_sent(cs)

    print("render bytes:", len(r))
    print("All ivy_state self-tests passed.")
