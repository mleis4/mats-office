/*
 * ============================================================================
 * Program Name:   SunstangBoard.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    A stylised stand-in for the Sunstang Driver Controls board,
 *                 modelled in code until the real KiCad export is added: an
 *                 STM32, a CAN transceiver and connector, a 12 V input, a
 *                 buck converter, USB and diagnostic LEDs.
 *
 * Usage:          <SunstangBoard position={[x, y, z]} />
 * ============================================================================
 */

import Selectable from '../Selectable';
import TextPlane from '../TextPlane';

const BOARD_WIDTH = 0.56;
const BOARD_DEPTH = 0.38;
const BOARD_THICKNESS = 0.014;
const BOARD_TOP = BOARD_THICKNESS;

const PCB_BLACK = '#15171c';
const CHIP_BLACK = '#0b0b0d';
const GOLD = '#d4af37';
const SILK = '#f4ede0';
const SUNSTANG_GOLD = '#eba706';

// A rectangular part sitting on the board
function Part({ size, position, colour = CHIP_BLACK, metalness = 0, roughness = 0.6 }) {
  return (
    <mesh position={[position[0], BOARD_TOP + size[1] / 2, position[1]]} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={colour} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function StatusLed({ position, colour }) {
  return (
    <mesh position={[position[0], BOARD_TOP + 0.005, position[1]]}>
      <boxGeometry args={[0.016, 0.01, 0.01]} />
      <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={2.2} toneMapped={false} />
    </mesh>
  );
}

export default function SunstangBoard(groupProps) {
  const diagnosticLeds = ['#33ff66', '#ffb347', '#ff3b30', '#4da3ff'];

  return (
    <Selectable id="sunstang-board" label="Sunstang Driver Controls board" haloRadius={0.4} {...groupProps}>
      {/* PCB */}
      <mesh position={[0, BOARD_THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOARD_WIDTH, BOARD_THICKNESS, BOARD_DEPTH]} />
        <meshStandardMaterial color={PCB_BLACK} roughness={0.5} />
      </mesh>

      {/* Gold mounting holes in the corners */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([signX, signZ]) => (
        <mesh
          key={`${signX},${signZ}`}
          position={[signX * (BOARD_WIDTH / 2 - 0.03), BOARD_TOP + 0.0006, signZ * (BOARD_DEPTH / 2 - 0.03)]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.008, 0.016, 24]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* STM32 microcontroller */}
      <Part size={[0.1, 0.012, 0.1]} position={[-0.04, 0.0]} />
      <TextPlane
        lines={['STM32']}
        width={0.08}
        height={0.03}
        colour="#b9b9b9"
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSizeRatio={0.6}
        position={[-0.04, BOARD_TOP + 0.0126, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* CAN transceiver and screw-terminal connector */}
      <Part size={[0.05, 0.01, 0.04]} position={[0.14, -0.08]} />
      <Part size={[0.11, 0.05, 0.05]} position={[0.2, -0.15]} colour="#2f8f4a" />

      {/* 12 V input and buck converter (inductor + capacitors) */}
      <Part size={[0.08, 0.05, 0.05]} position={[-0.21, -0.15]} colour="#2f8f4a" />
      <Part size={[0.055, 0.04, 0.055]} position={[-0.2, -0.04]} colour="#3a3a3f" />
      <mesh position={[-0.12, BOARD_TOP + 0.022, -0.12]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.044, 20]} />
        <meshStandardMaterial color="#1c1c20" roughness={0.5} />
      </mesh>

      {/* USB connector and SWD header */}
      <Part size={[0.05, 0.022, 0.06]} position={[-0.245, 0.11]} colour="#b9b9be" metalness={0.8} roughness={0.35} />
      {Array.from({ length: 5 }, (_, pinIndex) => (
        <Part key={pinIndex} size={[0.008, 0.045, 0.008]} position={[0.08 + pinIndex * 0.02, 0.15]} colour={GOLD} metalness={0.9} roughness={0.3} />
      ))}

      {/* Diagnostic LEDs */}
      {diagnosticLeds.map((colour, ledIndex) => (
        <StatusLed key={colour} position={[0.12 + ledIndex * 0.035, 0.06]} colour={colour} />
      ))}

      {/* Silkscreen */}
      <TextPlane
        lines={['SUNSTANG']}
        width={0.2}
        height={0.04}
        colour={SUNSTANG_GOLD}
        fontSizeRatio={0.8}
        position={[-0.08, BOARD_TOP + 0.0008, 0.145]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <TextPlane
        lines={['DRIVER CONTROLS']}
        width={0.2}
        height={0.022}
        colour={SILK}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSizeRatio={0.75}
        position={[-0.08, BOARD_TOP + 0.0008, 0.112]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <TextPlane
        lines={['CAN']}
        width={0.06}
        height={0.022}
        colour={SILK}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSizeRatio={0.75}
        position={[0.2, BOARD_TOP + 0.0008, -0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <TextPlane
        lines={['12V']}
        width={0.06}
        height={0.022}
        colour={SILK}
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontSizeRatio={0.75}
        position={[-0.21, BOARD_TOP + 0.0008, -0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </Selectable>
  );
}
