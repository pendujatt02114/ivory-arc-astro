/*
  Thin client analytics. Pushes events to window.dataLayer for a server-side GTM
  container (architecture §11/§12) — no third-party tags are loaded in the browser,
  which protects the performance budget and shrinks the consent surface.

  Tracking is declarative: any element with [data-cta] is tracked on click.
    data-cta-target   = estimator | ivy | specialist | nav | other
    data-cta-location = page area (hero, mobile_bar, header, footer, ...)
    data-cta-label    = optional explicit label (falls back to text content)
*/

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export function track(event: string, params: Record<string, unknown> = {}): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

function handleClick(e: MouseEvent): void {
  const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cta]');
  if (!el) return;
  const target = el.dataset.ctaTarget;
  const location = el.dataset.ctaLocation;
  const label = el.dataset.ctaLabel || el.textContent?.trim();
  if (target === 'ivy' || target === 'specialist') {
    track('whatsapp_click', { agent: target, context: location, label });
  } else {
    track('cta_click', { target, location, label });
  }
}

window.dataLayer = window.dataLayer || [];
document.addEventListener('click', handleClick);

export {};
