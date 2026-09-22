import assert from "node:assert/strict";
import { test } from "node:test";
import { appearanceFor, breedGenomes, forecastTraits, genomeFor, legacyGenome, migrateSpeciesNames, migrateTraitFish, phenotypeFromGenome, speciesKey, visibleTraits } from "../lib/goldfish-traits.ts";

const fish = (shapeId = "ryukin", colorId = "beni") => ({ id: `test-${shapeId}`, shapeId, colorId, seed: 42, genome: legacyGenome(shapeId, colorId) });

test("multiple expressed traits survive family classification, drawing data and collection identity", () => {
  const parent = fish("pearl");
  parent.genome.telescope = ["on", "on"];
  parent.genome.hood = ["on", "on"];
  parent.genome.dorsal = ["off", "off"];
  parent.genome.tail = ["butterfly", "butterfly"];
  const genome = breedGenomes(parent, parent, () => 0);
  const child = { ...phenotypeFromGenome(genome, () => 0), genome };
  assert.deepEqual(appearanceFor(child), { body: "round", tail: "butterfly", telescope: true, dorsal: false, hood: true, pearlScales: true, luster: "metallic", marking: "solid" });
  const sibling = { ...child, genome: { ...genome, hood: ["off", "off"] } };
  assert.equal(child.shapeId, "demekin");
  assert.notEqual(speciesKey(child), speciesKey(sibling));
  assert(visibleTraits(child).includes("パール鱗"));
});

test("forecast matches exhaustive transmission from two recessive carriers", () => {
  const parent = fish();
  parent.genome.telescope = ["off", "on"];
  parent.genome.luster = ["metallic", "transparent"];
  parent.genome.marking = ["solid", "sarasa"];
  let telescope = 0;
  for (let left = 0; left < 2; left++) for (let right = 0; right < 2; right++) {
    let call = 0;
    const genome = breedGenomes(parent, parent, () => (call++ % 2 ? right : left) * 0.75);
    if (appearanceFor({ ...parent, genome }).telescope) telescope++;
  }
  const forecast = forecastTraits(parent, parent);
  assert.equal(new Map(forecast.predictions).get("出目"), telescope / 4);
  assert.deepEqual(new Map(forecast.lusterPredictions), new Map([["普通鱗", .25], ["モザイク透明鱗性", .5], ["透明鱗", .25]]));
  for (const key of ["colorPredictions", "markingPredictions", "lusterPredictions"]) assert.equal(forecast[key].reduce((sum, [, value]) => sum + value, 0), 1);
});

test("color, pattern and scale shape are inherited independently", () => {
  const a = fish("pearl", "beni"), b = fish("wakin", "lemon");
  b.marking = "sarasa";
  b.genome.marking = ["sarasa", "sarasa"];
  const genome = breedGenomes(a, b, () => 0);
  let calls = 0;
  const child = { ...phenotypeFromGenome(genome, () => calls++ ? .75 : 0), genome };
  assert.equal(child.colorId, "beni");
  assert.equal(child.marking, "sarasa");
  assert.equal(appearanceFor(child).pearlScales, false);
  assert.equal(appearanceFor(fish("ranchu", "milk")).pearlScales, false);
  assert.equal(appearanceFor(fish("pearl", "beni")).pearlScales, true);
  assert.equal(appearanceFor({ ...fish("ryukin", "sumi"), marking: "solid" }).marking, "solid");
});

test("legacy saves preserve identifiers, family links, tanks, names and hidden alleles", () => {
  const genome = legacyGenome("wakin", "beni");
  delete genome.luster;
  delete genome.marking;
  genome.tail = ["standard", "standard"];
  genome.telescope = ["on", "off"];
  const old = { id: "my-fish", shapeId: "wakin", colorId: "beni", seed: 51, genome, tank: 9, parents: ["a", "b"] };
  const snapshot = structuredClone(old);
  const migrated = migrateTraitFish(old);
  assert.deepEqual(old, snapshot);
  assert.equal(migrated.id, "my-fish");
  assert.equal(migrated.tank, 9);
  assert.deepEqual(migrated.parents, ["a", "b"]);
  assert.deepEqual(migrated.genome.telescope, ["on", "off"]);
  assert.equal(appearanceFor(migrated).tail, "funa");
  const names = migrateSpeciesNames([migrated], { wakin__beni: "こはく" });
  assert.equal(names[speciesKey(migrated)], "こはく");
  assert.deepEqual(migrateTraitFish(migrated), migrated);
  assert.equal(migrateSpeciesNames([migrated], { ...names, [speciesKey(migrated)]: "ひかり" })[speciesKey(migrated)], "ひかり");
});

test("F1 metallic x transparent has mosaic sheen; swapping parents preserves forecast", () => {
  const a = fish("wakin", "beni"), b = fish("ryukin", "sakura");
  const genome = breedGenomes(a, b, () => .75);
  const child = { ...phenotypeFromGenome(genome, () => .75), genome };
  assert.equal(appearanceFor(child).luster, "mosaic");
  assert.deepEqual(genomeFor(child), genome);
  const ab = forecastTraits(a, b), ba = forecastTraits(b, a);
  for (const key of Object.keys(ab)) assert.deepEqual(new Map(ab[key]), new Map(ba[key]));
  const reversedGenes = structuredClone(child);
  for (const value of Object.values(reversedGenes.genome)) value.reverse();
  assert.equal(speciesKey(child), speciesKey(reversedGenes));
});
