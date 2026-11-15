/*
 * ============================================================================
 * Program Name:   GlobalReaderBoards.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The two GlobalReader PCBs as one assembly. The radio board
 *                 is a shield that plugs onto the baseboard, so both models
 *                 live in a single group and always move together. When the
 *                 assembly is focused, the shield lifts off so both boards
 *                 can be seen.
 *
 * Usage:          <GlobalReaderBoards position={[x, y, z]} />
 * ============================================================================
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import Selectable from '../Selectable';
import useFittedModel from '../useFittedModel';
import { useScene } from '../../scene/SceneContext';

const BASE_BOARD_URL = '/models/BaseBoard.glb';
const RADIO_BOARD_URL = '/models/RadioBoard.glb';

const ASSEMBLY_WIDTH = 0.5;            // scene width of the baseboard (stylised, larger than life)

// Where the shield sits on the baseboard, in the models' own units (metres).
// The two exports don't share an origin, so these were tuned by eye.
const SHIELD_SEAT_HEIGHT = 0.006;      // bench surface to the tips of the shield's pins
const SHIELD_OFFSET_X = 0.0077;
const SHIELD_OFFSET_Z = -0.0145;
const SHIELD_LIFT = 0.03;            // extra height when the shield is lifted off

// The baseboard sits connector-side up. The shield goes on face-down and
// turned a quarter turn, so its two pin headers drop into the baseboard's
// two sockets (3-pin power at the back, 8-pin comms at the front).
const BASE_ROTATION = [Math.PI, 0, 0];
const SHIELD_ROTATION = [Math.PI, -Math.PI / 2, 0, 'YXZ'];

export default function GlobalReaderBoards(groupProps) {
  const { focusId } = useScene();
  const shieldRef = useRef(null);

  const baseBoard = useFittedModel(BASE_BOARD_URL, { layFlat: true, rotation: BASE_ROTATION });
  const radioBoard = useFittedModel(RADIO_BOARD_URL, { layFlat: true, rotation: SHIELD_ROTATION });

  // Both boards share one scale so the shield stays the right size
  const modelScale = ASSEMBLY_WIDTH / Math.max(baseBoard.size.x, baseBoard.size.z);
  const isFocused = focusId === 'globalreader';

  // Lift the shield off while focused, and seat it again afterwards
  useFrame((_, deltaSeconds) => {
    if (!shieldRef.current) return;
    const goalHeight = SHIELD_SEAT_HEIGHT + (isFocused ? SHIELD_LIFT : 0);
    const blend = 1 - Math.exp(-4 * Math.min(deltaSeconds, 0.1));
    shieldRef.current.position.y += (goalHeight - shieldRef.current.position.y) * blend;
  });

  return (
    <Selectable id="globalreader" label="GlobalReader boards" haloRadius={0.4} {...groupProps}>
      {/* One group, one scale: the shield can never drift from the baseboard */}
      <group scale={modelScale}>
        <primitive object={baseBoard.object} />
        <group ref={shieldRef} position={[SHIELD_OFFSET_X, SHIELD_SEAT_HEIGHT, SHIELD_OFFSET_Z]}>
          <primitive object={radioBoard.object} />
        </group>
      </group>
    </Selectable>
  );
}

useGLTF.preload(BASE_BOARD_URL);
useGLTF.preload(RADIO_BOARD_URL);
