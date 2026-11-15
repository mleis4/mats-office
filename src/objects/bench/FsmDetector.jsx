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

import { useEffect, useMemo, useRef, useState } from 'react';
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
    const canvasWidth = 256;
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

      {/* Light spill onto the board when lit */}
      {isOn && (
        <pointLight position={[0, BOARD_TOP + 0.06, 0]} color={colour} intensity={0.25} distance={0.35} />
      )}

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

  // Header pins along the back edge of the board, for looks
  const headerPinXs = useMemo(
    () => Array.from({ length: 20 }, (_, pinIndex) => -0.48 + pinIndex * 0.05),
    [],
  );

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

      {/* FPGA chip */}
      <mesh position={[-0.2, BOARD_TOP + 0.012, -0.05]}>
        <boxGeometry args={[0.26, 0.024, 0.26]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      <SilkLabel text="FPGA" position={[-0.2, BOARD_TOP + 0.0255, -0.05]} width={0.16} height={0.06} />

      {/* Shift register chip */}
      <mesh position={[-0.47, BOARD_TOP + 0.01, -0.05]}>
        <boxGeometry args={[0.08, 0.02, 0.17]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>

      {/* Header pins */}
      {headerPinXs.map((pinX) => (
        <mesh key={pinX} position={[pinX, BOARD_TOP + 0.03, -0.33]}>
          <boxGeometry args={[0.012, 0.06, 0.012]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

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
          <div
            data-testid="fsm-panel"
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
