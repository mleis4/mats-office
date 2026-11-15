/*
 * ============================================================================
 * Program Name:   TennisRackets.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Two tennis rackets crossed on a wall pegboard, with a can
 *                 of balls on a small ledge. The rackets and the can are
 *                 downloaded models; the pegboard and ledge are built in code.
 *
 * Usage:          <TennisRackets position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} />
 * ============================================================================
 */

import { useGLTF } from '@react-three/drei';
import ModelProp from '../ModelProp';
import Pegboard from '../Pegboard';
import Selectable from '../Selectable';

const RACKET_URL = '/models/tennis_racket_rf01.glb';
const BALL_CAN_URL = '/models/ball-can.glb';

const PEGBOARD_WIDTH = 1.15;
const PEGBOARD_HEIGHT = 1.0;
const RACKET_LENGTH = 0.8;
const RACKET_TILT = 0.42;            // radians each racket leans from vertical
const BALL_CAN_HEIGHT = 0.24;

// Turns the model so it hangs flat against the wall with its head up
const RACKET_MODEL_ROTATION = [Math.PI / 2, 0, 0];

// ---------------------------------------------------------------------------
// HangingRacket: one racket, tilted about its middle so two of them cross
// ---------------------------------------------------------------------------
function HangingRacket({ tilt, ...groupProps }) {
  return (
    <group {...groupProps} rotation={[0, 0, tilt]}>
      {/* The model's origin is its bottom, so shift it down by half its length */}
      <ModelProp url={RACKET_URL} longest={RACKET_LENGTH} modelRotation={RACKET_MODEL_ROTATION} position={[0, -RACKET_LENGTH / 2, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// TennisRackets
// ---------------------------------------------------------------------------
export default function TennisRackets(groupProps) {
  return (
    <Selectable id="tennis" label="Tennis rackets" haloRadius={0} {...groupProps}>
      <Pegboard width={PEGBOARD_WIDTH} height={PEGBOARD_HEIGHT} />

      {/* Two crossed rackets */}
      <HangingRacket tilt={RACKET_TILT} position={[-0.1, 0.06, 0.035]} />
      <HangingRacket tilt={-RACKET_TILT} position={[0.1, 0.06, 0.06]} />

      {/* Ledge with a can of balls */}
      <mesh position={[0.4, -0.38, 0.07]} castShadow>
        <boxGeometry args={[0.2, 0.016, 0.11]} />
        <meshStandardMaterial color="#5e3f28" roughness={0.7} />
      </mesh>
      <ModelProp url={BALL_CAN_URL} height={BALL_CAN_HEIGHT} position={[0.4, -0.372, 0.075]} />
    </Selectable>
  );
}

useGLTF.preload(RACKET_URL);
useGLTF.preload(BALL_CAN_URL);
