/*
 * ============================================================================
 * Program Name:   Hallway.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The hallway outside the office door, which is the first
 *                 thing a visitor sees: a painted wall with wood panelling
 *                 below a chair rail, a lit sconce on each side of the door,
 *                 a doormat, a carpet runner and a potted plant. All of it is
 *                 built in code and none of it is clickable.
 * ============================================================================
 */

import * as THREE from 'three';
import { DeskPlant } from '../objects/desk/DeskDecor';
import { ROOM } from './stations';

// The door wall's outside face. Office.jsx builds that wall 0.12 thick.
const WALL_FACE_Z = ROOM.halfDepth + 0.12;
const WALL_HALF_SPAN = 6;            // how far the hallway wall runs to each side
const DOOR_FRAME_HALF_WIDTH = 0.58;  // outer edge of the door frame (Door.jsx)
const DOOR_FRAME_TOP_Y = 2.18;

const PANELLING_HEIGHT = 0.95;
const PANEL_STILE_SPACING = 0.62;    // distance between the panelling's upright strips

const PAINT_COLOUR = '#74826f';
const PANELLING_COLOUR = '#d2c6ad';
const TRIM_COLOUR = '#d7c2a0';
const BRASS = '#c9a24a';
const SCONCE_GLOW = '#ffd9a8';

const SCONCE_X = 1.05;
const SCONCE_Y = 1.78;

// ---------------------------------------------------------------------------
// WallSection: one stretch of hallway wall, from startX to endX: paint on top,
// panelling below, with a chair rail and a baseboard
// ---------------------------------------------------------------------------
function WallSection({ startX, endX }) {
  const sectionWidth = endX - startX;
  const centreX = (startX + endX) / 2;
  const stileCount = Math.floor(sectionWidth / PANEL_STILE_SPACING) + 1;
  const stileXs = Array.from({ length: stileCount }, (_, stileIndex) => startX + stileIndex * PANEL_STILE_SPACING);

  return (
    <group>
      {/* Painted upper wall */}
      <mesh position={[centreX, (ROOM.height + PANELLING_HEIGHT) / 2, WALL_FACE_Z + 0.008]}>
        <planeGeometry args={[sectionWidth, ROOM.height - PANELLING_HEIGHT]} />
        <meshStandardMaterial color={PAINT_COLOUR} roughness={0.95} />
      </mesh>

      {/* Panelling, with upright strips, a chair rail on top and a baseboard */}
      <mesh position={[centreX, PANELLING_HEIGHT / 2, WALL_FACE_Z + 0.008]}>
        <boxGeometry args={[sectionWidth, PANELLING_HEIGHT, 0.016]} />
        <meshStandardMaterial color={PANELLING_COLOUR} roughness={0.8} />
      </mesh>
      {stileXs.map((stileX) => (
        <mesh key={stileX} position={[stileX, PANELLING_HEIGHT / 2, WALL_FACE_Z + 0.02]}>
          <boxGeometry args={[0.07, PANELLING_HEIGHT - 0.1, 0.012]} />
          <meshStandardMaterial color={PANELLING_COLOUR} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[centreX, PANELLING_HEIGHT, WALL_FACE_Z + 0.02]}>
        <boxGeometry args={[sectionWidth, 0.05, 0.04]} />
        <meshStandardMaterial color={TRIM_COLOUR} roughness={0.7} />
      </mesh>
      <mesh position={[centreX, 0.07, WALL_FACE_Z + 0.018]}>
        <boxGeometry args={[sectionWidth, 0.14, 0.036]} />
        <meshStandardMaterial color={TRIM_COLOUR} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Sconce: a brass wall light with a glowing shade. Its light warms the wall.
// ---------------------------------------------------------------------------
function Sconce(groupProps) {
  return (
    <group {...groupProps}>
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.09, 0.2, 0.016]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.03, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.08, 12]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Shade: open at the top and bottom, lit from inside */}
      <mesh position={[0, 0.03, 0.09]}>
        <cylinderGeometry args={[0.07, 0.05, 0.15, 24, 1, true]} />
        <meshStandardMaterial color="#fff1d6" emissive={SCONCE_GLOW} emissiveIntensity={0.9} roughness={0.6} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.06, 0.2]} color={SCONCE_GLOW} intensity={1.5} distance={3} />
    </group>
  );
}

export default function Hallway() {
  return (
    <group>
      {/* ---------------- The wall, on both sides of the door and above it ---------------- */}
      <WallSection startX={-WALL_HALF_SPAN} endX={-DOOR_FRAME_HALF_WIDTH} />
      <WallSection startX={DOOR_FRAME_HALF_WIDTH} endX={WALL_HALF_SPAN} />
      {/* Above the door: a little wider than the frame and tucked behind the side sections, so no seam shows */}
      <mesh position={[0, (ROOM.height + DOOR_FRAME_TOP_Y) / 2, WALL_FACE_Z + 0.006]}>
        <planeGeometry args={[DOOR_FRAME_HALF_WIDTH * 2 + 0.2, ROOM.height - DOOR_FRAME_TOP_Y]} />
        <meshStandardMaterial color={PAINT_COLOUR} roughness={0.95} />
      </mesh>

      {/* ---------------- Lights ---------------- */}
      <Sconce position={[-SCONCE_X, SCONCE_Y, WALL_FACE_Z]} />
      <Sconce position={[SCONCE_X, SCONCE_Y, WALL_FACE_Z]} />

      {/* ---------------- On the floor ---------------- */}
      {/* Carpet runner along the hallway, with a lighter middle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, WALL_FACE_Z + 1.05]}>
        <planeGeometry args={[WALL_HALF_SPAN * 2, 1.5]} />
        <meshStandardMaterial color="#6e2f27" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, WALL_FACE_Z + 1.05]}>
        <planeGeometry args={[WALL_HALF_SPAN * 2, 1.2]} />
        <meshStandardMaterial color="#8f4a3a" roughness={1} />
      </mesh>
      {/* Doormat */}
      <mesh position={[0, 0.012, WALL_FACE_Z + 0.42]}>
        <boxGeometry args={[0.95, 0.016, 0.55]} />
        <meshStandardMaterial color="#3d3528" roughness={1} />
      </mesh>
      <mesh position={[0, 0.0205, WALL_FACE_Z + 0.42]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.81, 0.41]} />
        <meshStandardMaterial color="#8a7550" roughness={1} />
      </mesh>

      {/* A floor plant beside the door: the desk plant, scaled up */}
      <DeskPlant position={[-1.6, 0, WALL_FACE_Z + 0.3]} scale={2.3} />
    </group>
  );
}
