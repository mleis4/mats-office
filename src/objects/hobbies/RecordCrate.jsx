/*
 * ============================================================================
 * Program Name:   RecordCrate.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    A milk crate holding my vinyl records, one sleeve per entry
 *                 in records.json, each with its real front and back cover.
 *                 Clicking the crate opens its card and the camera looks down
 *                 over the crate. Scrolling, or moving the mouse across the
 *                 sleeves or the list, raises one record at a time. Clicking
 *                 a raised record lifts it out: it floats between the
 *                 turntable and the card and turns slowly so both covers
 *                 can be seen.
 *
 * Usage:          <RecordCrate position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} />
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import records from '../../data/records.json';
import Selectable from '../Selectable';
import TextPlane from '../TextPlane';
import { useScene } from '../../scene/SceneContext';

const CRATE_WIDTH = 0.42;
const CRATE_HEIGHT = 0.24;
const CRATE_DEPTH = 0.4;
const SLAT_THICKNESS = 0.018;
const CRATE_COLOUR = '#2f5d8a';

const SLEEVE_SIZE = 0.315;
const SLEEVE_THICKNESS = 0.007;
const SLEEVE_LEAN = -0.1;            // radians, leaning back like real records

// Where a picked album floats, in the crate's own coordinates:
// above the crate and out toward the camera
const SHOWCASE_POSITION = new THREE.Vector3(-0.05, 0.4, 0.5);
const SHOWCASE_SCALE = 1.5;
const BROWSE_RAISE_HEIGHT = 0.15;    // how far a record pops up while browsing
const SPIN_RADIANS_PER_SECOND = 0.7;
const BOB_HEIGHT = 0.012;

// Sleeve colours for the edges, and for records with no cover image yet
const SLEEVE_COLOURS = [
  '#b3312c', '#e9d8b4', '#15161a', '#23252b', '#2c4f7c', '#d7c2a0', '#7c8c5a',
  '#c9c9cf', '#3a2a22', '#3d5a80', '#a44a3f', '#141e33', '#55606e',
];
const LIGHT_SLEEVES = new Set(['#e9d8b4', '#d7c2a0', '#c9c9cf']);

// ---------------------------------------------------------------------------
// useCoverTexture: loads one cover image only when it is needed, so the 24
// covers don't slow down the first page load. Returns null until loaded.
// ---------------------------------------------------------------------------
function useCoverTexture(imageUrl, shouldLoad) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!imageUrl || !shouldLoad || texture) return undefined;

    let isCancelled = false;
    new THREE.TextureLoader().load(encodeURI(imageUrl), (loadedTexture) => {
      if (isCancelled) {
        loadedTexture.dispose();
        return;
      }
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.anisotropy = 4;
      setTexture(loadedTexture);
    });
    return () => { isCancelled = true; };
  }, [imageUrl, shouldLoad, texture]);

  // Free GPU memory when the sleeve unmounts
  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

// ---------------------------------------------------------------------------
// Sleeve: one record. It rests in the crate, or floats and spins when picked.
// ---------------------------------------------------------------------------
function Sleeve({ record, recordIndex, restingZ, isPicked, isRaised, isCrateOpen, loadFront, onPick, onBrowse }) {
  const sleeveRef = useRef(null);
  const floatTimeRef = useRef(0);

  const frontTexture = useCoverTexture(record.front, loadFront);
  const backTexture = useCoverTexture(record.back, isPicked); // backs load on demand

  const sleeveColour = SLEEVE_COLOURS[recordIndex % SLEEVE_COLOURS.length];
  const textColour = LIGHT_SLEEVES.has(sleeveColour) ? '#1a1814' : '#f4ede0';
  const restingY = 0.03 + SLEEVE_SIZE / 2;

  useFrame((_, deltaSeconds) => {
    const sleeve = sleeveRef.current;
    if (!sleeve) return;

    const step = Math.min(deltaSeconds, 0.1);
    const blend = 1 - Math.exp(-6 * step);

    if (isPicked) {
      // Float out to the showcase spot, bob gently and keep turning
      floatTimeRef.current += step;
      const bob = Math.sin(floatTimeRef.current * 1.6) * BOB_HEIGHT;
      sleeve.position.x += (SHOWCASE_POSITION.x - sleeve.position.x) * blend;
      sleeve.position.y += (SHOWCASE_POSITION.y + bob - sleeve.position.y) * blend;
      sleeve.position.z += (SHOWCASE_POSITION.z - sleeve.position.z) * blend;
      sleeve.rotation.x += (0 - sleeve.rotation.x) * blend;
      sleeve.rotation.y += SPIN_RADIANS_PER_SECOND * step;
      sleeve.scale.setScalar(sleeve.scale.x + (SHOWCASE_SCALE - sleeve.scale.x) * blend);
    } else {
      // Settle back into the crate, unwinding the spin the short way round
      floatTimeRef.current = 0;
      const fullTurn = Math.PI * 2;
      const unwoundAngle = ((sleeve.rotation.y + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
      sleeve.rotation.y = unwoundAngle + (0 - unwoundAngle) * blend;
      sleeve.rotation.x += (SLEEVE_LEAN - sleeve.rotation.x) * blend;
      sleeve.position.x += (0 - sleeve.position.x) * blend;
      // While browsing, the record under the pointer or scroll pops up
      const goalY = restingY + (isRaised ? BROWSE_RAISE_HEIGHT : 0);
      sleeve.position.y += (goalY - sleeve.position.y) * blend;
      sleeve.position.z += (restingZ - sleeve.position.z) * blend;
      sleeve.scale.setScalar(sleeve.scale.x + (1 - sleeve.scale.x) * blend);
    }
  });

  return (
    <group
      ref={sleeveRef}
      position={[0, restingY, restingZ]}
      rotation={[SLEEVE_LEAN, 0, 0]}
      onClick={(event) => {
        // Sleeves are only pickable once the crate's card is open
        if (!isCrateOpen) return;
        event.stopPropagation();
        onPick(isPicked ? null : recordIndex);
      }}
      onPointerOver={(event) => {
        // Moving the mouse across the crate raises each record in turn
        if (!isCrateOpen) return;
        event.stopPropagation();
        onBrowse(recordIndex);
      }}
    >
      {/* Box faces in order: right, left, top, bottom, front, back */}
      <mesh castShadow>
        <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_THICKNESS]} />
        <meshStandardMaterial attach="material-0" color={sleeveColour} roughness={0.8} />
        <meshStandardMaterial attach="material-1" color={sleeveColour} roughness={0.8} />
        <meshStandardMaterial attach="material-2" color={sleeveColour} roughness={0.8} />
        <meshStandardMaterial attach="material-3" color={sleeveColour} roughness={0.8} />
        <meshStandardMaterial
          key={frontTexture ? 'front-cover' : 'front-plain'}
          attach="material-4"
          color={frontTexture ? '#ffffff' : sleeveColour}
          map={frontTexture}
          roughness={0.75}
        />
        <meshStandardMaterial
          key={backTexture ? 'back-cover' : 'back-plain'}
          attach="material-5"
          color={backTexture ? '#ffffff' : sleeveColour}
          map={backTexture}
          roughness={0.75}
        />
      </mesh>

      {/* Title text stands in until the front cover has loaded, or if there isn't one */}
      {!frontTexture && (
        <TextPlane
          lines={[record.title, record.artist, String(record.year)]}
          width={SLEEVE_SIZE * 0.92}
          height={SLEEVE_SIZE * 0.5}
          colour={textColour}
          fontSizeRatio={0.42}
          position={[0, SLEEVE_SIZE * 0.14, SLEEVE_THICKNESS / 2 + 0.0006]}
        />
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// RecordCrate
// ---------------------------------------------------------------------------
export default function RecordCrate(groupProps) {
  const {
    station, focusId, selectedRecordIndex, setSelectedRecordIndex, browseRecordIndex, setBrowseRecordIndex,
  } = useScene();
  const isCrateOpen = focusId === 'records';
  const isBrowsing = isCrateOpen && selectedRecordIndex === null;

  // Front covers load once the visitor reaches the hobby corner
  const [hasVisitedHobbies, setHasVisitedHobbies] = useState(false);
  useEffect(() => {
    if (station === 'hobbies') setHasVisitedHobbies(true);
  }, [station]);

  const usableDepth = CRATE_DEPTH - SLAT_THICKNESS * 2 - 0.05;
  const sleeveSpacing = usableDepth / (records.length - 1);

  return (
    <Selectable id="records" label="Record crate" haloRadius={0.36} {...groupProps}>
      {/* Crate: a base and two slats per side, so the sleeves show through */}
      <mesh position={[0, SLAT_THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[CRATE_WIDTH, SLAT_THICKNESS, CRATE_DEPTH]} />
        <meshStandardMaterial color={CRATE_COLOUR} roughness={0.6} />
      </mesh>
      {[0.07, CRATE_HEIGHT - 0.05].map((slatY) => (
        <group key={slatY}>
          <mesh position={[0, slatY, CRATE_DEPTH / 2]} castShadow>
            <boxGeometry args={[CRATE_WIDTH, 0.07, SLAT_THICKNESS]} />
            <meshStandardMaterial color={CRATE_COLOUR} roughness={0.6} />
          </mesh>
          <mesh position={[0, slatY, -CRATE_DEPTH / 2]} castShadow>
            <boxGeometry args={[CRATE_WIDTH, 0.07, SLAT_THICKNESS]} />
            <meshStandardMaterial color={CRATE_COLOUR} roughness={0.6} />
          </mesh>
          <mesh position={[CRATE_WIDTH / 2, slatY, 0]} castShadow>
            <boxGeometry args={[SLAT_THICKNESS, 0.07, CRATE_DEPTH]} />
            <meshStandardMaterial color={CRATE_COLOUR} roughness={0.6} />
          </mesh>
          <mesh position={[-CRATE_WIDTH / 2, slatY, 0]} castShadow>
            <boxGeometry args={[SLAT_THICKNESS, 0.07, CRATE_DEPTH]} />
            <meshStandardMaterial color={CRATE_COLOUR} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Sleeves: the first record in the data is at the front */}
      {records.map((record, recordIndex) => (
        <Sleeve
          key={`${record.artist}-${record.title}`}
          record={record}
          recordIndex={recordIndex}
          restingZ={usableDepth / 2 - recordIndex * sleeveSpacing}
          isPicked={isCrateOpen && selectedRecordIndex === recordIndex}
          isRaised={isBrowsing && browseRecordIndex === recordIndex}
          isCrateOpen={isCrateOpen}
          loadFront={hasVisitedHobbies}
          onPick={setSelectedRecordIndex}
          onBrowse={setBrowseRecordIndex}
        />
      ))}
    </Selectable>
  );
}
