/* Build a srcset string for the suffixed responsive variants of an image.
   srcset('/x', 'avif', [640,960], 1600) →
   "/x-640.avif 640w, /x-960.avif 960w, /x.avif 1600w" */
export function srcset(base: string, ext: string, widths: number[], baseWidth?: number): string {
  const parts = widths.map((w) => `${base}-${w}.${ext} ${w}w`);
  if (baseWidth) parts.push(`${base}.${ext} ${baseWidth}w`);
  return parts.join(', ');
}
