// The pitch: six slides in Times New Roman plus the "How it works" comic, kept
// exactly as it was. Each renders into a fixed 1280×720 canvas that the deck
// scales to the screen, so sizes here are real projector sizes.

import { Clock, LayoutDashboard, Nfc } from "lucide-react";
import type { ReactNode } from "react";
import { JourneyComic } from "./JourneyComic";
import { PITCH_SECTIONS, type PitchSection } from "@/lib/pitch-nav";
import { PITCH_NUMBERS as N, pitchValue } from "@/lib/pitch";
import { PITCH_REFERENCES, ReferenceLine, referenceYear, TEAM, WHAT_RUNS_WHERE } from "./content";

export interface Slide {
  title: string;
  body: ReactNode;
}

// ---------------------------------------------------------------------------
// The six slides: short title, 3–5 lines, one visual, cited sources at the foot.
// ---------------------------------------------------------------------------

/** In-text citation, e.g. [1] or [1], [2]. */
function Ref({ n }: { n: number | readonly number[] }) {
  const list = typeof n === "number" ? [n] : n;
  return <span className="ml-1 align-baseline text-[18px] font-normal text-muted">[{list.join("], [")}]</span>;
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

function Tile({ value, children, className = "" }: { value: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-line bg-surface p-5 ${className}`}>
      <span className="block text-[52px] font-bold leading-none tabular-nums">{value}</span>
      <span className="mt-3 block text-[24px] leading-snug">{children}</span>
    </div>
  );
}

const GAPS: readonly { gap: ReactNode; fix: string }[] = [
  {
    gap: (
      <>
        Schedules don&rsquo;t follow demand: off-peak buses leave nearly empty
        <Ref n={2} />
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
    fix: "Demand registered at the stop, before the bus comes",
  },
  {
    gap: (
      <>
        Empty card = missed bus; no cash option
        <Ref n={1} />
      </>
    ),
    fix: "Balance check and fare preview while waiting",
  },
  {
    gap: (
      <>
        No conductor: missed stops, no alerts
        <Ref n={8} />
      </>
    ),
    fix: "Driver screen: “3 getting off at the next stop”",
  },
];

const SOLUTION_STEPS = [
  { step: "Sense", Icon: Nfc, detail: "Tap your card, say or swipe your stop" },
  { step: "Decide", Icon: LayoutDashboard, detail: "HQ sees live demand and sends buses where people wait" },
  { step: "Inform", Icon: Clock, detail: "A fair queue number and a live ETA" },
] as const;

const GAINS = [
  { who: "Passengers", text: "Fair queue, live ETA, no smartphone needed" },
  { who: "Operators", text: "Fuller buses, fewer empty trips" },
  { who: "City / RURA", text: "Live demand data per stop" },
] as const;

const SUMMARY = [
  { label: "Problem", text: "Demand grows faster than buses, and nobody sees who is waiting." },
  { label: "Solution", text: "Every bus stop becomes as visible as a bus park." },
  { label: "Next", text: "A pilot at 2–3 stops on one route, real card readers, more Kinyarwanda voices." },
] as const;

// ---------------------------------------------------------------------------
// The comic slide, unchanged from the previous deck.
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
  // 1 Hook ---------------------------------------------------------------
  {
    title: "Same bus. Two different hours.",
    body: (
      <SerifSlide title="Same bus. Two different hours." refs={[1, 2]}>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-card border-2 border-danger bg-surface p-7">
            <span className="block text-[64px] font-bold leading-none tabular-nums">7:00 AM</span>
            <span className="mt-4 block text-[28px] leading-snug">
              70&ndash;80 people on a bus built for about 50
              <Ref n={1} />
            </span>
          </div>
          <div className="rounded-card border-2 border-muted bg-surface p-7">
            <span className="block text-[64px] font-bold leading-none tabular-nums">11:00 AM</span>
            <span className="mt-4 block text-[28px] leading-snug">
              The same route leaves with 10&ndash;15 passengers
              <Ref n={2} />
            </span>
          </div>
        </div>
        <p className="mt-10 text-[44px] font-bold leading-tight">Why are we either crushed or waiting?</p>
        <p className="mt-auto text-[20px] text-muted">
          Tap&amp;Select · CMU-Africa Bridge Program 2026 · {TEAM.join(", ")}
        </p>
      </SerifSlide>
    ),
  },
  // 2 The problem --------------------------------------------------------
  {
    title: "The problem",
    body: (
      <SerifSlide title="Demand is growing faster than the buses" refs={[3, 4, 5, 6]}>
        <div className="grid grid-cols-4 gap-4">
          <Tile value="+54%">
            Kigali&rsquo;s population, 2012 &rarr; 2022 (1.13M &rarr; 1.75M)
            <Ref n={3} />
          </Tile>
          <Tile value="+30%">
            Bus passengers in one year after the reforms
            <Ref n={4} />
          </Tile>
          <Tile value="Up to 1 hour">
            Average wait, regulator&rsquo;s figure
            <Ref n={5} />
          </Tile>
          <Tile value="20% → 50%">
            Public transport&rsquo;s share of trips, today vs target
            <Ref n={6} />
          </Tile>
        </div>
        <p className="mt-8 border-t-2 border-ink pt-4 text-[30px] font-bold">
          Nobody can see where that demand is waiting.
        </p>
      </SerifSlide>
    ),
  },
  // 3 The gaps -----------------------------------------------------------
  {
    title: "The gaps",
    body: (
      <SerifSlide title="Buses are visible. Passengers are not." refs={[1, 2, 7, 8]}>
        <p className="text-[26px] leading-snug">
          Generation 2 brought schedules and live bus tracking
          <Ref n={1} />; Tap&amp;Go made fares cashless.
        </p>
        <table className="mt-5 w-full border-collapse text-left text-[24px] leading-snug">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="w-[56%] py-2 pr-6 font-bold">Gap today</th>
              <th className="py-2 font-bold">Tap&amp;Select fix</th>
            </tr>
          </thead>
          <tbody>
            {GAPS.map((g) => (
              <tr key={g.fix} className="border-b border-line align-top">
                <td className="py-2.5 pr-6">{g.gap}</td>
                <td className="py-2.5 font-bold">{g.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SerifSlide>
    ),
  },
  // 4 The solution -------------------------------------------------------
  {
    title: "The solution",
    body: (
      <SerifSlide title="Tap&Select brings the bus park to every bus stop">
        <ol className="grid grid-cols-3 gap-5">
          {SOLUTION_STEPS.map(({ step, Icon, detail }) => (
            <li key={step} className="rounded-card border border-line bg-surface p-5">
              <Icon aria-hidden className="h-9 w-9 text-accent" strokeWidth={2} />
              <h3 className="mt-2 text-[34px] leading-tight">{step}</h3>
              <p className="mt-1 text-[24px] leading-snug">{detail}</p>
            </li>
          ))}
        </ol>
        <dl className="mt-5 grid grid-cols-3 divide-x divide-line rounded-card border border-line bg-surface">
          {GAINS.map((g) => (
            <div key={g.who} className="px-5 py-3">
              <dt className="text-[20px] font-bold uppercase tracking-[0.06em] text-muted">{g.who}</dt>
              <dd className="text-[24px] leading-snug">{g.text}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto flex items-center gap-6">
          {/* TODO: /join does not exist yet; replace with its QR code (public/pitch/). */}
          <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-md border-2 border-dashed border-muted text-center text-[16px] leading-tight text-muted">
            QR code
            <br />
            /join
          </div>
          <p className="text-[28px] font-bold leading-snug">
            Don&rsquo;t take our word for it. Scan the QR and join the queue.
          </p>
        </div>
      </SerifSlide>
    ),
  },
  // Comic: "How it works", unchanged -------------------------------------
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
  // 5 Our results --------------------------------------------------------
  {
    title: "Our results",
    body: (
      <SerifSlide title="What we built and measured" refs={[1, 2]}>
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
              <Ref n={[1, 2]} />.
            </p>
          </div>
        </div>
      </SerifSlide>
    ),
  },
  // 6 Conclusion ---------------------------------------------------------
  {
    title: "Conclusion",
    body: (
      <SerifSlide title="Today, people wait for buses. With Tap&Select, buses know who is waiting.">
        <dl className="space-y-3">
          {SUMMARY.map((s) => (
            <div key={s.label} className="grid grid-cols-[160px_1fr] gap-6 border-b border-line pb-3">
              <dt className="text-[28px] font-bold">{s.label}</dt>
              <dd className="text-[28px] leading-snug">{s.text}</dd>
            </div>
          ))}
        </dl>
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
