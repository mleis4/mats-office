/*
 * ============================================================================
 * Program Name:   Monitor.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The desk station: a monitor, keyboard and mouse on the
 *                 desk. When the camera is at the desk, the screen becomes a
 *                 live fake desktop whose app windows are the software
 *                 projects. From other stations the screen is a simple glow,
 *                 because DOM content always draws on top of the 3D scene.
 * ============================================================================
 */

import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Desktop, { DESKTOP_WIDTH_PX } from '../objects/monitor/Desktop';
import { useScene } from '../scene/SceneContext';
import { DESK_TOP_Y, OBJECTS, SCREEN } from '../scene/stations';

const BEZEL = 0.025;
const MONITOR_BLACK = '#111214';
const WALLPAPER_NAVY = '#141e33';

// drei's <Html transform> draws 40 CSS pixels per scene unit at scale 1
const HTML_PIXELS_PER_UNIT = 40;
const DESKTOP_SCALE = SCREEN.width / (DESKTOP_WIDTH_PX / HTML_PIXELS_PER_UNIT);

export default function Monitor() {
  const { station, focusId, selectObject } = useScene();

  // Stable DOM target for <Html>; without it the desktop renders blank
  // (same fiber 9.8 + drei 10.7 issue as the FSM panel)
  const canvasElement = useThree((state) => state.gl.domElement);
  const desktopPortalRef = useRef(canvasElement.parentNode);

  const isDeskFocus = focusId ? OBJECTS[focusId]?.station === 'desk' : false;
  const showLiveDesktop = station === 'desk' && (!focusId || isDeskFocus);

  const deskSurfaceY = DESK_TOP_Y - SCREEN.centre[1]; // desk top, relative to the screen centre

  return (
    // Local +Z points out of the screen, toward the room (-X in world space)
    <group position={SCREEN.centre} rotation={[0, -Math.PI / 2, 0]}>
      {/* ---------------- Monitor body ---------------- */}
      <mesh position={[0, 0, -0.022]} castShadow>
        <boxGeometry args={[SCREEN.width + BEZEL * 2, SCREEN.height + BEZEL * 2, 0.04]} />
        <meshStandardMaterial color={MONITOR_BLACK} roughness={0.45} />
      </mesh>
      <mesh position={[0, deskSurfaceY + 0.1, -0.055]} castShadow>
        <boxGeometry args={[0.07, 0.2, 0.03]} />
        <meshStandardMaterial color={MONITOR_BLACK} roughness={0.45} />
      </mesh>
      <mesh position={[0, deskSurfaceY + 0.01, -0.04]} castShadow>
        <boxGeometry args={[0.34, 0.02, 0.2]} />
        <meshStandardMaterial color={MONITOR_BLACK} roughness={0.45} />
      </mesh>

      {/* Screen glow, always visible */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
        <meshBasicMaterial color={showLiveDesktop ? WALLPAPER_NAVY : '#2b4a86'} toneMapped={false} />
      </mesh>

      {/* Live desktop, only while the camera is at the desk */}
      {showLiveDesktop && (
        <Html transform portal={desktopPortalRef} scale={DESKTOP_SCALE} position={[0, 0, 0.002]} zIndexRange={[10, 0]}>
          <Desktop focusId={focusId} onOpenApp={selectObject} />
        </Html>
      )}

      {/* ---------------- Keyboard and mouse ---------------- */}
      <mesh position={[0, deskSurfaceY + 0.012, 0.32]} castShadow>
        <boxGeometry args={[0.46, 0.024, 0.15]} />
        <meshStandardMaterial color="#d9d3c6" roughness={0.7} />
      </mesh>
      <mesh position={[0.36, deskSurfaceY + 0.015, 0.32]} castShadow>
        <boxGeometry args={[0.065, 0.03, 0.11]} />
        <meshStandardMaterial color="#d9d3c6" roughness={0.6} />
      </mesh>
      {/* Coffee mug */}
      <mesh position={[-0.6, deskSurfaceY + 0.05, 0.22]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 20]} />
        <meshStandardMaterial color="#b65a3a" roughness={0.6} />
      </mesh>
    </group>
  );
}
