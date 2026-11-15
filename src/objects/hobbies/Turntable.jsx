/*
 * ============================================================================
 * Program Name:   Turntable.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The turntable on the hobby-corner cabinet. Clicking it
 *                 opens the "now playing" card, which shows what I'm
 *                 listening to (from Last.fm). Uses the turntable model.
 *
 * Usage:          <Turntable position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} />
 * ============================================================================
 */

import { useGLTF } from '@react-three/drei';
import ModelProp from '../ModelProp';
import Selectable from '../Selectable';

const TURNTABLE_URL = '/models/turntable.glb';
const TURNTABLE_WIDTH = 0.5; // scene size of the model's longest side

export default function Turntable(groupProps) {
  return (
    <Selectable id="turntable" label="Turntable: now playing" haloRadius={0.36} {...groupProps}>
      <ModelProp url={TURNTABLE_URL} longest={TURNTABLE_WIDTH} />
    </Selectable>
  );
}

useGLTF.preload(TURNTABLE_URL);
