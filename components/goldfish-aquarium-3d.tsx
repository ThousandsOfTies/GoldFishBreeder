"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type GoldfishShapeId = "wakin" | "ryukin" | "demekin" | "oranda" | "ranchu" | "comet" | "pearl" | "butterfly";
export type GoldfishColorId = "beni" | "sakura" | "sumi" | "tancho" | "milk" | "lemon" | "calico" | "lavender";

export type ThreeGoldfish = {
  id: string;
  shapeId: GoldfishShapeId;
  colorId: GoldfishColorId;
  seed: number;
};

type ShapeStyle = {
  body: [number, number, number];
  bodyStyle?: "ryukin";
  tail: [number, number];
  dorsal: boolean;
  eyes: "normal" | "telescope";
  hood?: boolean;
  pearlScales?: boolean;
  tailStyle?: "butterfly" | "long" | "double";
};

type ColorStyle = {
  base: string;
  accent: string;
  extra?: string;
  pattern: "plain" | "patch" | "spots" | "cap" | "pearls" | "stripe" | "calico" | "cloud";
};

const SHAPES: Record<GoldfishShapeId, ShapeStyle> = {
  wakin: { body: [1.55, 0.72, 0.58], tail: [0.8, 0.86], dorsal: true, eyes: "normal", tailStyle: "double" },
  ryukin: { body: [1.18, 1.06, 0.75], bodyStyle: "ryukin", tail: [0.95, 1.02], dorsal: true, eyes: "normal" },
  demekin: { body: [1.04, 0.68, 0.54], tail: [0.82, 0.9], dorsal: true, eyes: "telescope" },
  oranda: { body: [1.25, 0.95, 0.7], tail: [0.95, 1.05], dorsal: true, eyes: "normal", hood: true },
  ranchu: { body: [1.28, 0.9, 0.72], tail: [0.76, 0.82], dorsal: false, eyes: "normal" },
  comet: { body: [1.68, 0.66, 0.53], tail: [1.4, 0.78], dorsal: true, eyes: "normal", tailStyle: "long" },
  pearl: { body: [0.9, 1.05, 0.88], tail: [0.78, 0.86], dorsal: true, eyes: "normal", pearlScales: true },
  butterfly: { body: [1.22, 0.84, 0.67], tail: [1.45, 1.25], dorsal: true, eyes: "normal", tailStyle: "butterfly" },
};

const COLORS: Record<GoldfishColorId, ColorStyle> = {
  beni: { base: "#eb5436", accent: "#ffbf70", pattern: "plain" },
  sakura: { base: "#f49282", accent: "#fff1da", pattern: "patch" },
  sumi: { base: "#26313a", accent: "#e97443", pattern: "spots" },
  tancho: { base: "#f5eee1", accent: "#d94b38", pattern: "cap" },
  milk: { base: "#f8e6b6", accent: "#fffdf3", pattern: "pearls" },
  lemon: { base: "#f2ce59", accent: "#e7f1ed", pattern: "stripe" },
  calico: { base: "#9ab8bd", accent: "#f07a43", extra: "#28343c", pattern: "calico" },
  lavender: { base: "#8b78a9", accent: "#efe5f6", pattern: "cloud" },
};

// 最初からいる出目金は、模様なしの黒出目金にする。
const BLACK_DEMEKIN: ColorStyle = { base: "#070a0c", accent: "#070a0c", pattern: "plain" };

const tailShape = new THREE.Shape();
tailShape.moveTo(0.08, 0.18);
tailShape.quadraticCurveTo(-0.55, 0.95, -1.12, 0.72);
tailShape.quadraticCurveTo(-0.9, 0.2, -1.32, 0);
tailShape.quadraticCurveTo(-0.9, -0.2, -1.12, -0.72);
tailShape.quadraticCurveTo(-0.55, -0.95, 0.08, -0.18);
tailShape.closePath();

// 和金の二つ尾。上・下の2枚を別のひれとして描く。
const doubleTailLobeShape = new THREE.Shape();
doubleTailLobeShape.moveTo(0.08, 0);
doubleTailLobeShape.quadraticCurveTo(-0.55, 0.12, -1.22, 0.78);
doubleTailLobeShape.quadraticCurveTo(-1.13, 0.24, -0.72, -0.1);
doubleTailLobeShape.quadraticCurveTo(-0.3, -0.14, 0.08, 0);
doubleTailLobeShape.closePath();

// 背びれは角ではなく、水に揺れる薄い扇形にする。
const dorsalFinShape = new THREE.Shape();
dorsalFinShape.moveTo(-0.42, 0);
dorsalFinShape.quadraticCurveTo(-0.3, 0.46, 0.04, 0.7);
dorsalFinShape.quadraticCurveTo(0.42, 0.38, 0.38, 0);
dorsalFinShape.closePath();

// 琉金は背中の高い、ややひし形の胴。上の頂点を後ろ、下の頂点を前にずらす。
const ryukinBodyGeometry = new THREE.SphereGeometry(1, 28, 18);
const ryukinPositions = ryukinBodyGeometry.getAttribute("position");
for (let index = 0; index < ryukinPositions.count; index += 1) {
  const x = ryukinPositions.getX(index);
  const y = ryukinPositions.getY(index);
  const z = ryukinPositions.getZ(index);
  const top = Math.max(y, 0);
  const bottom = Math.max(-y, 0);
  // 丸みを失わずに、背中の頂点は胴の中央、おなかは少し前寄りにする。
  // 背中側は絞るが、おなか側は幅を残して丸くふくらませる。
  const taper = 1 - 0.58 * Math.pow(top, 1.25) - 0.18 * Math.pow(bottom, 1.35);
  ryukinPositions.setXYZ(
    index,
    x * taper - 0.04 * Math.pow(top, 1.5) + 0.1 * Math.pow(bottom, 1.5),
    y * (1 + 0.12 * top + 0.03 * bottom),
    z * (1 - 0.12 * Math.abs(y)),
  );
}
ryukinBodyGeometry.computeVertexNormals();

function PalettePattern({ style, body }: { style: ColorStyle; body: ShapeStyle["body"] }) {
  const front = body[2] + 0.04;
  const circle = (x: number, y: number, size: number, color: string, key: string) => (
    <mesh key={key} position={[body[0] * x, body[1] * y, front]}>
      <circleGeometry args={[size, 20]} />
      <meshStandardMaterial color={color} roughness={0.52} metalness={0.08} />
    </mesh>
  );

  if (style.pattern === "plain") return null;
  if (style.pattern === "cap") return circle(0.66, 0.5, 0.28, style.accent, "cap");
  if (style.pattern === "patch" || style.pattern === "cloud") {
    return <>{circle(0.15, 0.46, 0.35, style.accent, "patch-a")}{circle(-0.45, -0.35, 0.33, style.accent, "patch-b")}</>;
  }
  if (style.pattern === "stripe") {
    return <>{[-0.42, 0, 0.42].map((x) => circle(x, 0, 0.11, style.accent, `stripe-${x}`))}</>;
  }
  if (style.pattern === "pearls") {
    return <>
      {[-0.48, -0.16, 0.16, 0.48].flatMap((x, column) => [-0.38, 0, 0.38].map((y, row) => circle(x, y + (column % 2 ? 0.08 : 0), 0.065, "#fffdf5", `pearl-${column}-${row}`)))}
    </>;
  }
  const spots: Array<[number, number, number, string]> = [
    [-0.48, 0.38, 0.19, style.accent],
    [-0.14, -0.36, 0.16, style.pattern === "calico" ? style.extra ?? "#26313a" : style.accent],
    [0.28, 0.31, 0.13, style.accent],
    [0.57, -0.16, 0.12, style.pattern === "calico" ? style.extra ?? "#26313a" : style.accent],
  ];
  return <>{spots.map(([x, y, size, color], index) => circle(x, y, size, color, `spot-${index}`))}</>;
}

function PearlScales({ body }: { body: ShapeStyle["body"] }) {
  return (
    <group>
      {[-0.44, -0.14, 0.16, 0.46].flatMap((x, column) => [-0.34, 0, 0.34].map((y, row) => (
        <mesh key={`${column}-${row}`} position={[body[0] * x, body[1] * y + (column % 2 ? 0.06 : 0), body[2] * 0.97]} scale={[0.09, 0.09, 0.035]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshPhysicalMaterial color="#fff5cf" roughness={0.24} metalness={0.08} clearcoat={0.78} />
        </mesh>
      )))}
    </group>
  );
}

type SwimState = {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  trip: number;
  personalSpace: number;
  avoidUntil: number;
};

type SwimRegistry = React.MutableRefObject<Map<string, SwimState>>;

// 最初だけゆるく散らしておき、以降はそれぞれが自由に次の行き先を選ぶ。
// これで水槽を開いた直後から、みんなが同じ場所へ集まりにくい。
const STARTING_SPOTS: Array<[number, number, number]> = [
  [-3.05, 1.45, -0.18], [2.75, 1.3, -0.28], [-3.15, -1.35, -0.3], [2.7, -1.4, -0.18], [0, 0.15, -0.5],
  [-1.2, 2.0, -0.5], [1.2, 2.0, -0.46], [-1.2, -1.95, -0.46], [1.15, -1.95, -0.5], [0, -0.45, -0.6],
];

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function nextDestination(seed: number, trip: number) {
  return {
    x: -4.15 + seededUnit(seed + trip * 13) * 8.3,
    y: -2.1 + seededUnit(seed + trip * 31) * 4.15,
    z: -0.6 + seededUnit(seed + trip * 47) * 0.72,
  };
}

function firstSwimState(seed: number, index: number, personalSpace: number): SwimState {
  const [x, y, z] = STARTING_SPOTS[index % STARTING_SPOTS.length];
  const target = nextDestination(seed, 1);
  return { x, y, z, targetX: target.x, targetY: target.y, targetZ: target.z, trip: 1, personalSpace, avoidUntil: 0 };
}

function chooseAvoidanceDestination(route: SwimState, other: SwimState, seed: number, time: number) {
  let awayX = route.x - other.x;
  let awayY = route.y - other.y;
  const distance = Math.hypot(awayX, awayY);

  // 完全に重なった瞬間にも、種ごとに一定の方向へ散れるようにする。
  if (distance < 0.001) {
    const angle = seededUnit(seed + route.trip * 71) * Math.PI * 2;
    awayX = Math.cos(angle);
    awayY = Math.sin(angle);
  } else {
    awayX /= distance;
    awayY /= distance;
  }

  route.targetX = THREE.MathUtils.clamp(route.x + awayX * 3.3, -4.15, 4.15);
  route.targetY = THREE.MathUtils.clamp(route.y + awayY * 2.7, -2.1, 2.05);
  route.targetZ = THREE.MathUtils.clamp(route.z + (seededUnit(seed + route.trip * 19) - 0.5) * 0.36, -0.6, 0.12);
  route.trip += 1;
  // 少しの間は同じ相手との再判定を待ち、方向転換時の震えを防ぐ。
  route.avoidUntil = time + 0.52;
}

function GoldfishModel({ fish, index, total, onSelect, swimmers, preview = false }: { fish: ThreeGoldfish; index: number; total: number; onSelect?: (id: string) => void; swimmers: SwimRegistry; preview?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const fins = useRef<THREE.Group>(null);
  const swim = useRef<SwimState | null>(null);
  const style = SHAPES[fish.shapeId];
  const palette = fish.shapeId === "demekin" && fish.colorId === "sumi" ? BLACK_DEMEKIN : COLORS[fish.colorId];
  const phase = (fish.seed % 360) * (Math.PI / 180);
  const densityScale = total >= 8 ? 0.34 : total >= 5 ? 0.4 : total >= 3 ? 0.5 : 0.62;
  const personalSpace = densityScale * (style.tailStyle ? 1.42 : style.body[0] > 1.5 ? 1.28 : 1.12);
  if (swim.current === null) {
    swim.current = swimmers.current.get(fish.id) ?? firstSwimState(fish.seed + index * 101, index, personalSpace);
    swimmers.current.set(fish.id, swim.current);
  }

  useEffect(() => {
    if (preview) return;
    return () => {
      swimmers.current.delete(fish.id);
    };
  }, [fish.id, preview, swimmers]);

  useFrame(({ clock }, delta) => {
    const item = group.current;
    const route = swim.current ?? (swim.current = firstSwimState(fish.seed + index * 101, index, personalSpace));
    if (item) {
      const time = clock.getElapsedTime() + phase;
      if (preview) {
        item.position.set(Math.sin(time * 0.72) * 0.12, Math.sin(time * 1.8) * 0.05, 0);
        item.scale.set(0.8, 0.8, 0.8);
        item.rotation.z = Math.sin(time * 1.8) * 0.025;
      } else {
        if (time >= route.avoidUntil) {
          for (const [otherId, other] of swimmers.current) {
            if (otherId === fish.id) continue;
            // 画面上の接触感に合わせ、奥行きではなく横・縦の見えない円で判定する。
            if (Math.hypot(route.x - other.x, route.y - other.y) < route.personalSpace + other.personalSpace) {
              chooseAvoidanceDestination(route, other, fish.seed + index * 101, time);
              break;
            }
          }
        }
        const dx = route.targetX - route.x;
        const dy = route.targetY - route.y;
        const dz = route.targetZ - route.z;
        const distance = Math.hypot(dx, dy, dz);
        if (distance < 0.12) {
          route.trip += 1;
          const destination = nextDestination(fish.seed + index * 101, route.trip);
          route.targetX = destination.x;
          route.targetY = destination.y;
          route.targetZ = destination.z;
        } else {
          const pace = 0.38 + (fish.seed % 4) * 0.045;
          const step = Math.min(distance, pace * delta);
          route.x += (dx / distance) * step;
          route.y += (dy / distance) * step;
          route.z += (dz / distance) * step;
        }
        item.position.set(route.x, route.y + Math.sin(time * 2.2) * 0.045, route.z);
        item.scale.set((route.targetX < route.x ? -1 : 1) * densityScale, densityScale, densityScale);
        item.rotation.z = THREE.MathUtils.lerp(item.rotation.z, Math.sin(time * 2.2) * 0.045, 0.05);
      }
    }
    if (tail.current) tail.current.rotation.z = Math.sin(clock.getElapsedTime() * 5.2 + phase) * 0.2;
    if (fins.current) fins.current.rotation.z = Math.sin(clock.getElapsedTime() * 4.5 + phase) * 0.14;
  });

  const eyeSize = style.eyes === "telescope" ? 0.34 : 0.17;
  const eyeX = style.body[0] * 0.68;
  const eyeY = style.body[1] * 0.18;
  const eyeZ = style.body[2] * 0.91;
  return (
    <group ref={group} onClick={() => onSelect?.(fish.id)}>
      <group>
        <mesh scale={style.body} castShadow receiveShadow>
          {style.bodyStyle === "ryukin" ? <primitive object={ryukinBodyGeometry} attach="geometry" /> : <sphereGeometry args={[1, 28, 18]} />}
          <meshPhysicalMaterial color={palette.base} roughness={0.36} metalness={0.04} clearcoat={0.72} clearcoatRoughness={0.26} />
        </mesh>
        <mesh position={[style.body[0] * 0.14, style.body[1] * 0.36, style.body[2] * 0.86]} scale={[0.32, 0.16, 0.025]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshBasicMaterial color="#fffdf0" transparent opacity={0.42} />
        </mesh>
        <PalettePattern style={palette} body={style.body} />
        {style.pearlScales && <PearlScales body={style.body} />}

        <group ref={tail} position={[-style.body[0] * 0.84, 0, -0.015]} scale={[style.tail[0], style.tail[1], 1]}>
          {style.tailStyle === "double" ? <>
            <mesh position={[0, 0.06, 0]}>
              <shapeGeometry args={[doubleTailLobeShape]} />
              <meshPhysicalMaterial color={palette.accent} transparent opacity={0.86} side={THREE.DoubleSide} roughness={0.32} clearcoat={0.66} />
            </mesh>
            <mesh position={[0, -0.06, -0.01]} scale={[1, -1, 1]}>
              <shapeGeometry args={[doubleTailLobeShape]} />
              <meshPhysicalMaterial color={palette.accent} transparent opacity={0.86} side={THREE.DoubleSide} roughness={0.32} clearcoat={0.66} />
            </mesh>
          </> : <mesh>
            <shapeGeometry args={[tailShape]} />
            <meshPhysicalMaterial color={palette.accent} transparent opacity={0.86} side={THREE.DoubleSide} roughness={0.32} clearcoat={0.66} />
          </mesh>}
          {style.tailStyle === "butterfly" && <mesh position={[-0.45, 0, -0.02]} rotation={[0, 0, Math.PI]} scale={[1, 1, 1]}>
            <shapeGeometry args={[tailShape]} />
            <meshPhysicalMaterial color={palette.accent} transparent opacity={0.72} side={THREE.DoubleSide} roughness={0.32} clearcoat={0.66} />
          </mesh>}
        </group>

        {style.dorsal && <mesh position={[-style.body[0] * 0.18, style.body[1] * 0.78, style.body[2] * 0.18]}>
          <shapeGeometry args={[dorsalFinShape]} />
          <meshPhysicalMaterial color={palette.accent} transparent opacity={0.84} side={THREE.DoubleSide} roughness={0.34} clearcoat={0.58} />
        </mesh>}

        <group ref={fins}>
          <mesh position={[style.body[0] * 0.08, -style.body[1] * 0.56, style.body[2] * 0.56]} rotation={[0, 0, -0.68]} scale={[0.25, 0.43, 0.04]}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshPhysicalMaterial color={palette.accent} transparent opacity={0.78} side={THREE.DoubleSide} roughness={0.32} clearcoat={0.55} />
          </mesh>
          <mesh position={[style.body[0] * 0.08, -style.body[1] * 0.56, -style.body[2] * 0.56]} rotation={[0, 0, -0.68]} scale={[0.25, 0.43, 0.04]}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshPhysicalMaterial color={palette.accent} transparent opacity={0.48} side={THREE.DoubleSide} roughness={0.32} />
          </mesh>
        </group>

        {style.hood && <group position={[eyeX * 0.75, style.body[1] * 0.48, style.body[2] * 0.4]}>
          {[[0, 0, 0], [0.16, 0.1, 0.03], [-0.13, 0.08, 0.02], [0.03, -0.13, 0.07]].map(([x, y, z], hoodIndex) => (
            <mesh key={hoodIndex} position={[x, y, z]} scale={[0.23, 0.2, 0.16]}>
              <sphereGeometry args={[1, 14, 10]} />
              <meshPhysicalMaterial color={palette.accent} roughness={0.42} clearcoat={0.5} />
            </mesh>
          ))}
        </group>}

        {style.eyes === "telescope" && <mesh position={[eyeX, eyeY, eyeZ * 0.82]} scale={[eyeSize * 1.28, eyeSize * 1.28, eyeSize * 1.08]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color={palette.base} roughness={0.34} clearcoat={0.58} />
        </mesh>}
        <mesh position={[eyeX, eyeY, eyeZ]} scale={[eyeSize, eyeSize, eyeSize * 0.72]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color="#10191c" roughness={0.18} clearcoat={0.7} clearcoatRoughness={0.12} />
        </mesh>
        <mesh position={[eyeX - eyeSize * 0.38, eyeY - eyeSize * 0.7, eyeZ * 1.02]} scale={[0.11, 0.065, 0.02]}>
          <circleGeometry args={[1, 16]} />
          <meshBasicMaterial color="#ff8f9e" transparent opacity={0.42} />
        </mesh>
        <mesh position={[eyeX + eyeSize * 0.48, eyeY - eyeSize * 0.78, eyeZ * 1.04]} scale={[0.075, 0.075, 0.02]}>
          <torusGeometry args={[1, 0.18, 6, 12, Math.PI]} />
          <meshBasicMaterial color="#713e3d" transparent opacity={0.72} />
        </mesh>
      </group>
    </group>
  );
}

function Bubbles() {
  const bubbles = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (bubbles.current) bubbles.current.position.y = (clock.getElapsedTime() * 0.28) % 1.4;
  });
  return <group ref={bubbles} position={[-4.1, -3.1, -1.2]}>
    {[0, 0.42, 0.91, 1.34, 1.7].map((offset, index) => (
      <mesh key={index} position={[Math.sin(index * 2.8) * 0.28, offset, 0]} scale={0.045 + (index % 3) * 0.025}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshPhysicalMaterial color="#d9ffff" transparent opacity={0.56} roughness={0.15} transmission={0.35} />
      </mesh>
    ))}
  </group>;
}

export function GoldfishAquarium3D({ fish, onSelect }: { fish: ThreeGoldfish[]; onSelect: (id: string) => void }) {
  const swimmers = useRef(new Map<string, SwimState>());

  return (
    <div className="three-aquarium-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 11.5], fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.45} color="#c8fff5" />
        <directionalLight position={[2, 5, 6]} intensity={2.15} color="#fff5d7" />
        <pointLight position={[-4, 2, 4]} intensity={2.1} color="#6ee8ff" distance={13} />
        <Bubbles />
        {fish.map((item, index) => <GoldfishModel key={item.id} fish={item} index={index} total={fish.length} onSelect={onSelect} swimmers={swimmers} />)}
      </Canvas>
    </div>
  );
}

export function GoldfishPreview3D({ fish }: { fish: ThreeGoldfish }) {
  const swimmers = useRef(new Map<string, SwimState>());

  return (
    <div className="goldfish-preview-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7], fov: 32 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.35} color="#c8fff5" />
        <directionalLight position={[2, 4, 5]} intensity={2.1} color="#fff5d7" />
        <pointLight position={[-3, 1, 4]} intensity={1.6} color="#6ee8ff" distance={10} />
        <GoldfishModel fish={fish} index={0} total={1} swimmers={swimmers} preview />
      </Canvas>
    </div>
  );
}
