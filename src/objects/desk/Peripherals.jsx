/*
 * ============================================================================
 * Program Name:   Peripherals.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The things in front of the monitor, built in code: a desk
 *                 mat, a keyboard with individual keycaps and a mouse with a
 *                 scroll wheel. None of it is clickable.
 *
 * Usage:          <Keyboard position={[x, deskTopY, z]} />
 *                 Every piece sits on the surface at its position.
 * ============================================================================
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

const CASE_CREAM = '#d9d3c6';
const KEYCAP_CREAM = '#f1ece0';

// ---------------------------------------------------------------------------
// DeskMat: a thin felt mat under the keyboard and mouse
// ---------------------------------------------------------------------------
export const DESK_MAT_THICKNESS = 0.004;

export function DeskMat({ width, depth, ...groupProps }) {
  return (
    <group {...groupProps}>
      <RoundedBox args={[width, DESK_MAT_THICKNESS, depth]} radius={0.0018} smoothness={2} position={[0, DESK_MAT_THICKNESS / 2, 0]} receiveShadow>
        <meshStandardMaterial color="#2c3440" roughness={1} />
      </RoundedBox>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Keyboard: a case with five rows of keycaps. The keycaps are one instanced
// mesh, so the whole keyboard is only two draw calls.
// ---------------------------------------------------------------------------
const KEYBOARD_WIDTH = 0.46;
const KEYBOARD_DEPTH = 0.15;
const CASE_HEIGHT = 0.016;
const KEY_PITCH = 0.0305;      // spacing between key centres
const KEY_GAP = 0.004;
const KEY_HEIGHT = 0.008;
const KEYS_PER_ROW = 14;
const ROW_COUNT = 5;

// The bottom row, in key widths: three modifiers, the spacebar, four modifiers
const BOTTOM_ROW_WIDTHS = [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1];

// buildKeyLayout: returns { x, z, width } for every keycap, centred on the case
function buildKeyLayout() {
  const rowWidth = KEYS_PER_ROW * KEY_PITCH;
  const keys = [];

  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex += 1) {
    const rowZ = (rowIndex - (ROW_COUNT - 1) / 2) * KEY_PITCH * 0.9;
    const keyWidths = rowIndex === ROW_COUNT - 1 ? BOTTOM_ROW_WIDTHS : Array(KEYS_PER_ROW).fill(1);

    let leftEdge = -rowWidth / 2;
    keyWidths.forEach((keyWidth) => {
      const widthInScene = keyWidth * KEY_PITCH;
      keys.push({ x: leftEdge + widthInScene / 2, z: rowZ, width: widthInScene - KEY_GAP });
      leftEdge += widthInScene;
    });
  }
  return keys;
}

export function Keyboard(groupProps) {
  const keycapsRef = useRef();
  const keys = useMemo(buildKeyLayout, []);

  // Place every keycap: instances share one unit box, scaled to each key's size
  useLayoutEffect(() => {
    const keyTransform = new THREE.Object3D();
    keys.forEach((key, keyIndex) => {
      keyTransform.position.set(key.x, CASE_HEIGHT + KEY_HEIGHT / 2, key.z);
      keyTransform.scale.set(key.width, KEY_HEIGHT, KEY_PITCH * 0.9 - KEY_GAP);
      keyTransform.updateMatrix();
      keycapsRef.current.setMatrixAt(keyIndex, keyTransform.matrix);
    });
    keycapsRef.current.instanceMatrix.needsUpdate = true;
  }, [keys]);

  return (
    <group {...groupProps}>
      <RoundedBox args={[KEYBOARD_WIDTH, CASE_HEIGHT, KEYBOARD_DEPTH]} radius={0.005} smoothness={3} position={[0, CASE_HEIGHT / 2, 0]} castShadow>
        <meshStandardMaterial color={CASE_CREAM} roughness={0.7} />
      </RoundedBox>
      <instancedMesh ref={keycapsRef} args={[null, null, keys.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={KEYCAP_CREAM} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Mouse: a domed body with two buttons' split line and a scroll wheel
// ---------------------------------------------------------------------------
export function Mouse(groupProps) {
  return (
    <group {...groupProps}>
      {/* Body: the top half of a stretched sphere */}
      <mesh scale={[0.032, 0.03, 0.055]} castShadow>
        <sphereGeometry args={[1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={CASE_CREAM} roughness={0.55} />
      </mesh>
      {/* Line between the two buttons */}
      <mesh position={[0, 0.0265, -0.03]} rotation={[-0.45, 0, 0]}>
        <boxGeometry args={[0.0012, 0.002, 0.034]} />
        <meshStandardMaterial color="#8d877a" roughness={0.8} />
      </mesh>
      {/* Scroll wheel */}
      <mesh position={[0, 0.026, -0.026]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.006, 16]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.6} />
      </mesh>
    </group>
  );
}
