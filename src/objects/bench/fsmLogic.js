/*
 * ============================================================================
 * Program Name:   fsmLogic.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Gate-level model of my ECE 2277A Moore FSM sequence
 *                 detector. Output Z goes HIGH after the input stream contains
 *                 0011, and goes back LOW after 0101 (or when reset is
 *                 pressed). The next-state logic uses the exact optimized
 *                 Sum-of-Products equations from the project report, so the
 *                 website demo behaves like the circuit built in Quartus.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Sequences the circuit detects
// ---------------------------------------------------------------------------
export const SET_SEQUENCE = '0011';   // drives Z HIGH
export const CLEAR_SEQUENCE = '0101'; // drives Z back LOW

// ---------------------------------------------------------------------------
// Optimized state assignment (report Figure 8)
// Each state is stored in three D flip-flops as [Q1, Q2, Q3]
// ---------------------------------------------------------------------------
export const STATE_CODES = {
  S0: [0, 0, 0],
  S1: [0, 0, 1],
  S2: [0, 1, 0],
  S3: [0, 1, 1],
  S4: [1, 0, 1],
  S5: [1, 1, 0],
  S6: [1, 1, 1],
  S7: [1, 0, 0],
};

// Plain-English meaning of each state, shown in the info panel
export const STATE_MEANINGS = {
  S0: 'Z = 0, waiting for 0011',
  S1: 'Seen "0"',
  S2: 'Seen "00"',
  S3: 'Seen "001"',
  S4: 'Z = 1, waiting for 0101',
  S5: 'Seen "0"',
  S6: 'Seen "01"',
  S7: 'Seen "010"',
};

// Flip-flops all cleared = S0, the reset state
export const RESET_FLIP_FLOPS = { q1: 0, q2: 0, q3: 0 };

// ---------------------------------------------------------------------------
// NOT gate helper: inverts a single bit
// ---------------------------------------------------------------------------
const notGate = (bit) => (bit ? 0 : 1);

// ---------------------------------------------------------------------------
// computeNextState
// Applies the optimized next-state equations to the current flip-flop
// values and input bit x. Returns the values the D flip-flops will latch
// on the next clock edge.
//
//   Q1+ = Q1X' + Q1Q2 + Q1Q3 + Q2Q3X
//   Q2+ = Q2Q3' + Q1Q2'X' + Q2'Q3X'
//   Q3+ = Q2X + Q1Q3X + Q1'Q2Q3 + Q1'Q2'Q3'X'
// ---------------------------------------------------------------------------
export function computeNextState(flipFlops, inputBit) {
  const { q1, q2, q3 } = flipFlops;
  const x = inputBit;

  // Inverted signals, as produced by the NOT gates in the circuit
  const q1Bar = notGate(q1);
  const q2Bar = notGate(q2);
  const q3Bar = notGate(q3);
  const xBar = notGate(x);

  const nextQ1 =
    (q1 & xBar) | (q1 & q2) | (q1 & q3) | (q2 & q3 & x);

  const nextQ2 =
    (q2 & q3Bar) | (q1 & q2Bar & xBar) | (q2Bar & q3 & xBar);

  const nextQ3 =
    (q2 & x) | (q1 & q3 & x) | (q1Bar & q2 & q3) | (q1Bar & q2Bar & q3Bar & xBar);

  return { q1: nextQ1, q2: nextQ2, q3: nextQ3 };
}

// ---------------------------------------------------------------------------
// computeOutput
// Moore machine: the output depends only on the current state. Z = Q1.
// ---------------------------------------------------------------------------
export function computeOutput(flipFlops) {
  return flipFlops.q1;
}

// ---------------------------------------------------------------------------
// getStateName
// Converts flip-flop values back to a state label such as "S4"
// ---------------------------------------------------------------------------
export function getStateName(flipFlops) {
  const { q1, q2, q3 } = flipFlops;
  for (const [stateName, code] of Object.entries(STATE_CODES)) {
    if (code[0] === q1 && code[1] === q2 && code[2] === q3) {
      return stateName;
    }
  }
  return 'S?'; // unreachable with valid 3-bit values
}
