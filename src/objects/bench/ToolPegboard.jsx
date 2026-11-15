/*
 * ============================================================================
 * Program Name:   ToolPegboard.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The wide pegboard on the wall between the workbench and its
 *                 shelf, filled with electronics tools: screwdrivers, pliers,
 *                 wire cutters, tweezers, a multimeter, spools of hook-up
 *                 wire, a reel of solder, a steel ruler and a row of parts
 *                 bins. Everything is built in code and is scene dressing
 *                 only (not clickable).
 *
 * Usage:          <ToolPegboard width={2.0} height={0.56} position={[x, y, z]} />
 *                 position is the centre of the board, on the wall surface.
 * ============================================================================
 */

import Pegboard, { PEGBOARD_FACE_Z } from '../Pegboard';
import TextPlane from '../TextPlane';

const STEEL = '#b9bcc2';
const DARK_STEEL = '#55585e';
const PEG_COLOUR = '#2b2b2e';
const MONO_FONT = 'ui-monospace, Menlo, Consolas, monospace';

const SCREWDRIVER_HANDLES = ['#c5402f', '#eba706', '#2f5d8a', '#3f7d4e', '#c5402f'];
const WIRE_COLOURS = ['#c5402f', '#1a1a1a', '#eba706', '#3f7d4e'];
const BIN_COLOURS = ['#c5402f', '#eba706', '#2f5d8a', '#eba706', '#c5402f', '#2f5d8a'];

// ---------------------------------------------------------------------------
// Peg: the short hook a tool hangs from
// ---------------------------------------------------------------------------
function Peg({ length = 0.04, ...groupProps }) {
  return (
    <mesh {...groupProps} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.004, 0.004, length, 8]} />
      <meshStandardMaterial color={PEG_COLOUR} roughness={0.5} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Screwdriver: hangs handle-up. position is the top of the handle.
// ---------------------------------------------------------------------------
function Screwdriver({ handleColour, shaftLength = 0.12, ...groupProps }) {
  return (
    <group {...groupProps}>
      <mesh position={[0, -0.045, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.012, 0.09, 12]} />
        <meshStandardMaterial color={handleColour} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.09 - shaftLength / 2, 0]} castShadow>
        <cylinderGeometry args={[0.0035, 0.0035, shaftLength, 8]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Pliers: two splayed handles below a pair of jaws. position is the pivot.
// longNose makes needle-nose pliers; otherwise they are stubby wire cutters.
// ---------------------------------------------------------------------------
function Pliers({ handleColour, longNose = false, ...groupProps }) {
  const jawLength = longNose ? 0.075 : 0.035;

  return (
    <group {...groupProps}>
      {[-1, 1].map((side) => (
        <group key={side} rotation={[0, 0, side * 0.16]}>
          <mesh position={[0, -0.065, 0]} castShadow>
            <boxGeometry args={[0.014, 0.12, 0.012]} />
            <meshStandardMaterial color={handleColour} roughness={0.6} />
          </mesh>
          <mesh position={[side * -0.004, jawLength / 2, 0]} castShadow>
            <boxGeometry args={[longNose ? 0.007 : 0.012, jawLength, 0.008]} />
            <meshStandardMaterial color={DARK_STEEL} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.014, 12]} />
        <meshStandardMaterial color={DARK_STEEL} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Tweezers: two thin steel arms meeting at the bottom. position is the top.
// ---------------------------------------------------------------------------
function Tweezers(groupProps) {
  return (
    <group {...groupProps}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.005, -0.065, 0]} rotation={[0, 0, side * 0.07]} castShadow>
          <boxGeometry args={[0.005, 0.13, 0.004]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// WireSpool: a reel in the wire's own colour on a peg, its axis pointing out
// of the wall
// ---------------------------------------------------------------------------
function WireSpool({ wireColour, radius = 0.05, ...groupProps }) {
  return (
    <group {...groupProps} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[radius * 0.78, radius * 0.78, 0.036, 20]} />
        <meshStandardMaterial color={wireColour} roughness={0.55} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, side * 0.021, 0]} castShadow>
          <cylinderGeometry args={[radius, radius, 0.006, 20]} />
          <meshStandardMaterial color={wireColour} roughness={0.75} />
        </mesh>
      ))}
      {/* Paper label on the front of the reel */}
      <mesh position={[0, 0.0245, 0]}>
        <cylinderGeometry args={[radius * 0.45, radius * 0.45, 0.002, 20]} />
        <meshStandardMaterial color="#e9e2d0" roughness={0.9} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.008, 0.008, 0.056, 10]} />
        <meshStandardMaterial color={PEG_COLOUR} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Multimeter: yellow case, a display, a dial and two probe jacks
// ---------------------------------------------------------------------------
function Multimeter(groupProps) {
  return (
    <group {...groupProps}>
      <mesh castShadow>
        <boxGeometry args={[0.085, 0.16, 0.032]} />
        <meshStandardMaterial color="#eba706" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[0.07, 0.145, 0.032]} />
        <meshStandardMaterial color="#26272b" roughness={0.6} />
      </mesh>
      <TextPlane
        lines={['3.30']}
        width={0.056}
        height={0.03}
        colour="#1a1814"
        background="#b8c4a4"
        fontFamily={MONO_FONT}
        fontSizeRatio={0.8}
        position={[0, 0.047, 0.0185]}
      />
      <mesh position={[0, -0.008, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.008, 20]} />
        <meshStandardMaterial color="#3a3b40" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.002, 0.0245]}>
        <boxGeometry args={[0.005, 0.03, 0.003]} />
        <meshStandardMaterial color="#d8d3c8" roughness={0.5} />
      </mesh>
      {[['#c5402f', -0.018], ['#1a1a1a', 0.018]].map(([jackColour, jackX]) => (
        <mesh key={jackColour} position={[jackX, -0.054, 0.019]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.006, 12]} />
          <meshStandardMaterial color={jackColour} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// ToolPegboard
// Tools are laid out as fractions of the board's size, so the board can be
// resized with the bench.
// ---------------------------------------------------------------------------
export default function ToolPegboard({ width, height, ...groupProps }) {
  const toolZ = PEGBOARD_FACE_Z + 0.022;       // tools hang just proud of the board
  const hangY = height * 0.36;                 // the row of pegs tools hang from
  const acrossBoard = (fraction) => (fraction - 0.5) * width;

  const binWidth = 0.1;
  const binRowWidth = BIN_COLOURS.length * (binWidth + 0.012);

  return (
    <Pegboard width={width} height={height} {...groupProps}>
      {/* Screwdrivers, longest first */}
      {SCREWDRIVER_HANDLES.map((handleColour, driverIndex) => (
        <group key={driverIndex} position={[acrossBoard(0.05) + driverIndex * 0.055, hangY, toolZ]}>
          <Peg position={[0, -0.012, -0.012]} />
          <Screwdriver handleColour={handleColour} shaftLength={0.15 - driverIndex * 0.02} />
        </group>
      ))}

      {/* Needle-nose pliers, wire cutters and tweezers */}
      <group position={[acrossBoard(0.25), hangY - 0.07, toolZ]}>
        <Peg position={[0, 0.006, -0.012]} />
        <Pliers handleColour="#c5402f" longNose />
      </group>
      <group position={[acrossBoard(0.31), hangY - 0.04, toolZ]}>
        <Peg position={[0, 0.006, -0.012]} />
        <Pliers handleColour="#2f5d8a" />
      </group>
      <group position={[acrossBoard(0.36), hangY, toolZ]}>
        <Peg position={[0, -0.006, -0.012]} />
        <Tweezers />
      </group>

      {/* Multimeter */}
      <Multimeter position={[acrossBoard(0.45), height * 0.1, PEGBOARD_FACE_Z + 0.018]} />

      {/* Spools of hook-up wire, and a reel of solder */}
      {WIRE_COLOURS.map((wireColour, spoolIndex) => (
        <WireSpool
          key={wireColour}
          wireColour={wireColour}
          position={[acrossBoard(0.56) + spoolIndex * 0.125, height * 0.2, PEGBOARD_FACE_Z + 0.03]}
        />
      ))}
      <WireSpool wireColour={STEEL} radius={0.036} position={[acrossBoard(0.56) + 0.06, -height * 0.02, PEGBOARD_FACE_Z + 0.03]} />

      {/* Steel ruler, hung sideways */}
      <mesh position={[acrossBoard(0.88), height * 0.3, PEGBOARD_FACE_Z + 0.006]} castShadow>
        <boxGeometry args={[0.32, 0.026, 0.002]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wire strippers and flush cutters on the right */}
      <group position={[acrossBoard(0.84), hangY - 0.2, toolZ]}>
        <Peg position={[0, 0.006, -0.012]} />
        <Pliers handleColour="#eba706" />
      </group>
      <group position={[acrossBoard(0.91), hangY - 0.2, toolZ]}>
        <Peg position={[0, 0.006, -0.012]} />
        <Pliers handleColour="#3f7d4e" longNose />
      </group>

      {/* A row of parts bins along the bottom, left of centre */}
      {BIN_COLOURS.map((binColour, binIndex) => (
        <mesh
          key={binIndex}
          position={[acrossBoard(0.04) + binWidth / 2 + binIndex * (binRowWidth / BIN_COLOURS.length), -height * 0.36, PEGBOARD_FACE_Z + 0.04]}
          castShadow
        >
          <boxGeometry args={[binWidth, 0.07, 0.08]} />
          <meshStandardMaterial color={binColour} roughness={0.6} />
        </mesh>
      ))}
    </Pegboard>
  );
}
