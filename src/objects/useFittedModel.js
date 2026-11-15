/*
 * ============================================================================
 * Program Name:   useFittedModel.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Loads a .glb and normalises it so every model behaves the
 *                 same way no matter how it was exported: its origin is moved
 *                 to the bottom-centre (so it sits on a surface at y = 0) and
 *                 its measured size is returned so the caller can scale it.
 *                 This hides unit differences (the robot is in millimetres,
 *                 the PCBs in metres). PCBs can also be laid flat.
 * ============================================================================
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// ---------------------------------------------------------------------------
// useFittedModel
// options.layFlat: rotate so the thinnest side points up (for circuit boards)
// options.rotation: extra [x, y, z] rotation applied before measuring
// Returns { object, size } where object is ready for <primitive>.
// ---------------------------------------------------------------------------
export default function useFittedModel(url, { layFlat = false, rotation } = {}) {
  const { scene } = useGLTF(url);
  const extraEuler = rotation ?? [0, 0, 0];
  const rotationKey = extraEuler.join();

  return useMemo(() => {
    const model = scene.clone(true);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // pivot: holds the rotation. root: what the caller positions and scales.
    const pivot = new THREE.Group();
    pivot.add(model);
    const root = new THREE.Group();
    root.add(pivot);

    const measure = () => {
      root.updateMatrixWorld(true);
      return new THREE.Box3().setFromObject(pivot);
    };

    if (layFlat) {
      const flatSize = measure().getSize(new THREE.Vector3());
      const thinnest = Math.min(flatSize.x, flatSize.y, flatSize.z);
      if (thinnest === flatSize.z) pivot.rotation.x = -Math.PI / 2;
      else if (thinnest === flatSize.x) pivot.rotation.z = Math.PI / 2;
    }

    // Apply the caller's extra rotation on top of the lay-flat rotation
    const extraRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(...extraEuler));
    pivot.quaternion.premultiply(extraRotation);

    // Move the origin to the bottom-centre
    const box = measure();
    const centre = box.getCenter(new THREE.Vector3());
    pivot.position.set(-centre.x, -box.min.y, -centre.z);

    return { object: root, size: box.getSize(new THREE.Vector3()) };
  }, [scene, layFlat, rotationKey]);
}
