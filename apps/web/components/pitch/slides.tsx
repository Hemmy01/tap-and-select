// The pitch in six parts, one presenter each: hook & problem (Kenny's storyline: a cold
// "0", Alice, the problem, our survey, today's one-way fixes), the solution, how it works and
// what we measured, the live demo, conclusion & next steps, and questions; then the sources.
// Times New Roman throughout (the comic drawings keep their own lettering). Sizes are in
// points: title 44, main points 24–28, sources and citations 18.

import { CreditCard, MapPin, Mic, Sun } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { EveryoneSeesEta, HqSeesDemand, QueueAtStop } from "./IdeaStoryboard";
import { JourneyComic } from "./JourneyComic";
import { AliceBoards } from "./StoryPanels";
import { formatAccuracy, MODELS } from "@/lib/models";
import type { PitchPart } from "@/lib/pitch-nav";
import { PITCH_NUMBERS as N, pitchPercent, pitchValue } from "@/lib/pitch";
import { PITCH_REFERENCES, ReferenceLine, TEAM } from "./content";

export interface Slide {
  title: string;
  part: PitchPart;
  /** Navy background with white type (Kenny's cover, hook and Alice). */
  dark?: boolean;
  body: ReactNode;
}

/** A font size in points (CSS: 1 pt = 4/3 px on the 1280 × 720 canvas). */
const pt = (n: number) => ({ fontSize: `${n}pt` });

/** In-text citation, e.g. [1] or [1], [2]. */
function Cite({ n }: { n: number | readonly number[] }) {
  const list = typeof n === "number" ? [n] : n;
  return (
    <span className="ml-2 font-normal not-italic opacity-70" style={pt(18)}>
      [{list.join("], [")}]
    </span>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-bold leading-[1.1]" style={pt(44)}>
      {children}
    </h2>
  );
}

/** Light slide; content starts below the parts bar and stops above the footer. */
function Light({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="pitch-serif flex h-full flex-col px-16 pt-16 pb-20 text-ink">
      <Title>{title}</Title>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function Dark({ image = "navy", children }: { image?: "navy" | "cover"; children: ReactNode }) {
  return (
    <div
      className="pitch-serif flex h-full flex-col bg-[#101a3c] bg-cover bg-center px-16 pt-16 pb-20 text-white"
      style={{ backgroundImage: `url(/pitch/story/${image}.jpg)` }}
    >
      {children}
    </div>
  );
}

/** A big number, what it means, and its source. */
function Stat({ value, source, children }: { value: string; source: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="font-bold leading-none tabular-nums" style={pt(64)}>
        {value}
      </span>
      <span className="mt-3 flex-1 leading-snug" style={pt(24)}>
        {children}
      </span>
      <span className="mt-3 border-t border-line pt-2 leading-snug text-muted" style={pt(18)}>
        {source}
      </span>
    </div>
  );
}

function Picture({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) {
  return <Image src={src} alt={alt} width={width} height={height} unoptimized className={className} />;
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
  { stage: "Sense", text: "Alice says or swipes a stop at the kiosk.", Drawing: QueueAtStop },
  { stage: "Decide", text: "HQ sees the line and sends a bus.", Drawing: HqSeesDemand },
  { stage: "Inform", text: "Alice sees the ticket and when the bus comes.", Drawing: EveryoneSeesEta },
] as const;

const NEXT_STEPS = [
  { Icon: MapPin, head: "2–3 real stops", text: "One route, real commuters, one month" },
  { Icon: CreditCard, head: "Real card readers", text: "Linked to Tap&Go cards" },
  { Icon: Mic, head: "More voices", text: "Many accents, and Kinyarwanda" },
  { Icon: Sun, head: "Solar + mobile data", text: "A stop that runs on its own" },
] as const;

/** A real screenshot of one of our screens (public/pitch/screens), framed like a device. */
function Screen({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={`rounded-card border-4 border-ink bg-surface ${className ?? ""}`}
    />
  );
}

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

export const SLIDES: readonly Slide[] = [
  // ── 1 Hook & problem (Kenny) ───────────────────────────────────────────────
  {
    title: "Tap&Select",
    part: "Hook & problem",
    dark: true,
    body: (
      <Dark image="cover">
        <div className="flex h-full items-center justify-between">
          <div>
            <h1 className="font-bold leading-none" style={pt(44)}>
              Tap&amp;Select
            </h1>
            <p className="mt-6 font-bold" style={pt(28)}>
              Make every stop count.
            </p>
            <p className="mt-2 opacity-90" style={pt(24)}>
              Smart bus stops for Kigali
            </p>
            <p className="mt-12 opacity-90" style={pt(24)}>
              {TEAM.join(" · ")}
            </p>
            <p className="mt-1 opacity-70" style={pt(18)}>
              CMU-Africa Bridge Program 2026
            </p>
          </div>
          <div className="flex items-end gap-6">
            <Picture src="/pitch/story/card-hand.png" alt="A hand holding a bus card" width={250} height={359} />
            <Picture src="/pitch/story/reader.png" alt="A card reader on a pole" width={130} height={431} />
          </div>
        </div>
      </Dark>
    ),
  },
  {
    title: "How many can the system see?",
    part: "Hook & problem",
    dark: true,
    body: (
      <Dark>
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Title>How many waiting passengers can Kigali&rsquo;s bus system see?</Title>
          <p className="mt-4 font-bold leading-none" style={pt(200)}>
            0
          </p>
        </div>
      </Dark>
    ),
  },
  {
    title: "Meet Alice",
    part: "Hook & problem",
    dark: true,
    body: (
      <Dark>
        <Title>Meet Alice</Title>
        <div className="mt-4 grid min-h-0 flex-1 grid-cols-[300px_1fr] items-end gap-10">
          <Picture src="/pitch/story/alice.png" alt="Alice, waiting at the stop" width={300} height={457} />
          <div className="pb-2">
            <Picture src="/pitch/story/crowd.png" alt="A long line of people waiting" width={780} height={229} className="opacity-90" />
            <p className="mt-4 font-bold" style={pt(28)}>
              40 waiting at Remera.
            </p>
            <p className="font-bold" style={pt(28)}>
              10 seats left.
            </p>
            <p className="mt-6 italic" style={pt(28)}>
              You don&rsquo;t exist until you get on the bus.
              <Cite n={1} />
            </p>
            <p className="mt-2 opacity-70" style={pt(18)}>
              Alice is a composite of what commuters told us.
            </p>
          </div>
        </div>
      </Dark>
    ),
  },
  {
    title: "The problem",
    part: "Hook & problem",
    body: (
      <Light title="The problem">
        <p style={pt(28)}>Buses run on a timetable.</p>
        <p className="font-bold" style={pt(28)}>
          Nobody tells it who is waiting.
        </p>
        <div className="mt-auto grid grid-cols-2 gap-16">
          <Stat value="+30%" source={<>C. Nyandwi, The New Times (2026) [2]</>}>
            more passengers than last year
          </Stat>
          <Stat value="20%" source={<>The New Times (2026) [3]</>}>
            of daily trips by public transport, up from about 10%
          </Stat>
        </div>
      </Light>
    ),
  },
  {
    title: "We asked commuters",
    part: "Hook & problem",
    body: (
      <Light title="We asked commuters">
        <div className="grid flex-1 grid-cols-3 gap-12">
          <Stat value={pitchPercent(N.surveyLongWaits, N.surveyRespondents)} source={`${pitchValue(N.surveyLongWaits)} of ${pitchValue(N.surveyRespondents)}`}>
            say long waits keep them off the bus
          </Stat>
          <Stat value={pitchPercent(N.surveyUnsureWhen, N.surveyRespondents)} source={`${pitchValue(N.surveyUnsureWhen)} of ${pitchValue(N.surveyRespondents)}`}>
            don&rsquo;t know when the bus will arrive
          </Stat>
          <Stat value={pitchPercent(N.surveyToBusPark, N.surveyRespondents)} source={`${pitchValue(N.surveyToBusPark)} of ${pitchValue(N.surveyRespondents)}`}>
            go to a bus park on foot or by moto, to be sure of a bus
          </Stat>
        </div>
        <p className="mt-4 text-muted" style={pt(18)}>
          n = {pitchValue(N.surveyRespondents)} commuters surveyed in Kigali, 1–4 Nov 2026 [4]
        </p>
      </Light>
    ),
  },
  {
    title: "Today's fixes talk one way",
    part: "Hook & problem",
    body: (
      <Light title="Today’s fixes talk one way">
        <div className="grid grid-cols-3 gap-12">
          {FIXES.map((f) => (
            <div key={f.name}>
              <div className="flex h-[200px] items-center">
                <Picture src={f.img} alt={f.alt} width={f.w} height={f.h} className="max-h-[200px] w-auto rounded-xl object-contain" />
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
        <p className="mt-auto font-bold" style={pt(28)}>
          Nothing in use today counts who is waiting.
        </p>
        <p className="italic" style={pt(24)}>
          So we built the missing half.
        </p>
      </Light>
    ),
  },
  // ── 2 Solution ────────────────────────────────────────────────────────────
  {
    title: "The missing half",
    part: "Solution",
    body: (
      <Light title="The missing half: Tap&Select">
        <p style={pt(28)}>Every bus stop counts who is waiting, and tells the control room.</p>
        <div className="mt-auto grid grid-cols-3 gap-8">
          {SENSE_DECIDE_INFORM.map(({ stage, text, Drawing }) => (
            <div key={stage}>
              <div className="overflow-hidden rounded-card border border-line bg-paper [&>svg]:block [&>svg]:w-full">
                <Drawing />
              </div>
              <p className="mt-3 font-bold uppercase tracking-[0.08em]" style={pt(18)}>
                {stage}
              </p>
              <p className="leading-snug" style={pt(24)}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </Light>
    ),
  },
  {
    title: "At the stop",
    part: "Solution",
    body: (
      <Light title="At the stop: tap, say or swipe, get a ticket">
        <div className="flex flex-1 items-start justify-center">
          <Screen src="/pitch/screens/kiosk.jpg" alt="The kiosk screen: tap your card, then say or swipe your stop" width={820} height={461} />
        </div>
      </Light>
    ),
  },
  {
    title: "In the control room",
    part: "Solution",
    body: (
      <Light title="In the control room: every line, live">
        <div className="flex flex-1 items-start justify-center">
          <Screen src="/pitch/screens/dashboard.jpg" alt="The HQ dashboard: people waiting per stop, buses and recommendations" width={760} height={475} />
        </div>
      </Light>
    ),
  },
  {
    title: "On every phone",
    part: "Solution",
    body: (
      <Light title="On every phone">
        <div className="flex flex-1 items-start justify-center gap-16">
          {[
            { src: "/pitch/screens/join.jpg", alt: "The join page on a phone: pick your stop", label: "Passengers join the line" },
            { src: "/pitch/screens/bus.jpg", alt: "The driver's page on a phone: pick your bus", label: "Drivers share where the bus is" },
          ].map((p) => (
            <figure key={p.src} className="text-center">
              <Screen src={p.src} alt={p.alt} width={250} height={449} />
              <figcaption className="mt-3" style={pt(24)}>
                {p.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </Light>
    ),
  },
  // ── 3 How it works · does it work ─────────────────────────────────────────────
  {
    title: "How it works",
    part: "How it works",
    body: (
      <Light title="How it works">
        <div className="mt-2">
          <JourneyComic />
        </div>
      </Light>
    ),
  },
  {
    title: "Does it work?",
    part: "How it works",
    body: (
      <Light title="Does it work? What we measured">
        <div className="grid flex-1 grid-cols-3 gap-12">
          <Stat value={pitchPercent(N.swipeCorrect, N.swipeTries)} source="Our tests on the board">
            of hand swipes picked the right stop ({pitchValue(N.swipeCorrect)} of {pitchValue(N.swipeTries)})
          </Stat>
          <Stat value={formatAccuracy(voiceNew)} source="Our model in Edge Impulse">
            of stop names understood, from a voice it never heard
          </Stat>
          <Stat value={pitchValue(N.modelRamKb, " KB")} source="Edge Impulse">
            of memory runs the voice model on the board, no internet
          </Stat>
        </div>
        <p className="mt-4 font-bold" style={pt(28)}>
          Now see it for yourself →
        </p>
      </Light>
    ),
  },
  // ── 4 Demo ────────────────────────────────────────────────────────────────
  {
    title: "Live demo",
    part: "Demo",
    body: (
      <Light title="Now watch it happen">
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
      </Light>
    ),
  },
  // ── 5 Conclusion & next ───────────────────────────────────────────────────
  {
    title: "Back to Alice",
    part: "Conclusion & next",
    body: (
      <Light title="Today, the bus doesn’t know Alice is waiting. With Tap&Select, it does.">
        <div className="mt-auto grid grid-cols-[480px_1fr] items-end gap-12">
          <figure className="overflow-hidden rounded-card border border-line bg-paper [&>svg]:block [&>svg]:w-full">
            <AliceBoards />
          </figure>
          <dl className="space-y-4">
            <div>
              <dt className="font-bold" style={pt(24)}>
                Sense
              </dt>
              <dd style={pt(24)}>Every stop counts its line.</dd>
            </div>
            <div>
              <dt className="font-bold" style={pt(24)}>
                Decide
              </dt>
              <dd style={pt(24)}>HQ sends buses where people wait.</dd>
            </div>
            <div>
              <dt className="font-bold" style={pt(24)}>
                Inform
              </dt>
              <dd style={pt(24)}>Everyone knows when the bus comes.</dd>
            </div>
          </dl>
        </div>
      </Light>
    ),
  },
  {
    title: "What's next",
    part: "Conclusion & next",
    body: (
      <Light title="What’s next">
        <ul className="mt-4 grid flex-1 grid-cols-4 gap-8">
          {NEXT_STEPS.map(({ Icon, head, text }) => (
            <li key={head} className="flex flex-col items-start">
              <span className="flex h-28 w-28 items-center justify-center rounded-card bg-ink text-paper">
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
      </Light>
    ),
  },
  // ── 6 Questions ───────────────────────────────────────────────────────────
  {
    title: "Questions",
    part: "Questions",
    dark: true,
    body: (
      <Dark image="cover">
        <div className="flex h-full flex-col justify-center">
          <Title>Questions?</Title>
          <p className="mt-6 font-bold leading-none" style={pt(72)}>
            Murakoze.
          </p>
          <p className="mt-12 opacity-90" style={pt(24)}>
            Tap&amp;Select · {TEAM.join(" · ")}
          </p>
          <p className="mt-1 opacity-70" style={pt(18)}>
            Follow along: tap-and-select.vercel.app/live
          </p>
        </div>
      </Dark>
    ),
  },
  {
    title: "References",
    part: "Questions",
    body: (
      <Light title="References">
        <References from={1} to={half} />
      </Light>
    ),
  },
  {
    title: "References (continued)",
    part: "Questions",
    body: (
      <Light title="References (continued)">
        <References from={half + 1} to={PITCH_REFERENCES.length} />
      </Light>
    ),
  },
];
