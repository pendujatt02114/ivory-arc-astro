"""
ivy_tools.py — the tools IVY (the LLM) can call.

Tool definitions (TOOL_SCHEMAS) are sent to Claude; dispatch() executes a call.
price_quote is the ONLY source of pricing and imports the deterministic engine.
Live integrations (Maps, Razorpay, leads, handoff) degrade gracefully to clear
stubs when their environment keys are absent, so the agent loop never crashes in
development.
"""
import json, requests
import ivy_config as cfg
import ivy_pricing_engine as engine
import ivy_nlu as nlu  # deterministic key validator (fail-closed guard before pricing)

# --------- schemas advertised to Claude ---------
TOOL_SCHEMAS = [
    {"name": "price_quote",
     "description": "The ONLY source of pricing (Master Prompt v3.0 model). Pass the journey and party; receive an itemised, deterministic quote: transport (Delhi-origin base fare for single-city; 60% first sector + sector-rate x billable-km for multi-city), selected add-ons priced from the workbook, hotels (+10%), then 5% GST at the very end. Never compute prices yourself. Only sheet destinations are priceable; anything else returns an error for you to hand to a human. Children are FREE for transport. For multi-city legs, fill in_km/return_km from maps_distance so billable km is accurate; if omitted the engine uses the 315 km minimum and flags it.",
     "input_schema": {"type": "object", "properties": {
         "legs": {"type": "array", "description": "Ordered cities AFTER Delhi. Each: destination (sheet key or plain name), nights, and actual road km: in_km = km INTO this city (first leg = from Delhi), return_km = km from the LAST city back to Delhi.",
                   "items": {"type": "object", "properties": {
                       "destination": {"type": "string"}, "nights": {"type": "integer"},
                       "in_km": {"type": "number"}, "return_km": {"type": "number"}}}},
         "vehicle": {"type": "string", "enum": ["sedan", "suv", "tempo", "highend"], "description": "Omit to auto-pick the smallest vehicle that seats the party (then offer an upgrade)."},
         "adults": {"type": "integer"}, "children": {"type": "integer"},
         "nationality": {"type": "string", "enum": ["foreign", "indian", "saarc"]},
         "currency": {"type": "string", "enum": ["INR", "USD", "EUR", "GBP"]},
         "monuments": {"type": "array", "description": "Selected add-ons to price. Each: {destination, name} exactly as listed by shortlist_addons.",
                       "items": {"type": "object", "properties": {"destination": {"type": "string"}, "name": {"type": "string"}}}},
         "hotel_cost_inr": {"type": "number", "description": "Live hotel cost (sum across cities) if the traveller wants Ivory Arc to book; engine adds 10%. Omit if self-arranged."}},
         "required": ["legs", "adults"]}},
    {"name": "shortlist_addons",
     "description": "Theme-led shortlist of optional experiences for ONE city, filtered by the traveller's chosen theme(s)/interests (never dump full city lists). Returns up to `limit` ranked items with their IVY sell price/status. Excursions are excluded unless include_excursions=true. Call this per city once you know the theme + interests, then present 3-5 to the traveller before pricing.",
     "input_schema": {"type": "object", "properties": {
         "destination": {"type": "string"},
         "themes": {"type": "array", "items": {"type": "string", "enum": ["heritage", "spirituality", "wildlife", "mountains", "food"]}},
         "buckets": {"type": "array", "items": {"type": "string"}, "description": "Experience buckets, e.g. 'Heritage Visits', 'Spiritual / Ritual', 'Wildlife / Safari', 'Trekking / Trails', 'Boating / Water Experiences', 'Museum / Culture'."},
         "interests": {"type": "array", "items": {"type": "string"}, "description": "Free interest tags, e.g. 'forts', 'temples', 'street food', 'safari'."},
         "limit": {"type": "integer", "description": "Default 5."},
         "include_excursions": {"type": "boolean"}},
         "required": ["destination"]}},
    {"name": "maps_distance",
     "description": "True road kilometres per leg for a custom route. Pass ordered points (place names or 'lat,lng'). Returns leg_km in order.",
     "input_schema": {"type": "object", "properties": {"points": {"type": "array", "items": {"type": "string"}}}, "required": ["points"]}},
    {"name": "maps_suggest",
     "description": "Famous places & eateries between two points, to offer as optional stops. Never auto-add them.",
     "input_schema": {"type": "object", "properties": {"from": {"type": "string"}, "to": {"type": "string"}}, "required": ["from", "to"]}},
    {"name": "hotel_search",
     "description": "Live hotel rates (Google Hotels via SerpAPI, through the Ivory Arc backend). Call when the traveller wants stays; then pass the returned representative_nightly_inr into price_quote's hotel.nightly. Never invent a rate.",
     "input_schema": {"type": "object", "properties": {
         "city": {"type": "string"}, "check_in": {"type": "string", "description": "YYYY-MM-DD"},
         "check_out": {"type": "string", "description": "YYYY-MM-DD"},
         "tier": {"type": "string", "enum": ["comfort", "premium", "luxury"]}}, "required": ["city", "check_in", "check_out", "tier"]}},
    {"name": "send_payment_link",
     "description": "Send the 10% commitment as a secure payment link to begin arrangements.",
     "input_schema": {"type": "object", "properties": {"amount_inr": {"type": "number"}, "traveller_name": {"type": "string"}, "wa_id": {"type": "string"}, "email": {"type": "string"}, "estimate_ref": {"type": "string"}}, "required": ["amount_inr"]}},
    {"name": "save_lead",
     "description": "Persist the lead to the Ivory Arc backend (Google Sheet + team email + customer email + a WhatsApp template to the owner's phone). Send rich fields so the team can follow up.",
     "input_schema": {"type": "object", "properties": {"wa_id": {"type": "string"}, "name": {"type": "string"}, "phone": {"type": "string"}, "email": {"type": "string"},
         "score": {"type": "string", "enum": ["hot", "warm", "research"]}, "segment": {"type": "string"},
         "destination": {"type": "string"}, "custom_route": {"type": "string"}, "estimate_total": {"type": "string"},
         "start_date": {"type": "string"}, "end_date": {"type": "string"}, "nights": {"type": "string"},
         "group_size": {"type": "string"}, "hotel_selection": {"type": "string"}, "notes": {"type": "string"}}, "required": ["score"]}},
    {"name": "handoff_human",
     "description": "Escalate to a human Journey Manager. Use for payment disputes/refunds, booking confirmation, complaints, medical, accessibility, groups over 10, out-of-geography, or anything outside the knowledge base.",
     "input_schema": {"type": "object", "properties": {"reason": {"type": "string"}, "context": {"type": "string"}, "wa_id": {"type": "string"}}, "required": ["reason"]}},
    {"name": "update_state",
     "description": "Record or correct the QUALITATIVE facts you notice that rules can't extract, so they persist across turns and you never re-ask. Call it whenever the traveller reveals or changes any of these: their name; the language they want to converse in; a firm preference; a constraint; an objection; a decision they've made; a date or window; an open question you still owe them; the lead temperature; or a brief free-form note. Party size, nationality, destinations, duration, hotel tier, currency and the estimate are captured automatically from your messages and price_quote — do NOT send those here, and never send prices or itineraries. Send only the fields that changed; lists are appended and de-duplicated.",
     "input_schema": {"type": "object", "properties": {
         "traveller_name": {"type": "string", "description": "The traveller's name, once known."},
         "language": {"type": "string", "description": "The language the traveller prefers to converse in, e.g. 'Hindi', 'Spanish', 'English'. Set this once they choose, then reply in that language."},
         "lead_score": {"type": "string", "enum": ["hot", "warm", "research"], "description": "Internal lead temperature per the conversation library's rules."},
         "pause_followups": {"type": "boolean", "description": "Set true if the traveller asks to pause, stop messages, or come back later — suppresses proactive follow-up nudges (their own replies are never affected). Set false if they re-engage and want to continue."},
         "dates": {"type": "string", "description": "Travel dates/window as stated, e.g. '10-17 Nov 2026' or 'mid-March, ~8 nights'."},
         "preferences": {"type": "array", "items": {"type": "string"}, "description": "Firm likes, e.g. 'boutique heritage hotels', 'slow pace', 'vegetarian'."},
         "constraints": {"type": "array", "items": {"type": "string"}, "description": "Hard limits, e.g. 'no early starts', 'wheelchair access'."},
         "objections": {"type": "array", "items": {"type": "string"}, "description": "Concerns raised, e.g. 'worried about heat', 'price feels high'."},
         "decisions": {"type": "array", "items": {"type": "string"}, "description": "Choices made, e.g. 'skip Jaipur', 'add two nights in Udaipur'."},
         "open_questions": {"type": "array", "items": {"type": "string"}, "description": "Things still owed to the traveller, e.g. 'confirm arrival city'."},
         "notes": {"type": "string", "description": "Brief free-form context, e.g. 'celebrating 10th anniversary'."}}}},
]


# --------- implementations ---------
def validate_quote(q):
    """Deterministic pre-send guardrail on the ENGINE result (the LLM's prose is
    checked separately). Confirms the quote is internally consistent: subtotal + GST
    == final, totals positive, GST is the locked 5%. Returns {ok, issues, checks};
    attached to the quote so IVY (and the M1 interlock) see a green/red signal."""
    issues, checks = [], {}
    inr = (q or {}).get("_inr") if isinstance(q, dict) else None
    if not inr:
        return {"ok": False, "issues": ["no priced result"], "checks": {}}
    checks["totals_consistent"] = (inr["subtotal"] + inr["gst"]) == inr["final"]
    if not checks["totals_consistent"]:
        issues.append("subtotal + GST does not equal final committed price")
    checks["final_positive"] = inr["final"] > 0
    if not checks["final_positive"]:
        issues.append("non-positive final price")
    checks["gst_5pct"] = q.get("gst_pct") == 0.05
    if not checks["gst_5pct"]:
        issues.append("GST is not 5%")
    checks["gst_amount_ok"] = inr["gst"] == round(inr["subtotal"] * 0.05)
    if not checks["gst_amount_ok"]:
        issues.append("GST amount does not match 5% of subtotal")
    return {"ok": not issues, "issues": issues, "checks": checks}


def _normalise_legs(args):
    """Lowercase-key the leg destinations so the engine matches the sheet."""
    legs = []
    for l in (args.get("legs") or []):
        nl = dict(l)
        nl["destination"] = engine.dest_key(l.get("destination", ""))
        legs.append(nl)
    return legs


def _price_quote(args):
    # New profit-first model (Master Prompt v3.0). Only sheet destinations are
    # priceable; the engine returns an error for anything else (relay to a human).
    # Default the vehicle to the smallest that seats the party so a quote always
    # computes; IVY still surfaces it as a confirm/upgrade choice.
    args = dict(args)
    args["legs"] = _normalise_legs(args)
    if args.get("monuments"):
        args["monuments"] = [{"destination": engine.dest_key(m.get("destination", "")),
                              "name": m.get("name", "")} for m in args["monuments"]]
    if not args.get("vehicle"):
        rec = engine.recommend_vehicle(int(args.get("adults") or 0), int(args.get("children") or 0))
        if rec:
            args["vehicle"] = rec
    try:
        q = engine.quote(args)
        if isinstance(q, dict) and "error" not in q:
            q["_validation"] = validate_quote(q)
        return q
    except Exception as e:
        return {"error": str(e), "note": "Unexpected pricing error — escalate to a human."}


def _shortlist_addons(args):
    try:
        return {"items": engine.shortlist_addons(
            args.get("destination", ""), themes=args.get("themes"), buckets=args.get("buckets"),
            interests=args.get("interests"), limit=int(args.get("limit") or 5),
            include_excursions=bool(args.get("include_excursions")))}
    except Exception as e:
        return {"error": str(e)}


def _maps_distance(args):
    points = args.get("points", [])
    if not cfg.MAPS_SERVER_KEY:
        return {"stub": True, "note": "MAPS_SERVER_KEY not set; wire Google Directions in production.",
                "leg_km": [None] * max(len(points) - 1, 0)}
    legs = []
    for a, b in zip(points, points[1:]):
        r = requests.get("https://maps.googleapis.com/maps/api/directions/json",
                         params={"origin": a, "destination": b, "key": cfg.MAPS_SERVER_KEY}, timeout=15).json()
        try:
            metres = r["routes"][0]["legs"][0]["distance"]["value"]
            legs.append(round(metres / 1000.0, 1))
        except (KeyError, IndexError):
            legs.append(None)
    return {"leg_km": legs}


def _maps_suggest(args):
    a, b = args.get("from"), args.get("to")
    if not cfg.MAPS_SERVER_KEY:
        return {"stub": True, "note": "MAPS_SERVER_KEY not set; wire Google Places along-route in production.", "suggestions": []}
    # production: sample the Directions polyline and run Places Nearby/Text Search along the corridor.
    q = "tourist attractions and famous eateries between %s and %s" % (a, b)
    r = requests.get("https://maps.googleapis.com/maps/api/place/textsearch/json",
                     params={"query": q, "key": cfg.MAPS_SERVER_KEY}, timeout=15).json()
    out = [{"name": p.get("name"), "rating": p.get("rating")} for p in r.get("results", [])[:5]]
    return {"suggestions": out}


def _geocode(place):
    """Best-effort (lat, lng) for a free-text place via Google Geocoding (server
    key), biased to India. Used by the proximity pricing rule for places not in
    the offline gazetteer. Returns None when the key is absent or the place
    can't be geocoded — and None makes the rule hand off to a human."""
    if not cfg.MAPS_SERVER_KEY or not place:
        return None
    try:
        r = requests.get("https://maps.googleapis.com/maps/api/geocode/json",
                         params={"address": str(place) + ", North India",
                                 "region": "in", "components": "country:IN",
                                 "key": cfg.MAPS_SERVER_KEY}, timeout=15).json()
        loc = r["results"][0]["geometry"]["location"]
        return (loc["lat"], loc["lng"])
    except Exception:
        return None


def _send_payment_link(args):
    amount = int(round(args["amount_inr"]))
    # Preferred: Apps Script creates the link, so the Razorpay secret never leaves your backend.
    if cfg.APPS_SCRIPT_URL:
        payload = {"action": "createPaymentLink", "inrAmount": amount,
                   "name": args.get("traveller_name", ""), "phone": args.get("wa_id", ""),
                   "email": args.get("email", ""), "estimateRef": args.get("estimate_ref", "")}
        try:
            r = requests.post(cfg.APPS_SCRIPT_URL, data=json.dumps(payload),
                              headers={"Content-Type": "text/plain"}, timeout=20).json()
            if r.get("success"):
                return {"link": r.get("link"), "amount_inr": amount, "id": r.get("id")}
            return {"error": r.get("error", "payment link failed"), "note": "Add the createPaymentLink action to Code.gs."}
        except Exception as e:
            return {"error": str(e)}
    # Fallback: direct Razorpay (only if you choose to give IVY the keys instead).
    if not (cfg.RAZORPAY_KEY_ID and cfg.RAZORPAY_KEY_SECRET):
        return {"stub": True, "note": "Set APPS_SCRIPT_URL (preferred) or RAZORPAY_* keys.",
                "link": "https://rzp.io/i/ivoryarc-demo", "amount_inr": amount}
    r = requests.post("https://api.razorpay.com/v1/payment_links",
                      auth=(cfg.RAZORPAY_KEY_ID, cfg.RAZORPAY_KEY_SECRET),
                      json={"amount": amount * 100, "currency": "INR",
                            "description": "Ivory Arc Travels — 10% journey commitment",
                            "customer": {"name": args.get("traveller_name", "")},
                            "notify": {"sms": False, "email": False}, "reminder_enable": True}, timeout=20).json()
    return {"link": r.get("short_url"), "amount_inr": amount, "id": r.get("id")}


def _hotel_search(args):
    """Live Google Hotels rates via SerpAPI, served by the Apps Script backend."""
    if not cfg.APPS_SCRIPT_URL:
        return {"stub": True, "note": "APPS_SCRIPT_URL not set; wire the Ivory Arc backend.", "representative_nightly_inr": None}
    star = {"comfort": 3, "premium": 4, "luxury": 5}.get(args.get("tier", "premium"), 4)
    base = {"city": args.get("city", ""), "ci": args.get("check_in", ""), "co": args.get("check_out", "")}
    def _fetch(action):
        return requests.get(cfg.APPS_SCRIPT_URL, params=dict(base, action=action), timeout=30).json()
    try:
        data = _fetch("hotelsjson")          # permanent route (Code.gs addition)
        if "properties" not in data:          # alias not added yet -> fall back to the diagnostic route
            data = _fetch("hotelstest")
    except Exception as e:
        return {"error": str(e)}
    props = data.get("properties", [])
    def nightly_of(p):
        return (p.get("rate_per_night") or {}).get("extracted_lowest") or 0
    in_class = [p for p in props if (p.get("extracted_hotel_class") or 0) == star and nightly_of(p) > 0]
    pool = in_class or [p for p in props if nightly_of(p) > 0]
    rep = None
    if pool:
        vals = sorted(nightly_of(p) for p in pool)
        rep = vals[len(vals) // 2]  # median nightly for the tier
    options = [{"name": p.get("name"), "class": p.get("extracted_hotel_class"), "rating": p.get("overall_rating"), "nightly_inr": nightly_of(p)} for p in pool[:6]]
    return {"city": args.get("city", ""), "tier": args.get("tier", "premium"),
            "representative_nightly_inr": rep, "options": options,
            "note": "Pass representative_nightly_inr into price_quote hotel.nightly. Live cost + 10% coordination is applied by the engine."}


def _save_lead(args):
    """Route to the Apps Script lead endpoint -> Sheet + team email + customer email + WhatsApp template to the owner."""
    if not cfg.APPS_SCRIPT_URL:
        return {"stub": True, "note": "APPS_SCRIPT_URL not set; lead logged locally.", "lead": args}
    payload = {"action": "lead",
               "name": args.get("name", ""), "phone": args.get("phone") or args.get("wa_id", ""),
               "email": args.get("email", ""), "destination": args.get("destination", ""),
               "customRoute": args.get("custom_route", ""), "estimateTotal": args.get("estimate_total", ""),
               "tourStartDate": args.get("start_date", ""), "tourEndDate": args.get("end_date", ""),
               "nights": args.get("nights", ""), "groupSize": args.get("group_size", ""),
               "hotelSelection": args.get("hotel_selection", ""), "travellingAs": args.get("segment", ""),
               "occasions": args.get("notes", ""), "source": "IVY WhatsApp concierge"}
    try:
        r = requests.post(cfg.APPS_SCRIPT_URL, data=json.dumps(payload),
                          headers={"Content-Type": "text/plain"}, timeout=20)  # text/plain = "simple" request, per backend design
        return {"saved": True, "backend_response": r.text[:300]}
    except Exception as e:
        return {"saved": False, "error": str(e)}


def _handoff_human(args):
    payload = {"event": "handoff", **args}
    if cfg.HANDOFF_WEBHOOK:
        try:
            requests.post(cfg.HANDOFF_WEBHOOK, json=payload, timeout=10)
        except Exception:
            pass
    return {"handed_off": True, "reason": args.get("reason")}


def fetch_warm_brief(ref=None, wa_id=None):
    """Pull the structured estimator brief the website stored via warmLead
    (Apps Script action=getLead). Looks up by ref (preferred) or wa_id. Returns
    {"ref","brief"} on a hit, else None. Network/format failures degrade to None
    so the warm conversation always continues (text fallback)."""
    if not cfg.APPS_SCRIPT_URL or (not ref and not wa_id):
        return None
    params = {"action": "getLead"}
    if ref:
        params["ref"] = ref
    if wa_id:
        params["wa_id"] = wa_id
    try:
        data = requests.get(cfg.APPS_SCRIPT_URL, params=params, timeout=20).json()
    except Exception:
        return None
    if isinstance(data, dict) and data.get("found") and isinstance(data.get("brief"), dict):
        return {"ref": data.get("ref"), "brief": data["brief"]}
    return None


def notify_team(payload):
    """Fire the internal warm/cold-transfer alert: email to hello@ivoryarctravels.com
    + WhatsApp to the team number, carrying the estimate number, the customer's
    name + phone, the source (warm/cold) and the trip brief. Server-invoked (NOT a
    model tool) so the alert is guaranteed by the runtime the moment a lead lands,
    not dependent on the model remembering. Preferred path is the Apps Script
    backend (which holds the email + WhatsApp-template credentials); the alert
    targets are passed explicitly so routing is overridable. Best-effort and fully
    guarded — a notification failure must never break the customer reply.

    Apps Script (Code.gs) should implement action "transferAlert": email
    `alertEmail` and send a WhatsApp template to `alertWhatsapp` with these fields.
    """
    body = {"action": "transferAlert",
            "alertEmail": cfg.TEAM_ALERT_EMAIL, "alertWhatsapp": cfg.TEAM_ALERT_WHATSAPP,
            "source": payload.get("source", ""), "estimateRef": payload.get("estimate_ref", ""),
            "name": payload.get("name", ""), "phone": payload.get("phone", ""),
            "stage": payload.get("stage", ""), "brief": payload.get("brief", "")}
    if getattr(cfg, "ALERT_TOKEN", ""):
        body["token"] = cfg.ALERT_TOKEN
    if cfg.APPS_SCRIPT_URL:
        try:
            r = requests.post(cfg.APPS_SCRIPT_URL, data=json.dumps(body),
                              headers={"Content-Type": "text/plain"}, timeout=20)
            return {"alerted": True, "backend_response": r.text[:200]}
        except Exception as e:
            return {"alerted": False, "error": str(e)}
    if cfg.HANDOFF_WEBHOOK:
        try:
            requests.post(cfg.HANDOFF_WEBHOOK, json={"event": "transfer_alert", **body}, timeout=10)
            return {"alerted": True, "via": "handoff_webhook"}
        except Exception as e:
            return {"alerted": False, "error": str(e)}
    print("[notify_team stub] %s" % json.dumps(body, ensure_ascii=False))
    return {"alerted": False, "stub": True, "note": "Set APPS_SCRIPT_URL (preferred) or HANDOFF_WEBHOOK."}


_DISPATCH = {"price_quote": _price_quote, "maps_distance": _maps_distance, "maps_suggest": _maps_suggest,
             "hotel_search": _hotel_search, "send_payment_link": _send_payment_link, "save_lead": _save_lead,
             "handoff_human": _handoff_human}


def dispatch(name, args):
    fn = _DISPATCH.get(name)
    if not fn:
        return {"error": "unknown tool %s" % name}
    return fn(args or {})
