/*
 * ============================================================================
 * Program Name:   Lighting.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Warm workshop lighting: a desk-lamp pool over the bench, a
 *                 soft glow in the hobby corner, a cool monitor glow at the
 *                 desk and a hallway light on the door. Only the bench lamp
 *                 casts shadows, and none do on phones.
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { BENCH, BENCH_TOP_Y, DESK, LEFT_WALL_X, RIGHT_WALL_X, ROOM } from './stations';

const WARM_WHITE = '#ffd9a8';
const LAMP_ORANGE = '#ffc37a';
const MONITOR_BLUE = '#9fc0ff';

export default function Lighting({ enableShadows }) {
  const benchLampRef = useRef(null);
  const ceilingY = ROOM.height - 0.2;

  // Aim the bench lamp at the middle of the workbench
  useEffect(() => {
    const lamp = benchLampRef.current;
    if (!lamp) return;
    lamp.target.position.set(-0.1, BENCH_TOP_Y, BENCH.z);
    lamp.target.updateMatrixWorld();
  }, []);

  return (
    <>
      {/* Soft base light so nothing is pitch black */}
      <ambientLight intensity={0.55} color={WARM_WHITE} />
      <hemisphereLight args={['#ffe9c9', '#2a2018', 0.5]} />

      {/* Desk lamp over the workbench */}
      <spotLight
        ref={benchLampRef}
        position={[-0.3, ceilingY, BENCH.z + 0.95]}
        angle={0.95}
        penumbra={0.7}
        intensity={38}
        distance={7}
        color={LAMP_ORANGE}
        castShadow={enableShadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
      />

      {/* Ceiling fill in the middle of the room */}
      <pointLight position={[0, ceilingY, 0.5]} intensity={7} distance={8} color={WARM_WHITE} />

      {/* Hobby corner glow */}
      <pointLight position={[LEFT_WALL_X + 1.2, 2.1, 0]} intensity={11} distance={6} color={LAMP_ORANGE} />

      {/* Cool glow from the monitor, plus a warm fill over the desk */}
      <pointLight position={[RIGHT_WALL_X - 0.9, 1.3, DESK.z]} intensity={2.4} distance={3} color={MONITOR_BLUE} />
      <pointLight position={[RIGHT_WALL_X - 1.4, 2.2, DESK.z]} intensity={6} distance={5} color={WARM_WHITE} />

      {/* Hallway light on the outside of the door */}
      <pointLight position={[0.4, 2.3, ROOM.halfDepth + 1.7]} intensity={16} distance={6} color={WARM_WHITE} />
    </>
  );
}
