// The pitch in six parts, one presenter each: problem statement (Kenny's storyline: a cold
// "0", Alice, the problem, our survey, today's one-way fixes), our solution, how it works and
// what we measured, the live demo, conclusion & future work (what it's worth, looking ahead,
// the close), and questions;
// then the sources. Alice is the same comic character on every slide.
// System colours only: ink on paper, red for the problem, green for what we bring and measured,
// muted for sources. Times New Roman; sizes in points: title 44, main points 24–28, sources 18.

import { CalendarDays, ChartColumnIncreasing, ChevronRight, MapPin, MessageSquareText, Radar, Route, Smartphone } from "lucide-react";
import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import { JourneyComic, TapCardPanel } from "./JourneyComic";
import { AliceBoards, AliceWaits, EveryoneCounted } from "./StoryPanels";
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
  { stage: "Sense", text: "Count who is waiting", Icon: Radar },
  { stage: "Decide", text: "Release a bus", Icon: ChartColumnIncreasing },
  { stage: "Inform", text: "Queue number and live ETA", Icon: Smartphone },
] as const;

// "What it's worth": both figures are estimates and say so on the slide.
/** Bus users on a workday, City of Kigali via The New Times (May 2026), ref [7]. */
const RIDERS_PER_WORKDAY = 230_000;
const MOTO_FARE = 500;
const WORKDAYS = 22;
/** Conservative: only 1 in 10 of the riders who pay a moto switches to the bus. */
const SWITCH_SHARE = 0.1;
const MOTO_MONEY_MILLIONS =
  N.surveyMoto !== null && N.surveyRespondents
    ? Math.round(
        (RIDERS_PER_WORKDAY * (N.surveyMoto / N.surveyRespondents) * SWITCH_SHARE * MOTO_FARE * WORKDAYS) / 10_000_000,
      ) * 10
    : "—";
/** Walk or take a moto to a bus park to be sure of a bus: 38 of 71 is 53.5%, shown as 53%. */
const TO_BUS_PARK_PCT =
  N.surveyToBusPark !== null && N.surveyRespondents ? `${Math.floor((N.surveyToBusPark / N.surveyRespondents) * 100)}%` : "—";
const EMPTY_SEATS_LOW = 26;
const EMPTY_SEATS_HIGH = 30;
/** A long-route fare (the 25 km fare is 855 RWF), ref [8]. */
const LONG_FARE = 800;
const seatLoss = (seats: number) => (seats * LONG_FARE).toLocaleString("en-US");

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
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-4">
          {SENSE_DECIDE_INFORM.map(({ stage, text, Icon }, i) => (
            <Fragment key={stage}>
              {i > 0 ? <ChevronRight aria-hidden className="h-10 w-10 self-center text-accent" strokeWidth={3} /> : null}
              <div className="flex flex-col items-center rounded-card border border-line bg-surface px-6 py-8 text-center">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-ink text-paper">
                  <Icon aria-hidden className="h-12 w-12" strokeWidth={1.75} />
                </span>
                <p className="mt-5 font-bold" style={pt(36)}>
                  {stage}
                </p>
                <p className="mt-2 leading-snug" style={pt(24)}>
                  {text}
                </p>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="mt-auto rounded-card border border-accent bg-surface px-8 py-5">
          <p className="font-bold leading-snug" style={pt(28)}>
            Demand-based scheduling cut waiting by up to <span className="text-accent">80%</span> in simulation
          </p>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "Everyone exists now",
    part: "Our solution",
    body: (
      <SlideFrame title="Alice exists now. So does everyone at the bus stop.">
        <div className="mt-2 grid flex-1 grid-cols-[700px_1fr] items-center gap-12">
          <Panel>
            <EveryoneCounted />
          </Panel>
          <div>
            <p className="leading-snug" style={pt(28)}>
              Every person waiting is <span className="font-bold text-accent">counted and seen</span>.
            </p>
            <p className="mt-8 font-bold uppercase tracking-[0.08em] text-muted" style={pt(18)}>
              Inclusion
            </p>
            <p className="mt-2 flex items-start gap-4 leading-snug" style={pt(26)}>
              <MessageSquareText aria-hidden className="mt-1 h-9 w-9 shrink-0 text-accent" strokeWidth={1.75} />
              <span>SMS updates are on our roadmap, so no smartphone is needed.</span>
            </p>
          </div>
        </div>
      </SlideFrame>
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
    title: "What it's worth",
    part: "Conclusion & future work",
    body: (
      <SlideFrame title="What it’s worth">
        <div className="mt-2 grid flex-1 grid-cols-2 gap-16">
          <div className="flex flex-col">
            <p className="leading-snug" style={pt(24)}>
              <span className="font-bold text-danger">{TO_BUS_PARK_PCT}</span> of commuters we asked go to a bus park, on
              foot or by moto, just to be sure of a bus; {pitchPercent(N.surveyMoto, N.surveyRespondents)} pay a moto
              <Cite n={4} />
            </p>
            <p className="mt-6 whitespace-nowrap font-bold leading-none tabular-nums text-accent" style={pt(44)}>
              ≈ {MOTO_MONEY_MILLIONS} million RWF
            </p>
            <p className="mt-3 leading-snug" style={pt(24)}>
              a month could stay in workers&rsquo; pockets
            </p>
            <p className="mt-auto border-t border-line pt-2 leading-snug text-muted" style={pt(18)}>
              Conservative estimate: {RIDERS_PER_WORKDAY.toLocaleString("en-US")} bus riders a workday [7] ×{" "}
              {pitchPercent(N.surveyMoto, N.surveyRespondents)} pay a moto × only 1 in 10 switching × {MOTO_FARE} RWF ×{" "}
              {WORKDAYS} workdays
            </p>
          </div>
          <div className="flex flex-col">
            <p className="leading-snug" style={pt(24)}>
              A bus that leaves with{" "}
              <span className="font-bold text-danger">
                {EMPTY_SEATS_LOW}–{EMPTY_SEATS_HIGH} empty seats
              </span>{" "}
              on a long route (about {LONG_FARE} RWF a seat
              <Cite n={8} />) loses
            </p>
            <p className="mt-6 whitespace-nowrap font-bold leading-none tabular-nums text-accent" style={pt(44)}>
              ≈ 20,000–25,000 RWF
            </p>
            <p className="mt-3 leading-snug" style={pt(24)}>
              every trip. <span className="font-bold">We fill those seats.</span>
            </p>
            <p className="mt-auto border-t border-line pt-2 leading-snug text-muted" style={pt(18)}>
              Estimate: {EMPTY_SEATS_LOW}–{EMPTY_SEATS_HIGH} seats × {LONG_FARE} RWF = {seatLoss(EMPTY_SEATS_LOW)}–
              {seatLoss(EMPTY_SEATS_HIGH)} RWF (fares run 182–855 RWF by distance)
            </p>
          </div>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "Looking ahead",
    part: "Conclusion & future work",
    body: (
      <SlideFrame title="Looking ahead">
        <div className="grid flex-1 grid-cols-2 gap-16">
          <div>
            <p className="font-bold uppercase tracking-[0.08em] text-muted" style={pt(18)}>
              In 15 years
            </p>
            <p className="mt-3 font-bold leading-snug" style={pt(28)}>
              Our data tells the city where to build new stops.
            </p>
            <p className="mt-4 leading-snug text-accent" style={pt(24)}>
              Less guessing. Less traffic. A smarter city.
            </p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-[0.08em] text-muted" style={pt(18)}>
              To start, we just need
            </p>
            <ul className="mt-3 space-y-4">
              {[
                { Icon: CalendarDays, text: "30 days" },
                { Icon: Route, text: "One route" },
                { Icon: MapPin, text: "Three stops" },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-5">
                  <span className="flex h-16 w-16 items-center justify-center rounded-card bg-accent text-paper">
                    <Icon aria-hidden className="h-8 w-8" strokeWidth={1.75} />
                  </span>
                  <span className="font-bold" style={pt(28)}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SlideFrame>
    ),
  },
  {
    title: "Tap, and go home",
    part: "Conclusion & future work",
    body: (
      <SlideFrame>
        <div className="grid flex-1 grid-cols-[1fr_500px] items-center gap-12">
          <div>
            <p className="leading-snug" style={pt(28)}>
              Alice shouldn&rsquo;t pay the moto.
            </p>
            <p className="leading-snug" style={pt(28)}>
              She shouldn&rsquo;t wait in the dark.
            </p>
            <p className="mt-4 font-bold leading-snug text-accent" style={pt(28)}>
              She should just tap, and go home.
            </p>
            <p className="mt-10 font-bold" style={pt(44)}>
              Tap&amp;Select
            </p>
            <p className="font-bold text-accent" style={pt(28)}>
              Make every stop count. Murakoze.
            </p>
          </div>
          <Panel>
            <AliceBoards />
          </Panel>
        </div>
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
          <h2 className="mt-8 font-bold leading-none" style={pt(72)}>
            Questions?
          </h2>
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
