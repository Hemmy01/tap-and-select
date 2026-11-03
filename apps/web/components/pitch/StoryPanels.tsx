import { Bus, Pill } from "./IdeaStoryboard";
import { INK, MONO, Person, R2, SANS, SURFACE } from "./JourneyComic";

// Jack's story, the thread through the pitch: waiting (hook), unseen (gaps) and
// boarding (conclusion). Same characters, bus and style as the other two comics.

const MUTED = "var(--muted)";
const LINE = "var(--line)";

function Ground() {
  return <line x1="6" y1="168" x2="314" y2="168" stroke={LINE} strokeWidth="3" strokeLinecap="round" />;
}

function StopSign({ x }: { x: number }) {
  return (
    <g>
      <line x1={x} y1="62" x2={x} y2="168" stroke={INK} strokeWidth="4" />
      <rect x={x - 18} y="40" width="36" height="26" rx="4" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
      <text x={x} y="58" textAnchor="middle" fontSize="11" fill={INK} style={SANS}>
        Stop
      </text>
    </g>
  );
}

/** Hook: Jack alone at a stop from 6 PM to after 9 PM, the road empty. */
export function JackWaits() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label="Jack waits alone at a bus stop from 6 PM until after 9 PM; no bus comes">
      <Ground />
      <path d="M14 176 h30 M70 176 h30 M126 176 h30" stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      <StopSign x={262} />
      <g transform="translate(0 -14) scale(0.9)">
        <Person x={230} hand={[244, 132]} />
      </g>
      <Pill x={14} y={30} w={86}>
        6:00 PM
      </Pill>
      <path d="M57 62 v22 m-7 -8 l7 8 l7 -8" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Pill x={10} y={90} w={94}>
        9:00 PM+
      </Pill>
      <rect x="114" y="60" width="62" height="26" rx="13" fill={INK} />
      <text x="145" y="78" textAnchor="middle" fontSize="13" fill={SURFACE} style={SANS}>
        Jack
      </text>
      <path d="M176 73 h12" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Gaps: HQ tracks every bus live, but the person at the stop is invisible to it. */
export function NobodySeesJack() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label="HQ's screen tracks every bus live, but Jack at the stop is invisible to it">
      <Ground />
      <rect x="8" y="16" width="176" height="112" rx="8" fill={SURFACE} stroke={INK} strokeWidth="3" />
      <text x="96" y="36" textAnchor="middle" fontSize="12" fill={MUTED} style={SANS}>
        HQ: every bus, live
      </text>
      <path d="M22 96 C60 66 110 112 170 70" fill="none" stroke={R2} strokeWidth="5" strokeLinecap="round" />
      {[
        [44, 74],
        [116, 84],
      ].map(([x, y]) => (
        <g key={x}>
          <rect x={x} y={y} width="26" height="14" rx="3" fill={R2} stroke={INK} strokeWidth="2" />
          <circle cx={x + 13} cy={y - 8} r="3" fill={INK} />
        </g>
      ))}
      <rect x="86" y="128" width="20" height="20" fill={INK} />
      <rect x="62" y="146" width="68" height="8" rx="3" fill={INK} />
      <StopSign x={296} />
      <g opacity="0.3" transform="translate(0 -14) scale(0.9)">
        <Person x={278} hand={[292, 132]} />
      </g>
      <rect x="188" y="10" width="78" height="40" rx="10" fill={SURFACE} stroke={INK} strokeWidth="2.5" strokeDasharray="5 4" />
      <text x="227" y="37" textAnchor="middle" fontSize="20" fill={INK} style={SANS}>
        ?
      </text>
    </svg>
  );
}

/** Conclusion: the bus arrives and Jack boards with ticket R2-014. */
export function JackBoards() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label="The bus arrives and Jack boards with ticket R2-014">
      <Ground />
      <Bus x={156} y={90} doorOpen />
      <g transform="translate(0 -14) scale(0.9)">
        <Person x={100} hand={[176, 118]}>
          <rect x="168" y="104" width="16" height="24" rx="3" fill={SURFACE} stroke={INK} strokeWidth="2" transform="rotate(-12 176 116)" />
        </Person>
      </g>
      <rect x="132" y="14" width="180" height="28" rx="14" fill="var(--accent)" />
      <text x="222" y="33" textAnchor="middle" fontSize="13" fill={SURFACE} style={{ ...MONO, fontWeight: 700 }}>
        R2-014 · Now boarding
      </text>
      <rect x="4" y="92" width="56" height="26" rx="13" fill={INK} />
      <text x="32" y="110" textAnchor="middle" fontSize="13" fill={SURFACE} style={SANS}>
        Jack
      </text>
    </svg>
  );
}
