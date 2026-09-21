"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
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
  tail: [number, number];
  dorsal: boolean;
  eyes: "normal" | "telescope";
  hood?: boolean;
  pearlScales?: boolean;
  tailStyle?: "butterfly" | "long";
};

type ColorStyle = {
  base: string;
  accent: string;
  extra?: string;
  pattern: "plain" | "patch" | "spots" | "cap" | "pearls" | "stripe" | "calico" | "cloud";
};

const SHAPES: Record<GoldfishShapeId, ShapeStyle> = {
  wakin: { body: [1.55, 0.72, 0.58], tail: [0.8, 0.86], dorsal: true, eyes: "normal" },
  ryukin: { body: [1.2, 1.04, 0.78], tail: [0.95, 1.02], dorsal: true, eyes: "normal" },
  demekin: { body: [1.3, 0.84, 0.66], tail: [0.92, 0.98], dorsal: true, eyes: "telescope" },
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

const tailShape = new THREE.Shape();
tailShape.moveTo(0.08, 0.18);
tailShape.quadraticCurveTo(-0.55, 0.95, -1.12, 0.72);
tailShape.quadraticCurveTo(-0.9, 0.2, -1.32, 0);
tailShape.quadraticCurveTo(-0.9, -0.2, -1.12, -0.72);
tailShape.quadraticCurveTo(-0.55, -0.95, 0.08, -0.18);
tailShape.closePath();

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

const SWIM_SPOTS: Array<[number, number, number]> = [
  [-3.1, 1.7, 0.1], [2.35, 1.45, -0.18], [-3.25, -1.3, -0.22], [2.45, -1.48, 0.14], [0, 0.08, -0.34],
  [-1.2, 2.35, -0.55], [1.25, 2.28, -0.48], [-1.15, -2.18, -0.47], [1.1, -2.23, -0.5], [0, -0.32, -0.62],
];

function GoldfishModel({ fish, index, total, selected, onSelect }: { fish: ThreeGoldfish; index: number; total: number; selected: boolean; onSelect: (id: string) => void }) {
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const fins = useRef<THREE.Group>(null);
  const style = SHAPES[fish.shapeId];
  const palette = COLORS[fish.colorId];
  const phase = (fish.seed % 360) * (Math.PI / 180);
  const [homeX, homeY, homeZ] = SWIM_SPOTS[index % SWIM_SPOTS.length];
  const densityScale = total >= 8 ? 0.44 : total >= 5 ? 0.5 : total >= 3 ? 0.62 : 0.76;

  useFrame(({ clock }) => {
    const item = group.current;
    if (item) {
      const time = clock.getElapsedTime() * 0.56 + phase;
      item.position.x = homeX + Math.sin(time * (0.58 + (fish.seed % 3) * 0.04)) * 0.45;
      item.position.y = homeY + Math.sin(time * 1.21) * 0.18;
      item.position.z = homeZ;
      item.rotation.z = Math.sin(time * 1.21) * 0.07;
      item.rotation.y = 0;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(clock.getElapsedTime() * 5.2 + phase) * 0.18;
    if (fins.current) fins.current.rotation.z = Math.sin(clock.getElapsedTime() * 4.5 + phase) * 0.12;
  });

  const eyeSize = style.eyes === "telescope" ? 0.27 : 0.17;
  const eyeX = style.body[0] * 0.68;
  const eyeY = style.body[1] * 0.18;
  const eyeZ = style.body[2] * 0.91;
  const highlight = selected ? "#ffe28a" : "#000000";

  return (
    <group ref={group} scale={densityScale} onClick={() => onSelect(fish.id)}>
      <group scale={selected ? 1.08 : 1}>
        <mesh scale={style.body} castShadow receiveShadow>
          <sphereGeometry args={[1, 28, 18]} />
          <meshPhysicalMaterial color={palette.base} roughness={0.36} metalness={0.04} clearcoat={0.72} clearcoatRoughness={0.26} emissive={highlight} emissiveIntensity={selected ? 0.16 : 0} />
        </mesh>
        <mesh position={[style.body[0] * 0.14, style.body[1] * 0.36, style.body[2] * 0.86]} scale={[0.32, 0.16, 0.025]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshBasicMaterial color="#fffdf0" transparent opacity={0.42} />
        </mesh>
        <PalettePattern style={palette} body={style.body} />
        {style.pearlScales && <PearlScales body={style.body} />}

        <group ref={tail} position={[-style.body[0] * 0.84, 0, -0.015]} scale={[style.tail[0], style.tail[1], 1]}>
          <mesh>
            <shapeGeometry args={[tailShape]} />
            <meshPhysicalMaterial color={palette.accent} transparent opacity={0.86} side={THREE.DoubleSide} roughness={0.32} clearcoat={0.66} />
          </mesh>
          {style.tailStyle === "butterfly" && <mesh position={[-0.45, 0, -0.02]} rotation={[0, 0, Math.PI]} scale={[1, 1, 1]}>
            <shapeGeometry args={[tailShape]} />
            <meshPhysicalMaterial color={palette.accent} transparent opacity={0.72} side={THREE.DoubleSide} roughness={0.32} clearcoat={0.66} />
          </mesh>}
        </group>

        {style.dorsal && <mesh position={[-0.08, style.body[1] * 0.92, 0]} scale={[0.2, 0.48, 0.05]}>
          <sphereGeometry args={[1, 16, 10]} />
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

        {style.eyes === "telescope" && <mesh position={[eyeX, eyeY, eyeZ * 0.82]} scale={[eyeSize * 1.35, eyeSize * 1.35, eyeSize * 1.12]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color={palette.base} roughness={0.34} clearcoat={0.58} />
        </mesh>}
        <mesh position={[eyeX, eyeY, eyeZ]} scale={[eyeSize, eyeSize, eyeSize * 0.48]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#fffdf0" roughness={0.26} />
        </mesh>
        <mesh position={[eyeX + eyeSize * 0.12, eyeY, eyeZ * 1.1]} scale={[eyeSize * 0.53, eyeSize * 0.53, eyeSize * 0.18]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#10191c" roughness={0.22} />
        </mesh>
        <mesh position={[eyeX + eyeSize * 0.01, eyeY + eyeSize * 0.16, eyeZ * 1.19]} scale={[eyeSize * 0.14, eyeSize * 0.14, eyeSize * 0.05]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#ffffff" />
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

export function GoldfishAquarium3D({ fish, selectedFishId, onSelect }: { fish: ThreeGoldfish[]; selectedFishId?: string; onSelect: (id: string) => void }) {
  return (
    <div className="three-aquarium-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 11.5], fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.45} color="#c8fff5" />
        <directionalLight position={[2, 5, 6]} intensity={2.15} color="#fff5d7" />
        <pointLight position={[-4, 2, 4]} intensity={2.1} color="#6ee8ff" distance={13} />
        <Bubbles />
        {fish.map((item, index) => <GoldfishModel key={item.id} fish={item} index={index} total={fish.length} selected={item.id === selectedFishId} onSelect={onSelect} />)}
      </Canvas>
    </div>
  );
}
