import { useState } from "react";
import { GoldfishPreview3D } from "@/components/goldfish-aquarium-3d";
import { GoldfishDiagram, TailDiagram } from "@/components/goldfish-diagram";
import { GUIDE_ENTRIES, GUIDE_SECTIONS, HISTORY_BRANCHES, HISTORY_CROSSES, type GuideEntry, type GuideSection } from "@/lib/goldfish-guide";
import { BODY_LABELS, COLOR_LABELS, LUSTER_LABELS, MARKING_LABELS, TAIL_LABELS, legacyGenome, pair, visibleTraits, type BodyAllele, type ColorId, type CompleteGenome, type LusterAllele, type Marking, type TailAllele, type TraitFish } from "@/lib/goldfish-traits";

function EntryPicture({ entry, section }: { entry: GuideEntry; section: GuideSection }) {
  if (section === "tail") return <TailDiagram kind={entry.visual} />;
  if (section === "color") return <div className="guide-color-sample" style={{ backgroundColor: entry.visual }}><span /></div>;
  if (section === "scales") return <div className={`guide-scales-sample scale-${entry.visual}`} aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} />)}</div>;
  const fish: TraitFish = { shapeId: "ryukin", colorId: "beni", genome: legacyGenome("ryukin", "beni"), marking: "solid" };
  if (section === "body") {
    if (entry.visual === "slender") { fish.shapeId = "wakin"; fish.genome = legacyGenome("wakin", "beni"); }
    if (entry.visual === "hood") { fish.shapeId = "oranda"; fish.genome = legacyGenome("oranda", "beni"); }
    if (entry.visual === "ranchu") { fish.shapeId = "ranchu"; fish.genome = legacyGenome("ranchu", "beni"); fish.genome.hood = pair("on"); }
    if (entry.visual === "pearl") { fish.shapeId = "pearl"; fish.genome = legacyGenome("pearl", "beni"); }
  } else {
    fish.marking = entry.visual === "sakura" ? "sarasa" : entry.visual === "tiger" ? "redBlack" : entry.visual === "kirin" ? "calico" : entry.visual === "rokurin" ? "solid" : entry.visual as Marking;
    if (entry.visual === "calico" || entry.visual === "kirin") fish.colorId = "calico";
    if (entry.visual === "sakura") { fish.colorId = "sakura"; fish.genome!.luster = pair("transparent"); }
    if (entry.visual === "rokurin") fish.colorId = "tancho";
  }
  return <GoldfishDiagram fish={fish} examplePattern={section === "pattern" ? entry.visual : undefined} />;
}

function ObservationLab() {
  const [genome, setGenome] = useState<CompleteGenome>(() => legacyGenome("ryukin", "beni"));
  const [colorId, setColor] = useState<ColorId>("beni");
  const [marking, setMarking] = useState<Marking>("solid");
  const fish = { id: "observation-model", shapeId: "ryukin" as const, colorId, marking, genome, seed: 12 };
  const toggle = (key: "telescope" | "dorsal" | "hood" | "pearlScales", checked: boolean) => setGenome((g) => ({ ...g, [key]: pair(checked ? "on" : "off") }));
  return <section className="observation-lab" aria-label="特徴を組み合わせる観察室">
    <div className="lab-fish">
      <p className="eyebrow">かんさつ室</p><h3>特徴を くみあわせよう</h3>
      <GoldfishPreview3D fish={fish} />
      <p>{visibleTraits(fish).join("・")}</p>
      <small>見た目をためす模型です。自分の金魚やセーブは変わりません。</small>
    </div>
    <div className="lab-controls">
      <label>体形<select value={genome.body[0]} onChange={(e) => setGenome((g) => ({ ...g, body: pair(e.target.value as BodyAllele) }))}>{Object.entries(BODY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>尾の形<select value={genome.tail[0]} onChange={(e) => setGenome((g) => ({ ...g, tail: pair(e.target.value as TailAllele) }))}>{Object.entries(TAIL_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>鱗のつや<select value={genome.luster[0] === genome.luster[1] ? genome.luster[0] : "mosaic"} onChange={(e) => setGenome((g) => ({ ...g, luster: e.target.value === "mosaic" ? ["metallic", "transparent"] : pair(e.target.value as LusterAllele) }))}>{Object.entries(LUSTER_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>色<select value={colorId} onChange={(e) => setColor(e.target.value as ColorId)}>{Object.entries(COLOR_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>もよう<select value={marking} onChange={(e) => setMarking(e.target.value as Marking)}>{Object.entries(MARKING_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <fieldset><legend>目・頭・背びれ・鱗の形</legend>
        <label><input type="checkbox" checked={genome.telescope[0] === "on"} onChange={(e) => toggle("telescope", e.target.checked)} />出目</label>
        <label><input type="checkbox" checked={genome.hood[0] === "on"} onChange={(e) => toggle("hood", e.target.checked)} />肉瘤</label>
        <label><input type="checkbox" checked={genome.dorsal[0] === "on"} onChange={(e) => toggle("dorsal", e.target.checked)} />背びれ</label>
        <label><input type="checkbox" checked={genome.pearlScales[0] === "on"} onChange={(e) => toggle("pearlScales", e.target.checked)} />パール鱗</label>
      </fieldset>
      <p className="game-rule-note">図鑑の特徴を分けて試せる、ゲームの模型です。実在しない組合せも作れます。丹頂は白い体と赤い頭として描きます。</p>
    </div>
  </section>;
}

export function GoldfishFieldGuide() {
  const [section, setSection] = useState<GuideSection>("body");
  const selected = GUIDE_SECTIONS.find((item) => item.id === section)!;
  return <div className="field-guide">
    <div className="guide-intro"><div><p className="eyebrow">かたちを知ると、つくるのが もっと楽しい</p><h3>金魚の ひみつを しらべよう</h3><p>「体形・尾・うろこ・色・もよう」を、ひとつずつ観察しよう。</p></div><span className="guide-emblem" aria-hidden="true">観察<br />ノート</span></div>
    <nav className="guide-navigation" aria-label="図鑑の分類">{GUIDE_SECTIONS.map((item) => <button type="button" key={item.id} aria-pressed={section === item.id} onClick={() => setSection(item.id)}>{item.label}</button>)}</nav>
    <section className="guide-section" aria-label={selected.label}>
      <h3>{selected.label}</h3><p className="guide-section-intro">{selected.intro}</p>
      {section === "history" ? <>
        <p className="guide-callout">この矢印は、品種ができた歴史の大まかな流れです。「一度かけあわせれば必ず生まれる」というレシピではありません。</p>
        <div className="history-branches">{HISTORY_BRANCHES.map((item) => <article key={item.from}><strong>{item.from}</strong><span aria-hidden="true">↓</span><strong>{item.to}</strong><p>{item.how}</p><small>{item.note}</small></article>)}</div>
        <h4>かけあわせから 生まれた品種の例</h4>
        <div className="history-crosses">{HISTORY_CROSSES.map((item) => <article key={item.name}><h4>{item.name}</h4><p>{item.parents}</p><small>{item.note}</small></article>)}</div>
        <p className="guide-footnote">いただいた図鑑の資料をもとに整理した代表例です。品種づくりには何世代もの選別や改良が関わり、歴史には複数の説があるものもあります。</p>
      </> : <>
        <div className="guide-entry-grid">{GUIDE_ENTRIES[section].map((entry) => <article className="guide-entry" key={entry.name}>
          <div className="guide-picture"><EntryPicture entry={entry} section={section} /></div>
          <div className="guide-entry-copy"><span className={entry.inGame ? "guide-tag available" : "guide-tag"}>{entry.inGame ? "ゲームで観察" : "図鑑で紹介"}</span><h4>{entry.name}</h4>{entry.reading && <small>{entry.reading}</small>}<p>{entry.detail}</p></div>
        </article>)}</div>
        {section === "tail" && <p className="guide-callout">和金の尾は、横から二つに分かれて見えても、図鑑では「フナ尾」と呼ぶよ。三つ尾・四つ尾とは、分け方がちがうんだ。</p>}
        {section === "scales" && <p className="guide-callout">パール鱗は「盛り上がる形」、透明鱗は「光り方」の話。ゲームでも鱗の形とつやを分けて組み合わせます。</p>}
        {section === "color" && <p className="guide-callout">赤・黄系の色素、黒い色素、光をはね返す層が色の見え方に関わります。ラベンダーなど、ゲーム用の色は実物の色名とは分けています。</p>}
        {section === "pattern" && <p className="guide-callout">ゲームでは単色・更紗・キャリコ・丹頂・赤黒を組み合わせられます。桜の雰囲気は、淡い赤の更紗と透明鱗などで試せます。色と鱗の関係は遊び用の簡略表現です。</p>}
      </>}
      <p className="guide-footnote">絵は見分け方の模式図です。「図鑑で紹介」の特徴は、いまは掛け合わせの対象外です。</p>
    </section>
    <ObservationLab />
  </div>;
}
