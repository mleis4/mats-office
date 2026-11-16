/*
 * ============================================================================
 * Program Name:   Turntable.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The turntable on the hobby-corner cabinet. A record spins
 *                 on its platter with the album art of what I'm listening to
 *                 (from Last.fm) as the centre label. Clicking it opens the
 *                 "now playing" card. The deck is the turntable model; the
 *                 record is built in code, because the model has no separate
 *                 platter to turn.
 *
 * Usage:          <Turntable position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} />
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import ModelProp from '../ModelProp';
import Selectable from '../Selectable';
import { useScene } from '../../scene/SceneContext';

const TURNTABLE_URL = '/models/turntable.glb';
const TURNTABLE_WIDTH = 0.5; // scene size of the model's longest side

// Where the model's platter is, measured from the model's bottom-centre
const PLATTER_CENTRE = [-0.029, 0.079, -0.06];

const RECORD_RADIUS = 0.165;
const RECORD_THICKNESS = 0.003;
const LABEL_RADIUS = 0.058;
const GROOVE_RING_RADII = [0.075, 0.1, 0.125, 0.148]; // faint rings that make the spin visible
const SPIN_SPEED = (100 / 3 / 60) * Math.PI * 2;      // radians per second at 33 1/3 rpm

const VINYL_BLACK = '#0c0c0e';
const BLANK_LABEL_COLOUR = '#c9962f';

// ---------------------------------------------------------------------------
// useAlbumArtTexture: loads the cover image for the label. Returns null until
// it has loaded, or if there is no cover or it fails to load.
// ---------------------------------------------------------------------------
function useAlbumArtTexture(artUrl) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!artUrl) {
      setTexture(null);
      return undefined;
    }

    let isCancelled = false;
    let loadedTexture = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      encodeURI(artUrl),
      (newTexture) => {
        if (isCancelled) {
          newTexture.dispose();
          return;
        }
        newTexture.colorSpace = THREE.SRGBColorSpace;
        newTexture.anisotropy = 4;
        loadedTexture = newTexture;
        setTexture(newTexture);
      },
      undefined,
      () => { if (!isCancelled) setTexture(null); },
    );

    // Free GPU memory when the song changes or the turntable unmounts
    return () => {
      isCancelled = true;
      loadedTexture?.dispose();
    };
  }, [artUrl]);

  return texture;
}

// ---------------------------------------------------------------------------
// SpinningRecord: the vinyl, its grooves, the album-art label and the spindle
// ---------------------------------------------------------------------------
function SpinningRecord({ artUrl, ...groupProps }) {
  const recordRef = useRef();
  const albumArt = useAlbumArtTexture(artUrl);

  useFrame((_, deltaSeconds) => {
    recordRef.current.rotation.y -= SPIN_SPEED * deltaSeconds; // clockwise, seen from above
  });

  return (
    <group {...groupProps}>
      <group ref={recordRef}>
        <mesh position={[0, RECORD_THICKNESS / 2, 0]} castShadow>
          <cylinderGeometry args={[RECORD_RADIUS, RECORD_RADIUS, RECORD_THICKNESS, 64]} />
          <meshStandardMaterial color={VINYL_BLACK} roughness={0.32} metalness={0.2} />
        </mesh>

        {/* Groove rings. Each has a short gap, so the turning is easy to see. */}
        {GROOVE_RING_RADII.map((ringRadius, ringIndex) => (
          <mesh key={ringRadius} position={[0, RECORD_THICKNESS + 0.0003, 0]} rotation={[-Math.PI / 2, 0, ringIndex * 1.3]}>
            <ringGeometry args={[ringRadius, ringRadius + 0.0012, 64, 1, 0, Math.PI * 1.9]} />
            <meshStandardMaterial color="#2c2c31" roughness={0.25} metalness={0.3} />
          </mesh>
        ))}

        {/* Centre label: the album art, or a plain label until it loads */}
        <mesh position={[0, RECORD_THICKNESS + 0.0006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[LABEL_RADIUS, 48]} />
          <meshStandardMaterial
            key={albumArt ? 'art' : 'blank'}
            map={albumArt}
            color={albumArt ? '#ffffff' : BLANK_LABEL_COLOUR}
            roughness={0.7}
          />
        </mesh>
      </group>

      {/* Spindle */}
      <mesh position={[0, RECORD_THICKNESS + 0.005, 0]}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.012, 12]} />
        <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Turntable(groupProps) {
  const { nowPlaying } = useScene();

  return (
    <Selectable id="turntable" label="Turntable: now playing" haloRadius={0.36} {...groupProps}>
      <ModelProp url={TURNTABLE_URL} longest={TURNTABLE_WIDTH} />
      <SpinningRecord artUrl={nowPlaying?.artUrl} position={PLATTER_CENTRE} />
    </Selectable>
  );
}

useGLTF.preload(TURNTABLE_URL);
