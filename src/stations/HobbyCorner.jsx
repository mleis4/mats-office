/*
 * ============================================================================
 * Program Name:   HobbyCorner.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Places the hobby corner along the left wall: the cabinet
 *                 with the record crate and turntable on top, the Sunstang
 *                 poster above them, a speaker at each end of the cabinet,
 *                 the guitar on its stand, the tennis rackets on a pegboard
 *                 above the keyboard, and the skis by the door. It also
 *                 hangs the room's posters and the Western flag.
 * ============================================================================
 */

import * as THREE from 'three';
import { useGLTF, useTexture } from '@react-three/drei';
import Guitar from '../objects/hobbies/Guitar';
import FramedPrint from '../objects/FramedPrint';
import Poster from '../objects/hobbies/Poster';
import RecordCrate from '../objects/hobbies/RecordCrate';
import Skis from '../objects/hobbies/Skis';
import TennisRackets from '../objects/hobbies/TennisRackets';
import Turntable from '../objects/hobbies/Turntable';
import ModelProp from '../objects/ModelProp';
import {
  CABINET, CABINET_TOP_Y, DESK, LEFT_WALL_RUN, LEFT_WALL_X, OBJECTS, RIGHT_WALL_X,
} from '../scene/stations';

const KEYBOARD_URL = '/models/basic_casio_keyboard.glb';
const CABINET_URL = '/models/cabinet.glb';
const SPEAKER_URL = '/models/speaker.glb';

const FACING_ROOM = [0, Math.PI / 2, 0];        // objects on the left wall face +X
const FACING_ROOM_FROM_RIGHT = [0, -Math.PI / 2, 0]; // objects on the right wall face -X

const SPEAKER_HEIGHT = 0.95;
const SPEAKER_WALL_GAP = 0.32;       // speaker centre to the left wall

// Posters that are decoration only. Positions are the centre of each print.
const WALL_POSTERS = [
  // Left wall: music posters either side of the Sunstang poster, on its centre line
  { url: '/textures/MobyPoster.jpg', width: 0.42, position: [LEFT_WALL_X, LEFT_WALL_RUN.posterRowY, LEFT_WALL_RUN.mobyPosterZ], rotation: FACING_ROOM },
  { url: '/textures/JeffBuckleyPoster.jpg', width: 0.5, position: [LEFT_WALL_X, LEFT_WALL_RUN.posterRowY, LEFT_WALL_RUN.buckleyPosterZ], rotation: FACING_ROOM },
  // Right wall: travel posters either side of the Western flag
  { url: '/textures/FinlandPoster.jpg', width: 0.48, position: [RIGHT_WALL_X, 1.7, DESK.z - 1.12], rotation: FACING_ROOM_FROM_RIGHT },
  { url: '/textures/TartuPoster.jpg', width: 0.48, position: [RIGHT_WALL_X, 1.7, DESK.z + 1.12], rotation: FACING_ROOM_FROM_RIGHT },
];

const FLAG_URL = '/textures/WesternPoster.jpg';
const FLAG_WIDTH = 1.0;
// The flag only fills the middle band of the square source image
const FLAG_CROP = { offsetX: 0.04, offsetY: 0.235, repeatX: 0.915, repeatY: 0.535 };
const FLAG_HEIGHT = FLAG_WIDTH * (FLAG_CROP.repeatY / FLAG_CROP.repeatX);

// ---------------------------------------------------------------------------
// Western University flag, pinned to a wall
// ---------------------------------------------------------------------------
function WesternFlag(groupProps) {
  const flagTexture = useTexture(FLAG_URL, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.offset.set(FLAG_CROP.offsetX, FLAG_CROP.offsetY);
    texture.repeat.set(FLAG_CROP.repeatX, FLAG_CROP.repeatY);
  });

  return (
    <mesh {...groupProps}>
      <planeGeometry args={[FLAG_WIDTH, FLAG_HEIGHT]} />
      <meshStandardMaterial map={flagTexture} roughness={0.9} />
    </mesh>
  );
}

export default function HobbyCorner() {
  return (
    <group>
      {/* Cabinet that the crate and turntable stand on */}
      <ModelProp url={CABINET_URL} height={CABINET_TOP_Y} position={[CABINET.x, 0, CABINET.z]} rotation={FACING_ROOM} />

      <RecordCrate position={OBJECTS.records.position} rotation={FACING_ROOM} />
      <Turntable position={OBJECTS.turntable.position} rotation={[0,Math.PI,0]} />
      <Poster position={OBJECTS['sunstang-poster'].position} rotation={FACING_ROOM} />
      <Guitar position={OBJECTS.guitar.position} rotation={FACING_ROOM} />
      <TennisRackets position={OBJECTS.tennis.position} rotation={FACING_ROOM} />

      <Skis position={OBJECTS.skiing.position} rotation={FACING_ROOM} />

      {/* A speaker at each end of the cabinet: one in the back corner, one beside the guitar */}
      <ModelProp url={SPEAKER_URL} height={SPEAKER_HEIGHT} position={[LEFT_WALL_X + SPEAKER_WALL_GAP, 0, LEFT_WALL_RUN.backSpeakerZ]} rotation={FACING_ROOM} />
      <ModelProp url={SPEAKER_URL} height={SPEAKER_HEIGHT} position={[LEFT_WALL_X + SPEAKER_WALL_GAP, 0, LEFT_WALL_RUN.frontSpeakerZ-0.05]} rotation={FACING_ROOM} />

      {/* Keyboard on its stand, under the pegboard */}
      <ModelProp
        url={KEYBOARD_URL}
        longest={LEFT_WALL_RUN.keyboardLength}
        position={[LEFT_WALL_X + 0.42, 0, LEFT_WALL_RUN.keyboardZ]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* Western flag on the right wall, above the monitor */}
      <WesternFlag position={[RIGHT_WALL_X - 0.012, 1.95, DESK.z]} rotation={FACING_ROOM_FROM_RIGHT} />

      {/* Posters */}
      {WALL_POSTERS.map((poster) => (
        <FramedPrint key={poster.url} {...poster} />
      ))}
    </group>
  );
}

useTexture.preload(FLAG_URL);
WALL_POSTERS.forEach((poster) => useTexture.preload(poster.url));
[KEYBOARD_URL, CABINET_URL, SPEAKER_URL].forEach((url) => useGLTF.preload(url));
