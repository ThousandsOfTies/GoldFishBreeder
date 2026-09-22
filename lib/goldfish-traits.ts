// A deliberately simplified game model, not a genetic prediction for real fish.
export type ShapeId = "wakin" | "ryukin" | "demekin" | "oranda" | "ranchu" | "comet" | "pearl" | "butterfly";
export type ColorId = "beni" | "sakura" | "sumi" | "tancho" | "milk" | "lemon" | "calico" | "lavender";
export type BodyAllele = "slender" | "tall" | "round";
export type TailAllele = "standard" | "funa" | "long" | "butterfly";
export type OnOffAllele = "on" | "off";
export type LusterAllele = "metallic" | "transparent" | "net";
export type Luster = LusterAllele | "mosaic";
export type Marking = "solid" | "sarasa" | "calico" | "tancho" | "redBlack";
export type Pair<T> = [T, T];
export type FishGenome = {
  body: Pair<BodyAllele>;
  tail: Pair<TailAllele>;
  telescope: Pair<OnOffAllele>;
  dorsal: Pair<OnOffAllele>;
  hood: Pair<OnOffAllele>;
  pearlScales: Pair<OnOffAllele>;
  color: Pair<ColorId>;
  luster?: Pair<LusterAllele>;
  marking?: Pair<Marking>;
};
export type TraitFish = {
  shapeId: ShapeId;
  colorId: ColorId;
  seed?: number;
  genome?: FishGenome;
  marking?: Marking;
};
export type CompleteGenome = FishGenome & { luster: Pair<LusterAllele>; marking: Pair<Marking> };
export const BODY_LABELS: Record<BodyAllele, string> = { slender: "すらり体形", tall: "背高の体形", round: "まるい体形" };
export const TAIL_LABELS: Record<TailAllele, string> = { standard: "三つ尾", funa: "フナ尾", long: "ふき流し尾", butterfly: "蝶尾" };
export const LUSTER_LABELS: Record<Luster, string> = { metallic: "普通鱗", transparent: "透明鱗", net: "網透明鱗", mosaic: "モザイク透明鱗性" };
export const MARKING_LABELS: Record<Marking, string> = { solid: "単色", sarasa: "更紗（さらさ）", calico: "キャリコ", tancho: "丹頂（たんちょう）", redBlack: "赤黒" };
export const COLOR_LABELS: Record<ColorId, string> = { beni: "赤・オレンジ", sakura: "淡い赤", sumi: "黒", tancho: "白", milk: "クリーム白", lemon: "黄", calico: "あさぎ色", lavender: "うす紫（ゲーム色）" };
export const pair = <T,>(value: T): Pair<T> => [value, value];
export const hasDouble = <T,>(value: Pair<T>, allele: T) => value[0] === allele && value[1] === allele;

function legacyMarking(shape: ShapeId, color: ColorId): Marking {
  if (color === "sakura" || color === "lavender") return "sarasa";
  if (color === "calico") return "calico";
  if (color === "tancho") return "tancho";
  if (color === "sumi" && shape !== "demekin") return "redBlack";
  return "solid";
}

export function legacyGenome(shape: ShapeId, color: ColorId): CompleteGenome {
  const base: CompleteGenome = {
    body: pair("slender"), tail: pair("standard"), telescope: pair("off"), dorsal: pair("on"),
    hood: pair("off"), pearlScales: pair("off"), color: pair(color),
    luster: color === "calico" ? ["metallic", "transparent"] : pair(color === "sakura" ? "transparent" : "metallic"),
    marking: pair(legacyMarking(shape, color)),
  };
  if (shape === "wakin") base.tail = pair("funa");
  if (shape === "ryukin") base.body = pair("tall");
  if (shape === "demekin") base.telescope = pair("on");
  if (shape === "oranda") { base.body = pair("tall"); base.hood = pair("on"); }
  if (shape === "ranchu") { base.body = pair("round"); base.dorsal = pair("off"); }
  if (shape === "comet") base.tail = pair("long");
  if (shape === "pearl") { base.body = pair("round"); base.pearlScales = pair("on"); }
  if (shape === "butterfly") { base.body = pair("tall"); base.tail = pair("butterfly"); }
  return base;
}

export function genomeFor(fish: TraitFish): CompleteGenome {
  const base = legacyGenome(fish.shapeId, fish.colorId);
  const old = fish.genome;
  if (!old) return base;
  return {
    ...old,
    // Version 2 used "standard" for both single and fancy tails.
    tail: !old.luster && fish.shapeId === "wakin" && hasDouble(old.tail, "standard") ? pair("funa") : old.tail,
    luster: old.luster ?? base.luster,
    marking: old.marking ?? base.marking,
  };
}

export function lusterFromPair(value: Pair<LusterAllele>): Luster {
  return value[0] === value[1] ? value[0] : "mosaic";
}

export function appearanceFor(fish: TraitFish) {
  const genome = genomeFor(fish);
  const body: BodyAllele = hasDouble(genome.body, "round") ? "round" : hasDouble(genome.body, "tall") ? "tall" : "slender";
  // These dominance rules are explicitly game rules.
  const tail: TailAllele = hasDouble(genome.tail, "butterfly") ? "butterfly" : hasDouble(genome.tail, "long") ? "long" : genome.tail.includes("funa") ? "funa" : "standard";
  return {
    body, tail,
    telescope: hasDouble(genome.telescope, "on"),
    dorsal: !hasDouble(genome.dorsal, "off"),
    hood: hasDouble(genome.hood, "on"),
    pearlScales: hasDouble(genome.pearlScales, "on"),
    luster: lusterFromPair(genome.luster),
    marking: fish.marking ?? legacyMarking(fish.shapeId, fish.colorId),
  };
}

export function speciesKey(fish: TraitFish): string {
  const a = appearanceFor(fish);
  return ["traits3", a.body, a.tail, +a.telescope, +a.dorsal, +a.hood, +a.pearlScales, a.luster, fish.colorId, a.marking].join("__");
}

export function visibleTraits(fish: TraitFish) {
  const a = appearanceFor(fish);
  return [BODY_LABELS[a.body], TAIL_LABELS[a.tail], a.telescope ? "出目" : "普通の目", a.dorsal ? "背びれあり" : "背びれなし", a.hood ? "肉瘤あり" : "肉瘤なし", ...(a.pearlScales ? ["パール鱗"] : []), LUSTER_LABELS[a.luster], COLOR_LABELS[fish.colorId], MARKING_LABELS[a.marking]];
}

function inherit<T>(a: Pair<T>, b: Pair<T>, random: () => number): Pair<T> {
  return [a[Math.floor(random() * 2)], b[Math.floor(random() * 2)]];
}

export function breedGenomes(first: TraitFish, second: TraitFish, random = Math.random): CompleteGenome {
  const a = genomeFor(first), b = genomeFor(second);
  return {
    body: inherit(a.body, b.body, random), tail: inherit(a.tail, b.tail, random),
    telescope: inherit(a.telescope, b.telescope, random), dorsal: inherit(a.dorsal, b.dorsal, random),
    hood: inherit(a.hood, b.hood, random), pearlScales: inherit(a.pearlScales, b.pearlScales, random),
    color: inherit(a.color, b.color, random), luster: inherit(a.luster, b.luster, random), marking: inherit(a.marking, b.marking, random),
  };
}

export function phenotypeFromGenome(genome: CompleteGenome, random = Math.random): Pick<TraitFish, "shapeId" | "colorId" | "marking"> {
  // shapeId remains a convenient family label. Rendering uses ALL traits.
  const shapeId: ShapeId = hasDouble(genome.telescope, "on") ? "demekin"
    : hasDouble(genome.dorsal, "off") ? "ranchu"
    : hasDouble(genome.hood, "on") ? "oranda"
    : hasDouble(genome.body, "round") && hasDouble(genome.pearlScales, "on") ? "pearl"
    : hasDouble(genome.tail, "butterfly") ? "butterfly"
    : hasDouble(genome.tail, "long") ? "comet"
    : hasDouble(genome.body, "tall") ? "ryukin" : "wakin";
  return { shapeId, colorId: genome.color[Math.floor(random() * 2)], marking: genome.marking[Math.floor(random() * 2)] };
}

function outcomes<T, R extends string>(a: Pair<T>, b: Pair<T>, resolve: (value: Pair<T>) => R): Array<[R, number]> {
  const weights = new Map<R, number>();
  for (const x of a) for (const y of b) { const key = resolve([x, y]); weights.set(key, (weights.get(key) ?? 0) + 0.25); }
  return [...weights.entries()];
}
function pickedOutcomes<T extends string>(a: Pair<T>, b: Pair<T>, labels: Record<T, string>) {
  const weights = new Map<string, number>();
  for (const key of [...a, ...b]) weights.set(labels[key], (weights.get(labels[key]) ?? 0) + 0.25);
  return [...weights.entries()];
}

export function forecastTraits(first: TraitFish, second: TraitFish) {
  const a = genomeFor(first), b = genomeFor(second);
  const chance = <T,>(x: Pair<T>, y: Pair<T>, value: T) => x.filter((v) => v === value).length * y.filter((v) => v === value).length / 4;
  const predictions: Array<[string, number]> = [
    ["出目", chance(a.telescope, b.telescope, "on")], ["背びれなし", chance(a.dorsal, b.dorsal, "off")],
    ["肉瘤あり", chance(a.hood, b.hood, "on")], ["パール鱗", chance(a.pearlScales, b.pearlScales, "on")],
    ["まるい体形", chance(a.body, b.body, "round")], ["背高の体形", chance(a.body, b.body, "tall")],
    ["蝶尾", chance(a.tail, b.tail, "butterfly")], ["ふき流し尾", chance(a.tail, b.tail, "long")],
    ["フナ尾", 1 - (1 - a.tail.filter((v) => v === "funa").length / 2) * (1 - b.tail.filter((v) => v === "funa").length / 2)],
  ];
  return {
    predictions: predictions.filter(([, value]) => value > 0),
    colorPredictions: pickedOutcomes(a.color, b.color, COLOR_LABELS),
    markingPredictions: pickedOutcomes(a.marking, b.marking, MARKING_LABELS),
    lusterPredictions: outcomes(a.luster, b.luster, lusterFromPair).map(([value, weight]) => [LUSTER_LABELS[value], weight] as [string, number]),
  };
}

export function migrateTraitFish<T extends TraitFish>(fish: T): T & { genome: CompleteGenome; marking: Marking } {
  return { ...fish, genome: genomeFor(fish), marking: appearanceFor(fish).marking };
}

export function migrateSpeciesNames(fish: TraitFish[], names: Record<string, string>) {
  const result = { ...names };
  for (const item of fish) {
    const key = speciesKey(item);
    const oldName = names[`${item.shapeId}__${item.colorId}`];
    if (oldName !== undefined) result[key] ??= oldName;
  }
  return result;
}
