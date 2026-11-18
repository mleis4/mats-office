/*
 * ============================================================================
 * Program Name:   globalReaderStack.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    How the two GlobalReader boards fit together: the model
 *                 files, their rotations and where the radio board (a shield)
 *                 sits on the baseboard. Shared by the board stack on the 3D
 *                 workbench and the 3D viewer on the 2D write-up page, so the
 *                 two can never disagree.
 * ============================================================================
 */

export const BASE_BOARD_URL = '/models/BaseBoard.glb';
export const RADIO_BOARD_URL = '/models/RadioBoard.glb';

// Where the shield sits on the baseboard, in the models' own units (metres).
// The two exports don't share an origin, so these were tuned by eye.
export const SHIELD_SEAT_HEIGHT = 0.007; // baseboard bottom to the tips of the shield's pins
export const SHIELD_OFFSET_X = 0.0065;
export const SHIELD_OFFSET_Z = -0.0138;

// The baseboard sits connector-side up. The shield goes on face-down and
// turned a quarter turn, so its two pin headers drop into the baseboard's
// two sockets (3-pin power at the back, 8-pin comms at the front).
export const BASE_ROTATION = [Math.PI, 0, 0];
export const SHIELD_ROTATION = [Math.PI, -Math.PI / 2, 0, 'YXZ'];
