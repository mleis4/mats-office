/*
 * ============================================================================
 * Program Name:   FramedPrint.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    A poster in a thin black frame, hung flat on a wall. You
 *                 give it the image and how wide it should be; the height
 *                 follows the image's own shape, so any poster fits.
 *
 * Usage:          <FramedPrint url="/textures/TartuPoster.jpg" width={0.5}
 *                              position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} />
 *                 position is the centre of the print, on the wall surface.
 * ============================================================================
 */

import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

const FRAME_BORDER = 0.03;
const FRAME_DEPTH = 0.024;
const FRAME_COLOUR = '#0e0d0b';

export default function FramedPrint({ url, width, ...groupProps }) {
  const printTexture = useTexture(url);
  printTexture.colorSpace = THREE.SRGBColorSpace;

  const height = width * (printTexture.image.height / printTexture.image.width);

  return (
    <group {...groupProps}>
      {/* Frame */}
      <mesh position={[0, 0, FRAME_DEPTH / 2]} castShadow>
        <boxGeometry args={[width + FRAME_BORDER * 2, height + FRAME_BORDER * 2, FRAME_DEPTH]} />
        <meshStandardMaterial color={FRAME_COLOUR} roughness={0.5} />
      </mesh>
      {/* Print */}
      <mesh position={[0, 0, FRAME_DEPTH + 0.0005]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={printTexture} roughness={0.85} />
      </mesh>
    </group>
  );
}
