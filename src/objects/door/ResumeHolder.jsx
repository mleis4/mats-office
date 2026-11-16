/*
 * ============================================================================
 * Program Name:   ResumeHolder.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    A clear wall file holder screwed to the front door, with my
 *                 resume standing in it and a business card paperclipped to
 *                 the top corner. Clicking it opens the resume viewer. The
 *                 holder is built in code; the page is a picture of the real
 *                 resume PDF.
 *
 * Usage:          <ResumeHolder position={[x, y, z]} scale={1.25} onOpen={openResume} />
 *                 position is the bottom-centre of the holder, on the door's
 *                 surface. Local +Z points away from the door.
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { CONTACT } from '../../data/catalog';
import { useScene } from '../../scene/SceneContext';
import TextPlane from '../TextPlane';

const HOLDER_WIDTH = 0.25;
const HOLDER_DEPTH = 0.028;        // how far the pocket stands out from the door
const BACK_HEIGHT = 0.3;
const FRONT_HEIGHT_LEFT = 0.195;   // the front's top edge is a wave: low on the left,
const FRONT_HEIGHT_RIGHT = 0.215;  // rising to a hump toward the right
const WALL_THICKNESS = 0.003;

const PAPER_WIDTH = 0.205;         // US letter, scaled to fit the holder
const PAPER_HEIGHT = PAPER_WIDTH * (11 / 8.5);
const PAPER_BOTTOM_Y = 0.012;

const HOVER_SCALE = 1.05;
const CLEAR_PLASTIC = '#d6e6f5';
const HOVER_LABEL = { id: 'resume', label: 'Resume' };

// ---------------------------------------------------------------------------
// ClearPlastic: the see-through material every part of the holder shares
// ---------------------------------------------------------------------------
function ClearPlastic({ isHovered }) {
  return (
    <meshStandardMaterial
      color={CLEAR_PLASTIC}
      roughness={0.08}
      transparent
      opacity={isHovered ? 0.42 : 0.3}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
}

export default function ResumeHolder({ onOpen, scale = 1, ...groupProps }) {
  const { setHovered } = useScene();
  const [isHovered, setIsHovered] = useState(false);

  const resumeTexture = useTexture(CONTACT.resumePreviewUrl);
  resumeTexture.colorSpace = THREE.SRGBColorSpace;
  resumeTexture.anisotropy = 8;

  // The pocket's front panel, with its wavy top edge
  const frontShape = useMemo(() => {
    const halfWidth = HOLDER_WIDTH / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfWidth, 0);
    shape.lineTo(halfWidth, 0);
    shape.lineTo(halfWidth, FRONT_HEIGHT_RIGHT);
    shape.bezierCurveTo(halfWidth * 0.3, FRONT_HEIGHT_RIGHT + 0.03, -halfWidth * 0.25, FRONT_HEIGHT_LEFT - 0.04, -halfWidth, FRONT_HEIGHT_LEFT);
    shape.closePath();
    return shape;
  }, []);

  // Pointer cursor and the hover label while the holder is hovered
  useEffect(() => {
    if (!isHovered) return undefined;
    document.body.style.cursor = 'pointer';
    setHovered(HOVER_LABEL);
    return () => {
      document.body.style.cursor = 'auto';
      setHovered(null);
    };
  }, [isHovered, setHovered]);

  return (
    <group
      {...groupProps}
      scale={isHovered ? scale * HOVER_SCALE : scale}
      onClick={(event) => { event.stopPropagation(); onOpen(); }}
      onPointerOver={(event) => { event.stopPropagation(); setIsHovered(true); }}
      onPointerOut={() => setIsHovered(false)}
    >
      {/* ---------------- The resume and the business card ---------------- */}
      <mesh position={[0, PAPER_BOTTOM_Y + PAPER_HEIGHT / 2, 0.012]}>
        <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT]} />
        <meshBasicMaterial map={resumeTexture} toneMapped={false} />
      </mesh>

      {/* Business card, paperclipped to the top right corner of the page */}
      <group position={[0.062, PAPER_BOTTOM_Y + PAPER_HEIGHT - 0.022, 0.0135]} rotation={[0, 0, -0.1]}>
        <TextPlane
          lines={[CONTACT.name]}
          width={0.09}
          height={0.052}
          colour="#1a1814"
          background="#fbf7ee"
          fontSizeRatio={0.3}
        />
        <mesh position={[-0.028, 0.02, 0.001]}>
          <boxGeometry args={[0.007, 0.03, 0.002]} />
          <meshStandardMaterial color="#b9bcc2" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* ---------------- The clear holder ---------------- */}
      {/* Back plate, against the door */}
      <mesh position={[0, BACK_HEIGHT / 2, WALL_THICKNESS / 2]}>
        <boxGeometry args={[HOLDER_WIDTH, BACK_HEIGHT, WALL_THICKNESS]} />
        <ClearPlastic isHovered={isHovered} />
      </mesh>
      {/* Front panel */}
      <mesh position={[0, 0, HOLDER_DEPTH]}>
        <shapeGeometry args={[frontShape]} />
        <ClearPlastic isHovered={isHovered} />
      </mesh>
      {/* Sides and floor of the pocket */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (HOLDER_WIDTH / 2), FRONT_HEIGHT_LEFT / 2, HOLDER_DEPTH / 2]}>
          <boxGeometry args={[WALL_THICKNESS, FRONT_HEIGHT_LEFT, HOLDER_DEPTH]} />
          <ClearPlastic isHovered={isHovered} />
        </mesh>
      ))}
      <mesh position={[0, WALL_THICKNESS / 2, HOLDER_DEPTH / 2]}>
        <boxGeometry args={[HOLDER_WIDTH, WALL_THICKNESS, HOLDER_DEPTH]} />
        <ClearPlastic isHovered={isHovered} />
      </mesh>

      {/* Screws in the bottom corners of the back plate */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (HOLDER_WIDTH / 2 - 0.022), 0.024, WALL_THICKNESS + 0.001]}>
          <circleGeometry args={[0.006, 16]} />
          <meshStandardMaterial color="#9a9da3" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}
