/*
 * ============================================================================
 * Program Name:   Pegboard.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    A wall pegboard with a wooden frame, at any size. The grid
 *                 of holes is drawn once on a canvas. Used behind the tennis
 *                 rackets and for the tool wall above the workbench. Whatever
 *                 hangs on it is passed in as children.
 *
 * Usage:          <Pegboard width={1.15} height={1.0} position={[x, y, z]}>
 *                   ...things hanging on the board...
 *                 </Pegboard>
 *                 The board's face is at z = PEGBOARD_FACE_Z, facing +Z.
 * ============================================================================
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const BOARD_COLOUR = '#c9b48f';
const HOLE_COLOUR = '#6b5a40';
const FRAME_COLOUR = '#5e3f28';
const FRAME_BORDER = 0.03;
const PIXELS_PER_METRE = 400;
const HOLE_SPACING_PIXELS = 20;      // one hole every 5 cm

export const PEGBOARD_FACE_Z = 0.0145;

// ---------------------------------------------------------------------------
// Pegboard holes, drawn once on a canvas
// ---------------------------------------------------------------------------
function usePegboardTexture(width, height) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * PIXELS_PER_METRE);
    canvas.height = Math.round(height * PIXELS_PER_METRE);
    const context = canvas.getContext('2d');
    context.fillStyle = BOARD_COLOUR;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = HOLE_COLOUR;
    for (let holeX = HOLE_SPACING_PIXELS; holeX < canvas.width; holeX += HOLE_SPACING_PIXELS) {
      for (let holeY = HOLE_SPACING_PIXELS; holeY < canvas.height; holeY += HOLE_SPACING_PIXELS) {
        context.beginPath();
        context.arc(holeX, holeY, 2.2, 0, Math.PI * 2);
        context.fill();
      }
    }
    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    return canvasTexture;
  }, [width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export default function Pegboard({ width, height, children, ...groupProps }) {
  const pegboardTexture = usePegboardTexture(width, height);

  return (
    <group {...groupProps}>
      {/* Wooden frame */}
      <mesh position={[0, 0, 0.004]}>
        <boxGeometry args={[width + FRAME_BORDER * 2, height + FRAME_BORDER * 2, 0.02]} />
        <meshStandardMaterial color={FRAME_COLOUR} roughness={0.7} />
      </mesh>
      {/* Board */}
      <mesh position={[0, 0, PEGBOARD_FACE_Z]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={pegboardTexture} roughness={0.9} />
      </mesh>
      {children}
    </group>
  );
}
