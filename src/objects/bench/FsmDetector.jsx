/*
 * ============================================================================
 * Program Name:   FsmDetector.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Interactive 3D FPGA dev board for the workbench station.
 *                 Visitors flip the X switch and press CLK to clock bits into
 *                 my Moore FSM sequence detector (ECE 2277A). LEDs show the
 *                 three flip-flops (Q1-Q3) and output Z. A floating panel
 *                 shows the bit history, current state and a mini state map,
 *                 with shortcut buttons for visitors who just want to type bits.
 *
 * Usage:          <FsmDetector position={[x, y, z]} scale={0.5} showPanel />
 *                 Optional: panelPosition={[x, y, z]} moves the floating panel.
 * ============================================================================
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import {
  CLEAR_SEQUENCE,
  RESET_FLIP_FLOPS,
  SET_SEQUENCE,
  STATE_MEANINGS,
  computeNextState,
  computeOutput,
  getStateName,
} from './fsmLogic';

// ---------------------------------------------------------------------------
// Board dimensions and colours (scene units; scale the whole board with props)
// ---------------------------------------------------------------------------
const BOARD_WIDTH = 1.2;
const BOARD_DEPTH = 0.75;
const BOARD_THICKNESS = 0.04;
const BOARD_TOP = BOARD_THICKNESS / 2; // y-coordinate of the PCB surface

const PCB_COLOUR = '#17345e';
const SILKSCREEN_COLOUR = '#f2f0e6';
const LED_RED = '#ff3b30';
const LED_GREEN = '#33ff66';

const HISTORY_LENGTH = 12;        // bits kept in the on-screen history
const DEMO_STEP_MS = 650;         // delay between bits in demo mode
const BUTTON_PRESS_MS = 140;      // how long a push button stays pressed
const DEMO_SEQUENCE = '000110100101'; // shows Z rising on 0011 and falling on 0101

// ---------------------------------------------------------------------------
// SilkLabel: white silkscreen text printed flat on the PCB.
// Drawn on a canvas texture so no font files have to be downloaded.
// ---------------------------------------------------------------------------
function SilkLabel({ text, position, width = 0.16, height = 0.05, fontSizeRatio = 0.62 }) {
  const texture = useMemo(() => {
    // Wide labels get more pixels, so the board title stays as sharp as the short labels
    const canvasWidth = Math.max(256, Math.round(width * 1600));
    const canvasHeight = Math.round((canvasWidth * height) / width);
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const context = canvas.getContext('2d');
    context.fillStyle = SILKSCREEN_COLOUR;
    context.font = `bold ${Math.round(canvasHeight * fontSizeRatio)}px ui-monospace, Menlo, Consolas, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvasWidth / 2, canvasHeight / 2);

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.anisotropy = 4;
    return canvasTexture;
  }, [text, width, height, fontSizeRatio]);

  // Free GPU memory when the label changes or unmounts
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Led: a small dome that glows when isOn is true
// ---------------------------------------------------------------------------
function Led({ position, colour, isOn, label, radius = 0.028 }) {
  return (
    <group position={position}>
      {/* LED body */}
      <mesh position={[0, BOARD_TOP + radius * 0.4, 0]}>
        <sphereGeometry args={[radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isOn ? colour : '#3a2a2a'}
          emissive={colour}
          emissiveIntensity={isOn ? 3 : 0.04}
          toneMapped={!isOn}
          roughness={0.3}
        />
      </mesh>

      {/* No pointLight here: adding or removing a light changes the scene's
          light count, which makes three.js recompile every material and
          froze the page on each clock tick. The emissive dome is enough. */}

      <SilkLabel text={label} position={[0, BOARD_TOP + 0.001, 0.07]} width={0.12} height={0.04} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// PushButton: tactile switch that sinks while pressed
// ---------------------------------------------------------------------------
function PushButton({ position, label, isPressed, onPress }) {
  const [isHovered, setIsHovered] = useState(false);

  // Show a pointer cursor while hovering, and reset it on unmount
  useEffect(() => {
    document.body.style.cursor = isHovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [isHovered]);

  const capHeight = isPressed ? 0.008 : 0.022;

  return (
    <group position={position}>
      {/* Metal switch housing */}
      <mesh position={[0, BOARD_TOP + 0.012, 0]}>
        <boxGeometry args={[0.1, 0.024, 0.1]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Clickable button cap */}
      <mesh
        position={[0, BOARD_TOP + 0.024 + capHeight / 2, 0]}
        onClick={(event) => { event.stopPropagation(); onPress(); }}
        onPointerOver={(event) => { event.stopPropagation(); setIsHovered(true); }}
        onPointerOut={() => setIsHovered(false)}
      >
        <cylinderGeometry args={[0.032, 0.032, capHeight, 24]} />
        <meshStandardMaterial color={isHovered ? '#2f2f2f' : '#151515'} roughness={0.6} />
      </mesh>

      <SilkLabel text={label} position={[0, BOARD_TOP + 0.001, 0.09]} width={0.14} height={0.045} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// SlideSwitch: the X input. The slider sits back for 1 and forward for 0.
// ---------------------------------------------------------------------------
function SlideSwitch({ position, value, onToggle }) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = isHovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [isHovered]);

  const sliderZ = value ? -0.022 : 0.022;

  return (
    <group
      position={position}
      onClick={(event) => { event.stopPropagation(); onToggle(); }}
      onPointerOver={(event) => { event.stopPropagation(); setIsHovered(true); }}
      onPointerOut={() => setIsHovered(false)}
    >
      {/* Switch body */}
      <mesh position={[0, BOARD_TOP + 0.015, 0]}>
        <boxGeometry args={[0.06, 0.03, 0.11]} />
        <meshStandardMaterial color={isHovered ? '#2a2a2a' : '#111111'} roughness={0.5} />
      </mesh>

      {/* Moving slider */}
      <mesh position={[0, BOARD_TOP + 0.04, sliderZ]}>
        <boxGeometry args={[0.03, 0.025, 0.03]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.4} />
      </mesh>

      <SilkLabel text="1" position={[0.055, BOARD_TOP + 0.001, -0.03]} width={0.04} height={0.04} />
      <SilkLabel text="0" position={[0.055, BOARD_TOP + 0.001, 0.03]} width={0.04} height={0.04} />
      <SilkLabel text="X" position={[0, BOARD_TOP + 0.001, 0.1]} width={0.08} height={0.045} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Board details: everything below is decoration that makes the PCB read as a
// real dev board (chip leads, traces, passives, connectors, mounting holes).
// None of it is interactive.
// ---------------------------------------------------------------------------
const FPGA_CENTRE = [-0.2, -0.05];   // x, z of the FPGA chip
const FPGA_SIZE = 0.26;
const FPGA_LEADS_PER_SIDE = 11;
const FPGA_RIGHT_EDGE_X = FPGA_CENTRE[0] + FPGA_SIZE / 2;

const HEADER_PIN_COUNT = 20;
const HEADER_PIN_PITCH = 0.05;
const HEADER_FIRST_PIN_X = -0.48;
const HEADER_ROW_ZS = [-0.33, -0.305];

const MOUNTING_HOLE_INSET = 0.045;   // hole centre, measured from the board edges
const TRACE_WIDTH = 0.007;
const TRACE_HEIGHT = 0.0012;

const TRACE_COLOUR = '#2a5796';
const CHIP_BLACK = '#1a1a1a';
const SOLDER_SILVER = '#c9ccd1';
const GOLD = '#d4af37';

// Each trace leaves the FPGA's right edge at startZ, runs to the part's x,
// then turns to reach the part. The order keeps the traces from crossing.
const TRACE_ROUTES = [
  { startZ: -0.13, endX: 0.2, endZ: -0.15 },   // Q1 LED
  { startZ: -0.115, endX: 0.3, endZ: -0.15 },  // Q2 LED
  { startZ: -0.1, endX: 0.4, endZ: -0.15 },    // Q3 LED
  { startZ: -0.085, endX: 0.5, endZ: -0.15 },  // Z LED
  { startZ: 0.06, endX: 0.12, endZ: 0.12 },    // X switch
  { startZ: 0.04, endX: 0.3, endZ: 0.12 },     // CLK button
  { startZ: 0.02, endX: 0.46, endZ: 0.12 },    // RST button
];

// Surface-mount resistors (black) and capacitors (tan): [x, z, turned 90 degrees]
const RESISTOR_SPOTS = [
  [0.2, -0.225, false], [0.3, -0.225, false], [0.4, -0.225, false], [0.5, -0.225, false],
  [0.21, 0.02, true], [0.38, 0.0, true],
];
const CAPACITOR_SPOTS = [
  [-0.035, -0.035, true], [-0.38, -0.1, true], [-0.38, 0.0, true],
  [-0.12, 0.115, false], [-0.2, -0.215, false], [-0.27, 0.17, true],
];

function Trace({ startZ, endX, endZ }) {
  const runLength = endX - FPGA_RIGHT_EDGE_X;
  const turnLength = Math.abs(endZ - startZ);
  const traceY = BOARD_TOP + TRACE_HEIGHT / 2;

  return (
    <group>
      <mesh position={[FPGA_RIGHT_EDGE_X + runLength / 2, traceY, startZ]}>
        <boxGeometry args={[runLength + TRACE_WIDTH, TRACE_HEIGHT, TRACE_WIDTH]} />
        <meshStandardMaterial color={TRACE_COLOUR} roughness={0.4} />
      </mesh>
      <mesh position={[endX, traceY, (startZ + endZ) / 2]}>
        <boxGeometry args={[TRACE_WIDTH, TRACE_HEIGHT, turnLength]} />
        <meshStandardMaterial color={TRACE_COLOUR} roughness={0.4} />
      </mesh>
    </group>
  );
}

function SurfaceMountPart({ x, z, isTurned, colour }) {
  return (
    <group position={[x, BOARD_TOP, z]} rotation={[0, isTurned ? Math.PI / 2 : 0, 0]}>
      {/* Solder pads at both ends, then the part body on top */}
      <mesh position={[0, 0.003, 0]}>
        <boxGeometry args={[0.04, 0.006, 0.018]} />
        <meshStandardMaterial color={SOLDER_SILVER} metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.026, 0.012, 0.019]} />
        <meshStandardMaterial color={colour} roughness={0.6} />
      </mesh>
    </group>
  );
}

function MountingHole({ x, z }) {
  return (
    <group position={[x, BOARD_TOP + 0.0008, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[0.014, 0.028, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.014, 24]} />
        <meshBasicMaterial color="#0c0c0c" />
      </mesh>
    </group>
  );
}

function FpgaChip() {
  const [chipX, chipZ] = FPGA_CENTRE;
  const leadOffsets = useMemo(() => {
    const leadSpan = FPGA_SIZE - 0.04;
    return Array.from(
      { length: FPGA_LEADS_PER_SIDE },
      (_, leadIndex) => -leadSpan / 2 + (leadIndex * leadSpan) / (FPGA_LEADS_PER_SIDE - 1),
    );
  }, []);
  const leadReach = FPGA_SIZE / 2 + 0.006;

  return (
    <group position={[chipX, BOARD_TOP, chipZ]}>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[FPGA_SIZE, 0.024, FPGA_SIZE]} />
        <meshStandardMaterial color={CHIP_BLACK} roughness={0.7} />
      </mesh>
      {/* Raised centre of the package */}
      <mesh position={[0, 0.0245, 0]}>
        <boxGeometry args={[FPGA_SIZE - 0.03, 0.003, FPGA_SIZE - 0.03]} />
        <meshStandardMaterial color="#232323" roughness={0.5} />
      </mesh>
      {/* Pin 1 marker */}
      <mesh position={[-FPGA_SIZE / 2 + 0.035, 0.0265, FPGA_SIZE / 2 - 0.035]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.009, 16]} />
        <meshBasicMaterial color="#8a8a8a" />
      </mesh>

      {/* Leads on all four sides */}
      {leadOffsets.map((leadOffset) => (
        <group key={leadOffset}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * leadReach, 0.004, leadOffset]}>
                <boxGeometry args={[0.02, 0.008, 0.01]} />
                <meshStandardMaterial color={SOLDER_SILVER} metalness={0.85} roughness={0.3} />
              </mesh>
              <mesh position={[leadOffset, 0.004, side * leadReach]}>
                <boxGeometry args={[0.01, 0.008, 0.02]} />
                <meshStandardMaterial color={SOLDER_SILVER} metalness={0.85} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      <SilkLabel text="FPGA" position={[0, 0.0265, -0.01]} width={0.16} height={0.06} />
    </group>
  );
}

// Memoised: it has no props, so clocking bits never re-renders its ~250 meshes
const BoardDetails = memo(function BoardDetails() {
  const headerPinXs = useMemo(
    () => Array.from({ length: HEADER_PIN_COUNT }, (_, pinIndex) => HEADER_FIRST_PIN_X + pinIndex * HEADER_PIN_PITCH),
    [],
  );
  const headerCentreX = HEADER_FIRST_PIN_X + ((HEADER_PIN_COUNT - 1) * HEADER_PIN_PITCH) / 2;
  const headerCentreZ = (HEADER_ROW_ZS[0] + HEADER_ROW_ZS[1]) / 2;
  const holeX = BOARD_WIDTH / 2 - MOUNTING_HOLE_INSET;
  const holeZ = BOARD_DEPTH / 2 - MOUNTING_HOLE_INSET;

  return (
    <group>
      {/* ---------------- Chips ---------------- */}
      <FpgaChip />

      {/* Shift register chip, with a strip of leads down each long side */}
      <mesh position={[-0.47, BOARD_TOP + 0.01, -0.05]}>
        <boxGeometry args={[0.08, 0.02, 0.17]} />
        <meshStandardMaterial color={CHIP_BLACK} roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[-0.47 + side * 0.046, BOARD_TOP + 0.004, -0.05]}>
          <boxGeometry args={[0.014, 0.008, 0.15]} />
          <meshStandardMaterial color={SOLDER_SILVER} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      <SilkLabel text="U1" position={[-0.3, BOARD_TOP + 0.001, 0.105]} width={0.06} height={0.03} />
      <SilkLabel text="U2" position={[-0.47, BOARD_TOP + 0.001, 0.06]} width={0.06} height={0.03} />

      {/* ---------------- Traces and passives ---------------- */}
      {TRACE_ROUTES.map((route) => <Trace key={route.startZ} {...route} />)}
      {RESISTOR_SPOTS.map(([x, z, isTurned]) => (
        <SurfaceMountPart key={`${x},${z}`} x={x} z={z} isTurned={isTurned} colour="#2b2622" />
      ))}
      {CAPACITOR_SPOTS.map(([x, z, isTurned]) => (
        <SurfaceMountPart key={`${x},${z}`} x={x} z={z} isTurned={isTurned} colour="#b89a6a" />
      ))}

      {/* Crystal oscillator */}
      <mesh position={[-0.2, BOARD_TOP + 0.011, 0.17]}>
        <boxGeometry args={[0.075, 0.022, 0.05]} />
        <meshStandardMaterial color={SOLDER_SILVER} metalness={0.9} roughness={0.25} />
      </mesh>
      <SilkLabel text="OSC" position={[-0.2, BOARD_TOP + 0.001, 0.225]} width={0.08} height={0.032} />

      {/* ---------------- Power and USB, on the left edge ---------------- */}
      {/* Barrel jack */}
      <mesh position={[-0.54, BOARD_TOP + 0.045, -0.2]}>
        <boxGeometry args={[0.13, 0.09, 0.09]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      <mesh position={[-0.606, BOARD_TOP + 0.045, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.026, 0.026, 0.004, 20]} />
        <meshStandardMaterial color="#050505" roughness={0.4} />
      </mesh>
      {/* Bulk capacitor, voltage regulator and power LED */}
      <mesh position={[-0.42, BOARD_TOP + 0.03, -0.2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.06, 20]} />
        <meshStandardMaterial color="#20242b" roughness={0.45} />
      </mesh>
      <mesh position={[-0.42, BOARD_TOP + 0.0605, -0.2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.001, 20]} />
        <meshStandardMaterial color={SOLDER_SILVER} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[-0.335, BOARD_TOP + 0.01, -0.225]}>
        <boxGeometry args={[0.06, 0.02, 0.045]} />
        <meshStandardMaterial color={CHIP_BLACK} roughness={0.7} />
      </mesh>
      <mesh position={[-0.39, BOARD_TOP + 0.005, -0.15]}>
        <boxGeometry args={[0.02, 0.01, 0.012]} />
        <meshStandardMaterial color={LED_GREEN} emissive={LED_GREEN} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <SilkLabel text="5V" position={[-0.42, BOARD_TOP + 0.001, -0.253]} width={0.06} height={0.032} />

      {/* USB socket */}
      <mesh position={[-0.555, BOARD_TOP + 0.022, 0.17]}>
        <boxGeometry args={[0.1, 0.044, 0.09]} />
        <meshStandardMaterial color={SOLDER_SILVER} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[-0.606, BOARD_TOP + 0.022, 0.17]}>
        <boxGeometry args={[0.002, 0.026, 0.07]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
      </mesh>
      <SilkLabel text="USB" position={[-0.53, BOARD_TOP + 0.001, 0.245]} width={0.08} height={0.032} />

      {/* ---------------- Two-row pin header along the back edge ---------------- */}
      <mesh position={[headerCentreX, BOARD_TOP + 0.01, headerCentreZ]}>
        <boxGeometry args={[HEADER_PIN_COUNT * HEADER_PIN_PITCH, 0.02, 0.055]} />
        <meshStandardMaterial color="#121212" roughness={0.7} />
      </mesh>
      {HEADER_ROW_ZS.map((rowZ) => headerPinXs.map((pinX) => (
        <mesh key={`${pinX},${rowZ}`} position={[pinX, BOARD_TOP + 0.035, rowZ]}>
          <boxGeometry args={[0.01, 0.07, 0.01]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
        </mesh>
      )))}
      <SilkLabel text="GPIO" position={[0, BOARD_TOP + 0.001, -0.255]} width={0.1} height={0.032} />

      {/* ---------------- Mounting holes ---------------- */}
      {[-1, 1].map((sideX) => [-1, 1].map((sideZ) => (
        <MountingHole key={`${sideX},${sideZ}`} x={sideX * holeX} z={sideZ * holeZ} />
      )))}
    </group>
  );
});

// ---------------------------------------------------------------------------
// MiniStateMap: eight states in two rows (Z = 0 on top, Z = 1 below),
// with the current state highlighted
// ---------------------------------------------------------------------------
function MiniStateMap({ currentState }) {
  const stateRows = [
    ['S0', 'S1', 'S2', 'S3'],
    ['S4', 'S5', 'S6', 'S7'],
  ];

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {stateRows.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 34, fontSize: 11, opacity: 0.7 }}>Z={rowIndex}</span>
          {row.map((stateName) => {
            const isCurrent = stateName === currentState;
            return (
              <span
                key={stateName}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  border: `1px solid ${isCurrent ? '#ffb347' : 'rgba(255,255,255,0.25)'}`,
                  background: isCurrent ? 'rgba(255,179,71,0.25)' : 'transparent',
                  transition: 'all 150ms',
                }}
              >
                {stateName}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FsmDetector: the full interactive board
// ---------------------------------------------------------------------------
export default function FsmDetector({ showPanel = true, panelPosition = [0, 0.48, -0.3], ...groupProps }) {
  const [flipFlops, setFlipFlops] = useState(RESET_FLIP_FLOPS);
  const [switchValue, setSwitchValue] = useState(0);
  const [bitHistory, setBitHistory] = useState([]);
  const [pressedButton, setPressedButton] = useState(null); // 'clk' | 'rst' | null
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const demoTimerRef = useRef(null);
  const pressTimerRef = useRef(null);

  // Stable DOM target for the info panel. Without it, drei's <Html> can
  // re-mount its React root right after the canvas connects its events,
  // which wipes the panel (seen with @react-three/fiber 9.8 + drei 10.7).
  const canvasElement = useThree((state) => state.gl.domElement);
  const panelPortalRef = useRef(canvasElement.parentNode);

  const currentState = getStateName(flipFlops);
  const outputZ = computeOutput(flipFlops);

  // Briefly sink a push button so the click feels physical
  const animatePress = (buttonName) => {
    setPressedButton(buttonName);
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => setPressedButton(null), BUTTON_PRESS_MS);
  };

  // Rising clock edge: latch the next state for the given input bit
  const clockInBit = (inputBit) => {
    animatePress('clk');
    setFlipFlops((previous) => computeNextState(previous, inputBit));
    setBitHistory((previous) => [...previous, inputBit].slice(-HISTORY_LENGTH));
  };

  // Reset button: clear all three flip-flops (back to S0, Z = 0)
  const resetCircuit = () => {
    animatePress('rst');
    stopDemo();
    setFlipFlops(RESET_FLIP_FLOPS);
    setBitHistory([]);
  };

  // Shortcut used by the panel buttons: set the switch, then clock it in
  const sendBit = (inputBit) => {
    setSwitchValue(inputBit);
    clockInBit(inputBit);
  };

  // Demo mode: feed DEMO_SEQUENCE one bit at a time
  const startDemo = () => {
    resetCircuit();
    setIsDemoRunning(true);
    let bitIndex = 0;

    const playNextBit = () => {
      if (bitIndex >= DEMO_SEQUENCE.length) {
        setIsDemoRunning(false);
        return;
      }
      sendBit(Number(DEMO_SEQUENCE[bitIndex]));
      bitIndex += 1;
      demoTimerRef.current = setTimeout(playNextBit, DEMO_STEP_MS);
    };

    demoTimerRef.current = setTimeout(playNextBit, DEMO_STEP_MS);
  };

  function stopDemo() {
    clearTimeout(demoTimerRef.current);
    setIsDemoRunning(false);
  }

  // Clear timers when the board unmounts
  useEffect(() => () => {
    clearTimeout(demoTimerRef.current);
    clearTimeout(pressTimerRef.current);
  }, []);

  const panelButtonStyle = {
    flex: 1,
    padding: '6px 0',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.08)',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
  };

  return (
    <group {...groupProps}>
      {/* ---------------- PCB ---------------- */}
      <RoundedBox args={[BOARD_WIDTH, BOARD_THICKNESS, BOARD_DEPTH]} radius={0.015} smoothness={3}>
        <meshStandardMaterial color={PCB_COLOUR} roughness={0.55} />
      </RoundedBox>

      {/* Chips, traces, passives, connectors, header and mounting holes */}
      <BoardDetails />

      {/* Board title */}
      <SilkLabel text="MOORE FSM / 0011 SET  0101 CLR" position={[0.05, BOARD_TOP + 0.001, 0.31]} width={0.9} height={0.05} />

      {/* ---------------- Outputs: flip-flop LEDs and Z ---------------- */}
      <Led position={[0.2, 0, -0.15]} colour={LED_RED} isOn={flipFlops.q1 === 1} label="Q1" />
      <Led position={[0.3, 0, -0.15]} colour={LED_RED} isOn={flipFlops.q2 === 1} label="Q2" />
      <Led position={[0.4, 0, -0.15]} colour={LED_RED} isOn={flipFlops.q3 === 1} label="Q3" />
      <Led position={[0.5, 0, -0.15]} colour={LED_GREEN} isOn={outputZ === 1} label="Z" radius={0.036} />

      {/* ---------------- Inputs ---------------- */}
      <SlideSwitch
        position={[0.12, 0, 0.12]}
        value={switchValue}
        onToggle={() => setSwitchValue((previous) => (previous ? 0 : 1))}
      />
      <PushButton
        position={[0.3, 0, 0.12]}
        label="CLK"
        isPressed={pressedButton === 'clk'}
        onPress={() => clockInBit(switchValue)}
      />
      <PushButton
        position={[0.46, 0, 0.12]}
        label="RST"
        isPressed={pressedButton === 'rst'}
        onPress={resetCircuit}
      />

      {/* ---------------- Info panel ---------------- */}
      {showPanel && (
        <Html portal={panelPortalRef} position={panelPosition} center distanceFactor={1.4} zIndexRange={[20, 0]}>
          {/* Stop clicks here: the panel sits over empty canvas, so R3F would
              treat them as missed clicks and close the focus */}
          <div
            data-testid="fsm-panel"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              width: 300,
              padding: 14,
              borderRadius: 12,
              background: 'rgba(16, 20, 28, 0.88)',
              color: '#f2f0e6',
              font: '13px/1.4 ui-monospace, Menlo, Consolas, monospace',
              userSelect: 'none',
            }}
          >
            <div style={{ fontSize: 14, marginBottom: 4 }}>Moore FSM sequence detector</div>
            <div style={{ opacity: 0.75, marginBottom: 10 }}>
              {SET_SEQUENCE} sets Z &middot; {CLEAR_SEQUENCE} clears Z
            </div>

            {/* Bit history, newest on the right */}
            <div style={{ display: 'flex', gap: 3, minHeight: 22, marginBottom: 10 }} data-testid="fsm-history">
              {bitHistory.length === 0 && <span style={{ opacity: 0.5 }}>no bits yet</span>}
              {bitHistory.map((bit, bitIndex) => (
                <span
                  key={bitIndex}
                  style={{
                    width: 18,
                    textAlign: 'center',
                    borderRadius: 4,
                    background: bitIndex === bitHistory.length - 1 ? 'rgba(255,179,71,0.35)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {bit}
                </span>
              ))}
            </div>

            {/* Current state readout */}
            <div style={{ marginBottom: 10 }} data-testid="fsm-state">
              <b>{currentState}</b> &middot; Q1Q2Q3 = {flipFlops.q1}{flipFlops.q2}{flipFlops.q3} &middot; Z = {outputZ}
              <div style={{ opacity: 0.75 }}>{STATE_MEANINGS[currentState]}</div>
            </div>

            <MiniStateMap currentState={currentState} />

            {/* Shortcut controls */}
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button type="button" style={panelButtonStyle} onClick={() => sendBit(0)} disabled={isDemoRunning}>Send 0</button>
              <button type="button" style={panelButtonStyle} onClick={() => sendBit(1)} disabled={isDemoRunning}>Send 1</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button type="button" style={panelButtonStyle} onClick={isDemoRunning ? stopDemo : startDemo}>
                {isDemoRunning ? 'Stop demo' : 'Play demo'}
              </button>
              <button type="button" style={panelButtonStyle} onClick={resetCircuit}>Reset</button>
            </div>

            <div style={{ opacity: 0.55, fontSize: 11, marginTop: 10 }}>
              Or flip X on the board and press CLK.
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
