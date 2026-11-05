import { Bus } from "./IdeaStoryboard";
import { INK, MONO, Person, SANS, SURFACE } from "./JourneyComic";

// Alice's story ends here: the bus arrives and Alice boards (conclusion slide). Same
// characters, bus and style as the other two comics.

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
        Alice
      </text>
    </svg>
  );
}
