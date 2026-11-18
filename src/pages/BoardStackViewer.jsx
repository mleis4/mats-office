/*
 * ============================================================================
 * Program Name:   BoardStackViewer.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    The interactive 3D viewer of the GlobalReader board stack on
 *                 the 2D write-up page. Visitors can see the boards assembled,
 *                 pulled apart (the radio board hovering above its sockets), or
 *                 each board on its own. Camera presets, zoom buttons,
 *                 wireframe and reset match the viewer on the old portfolio.
 *
 *                 Scrolling is never hijacked: wheel-zoom only switches on
 *                 after the visitor clicks into the model, and off again when
 *                 the pointer leaves it. The models only load once the viewer
 *                 is about to scroll into view, and nothing renders while it
 *                 is off screen.
 *
 * Usage:          <BoardStackViewer copy={project.viewer} />
 * ============================================================================
 */

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress } from '@react-three/drei';
import useFittedModel from '../objects/useFittedModel';
import {
  BASE_BOARD_URL, BASE_ROTATION, RADIO_BOARD_URL, SHIELD_OFFSET_X, SHIELD_OFFSET_Z,
  SHIELD_ROTATION, SHIELD_SEAT_HEIGHT,
} from '../objects/bench/globalReaderStack';

// ---- Settings ----
const EXPLODE_GAP = 0.03;        // metres the radio board hovers above its seat when pulled apart
const FIT_PADDING = 0.98;       // breathing room around the boards once fitted to the frame
const CAMERA_FOV = 38;
const BLEND_RATE = 7;            // how fast the camera and boards ease to a new pose
const LOAD_MARGIN = '300px 0px'; // start loading a little before the viewer is on screen

const MODES = [
  { id: 'assembled', label: 'Assembled' },
  { id: 'exploded', label: 'Pulled apart' },
  { id: 'base', label: 'Baseboard' },
  { id: 'radio', label: 'Radio board' },
];

// Camera directions, looking from this direction towards the boards
const VIEWS = [
  { id: 'iso', label: 'Isometric', direction: [1, 0.75, 1] },
  { id: 'top', label: 'Top', direction: [0, 1, 0.0001] },
  { id: 'front', label: 'Front', direction: [0, 0, 1] },
  { id: 'side', label: 'Side', direction: [1, 0, 0] },
];

const HINT_IDLE = 'Click the model to interact';
const HINT_ACTIVE = 'Drag to rotate · scroll to zoom · right-drag to pan';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Camera fitting
// Fitting the longest side regardless of view direction leaves a flat board
// tiny when seen edge-on. Instead, project the eight corners of the bounding
// box onto the camera's own axes and solve for the smallest distance that
// still contains all of them, across and up the frame.
// ---------------------------------------------------------------------------
function fitDistance(halfSize, direction, fovDegrees, aspect) {
  const tanVertical = Math.tan(THREE.MathUtils.degToRad(fovDegrees) / 2);
  const tanHorizontal = tanVertical * aspect;

  const forward = direction.clone().negate();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  if (right.lengthSq() < 1e-8) right.crossVectors(forward, new THREE.Vector3(0, 0, 1)); // looking straight down
  right.normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  const corner = new THREE.Vector3();
  let distance = 0;
  for (let cornerIndex = 0; cornerIndex < 8; cornerIndex += 1) {
    corner.set(
      (cornerIndex & 1 ? 1 : -1) * halfSize.x,
      (cornerIndex & 2 ? 1 : -1) * halfSize.y,
      (cornerIndex & 4 ? 1 : -1) * halfSize.z,
    );
    const depthOffset = corner.dot(direction);
    distance = Math.max(
      distance,
      depthOffset + Math.abs(corner.dot(right)) / tanHorizontal,
      depthOffset + Math.abs(corner.dot(up)) / tanVertical,
    );
  }
  return distance * FIT_PADDING;
}

// The radio board's box when its bottom is at the given height
function radioBoardBox(radioSize, bottomHeight) {
  return new THREE.Box3(
    new THREE.Vector3(SHIELD_OFFSET_X - radioSize.x / 2, bottomHeight, SHIELD_OFFSET_Z - radioSize.z / 2),
    new THREE.Vector3(SHIELD_OFFSET_X + radioSize.x / 2, bottomHeight + radioSize.y, SHIELD_OFFSET_Z + radioSize.z / 2),
  );
}

// What the camera should frame in each mode
function boundsForMode(mode, baseSize, radioSize) {
  const baseBox = new THREE.Box3(
    new THREE.Vector3(-baseSize.x / 2, 0, -baseSize.z / 2),
    new THREE.Vector3(baseSize.x / 2, baseSize.y, baseSize.z / 2),
  );
  if (mode === 'base') return baseBox;
  if (mode === 'radio') return radioBoardBox(radioSize, SHIELD_SEAT_HEIGHT);
  const lift = mode === 'exploded' ? EXPLODE_GAP : 0;
  return baseBox.union(radioBoardBox(radioSize, SHIELD_SEAT_HEIGHT + lift));
}

// Give the viewer its own copy of every material, so wireframe here never
// leaks into the same (cached) models in the 3D office
function useOwnMaterials(object) {
  return useMemo(() => {
    const meshes = [];
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone();
      child.castShadow = false;
      child.receiveShadow = false;
      meshes.push(child);
    });
    return meshes;
  }, [object]);
}

function setWireframe(meshes, isWireframe) {
  meshes.forEach((mesh) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => { material.wireframe = isWireframe; });
  });
}

// ---------------------------------------------------------------------------
// Studio lighting: a room environment for the metal and solder to reflect,
// plus key, fill and rim lights for edges and silhouette
// ---------------------------------------------------------------------------
function StudioLighting() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environment.texture;
    return () => {
      scene.environment = null;
      environment.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <directionalLight position={[1, 1.6, 1.2]} intensity={2.1} />
      <directionalLight position={[-1.4, 0.4, 0.9]} intensity={0.8} />
      <directionalLight position={[0.2, -0.8, -1.4]} intensity={1.0} />
      <ambientLight intensity={0.25} />
    </>
  );
}

// ---------------------------------------------------------------------------
// The two boards and the camera that frames them
// ---------------------------------------------------------------------------
function BoardStack({ mode, viewRequest, zoomRequest, isWireframe, isActive, onReady }) {
  const { camera, gl, size } = useThree();
  const controlsRef = useRef(null);
  const radioLiftRef = useRef(null);   // moves the radio board up and down
  const radioFlipRef = useRef(null);   // turns it face-up when shown on its own
  const cameraGoalRef = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3(), isMoving: false });
  const isReducedMotion = useMemo(prefersReducedMotion, []);

  const baseBoard = useFittedModel(BASE_BOARD_URL, { layFlat: true, rotation: BASE_ROTATION });
  const radioBoard = useFittedModel(RADIO_BOARD_URL, { layFlat: true, rotation: SHIELD_ROTATION });
  const baseMeshes = useOwnMaterials(baseBoard.object);
  const radioMeshes = useOwnMaterials(radioBoard.object);

  const bounds = useMemo(
    () => boundsForMode(mode, baseBoard.size, radioBoard.size),
    [mode, baseBoard.size, radioBoard.size],
  );

  useEffect(() => { onReady(); }, [onReady]);

  useEffect(() => {
    setWireframe(baseMeshes, isWireframe);
    setWireframe(radioMeshes, isWireframe);
  }, [baseMeshes, radioMeshes, isWireframe]);

  // Until the visitor clicks in, one-finger swipes must scroll the page.
  // OrbitControls writes touch-action: none on the canvas itself, so a
  // stylesheet can't undo it; it has to be set here.
  useEffect(() => {
    gl.domElement.style.touchAction = isActive ? 'none' : 'pan-y';
  }, [gl, isActive]);

  // ---- Framing: fit the camera to whatever the current mode shows ----
  const moveCameraTo = (direction, distanceOverride) => {
    const centre = bounds.getCenter(new THREE.Vector3());
    const halfSize = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const distance = distanceOverride ?? fitDistance(halfSize, direction, CAMERA_FOV, size.width / size.height);

    const radius = halfSize.length();
    camera.near = radius / 100;
    camera.far = radius * 100;
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.minDistance = radius * 0.4;
      controlsRef.current.maxDistance = radius * 12;
    }

    const goal = cameraGoalRef.current;
    goal.target.copy(centre);
    goal.position.copy(centre).addScaledVector(direction, distance);
    goal.isMoving = true;
  };

  const currentDirection = () => {
    const target = controlsRef.current?.target ?? new THREE.Vector3();
    return camera.position.clone().sub(target).normalize();
  };

  // A view preset (or reset) picks the direction; a new mode keeps the
  // visitor's current angle and only reframes
  const lastViewNonceRef = useRef(null);
  useEffect(() => {
    const isNewViewRequest = lastViewNonceRef.current !== viewRequest.nonce;
    lastViewNonceRef.current = viewRequest.nonce;
    const preset = VIEWS.find((view) => view.id === viewRequest.view) ?? VIEWS[0];
    const direction = isNewViewRequest
      ? new THREE.Vector3(...preset.direction).normalize()
      : currentDirection();
    moveCameraTo(direction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewRequest, bounds, size.width, size.height]);

  // Zoom buttons, for visitors who can't or don't want to scroll-zoom
  useEffect(() => {
    if (!zoomRequest.nonce || !controlsRef.current) return;
    const controls = controlsRef.current;
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(offset.length() * zoomRequest.factor, controls.minDistance, controls.maxDistance);
    moveCameraTo(offset.normalize(), distance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomRequest]);

  // ---- Animation: ease the radio board and the camera to their goals ----
  useFrame((_, deltaSeconds) => {
    const blend = isReducedMotion ? 1 : 1 - Math.exp(-BLEND_RATE * Math.min(deltaSeconds, 0.1));

    if (radioLiftRef.current && radioFlipRef.current) {
      const goalLift = mode === 'exploded' ? EXPLODE_GAP : 0;
      const goalFlip = mode === 'radio' ? Math.PI : 0; // it sits face-down in the stack
      radioLiftRef.current.position.y += (SHIELD_SEAT_HEIGHT + goalLift - radioLiftRef.current.position.y) * blend;
      radioFlipRef.current.rotation.x += (goalFlip - radioFlipRef.current.rotation.x) * blend;
    }

    const goal = cameraGoalRef.current;
    const controls = controlsRef.current;
    if (goal.isMoving && controls) {
      camera.position.lerp(goal.position, blend);
      controls.target.lerp(goal.target, blend);
      controls.update();
      if (camera.position.distanceTo(goal.position) < 1e-5) goal.isMoving = false;
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={!isReducedMotion}
        dampingFactor={0.08}
        rotateSpeed={0.9}
        panSpeed={0.8}
        enableZoom={isActive}
        onStart={() => { cameraGoalRef.current.isMoving = false; }}
      />

      <group visible={mode !== 'radio'}>
        <primitive object={baseBoard.object} />
      </group>

      {/* The shield flips about its own middle, so it turns over in place */}
      <group ref={radioLiftRef} position={[SHIELD_OFFSET_X, SHIELD_SEAT_HEIGHT, SHIELD_OFFSET_Z]} visible={mode !== 'base'}>
        <group position={[0, radioBoard.size.y / 2, 0]}>
          <group ref={radioFlipRef}>
            <group position={[0, -radioBoard.size.y / 2, 0]}>
              <primitive object={radioBoard.object} />
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shows the still image if the models or WebGL fail
// ---------------------------------------------------------------------------
class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[BoardStackViewer] 3D viewer unavailable:', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function ViewerFallback({ copy }) {
  return (
    <div className="pf-viewer-fallback">
      {copy.fallbackImage && <img src={encodeURI(copy.fallbackImage)} alt={copy.fallbackAlt ?? ''} loading="lazy" />}
      <p>The interactive 3D model couldn't be loaded here, so this is a still image instead. The write-up below covers the same boards.</p>
    </div>
  );
}

function LoadingStatus() {
  const { progress } = useProgress();
  return (
    <div className="pf-viewer-status" role="status">
      <p>Loading model… {Math.round(progress)}%</p>
      <div className="pf-viewer-progress"><span style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BoardStackViewer
// ---------------------------------------------------------------------------
export default function BoardStackViewer({ copy }) {
  const viewerRef = useRef(null);
  const [isNearScreen, setIsNearScreen] = useState(false);
  const [isOnScreen, setIsOnScreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('assembled');
  const [viewRequest, setViewRequest] = useState({ view: 'iso', nonce: 0 });
  const [zoomRequest, setZoomRequest] = useState({ factor: 1, nonce: 0 });
  const [isWireframe, setIsWireframe] = useState(false);

  // Load once it's nearly in view; render only while it's on screen
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return undefined;
    if (!('IntersectionObserver' in window)) {
      setIsNearScreen(true);
      setIsOnScreen(true);
      return undefined;
    }
    const nearObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setIsNearScreen(true);
    }, { rootMargin: LOAD_MARGIN });
    const onScreenObserver = new IntersectionObserver((entries) => {
      setIsOnScreen(entries.some((entry) => entry.isIntersecting));
    });
    nearObserver.observe(viewer);
    onScreenObserver.observe(viewer);
    return () => {
      nearObserver.disconnect();
      onScreenObserver.disconnect();
    };
  }, []);

  const requestView = (viewId) => setViewRequest((previous) => ({ view: viewId, nonce: previous.nonce + 1 }));
  const requestZoom = (factor) => setZoomRequest((previous) => ({ factor, nonce: previous.nonce + 1 }));
  const resetViewer = () => {
    setMode('assembled');
    setIsWireframe(false);
    requestView('iso');
  };

  const handleReady = useMemo(() => () => setIsLoaded(true), []);

  return (
    <section className="pf-viewer-section" aria-labelledby="viewer-title">
      <h2 id="viewer-title">{copy.heading}</h2>
      {copy.intro && <p className="pf-viewer-intro">{copy.intro}</p>}

      <ViewerErrorBoundary fallback={<ViewerFallback copy={copy} />}>
        <div
          ref={viewerRef}
          className={isActive ? 'pf-viewer is-active' : 'pf-viewer'}
          onPointerLeave={() => setIsActive(false)}
        >
          <div className="pf-viewer-modes" role="group" aria-label="What to show">
            {MODES.map((modeOption) => (
              <button
                key={modeOption.id}
                type="button"
                aria-pressed={mode === modeOption.id}
                onClick={() => setMode(modeOption.id)}
              >
                {modeOption.label}
              </button>
            ))}
          </div>

          <div
            className="pf-viewer-stage"
            role="img"
            aria-label={copy.ariaLabel}
            onPointerDown={() => setIsActive(true)}
          >
            {isNearScreen && (
              <Canvas
                frameloop={isOnScreen ? 'always' : 'never'}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
                camera={{ fov: CAMERA_FOV, near: 0.001, far: 10, position: [0.1, 0.08, 0.1] }}
              >
                <StudioLighting />
                <Suspense fallback={null}>
                  <BoardStack
                    mode={mode}
                    viewRequest={viewRequest}
                    zoomRequest={zoomRequest}
                    isWireframe={isWireframe}
                    isActive={isActive}
                    onReady={handleReady}
                  />
                </Suspense>
              </Canvas>
            )}
            {!isLoaded && <LoadingStatus />}
          </div>

          <div className="pf-viewer-bar" role="group" aria-label="3D viewer controls">
            <div className="pf-viewer-group" role="group" aria-label="Camera views">
              {VIEWS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  aria-pressed={viewRequest.view === view.id}
                  onClick={() => requestView(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <div className="pf-viewer-group" role="group" aria-label="Zoom and display">
              <button type="button" onClick={() => requestZoom(0.8)} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => requestZoom(1.25)} aria-label="Zoom out">−</button>
              <button type="button" aria-pressed={isWireframe} onClick={() => setIsWireframe((wasOn) => !wasOn)}>Wireframe</button>
              <button type="button" onClick={resetViewer}>Reset</button>
            </div>
            <span className="pf-viewer-hint">{isActive ? HINT_ACTIVE : HINT_IDLE}</span>
          </div>
        </div>
      </ViewerErrorBoundary>

      {copy.caption && <p className="pf-viewer-caption">{copy.caption}</p>}
    </section>
  );
}
