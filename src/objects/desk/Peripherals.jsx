/*
 * ============================================================================
 * Program Name:   Peripherals.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The desk mat under the keyboard and mouse, built in code.
 *                 The keyboard (TypingKeyboard.jsx) and mouse (mouse.glb) are
 *                 models. None of it is clickable.
 *
 * Usage:          <DeskMat width={0.9} depth={0.36} position={[x, deskTopY, z]} />
 * ============================================================================
 */

import { RoundedBox } from '@react-three/drei';

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
