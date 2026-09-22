// Original summaries based on the user's supplied reference pages, pp. 11–19.
// Photographs and the source's page layout are not included in the application.
export type GuideSection = "body" | "tail" | "scales" | "color" | "pattern" | "history";
export type GuideEntry = { name: string; reading?: string; detail: string; visual: string; inGame?: boolean };
export const GUIDE_SECTIONS: { id: GuideSection; label: string; intro: string }[] = [
  { id: "body", label: "① 体形", intro: "体の長さと高さを見よう。頭・目・背びれも、見分ける手がかりだよ。" },
  { id: "tail", label: "② 尾の形", intro: "横からと上からでは、見え方がちがうよ。尾の開き方にも注目！" },
  { id: "scales", label: "③ うろこ", intro: "一枚のうろこの形と、全身のうろこの組合せを分けて考えよう。" },
  { id: "color", label: "④ 色", intro: "色のもとと、光をはね返す層の組合せで、見える色が変わるよ。" },
  { id: "pattern", label: "⑤ もよう", intro: "色がどこに、どんな広さで出るか。それが、もようだよ。" },
  { id: "history", label: "⑥ なりたち", intro: "長い時間をかけ、特徴のある金魚を選んで育ててきたんだ。" },
];
export const GUIDE_ENTRIES: Record<Exclude<GuideSection, "history">, GuideEntry[]> = {
  body: [
    { name: "和金型", reading: "わきんがた", detail: "長めで、すらりとした体。フナに近いシルエット。", visual: "slender", inGame: true },
    { name: "琉金型", reading: "りゅうきんがた", detail: "短い体に高い背中。横から見ると背高で、おなかは丸い。", visual: "tall", inGame: true },
    { name: "オランダ獅子頭型", reading: "オランダししがしらがた", detail: "丸みのある体と、頭の肉瘤（にくりゅう）が目印。長手・丸手もある。", visual: "hood", inGame: true },
    { name: "パールスケール型", detail: "短くふくらんだ体と、粒のように盛り上がる鱗。ピンポンパールも仲間。", visual: "pearl", inGame: true },
    { name: "ランチュウ型", detail: "背びれがない体形。肉瘤が発達する品種も多い。", visual: "ranchu", inGame: true },
  ],
  tail: [
    { name: "フナ尾", detail: "縦向きの一枚の尾びれに、中央の切れこみ。横からは上下に分かれて見える。", visual: "funa", inGame: true },
    { name: "ふき流し尾", detail: "フナ尾を長くした形。コメットなどに見られる。", visual: "long", inGame: true },
    { name: "ハート尾", detail: "大きく丸いハートのような尾。ブリストル朱文金など。", visual: "heart" },
    { name: "三つ尾", reading: "みつお", detail: "左右へ開く尾で、中央がつながっている。上から観察してみよう。", visual: "three", inGame: true },
    { name: "四つ尾", reading: "よつお", detail: "左右へ開き、中央に切れこみがある。三つ尾との違いは上から見ると分かりやすい。", visual: "four" },
    { name: "平付け尾", reading: "ひらづけお", detail: "三つ尾を水平に広げたような形。大阪ランチュウなど。", visual: "flat" },
    { name: "孔雀尾", reading: "くじゃくお", detail: "後ろから見るとXのように開く尾。地金などに見られる。", visual: "peacock" },
    { name: "反り尾", reading: "そりお", detail: "左右の端がくるっと反る尾。土佐金の特徴。", visual: "curled" },
    { name: "蝶尾", reading: "ちょうび", detail: "上から見ると、チョウが羽を広げたような尾。", visual: "butterfly", inGame: true },
  ],
  scales: [
    { name: "普通鱗", reading: "ふつうりん", detail: "光をはね返す層があり、きらりと光る鱗。", visual: "metallic", inGame: true },
    { name: "網透明鱗", reading: "あみとうめいりん", detail: "一枚の鱗の中で、光る部分と透ける部分がある。紅葉もようと関係する。", visual: "net", inGame: true },
    { name: "透明鱗", reading: "とうめいりん", detail: "光をはね返す層がなく、下の色が透ける。ゲームではつやをおさえて表現。", visual: "transparent", inGame: true },
    { name: "パール鱗", reading: "パールりん", detail: "鱗の中央がぷっくり盛り上がる。白い色や水玉もようとは別の特徴。", visual: "pearl", inGame: true },
    { name: "モザイク透明鱗性", reading: "モザイクとうめいりんせい", detail: "普通鱗と透明鱗が全身で混ざる状態。一枚の鱗の名前ではないよ。", visual: "mosaic", inGame: true },
  ],
  color: [
    { name: "赤", detail: "赤からオレンジまで、色の濃さに幅がある。", visual: "#ed633e", inGame: true },
    { name: "白", detail: "光る鱗の層が、白い見え方をつくる。", visual: "#f5ecdc", inGame: true },
    { name: "黒", detail: "黒い色素が多いと、黒く見える。", visual: "#1d292e", inGame: true },
    { name: "青", detail: "金魚の「青」は、銀色を帯びた青灰色。", visual: "#7e969f" },
    { name: "茶", detail: "赤・黄系と黒の色素の混ざり方で、茶の見え方が変わる。", visual: "#916149" },
    { name: "黄", detail: "赤とは違う黄色い見え方。同じ黄・赤系の色素と関係する。", visual: "#e8c34c", inGame: true },
    { name: "瑪瑙", reading: "めのう", detail: "とても淡い紫を帯びた色。色素の詳しい組合せは、資料でも未解明とされる。", visual: "#b5a5b8" },
    { name: "紅葉", reading: "もみじ", detail: "網透明鱗がつくる、やわらかな色の見え方。鱗の種類にも注目。", visual: "#dc773d" },
    { name: "すけた赤", detail: "透明鱗を通る光で、赤が透けて見える。", visual: "#e5857b" },
    { name: "あさぎ", detail: "透明鱗の下にある黒い色が透け、青みや紫みを帯びて見える。", visual: "#9ab8bd", inGame: true },
    { name: "シルク", detail: "透明鱗で色素がない部分は、下の筋肉の色が透けて淡いピンクに見える。", visual: "#e6c3b9" },
  ],
  pattern: [
    { name: "素赤・猩々", reading: "すあか・しょうじょう", detail: "赤い単色が素赤。ひれの先まで赤いものは猩々と呼ばれる。", visual: "solid", inGame: true },
    { name: "更紗", reading: "さらさ", detail: "赤と白のまだら。色の面積や配置でも印象が変わる。", visual: "sarasa", inGame: true },
    { name: "キャリコ", detail: "赤・白・黒の組合せ。あさぎ色も親しまれ、モザイク透明鱗性と関係する。", visual: "calico", inGame: true },
    { name: "桜", reading: "さくら", detail: "赤白のもようを、透明鱗やモザイク透明鱗性がやわらかく見せる。", visual: "sakura", inGame: true },
    { name: "丹頂", reading: "たんちょう", detail: "白い体と、頭の赤が目印。赤い頭と肉瘤の有無は分けて見よう。", visual: "tancho", inGame: true },
    { name: "六鱗", reading: "ろくりん", detail: "白地に、口先やひれなどの赤が目立つ配色。", visual: "rokurin" },
    { name: "赤黒", reading: "あかくろ", detail: "赤と黒の二色。本物では育つにつれ黒が減る場合もある。", visual: "redBlack", inGame: true },
    { name: "虎", reading: "とら", detail: "オレンジと黒が、トラのように見えるもよう。", visual: "tiger" },
    { name: "麒麟", reading: "きりん", detail: "赤・白・黒に、鱗一枚ずつの黒が加わるような細かな見え方。", visual: "kirin" },
  ],
};

export const HISTORY_BRANCHES = [
  { from: "フナの仲間", to: "和金", how: "赤い体色の変化を選び、育ててきた", note: "尾にはフナ尾だけでなく、四つ尾の和金もいる。" },
  { from: "和金の系統", to: "琉金・地金・ランチュウの系統", how: "体や尾、背びれなどの変化と、その後の改良", note: "ランチュウや大阪ランチュウなどには、背びれのないマルコに由来する流れがある。" },
  { from: "琉金の系統", to: "出目金・オランダ獅子頭", how: "目や頭などの特徴を受け継ぎ、改良", note: "赤出目金から黒やキャリコの出目金が生まれたと考えられている。" },
];
export const HISTORY_CROSSES = [
  { name: "朱文金（しゅぶんきん）", parents: "和金・キャリコ出目金・日本のフナ", note: "複数の系統が品種づくりに関わった例。" },
  { name: "東錦（あずまにしき）", parents: "キャリコ出目金 × オランダ獅子頭", note: "交配からつくられた品種の例。" },
  { name: "キャリコ琉金", parents: "キャリコ出目金 × 琉金", note: "色やもようを別の体形へ受け継がせた例。" },
];
