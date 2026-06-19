/*
  Client analytics → window.dataLayer (consumed by GTM container GTM-KMVMV6F6).
  No third-party tags are hardcoded here: GA4 + Meta Pixel fire as GTM tags
  triggered by these dataLayer events. `lead_captured` also mirrors to Meta CAPI
  (/api/capi) with a shared event_id so the Pixel "Lead" and the CAPI "Lead"
  deduplicate. No PII (name / email / phone) is ever sent.

  Declarative click tracking — any [data-cta] element is tracked on click:
    data-cta-target   = ivy | specialist | phone | email | estimator | nav | other
    data-cta-location = page area (hero, mobile_bar, header, footer, contact, ...)
    data-cta-label    = optional explicit label (falls back to text content)
*/
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    __iaTrackInit?: boolean;
  }
}

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

/*
  The single business conversion. Pushes `lead_captured` to the dataLayer
  (→ GA4 `lead_captured` + Meta Pixel `Lead` via GTM, both keyed by event_id)
  and mirrors the same event to Meta CAPI server-side for dedup + match quality.
  Returns the event_id so callers/tests can correlate.
*/
export function captureLead(params: Record<string, unknown> = {}): string {
  if (typeof window === 'undefined') return '';
  const id = newEventId();
  track('lead_captured', { event_id: id, ...params });
  try {
    const payload = JSON.stringify({
      event_id: id,
      event_name: 'Lead',
      event_source_url: location.href,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),
      custom_data: params,
    });
    fetch('/api/capi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* non-blocking: analytics must never break the handoff */
  }
  return id;
}

function handleClick(e: MouseEvent): void {
  const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cta]');
  if (!el) return;
  const target = el.dataset.ctaTarget;
  const location = el.dataset.ctaLocation;
  const label = el.dataset.ctaLabel || el.textContent?.trim();
  if (target === 'ivy' || target === 'specialist') track('whatsapp_click', { agent: target, location, label });
  else if (target === 'phone') track('phone_click', { location, label });
  else if (target === 'email') track('email_click', { location, label });
  else track('cta_click', { target, location, label });
}

// Attach exactly once, even if this module is bundled into multiple chunks
// (the global flag is shared via window) — prevents duplicate click events.
if (typeof window !== 'undefined' && !window.__iaTrackInit) {
  window.__iaTrackInit = true;
  window.dataLayer = window.dataLayer || [];
  document.addEventListener('click', handleClick);
}

export {};
