import { useId } from "react";
import { appearanceFor, type TraitFish } from "@/lib/goldfish-traits";

const hues = { beni: "#ee693f", sakura: "#ec9a88", sumi: "#17232a", tancho: "#f8f0df", milk: "#f0dfb1", lemon: "#e8c54c", calico: "#9ab8bd", lavender: "#a492bc" };

// Lightweight observation diagram for the field guide and collection, not a photo.
export function GoldfishDiagram({ fish, examplePattern }: { fish: TraitFish; examplePattern?: string }) {
  const clip = useId().replace(/:/g, "");
  const a = appearanceFor(fish);
  const rx = a.body === "round" ? 30 : a.body === "tall" ? 34 : 44;
  const ry = a.body === "round" ? 31 : a.body === "tall" ? 30 : 22;
  const base = a.marking === "tancho" ? "#f8f0df" : hues[fish.colorId];
  const accent = examplePattern === "rokurin" ? "#ed633e" : base;
  const body = a.body === "tall" ? "M48 49 Q67 17 91 17 Q112 32 128 49 Q112 80 87 79 Q65 78 48 49Z" : undefined;
  return <svg viewBox="0 0 180 100" className="goldfish-diagram" aria-hidden="true">
    <defs><clipPath id={clip}>{body ? <path d={body} /> : <ellipse cx="91" cy="50" rx={rx} ry={ry} />}</clipPath></defs>
    <g fill={accent} stroke={accent} strokeLinejoin="round">
      {a.tail === "funa" || a.tail === "long" ? <path d={a.tail === "long" ? "M59 49 Q22 27 3 10 Q13 40 27 50 Q13 60 3 90 Q22 73 59 51Z" : "M56 48 Q27 29 17 23 L28 50 L17 77 Q27 71 56 52Z"} /> : <>
        <path d="M58 50 Q33 14 13 24 L19 43 L8 50 L19 57 L13 76 Q33 86 58 50Z" opacity=".85" />
        {a.tail === "butterfly" && <path d="M58 50 Q24 1 4 20 L15 42 L4 50 L15 58 L4 80 Q24 99 58 50Z" opacity=".55" />}
      </>}
      {a.dorsal && <path d="M72 29 Q81 0 103 9 L110 32Z" opacity=".85" />}
    </g>
    {body ? <path d={body} fill={base} /> : <ellipse cx="91" cy="50" rx={rx} ry={ry} fill={base} />}
    <g clipPath={`url(#${clip})`}>
      {(a.marking === "sarasa" || a.marking === "calico") && <g fill="#fff1dc"><ellipse cx="78" cy="29" rx="15" ry="20" /><ellipse cx="98" cy="70" rx="17" ry="14" /></g>}
      {a.marking === "calico" && <g><circle cx="61" cy="52" r="10" fill="#ed633e" /><circle cx="98" cy="39" r="9" fill="#17232a" /><circle cx="113" cy="60" r="5" fill="#17232a" /></g>}
      {a.marking === "redBlack" && <g fill={fish.colorId === "sumi" ? "#ed633e" : "#17232a"}><ellipse cx="72" cy="50" rx="10" ry="21" /><circle cx="103" cy="32" r="9" /></g>}
      {a.marking === "tancho" && <ellipse cx="115" cy="26" rx="18" ry="17" fill="#e9573e" />}
      {examplePattern === "rokurin" && <ellipse cx="126" cy="52" rx="7" ry="9" fill="#e9573e" />}
      {examplePattern === "tiger" && <g fill="#18242a"><path d="M62 20 L70 25 L69 70 L61 74 L66 44Z" /><path d="M84 19 L89 28 L84 68 L78 72 L82 39Z" /><path d="M101 20 L106 24 L101 71 L96 72Z" /></g>}
      {examplePattern === "kirin" && [59, 67, 75, 83, 91, 99, 107, 115].flatMap((x, i) => [30, 39, 48, 57, 66].map((y) => <path key={`${x}-${y}`} d={`M${x - 2} ${y + i % 2 * 3} q4 5 8 0`} fill="none" stroke="#17232a" strokeWidth="1.7" />))}
      {a.pearlScales && [65, 77, 89, 101].flatMap((x, i) => [36, 48, 60].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y + i % 2 * 4} r="3.8" fill="#fff5cf" />))}
      {a.luster !== "transparent" && <path d="M61 39 Q78 22 99 30" fill="none" stroke="#ffffff" strokeWidth={a.luster === "metallic" ? 4 : 2} opacity=".38" />}
      {(a.luster === "mosaic" || a.luster === "net") && [69, 86, 103].map((x) => <path key={x} d={`M${x} 38 l5 3 l-5 7 l-5 -3Z`} fill="#e1eeea" opacity=".65" />)}
    </g>
    <path d="M91 65 Q106 88 111 69" fill={accent} opacity=".85" />
    {a.hood && <g fill={a.marking === "tancho" ? "#e9573e" : accent}><circle cx="116" cy="27" r="9" /><circle cx="107" cy="22" r="7" /><circle cx="124" cy="28" r="6" /></g>}
    <circle cx="119" cy="44" r={a.telescope ? 8 : 4} fill="#080f13" />
  </svg>;
}

export function TailDiagram({ kind }: { kind: string }) {
  const top = ["three", "four", "flat", "curled", "butterfly"].includes(kind);
  return <svg viewBox="0 0 180 105" className="tail-diagram" aria-hidden="true">
    <g fill="#f8b673" stroke="#e68351" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M142 42 L160 36 L165 56 L145 60Z" fill="#dc6944" />
      {kind === "funa" && <path d="M144 51 Q96 40 61 15 L81 51 L61 86 Q96 65 144 51Z" />}
      {kind === "long" && <path d="M144 51 Q63 31 22 6 Q36 39 74 51 Q36 63 22 96 Q63 71 144 51Z" />}
      {kind === "heart" && <path d="M144 51 C40 -26 5 10 38 51 C5 92 40 128 144 51Z" />}
      {["three", "four", "flat", "butterfly", "curled"].includes(kind) && <>
        <path d={kind === "flat" || kind === "curled" ? "M145 51 Q83 13 38 8 Q42 33 74 51 Q42 70 38 94 Q83 89 145 51Z" : "M145 51 Q79 -2 25 15 L41 44 L23 51 L41 58 L25 87 Q79 104 145 51Z"} />
        {kind === "four" && <path d="M24 51 L83 47 L104 51 L83 55Z" fill="#17434e" stroke="none" />}
        {kind === "butterfly" && <path d="M145 51 Q75 -6 16 11 Q4 34 35 51 Q4 68 16 91 Q75 108 145 51Z" opacity=".45" />}
        {kind === "curled" && <path d="M39 9 C69 5 77 27 54 28 M39 93 C69 97 77 75 54 74" fill="none" stroke="#fff0bf" strokeWidth="7" />}
      </>}
      {kind === "peacock" && <path d="M92 51 L47 8 Q17 25 72 51 Q17 78 47 96 L92 59 L137 96 Q167 78 111 51 Q167 25 137 8Z" />}
    </g>
    <text x="165" y="103" textAnchor="end" fill="#a8cecf" fontSize="10">{kind === "peacock" ? "後ろから" : top ? "上から" : "横から"}</text>
  </svg>;
}
