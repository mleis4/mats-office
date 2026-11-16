/*
 * ============================================================================
 * Program Name:   Door.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The landing view: a closed office door with a brass
 *                 nameplate, my photo pinned on like an ID badge, a sticky
 *                 note and a holder with my resume in it. Clicking the door
 *                 (or its handle) swings it open and lets the camera glide
 *                 into the workshop; clicking the holder opens the resume.
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import ResumeHolder from '../objects/door/ResumeHolder';
import TextPlane from '../objects/TextPlane';
import { ROOM } from '../scene/stations';

const DOOR_WIDTH = 1.0;
const DOOR_HEIGHT = 2.1;
const DOOR_THICKNESS = 0.05;
const OPEN_ANGLE = 1.9;            // radians, swings into the room
const SWING_SPEED = 3.2;

const DOOR_WOOD = '#7a4f2e';
const DOOR_WOOD_DARK = '#5f3b20';
const BRASS = '#c9a24a';
const FRAME_COLOUR = '#d7c2a0';
const STICKY_YELLOW = '#fede4e';

export default function Door({ isOpen, onEnter, onOpenResume }) {
  const hingeRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const headshotTexture = useTexture('/images/headshot-web.jpg');
  headshotTexture.colorSpace = THREE.SRGBColorSpace;

  // Pointer cursor while the closed door is hovered
  useEffect(() => {
    document.body.style.cursor = isHovered && !isOpen ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [isHovered, isOpen]);

  // Swing toward open or closed
  useFrame((_, deltaSeconds) => {
    if (!hingeRef.current) return;
    const goalAngle = isOpen ? OPEN_ANGLE : 0;
    const blend = 1 - Math.exp(-SWING_SPEED * Math.min(deltaSeconds, 0.1));
    hingeRef.current.rotation.y += (goalAngle - hingeRef.current.rotation.y) * blend;
  });

  const doorZ = ROOM.halfDepth + 0.06;
  const faceZ = DOOR_THICKNESS / 2 + 0.002; // just proud of the outside face

  return (
    <group position={[0, 0, doorZ]}>
      {/* ---------------- Door frame ---------------- */}
      <mesh position={[-DOOR_WIDTH / 2 - 0.04, DOOR_HEIGHT / 2, 0.02]}>
        <boxGeometry args={[0.08, DOOR_HEIGHT + 0.08, 0.16]} />
        <meshStandardMaterial color={FRAME_COLOUR} roughness={0.7} />
      </mesh>
      <mesh position={[DOOR_WIDTH / 2 + 0.04, DOOR_HEIGHT / 2, 0.02]}>
        <boxGeometry args={[0.08, DOOR_HEIGHT + 0.08, 0.16]} />
        <meshStandardMaterial color={FRAME_COLOUR} roughness={0.7} />
      </mesh>
      <mesh position={[0, DOOR_HEIGHT + 0.04, 0.02]}>
        <boxGeometry args={[DOOR_WIDTH + 0.16, 0.08, 0.16]} />
        <meshStandardMaterial color={FRAME_COLOUR} roughness={0.7} />
      </mesh>

      {/* ---------------- Door leaf, hinged on its left edge ---------------- */}
      <group ref={hingeRef} position={[-DOOR_WIDTH / 2, 0, 0]}>
        <group
          position={[DOOR_WIDTH / 2, DOOR_HEIGHT / 2, 0]}
          onClick={(event) => { event.stopPropagation(); if (!isOpen) onEnter(); }}
          onPointerOver={(event) => { event.stopPropagation(); setIsHovered(true); }}
          onPointerOut={() => setIsHovered(false)}
        >
          <mesh castShadow>
            <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, DOOR_THICKNESS]} />
            <meshStandardMaterial color={DOOR_WOOD} roughness={0.65} />
          </mesh>

          {/* Recessed panels, for a classic office door */}
          <mesh position={[0, 0.48, faceZ - 0.001]}>
            <planeGeometry args={[0.78, 0.92]} />
            <meshStandardMaterial color={DOOR_WOOD_DARK} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.55, faceZ - 0.001]}>
            <planeGeometry args={[0.78, 0.78]} />
            <meshStandardMaterial color={DOOR_WOOD_DARK} roughness={0.7} />
          </mesh>

          {/* Brass nameplate */}
          <mesh position={[0, 0.78, faceZ + 0.004]}>
            <boxGeometry args={[0.7, 0.17, 0.008]} />
            <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} />
          </mesh>
          <TextPlane
            lines={['Mats Leis']}
            width={0.66}
            height={0.085}
            colour="#2a1d08"
            fontSizeRatio={0.8}
            position={[0, 0.805, faceZ + 0.009]}
          />
          <TextPlane
            lines={['Electrical & AI Systems Engineering']}
            width={0.66}
            height={0.05}
            colour="#2a1d08"
            fontWeight="500"
            fontSizeRatio={0.72}
            position={[0, 0.74, faceZ + 0.009]}
          />

          {/* Photo pinned on like an ID badge */}
          <group position={[-0.13, 0.36, faceZ + 0.004]} rotation={[0, 0, 0.04]}>
            <mesh>
              <boxGeometry args={[0.25, 0.36, 0.006]} />
              <meshStandardMaterial color="#f4ede0" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.025, 0.004]}>
              <planeGeometry args={[0.2, 0.27]} />
              <meshBasicMaterial map={headshotTexture} toneMapped={false} />
            </mesh>
            <TextPlane
              lines={['MATS LEIS']}
              width={0.22}
              height={0.035}
              colour="#1a1814"
              fontFamily='ui-monospace, Menlo, Consolas, monospace'
              fontSizeRatio={0.62}
              position={[0, -0.142, 0.004]}
            />
            {/* Badge clip */}
            <mesh position={[0, 0.195, 0.004]}>
              <boxGeometry args={[0.06, 0.04, 0.012]} />
              <meshStandardMaterial color="#8f8f94" metalness={0.8} roughness={0.4} />
            </mesh>
          </group>

          {/* Sticky note */}
          <group position={[0.2, 0.33, faceZ + 0.003]} rotation={[0, 0, -0.07]}>
            <TextPlane
              lines={['Come on in.', 'Click the handle,', 'or press Enter.']}
              width={0.24}
              height={0.24}
              colour="#3a2f10"
              background={STICKY_YELLOW}
              fontWeight="500"
              fontSizeRatio={0.34}
            />
          </group>

          {/* Resume holder, below the photo and the note. It has its own click. */}
          <ResumeHolder position={[-0.02, -0.47, DOOR_THICKNESS / 2]} scale={1.25} onOpen={onOpenResume} />

          {/* Door handle */}
          <group position={[0.38, -0.05, faceZ]}>
            <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 24]} />
              <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.013, 0.013, 0.06, 16]} />
              <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[-0.055, 0, 0.075]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.14, 16]} />
              <meshStandardMaterial
                color={BRASS}
                metalness={0.9}
                roughness={0.3}
                emissive={BRASS}
                emissiveIntensity={isHovered && !isOpen ? 0.5 : 0}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
