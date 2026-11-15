/*
 * ============================================================================
 * Program Name:   Guitar.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The acoustic guitar on its floor stand. Uses the Yamaha
 *                 F310 model (the stand is part of the model).
 *
 * Usage:          <Guitar position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]} />
 * ============================================================================
 */

import { useGLTF } from '@react-three/drei';
import ModelProp from '../ModelProp';
import Selectable from '../Selectable';

const GUITAR_URL = '/models/yamaha_f310_acoustic_guitar_highpoly.glb';
const GUITAR_HEIGHT = 1.08; // scene height of guitar + stand

export default function Guitar(groupProps) {
  return (
    <Selectable id="guitar" label="Guitar" haloRadius={0.34} {...groupProps}>
      <ModelProp url={GUITAR_URL} height={GUITAR_HEIGHT} />
    </Selectable>
  );
}

useGLTF.preload(GUITAR_URL);
