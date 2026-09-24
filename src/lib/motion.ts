/**
 * Shared scroll-reveal presets so every section animates with the same
 * soft, unhurried rhythm instead of each component hand-rolling slightly
 * different durations/easing.
 */

// A gentle "ease-out" curve — decelerates smoothly with no bounce or snap,
// reads as calm rather than mechanical.
export const softEase = [0.22, 1, 0.36, 1] as const;

export const viewportOnce = { once: true, margin: "-80px" } as const;

export const fadeUp = (delay = 0, distance = 20) => ({
  initial: { opacity: 0, y: distance },
  whileInView: { opacity: 1, y: 0 },
  viewport: viewportOnce,
  transition: { duration: 0.75, delay, ease: softEase },
});

/** For grids of cards: a gentle stagger that resets per visual row. */
export const fadeUpStagger = (index: number, perRow = 3, base = 0.65) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: viewportOnce,
  transition: { duration: base, delay: (index % perRow) * 0.1, ease: softEase },
});
