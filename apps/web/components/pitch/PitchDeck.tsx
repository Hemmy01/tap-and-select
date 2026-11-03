"use client";

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { PrintButton } from "@/components/about/PrintButton";
import { actionForKey, progressSegments, slideFromHash } from "@/lib/pitch-nav";
import { SLIDES } from "./slides";

const W = 1280;
const H = 720;
const COUNT = SLIDES.length;
const ROUTE_COLOURS = ["var(--route-1)", "var(--route-2)", "var(--route-3)", "var(--route-4)"];

const noopSubscribe = () => () => {};

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** Scale of the 1280×720 canvas so it fits the window (letterboxed). */
function useCanvasScale(): number {
  return useSyncExternalStore(
    subscribeResize,
    () => Math.min(window.innerWidth / W, window.innerHeight / H),
    () => 1,
  );
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function ProgressBar({ slide }: { slide: number }) {
  return (
    <div className="flex h-1.5 gap-1" aria-hidden>
      {progressSegments(slide, COUNT).map((fill, i) => (
        <span key={i} className="h-full flex-1 overflow-hidden bg-line">
          <span
            className="block h-full transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${fill * 100}%`, background: ROUTE_COLOURS[i] }}
          />
        </span>
      ))}
    </div>
  );
}

// One slide per A4 landscape page, white, colours kept. The 1280×720 canvas is
// scaled to the page width (297 mm = 1123 px at 96 dpi) and centred.
const PRINT_SCALE = 1123 / W;
const PRINT_CSS = `
@page { size: A4 landscape; margin: 0 }
@media print {
  html, body { background: #fff }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact }
}`;

function PrintPage({ label, number, children }: { label: string; number?: number; children: ReactNode }) {
  return (
    <section
      className="flex items-center justify-center overflow-hidden bg-white [break-after:page]"
      style={{ width: "297mm", height: "209.5mm" }}
      aria-label={label}
    >
      <div style={{ width: W * PRINT_SCALE, height: H * PRINT_SCALE }}>
        <div className="relative bg-white" style={{ width: W, height: H, transform: `scale(${PRINT_SCALE})`, transformOrigin: "top left" }}>
          {children}
          {number ? (
            <span className="num absolute right-16 bottom-5 text-[16px] text-muted">
              {String(number).padStart(2, "0")} / {COUNT}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Every slide, one per page: /pitch?print=1 or the browser's Print. */
function PrintDeck() {
  return (
    <div className="bg-white">
      {SLIDES.map((slide, i) => (
        <PrintPage key={slide.title} label={`Slide ${i + 1}: ${slide.title}`} number={i + 1}>
          {slide.body}
        </PrintPage>
      ))}
    </div>
  );
}

function Presenter() {
  const scale = useCanvasScale();
  const slide = useSyncExternalStore(
    subscribeHash,
    () => slideFromHash(window.location.hash, COUNT),
    () => 1,
  );

  const go = useCallback((n: number) => {
    // replaceState keeps Back for leaving the deck; dispatch so the hash store updates.
    history.replaceState(null, "", `#${n}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const action = actionForKey(e.key, slideFromHash(window.location.hash, COUNT), COUNT);
      if (!action) return;
      e.preventDefault();
      if (action.type === "go") go(action.slide);
      else if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen().catch(() => {});
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const current = SLIDES[slide - 1];

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-ink">
      <div
        className="relative shrink-0 overflow-hidden bg-paper"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        <div className="absolute inset-x-0 top-0 z-10">
          <ProgressBar slide={slide} />
        </div>
        <section
          key={slide}
          className="h-full motion-safe:animate-[slide-in_200ms_ease-out]"
          aria-roledescription="slide"
          aria-label={`Slide ${slide} of ${COUNT}: ${current.title}`}
        >
          {current.body}
        </section>
        <span className="num absolute right-16 bottom-5 text-[16px] text-muted">
          {String(slide).padStart(2, "0")} / {COUNT}
        </span>
        <div className="absolute bottom-3 left-16 flex items-center gap-4">
          <PrintButton />
          <span className="text-[14px] text-muted">← → move · F fullscreen</span>
        </div>
      </div>

      <nav className="sr-only" aria-label="Slides">
        <button type="button" onClick={() => go(Math.max(slide - 1, 1))}>
          Previous slide
        </button>
        <button type="button" onClick={() => go(Math.min(slide + 1, COUNT))}>
          Next slide
        </button>
      </nav>
    </div>
  );
}

export function PitchDeck() {
  const print = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("print") === "1",
    () => false,
  );
  // The print pages are always in the document, so Cmd/Ctrl+P on the presenter prints them too.
  return (
    <>
      <style>{PRINT_CSS}</style>
      {print ? null : (
        <div className="print:hidden">
          <Presenter />
        </div>
      )}
      <div className={print ? undefined : "hidden print:block"}>
        <PrintDeck />
      </div>
    </>
  );
}
