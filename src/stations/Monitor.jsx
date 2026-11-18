/*
 * ============================================================================
 * Program Name:   Monitor.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The desk station: a monitor with a keyboard and mouse on a
 *                 desk mat, plus the desk decor (plant, candle, mug, books,
 *                 notebook). When the camera is at the desk, the screen
 *                 becomes a live fake desktop whose apps are the software
 *                 projects. From other stations the screen is a simple glow,
 *                 because DOM content always draws on top of the 3D scene.
 * ============================================================================
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Html, RoundedBox } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { BookStack, Candle, CoffeeMug, DeskPlant, NotebookAndPen } from '../objects/desk/DeskDecor';
import { DESK_MAT_THICKNESS, DeskMat } from '../objects/desk/Peripherals';
import TypingKeyboard from '../objects/desk/TypingKeyboard';
import ModelProp from '../objects/ModelProp';
import Desktop, { DESKTOP_WIDTH_PX } from '../objects/monitor/Desktop';
import { useScene } from '../scene/SceneContext';
import { DESK_TOP_Y, OBJECTS, SCREEN } from '../scene/stations';

const BEZEL = 0.02;
const PANEL_DEPTH = 0.03;
const NECK_HEIGHT = 0.26;
const MONITOR_BLACK = '#111214';
const STAND_GREY = '#2a2c30';
const WALLPAPER_NAVY = '#141e33';

// Where things sit on the desk, in the monitor's own frame: +X is the
// visitor's right, +Z is toward the visitor, and y = 0 is the desk top.
const DESK_MAT = { x: 0.08, z: 0.33, width: 0.92, depth: 0.36 };
const KEYBOARD_SPOT = [0, DESK_MAT_THICKNESS, 0.33];
const KEYBOARD_WIDTH = 0.3; // a real 60% board is about 29 cm wide
const MOUSE_SPOT = [0.3, DESK_MAT_THICKNESS, 0.34];
const MOUSE_LENGTH = 0.12;
const PLANT_SPOT = [0.73, 0, -0.05];
const NOTEBOOK_SPOT = [0.7, 0, 0.3];
const BOOKS_SPOT = [-0.73, 0, -0.09];
const CANDLE_SPOT = [-0.83, 0, 0.19];
const MUG_SPOT = [-0.6, 0, 0.26];

// How far the mouse slides on the mat when the cursor goes from the screen's
// centre to its edge (metres), and how quickly it catches up
const MOUSE_TRAVEL = { x: 0.06, z: 0.04 };
const MOUSE_FOLLOW_SPEED = 14;

// ---------------------------------------------------------------------------
// useMouseFollowsCursor
// While the desktop is live, the desk mouse slides on the mat to match where
// the visitor's cursor is on the screen: right on the screen = right on the
// mat, up on the screen = pushed away. The cursor is found by casting a ray
// from the camera onto the screen, so it works over the DOM desktop too.
// When the cursor leaves the screen the mouse stays put, like a real one.
// Returns the refs to put on the screen mesh and on the mouse's group.
// ---------------------------------------------------------------------------
function useMouseFollowsCursor(isActive) {
  const screenRef = useRef();
  const mouseRef = useRef();
  const canvasElement = useThree((state) => state.gl.domElement);
  const camera = useThree((state) => state.camera);

  const pointer = useRef(null); // the cursor in normalised device coordinates
  const goalOffset = useRef({ x: 0, z: 0 });
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    const trackPointer = (event) => {
      const bounds = canvasElement.getBoundingClientRect();
      pointer.current = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
    };
    window.addEventListener('pointermove', trackPointer);
    return () => window.removeEventListener('pointermove', trackPointer);
  }, [canvasElement]);

  useFrame((_, deltaSeconds) => {
    const mouse = mouseRef.current;
    if (!mouse || !screenRef.current) return;

    if (isActive && pointer.current) {
      raycaster.setFromCamera(pointer.current, camera);
      const hit = raycaster.intersectObject(screenRef.current)[0];
      if (hit?.uv) {
        goalOffset.current.x = (hit.uv.x - 0.5) * 2 * MOUSE_TRAVEL.x;
        goalOffset.current.z = -(hit.uv.y - 0.5) * 2 * MOUSE_TRAVEL.z;
      }
    }

    const blend = 1 - Math.exp(-MOUSE_FOLLOW_SPEED * Math.min(deltaSeconds, 0.1));
    mouse.position.x += (MOUSE_SPOT[0] + goalOffset.current.x - mouse.position.x) * blend;
    mouse.position.z += (MOUSE_SPOT[2] + goalOffset.current.z - mouse.position.z) * blend;
  });

  return { screenRef, mouseRef };
}

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

  const { screenRef, mouseRef } = useMouseFollowsCursor(showLiveDesktop);

  const deskSurfaceY = DESK_TOP_Y - SCREEN.centre[1]; // desk top, relative to the screen centre
  const panelWidth = SCREEN.width + BEZEL * 2;
  const panelHeight = SCREEN.height + BEZEL * 2;

  return (
    // Local +Z points out of the screen, toward the room (-X in world space)
    <group position={SCREEN.centre} rotation={[0, -Math.PI / 2, 0]}>
      {/* ---------------- Monitor ---------------- */}
      {/* Panel; its front face sits just behind the screen plane */}
      <RoundedBox args={[panelWidth, panelHeight, PANEL_DEPTH]} radius={0.008} smoothness={3} position={[0, 0, -0.002 - PANEL_DEPTH / 2]} castShadow>
        <meshStandardMaterial color={MONITOR_BLACK} roughness={0.45} />
      </RoundedBox>
      {/* Bulge on the back that holds the electronics and the stand mount */}
      <mesh position={[0, -0.02, -0.046]} castShadow>
        <boxGeometry args={[panelWidth * 0.55, panelHeight * 0.55, 0.03]} />
        <meshStandardMaterial color={MONITOR_BLACK} roughness={0.6} />
      </mesh>
      {/* Power light on the bottom bezel */}
      <mesh position={[SCREEN.width / 2 - 0.03, -SCREEN.height / 2 - BEZEL / 2, -0.0015]}>
        <circleGeometry args={[0.0035, 12]} />
        <meshBasicMaterial color="#7fd1ff" toneMapped={false} />
      </mesh>
      {/* Webcam clipped to the top edge */}
      <mesh position={[0, panelHeight / 2 + 0.008, -0.014]} castShadow>
        <boxGeometry args={[0.07, 0.02, 0.024]} />
        <meshStandardMaterial color={MONITOR_BLACK} roughness={0.5} />
      </mesh>
      <mesh position={[0, panelHeight / 2 + 0.008, -0.0015]}>
        <circleGeometry args={[0.006, 16]} />
        <meshStandardMaterial color="#1c2a4a" roughness={0.15} metalness={0.4} />
      </mesh>

      {/* Stand: a neck up the back and a rounded foot on the desk */}
      <mesh position={[0, deskSurfaceY + NECK_HEIGHT / 2, -0.066]} castShadow>
        <boxGeometry args={[0.07, NECK_HEIGHT, 0.022]} />
        <meshStandardMaterial color={STAND_GREY} roughness={0.5} metalness={0.3} />
      </mesh>
      <RoundedBox args={[0.34, 0.014, 0.2]} radius={0.006} smoothness={3} position={[0, deskSurfaceY + 0.007, -0.04]} castShadow>
        <meshStandardMaterial color={STAND_GREY} roughness={0.5} metalness={0.3} />
      </RoundedBox>

      {/* Screen glow, always visible */}
      <mesh ref={screenRef} position={[0, 0, -0.001]}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
        <meshBasicMaterial color={showLiveDesktop ? WALLPAPER_NAVY : '#2b4a86'} toneMapped={false} />
      </mesh>

      {/* Live desktop, only while the camera is at the desk */}
      {showLiveDesktop && (
        <Html transform portal={desktopPortalRef} scale={DESKTOP_SCALE} position={[0, 0, 0.002]} zIndexRange={[10, 0]}>
          <Desktop focusId={focusId} onOpenApp={selectObject} />
        </Html>
      )}

      {/* ---------------- On the desk ---------------- */}
      <group position={[0, deskSurfaceY, 0]}>
        <DeskMat width={DESK_MAT.width} depth={DESK_MAT.depth} position={[DESK_MAT.x, 0, DESK_MAT.z]} />
        <TypingKeyboard width={KEYBOARD_WIDTH} position={KEYBOARD_SPOT} />
        {/* The mouse model points its nose along +Z; turn it to face the monitor */}
        <group ref={mouseRef} position={MOUSE_SPOT}>
          <ModelProp url="/models/mouse.glb" depth={MOUSE_LENGTH} rotation={[0, Math.PI, 0]} />
        </group>

        <DeskPlant position={PLANT_SPOT} />
        <NotebookAndPen position={NOTEBOOK_SPOT} rotation={[0, -0.18, 0]} />
        <BookStack position={BOOKS_SPOT} rotation={[0, 0.1, 0]} />
        <Candle position={CANDLE_SPOT} />
        <CoffeeMug position={MUG_SPOT} rotation={[0, 0.6, 0]} />
      </group>
    </group>
  );
}
