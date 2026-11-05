// The pitch in six parts, one presenter each: problem statement (Kenny's storyline: a cold
// "0", Alice, the problem, our survey, today's one-way fixes), our solution in three steps,
// how it works and what we measured, the live demo, conclusion & future work, and questions;
// then the sources. Alice is the same comic character on every slide.
// System colours only: ink on paper, red for the problem, green for what we bring and measured,
// muted for sources. Times New Roman; sizes in points: title 44, main points 24–28, sources 18.

import { CreditCard, MapPin, Mic, Sun } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { EveryoneSeesEta, HqSeesDemand, QueueAtStop } from "./IdeaStoryboard";
import { JourneyComic, TapCardPanel } from "./JourneyComic";
import { AliceBoards, AliceWaits } from "./StoryPanels";
import { formatAccuracy, MODELS } from "@/lib/models";
import type { PitchPart } from "@/lib/pitch-nav";
import { PITCH_NUMBERS as N, pitchPercent, pitchValue } from "@/lib/pitch";
import { PITCH_REFERENCES, ReferenceLine, TEAM } from "./content";

export interface Slide {
  title: string;
  part: PitchPart;
  body: ReactNode;
}

/** A font size in points (CSS: 1 pt = 4/3 px on the 1280 × 720 canvas). */
const pt = (n: number) => ({ fontSize: `${n}pt` });

/** In-text citation, e.g. [1] or [1], [2]. */
function Cite({ n }: { n: number | readonly number[] }) {
  const list = typeof n === "number" ? [n] : n;
  return (
    <span className="ml-2 font-normal not-italic text-muted" style={pt(18)}>
      [{list.join("], [")}]
    </span>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-bold leading-[1.1] text-ink" style={pt(44)}>
      {children}
    </h2>
  );
}

/** Every slide: paper background, content below the parts bar and above the footer. */
function SlideFrame({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="pitch-serif flex h-full flex-col bg-paper px-16 pt-16 pb-20 text-ink">
      {title ? <Title>{title}</Title> : null}
      <div className={`flex min-h-0 flex-1 flex-col ${title ? "mt-6" : ""}`}>{children}</div>
    </div>
  );
}

/** A comic panel, framed like the other comics. */
function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <figure className={`overflow-hidden rounded-card border border-line bg-surface [&>svg]:block [&>svg]:w-full ${className ?? ""}`}>
      {children}
    </figure>
  );
}

type Tone = "problem" | "result" | "plain";
const TONE: Record<Tone, string> = { problem: "text-danger", result: "text-accent", plain: "text-ink" };

/** A big number, what it means, and its source. */
function Stat({ value, source, tone = "plain", children }: { value: string; source: ReactNode; tone?: Tone; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className={`font-bold leading-none tabular-nums ${TONE[tone]}`} style={pt(64)}>
        {value}
      </span>
      <span className="mt-3 leading-snug" style={pt(24)}>
        {children}
      </span>
      <span className="mt-3 border-t border-line pt-2 leading-snug text-muted" style={pt(18)}>
        {source}
      </span>
    </div>
  );
}

/** One solution step: a comic panel and up to three short lines. */
function Step({ n, title, panel, lines }: { n: number; title: string; panel: ReactNode; lines: readonly ReactNode[] }) {
  return (
    <SlideFrame
      title={
        <>
          <span className="text-accent">{n} ·</span> {title}
        </>
      }
    >
      <div className="grid flex-1 grid-cols-[560px_1fr] items-center gap-12">
        <Panel>{panel}</Panel>
        <ul className="space-y-6">
          {lines.map((line, i) => (
            <li key={i} className="border-l-4 border-accent pl-5 leading-snug" style={pt(26)}>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </SlideFrame>
  );
}

/** QR code for the audience join page (public/pitch/join-qr.svg, made with `npx qrcode`). */
function JoinQr({ size }: { size: number }) {
  return (
    <Image
      src="/pitch/join-qr.svg"
      width={size}
      height={size}
      unoptimized
      alt="QR code: tap-and-select.vercel.app/join"
      className="rounded-md border border-line bg-white p-2"
    />
  );
}

/** Today's one-way fixes (Kenny's slide 6). */
const FIXES = [
  { name: "Ecofleet screens", what: "show arrivals (2 test screens)", cite: 5, img: "/pitch/story/ecofleet-screen.jpg", alt: "An Ecofleet test screen at a Kigali bus stop", w: 150, h: 200 },
  { name: "Gerayo app", what: "plans routes", cite: 6, img: "/pitch/story/gerayo.png", alt: "Gerayo app icon", w: 200, h: 200 },
  { name: "Tap&Go", what: "counts boardings", cite: 1, img: "/pitch/story/tapgo.png", alt: "Tap&Go card icon", w: 200, h: 200 },
] as const;

const SENSE_DECIDE_INFORM = [
  { stage: "1 · Count", text: "who is waiting, at every stop", Drawing: QueueAtStop },
  { stage: "2 · Send", text: "buses where people wait", Drawing: HqSeesDemand },
  { stage: "3 · Tell", text: "everyone when the bus comes", Drawing: EveryoneSeesEta },
] as const;

const NEXT_STEPS = [
  { Icon: MapPin, head: "2–3 real stops", text: "One route, real commuters, one month" },
  { Icon: CreditCard, head: "Real card readers", text: "Linked to Tap&Go cards" },
  { Icon: Mic, head: "More voices", text: "Many accents, and Kinyarwanda" },
  { Icon: Sun, head: "Solar + mobile data", text: "A stop that runs on its own" },
] as const;

/** Voice model on a voice it never heard (Edge Impulse test set). */
const voiceNew = MODELS.voice.testAccuracy;

/** The reference list, split so each page fits at 18 pt. */
function References({ from, to }: { from: number; to: number }) {
  return (
    <ol className="space-y-4 leading-snug" style={pt(18)}>
      {PITCH_REFERENCES.filter((r) => r.n >= from && r.n <= to).map((r) => (
        <li key={r.n} className="pl-12 -indent-12">
          <ReferenceLine reference={r} />
        </li>
      ))}
    </ol>
  );
}

const half = Math.ceil(PITCH_REFERENCES.length / 2);

/** The four route colours as a thin band, like a transit map key. */
function RouteBand() {
  return (
    <div className="flex h-2 w-64 overflow-hidden rounded-pill" aria-hidden>
      {[1, 2, 3, 4].map((r) => (
        <span key={r} className="flex-1" style={{ background: `var(--route-${r})` }} />
      ))}
    </div>
  );
}

export const SLIDES: readonly Slide[] = [
  // ── 1 Problem statement (Kenny) ─────────────────────────────────────────────
  {
    title: "Tap&Select",
    part: "Problem statement",
    body: (
      <SlideFrame>
        <div className="grid flex-1 grid-cols-[1fr_440px] items-center gap-12">
          <div>
            <RouteBand />
            <h1 className="mt-6 font-bold leading-none" style={pt(44)}>
              Tap&amp;Select
            </h1>
            <p className="mt-5 font-bold text-accent" style={pt(28)}>
              Make every stop count.
            </p>
            <p className="mt-2" style={pt(24)}>
              Smart bus stops for Kigali
            </p>
            <p className="mt-12" style={pt(24)}>
              {TEAM.join(" · ")}
            </p>
            <p className="mt-1 text-muted" style={pt(18)}>
              CMU-Africa Bridge Program 2026
            </p>
          </div>
          <Panel>
            <TapCardPanel />
          </Panel>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "How many can the system see?",
    part: "Problem statement",
    body: (
      <SlideFrame>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Title>How many waiting passengers can Kigali&rsquo;s bus system see?</Title>
          <p className="mt-4 font-bold leading-none text-danger" style={pt(200)}>
            0
          </p>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "Meet Alice",
    part: "Problem statement",
    body: (
      <SlideFrame title="Meet Alice">
        <div className="grid flex-1 grid-cols-[640px_1fr] items-center gap-12">
          <Panel>
            <AliceWaits />
          </Panel>
          <div>
            <p className="font-bold" style={pt(28)}>
              40 waiting at Remera.
            </p>
            <p className="font-bold text-danger" style={pt(28)}>
              10 seats left.
            </p>
            <p className="mt-8 italic" style={pt(28)}>
              You don&rsquo;t exist until you get on the bus.
              <Cite n={1} />
            </p>
            <p className="mt-3 text-muted" style={pt(18)}>
              Alice is a composite of what commuters told us.
            </p>
          </div>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "The problem",
    part: "Problem statement",
    body: (
      <SlideFrame title="The problem">
        <p style={pt(28)}>Buses run on a timetable.</p>
        <p className="font-bold text-danger" style={pt(28)}>
          Nobody tells it who is waiting.
        </p>
        <div className="mt-auto grid grid-cols-2 gap-16">
          <Stat value="+30%" source="C. Nyandwi, The New Times (2026) [2]">
            more passengers than last year
          </Stat>
          <Stat value="20%" source="The New Times (2026) [3]">
            of daily trips by public transport, up from about 10%
          </Stat>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "We asked commuters",
    part: "Problem statement",
    body: (
      <SlideFrame title="We asked commuters">
        <div className="mt-6 grid grid-cols-3 gap-12">
          <Stat tone="problem" value={pitchPercent(N.surveyLongWaits, N.surveyRespondents)} source={`${pitchValue(N.surveyLongWaits)} of ${pitchValue(N.surveyRespondents)}`}>
            say long waits keep them off the bus
          </Stat>
          <Stat tone="problem" value={pitchPercent(N.surveyUnsureWhen, N.surveyRespondents)} source={`${pitchValue(N.surveyUnsureWhen)} of ${pitchValue(N.surveyRespondents)}`}>
            don&rsquo;t know when the bus will arrive
          </Stat>
          <Stat tone="problem" value={pitchPercent(N.surveyToBusPark, N.surveyRespondents)} source={`${pitchValue(N.surveyToBusPark)} of ${pitchValue(N.surveyRespondents)}`}>
            go to a bus park on foot or by moto, to be sure of a bus
          </Stat>
        </div>
        <p className="mt-auto text-muted" style={pt(18)}>
          n = {pitchValue(N.surveyRespondents)} commuters surveyed in Kigali, 1–4 Nov 2026 [4]
        </p>
      </SlideFrame>
    ),
  },
  {
    title: "Today's fixes talk one way",
    part: "Problem statement",
    body: (
      <SlideFrame title="Today’s fixes talk one way">
        <div className="grid grid-cols-3 gap-12">
          {FIXES.map((f) => (
            <div key={f.name}>
              <div className="flex h-[200px] items-center">
                <Image src={f.img} alt={f.alt} width={f.w} height={f.h} unoptimized className="max-h-[200px] w-auto rounded-xl object-contain" />
              </div>
              <p className="mt-3 font-bold" style={pt(24)}>
                {f.name}
              </p>
              <p className="leading-snug" style={pt(24)}>
                {f.what}
                <Cite n={f.cite} />
              </p>
            </div>
          ))}
        </div>
        <p className="mt-auto font-bold text-danger" style={pt(28)}>
          Nothing in use today counts who is waiting.
        </p>
        <p className="italic text-accent" style={pt(24)}>
          So we built the missing half.
        </p>
      </SlideFrame>
    ),
  },
  // ── 2 Our solution ─────────────────────────────────────────────────────────
  {
    title: "Our solution",
    part: "Our solution",
    body: (
      <SlideFrame title="Our solution: Tap&Select">
        <p style={pt(28)}>
          Every bus stop counts who is waiting, <span className="font-bold text-accent">so buses go where people are.</span>
        </p>
        <div className="mt-auto grid grid-cols-3 gap-8">
          {SENSE_DECIDE_INFORM.map(({ stage, text, Drawing }) => (
            <div key={stage}>
              <Panel>
                <Drawing />
              </Panel>
              <p className="mt-3 leading-snug" style={pt(24)}>
                <span className="font-bold text-accent">{stage}</span> {text}
              </p>
            </div>
          ))}
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "Count who is waiting",
    part: "Our solution",
    body: (
      <Step
        n={1}
        title="Count who is waiting"
        panel={<QueueAtStop />}
        lines={[
          "Alice taps her bus card at the stop.",
          "She says her stop, or swipes a hand.",
          "She gets a number in the line.",
        ]}
      />
    ),
  },
  {
    title: "Send buses where people wait",
    part: "Our solution",
    body: (
      <Step
        n={2}
        title="Send buses where people wait"
        panel={<HqSeesDemand />}
        lines={[
          "The control room sees every line, live.",
          "A bus is suggested when it would be 70% full, or someone has waited 15 minutes.",
          "A person says yes; the bus leaves.",
        ]}
      />
    ),
  },
  {
    title: "Tell everyone when the bus comes",
    part: "Our solution",
    body: (
      <Step
        n={3}
        title="Tell everyone when the bus comes"
        panel={<EveryoneSeesEta />}
        lines={["The stop shows and says when the bus comes.", "Alice can follow the bus on her phone.", "First in line, first on."]}
      />
    ),
  },
  // ── 3 How it works · does it work ───────────────────────────────────────────
  {
    title: "How it works",
    part: "How it works",
    body: (
      <SlideFrame title="How it works">
        <div className="mt-2">
          <JourneyComic />
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "Does it work?",
    part: "How it works",
    body: (
      <SlideFrame title="Does it work? What we measured">
        <div className="mt-6 grid grid-cols-3 gap-12">
          <Stat tone="result" value={pitchPercent(N.swipeCorrect, N.swipeTries)} source="Our tests on the board">
            of hand swipes picked the right stop ({pitchValue(N.swipeCorrect)} of {pitchValue(N.swipeTries)})
          </Stat>
          <Stat tone="result" value={formatAccuracy(voiceNew)} source="Our model in Edge Impulse">
            of stop names understood, from a voice it never heard
          </Stat>
          <Stat tone="result" value={pitchValue(N.modelRamKb, " KB")} source="Edge Impulse">
            of memory runs the voice model on the board, no internet
          </Stat>
        </div>
        <p className="mt-auto font-bold text-accent" style={pt(28)}>
          Now see it for yourself →
        </p>
      </SlideFrame>
    ),
  },
  // ── 4 Live demo ────────────────────────────────────────────────────────────
  {
    title: "Live demo",
    part: "Live demo",
    body: (
      <SlideFrame title="Now watch it happen">
        <div className="grid flex-1 grid-cols-[360px_1fr] items-start gap-12">
          <div>
            <JoinQr size={340} />
            <p className="mt-3 font-bold" style={pt(24)}>
              Scan to join the line
            </p>
            <p className="text-muted" style={pt(18)}>
              tap-and-select.vercel.app/join
            </p>
          </div>
          <div className="grid gap-6">
            <a
              href="/kiosk"
              target="_blank"
              rel="noreferrer"
              className="flex h-[150px] flex-col justify-center rounded-card bg-accent px-8 text-paper transition-colors duration-200 ease-out hover:bg-ink"
            >
              <span className="font-bold" style={pt(28)}>
                The bus stop
              </span>
              <span className="opacity-90" style={pt(18)}>
                /kiosk
              </span>
            </a>
            <a
              href="/dashboard"
              target="_blank"
              rel="noreferrer"
              className="flex h-[150px] flex-col justify-center rounded-card border-2 border-ink bg-surface px-8 transition-colors duration-200 ease-out hover:bg-paper"
            >
              <span className="font-bold" style={pt(28)}>
                The control room
              </span>
              <span className="text-muted" style={pt(18)}>
                /dashboard
              </span>
            </a>
          </div>
        </div>
      </SlideFrame>
    ),
  },
  // ── 5 Conclusion & future work ─────────────────────────────────────────────
  {
    title: "Back to Alice",
    part: "Conclusion & future work",
    body: (
      <SlideFrame
        title={
          <>
            Today, the bus doesn&rsquo;t know Alice is waiting.{" "}
            <span className="text-accent">With Tap&amp;Select, it does.</span>
          </>
        }
      >
        <div className="mt-auto grid grid-cols-[520px_1fr] items-end gap-12">
          <Panel>
            <AliceBoards />
          </Panel>
          <dl className="space-y-4">
            {[
              ["Count", "Every stop counts its line."],
              ["Send", "Buses go where people wait."],
              ["Tell", "Everyone knows when the bus comes."],
            ].map(([head, text]) => (
              <div key={head}>
                <dt className="font-bold text-accent" style={pt(24)}>
                  {head}
                </dt>
                <dd style={pt(24)}>{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "Future work",
    part: "Conclusion & future work",
    body: (
      <SlideFrame title="Future work">
        <ul className="mt-4 grid flex-1 grid-cols-4 gap-8">
          {NEXT_STEPS.map(({ Icon, head, text }) => (
            <li key={head} className="flex flex-col items-start">
              <span className="flex h-28 w-28 items-center justify-center rounded-card bg-accent text-paper">
                <Icon aria-hidden className="h-14 w-14" strokeWidth={1.75} />
              </span>
              <span className="mt-5 block font-bold" style={pt(28)}>
                {head}
              </span>
              <span className="mt-1 block text-muted" style={pt(24)}>
                {text}
              </span>
            </li>
          ))}
        </ul>
      </SlideFrame>
    ),
  },
  // ── 6 Questions ────────────────────────────────────────────────────────────
  {
    title: "Questions",
    part: "Questions",
    body: (
      <SlideFrame>
        <div className="flex flex-1 flex-col justify-center">
          <RouteBand />
          <h2 className="mt-8 font-bold leading-none" style={pt(44)}>
            Questions?
          </h2>
          <p className="mt-6 font-bold leading-none text-accent" style={pt(72)}>
            Murakoze.
          </p>
          <p className="mt-12" style={pt(24)}>
            Tap&amp;Select · {TEAM.join(" · ")}
          </p>
          <p className="mt-1 text-muted" style={pt(18)}>
            Follow along: tap-and-select.vercel.app/live
          </p>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "References",
    part: "Questions",
    body: (
      <SlideFrame title="References">
        <References from={1} to={half} />
      </SlideFrame>
    ),
  },
  {
    title: "References (continued)",
    part: "Questions",
    body: (
      <SlideFrame title="References (continued)">
        <References from={half + 1} to={PITCH_REFERENCES.length} />
      </SlideFrame>
    ),
  },
];
