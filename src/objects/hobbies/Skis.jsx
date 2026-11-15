/*
 * ============================================================================
 * Program Name:   Skis.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    A pair of skis leaning against the wall, with the wooden
 *                 "Ski The East" sign hung above them. In the downloaded
 *                 model the two skis lie splayed on the ground, so each ski
 *                 is taken out of the model on its own and stood upright.
 *
 * Usage:          <Skis position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]} />
 *                 position is on the floor, at the wall surface.
 * ============================================================================
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import ModelProp from '../ModelProp';
import Selectable from '../Selectable';

const SKIS_URL = '/models/Skis.glb';
const SIGN_URL = '/models/SkiTheEast_Decor.glb';

const SKI_NODE_NAMES = ['skiL', 'skiR'];
const SKI_TAIL_TO_ORIGIN = 0.81;     // model units from a ski's tail to its origin
const SKI_GAP = 0.15;                // metres between the two skis
const SKI_LEAN = 0.07;               // radians the skis lean back onto the wall
const SKI_FOOT_DISTANCE = 0.2;       // how far the tails stand out from the wall

const SIGN_WIDTH = 0.36;
const SIGN_BOTTOM_Y = 1.88;
const SIGN_OFFSET_X = 0;             // centred over the pair of skis

// ---------------------------------------------------------------------------
// useUprightSkis: copies each ski out of the model with its pose cleared, so
// it stands along +Y with its tip up and its bindings facing +Z
// ---------------------------------------------------------------------------
function useUprightSkis() {
  const { nodes } = useGLTF(SKIS_URL);

  return useMemo(() => SKI_NODE_NAMES.map((nodeName) => {
    const ski = nodes[nodeName].clone(true);
    ski.position.set(0, 0, 0);
    ski.scale.setScalar(1);
    // In the model the tip points along -Y, so turn the ski over, tip up
    ski.rotation.set(0, 0, Math.PI);
    ski.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    return ski;
  }), [nodes]);
}

export default function Skis(groupProps) {
  const uprightSkis = useUprightSkis();

  return (
    <Selectable id="skiing" label="Skis" haloRadius={0.3} {...groupProps}>
      {/* The pair of skis, tails on the floor, tips resting on the wall */}
      <group position={[0, 0, SKI_FOOT_DISTANCE]} rotation={[-SKI_LEAN, 0, 0]}>
        {uprightSkis.map((ski, skiIndex) => (
          <primitive
            key={SKI_NODE_NAMES[skiIndex]}
            object={ski}
            position={[(skiIndex - 0.5) * SKI_GAP, SKI_TAIL_TO_ORIGIN, 0]}
          />
        ))}
      </group>

      {/* Ski The East sign, hung on the wall above the skis */}
      <ModelProp url={SIGN_URL} width={SIGN_WIDTH} position={[SIGN_OFFSET_X, SIGN_BOTTOM_Y, 0.014]} />
    </Selectable>
  );
}

useGLTF.preload(SKIS_URL);
useGLTF.preload(SIGN_URL);
