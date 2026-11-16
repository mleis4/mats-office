/*
 * ============================================================================
 * Program Name:   DeskDecor.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The decor on the desk, all built in code: a potted plant, a
 *                 candle in a glass jar with a flickering flame, a coffee mug
 *                 on a coaster, a stack of books and a notebook with a pen.
 *                 None of it is clickable.
 *
 * Usage:          <DeskPlant position={[x, deskTopY, z]} />
 *                 Every piece sits on the surface at its position.
 * ============================================================================
 */

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const TERRACOTTA = '#b9603c';
const SOIL_BROWN = '#3a2a1e';
const PAGE_CREAM = '#efe6d2';
const FLAME_ORANGE = '#ffb347';

// ---------------------------------------------------------------------------
// DeskPlant: a terracotta pot on a saucer, with two rings of leaves
// ---------------------------------------------------------------------------
const POT_HEIGHT = 0.12;
const POT_TOP_Y = 0.136; // top of the soil, where the leaves start

// Each leaf: which way it points, how far it leans out, how long it is
const LEAVES = [
  { angle: 0.0, lean: 0.16, length: 0.25, colour: '#3f8f4f' },
  { angle: 2.1, lean: 0.2, length: 0.23, colour: '#357f45' },
  { angle: 4.2, lean: 0.14, length: 0.27, colour: '#46995a' },
  { angle: 0.7, lean: 0.52, length: 0.2, colour: '#4a9c58' },
  { angle: 1.75, lean: 0.6, length: 0.18, colour: '#3b8749' },
  { angle: 2.8, lean: 0.5, length: 0.21, colour: '#52a763' },
  { angle: 3.85, lean: 0.62, length: 0.19, colour: '#3f8f4f' },
  { angle: 4.9, lean: 0.55, length: 0.2, colour: '#48a05c' },
  { angle: 5.95, lean: 0.58, length: 0.18, colour: '#357f45' },
];

export function DeskPlant(groupProps) {
  return (
    <group {...groupProps}>
      {/* Saucer, pot, rim and soil */}
      <mesh position={[0, 0.005, 0]} castShadow>
        <cylinderGeometry args={[0.078, 0.07, 0.01, 28]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.008 + POT_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.072, 0.052, POT_HEIGHT, 28]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.122, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.078, 0.024, 28]} />
        <meshStandardMaterial color="#c56c45" roughness={0.85} />
      </mesh>
      <mesh position={[0, POT_TOP_Y - 0.001, 0]}>
        <cylinderGeometry args={[0.068, 0.068, 0.002, 28]} />
        <meshStandardMaterial color={SOIL_BROWN} roughness={1} />
      </mesh>

      {/* Leaves: each one is a flattened ellipsoid that leans out from the centre */}
      {LEAVES.map(({ angle, lean, length, colour }) => (
        <group key={angle} position={[0, POT_TOP_Y - 0.01, 0]} rotation={[0, angle, 0]}>
          <group rotation={[lean, 0, 0]}>
            <mesh position={[0, length / 2, 0]} scale={[0.026, length / 2, 0.006]} castShadow>
              <sphereGeometry args={[1, 14, 12]} />
              <meshStandardMaterial color={colour} roughness={0.7} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Candle: wax in a glass jar. The flame and its light flicker.
// ---------------------------------------------------------------------------
const JAR_HEIGHT = 0.085;
const WAX_HEIGHT = 0.055;
const FLAME_LIGHT_INTENSITY = 0.35;

export function Candle(groupProps) {
  const flameRef = useRef();
  const flameLightRef = useRef();

  // Two sine waves at unrelated speeds read as a flicker
  useFrame(({ clock }) => {
    const flicker = Math.sin(clock.elapsedTime * 11) * 0.5 + Math.sin(clock.elapsedTime * 23) * 0.3;
    flameRef.current.scale.set(1 + flicker * 0.06, 1.9 + flicker * 0.22, 1 + flicker * 0.06);
    flameLightRef.current.intensity = FLAME_LIGHT_INTENSITY * (1 + flicker * 0.18);
  });

  return (
    <group {...groupProps}>
      {/* Wax and wick */}
      <mesh position={[0, 0.004 + WAX_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.036, 0.036, WAX_HEIGHT, 24]} />
        <meshStandardMaterial color="#f1e4c8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.004 + WAX_HEIGHT + 0.006, 0]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.012, 6]} />
        <meshStandardMaterial color="#1a1512" roughness={0.9} />
      </mesh>

      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.004 + WAX_HEIGHT + 0.024, 0]} scale={[1, 1.9, 1]}>
        <sphereGeometry args={[0.007, 12, 10]} />
        <meshBasicMaterial color={FLAME_ORANGE} toneMapped={false} />
      </mesh>
      <pointLight
        ref={flameLightRef}
        position={[0, 0.004 + WAX_HEIGHT + 0.04, 0]}
        color={FLAME_ORANGE}
        intensity={FLAME_LIGHT_INTENSITY}
        distance={0.9}
      />

      {/* Glass jar: a thick base and see-through walls */}
      <mesh position={[0, 0.002, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.042, 0.004, 24]} />
        <meshStandardMaterial color="#c9a37a" roughness={0.2} />
      </mesh>
      <mesh position={[0, JAR_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.042, 0.042, JAR_HEIGHT, 24, 1, true]} />
        <meshStandardMaterial color="#e8b98a" roughness={0.1} transparent opacity={0.32} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Paper label around the jar */}
      <mesh position={[0, 0.036, 0]}>
        <cylinderGeometry args={[0.0425, 0.0425, 0.028, 24, 1, true, -0.9, 1.8]} />
        <meshStandardMaterial color={PAGE_CREAM} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// CoffeeMug: a mug with a handle, full of coffee, on a cork coaster
// ---------------------------------------------------------------------------
const MUG_RADIUS = 0.04;
const MUG_HEIGHT = 0.095;
const COASTER_HEIGHT = 0.005;

export function CoffeeMug(groupProps) {
  return (
    <group {...groupProps}>
      <mesh position={[0, COASTER_HEIGHT / 2, 0]} receiveShadow>
        <cylinderGeometry args={[0.056, 0.056, COASTER_HEIGHT, 28]} />
        <meshStandardMaterial color="#b08a5c" roughness={1} />
      </mesh>

      <group position={[0, COASTER_HEIGHT, 0]}>
        <mesh position={[0, MUG_HEIGHT / 2, 0]} castShadow>
          <cylinderGeometry args={[MUG_RADIUS, MUG_RADIUS * 0.9, MUG_HEIGHT, 28]} />
          <meshStandardMaterial color="#b65a3a" roughness={0.45} />
        </mesh>
        {/* Rim and the coffee just below it */}
        <mesh position={[0, MUG_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[MUG_RADIUS - 0.003, 0.003, 8, 28]} />
          <meshStandardMaterial color="#c56a48" roughness={0.45} />
        </mesh>
        <mesh position={[0, MUG_HEIGHT + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[MUG_RADIUS - 0.005, 28]} />
          <meshStandardMaterial color="#2b1a10" roughness={0.25} />
        </mesh>
        {/* Handle: half a ring on the side */}
        <mesh position={[MUG_RADIUS - 0.004, MUG_HEIGHT / 2, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <torusGeometry args={[0.026, 0.006, 10, 20, Math.PI]} />
          <meshStandardMaterial color="#b65a3a" roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Book: two cover boards, a spine and the block of pages between them
// ---------------------------------------------------------------------------
const COVER_THICKNESS = 0.004;

function Book({ width, height, depth, colour, ...groupProps }) {
  return (
    <group {...groupProps}>
      {[COVER_THICKNESS / 2, height - COVER_THICKNESS / 2].map((boardY) => (
        <mesh key={boardY} position={[0, boardY, 0]} castShadow>
          <boxGeometry args={[width, COVER_THICKNESS, depth]} />
          <meshStandardMaterial color={colour} roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[-width / 2 + COVER_THICKNESS / 2, height / 2, 0]}>
        <boxGeometry args={[COVER_THICKNESS, height, depth]} />
        <meshStandardMaterial color={colour} roughness={0.75} />
      </mesh>
      <mesh position={[COVER_THICKNESS / 2, height / 2, 0]}>
        <boxGeometry args={[width - 0.012, height - COVER_THICKNESS * 2, depth - 0.012]} />
        <meshStandardMaterial color={PAGE_CREAM} roughness={0.95} />
      </mesh>
    </group>
  );
}

// The books, bottom to top. turn is how far each is twisted on the stack, in radians.
const BOOK_STACK = [
  { width: 0.21, height: 0.036, depth: 0.28, colour: '#17345e', turn: 0.04 },
  { width: 0.19, height: 0.028, depth: 0.26, colour: '#8a2f2a', turn: -0.09 },
  { width: 0.17, height: 0.022, depth: 0.24, colour: '#c9962f', turn: 0.12 },
];

export function BookStack(groupProps) {
  let stackHeight = 0;

  return (
    <group {...groupProps}>
      {BOOK_STACK.map(({ turn, ...book }) => {
        const bookY = stackHeight;
        stackHeight += book.height;
        return <Book key={book.colour} {...book} position={[0, bookY, 0]} rotation={[0, turn, 0]} />;
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// NotebookAndPen: a closed notebook with an elastic band, and a pen beside it
// ---------------------------------------------------------------------------
export function NotebookAndPen(groupProps) {
  return (
    <group {...groupProps}>
      <Book width={0.15} height={0.014} depth={0.21} colour="#22262e" />
      {/* Elastic band */}
      <mesh position={[0.045, 0.0145, 0]}>
        <boxGeometry args={[0.008, 0.001, 0.21]} />
        <meshStandardMaterial color="#c9962f" roughness={0.8} />
      </mesh>

      {/* Pen, lying beside the notebook */}
      <group position={[0.11, 0.005, 0.01]} rotation={[Math.PI / 2, 0, 0.12]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.005, 0.005, 0.13, 12]} />
          <meshStandardMaterial color="#1c1c1e" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.074, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.005, 0.018, 12]} />
          <meshStandardMaterial color="#c9ccd1" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0.006]}>
          <boxGeometry args={[0.003, 0.04, 0.002]} />
          <meshStandardMaterial color="#c9ccd1" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
