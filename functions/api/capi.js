/*
  Meta Conversions API relay (Cloudflare Pages Function → /api/capi).
  Mirrors the browser Pixel "Lead" using a shared event_id so Meta deduplicates
  Pixel + CAPI. Sends only non-contact match keys (IP, UA, _fbp, _fbc) and the
  business custom_data — never name/email/phone. Token comes from an env var.

  Required env var (Cloudflare Pages → Settings → Environment variables):
    META_CAPI_ACCESS_TOKEN   (secret; from Events Manager → Settings → Conversions API)
  Optional:
    META_PIXEL_ID            (defaults to the public pixel id below)
    META_TEST_EVENT_CODE     (for Events Manager "Test events" only; remove for prod)
*/
const DEFAULT_PIXEL_ID = '1507960651025642';
const GRAPH_VERSION = 'v21.0';

export async function onRequestPost(context) {
  const { request, env } = context;
  const json = (o, status = 200) =>
    new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
  try {
    const token = env.META_CAPI_ACCESS_TOKEN;
    if (!token) return json({ ok: false, error: 'capi_token_not_configured' });
    const pixelId = env.META_PIXEL_ID || DEFAULT_PIXEL_ID;
    const body = await request.json().catch(() => ({}));
    const { event_id, event_name = 'Lead', event_source_url, fbp, fbc, custom_data = {} } = body || {};
    if (!event_id) return json({ ok: false, error: 'missing_event_id' });

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id,
          action_source: 'website',
          event_source_url,
          user_data: {
            client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
            client_user_agent: request.headers.get('User-Agent') || undefined,
            ...(fbp ? { fbp } : {}),
            ...(fbc ? { fbc } : {}),
          },
          custom_data,
        },
      ],
      ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
    };

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const fb = await res.json().catch(() => ({}));
    return json({ ok: res.ok, fb });
  } catch (e) {
    return json({ ok: false, error: String(e) });
  }
}
