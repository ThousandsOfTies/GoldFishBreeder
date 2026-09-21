"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Fish as FishIcon,
  FlaskConical,
  Home,
  LockKeyhole,
  Maximize2,
  Minimize2,
  MoveRight,
  Pencil,
  Plus,
  Sparkles,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { GoldfishAquarium3D } from "@/components/goldfish-aquarium-3d";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ShapeId = "wakin" | "ryukin" | "demekin" | "oranda" | "ranchu" | "comet" | "pearl" | "butterfly";
type ColorId = "beni" | "sakura" | "sumi" | "tancho" | "milk" | "lemon" | "calico" | "lavender";
type PatternId = "plain" | "patch" | "spots" | "cap" | "pearls" | "stripe" | "calico" | "cloud";
type TankPlace = number | "rest";
type ViewId = "aquarium" | "breed" | "book" | "tanks";
type ParentSlot = "shape" | "color";
type BreedPhase = "idle" | "mixing" | "result";

type FishRecord = {
  id: string;
  shapeId: ShapeId;
  colorId: ColorId;
  tank: TankPlace;
  bornAt: number;
  parents?: [string, string];
  seed: number;
};

type GameState = {
  version: 1;
  fish: FishRecord[];
  speciesNames: Record<string, string>;
  tankNames: string[];
  breedCount: number;
  activeTank: number;
  tutorialDone: boolean;
};

type BirthSummary = {
  fish: FishRecord;
  speciesName: string;
  speciesNumber: number;
  isNewSpecies: boolean;
  destination: TankPlace;
  unlockedName?: string;
};

type WebMcpResult = { content: { type: "text"; text: string }[] };
type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<WebMcpResult> | WebMcpResult;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void>;
    };
  }
}

const SHAPES: Record<ShapeId, { label: string; short: string; rx: number; ry: number; tail: number; special?: "telescope" | "cap" | "ranchu" | "pearl" | "butterfly" }> = {
  wakin: { label: "わきん", short: "すらり", rx: 49, ry: 24, tail: 0.95 },
  ryukin: { label: "りゅうきん", short: "まる", rx: 42, ry: 34, tail: 1.1 },
  demekin: { label: "でめきん", short: "でめ", rx: 44, ry: 29, tail: 1.05, special: "telescope" },
  oranda: { label: "オランダ", short: "ふわ", rx: 43, ry: 31, tail: 1.12, special: "cap" },
  ranchu: { label: "らんちゅう", short: "ころ", rx: 44, ry: 31, tail: 0.92, special: "ranchu" },
  comet: { label: "コメット", short: "ながれ", rx: 50, ry: 22, tail: 1.42 },
  pearl: { label: "ピンポンパール", short: "ぽん", rx: 36, ry: 36, tail: 0.88, special: "pearl" },
  butterfly: { label: "ちょうび", short: "ちょう", rx: 43, ry: 29, tail: 1.5, special: "butterfly" },
};

const COLORS: Record<ColorId, { label: string; short: string; colors: [string, string, string?]; pattern: PatternId }> = {
  beni: { label: "べにいろ", short: "べに", colors: ["#ef5b38", "#ffb35e"], pattern: "plain" },
  sakura: { label: "さくらもよう", short: "さくら", colors: ["#f59582", "#fff3da"], pattern: "patch" },
  sumi: { label: "すみまだら", short: "すみ", colors: ["#26313a", "#e97443"], pattern: "spots" },
  tancho: { label: "たんちょう", short: "たん", colors: ["#f5eee1", "#d94b38"], pattern: "cap" },
  milk: { label: "ミルクパール", short: "みるく", colors: ["#f8e6b6", "#fffdf3"], pattern: "pearls" },
  lemon: { label: "レモンぎん", short: "れもん", colors: ["#f3ce58", "#e7f1ed"], pattern: "stripe" },
  calico: { label: "あおキャリコ", short: "あお", colors: ["#9ab8bd", "#f07a43", "#28343c"], pattern: "calico" },
  lavender: { label: "ラベンダー", short: "らべん", colors: ["#8b78a9", "#efe5f6"], pattern: "cloud" },
};

const BASE_PARENTS: { shapeId: ShapeId; colorId: ColorId; name: string; unlockAt: number }[] = [
  { shapeId: "wakin", colorId: "beni", name: "わきん", unlockAt: 0 },
  { shapeId: "ryukin", colorId: "sakura", name: "りゅうきん", unlockAt: 0 },
  { shapeId: "demekin", colorId: "sumi", name: "でめきん", unlockAt: 0 },
  { shapeId: "oranda", colorId: "tancho", name: "オランダ", unlockAt: 5 },
  { shapeId: "ranchu", colorId: "milk", name: "らんちゅう", unlockAt: 10 },
  { shapeId: "comet", colorId: "lemon", name: "コメット", unlockAt: 15 },
  { shapeId: "pearl", colorId: "calico", name: "ピンポンパール", unlockAt: 20 },
  { shapeId: "butterfly", colorId: "lavender", name: "ちょうび", unlockAt: 25 },
];

const INITIAL_TANK_NAMES = [
  "ひかりの すいそう", "さんごの すいそう", "しずくの すいそう", "あおぞらの すいそう", "ほしの すいそう",
  "もりの すいそう", "つきの すいそう", "さくらの すいそう", "にじの すいそう", "おまつり すいそう",
];

const speciesKey = (shapeId: ShapeId, colorId: ColorId) => `${shapeId}__${colorId}`;

const initialGame = (): GameState => ({
  version: 1,
  fish: [
    { id: "wakin-1", shapeId: "wakin", colorId: "beni", tank: 0, bornAt: 0, seed: 11 },
    { id: "ryukin-1", shapeId: "ryukin", colorId: "sakura", tank: 0, bornAt: 0, seed: 27 },
    { id: "demekin-1", shapeId: "demekin", colorId: "sumi", tank: 0, bornAt: 0, seed: 43 },
    { id: "wakin-2", shapeId: "wakin", colorId: "beni", tank: 1, bornAt: 0, seed: 64 },
    { id: "ryukin-2", shapeId: "ryukin", colorId: "sakura", tank: 1, bornAt: 0, seed: 82 },
  ],
  speciesNames: {
    [speciesKey("wakin", "beni")]: "わきん",
    [speciesKey("ryukin", "sakura")]: "りゅうきん",
    [speciesKey("demekin", "sumi")]: "でめきん",
  },
  tankNames: INITIAL_TANK_NAMES,
  breedCount: 0,
  activeTank: 0,
  tutorialDone: false,
});

function randomId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function firstOpenTank(fish: FishRecord[], preferred: number): TankPlace {
  const countAt = (tank: number) => fish.filter((item) => item.tank === tank).length;
  if (countAt(preferred) < 10) return preferred;
  for (let tank = 0; tank < 10; tank += 1) if (countAt(tank) < 10) return tank;
  return "rest";
}

function nameIdeas(shapeId: ShapeId, colorId: ColorId) {
  const pair = `${COLORS[colorId].short}${SHAPES[shapeId].short}`.slice(0, 8);
  const gentle = ["きらり", "こはく", "みずたま", "ゆらり", "ひかり", "しずく"];
  const offset = (shapeId.length + colorId.length) % gentle.length;
  return [pair, gentle[offset], gentle[(offset + 2) % gentle.length]];
}

function GoldfishCanvas({ shapeId, colorId, className = "" }: { shapeId: ShapeId; colorId: ColorId; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const shape = SHAPES[shapeId];
    const palette = COLORS[colorId];
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 180 * scale;
    canvas.height = 100 * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, 180, 100);

    const bodyX = 91;
    const bodyY = shape.special === "ranchu" ? 53 : 49;
    const tailRoot = bodyX - shape.rx + 7;
    const tailReach = 34 * shape.tail;

    const tailGradient = ctx.createLinearGradient(12, 18, 60, 82);
    tailGradient.addColorStop(0, `${palette.colors[0]}e8`);
    tailGradient.addColorStop(1, `${palette.colors[1]}88`);
    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(tailRoot, bodyY);
    if (shape.special === "butterfly") {
      ctx.bezierCurveTo(tailRoot - tailReach * 0.75, 3, 6, 16, tailRoot - tailReach, 43);
      ctx.bezierCurveTo(4, 48, 4, 52, tailRoot - tailReach, 57);
      ctx.bezierCurveTo(8, 88, tailRoot - tailReach * 0.7, 98, tailRoot, bodyY + 5);
    } else {
      ctx.bezierCurveTo(tailRoot - tailReach * 0.55, 9, 12, 17, tailRoot - tailReach, 47);
      ctx.bezierCurveTo(10, 78, tailRoot - tailReach * 0.52, 91, tailRoot, bodyY + 5);
    }
    ctx.closePath();
    ctx.fill();

    if (shape.special !== "ranchu") {
      ctx.fillStyle = `${palette.colors[0]}9d`;
      ctx.beginPath();
      ctx.moveTo(bodyX - 18, bodyY - shape.ry + 5);
      ctx.quadraticCurveTo(bodyX + 2, bodyY - shape.ry - 20, bodyX + 17, bodyY - shape.ry + 8);
      ctx.closePath();
      ctx.fill();
    }

    const bodyGradient = ctx.createRadialGradient(bodyX + 19, bodyY - 17, 4, bodyX, bodyY, 62);
    bodyGradient.addColorStop(0, "#fff9e9");
    bodyGradient.addColorStop(0.18, palette.colors[1]);
    bodyGradient.addColorStop(0.68, palette.colors[0]);
    bodyGradient.addColorStop(1, "#592822");
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY, shape.rx, shape.ry, shape.special === "ranchu" ? -0.08 : 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY, shape.rx, shape.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = `${palette.colors[1]}ee`;
    if (palette.pattern === "patch" || palette.pattern === "cloud") {
      ctx.beginPath();
      ctx.ellipse(bodyX + 10, bodyY - 18, 22, 15, -0.2, 0, Math.PI * 2);
      ctx.ellipse(bodyX - 22, bodyY + 13, 25, 15, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    if (palette.pattern === "spots" || palette.pattern === "calico") {
      const spots = [[70, 37, 8], [96, 63, 7], [115, 35, 5], [58, 57, 5], [127, 54, 4]];
      spots.forEach(([x, y, r], index) => {
        ctx.fillStyle = palette.pattern === "calico" && index % 2 ? palette.colors[2] ?? "#29343a" : palette.colors[1];
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (palette.pattern === "stripe") {
      ctx.strokeStyle = `${palette.colors[1]}c8`; ctx.lineWidth = 7;
      [77, 98, 119].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, bodyY - 27); ctx.quadraticCurveTo(x - 8, bodyY, x, bodyY + 27); ctx.stroke(); });
    }
    if (palette.pattern === "pearls") {
      ctx.fillStyle = "rgba(255,255,255,.55)";
      for (let y = 31; y < 72; y += 12) for (let x = 58 + ((y / 12) % 2) * 6; x < 130; x += 13) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();

    if (palette.pattern === "cap" || shape.special === "cap") {
      ctx.fillStyle = palette.colors[1];
      ctx.beginPath(); ctx.ellipse(bodyX + shape.rx - 17, bodyY - shape.ry + 10, 17, 11, 0.25, 0, Math.PI * 2); ctx.fill();
    }

    ctx.strokeStyle = "rgba(255,255,255,.34)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(bodyX, bodyY, shape.rx - 1, shape.ry - 1, 0, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.beginPath(); ctx.ellipse(bodyX + 8, bodyY + shape.ry - 2, 22, 8, 0.4, 0, Math.PI * 2); ctx.fill();

    const eyeX = bodyX + shape.rx - 8;
    if (shape.special === "telescope") {
      ctx.fillStyle = palette.colors[0]; ctx.beginPath(); ctx.arc(eyeX - 1, bodyY - 10, 11, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#111a1e"; ctx.beginPath(); ctx.arc(eyeX, bodyY - 10, 4.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(eyeX - 1.5, bodyY - 12, 1.4, 0, Math.PI * 2); ctx.fill();
  }, [shapeId, colorId]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

export default function HomePage() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<ViewId>("aquarium");
  const [selectedFishId, setSelectedFishId] = useState("wakin-1");
  const [shapeParentId, setShapeParentId] = useState<string | null>(null);
  const [colorParentId, setColorParentId] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<ParentSlot>("shape");
  const [breedPhase, setBreedPhase] = useState<BreedPhase>("idle");
  const [pendingBirth, setPendingBirth] = useState<FishRecord | null>(null);
  const [birthSummary, setBirthSummary] = useState<BirthSummary | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [tankNameDraft, setTankNameDraft] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [viewingMode, setViewingMode] = useState(false);
  const aquariumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("kingyo-aquarium-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.version === 1 && Array.isArray(parsed.fish) && parsed.tankNames?.length === 10) {
          setGame(parsed);
          setSelectedFishId(parsed.fish.find((fish) => fish.tank === parsed.activeTank)?.id ?? parsed.fish[0]?.id ?? "");
        }
      }
    } catch {
      // A damaged save never prevents the aquarium from opening.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) return;
    const controller = new AbortController();
    const statusTool: WebMcpTool = {
      name: "get_aquarium_status",
      description: "Read the current fish, tanks, discovered species, and progress in the goldfish game.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => ({
        content: [{
          type: "text",
          text: JSON.stringify({
            breedingCount: game.breedCount,
            discoveredSpecies: Object.values(game.speciesNames),
            fish: game.fish.map((fish) => ({
              id: fish.id,
              name: game.speciesNames[speciesKey(fish.shapeId, fish.colorId)] ?? "なまえのない金魚",
              shape: SHAPES[fish.shapeId].label,
              colorAndPattern: COLORS[fish.colorId].label,
              location: fish.tank === "rest" ? "おやすみ池" : game.tankNames[fish.tank],
            })),
          }),
        }],
      }),
    };
    const chooseParentsTool: WebMcpTool = {
      name: "select_breeding_parents",
      description: "Select two different owned fish as the shape parent and color parent, then open the breeding screen. This does not start breeding.",
      inputSchema: {
        type: "object",
        properties: {
          shapeParentId: { type: "string", description: "Fish ID that passes on body shape and tail." },
          colorParentId: { type: "string", description: "Different fish ID that passes on color and pattern." },
        },
        required: ["shapeParentId", "colorParentId"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const shapeId = String(input.shapeParentId ?? "");
        const colorId = String(input.colorParentId ?? "");
        const shapeFish = game.fish.find((fish) => fish.id === shapeId);
        const colorFish = game.fish.find((fish) => fish.id === colorId);
        if (!shapeFish || !colorFish || shapeId === colorId) {
          return { content: [{ type: "text", text: "Choose two different fish IDs that appear in get_aquarium_status." }] };
        }
        setShapeParentId(shapeId);
        setColorParentId(colorId);
        setPickerSlot("color");
        setBreedPhase("idle");
        setBirthSummary(null);
        setView("breed");
        return { content: [{ type: "text", text: `${game.speciesNames[speciesKey(shapeFish.shapeId, shapeFish.colorId)]} and ${game.speciesNames[speciesKey(colorFish.shapeId, colorFish.colorId)]} are selected. The player can now review the fixed result and press the breeding button.` }] };
      },
    };
    void modelContext.registerTool(statusTool, { signal: controller.signal }).catch(() => undefined);
    void modelContext.registerTool(chooseParentsTool, { signal: controller.signal }).catch(() => undefined);
    return () => controller.abort();
  }, [game]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("kingyo-aquarium-v1", JSON.stringify(game));
    if (!game.tutorialDone) setTutorialOpen(true);
  }, [game, hydrated]);

  useEffect(() => {
    const onFullscreen = () => setViewingMode(Boolean(document.fullscreenElement));
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setViewingMode(false); };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", onFullscreen); document.removeEventListener("keydown", onKey); };
  }, []);

  const activeTankFish = useMemo(
    () => game.fish.filter((fish) => fish.tank === game.activeTank),
    [game.fish, game.activeTank],
  );
  const restFish = useMemo(() => game.fish.filter((fish) => fish.tank === "rest"), [game.fish]);
  const selectedFish = game.fish.find((fish) => fish.id === selectedFishId) ?? activeTankFish[0] ?? game.fish[0];
  const shapeParent = game.fish.find((fish) => fish.id === shapeParentId);
  const colorParent = game.fish.find((fish) => fish.id === colorParentId);
  const unlockedParents = BASE_PARENTS.filter((parent) => parent.unlockAt <= game.breedCount);
  const allParentsUnlocked = game.breedCount >= BASE_PARENTS.at(-1)!.unlockAt;
  const progressStep = allParentsUnlocked ? 5 : game.breedCount % 5;
  const progressValue = allParentsUnlocked ? 100 : (progressStep / 5) * 100;

  const displayName = (fish: FishRecord) => game.speciesNames[speciesKey(fish.shapeId, fish.colorId)] ?? "なまえのない金魚";
  const placeName = (place: TankPlace) => place === "rest" ? "おやすみ池" : game.tankNames[place];

  const goToTank = (tank: number) => {
    const first = game.fish.find((fish) => fish.tank === tank);
    setGame((current) => ({ ...current, activeTank: tank }));
    if (first) setSelectedFishId(first.id);
    setView("aquarium");
  };

  const chooseAsParent = (fish: FishRecord) => {
    if (!shapeParentId) {
      setShapeParentId(fish.id);
      setPickerSlot("color");
    } else if (shapeParentId !== fish.id) {
      setColorParentId(fish.id);
      setPickerSlot("color");
    }
    setView("breed");
    setBreedPhase("idle");
  };

  const pickParent = (fish: FishRecord) => {
    if (pickerSlot === "shape") {
      if (fish.id === colorParentId) return;
      setShapeParentId(fish.id);
      setPickerSlot("color");
    } else {
      if (fish.id === shapeParentId) return;
      setColorParentId(fish.id);
    }
    setBreedPhase("idle");
    setBirthSummary(null);
  };

  const finishBirth = (newFish: FishRecord, chosenName: string, isNewSpecies: boolean) => {
    const key = speciesKey(newFish.shapeId, newFish.colorId);
    const cleanName = chosenName.trim() || nameIdeas(newFish.shapeId, newFish.colorId)[0];
    const destination = firstOpenTank(game.fish, game.activeTank);
    const child = { ...newFish, tank: destination };
    const nextBreedCount = game.breedCount + 1;
    const unlocking = BASE_PARENTS.find((parent) => parent.unlockAt === nextBreedCount);
    let nextFish = [...game.fish, child];
    const nextNames = { ...game.speciesNames, [key]: cleanName };
    let unlockedName: string | undefined;

    if (unlocking) {
      const unlockKey = speciesKey(unlocking.shapeId, unlocking.colorId);
      const unlockDestination = firstOpenTank(nextFish, game.activeTank);
      nextFish = [
        ...nextFish,
        {
          id: randomId(`base-${unlocking.shapeId}`),
          shapeId: unlocking.shapeId,
          colorId: unlocking.colorId,
          tank: unlockDestination,
          bornAt: Date.now(),
          seed: Date.now() % 997,
        },
      ];
      nextNames[unlockKey] = unlocking.name;
      unlockedName = unlocking.name;
    }

    const speciesNumber = nextFish.filter((fish) => speciesKey(fish.shapeId, fish.colorId) === key).length;
    setGame({ ...game, fish: nextFish, speciesNames: nextNames, breedCount: nextBreedCount });
    setPendingBirth(null);
    setNameOpen(false);
    setBreedPhase("result");
    setBirthSummary({ fish: child, speciesName: cleanName, speciesNumber, isNewSpecies, destination, unlockedName });
    if (unlockedName) window.setTimeout(() => toast.success(`新しい おや金魚「${unlockedName}」が なかまになった！`), 350);
  };

  const prepareBirth = () => {
    if (!shapeParent || !colorParent || shapeParent.id === colorParent.id) return;
    const child: FishRecord = {
      id: randomId("fish"),
      shapeId: shapeParent.shapeId,
      colorId: colorParent.colorId,
      tank: "rest",
      bornAt: Date.now(),
      parents: [shapeParent.id, colorParent.id],
      seed: Math.floor(Math.random() * 997),
    };
    const key = speciesKey(child.shapeId, child.colorId);
    const knownName = game.speciesNames[key];
    if (knownName) {
      finishBirth(child, knownName, false);
    } else {
      const ideas = nameIdeas(child.shapeId, child.colorId);
      setPendingBirth(child);
      setNameDraft(ideas[0]);
      setNameOpen(true);
    }
  };

  const startBreeding = () => {
    if (!shapeParent || !colorParent || shapeParent.id === colorParent.id) return;
    setBreedPhase("mixing");
    setBirthSummary(null);
    window.setTimeout(prepareBirth, 1900);
  };

  const submitName = (event: FormEvent) => {
    event.preventDefault();
    if (!pendingBirth) return;
    finishBirth(pendingBirth, nameDraft, true);
  };

  const moveSelectedFish = (destination: TankPlace) => {
    if (!selectedFish) return;
    if (typeof destination === "number" && game.fish.filter((fish) => fish.tank === destination).length >= 10) {
      toast.error("この水槽は 10ぴきで いっぱいです");
      return;
    }
    const remaining = selectedFish.tank === game.activeTank && destination !== game.activeTank
      ? game.fish.find((fish) => fish.tank === game.activeTank && fish.id !== selectedFish.id)
      : undefined;
    setGame((current) => ({
      ...current,
      fish: current.fish.map((fish) => fish.id === selectedFish.id ? { ...fish, tank: destination } : fish),
    }));
    if (remaining) setSelectedFishId(remaining.id);
    setMoveOpen(false);
    toast.success(`${displayName(selectedFish)}を ${placeName(destination)}へ おひっこししました`);
  };

  const renameTank = (event: FormEvent) => {
    event.preventDefault();
    const name = tankNameDraft.trim();
    if (!name) return;
    setGame((current) => {
      const names = [...current.tankNames];
      names[current.activeTank] = name.slice(0, 14);
      return { ...current, tankNames: names };
    });
    setRenameOpen(false);
  };

  const completeTutorial = () => {
    setGame((current) => ({ ...current, tutorialDone: true }));
    setTutorialOpen(false);
  };

  const toggleViewingMode = async () => {
    if (viewingMode) {
      setViewingMode(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      return;
    }
    setViewingMode(true);
    await aquariumRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const renderHeader = () => (
    <header className="game-header">
      <div className="brand-lockup">
        <span className="brand-mark"><FishIcon size={25} strokeWidth={1.8} /></span>
        <div><p>きんぎょの</p><h1>すいぞくかん</h1></div>
      </div>

      <div className="tank-title" aria-label="いま見ている水槽">
        {view === "aquarium" ? (
          <>
            <span>すいそう {game.activeTank + 1}</span>
            <strong>{game.tankNames[game.activeTank]}</strong>
            <small>{activeTankFish.length} / 10 ひき</small>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rename-button"
              aria-label="水槽の名前をかえる"
              onClick={() => { setTankNameDraft(game.tankNames[game.activeTank]); setRenameOpen(true); }}
            ><Pencil size={15} /></Button>
          </>
        ) : (
          <><span>きんぎょの すいぞくかん</span><strong>{view === "breed" ? "かけあわせ" : view === "book" ? "きんぎょずかん" : "すいそういちらん"}</strong></>
        )}
      </div>

      <div className="unlock-meter" aria-label={allParentsUnlocked ? "すべての親金魚を見つけました" : `つぎの親金魚まで5回中${progressStep}回`}>
        <div className="meter-copy"><Sparkles size={17} /><span>{allParentsUnlocked ? "おや金魚 ぜんぶ発見！" : "つぎのおや金魚まで"}</span><strong>{allParentsUnlocked ? "8しゅるい" : `${progressStep} / 5`}</strong></div>
        <Progress value={progressValue} className="meter-track" />
      </div>
    </header>
  );

  const renderAquarium = () => (
    <section className="game-stage">
      <div ref={aquariumRef} className={`aquarium ${viewingMode ? "is-viewing" : ""}`} aria-label={`${game.tankNames[game.activeTank]}。${activeTankFish.length}匹の金魚が泳いでいます`}>
        <div className="water-glow" />
        {activeTankFish.length > 0 && <GoldfishAquarium3D fish={activeTankFish} selectedFishId={selectedFish?.id} onSelect={setSelectedFishId} />}
        {activeTankFish.length > 0 && <div className="three-aquarium-hint">金魚を クリックしてみよう</div>}
        {activeTankFish.length > 0 && <div className="three-fish-picker" aria-label="水槽の金魚をえらぶ">
          {activeTankFish.map((fish) => <button type="button" key={fish.id} className={selectedFish?.id === fish.id ? "is-selected" : ""} onClick={() => setSelectedFishId(fish.id)}>{displayName(fish)}</button>)}
        </div>}
        {activeTankFish.length === 0 && (
          <div className="empty-tank">
            <Waves size={42} />
            <h2>まだ だれも いません</h2>
            <p>かけあわせで うまれた金魚を<br />この水槽に おひっこしできます。</p>
            <Button onClick={() => setView("breed")}><FlaskConical />かけあわせへ</Button>
          </div>
        )}
        <div className="aquarium-vignette" />
        <Button className="fullscreen-button" variant="secondary" size="icon" aria-label={viewingMode ? "もとの大きさにもどす" : "大きく表示する"} onClick={toggleViewingMode}>
          {viewingMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </Button>
      </div>

      <aside className="fish-panel" aria-live="polite">
        {selectedFish && selectedFish.tank === game.activeTank ? (
          <>
            <p className="eyebrow">この金魚</p>
            <div className="selected-fish"><GoldfishCanvas shapeId={selectedFish.shapeId} colorId={selectedFish.colorId} /></div>
            <h2>{displayName(selectedFish)}</h2>
            <p className="species-label">{game.fish.filter((fish) => speciesKey(fish.shapeId, fish.colorId) === speciesKey(selectedFish.shapeId, selectedFish.colorId)).length}ひき いるよ</p>
            <dl>
              <div><dt>かたち</dt><dd>{SHAPES[selectedFish.shapeId].label}</dd></div>
              <div><dt>いろ・もよう</dt><dd>{COLORS[selectedFish.colorId].label}</dd></div>
              <div><dt>うまれた日</dt><dd>{selectedFish.bornAt ? new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(selectedFish.bornAt) : "さいしょから"}</dd></div>
            </dl>
            <div className="panel-actions">
              <Button className="parent-button" onClick={() => chooseAsParent(selectedFish)}><FlaskConical size={18} />この子を おやにする</Button>
              <Button variant="outline" className="move-button" onClick={() => setMoveOpen(true)}><MoveRight size={18} />おひっこし</Button>
            </div>
          </>
        ) : (
          <div className="empty-panel"><FishIcon size={34} /><p>金魚を えらぶと<br />くわしく見られます。</p></div>
        )}
      </aside>
    </section>
  );

  const renderBreed = () => {
    const previewShape = shapeParent?.shapeId;
    const previewColor = colorParent?.colorId;
    return (
      <section className="workspace breed-workspace">
        <div className="workspace-heading">
          <div><p className="eyebrow">みぎと ひだりで けっかが かわるよ</p><h2>2ひきの おやを えらぼう</h2></div>
          <p><strong>ひだり</strong>から かたち、<strong>みぎ</strong>から いろともようを うけつぎます。</p>
        </div>

        {breedPhase === "result" && birthSummary ? (
          <div className="birth-result">
            <div className="sparkle-ring"><Sparkles /><GoldfishCanvas shapeId={birthSummary.fish.shapeId} colorId={birthSummary.fish.colorId} /></div>
            <p className="eyebrow">{birthSummary.isNewSpecies ? "しんしゅ はっけん！" : `${birthSummary.speciesNumber}ひきめ！`}</p>
            <h2>{birthSummary.speciesName}</h2>
            <p>{placeName(birthSummary.destination)}へ はいりました。</p>
            {birthSummary.unlockedName && <div className="unlock-note"><Sparkles />「{birthSummary.unlockedName}」が おやに つかえるようになった！</div>}
            <div className="result-actions">
              <Button onClick={() => { if (typeof birthSummary.destination === "number") goToTank(birthSummary.destination); else setView("tanks"); }}><Home />会いにいく</Button>
              <Button variant="outline" onClick={() => { setBreedPhase("idle"); setBirthSummary(null); }}>もういちど</Button>
            </div>
          </div>
        ) : (
          <>
            <div className={`breeding-board ${breedPhase === "mixing" ? "is-mixing" : ""}`}>
              <button type="button" className={`parent-slot ${pickerSlot === "shape" ? "active" : ""}`} onClick={() => setPickerSlot("shape")}>
                <span className="slot-label">① かたちの おや</span>
                {shapeParent ? <><GoldfishCanvas shapeId={shapeParent.shapeId} colorId={shapeParent.colorId} /><strong>{displayName(shapeParent)}</strong><small>{SHAPES[shapeParent.shapeId].label}を うけつぐ</small></> : <><span className="slot-plus"><Plus /></span><strong>えらぶ</strong></>}
              </button>
              <div className="inherit-arrow"><ArrowRight /><span>かけあわせ</span></div>
              <button type="button" className={`parent-slot ${pickerSlot === "color" ? "active" : ""}`} onClick={() => setPickerSlot("color")}>
                <span className="slot-label">② いろの おや</span>
                {colorParent ? <><GoldfishCanvas shapeId={colorParent.shapeId} colorId={colorParent.colorId} /><strong>{displayName(colorParent)}</strong><small>{COLORS[colorParent.colorId].label}を うけつぐ</small></> : <><span className="slot-plus"><Plus /></span><strong>えらぶ</strong></>}
              </button>
              <div className="equals-mark">＝</div>
              <div className="child-preview">
                <span className="slot-label">うまれる金魚</span>
                {previewShape && previewColor ? <><GoldfishCanvas shapeId={previewShape} colorId={previewColor} /><strong>{game.speciesNames[speciesKey(previewShape, previewColor)] ?? "？？？"}</strong><small>{game.speciesNames[speciesKey(previewShape, previewColor)] ? "見つけたことが あるよ" : "まだ 見つけていないよ"}</small></> : <><span className="mystery-fish">？</span><strong>？？？</strong></>}
              </div>
              {breedPhase === "mixing" && <div className="mixing-layer"><span className="bubble b1" /><span className="bubble b2" /><span className="bubble b3" /><Sparkles /><strong>あたらしい金魚が<br />うまれそう…</strong></div>}
            </div>

            <div className="breed-action-row">
              <Button size="lg" className="breed-button" disabled={!shapeParent || !colorParent || breedPhase === "mixing"} onClick={startBreeding}>
                <Sparkles />{breedPhase === "mixing" ? "まっています…" : "かけあわせる"}
              </Button>
            </div>

            <div className="parent-picker">
              <div className="picker-heading"><div><span>{pickerSlot === "shape" ? "①" : "②"}</span><h3>{pickerSlot === "shape" ? "かたちの おやを えらぶ" : "いろの おやを えらぶ"}</h3></div><small>金魚を クリックしてね</small></div>
              <div className="parent-grid">
                {game.fish.map((fish) => {
                  const chosen = pickerSlot === "shape" ? shapeParentId === fish.id : colorParentId === fish.id;
                  const unavailable = pickerSlot === "shape" ? colorParentId === fish.id : shapeParentId === fish.id;
                  return (
                    <button type="button" key={fish.id} className={`parent-card ${chosen ? "chosen" : ""}`} disabled={unavailable} onClick={() => pickParent(fish)}>
                      {chosen && <span className="chosen-mark"><Check /></span>}
                      <GoldfishCanvas shapeId={fish.shapeId} colorId={fish.colorId} />
                      <strong>{displayName(fish)}</strong>
                      <small>{placeName(fish.tank)}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>
    );
  };

  const renderBook = () => {
    const discoveredKeys = Object.keys(game.speciesNames);
    const possibleKeys = unlockedParents.flatMap((shapeSource) => unlockedParents.map((colorSource) => speciesKey(shapeSource.shapeId, colorSource.colorId)));
    const discovered = possibleKeys.filter((key) => discoveredKeys.includes(key)).length;
    return (
      <section className="workspace book-workspace">
        <div className="workspace-heading book-heading">
          <div><p className="eyebrow">見つけた くみあわせ</p><h2>きんぎょずかん</h2></div>
          <div className="discovery-count"><strong>{discovered}</strong><span>/ {possibleKeys.length} しゅるい</span></div>
        </div>
        <div className="book-rule"><span className="shape-chip">たて：かたちのおや</span><Plus /><span className="color-chip">よこ：いろのおや</span><ArrowRight /><strong>うまれる金魚</strong></div>
        <div className="book-table-wrap">
          <Table className="breeding-table">
            <TableHeader>
              <TableRow>
                <TableHead className="corner-cell">かたち ＼ いろ</TableHead>
                {unlockedParents.map((parent) => <TableHead key={parent.colorId}><span>{COLORS[parent.colorId].label}</span></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {unlockedParents.map((shapeSource) => (
                <TableRow key={shapeSource.shapeId}>
                  <TableHead className="row-heading">{SHAPES[shapeSource.shapeId].label}</TableHead>
                  {unlockedParents.map((colorSource) => {
                    const key = speciesKey(shapeSource.shapeId, colorSource.colorId);
                    const name = game.speciesNames[key];
                    return (
                      <TableCell key={key} className={name ? "found-cell" : "unknown-cell"}>
                        {name ? <><GoldfishCanvas shapeId={shapeSource.shapeId} colorId={colorSource.colorId} /><strong>{name}</strong></> : <><span className="unknown-mark">？</span><small>まだ みつけていない</small></>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="locked-parents">
          {BASE_PARENTS.filter((parent) => parent.unlockAt > game.breedCount).slice(0, 1).map((parent) => (
            <div key={parent.name}><LockKeyhole /><span>あと {parent.unlockAt - game.breedCount}かいで、ずかんの たてと よこが ふえるよ</span></div>
          ))}
        </div>
      </section>
    );
  };

  const renderTanks = () => (
    <section className="workspace tanks-workspace">
      <div className="workspace-heading"><div><p className="eyebrow">10この すいそう</p><h2>どの すいそうを みる？</h2></div><p>1つの すいそうには 10ぴきまで はいれます。</p></div>
      <div className="tank-grid">
        {game.tankNames.map((name, tank) => {
          const residents = game.fish.filter((fish) => fish.tank === tank);
          return (
            <button type="button" className={`tank-card ${game.activeTank === tank ? "current" : ""}`} key={tank} onClick={() => goToTank(tank)}>
              {game.activeTank === tank && <span className="current-badge">いまの水槽</span>}
              <div className="tank-miniature">
                {residents.slice(0, 4).map((fish) => <GoldfishCanvas key={fish.id} shapeId={fish.shapeId} colorId={fish.colorId} />)}
                {residents.length === 0 && <Waves />}
              </div>
              <div className="tank-card-copy"><span>すいそう {tank + 1}</span><strong>{name}</strong><small>{residents.length} / 10 ひき</small></div>
            </button>
          );
        })}
      </div>
      <div className="rest-pond">
        <div className="rest-copy"><span className="rest-icon"><Waves /></span><div><p className="eyebrow">いっぱいに なっても あんしん</p><h3>おやすみ池</h3><p>ここにいる金魚も、おやに えらべます。</p></div><strong>{restFish.length} ひき</strong></div>
        {restFish.length > 0 ? <div className="rest-fish-grid">{restFish.map((fish) => <button type="button" key={fish.id} onClick={() => { setSelectedFishId(fish.id); setMoveOpen(true); }}><GoldfishCanvas shapeId={fish.shapeId} colorId={fish.colorId} /><span>{displayName(fish)}</span></button>)}</div> : <p className="rest-empty">いまは だれも いません。</p>}
      </div>
    </section>
  );

  return (
    <main className="game-shell">
      {renderHeader()}
      {view === "aquarium" && renderAquarium()}
      {view === "breed" && renderBreed()}
      {view === "book" && renderBook()}
      {view === "tanks" && renderTanks()}

      <nav className="game-nav" aria-label="ゲームのメニュー">
        <Button className={`nav-button ${view === "aquarium" ? "active" : ""}`} variant="ghost" onClick={() => setView("aquarium")}><Home />すいそうをみる</Button>
        <Button className={`nav-button ${view === "breed" ? "active" : ""}`} variant="ghost" onClick={() => setView("breed")}><FlaskConical />かけあわせ</Button>
        <Button className={`nav-button ${view === "book" ? "active" : ""}`} variant="ghost" onClick={() => setView("book")}><BookOpen />きんぎょずかん</Button>
        <Button className={`nav-button ${view === "tanks" ? "active" : ""}`} variant="ghost" onClick={() => setView("tanks")}><FishIcon />すいそういちらん</Button>
      </nav>

      <Dialog open={tutorialOpen} onOpenChange={() => undefined}>
        <DialogContent className="game-dialog tutorial-dialog" showCloseButton={false} onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
          <DialogHeader><DialogTitle>ようこそ！</DialogTitle><DialogDescription>ここは、あたらしい金魚を 見つける水族館です。</DialogDescription></DialogHeader>
          <div className="tutorial-fish"><GoldfishCanvas shapeId="ryukin" colorId="sakura" /><Sparkles /></div>
          <div className="tutorial-steps">
            <div><span>1</span><strong>ひだりの おや</strong><p>からだの かたちを うけつぐよ。</p></div>
            <div><span>2</span><strong>みぎの おや</strong><p>いろと もようを うけつぐよ。</p></div>
            <div><span>3</span><strong>なまえを つける</strong><p>同じ くみあわせなら、いつも 同じ金魚！</p></div>
          </div>
          <Button size="lg" onClick={completeTutorial}>わかった！ はじめる</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={nameOpen} onOpenChange={() => undefined}>
        <DialogContent className="game-dialog naming-dialog" showCloseButton={false} onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
          <DialogHeader><DialogTitle>しんしゅ はっけん！</DialogTitle><DialogDescription>この しゅるいに、すてきな名前を つけてね。</DialogDescription></DialogHeader>
          {pendingBirth && <div className="newborn-preview"><Sparkles /><GoldfishCanvas shapeId={pendingBirth.shapeId} colorId={pendingBirth.colorId} /></div>}
          <form onSubmit={submitName}>
            <label htmlFor="species-name">金魚の なまえ</label>
            <Input id="species-name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value.slice(0, 12))} maxLength={12} autoFocus />
            {pendingBirth && <div className="name-ideas"><span>なまえの ヒント</span>{nameIdeas(pendingBirth.shapeId, pendingBirth.colorId).map((idea) => <button type="button" key={idea} onClick={() => setNameDraft(idea)}>{idea}</button>)}</div>}
            <Button type="submit" size="lg" disabled={!nameDraft.trim()}><Check />この名前にする</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="game-dialog move-dialog">
          <DialogHeader><DialogTitle>どこへ おひっこしする？</DialogTitle><DialogDescription>{selectedFish ? displayName(selectedFish) : "金魚"}を いどうします。</DialogDescription></DialogHeader>
          <div className="destination-grid">
            {game.tankNames.map((name, tank) => {
              const count = game.fish.filter((fish) => fish.tank === tank).length;
              return <button type="button" key={tank} disabled={count >= 10 || selectedFish?.tank === tank} onClick={() => moveSelectedFish(tank)}><span>{tank + 1}</span><strong>{name}</strong><small>{count} / 10 ひき</small></button>;
            })}
            <button type="button" className="rest-destination" disabled={selectedFish?.tank === "rest"} onClick={() => moveSelectedFish("rest")}><span><Waves /></span><strong>おやすみ池</strong><small>いつでも もどせるよ</small></button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="game-dialog rename-dialog">
          <DialogHeader><DialogTitle>水槽の 名前を かえる</DialogTitle><DialogDescription>14もじまで つけられます。</DialogDescription></DialogHeader>
          <form onSubmit={renameTank}>
            <Input value={tankNameDraft} onChange={(event) => setTankNameDraft(event.target.value.slice(0, 14))} maxLength={14} autoFocus />
            <DialogFooter><Button type="submit" disabled={!tankNameDraft.trim()}>この名前にする</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" />
    </main>
  );
}
