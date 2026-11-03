// The pitch as one story in plain words: Jack waits (hook), why (problem, gaps), the
// fix (solution, how it works), proof (demo, results), Jack boards (conclusion), then
// the sources. Story slides are in Times New Roman; the "How it works" comic panels
// are kept as they were. Each slide renders into a fixed 1280×720 canvas.

import Image from "next/image";
import type { ReactNode } from "react";
import { IdeaStoryboard } from "./IdeaStoryboard";
import { JourneyComic } from "./JourneyComic";
import { JackBoards, JackWaits, NobodySeesJack } from "./StoryPanels";
import { formatAccuracy, MODELS } from "@/lib/models";
import { PITCH_SECTIONS, type PitchSection } from "@/lib/pitch-nav";
import { PITCH_NUMBERS as N, pitchPercent, pitchValue } from "@/lib/pitch";
import { PITCH_REFERENCES, ReferenceLine, referenceYear, TEAM } from "./content";

export interface Slide {
  title: string;
  body: ReactNode;
}

// ---------------------------------------------------------------------------
// Story slides: the title is the line you say, one visual, sources shown.
// ---------------------------------------------------------------------------

/** In-text citation, e.g. [1] or [1], [2]. */
function Ref({ n }: { n: number | readonly number[] }) {
  const list = typeof n === "number" ? [n] : n;
  return <span className="ml-1 align-baseline text-[18px] font-normal not-italic text-muted">[{list.join("], [")}]</span>;
}

/** Only the sources cited on this slide, short form (the full list is the last slide). */
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

/** A big number, what it means in plain words, and where it comes from. */
function Stat({ value, source, children }: { value: ReactNode; source: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-card border border-line bg-surface p-5">
      <span className="block text-[52px] font-bold leading-none tabular-nums">{value}</span>
      <span className="mt-3 block flex-1 text-[24px] leading-snug">{children}</span>
      <span className="mt-4 block border-t border-line pt-2 text-[18px] leading-snug text-muted">Source: {source}</span>
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
        Buses leave on a timetable, even nearly empty
        <Ref n={6} />
      </>
    ),
    fix: "Count who is waiting at every stop",
  },
  {
    gap: (
      <>
        Bus cards only record you when you tap in on the bus
        <Ref n={7} />
      </>
    ),
    fix: "Count you while you wait",
  },
  {
    gap: (
      <>
        No money on your card? No cash allowed
        <Ref n={5} />
      </>
    ),
    fix: "Check your balance while you wait",
  },
  {
    gap: (
      <>
        No conductor to call out the stops
        <Ref n={8} />
      </>
    ),
    fix: "Tell the driver who gets off next",
  },
];

/** The comic's bottom row, in plain words. */
const WHO_DOES_WHAT = [
  { place: "The small board", what: "Hears the stop's name or reads the swipe. No internet needed." },
  { place: "The stop's screen", what: "Shows the ticket and when the bus comes." },
  { place: "The internet", what: "Tells the control room and the driver." },
] as const;

const SUMMARY = [
  { label: "Problem", text: "More people need buses, and nobody can see who is waiting." },
  { label: "Solution", text: "Every bus stop tells the control room who is waiting." },
  { label: "Next", text: "Test it at 2–3 real stops, add real card readers, teach it more voices." },
] as const;

const DEMO_STEPS = ["Tap card", "Say “Remera” or swipe", "Confirm", "Get a ticket", "Control room sends a bus", "Bus arrives"];

/** Voice model on a voice it never heard (Edge Impulse test set). */
const voiceNew = MODELS.voice.testAccuracy;

// ---------------------------------------------------------------------------
// The "How it works" comic slide.
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
  // 1 Hook: a question, then Jack ---------------------------------------------
  {
    title: "Hook",
    body: (
      <SerifSlide title="How long did you wait for a bus this week?">
        <div className="grid grid-cols-[520px_1fr] items-center gap-8">
          <Panel>
            <JackWaits />
          </Panel>
          <div>
            <p className="text-[34px] font-bold leading-snug">For Jack, getting home takes more than three hours.</p>
            <blockquote className="mt-4 border-l-4 border-ink pl-5">
              <p className="text-[26px] italic leading-snug">
                &ldquo;I finish work at 6PM and immediately head to a bus stop, but I reach home after 9PM.&rdquo;
              </p>
            </blockquote>
          </div>
        </div>
        <p className="mt-14 text-[48px] font-bold leading-tight">The bus doesn&rsquo;t know Jack is waiting.</p>
      </SerifSlide>
    ),
  },
  // 2 Problem: Jack isn't alone -------------------------------------------------
  {
    title: "Jack isn't alone",
    body: (
      <SerifSlide title="Jack isn’t alone.">
        <div className="grid grid-cols-4 gap-4">
          <Stat value="1 hour" source={<>RURA, via KT Press (2022) <Ref n={1} /></>}>
            is how long the average wait at a stop can be
          </Stat>
          <Stat value="+54%" source={<>Rwanda census, via City Population (2023) <Ref n={2} /></>}>
            more people live in Kigali than 10 years ago (1.13 → 1.75 million)
          </Stat>
          <Stat value="+30%" source={<>C. Nyandwi, AllAfrica (2026) <Ref n={3} /></>}>
            more people ride the bus than last year
          </Stat>
          <Stat value="1 in 5" source={<>The New Times, AllAfrica (2026) <Ref n={4} /></>}>
            trips are made by bus today. The city wants 1 in 2.
          </Stat>
        </div>
        <p className="mt-6 border-t-2 border-ink pt-4 text-[30px] font-bold">
          More people, more riders, and still nobody sees who is waiting.
        </p>
      </SerifSlide>
    ),
  },
  // 3 Gaps: why nobody sees Jack -----------------------------------------------
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
              Since December 2025, every bus is tracked live
              <Ref n={5} />. The people waiting are not.
            </p>
          </div>
          <table className="w-full self-start border-collapse text-left text-[24px] leading-snug">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="py-1.5 pr-5 font-bold">The problem today</th>
                <th className="w-[40%] py-1.5 font-bold">Our fix</th>
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
  // 4 Solution: imagine Jack's evening -----------------------------------------
  {
    title: "Imagine Jack's evening",
    body: (
      <SerifSlide title="Imagine Jack’s evening with Tap&Select">
        <p className="-mt-2 mb-4 text-[26px]">
          Jack tells the stop where he is going. The control room sends a bus. Jack sees when it will come.
        </p>
        <IdeaStoryboard />
      </SerifSlide>
    ),
  },
  // 5 How it works: the comic --------------------------------------------------
  {
    title: "How it works",
    body: (
      <Frame section="Tech" title="How it works">
        <JourneyComic />
        <dl className="mt-8 grid grid-cols-3 divide-x divide-line rounded-card border border-line bg-surface">
          {WHO_DOES_WHAT.map((w) => (
            <div key={w.place} className="p-5">
              <dt className="text-[24px] font-semibold font-display">{w.place}</dt>
              <dd className="mt-1 text-[21px] text-muted">{w.what}</dd>
            </div>
          ))}
        </dl>
      </Frame>
    ),
  },
  // 6 Results: does it work? ---------------------------------------------------
  {
    title: "Does it work?",
    body: (
      <SerifSlide title="Does it work? What we measured">
        <div className="grid grid-cols-3 gap-4">
          <Stat value={pitchPercent(N.swipeCorrect, N.swipeTries)} source="our own tests on the board">
            of hand swipes picked the right stop ({pitchValue(N.swipeCorrect)} of {pitchValue(N.swipeTries)} tries)
          </Stat>
          <Stat value={formatAccuracy(voiceNew)} source="our model in Edge Impulse">
            of stop names understood, on a new voice it never heard. Next: more voices and accents.
          </Stat>
          <Stat value={pitchValue(N.modelRamKb, " KB")} source="Edge Impulse">
            of memory is all the voice model needs, less than one phone photo. No internet needed.
          </Stat>
          <Stat value={pitchValue(N.surveyGaveUpPct, "%")} source="our survey">
            of {pitchValue(N.surveyRespondents)} commuters gave up waiting for a bus last month
          </Stat>
          <Stat value={pitchValue(N.audienceJoined)} source="live data from the demo">
            of you joined the line during the demo
          </Stat>
          <div className="rounded-card border-2 border-dashed border-warn bg-surface p-5">
            <span className="inline-block rounded-pill border-2 border-warn px-3 text-[18px] font-bold uppercase tracking-[0.06em]">
              Estimate
            </span>
            <p className="mt-2 text-[24px] leading-snug">
              Outside rush hour, a bus can leave with about 12 people on about 50 seats: three in four seats empty
              <Ref n={[5, 6]} />.
            </p>
          </div>
        </div>
      </SerifSlide>
    ),
  },
  // 7 Live demo: then switch to the links ------------------------------------
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
            <span className="text-[34px] font-bold">The bus stop</span>
            <span className="text-[22px] opacity-90">/kiosk</span>
          </a>
          <a
            href="/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex h-32 flex-col justify-center rounded-card border-2 border-ink bg-surface px-8 transition-colors duration-200 ease-out hover:bg-paper"
          >
            <span className="text-[34px] font-bold">The control room</span>
            <span className="text-[22px] text-muted">/dashboard</span>
          </a>
        </div>
        <div className="mt-10 flex items-center gap-6 rounded-card border-2 border-ink bg-surface px-6 py-3">
          <LiveQr size={140} />
          <p className="text-[28px] font-bold leading-snug">
            Don&rsquo;t take our word for it. Scan and watch the line live.
            <span className="block text-[22px] font-normal text-muted">tap-and-select.vercel.app/live · no sign-in</span>
          </p>
        </div>
      </SerifSlide>
    ),
  },
  // 8 Conclusion: back to Jack -------------------------------------------------
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
        <div className="mt-auto flex items-end justify-between gap-8">
          <p className="text-[96px] font-bold leading-none">Murakoze.</p>
          <p className="pb-2 text-right text-[20px] text-muted">
            Tap&amp;Select · {TEAM.join(", ")}
            <br />
            CMU-Africa Bridge Program 2026
          </p>
        </div>
      </SerifSlide>
    ),
  },
  // 9 References ---------------------------------------------------------------
  {
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
  },
];
