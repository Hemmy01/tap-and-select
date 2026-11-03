// The pitch as one story: Jack waits (hook), why (problem, gaps), the fix (solution,
// how it works), proof (demo, results), Jack boards (conclusion). Story slides are in
// Times New Roman; the "How it works" comic is kept exactly as it was. Each slide
// renders into a fixed 1280×720 canvas that the deck scales to the screen.

import Image from "next/image";
import type { ReactNode } from "react";
import { IdeaStoryboard } from "./IdeaStoryboard";
import { JourneyComic } from "./JourneyComic";
import { JackBoards, JackWaits, NobodySeesJack } from "./StoryPanels";
import { PITCH_SECTIONS, type PitchSection } from "@/lib/pitch-nav";
import { PITCH_NUMBERS as N, pitchValue } from "@/lib/pitch";
import { PITCH_REFERENCES, ReferenceLine, referenceYear, TEAM, WHAT_RUNS_WHERE } from "./content";

export interface Slide {
  title: string;
  body: ReactNode;
}

// ---------------------------------------------------------------------------
// Story slides: the title is the line you say, one visual, cited sources at the foot.
// ---------------------------------------------------------------------------

/** In-text citation, e.g. [1] or [1], [2]. */
function Ref({ n }: { n: number | readonly number[] }) {
  const list = typeof n === "number" ? [n] : n;
  return <span className="ml-1 align-baseline text-[18px] font-normal not-italic text-muted">[{list.join("], [")}]</span>;
}

/** Only the sources cited on this slide, short form (the full list is printed last). */
function SlideReferences({ ns }: { ns: readonly number[] }) {
  return (
    <p className="mt-4 border-t border-line pt-2 text-[18px] leading-snug text-muted">
      {PITCH_REFERENCES.filter((r) => ns.includes(r.n)).map((r, i) => (
        <span key={r.n}>
          {i > 0 ? " · " : null}[{r.n}] {r.author.replace(/\.$/, "")} ({referenceYear(r)}), <em>{r.title}</em>
        </span>
      ))}
    </p>
  );
}

function SerifSlide({ title, refs, children }: { title: ReactNode; refs?: readonly number[]; children: ReactNode }) {
  return (
    <div className="pitch-serif flex h-full flex-col px-16 pt-12 pb-14 text-ink">
      <h2 className="text-[44px] leading-[1.1]">{title}</h2>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">{children}</div>
      {refs ? <SlideReferences ns={refs} /> : null}
    </div>
  );
}

/** A comic panel from StoryPanels, framed like the other comics. */
function Panel({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-card border border-line bg-paper [&>svg]:block [&>svg]:w-full">
      {children}
      {label ? <figcaption className="border-t border-line bg-surface px-4 py-1.5 text-[20px] italic">{label}</figcaption> : null}
    </figure>
  );
}

function Tile({ value, children, className = "" }: { value: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-line bg-surface p-5 ${className}`}>
      <span className="block text-[52px] font-bold leading-none tabular-nums">{value}</span>
      <span className="mt-3 block text-[24px] leading-snug">{children}</span>
    </div>
  );
}

/** QR code for the public live board (public/pitch/live-qr.svg, made with `npx qrcode`). */
function LiveQr({ size }: { size: number }) {
  return (
    <Image
      src="/pitch/live-qr.svg"
      width={size}
      height={size}
      unoptimized
      alt="QR code: tap-and-select.vercel.app/live"
      className="rounded-md border border-line bg-white p-1"
    />
  );
}

const GAPS: readonly { gap: ReactNode; fix: string }[] = [
  {
    gap: (
      <>
        Schedules don&rsquo;t follow demand: off-peak buses leave nearly empty
        <Ref n={6} />
      </>
    ),
    fix: "Live demand at every stop",
  },
  {
    gap: (
      <>
        Tap&amp;Go only sees you once you&rsquo;re on the bus
        <Ref n={7} />
      </>
    ),
    fix: "Demand registered at the stop",
  },
  {
    gap: (
      <>
        Empty card = missed bus; no cash option
        <Ref n={5} />
      </>
    ),
    fix: "Balance check while waiting",
  },
  {
    gap: (
      <>
        No conductor: missed stops, no alerts
        <Ref n={8} />
      </>
    ),
    fix: "Driver sees who gets off next",
  },
];

const SUMMARY = [
  { label: "Problem", text: "Demand grows faster than buses, and nobody sees who is waiting." },
  { label: "Solution", text: "Every bus stop becomes as visible as a bus park." },
  { label: "Next", text: "A pilot at 2–3 stops on one route, real card readers, more Kinyarwanda voices." },
] as const;

const DEMO_STEPS = ["Tap card", "Say “Remera” or swipe", "Confirm", "Ticket", "HQ approves", "Bus drives", "Now boarding"];

// ---------------------------------------------------------------------------
// The "How it works" comic slide, unchanged from the previous deck.
// ---------------------------------------------------------------------------

/** "Problem · Solution · Tech · Conclusion", the current part marked in ink. */
function Outline({ current }: { current: PitchSection }) {
  return (
    <ol className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.12em]" aria-label="Pitch outline">
      {PITCH_SECTIONS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          {i > 0 ? <span aria-hidden className="text-muted">→</span> : null}
          <span
            className={s === current ? "border-b-2 border-ink pb-0.5 text-ink" : "text-muted"}
            aria-current={s === current ? "step" : undefined}
          >
            {s}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Frame({ section, title, children }: { section: PitchSection; title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col px-16 pt-12 pb-14">
      <Outline current={section} />
      <h2 className="mt-5 text-[52px] leading-[1.05]">{title}</h2>
      <div className="mt-8 min-h-0 flex-1">{children}</div>
    </div>
  );
}

export const SLIDES: readonly Slide[] = [
  // 1 Hook: meet Jack --------------------------------------------------------
  {
    title: "Meet Jack",
    body: (
      <SerifSlide title="Leaves work at 6 PM. Home after 9 PM." refs={[1]}>
        <div className="grid grid-cols-[520px_1fr] items-center gap-8">
          <Panel>
            <JackWaits />
          </Panel>
          <blockquote className="border-l-4 border-ink pl-6">
            <p className="text-[30px] italic leading-snug">
              &ldquo;I finish work at 6PM and immediately head to a bus stop, but I reach home after 9PM.&rdquo;
              <Ref n={1} />
            </p>
            <footer className="mt-3 text-[22px] text-muted">Jack Nsanzimana, Kanombe, Kigali (KT Press, 2022)</footer>
          </blockquote>
        </div>
        <p className="mt-6 text-[44px] font-bold leading-tight">The bus doesn&rsquo;t know Jack is waiting.</p>
        <p className="mt-auto text-[20px] text-muted">
          Tap&amp;Select · CMU-Africa Bridge Program 2026 · {TEAM.join(", ")}
        </p>
      </SerifSlide>
    ),
  },
  // 2 Problem: Jack isn't alone ----------------------------------------------
  {
    title: "Jack isn't alone",
    body: (
      <SerifSlide title="Jack isn’t alone." refs={[1, 2, 3, 4]}>
        <p className="text-[28px]">Demand is growing faster than the buses.</p>
        <div className="mt-5 grid grid-cols-4 gap-4">
          <Tile value="+54%">
            Kigali&rsquo;s population, 2012 &rarr; 2022 (1.13M &rarr; 1.75M)
            <Ref n={2} />
          </Tile>
          <Tile value="+30%">
            Bus passengers in one year after the reforms
            <Ref n={3} />
          </Tile>
          <Tile value="Up to 1 hour">
            Average wait, regulator&rsquo;s figure
            <Ref n={1} />
          </Tile>
          <Tile value="20% → 50%">
            Public transport&rsquo;s share of trips, today vs target
            <Ref n={4} />
          </Tile>
        </div>
        <p className="mt-8 border-t-2 border-ink pt-4 text-[30px] font-bold">
          Nobody can see where that demand is waiting.
        </p>
      </SerifSlide>
    ),
  },
  // 3 Gaps: why nobody sees Jack ---------------------------------------------
  {
    title: "Why nobody sees Jack",
    body: (
      <SerifSlide title="Why nobody sees Jack" refs={[5, 6, 7, 8]}>
        <div className="grid grid-cols-[400px_1fr] gap-8">
          <div>
            <Panel>
              <NobodySeesJack />
            </Panel>
            <p className="mt-3 text-[24px] leading-snug">
              Generation 2 tracks every bus live
              <Ref n={5} />. Nobody tracks who is waiting.
            </p>
          </div>
          <table className="w-full self-start border-collapse text-left text-[24px] leading-snug">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="py-1.5 pr-5 font-bold">Gap today</th>
                <th className="w-[38%] py-1.5 font-bold">Tap&amp;Select fix</th>
              </tr>
            </thead>
            <tbody>
              {GAPS.map((g) => (
                <tr key={g.fix} className="border-b border-line align-top">
                  <td className="py-2 pr-5">{g.gap}</td>
                  <td className="py-2 font-bold">{g.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SerifSlide>
    ),
  },
  // 4 Solution: imagine Jack's evening with Tap&Select -----------------------
  {
    title: "Imagine Jack's evening",
    body: (
      <SerifSlide title="Imagine Jack’s evening with Tap&Select">
        <p className="-mt-2 mb-4 text-[26px]">We bring the bus park to every bus stop: Sense → Decide → Inform.</p>
        <IdeaStoryboard />
      </SerifSlide>
    ),
  },
  // 5 How it works: the comic, unchanged -------------------------------------
  {
    title: "How it works",
    body: (
      <Frame section="Tech" title="How it works">
        <JourneyComic />
        <dl className="mt-8 grid grid-cols-3 divide-x divide-line rounded-card border border-line bg-surface">
          {WHAT_RUNS_WHERE.map((w) => (
            <div key={w.place} className="p-5">
              <dt className="text-[24px] font-semibold font-display">{w.place}</dt>
              <dd className="mt-1 text-[21px] text-muted">{w.what}</dd>
            </div>
          ))}
        </dl>
      </Frame>
    ),
  },
  // 6 Live demo --------------------------------------------------------------
  {
    title: "Live demo",
    body: (
      <SerifSlide title="Now watch it happen">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[26px]">
          {DEMO_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span>{step}</span>
              {i < DEMO_STEPS.length - 1 ? (
                <span aria-hidden className="text-muted">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <div className="mt-8 grid grid-cols-2 gap-6">
          <a
            href="/kiosk"
            target="_blank"
            rel="noreferrer"
            className="flex h-32 flex-col justify-center rounded-card bg-accent px-8 text-paper transition-colors duration-200 ease-out hover:bg-ink"
          >
            <span className="text-[34px] font-bold">Open kiosk</span>
            <span className="text-[22px] opacity-90">/kiosk</span>
          </a>
          <a
            href="/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex h-32 flex-col justify-center rounded-card border-2 border-ink bg-surface px-8 transition-colors duration-200 ease-out hover:bg-paper"
          >
            <span className="text-[34px] font-bold">HQ dashboard</span>
            <span className="text-[22px] text-muted">/dashboard</span>
          </a>
        </div>
        <div className="mt-10 flex items-center gap-6 rounded-card border-2 border-ink bg-surface px-6 py-3">
          <LiveQr size={140} />
          <p className="text-[28px] font-bold leading-snug">
            Don&rsquo;t take our word for it. Scan and watch the queue live.
            <span className="block text-[22px] font-normal text-muted">tap-and-select.vercel.app/live · no sign-in</span>
          </p>
        </div>
      </SerifSlide>
    ),
  },
  // 7 Results: does it work? -------------------------------------------------
  {
    title: "Does it work?",
    body: (
      <SerifSlide title="Does it work? What we built and measured" refs={[5, 6]}>
        <div className="grid grid-cols-3 gap-4">
          <Tile value={pitchValue(N.voiceAccuracy, "%")}>
            Voice model accuracy on {pitchValue(N.voiceSamples)} samples, {pitchValue(N.voiceSpeakers)} voices
          </Tile>
          <Tile value={`${pitchValue(N.modelRamKb)} KB RAM`}>
            Runs on the board: {pitchValue(N.modelFlashKb)} KB flash, offline
          </Tile>
          <Tile value={`${pitchValue(N.gestureBefore, "%")} → ${pitchValue(N.gestureAfter, "%")}`}>
            Gesture accuracy, after switching to swipes
          </Tile>
          <Tile value={pitchValue(N.surveyGaveUpPct, "%")}>
            of {pitchValue(N.surveyRespondents)} commuters surveyed gave up waiting last month
          </Tile>
          <Tile value={pitchValue(N.audienceJoined)}>of you joined the queue live today</Tile>
          <div className="rounded-card border-2 border-dashed border-warn bg-surface p-5">
            <span className="inline-block rounded-pill border-2 border-warn px-3 text-[18px] font-bold uppercase tracking-[0.06em]">
              Estimate
            </span>
            <p className="mt-2 text-[22px] leading-snug">
              Off-peak, a bus with ~12 passengers on ~50 seats is about 24% full: three in four seats travel empty
              <Ref n={[5, 6]} />.
            </p>
          </div>
        </div>
      </SerifSlide>
    ),
  },
  // 8 Conclusion: back to Jack -----------------------------------------------
  {
    title: "Back to Jack",
    body: (
      <SerifSlide title="Today, the bus doesn’t know Jack is waiting. With Tap&Select, it does.">
        <div className="grid grid-cols-[440px_1fr] items-start gap-8">
          <Panel label="Imagine: Jack boards with ticket R2-014.">
            <JackBoards />
          </Panel>
          <dl className="space-y-2">
            {SUMMARY.map((s) => (
              <div key={s.label} className="grid grid-cols-[120px_1fr] gap-4 border-b border-line pb-2">
                <dt className="text-[24px] font-bold">{s.label}</dt>
                <dd className="text-[24px] leading-snug">{s.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-auto text-[96px] font-bold leading-none">Murakoze.</p>
      </SerifSlide>
    ),
  },
];

/** Printed after the slides: every source, IEEE format. Not shown in the presenter. */
export const REFERENCES_PAGE: Slide = {
  title: "References",
  body: (
    <SerifSlide title="References">
      <ol className="space-y-2 text-[18px] leading-snug">
        {PITCH_REFERENCES.map((r) => (
          <li key={r.n} className="pl-10 -indent-10">
            <ReferenceLine reference={r} />
          </li>
        ))}
      </ol>
    </SerifSlide>
  ),
};
