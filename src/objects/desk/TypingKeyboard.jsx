/*
 * ============================================================================
 * Program Name:   TypingKeyboard.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    The 60% mechanical keyboard on the desk (keyboard1.glb).
 *                 Every key goes down while the visitor holds the same key
 *                 on their own keyboard, and comes back up when they let go.
 *
 *                 The model only keeps 10 keys as separate parts (the ones
 *                 its demo animation moves); the other 51 keycaps were merged
 *                 into shared meshes when it was compressed. So on load the
 *                 merged meshes are cut back into one mesh per keycap: split
 *                 into connected pieces, keep the pieces at keycap height,
 *                 and group pieces that overlap from above. Each key is then
 *                 matched to a KeyboardEvent.code by its row and column.
 *                 How far a key travels is read from the model's animation.
 *
 * Usage:          <TypingKeyboard width={0.3} position={[x, deskTopY, z]} />
 *                 It sits on the surface at its position, number row at -Z.
 * ============================================================================
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/keyboard1.glb';

// The model's 60% ANSI layout, back row first, each row left to right
const ROW_CODES = [
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
  ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
  ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ContextMenu', 'ControlRight'],
];

// Keys a 60% board doesn't have, pressed on the key that does their job
const CODE_ALIASES = {
  Escape: 'Backquote',
  NumpadEnter: 'Enter',
  OSLeft: 'MetaLeft',
  OSRight: 'MetaRight',
  IntlBackslash: 'ShiftLeft',
};

const PRESS_SPEED = 45;   // how fast a key follows the finger (higher = snappier)
const WELD_PRECISION = 1e5; // vertices closer than 1/100000 of a model unit are one vertex

// ---------------------------------------------------------------------------
// splitIntoPieces: groups a mesh's triangles into connected pieces.
// Vertices at the same position count as joined, because hard edges
// duplicate vertices. Returns one array of triangle numbers per piece.
// ---------------------------------------------------------------------------
function splitIntoPieces(geometry) {
  const positions = geometry.attributes.position;
  const index = geometry.index ? geometry.index.array : [...Array(positions.count).keys()];

  // Weld: one id per distinct position
  const weldIds = new Map();
  const vertexToWeld = new Int32Array(positions.count);
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    const key = `${Math.round(positions.getX(vertex) * WELD_PRECISION)},${Math.round(positions.getY(vertex) * WELD_PRECISION)},${Math.round(positions.getZ(vertex) * WELD_PRECISION)}`;
    if (!weldIds.has(key)) weldIds.set(key, weldIds.size);
    vertexToWeld[vertex] = weldIds.get(key);
  }

  // Union-find over the welded vertices, joining the corners of each triangle
  const parent = new Int32Array(weldIds.size).map((_, id) => id);
  const find = (id) => {
    let root = id;
    while (parent[root] !== root) root = parent[root];
    while (parent[id] !== root) [parent[id], id] = [root, parent[id]];
    return root;
  };
  const triangleCount = index.length / 3;
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const a = find(vertexToWeld[index[triangle * 3]]);
    const b = find(vertexToWeld[index[triangle * 3 + 1]]);
    const c = find(vertexToWeld[index[triangle * 3 + 2]]);
    parent[b] = a;
    parent[find(c)] = a;
  }

  const pieces = new Map();
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const root = find(vertexToWeld[index[triangle * 3]]);
    if (!pieces.has(root)) pieces.set(root, []);
    pieces.get(root).push(triangle);
  }
  return [...pieces.values()];
}

// subsetGeometry: a new geometry holding only the given triangles
function subsetGeometry(geometry, triangles) {
  const index = geometry.index ? geometry.index.array : null;
  const oldToNew = new Map();
  const newIndex = [];
  triangles.forEach((triangle) => {
    for (let corner = 0; corner < 3; corner += 1) {
      const oldVertex = index ? index[triangle * 3 + corner] : triangle * 3 + corner;
      if (!oldToNew.has(oldVertex)) oldToNew.set(oldVertex, oldToNew.size);
      newIndex.push(oldToNew.get(oldVertex));
    }
  });

  const subset = new THREE.BufferGeometry();
  Object.entries(geometry.attributes).forEach(([name, attribute]) => {
    const values = new attribute.array.constructor(oldToNew.size * attribute.itemSize);
    oldToNew.forEach((newVertex, oldVertex) => {
      for (let item = 0; item < attribute.itemSize; item += 1) {
        values[newVertex * attribute.itemSize + item] = attribute.array[oldVertex * attribute.itemSize + item];
      }
    });
    subset.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, attribute.normalized));
  });
  subset.setIndex(newIndex);
  return subset;
}

// boxInRoot: a piece's bounding box in the model root's space
function boxInRoot(geometry, triangles, mesh) {
  const positions = geometry.attributes.position;
  const index = geometry.index ? geometry.index.array : null;
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  triangles.forEach((triangle) => {
    for (let corner = 0; corner < 3; corner += 1) {
      const vertex = index ? index[triangle * 3 + corner] : triangle * 3 + corner;
      box.expandByPoint(point.fromBufferAttribute(positions, vertex).applyMatrix4(mesh.matrixWorld));
    }
  });
  return box;
}

const overlapsFromAbove = (a, b) => a.min.x < b.max.x && b.min.x < a.max.x && a.min.z < b.max.z && b.min.z < a.max.z;

// ---------------------------------------------------------------------------
// buildKeyboard: clones the model and returns { root, size, keysByCode,
// pressDepth }. Each key in keysByCode is a group to move down along Y.
// ---------------------------------------------------------------------------
function buildKeyboard(scene, animations) {
  const root = scene.clone(true);
  root.updateMatrixWorld(true);

  // ---- The 10 keys the animation moves, and how far they travel ----
  const animatedKeys = [];
  let pressDepth = 0;
  (animations[0]?.tracks ?? []).forEach((track) => {
    if (!track.name.endsWith('.position')) return;
    const keyObject = root.getObjectByName(track.name.slice(0, -'.position'.length));
    if (!keyObject) return;
    const heights = track.values.filter((_, valueIndex) => valueIndex % 3 === 1);
    pressDepth = Math.max(pressDepth, heights[0] - Math.min(...heights));
    animatedKeys.push(keyObject);
  });

  // Keycaps sit at the height of the animated keys; switch housings are lower
  const animatedBoxes = animatedKeys.map((keyObject) => new THREE.Box3().setFromObject(keyObject));
  const lowestKeyCentre = Math.min(...animatedBoxes.map((box) => (box.min.y + box.max.y) / 2));
  const keyHeight = Math.max(...animatedBoxes.map((box) => box.max.y - box.min.y));
  const keycapCutoff = lowestKeyCentre - keyHeight * 0.4;

  // ---- Cut the merged meshes back into one piece per keycap ----
  const isInsideAnimatedKey = (object) => animatedKeys.some((keyObject) => {
    for (let node = object; node; node = node.parent) if (node === keyObject) return true;
    return false;
  });
  // Only meshes that share a material with the keycaps can hold keycaps
  // (this leaves out the dark switch tops, which sit close to keycap height)
  const keycapMaterials = new Set();
  animatedKeys.forEach((keyObject) => keyObject.traverse((child) => {
    if (child.isMesh) keycapMaterials.add(child.material.name);
  }));
  const mergedMeshes = [];
  root.traverse((child) => {
    if (child.isMesh && !isInsideAnimatedKey(child) && keycapMaterials.has(child.material.name)) mergedMeshes.push(child);
  });

  const keyParts = []; // { box, mesh } per finished keycap, in root space
  mergedMeshes.forEach((mesh) => {
    const geometry = mesh.geometry;
    const pieces = splitIntoPieces(geometry).map((triangles) => ({ triangles, box: boxInRoot(geometry, triangles, mesh) }));
    const capPieces = pieces.filter((piece) => (piece.box.min.y + piece.box.max.y) / 2 > keycapCutoff);
    if (capPieces.length === 0) return;

    // Pieces that overlap from above belong to the same keycap
    const groups = [];
    capPieces.forEach((piece) => {
      const touching = groups.filter((group) => overlapsFromAbove(group.box, piece.box));
      const merged = { box: piece.box.clone(), triangles: [...piece.triangles] };
      touching.forEach((group) => {
        merged.box.union(group.box);
        merged.triangles.push(...group.triangles);
        groups.splice(groups.indexOf(group), 1);
      });
      groups.push(merged);
    });

    groups.forEach((group) => {
      const keyMesh = new THREE.Mesh(subsetGeometry(geometry, group.triangles), mesh.material);
      mesh.parent.add(keyMesh);
      keyMesh.position.copy(mesh.position);
      keyMesh.quaternion.copy(mesh.quaternion);
      keyMesh.scale.copy(mesh.scale);
      keyParts.push({ box: group.box, object: keyMesh });
    });

    // Whatever is left (switch housings) stays as one mesh
    const capTriangles = new Set(capPieces.flatMap((piece) => piece.triangles));
    const restTriangles = pieces.flatMap((piece) => piece.triangles).filter((triangle) => !capTriangles.has(triangle));
    if (restTriangles.length > 0) mesh.geometry = subsetGeometry(geometry, restTriangles);
    else mesh.removeFromParent();
  });

  animatedKeys.forEach((keyObject, keyIndex) => keyParts.push({ box: animatedBoxes[keyIndex], object: keyObject }));

  // ---- Give every key its own group so it can move straight down ----
  root.updateMatrixWorld(true);
  keyParts.forEach((part) => {
    const keyGroup = new THREE.Group();
    root.add(keyGroup);
    keyGroup.attach(part.object);
    part.group = keyGroup;
    part.centre = part.box.getCenter(new THREE.Vector3());
  });

  // ---- Rows by depth, then columns left to right ----
  // Rows are a whole key apart, so a new row starts after a gap of half a key
  const keyDepth = Math.min(...animatedBoxes.map((box) => box.max.z - box.min.z));
  const byDepth = [...keyParts].sort((a, b) => a.centre.z - b.centre.z);
  const rows = [];
  byDepth.forEach((part) => {
    const lastRow = rows[rows.length - 1];
    if (lastRow && part.centre.z - lastRow[lastRow.length - 1].centre.z < keyDepth * 0.5) lastRow.push(part);
    else rows.push([part]);
  });

  const keysByCode = {};
  const expectedCounts = ROW_CODES.map((row) => row.length).join(',');
  const foundCounts = rows.map((row) => row.length).join(',');
  if (expectedCounts !== foundCounts) {
    console.warn(`[TypingKeyboard] expected rows of ${expectedCounts} keys, found ${foundCounts}; some keys won't move`);
  }
  rows.forEach((row, rowIndex) => {
    row.sort((a, b) => a.centre.x - b.centre.x);
    row.forEach((part, columnIndex) => {
      const code = ROW_CODES[rowIndex]?.[columnIndex];
      if (code) keysByCode[code] = part.group;
    });
  });

  // ---- Origin at the bottom-centre, like every other model ----
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const centre = box.getCenter(new THREE.Vector3());
  const holder = new THREE.Group();
  holder.add(root);
  root.position.set(-centre.x, -box.min.y, -centre.z);
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return { object: holder, size: box.getSize(new THREE.Vector3()), keysByCode, pressDepth };
}

// ---------------------------------------------------------------------------
// TypingKeyboard
// ---------------------------------------------------------------------------
export default function TypingKeyboard({ width = 0.3, ...groupProps }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const keyboard = useMemo(() => buildKeyboard(scene, animations), [scene, animations]);
  const heldCodes = useRef(new Set());

  // Watch the real keyboard. Capture phase, so keys typed into the desktop
  // apps' text boxes still count. It only watches; it never blocks a key.
  useEffect(() => {
    const toCode = (event) => CODE_ALIASES[event.code] ?? event.code;
    const handleDown = (event) => heldCodes.current.add(toCode(event));
    const handleUp = (event) => heldCodes.current.delete(toCode(event));
    const releaseAll = () => heldCodes.current.clear();

    window.addEventListener('keydown', handleDown, true);
    window.addEventListener('keyup', handleUp, true);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', handleDown, true);
      window.removeEventListener('keyup', handleUp, true);
      window.removeEventListener('blur', releaseAll);
    };
  }, []);

  // Ease every key toward up or down
  useFrame((_, delta) => {
    const blend = 1 - Math.exp(-PRESS_SPEED * Math.min(delta, 0.1));
    Object.entries(keyboard.keysByCode).forEach(([code, keyGroup]) => {
      const target = heldCodes.current.has(code) ? -keyboard.pressDepth : 0;
      keyGroup.position.y += (target - keyGroup.position.y) * blend;
    });
  });

  return (
    <group {...groupProps}>
      <primitive object={keyboard.object} scale={width / keyboard.size.x} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
