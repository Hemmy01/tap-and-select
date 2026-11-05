import { Bus } from "./IdeaStoryboard";
import { Alice, AliceTag, INK, MONO, Person, SURFACE } from "./JourneyComic";

// Alice's own panels: waiting at the back of a long line (hook) and boarding (conclusion).
// Same Alice, bus and style as the other two comics.

const LINE = "var(--line)";

function Ground() {
  return <line x1="6" y1="168" x2="314" y2="168" stroke={LINE} strokeWidth="3" strokeLinecap="round" />;
}

/** Conclusion: the bus arrives and Alice boards with ticket R2-014. */
export function AliceBoards() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label="The bus arrives and Alice boards with ticket R2-014">
      <Ground />
      <Bus x={156} y={90} doorOpen />
      <g transform="translate(0 -14) scale(0.9)">
        <Alice x={100} hand={[176, 118]}>
          <rect x="168" y="104" width="16" height="24" rx="3" fill={SURFACE} stroke={INK} strokeWidth="2" transform="rotate(-12 176 116)" />
        </Alice>
      </g>
      <rect x="132" y="14" width="180" height="28" rx="14" fill="var(--accent)" />
      <text x="222" y="33" textAnchor="middle" fontSize="13" fill={SURFACE} style={{ ...MONO, fontWeight: 700 }}>
        R2-014 · Now boarding
      </text>
      <AliceTag x={4} y={92} />
    </svg>
  );
}

/** Hook: Alice at the back of a long line at the Remera stop. */
export function AliceWaits() {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label="Alice waits at the back of a long line at the Remera stop">
      <Ground />
      <line x1="300" y1="62" x2="300" y2="168" stroke={INK} strokeWidth="4" />
      <rect x="276" y="36" width="44" height="28" rx="4" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
      <rect x="282" y="42" width="32" height="16" rx="3" fill="var(--route-2)" />
      <text x="298" y="54" textAnchor="middle" fontSize="11" fill={SURFACE} style={{ ...MONO, fontWeight: 700 }}>
        R2
      </text>
      <g opacity="0.55">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(${96 + i * 30} 60) scale(0.6)`}>
            <Person x={20} hand={[30, 130]} />
          </g>
        ))}
      </g>
      <g transform="translate(-4 -6) scale(0.95)">
        <Alice x={50} hand={[62, 128]} />
      </g>
      <AliceTag x={68} y={30} />
    </svg>
  );
}

/**
 * "Alice exists now, and so does everyone": the same line as AliceWaits, but every person
 * gets a ticket, one after another, then the stop's count appears. The animation only plays
 * with motion allowed; otherwise (and in print) everything is shown at once.
 */
export function EveryoneCounted() {
  const people = [0, 1, 2, 3, 4, 5];
  const step = 0.35;
  const pop = (i: number) => ({
    className: "motion-safe:animate-[comic-count_300ms_ease-out_both]",
    style: { animationDelay: `${0.3 + i * step}s`, transformBox: "fill-box", transformOrigin: "center" } as const,
  });
  const tag = (x: number, y: number, code: string, i: number) => (
    <g {...pop(i)}>
      <rect x={x - 20} y={y} width="40" height="18" rx="9" fill="var(--accent)" />
      <text x={x} y={y + 13} textAnchor="middle" fontSize="10" fill={SURFACE} style={{ ...MONO, fontWeight: 700 }}>
        {code}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label="Everyone in the line at the Remera stop gets a ticket, Alice too; the stop counts 7 waiting">
      <Ground />
      <line x1="300" y1="62" x2="300" y2="168" stroke={INK} strokeWidth="4" />
      <rect x="276" y="36" width="44" height="28" rx="4" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
      <rect x="282" y="42" width="32" height="16" rx="3" fill="var(--route-2)" />
      <text x="298" y="54" textAnchor="middle" fontSize="11" fill={SURFACE} style={{ ...MONO, fontWeight: 700 }}>
        R2
      </text>
      {people.map((i) => (
        <g key={i} transform={`translate(${96 + i * 30} 60) scale(0.6)`}>
          <Person x={20} hand={[30, 130]} />
        </g>
      ))}
      <g transform="translate(-4 -6) scale(0.95)">
        <Alice x={50} hand={[62, 128]} />
      </g>
      {/* Front of the line first (by the sign), Alice last. */}
      {people.map((i) => tag(108 + i * 30, 64, `0${String(13 - i).padStart(2, "0")}`, people.length - 1 - i))}
      {tag(44, 8, "014", people.length)}
      <g {...pop(people.length + 1.5)}>
        <rect x="140" y="8" width="132" height="26" rx="13" fill={INK} />
        <text x="206" y="25" textAnchor="middle" fontSize="12" fill={SURFACE} style={{ ...MONO, fontWeight: 700 }}>
          7 waiting · seen
        </text>
      </g>
    </svg>
  );
}
