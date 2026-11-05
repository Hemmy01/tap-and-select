// Slide navigation for /pitch. Pure: the deck component owns the DOM.
// Slides are numbered from 1 in the URL hash (/pitch#5) and on screen.

/** The pitch's parts, in speaking order; the bar at the top marks the current one. */
export const PITCH_PARTS = [
  "Problem statement",
  "Our solution",
  "How it works",
  "Live demo",
  "Conclusion & future work",
  "Questions",
] as const;

export type PitchPart = (typeof PITCH_PARTS)[number];

export type DeckAction = { type: "go"; slide: number } | { type: "fullscreen" };

/** Clamp a slide number into 1..count. */
export function clampSlide(slide: number, count: number): number {
  if (!Number.isFinite(slide)) return 1;
  return Math.min(Math.max(Math.trunc(slide), 1), count);
}

/** "#5" → 5; anything else → 1. */
export function slideFromHash(hash: string, count: number): number {
  const match = /^#?(\d+)$/.exec(hash.trim());
  return match ? clampSlide(Number(match[1]), count) : 1;
}

/** What a key press means on the presenter, or null to let the browser have it. */
export function actionForKey(key: string, current: number, count: number): DeckAction | null {
  switch (key) {
    case "ArrowRight":
    case "PageDown":
    case " ":
      return { type: "go", slide: clampSlide(current + 1, count) };
    case "ArrowLeft":
    case "PageUp":
      return { type: "go", slide: clampSlide(current - 1, count) };
    case "Home":
      return { type: "go", slide: 1 };
    case "End":
      return { type: "go", slide: count };
    case "f":
    case "F":
      return { type: "fullscreen" };
    default:
      return null;
  }
}

/** A finger swipe on a touch screen: leftwards is the next slide (+1), rightwards the previous (-1). */
export function swipeStep(dx: number, dy: number, min = 50): 1 | -1 | null {
  if (Math.abs(dx) < min || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  return dx < 0 ? 1 : -1;
}
