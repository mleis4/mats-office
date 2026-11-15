/*
 * ============================================================================
 * Program Name:   Office.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The room shell and furniture, all modelled in code: floor,
 *                 walls (with the doorway), ceiling, the workbench and its
 *                 shelf, the desk and a rug. The stations place their
 *                 objects on top of this furniture. Sizes come from
 *                 stations.js, so the room can be resized in one place.
 * ============================================================================
 */

import { BENCH, BENCH_TOP_Y, DESK, DESK_TOP_Y, ROOM, SHELF, SHELF_TOP_Y } from './stations';

// ---------------------------------------------------------------------------
// Colours (palette anchors from the README)
// ---------------------------------------------------------------------------
const WALL_COLOUR = '#3b4359';
const DOOR_WALL_OUTSIDE = '#2c3347';
const FLOOR_COLOUR = '#6b4a30';
const CEILING_COLOUR = '#2a2622';
const WOOD_LIGHT = '#a8774b';
const WOOD_DARK = '#5e3f28';
const METAL_DARK = '#2b2b2e';
const TRIM_COLOUR = '#d7c2a0';

const WALL_THICKNESS = 0.12;
const DOOR_WIDTH = 1.0;
const DOOR_HEIGHT = 2.1;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function Slab({ size, position, colour, roughness = 0.75, castShadow = true }) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={colour} roughness={roughness} />
    </mesh>
  );
}

// A table: a top with four legs. position is the centre of the footprint.
function Table({ position, width, depth, topY, topColour = WOOD_LIGHT, legColour = WOOD_DARK }) {
  const topThickness = 0.06;
  const legSize = 0.07;
  const legHeight = topY - topThickness;
  const legX = width / 2 - legSize;
  const legZ = depth / 2 - legSize;

  return (
    <group position={position}>
      <Slab size={[width, topThickness, depth]} position={[0, topY - topThickness / 2, 0]} colour={topColour} roughness={0.6} />
      {[[-legX, -legZ], [legX, -legZ], [-legX, legZ], [legX, legZ]].map(([x, z]) => (
        <Slab key={`${x},${z}`} size={[legSize, legHeight, legSize]} position={[x, legHeight / 2, z]} colour={legColour} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Walls: three solid walls plus the door wall with its opening
// ---------------------------------------------------------------------------
function Walls() {
  const { halfWidth, halfDepth, height } = ROOM;
  const roomWidth = halfWidth * 2;
  const roomDepth = halfDepth * 2;
  const sidePanelWidth = (roomWidth - DOOR_WIDTH) / 2;
  const sidePanelX = DOOR_WIDTH / 2 + sidePanelWidth / 2;
  const lintelHeight = height - DOOR_HEIGHT;
  const doorWallZ = halfDepth + WALL_THICKNESS / 2;

  return (
    <group>
      {/* Back, left and right walls */}
      <Slab size={[roomWidth + 0.3, height, WALL_THICKNESS]} position={[0, height / 2, -halfDepth - WALL_THICKNESS / 2]} colour={WALL_COLOUR} roughness={0.95} castShadow={false} />
      <Slab size={[WALL_THICKNESS, height, roomDepth + 0.3]} position={[-halfWidth - WALL_THICKNESS / 2, height / 2, 0]} colour={WALL_COLOUR} roughness={0.95} castShadow={false} />
      <Slab size={[WALL_THICKNESS, height, roomDepth + 0.3]} position={[halfWidth + WALL_THICKNESS / 2, height / 2, 0]} colour={WALL_COLOUR} roughness={0.95} castShadow={false} />

      {/* Door wall: left panel, right panel, and the lintel above the door */}
      <Slab size={[sidePanelWidth + 3, height, WALL_THICKNESS]} position={[-sidePanelX - 1.5, height / 2, doorWallZ]} colour={DOOR_WALL_OUTSIDE} roughness={0.95} castShadow={false} />
      <Slab size={[sidePanelWidth + 3, height, WALL_THICKNESS]} position={[sidePanelX + 1.5, height / 2, doorWallZ]} colour={DOOR_WALL_OUTSIDE} roughness={0.95} castShadow={false} />
      <Slab size={[DOOR_WIDTH, lintelHeight, WALL_THICKNESS]} position={[0, DOOR_HEIGHT + lintelHeight / 2, doorWallZ]} colour={DOOR_WALL_OUTSIDE} roughness={0.95} castShadow={false} />

      {/* Cream baseboards */}
      <Slab size={[roomWidth, 0.1, 0.02]} position={[0, 0.05, -halfDepth + 0.01]} colour={TRIM_COLOUR} castShadow={false} />
      <Slab size={[0.02, 0.1, roomDepth]} position={[-halfWidth + 0.01, 0.05, 0]} colour={TRIM_COLOUR} castShadow={false} />
      <Slab size={[0.02, 0.1, roomDepth]} position={[halfWidth - 0.01, 0.05, 0]} colour={TRIM_COLOUR} castShadow={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Office: everything that doesn't move
// ---------------------------------------------------------------------------
export default function Office() {
  const { halfWidth, halfDepth, height } = ROOM;

  return (
    <group>
      {/* Floor (extends into the hallway outside the door) and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.5]} receiveShadow>
        <planeGeometry args={[halfWidth * 2 + 6, halfDepth * 2 + 6]} />
        <meshStandardMaterial color={FLOOR_COLOUR} roughness={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 1.5]}>
        <planeGeometry args={[halfWidth * 2 + 6, halfDepth * 2 + 6]} />
        <meshStandardMaterial color={CEILING_COLOUR} roughness={1} />
      </mesh>

      <Walls />

      {/* Rug in the middle of the room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.25]} receiveShadow>
        <planeGeometry args={[2.6, 1.8]} />
        <meshStandardMaterial color="#8a3d2c" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.25]} receiveShadow>
        <planeGeometry args={[2.25, 1.45]} />
        <meshStandardMaterial color="#b9785a" roughness={1} />
      </mesh>

      {/* ---------------- Workbench against the back wall ---------------- */}
      <Table position={[0, 0, BENCH.z]} width={BENCH.width} depth={BENCH.depth} topY={BENCH_TOP_Y} />
      {/* Lower shelf of the bench */}
      <Slab size={[BENCH.width - 0.3, 0.04, 0.7]} position={[0, 0.3, BENCH.z]} colour={WOOD_DARK} />
      {/* Wall shelf above the bench, on metal brackets */}
      <Slab size={[SHELF.width, 0.04, SHELF.depth]} position={[0, SHELF_TOP_Y - 0.02, SHELF.z]} colour={WOOD_LIGHT} roughness={0.6} />
      {[-1, 0, 1].map((side) => (
        <Slab key={side} size={[0.03, 0.2, 0.3]} position={[side * (SHELF.width / 2 - 0.15), SHELF_TOP_Y - 0.14, SHELF.z - 0.03]} colour={METAL_DARK} />
      ))}

      {/* ---------------- Desk against the right wall ---------------- */}
      <group position={[DESK.x, 0, DESK.z]} rotation={[0, Math.PI / 2, 0]}>
        <Table position={[0, 0, 0]} width={DESK.width} depth={DESK.depth} topY={DESK_TOP_Y} />
      </group>

      {/* The hobby-corner cabinet is a model, placed in HobbyCorner.jsx */}
    </group>
  );
}
