"""
ivy_server.py — IVY runtime (FastAPI).

Flow:
  WhatsApp (or web QR -> WhatsApp) --> /webhook/whatsapp --> 200 (instant)
                                          └─ background task ─> Claude(agent loop) -> reply -> send

Delivery design (why warm transfers used to duplicate):
  Meta's WhatsApp Cloud API expects a FAST 200 from the webhook. The agent loop
  (up to MAX_TOOL_HOPS model calls + a long quote) takes far longer than that
  window, so Meta marked delivery failed and RETRIED the same inbound several
  times over minutes — each retry regenerating and resending the whole reply
  (the 5 duplicates). The fix has three parts, all below:
    1. ACK the webhook with 200 IMMEDIATELY; do the LLM work in a background task
       OFF the event loop (run_ivy is synchronous/blocking -> run_in_threadpool).
    2. DEDUPE by Meta's message id, so a retried delivery is ignored.
    3. A per-wa_id async lock, so two events for the same lead never generate
       concurrently (no interleaved/duplicate sends, no state races).
  Long replies are also length-safe (WhatsApp caps bodies at 4096 chars).

Run locally:
    pip install -r requirements.txt
    export ANTHROPIC_API_KEY=...  (plus WA_* , MAPS_SERVER_KEY, RAZORPAY_* as available)
    uvicorn ivy_server:app --reload --port 8000

Verification model: WhatsApp users are channel-verified (the BSP delivers their
number). Web/desktop users scan the QR at /web/login, which opens a WhatsApp chat
with IVY — so every conversation is WhatsApp-verified. No SMS OTP.
"""
import io, re, json, asyncio, collections, logging
import requests
from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse, HTMLResponse, StreamingResponse
from starlette.concurrency import run_in_threadpool
import anthropic

import ivy_config as cfg
import ivy_tools as tools
import ivy_nlu as nlu      # deterministic resolver: per-turn grounding hint for Claude
import ivy_state as st     # Customer State Object + rolling-summary helpers
import ivy_store as store  # sessions + inbound dedup + per-lead lock (Redis or in-memory)

log = logging.getLogger("ivy")
app = FastAPI(title="IVY — Ivory Arc Concierge")
client = anthropic.Anthropic(api_key=cfg.ANTHROPIC_API_KEY)

# Conversation memory, keyed by wa_id. Each entry is:
#   {"history": [...raw messages...], "state": <CustomerState>,
#    "summary": "<rolling brief>", "turns": <int since last summary>}
# Full history stays server-side for the summary call; only a short window of it
# is ever sent to the model. Use Redis/DB in production (this is in-memory).
# Sessions and inbound dedup now live in ivy_store (Redis-backed in production,
# in-memory fallback in dev/tests) so they survive restarts and are shared across
# workers. The per-wa_id asyncio lock below serialises turns within THIS process;
# a cross-worker lock (also in ivy_store) is taken in _process_text.
_LOCKS = {}                                  # wa_id -> asyncio.Lock (in-process serialize)
_TASKS = set()                               # strong refs to background tasks


def _session(wa_id):
    s = store.load_session(wa_id)
    if s is None:
        s = {"history": [], "state": st.new_state(wa_id), "summary": "", "turns": 0}
        store.save_session(wa_id, s)
    return s


def _seen_once(mid):
    """True the FIRST time a message id is seen (on ANY worker); False for a retry.
    Backed by ivy_store, so a retried delivery is dropped even across workers and
    after a restart (Redis), bounded in memory otherwise."""
    return store.seen_once(mid)


def _lock(wa_id):
    lk = _LOCKS.get(wa_id)
    if lk is None:
        lk = _LOCKS[wa_id] = asyncio.Lock()
    return lk


# ----------------------------- the agent loop -----------------------------
def _resolver_hint(f):
    """
    Turn the deterministic parse `f` (an NLU frame) into a short note appended to
    the system prompt FOR THIS TURN ONLY. It surfaces KB-grounded facts the model
    must not miss (aliases like 'Benares', typo'd place names, out-of-scope
    mentions, >10 groups), without ever overriding the model's own judgement.
    Returns '' when there's nothing high-signal to add.

    Deliberately omits resolve_text()'s `missing` list: that is only meaningful
    against accumulated state (now held in the Customer State Object), not a
    single stateless turn — a bare 'thanks!' must not report everything missing.
    """
    notes = []
    if f["destinations"]:
        notes.append("resolved destination keys: " + ", ".join(d["key"] for d in f["destinations"]))
    if f["entries"]:
        notes.append("implied monument entries: " + ", ".join(f["entries"]))
    if f["out_of_geography"]:
        notes.append("OUT OF GEOGRAPHY — not bookable, redirect/escalate: "
                     + ", ".join(f["out_of_geography"]))
    if f["not_in_portfolio"]:
        notes.append("NORTH INDIA BUT NOT IN PORTFOLIO — redirect/escalate: "
                     + ", ".join(f["not_in_portfolio"]))
    if f["unresolved"]:
        notes.append("possible misspelled place(s), confirm first: "
                     + "; ".join("%s -> did you mean %s?" % (u["input"], "/".join(u["suggestions"]))
                                 for u in f["unresolved"]))
    if f.get("group_over_10"):
        notes.append("GROUP OVER 10 — escalate to a human Journey Manager")
    if f.get("nationality_needs_confirm"):
        notes.append("NRI/OCI mentioned — confirm monument fee category")
    if f["currency"]:
        notes.append("display currency: " + f["currency"])
    if not notes:
        return ""
    return ("[resolver hint — deterministic, KB-grounded; you still decide. Never "
            "price a key outside the portfolio; clarify anything ambiguous]\n- "
            + "\n- ".join(notes))


def _trim(history, keep_turns):
    """Send only a recent window to the model; the Customer State Object and the
    rolling summary carry everything older, so this window is deliberately short.
    Keep the last `keep_turns` real user turns — a real user turn is a user
    message with plain string content (tool-result turns carry list content), so
    cutting at one of those boundaries never splits a tool_use from its
    tool_result and every kept exchange stays complete. Full history still lives
    in SESSIONS server-side for the summary call."""
    starts = [i for i, m in enumerate(history)
              if m["role"] == "user" and isinstance(m.get("content"), str)]
    if len(starts) <= keep_turns:
        return history
    return history[starts[-keep_turns]:]


def _maybe_summarize(sess):
    """Refresh the rolling brief every cfg.SUMMARY_EVERY_TURNS turns — the ONE
    place IVY spends model tokens on memory. Fully guarded: a hiccup here must
    never break the reply path. Uses a tiny, cacheable summariser prompt and a
    JSON-free recent-exchange input, so the call itself stays cheap."""
    sess["turns"] += 1
    if sess["turns"] < cfg.SUMMARY_EVERY_TURNS:
        return
    sess["turns"] = 0
    try:
        msgs = st.build_summary_messages(sess["summary"], sess["history"])
        r = client.messages.create(
            model=cfg.IVY_MODEL, max_tokens=cfg.SUMMARY_MAX_TOKENS,
            system=[{"type": "text", "text": st.SUMMARY_SYSTEM,
                     "cache_control": {"type": "ephemeral"}}],
            messages=msgs)
        brief = "".join(b.text for b in r.content if getattr(b, "type", None) == "text").strip()
        if brief:
            sess["summary"] = brief
    except Exception:
        pass  # keep the conversation going even if summarisation fails


_REF_RE = re.compile(r"\bIA-[A-Z0-9]{4}\b", re.I)


def _extract_ref(text):
    """Pull the warm-lead reference (e.g. IA-7K3M) from a hand-off message."""
    if not text:
        return None
    m = _REF_RE.search(text)
    return m.group(0).upper() if m else None


def _looks_like_warm_transfer(text):
    """Detect the estimator's warm-transfer hand-off. The NEW hand-off is a short
    ref line ("Hi IVY, this is X — ref IA-7K3M"); the LEGACY one named IVY and
    listed the brief as >=2 bullet lines. Either pattern (with the IVY mention)
    counts, without firing on a casual 'hi IVY'."""
    if not text:
        return False
    has_ivy = "ivy" in text.lower()
    if has_ivy and _extract_ref(text):
        return True
    bullets = sum(1 for ln in text.splitlines() if ln.lstrip().startswith(("•", "-", "*")))
    return has_ivy and bullets >= 2


def _brief_from_state(state, raw_text):
    """A compact, human-readable brief for the team alert: the structured facts we
    hold (route + nights, party, dates, focus) with the raw hand-off message
    appended for full fidelity."""
    j = state.get("journey") or {}
    p = state.get("party") or {}
    bits = []
    legs = j.get("legs") or [{"destination": d} for d in j.get("destinations", [])]
    route = ", ".join("%s%s" % (l.get("destination"), (" (%dd)" % l["days"]) if l.get("days") else "")
                      for l in legs if l.get("destination"))
    if route:
        bits.append("Route: " + route)
    if j.get("duration_days"):
        bits.append("Nights: %s" % j["duration_days"])
    if p.get("adults") is not None:
        who = "%s adult(s)" % p["adults"]
        if p.get("children"):
            who += " · %s child(ren)" % p["children"]
        if p.get("nationality"):
            who += " (%s)" % p["nationality"]
        bits.append("Travellers: " + who)
    if j.get("dates"):
        bits.append("Dates: %s" % j["dates"])
    if j.get("interests"):
        bits.append("Focus: " + ", ".join(j["interests"]))
    summary = " | ".join(bits)
    raw = (raw_text or "").strip()
    return (summary + "\n\n--- traveller's message ---\n" + raw) if (summary and raw) else (summary or raw)


def _maybe_fire_transfer_alert(sess, wa_id, user_text, is_first_turn):
    """Fire the internal team alert exactly once per lead: on the warm-transfer
    hand-off (first inbound matching the estimator template), or as soon as a cold
    lead becomes transfer-ready. Deterministic and server-driven — not dependent on
    the model remembering — and fully guarded so a notification failure never
    affects the customer reply. Runs inside run_ivy (already off the event loop and
    serialised by the per-lead lock). The estimate number is minted here so it is
    present in the alert even though no quote has run yet."""
    state = sess["state"]
    if st.alert_already_sent(state):
        return
    warm = bool(is_first_turn and _looks_like_warm_transfer(user_text))
    cold = bool((not warm) and st.transfer_ready(state))
    if not (warm or cold):
        return
    source = "warm" if warm else "cold"
    ref = st.ensure_estimate_number(state)       # mint the stable estimate number now (pre-quote)
    st.mark_alert_sent(state, source)            # mark BEFORE the network call -> fire-once even if it throws
    try:
        tools.notify_team({"source": source, "estimate_ref": ref,
                           "name": state["lead"].get("name", ""), "phone": wa_id,
                           "stage": "estimator hand-off received" if warm else "cold lead — transfer-ready",
                           "brief": _brief_from_state(state, user_text if warm else "")})
    except Exception:
        log.exception("transfer alert failed for %s", wa_id)


def run_ivy(wa_id, user_text):
    """Append the user's message, run Claude with tools until it produces text,
    and return the reply. Each turn we (1) fold the deterministic NLU frame into
    the Customer State Object for free, (2) send only the cached prefix + the
    traveller state + the rolling brief + the resolver hint + a short window of
    raw turns, and (3) refresh the brief every few turns.

    Synchronous by design (the Anthropic SDK calls block). The webhook NEVER calls
    this inline — it is run in a threadpool from a background task so the event
    loop stays free to ACK Meta instantly. The per-wa_id lock guarantees only one
    run_ivy executes for a given lead at a time, so SESSIONS access is serialised."""
    sess = _session(wa_id)
    history = sess["history"]
    is_first_turn = not any(m["role"] == "user" and isinstance(m.get("content"), str) for m in history)
    history.append({"role": "user", "content": user_text})

    # One deterministic parse, reused for both the state merge and the hint.
    frame = nlu.resolve_text(user_text)
    st.merge_frame(sess["state"], frame)          # zero model tokens

    # Structured warm-transfer brief: when the website hands off with a ref (or we
    # can match by wa_id), pull the full estimator brief from the backend (getLead)
    # and fold it into state so IVY greets by name and goes straight to the hotel
    # question — never re-discovering the trip. Degrades to the text path if absent.
    if is_first_turn and _looks_like_warm_transfer(user_text):
        fetched = tools.fetch_warm_brief(ref=_extract_ref(user_text), wa_id=wa_id)
        if fetched and fetched.get("brief"):
            st.merge_warm_brief(sess["state"], fetched["brief"])
            sess["warm_ref"] = fetched.get("ref") or _extract_ref(user_text)
            note = ("[structured estimator brief loaded — ref %s. The traveller's trip, "
                    "party, dates, currency and interests are in the traveller state above; "
                    "do NOT re-ask them. Greet by name, confirm the route in one line, then "
                    "ask their hotel/accommodation preference and continue the standard "
                    "hotel -> itemised total -> 5%% GST -> payment flow.]"
                    % (sess["warm_ref"] or "—"))
            sess["summary"] = note + (("\n\n" + sess["summary"]) if sess.get("summary") else "")

    _maybe_fire_transfer_alert(sess, wa_id, user_text, is_first_turn)  # warm/cold team alert (fires once)
    hint = _resolver_hint(frame)

    # Prompt-caching layout (prefix order: tools -> system -> messages):
    #   tools (static) + system[0]=SYSTEM_FULL (brand + KB + library, static) are
    #   the stable, cacheable prefix — one ephemeral breakpoint, shared across all
    #   conversations, read at 0.1x. Everything dynamic rides in later, UNCACHED
    #   blocks: the traveller state, then the rolling brief, then the turn hint.
    #   Only a short window of raw turns is sent, so per-turn input stays small.
    system_blocks = [{"type": "text", "text": cfg.SYSTEM_FULL,
                      "cache_control": {"type": "ephemeral"}}]
    context = st.render(sess["state"])
    if context:
        system_blocks.append({"type": "text", "text":
            "[traveller state — authoritative; do not re-ask what's already here]\n" + context})
    if sess["summary"]:
        system_blocks.append({"type": "text", "text":
            "[conversation so far — rolling brief]\n" + sess["summary"]})
    if hint:
        system_blocks.append({"type": "text", "text": hint})

    reply = "Let me bring in your Journey Manager to take this further."
    quote_invalid = None     # [issues] if the LAST price_quote this turn failed its guardrail
    for _ in range(cfg.MAX_TOOL_HOPS):
        resp = client.messages.create(
            model=cfg.IVY_MODEL, max_tokens=cfg.MAX_TOKENS,
            system=system_blocks, tools=tools.TOOL_SCHEMAS,
            messages=_trim(history, cfg.RECENT_TURNS))
        history.append({"role": "assistant", "content": resp.content})

        tool_uses = [b for b in resp.content if getattr(b, "type", None) == "tool_use"]
        if not tool_uses:
            reply = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text").strip() or "…"
            break

        results = []
        for tu in tool_uses:
            args = dict(tu.input or {})
            args.setdefault("wa_id", wa_id)
            if tu.name == "update_state":
                # Model-written qualitative deltas: applied to state, not dispatched.
                st.apply_update(sess["state"], args)
                out = {"ok": True, "stored": [k for k in args if k != "wa_id"]}
            else:
                out = tools.dispatch(tu.name, args)
                if tu.name == "price_quote":
                    st.merge_quote_call(sess["state"], args, out)   # persist legs + estimate (+ stable estimate no.)
                    if isinstance(out, dict):
                        v = out.get("_validation")
                        err = out.get("error")
                        # Capacity / input issues are recoverable IN-CONVERSATION (IVY
                        # recommends the right vehicle from capacity.recommend, or asks
                        # for a missing field) — they must NOT trigger a human handoff.
                        # Only a failed guardrail or an unexpected engine error blocks
                        # the quote from reaching the customer.
                        recoverable = err in ("exceeds_capacity", "bad_vehicle", "need_legs_and_adults")
                        if (err and not recoverable) or (v and not v.get("ok")):
                            quote_invalid = (v or {}).get("issues") or [err or "quote failed validation"]
                        elif v and v.get("ok"):
                            quote_invalid = None   # a clean re-quote supersedes an earlier bad one this turn
                elif tu.name == "send_payment_link" and isinstance(out, dict) and not out.get("error"):
                    st.lock_quote(sess["state"])                    # estimate locked once payment begins
                elif tu.name == "handoff_human":
                    st.set_human_takeover(sess["state"])            # a human now owns the lead -> stop nudges
            results.append({"type": "tool_result", "tool_use_id": tu.id,
                            "content": json.dumps(out, ensure_ascii=False)})
        history.append({"role": "user", "content": results})

    # Hard validation interlock: a quote that failed its deterministic guardrail
    # must NEVER reach the customer. Override the reply and escalate to a human.
    if quote_invalid is not None:
        log.warning("quote validation failed for %s: %s", wa_id, quote_invalid)
        try:
            tools.dispatch("handoff_human", {"reason": "quote_validation_failed",
                "context": ("; ".join(str(i) for i in quote_invalid))[:300], "wa_id": wa_id})
        except Exception:
            log.exception("escalation after invalid quote failed for %s", wa_id)
        st.set_human_takeover(sess["state"])
        reply = ("I want to be completely precise on the numbers here, so I'm bringing in your "
                 "Ivory Arc Journey Manager to finalise this with you — they'll be in touch on WhatsApp shortly.")

    st.note_interaction(sess["state"])   # stamp activity so the scheduler leaves this lead alone for now
    _maybe_summarize(sess)               # one small LLM call, every few turns; best-effort
    store.save_session(wa_id, sess)      # persist state + summary + history (Redis in prod, memory in dev)
    return reply


# ----------------------------- WhatsApp send (Meta Cloud API) -----------------------------
def _wa_post(to, body):
    """One Meta Cloud API text send. Returns True on a 2xx, False otherwise."""
    if not (cfg.WA_PROVIDER == "meta" and cfg.WA_TOKEN and cfg.WA_PHONE_NUMBER_ID):
        print(f"[wa_send stub -> {to}] {body}")     # dev: log instead of send
        return True
    try:
        r = requests.post(
            f"https://graph.facebook.com/v20.0/{cfg.WA_PHONE_NUMBER_ID}/messages",
            headers={"Authorization": f"Bearer {cfg.WA_TOKEN}"},
            json={"messaging_product": "whatsapp", "to": to, "type": "text",
                  "text": {"body": body, "preview_url": False}}, timeout=20)
        if r.status_code >= 300:
            log.warning("wa_send %s failed %s: %s", to, r.status_code, r.text[:300])
            return False
        return True
    except Exception as e:
        log.warning("wa_send %s exception: %s", to, e)
        return False


def _split_for_whatsapp(text, limit):
    """Keep replies to ONE message whenever possible; only split if the body
    exceeds WhatsApp's hard cap. Splits on paragraph, then line, then a hard cut —
    never mid-sentence if it can help it. Returns a list of <=limit-char parts."""
    text = (text or "").strip()
    if len(text) <= limit:
        return [text] if text else []
    parts, buf = [], ""
    for para in text.split("\n\n"):
        chunk = (buf + "\n\n" + para) if buf else para
        if len(chunk) <= limit:
            buf = chunk
            continue
        if buf:
            parts.append(buf); buf = ""
        if len(para) <= limit:
            buf = para
            continue
        # a single oversized paragraph: fall back to lines, then hard slices
        line_buf = ""
        for line in para.split("\n"):
            lc = (line_buf + "\n" + line) if line_buf else line
            if len(lc) <= limit:
                line_buf = lc
            else:
                if line_buf:
                    parts.append(line_buf); line_buf = ""
                while len(line) > limit:
                    parts.append(line[:limit]); line = line[limit:]
                line_buf = line
        if line_buf:
            buf = line_buf
    if buf:
        parts.append(buf)
    return parts


def _segments(text):
    """Split a reply into DELIBERATE messages on the split marker — the default is
    a single message. Empty pieces are dropped, and the number of segments is
    capped at cfg.MAX_WA_PARTS (overflow folded back into the last segment) so a
    reply can never fragment into spam, however many markers the model emits."""
    raw = (text or "").split(cfg.WA_SPLIT_MARKER)
    segs = [s.strip() for s in raw if s.strip()]
    if len(segs) > cfg.MAX_WA_PARTS:
        head, tail = segs[:cfg.MAX_WA_PARTS - 1], segs[cfg.MAX_WA_PARTS - 1:]
        segs = head + ["\n\n".join(tail)]
    return segs


def wa_send(to, text):
    """Send the reply as intended: ONE message by default, or the few deliberate
    parts the model marked with the split marker (capped at cfg.MAX_WA_PARTS). Each
    part then passes through the character-level safety splitter so no single
    message exceeds WhatsApp's hard cap. Sequential and in order; one wa_send == one
    logical reply (idempotent at the turn level — retries are de-duplicated
    upstream, so this never resends). Returns True only if every part sent."""
    sent_any, ok = False, True
    for seg in _segments(text):
        for part in _split_for_whatsapp(seg, cfg.WA_MAX_CHARS):
            sent_any = True
            ok = _wa_post(to, part) and ok
    return ok if sent_any else True


def send_followup(wa_id, text=None):
    """Send a PROACTIVE re-engagement nudge IF it passes the full suppression gate
    (human-takeover, paused, no-estimate, too-recent, daily cap of
    cfg.MAX_FOLLOWUPS_PER_DAY). Returns True if sent, False if suppressed. `text`
    defaults to a short, estimate-linked template. A scheduler decides WHEN to
    call this (see run_followups); replies to inbound messages never go through
    here and are never throttled."""
    sess = _session(wa_id)
    ok, reason = st.can_followup(sess["state"], cfg.MAX_FOLLOWUPS_PER_DAY,
                                 cfg.FOLLOWUP_COOLDOWN_HOURS, cfg.FOLLOWUP_QUIET_HOURS)
    if not ok:
        log.info("follow-up suppressed for %s (%s)", wa_id, reason)
        return False
    body = text or st.followup_text(sess["state"])
    if wa_send(wa_id, body):
        st.record_followup(sess["state"])
        st.note_interaction(sess["state"])
        store.save_session(wa_id, sess)
        return True
    return False


def run_followups():
    """Scan every known lead and nudge each one that passes the suppression gate.
    Driven by an external cron via POST /internal/run-followups. Best-effort per
    lead — one failure never blocks the rest."""
    sent = skipped = 0
    for wa_id, _sess in store.iter_sessions():
        try:
            if send_followup(wa_id):
                sent += 1
            else:
                skipped += 1
        except Exception:
            skipped += 1
            log.exception("follow-up run failed for %s", wa_id)
    log.info("follow-up run complete: sent=%d skipped=%d", sent, skipped)
    return {"sent": sent, "skipped": skipped}


# ----------------------------- background processing -----------------------------
async def _process_text(wa_id, text):
    """Generate and send exactly one reply for one inbound text turn. The asyncio
    lock serialises same-lead turns in THIS process; the store lock serialises
    them across workers; run_ivy + wa_send run OFF the event loop so the webhook's
    200 is never delayed by them."""
    try:
        async with _lock(wa_id):
            token = await run_in_threadpool(store.acquire_lock, wa_id)
            try:
                reply = await run_in_threadpool(run_ivy, wa_id, text)
                await run_in_threadpool(wa_send, wa_id, reply)
            finally:
                await run_in_threadpool(store.release_lock, wa_id, token)
    except Exception:
        log.exception("processing failed for %s", wa_id)


async def _process_nontext(wa_id):
    try:
        await run_in_threadpool(
            wa_send, wa_id, "I can read your message best as text — what are you dreaming of?")
    except Exception:
        log.exception("non-text reply failed for %s", wa_id)


def _spawn(coro):
    """Fire-and-forget a background coroutine, keeping a strong reference so it is
    not garbage-collected before it finishes."""
    task = asyncio.create_task(coro)
    _TASKS.add(task)
    task.add_done_callback(_TASKS.discard)


# ----------------------------- webhook: verify (GET) + receive (POST) -----------------------------
@app.get("/webhook/whatsapp")
def verify(request: Request):
    p = request.query_params
    if p.get("hub.mode") == "subscribe" and p.get("hub.verify_token") == cfg.WA_VERIFY_TOKEN:
        return PlainTextResponse(p.get("hub.challenge", ""))
    return PlainTextResponse("forbidden", status_code=403)


@app.post("/webhook/whatsapp")
async def receive(request: Request):
    # ACK FIRST: parse the payload, dedupe, schedule any real work in the
    # background, then return 200 immediately. We never run the agent loop inline,
    # so Meta always gets its fast 200 and never retries (the duplicate fix).
    try:
        body = await request.json()
    except Exception:
        return Response(status_code=200)
    try:
        if cfg.WA_PROVIDER == "meta":
            change = body["entry"][0]["changes"][0]["value"]
            for msg in change.get("messages", []):
                # Dedup on the event loop (single-threaded here) so a retried
                # delivery of the same id is dropped before any work is scheduled.
                if not _seen_once(msg.get("id")):
                    continue
                wa_id = msg.get("from")
                if not wa_id:
                    continue
                if msg.get("type") != "text":
                    _spawn(_process_nontext(wa_id))
                    continue
                _spawn(_process_text(wa_id, msg["text"]["body"]))
        # Gupshup/Twilio adapters: map their payload to (wa_id, text, id), apply
        # the same _seen_once() dedup, and _spawn(_process_text(...)).
    except (KeyError, IndexError):
        pass  # delivery receipts / status callbacks — ignore
    except Exception:
        log.exception("webhook parse error")
    return Response(status_code=200)


# ----------------------------- web QR -> WhatsApp login -----------------------------
@app.get("/web/login", response_class=HTMLResponse)
def web_login():
    num = cfg.WA_BUSINESS_NUMBER or "<your-number>"
    walink = f"https://wa.me/{num}?text=Namaste%20IVY"
    return f"""<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1">
<title>Talk to IVY</title><style>body{{font-family:system-ui;background:#0e4a47;color:#f3ead1;display:grid;place-items:center;height:100vh;margin:0;text-align:center}}
a{{color:#d8b659}} .card{{background:#fffefb;color:#22302d;padding:28px;border-radius:16px;max-width:360px}}</style></head>
<body><div class=card><h2>Meet IVY</h2><p>Scan to continue on WhatsApp — your number verifies you automatically. No OTP, no forms.</p>
<img alt="QR" width="220" height="220" src="/web/qr.png"><p><a href="{walink}">or tap to open WhatsApp</a></p></div></body></html>"""


@app.get("/web/qr.png")
def web_qr():
    num = cfg.WA_BUSINESS_NUMBER or "910000000000"
    walink = f"https://wa.me/{num}?text=Namaste%20IVY"
    try:
        import qrcode
        img = qrcode.make(walink)
        buf = io.BytesIO(); img.save(buf, format="PNG"); buf.seek(0)
        return StreamingResponse(buf, media_type="image/png")
    except Exception:
        return PlainTextResponse("Install 'qrcode[pil]' to render the QR, or use the wa.me link.", status_code=501)


@app.post("/internal/run-followups")
async def internal_run_followups(request: Request):
    """Cron entry point for the proactive follow-up scheduler. Guarded by a shared
    secret (cfg.FOLLOWUP_CRON_TOKEN) sent as ?token=... or the X-IVY-Cron header.
    Returns 403 until the token is configured — so NOTHING nudges until you
    deliberately turn the scheduler on by wiring a cron to this endpoint."""
    token = request.query_params.get("token") or request.headers.get("x-ivy-cron", "")
    if not cfg.FOLLOWUP_CRON_TOKEN or token != cfg.FOLLOWUP_CRON_TOKEN:
        return Response(status_code=403)
    return await run_in_threadpool(run_followups)


@app.get("/health")
def health():
    return {"ok": True, "model": cfg.IVY_MODEL,
            "destinations": len(cfg.KNOWLEDGE_BASE["destinations"]),
            "store": store.backend()}
