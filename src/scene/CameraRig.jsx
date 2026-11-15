/*
 * ============================================================================
 * Program Name:   CameraRig.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Moves the camera between the poses in stations.js. The
 *                 visitor never steers the camera directly: it glides to the
 *                 current station or object close-up. With reduced motion
 *                 turned on, it cuts instead of flying.
 * ============================================================================
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { getCameraPose } from './stations';

const BASE_VERTICAL_FOV = 50;      // degrees, used on landscape screens
const MIN_HORIZONTAL_FOV = 62;     // degrees, kept on portrait screens
const MAX_VERTICAL_FOV = 95;
const GLIDE_SPEED = 3.4;           // higher = faster; ~1 s to settle

export default function CameraRig({ station, focusId, usePickedPose = false }) {
  const camera = useThree((state) => state.camera);
  const viewportAspect = useThree((state) => state.size.width / state.size.height);

  const lookTarget = useRef(new THREE.Vector3());
  const hasPlacedCamera = useRef(false);

  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const isLandscape = viewportAspect >= 1;
  const pose = getCameraPose(station, focusId, isLandscape, usePickedPose);
  const goalPosition = useMemo(() => new THREE.Vector3(...pose.position), [pose.position.join()]);
  const goalTarget = useMemo(() => new THREE.Vector3(...pose.target), [pose.target.join()]);

  // Widen the lens on portrait screens so the whole station still fits
  useEffect(() => {
    const minHorizontalRadians = THREE.MathUtils.degToRad(MIN_HORIZONTAL_FOV);
    const neededVerticalFov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(minHorizontalRadians / 2) / viewportAspect),
    );
    camera.fov = THREE.MathUtils.clamp(neededVerticalFov, BASE_VERTICAL_FOV, MAX_VERTICAL_FOV);
    camera.updateProjectionMatrix();
  }, [camera, viewportAspect]);

  useFrame((_, deltaSeconds) => {
    // First frame (or reduced motion): jump straight to the pose
    if (!hasPlacedCamera.current || prefersReducedMotion) {
      camera.position.copy(goalPosition);
      lookTarget.current.copy(goalTarget);
      hasPlacedCamera.current = true;
    } else {
      // Frame-rate independent ease-out toward the goal
      const blend = 1 - Math.exp(-GLIDE_SPEED * Math.min(deltaSeconds, 0.1));
      camera.position.lerp(goalPosition, blend);
      lookTarget.current.lerp(goalTarget, blend);
    }
    camera.lookAt(lookTarget.current);
  });

  return null;
}
