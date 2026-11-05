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
      <AliceTag x={14} y={8} />
    </svg>
  );
}
