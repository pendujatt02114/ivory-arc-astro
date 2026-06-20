<script lang="ts">
  // Each interest tile cross-fades through several photos so the section feels
  // alive and shows the variety of places a guest can travel. Captions describe
  // what's IN the photograph (subject + one line) — intentionally distinct from
  // the Destinations grid, which labels city + state.
  interface Frame {
    base: string; // optimized image pair path (no extension)
    subject: string;
    line: string;
    alt: string;
  }
  interface Item {
    key: string;
    label: string;
    href: string;
    frames: Frame[];
  }

  let { items }: { items: Item[] } = $props();

  // Active frame index per tile.
  let idx = $state(items.map(() => 0));
  let paused = $state(items.map(() => false));

  $effect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const handles: number[] = [];
    items.forEach((it, i) => {
      if (it.frames.length < 2) return;
      // Offset each tile so the grid doesn't flip all at once.
      const stagger = (i % 3) * 950 + Math.floor(i / 3) * 400;
      const startH = window.setTimeout(() => {
        const intH = window.setInterval(() => {
          if (!paused[i]) idx[i] = (idx[i] + 1) % it.frames.length;
        }, 4000);
        handles.push(intH);
      }, stagger);
      handles.push(startH);
    });

    return () => handles.forEach((h) => {
      clearTimeout(h);
      clearInterval(h);
    });
  });
</script>

<ul class="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
  {#each items as it, i (it.key)}
    <li>
      <a
        href={it.href}
        class="group relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-teal-900"
        onmouseenter={() => (paused[i] = true)}
        onmouseleave={() => (paused[i] = false)}
        onfocusin={() => (paused[i] = true)}
        onfocusout={() => (paused[i] = false)}
        data-cta
        data-cta-target="nav"
        data-cta-location="interest_grid"
        data-cta-label={it.label}
      >
        {#each it.frames as f, fi}
          <div
            class="absolute inset-0 transition-opacity duration-700 ease-out"
            style="opacity: {idx[i] === fi ? 1 : 0}"
            aria-hidden={idx[i] === fi ? 'false' : 'true'}
          >
            <picture class="block h-full w-full">
              <source srcset={`${f.base}.avif`} type="image/avif" />
              <source srcset={`${f.base}.webp`} type="image/webp" />
              <img
                src={`${f.base}.webp`}
                alt={f.alt}
                width="800"
                height="1000"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
            </picture>
            <span
              class="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-900/90 via-teal-900/15 to-transparent"
            ></span>
            <div class="absolute inset-x-0 bottom-0 p-4">
              <h3 class="font-display text-lg !text-ivory">{f.subject}</h3>
              <p class="mt-0.5 text-xs text-ivory/85">{f.line}</p>
            </div>
          </div>
        {/each}

        <span
          class="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/45 px-3 py-1 text-[0.64rem] font-medium uppercase tracking-[0.16em] text-ivory backdrop-blur-sm"
        >
          {it.label}
        </span>
      </a>
    </li>
  {/each}
</ul>
