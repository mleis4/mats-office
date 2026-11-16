/*
 * ============================================================================
 * Program Name:   stations.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The single source of truth for the room's layout: room
 *                 size, every camera pose (stations and object close-ups) and
 *                 where each clickable object sits. Units are metres, +Y is
 *                 up, the door is at +Z, the back wall at -Z, the hobby corner
 *                 at -X and the desk at +X. Everything is measured from the
 *                 walls, so changing ROOM resizes the whole office.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Room dimensions (a small, cozy room)
// ---------------------------------------------------------------------------
export const ROOM = {
  halfWidth: 2.5,   // walls at x = -2.5 and x = +2.5
  halfDepth: 2.3,   // back wall at z = -2.3, door wall at z = +2.3
  height: 2.7,
};

export const BACK_WALL_Z = -ROOM.halfDepth;
export const LEFT_WALL_X = -ROOM.halfWidth;
export const RIGHT_WALL_X = ROOM.halfWidth;

export const BENCH_TOP_Y = 0.95;
export const SHELF_TOP_Y = 1.87;
export const DESK_TOP_Y = 0.76;
export const CABINET_TOP_Y = 0.9;

// Furniture footprints, shared by Office.jsx and the stations
export const BENCH = { z: BACK_WALL_Z + 0.55, width: 2.3, depth: 0.95 };
export const SHELF = { z: BACK_WALL_Z + 0.2, width: 2.2, depth: 0.36 };
export const DESK = { x: RIGHT_WALL_X - 0.5, z: -0.2, width: 1.9, depth: 0.85 };
export const BENCH_MAT_THICKNESS = 0.008; // the soldering mat; boards on it sit this much higher

// A pegboard's origin sits this far off its wall, so the back of its frame touches the wall
export const PEGBOARD_STANDOFF = 0.006;
// Tool pegboard on the back wall, centred between the bench top and the
// bottoms of the shelf brackets (which hang 0.24 below the shelf top)
export const TOOL_PEGBOARD = { y: (BENCH_TOP_Y + SHELF_TOP_Y - 0.24) / 2, width: 2.0, height: 0.56 };

// ---------------------------------------------------------------------------
// The run of furniture along the left wall, from the back corner to the door:
// speaker, cabinet, speaker, guitar, keyboard. The sizes are what the models
// measure at their scene scale. The first four are spaced evenly between the
// back wall and the keyboard, so nothing touches or overlaps.
// ---------------------------------------------------------------------------
const BASEBOARD_DEPTH = 0.02;
const CABINET_LENGTH = 1.46;
const CABINET_DEPTH = 0.69;
const SPEAKER_WIDTH = 0.24;
const GUITAR_WIDTH = 0.5;
const KEYBOARD_LENGTH = 1.0;
const KEYBOARD_Z = 1.25;
const SUNSTANG_POSTER_FRAMED_WIDTH = 0.78;

const KEYBOARD_START_Z = KEYBOARD_Z - KEYBOARD_LENGTH / 2;
const LEFT_RUN_GAP = (KEYBOARD_START_Z - BACK_WALL_Z - SPEAKER_WIDTH * 2 - CABINET_LENGTH - GUITAR_WIDTH) / 5;
const BACK_SPEAKER_Z = BACK_WALL_Z + LEFT_RUN_GAP + SPEAKER_WIDTH / 2;
const CABINET_Z = BACK_SPEAKER_Z + SPEAKER_WIDTH / 2 + LEFT_RUN_GAP + CABINET_LENGTH / 2;
const FRONT_SPEAKER_Z = CABINET_Z + CABINET_LENGTH / 2 + LEFT_RUN_GAP + SPEAKER_WIDTH / 2;
const GUITAR_Z = FRONT_SPEAKER_Z + SPEAKER_WIDTH / 2 + LEFT_RUN_GAP + GUITAR_WIDTH / 2;

// The cabinet's back stands against the baseboard
export const CABINET = { x: LEFT_WALL_X + BASEBOARD_DEPTH + CABINET_DEPTH / 2, z: CABINET_Z, length: CABINET_LENGTH };

export const LEFT_WALL_RUN = {
  backSpeakerZ: BACK_SPEAKER_Z,
  frontSpeakerZ: FRONT_SPEAKER_Z,
  keyboardZ: KEYBOARD_Z,
  keyboardLength: KEYBOARD_LENGTH,
  // The decor posters hang on one centre line with the Sunstang poster.
  // Moby sits midway between the back corner and the Sunstang poster;
  // Jeff Buckley is centred over the front speaker and the guitar.
  posterRowY: 1.94,
  mobyPosterZ: (BACK_WALL_Z + CABINET_Z - SUNSTANG_POSTER_FRAMED_WIDTH / 2) / 2,
  buckleyPosterZ: (FRONT_SPEAKER_Z - SPEAKER_WIDTH / 2 + GUITAR_Z + GUITAR_WIDTH / 2) / 2,
};

// ---------------------------------------------------------------------------
// Stations: fixed camera poses the visitor moves between
// ---------------------------------------------------------------------------
export const STATIONS = {
  door: { label: 'Door', position: [0, 1.4, ROOM.halfDepth + 3.05], target: [0, 1.2, ROOM.halfDepth] },
  bench: { label: 'Workbench', position: [0, 1.8, BACK_WALL_Z + 3.5], target: [0, 1.2, BACK_WALL_Z + 0.4] },
  hobbies: { label: 'Hobbies', position: [LEFT_WALL_X + 2.95, 1.55, 0.05], target: [LEFT_WALL_X, 1.3, 0.05] },
  desk: { label: 'Desk', position: [RIGHT_WALL_X - 2.25, 1.35, DESK.z], target: [RIGHT_WALL_X, 1.08, DESK.z] },
};

// Left/right cycling order. The door is only the entry.
export const STATION_ORDER = ['hobbies', 'bench', 'desk'];

// ---------------------------------------------------------------------------
// Close-up pose builders. Each returns a camera position and target for one
// object, plus a sideways shift that slides the object left of centre on wide
// screens so the Project Card (docked on the right) doesn't cover it.
// ---------------------------------------------------------------------------
const benchFocus = ([x, y, z], distance = 0.85, height = 0.6) => ({
  position: [x, y + height, z + distance],
  target: [x, y + 0.06, z],
  shift: [0.22 * distance, 0, 0],
});

const wallFocus = ([x, y, z], distance = 1.5, lift = 0) => ({
  position: [x + distance, y + lift + 0.1, z],
  target: [x, y + lift, z],
  shift: [0, 0, -0.2 * distance],
});

const SCREEN_CENTRE = [RIGHT_WALL_X - 0.38, 1.22, DESK.z];
const monitorFocus = {
  position: [SCREEN_CENTRE[0] - 1.02, 1.24, DESK.z],
  target: SCREEN_CENTRE,
  shift: [0, 0, 0.17],
};

// ---------------------------------------------------------------------------
// Objects: where each clickable thing sits and how the camera frames it.
// Keys match the ids in src/data/*.json.
// ---------------------------------------------------------------------------
const GLOBALREADER_POSITION = [-0.78, BENCH_TOP_Y, BENCH.z + 0.15];
// The FSM board and the Sunstang board lie on the soldering mat. The FSM
// board's origin is 0.011 above its underside at the scale it is shown at.
const FSM_POSITION = [-0.02, BENCH_TOP_Y + BENCH_MAT_THICKNESS + 0.011, BENCH.z + 0.12];
const SUNSTANG_POSITION = [0.74, BENCH_TOP_Y + BENCH_MAT_THICKNESS, BENCH.z + 0.07];
const ROBOT_POSITION = [-0.6, SHELF_TOP_Y, SHELF.z]; // centred on the shelf's depth, wheels and all
// Crate and turntable are both centred on the cabinet's depth
const CRATE_POSITION = [CABINET.x, CABINET_TOP_Y, CABINET.z - 0.4];
const TURNTABLE_POSITION = [CABINET.x, CABINET_TOP_Y, CABINET.z + 0.4];
const GUITAR_POSITION = [LEFT_WALL_X + 0.55, 0, GUITAR_Z];
const RACKETS_POSITION = [LEFT_WALL_X + PEGBOARD_STANDOFF, 1.5, KEYBOARD_Z];
const SKIS_POSITION = [LEFT_WALL_X, 0, 2.07];
const POSTER_POSITION = [LEFT_WALL_X, LEFT_WALL_RUN.posterRowY, CABINET.z]; // flat on the wall, like the other prints

export const OBJECTS = {
  'robocup-robot': {
    station: 'bench',
    position: ROBOT_POSITION,
    focus: {
      position: [ROBOT_POSITION[0], SHELF_TOP_Y + 0.38, ROBOT_POSITION[2] + 1.15],
      target: [ROBOT_POSITION[0], SHELF_TOP_Y + 0.2, ROBOT_POSITION[2]],
      shift: [0.26, 0, 0],
    },
  },
  'fsm-detector': { station: 'bench', position: FSM_POSITION, focus: benchFocus(FSM_POSITION, 1.0, 0.75) },
  'sunstang-board': { station: 'bench', position: SUNSTANG_POSITION, focus: benchFocus(SUNSTANG_POSITION) },
  globalreader: { station: 'bench', position: GLOBALREADER_POSITION, focus: benchFocus(GLOBALREADER_POSITION, 0.8, 0.5) },

  'cold-emailer': { station: 'desk', position: SCREEN_CENTRE, focus: monitorFocus },
  'concrete-model': { station: 'desk', position: SCREEN_CENTRE, focus: monitorFocus },
  'squat-tracker': { station: 'desk', position: SCREEN_CENTRE, focus: monitorFocus },

  records: {
    station: 'hobbies',
    position: CRATE_POSITION,
    // Browsing: the camera looks down over the crate, like flipping through a bin
    focus: {
      position: [CRATE_POSITION[0] + 0.62, CRATE_POSITION[1] + 0.98, CRATE_POSITION[2]],
      target: [CRATE_POSITION[0] - 0.02, CRATE_POSITION[1] + 0.2, CRATE_POSITION[2]],
      shift: [0, 0, -0.2],
    },
    // One album picked: step back and left so the turntable is in view on the
    // left, with the floating album between it and the card
    pickedFocus: {
      position: [CRATE_POSITION[0] + 1.5, CRATE_POSITION[1] + 0.5, CRATE_POSITION[2] + 0.12],
      target: [CRATE_POSITION[0], CRATE_POSITION[1] + 0.3, CRATE_POSITION[2] + 0.12],
      shift: [0, 0, 0],
    },
  },
  turntable: { station: 'hobbies', position: TURNTABLE_POSITION, focus: wallFocus(TURNTABLE_POSITION, 1.2, 0.25) },
  guitar: { station: 'hobbies', position: GUITAR_POSITION, focus: wallFocus(GUITAR_POSITION, 1.9, 0.75) },
  tennis: { station: 'hobbies', position: RACKETS_POSITION, focus: wallFocus(RACKETS_POSITION, 1.8, 0) },
  skiing: { station: 'hobbies', position: SKIS_POSITION, focus: wallFocus(SKIS_POSITION, 1.75, 1.4) }, // close enough to stay inside the open door
  'sunstang-poster': { station: 'hobbies', position: POSTER_POSITION, focus: wallFocus(POSTER_POSITION, 2.1, 0) },
};

export const SCREEN = {
  centre: SCREEN_CENTRE,
  width: 0.96,
  height: 0.56,
};

// ---------------------------------------------------------------------------
// getCameraPose
// Returns the pose for the current station, or the close-up when an object
// is focused. usePickedPose selects an object's second close-up (the record
// crate has one for when an album is picked). The sideways shift is only
// applied on landscape screens.
// ---------------------------------------------------------------------------
export function getCameraPose(station, focusId, isLandscape, usePickedPose = false) {
  const focusedObject = focusId ? OBJECTS[focusId] : null;
  if (!focusedObject) {
    return STATIONS[station] ?? STATIONS.bench;
  }

  const closeUp = usePickedPose && focusedObject.pickedFocus ? focusedObject.pickedFocus : focusedObject.focus;
  const { position, target, shift } = closeUp;
  if (!isLandscape) {
    return { position, target };
  }
  return {
    position: position.map((value, axis) => value + shift[axis]),
    target: target.map((value, axis) => value + shift[axis]),
  };
}
