/*
 * ============================================================================
 * Program Name:   squatDemo.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    All wording for the Squat Tracker demo window on the
 *                 monitor: the command line, the control labels, the column
 *                 names and the note on what is real and what is simulated.
 * ============================================================================
 */

export const SQUAT_DEMO_TEXT = {
  command: 'python src/bar_path.py',
  windowLabel: 'Bar Path Live',
  controls: {
    trail: { key: 'l', label: 'trail' },
    annotations: { key: 'a', label: 'YOLO boxes' },
    clear: { key: 'c', label: 'clear' },
    pause: { key: 'space', label: 'pause', resumeLabel: 'play' },
  },
  liveHeading: 'live',
  liveLabels: {
    points: 'points',
    phase: 'phase',
    velocity: 'v_y',
    frame: 'frame',
  },
  phases: {
    standing: 'standing',
    descent: 'descent',
    bottom: 'bottom',
    ascent: 'ascent',
  },
  repsHeading: 'reps (README math)',
  repColumns: ['rep', 'depth', 'drift', 'lin. err', 'time'],
  repUnits: ['', 'px', 'px', 'px²', 's'],
  noRepsYet: 'waiting for the first rep to finish…',
  straightestTag: 'straightest',
  wanderingTag: 'most drift',
  note:
    'Simulated: a drawn lifter stands in for squat.MOV and the detections are generated with noise, then run through a JavaScript port of bar_path.py (same CONF 0.25, 15 fps sampling, most-confident barbell, midpoint of the two plate keypoints). The rep columns use the formulas from the repo’s README: drift = max |xᵢ − x₀|, linearity = mean squared distance from the fitted line x = a·y + b.',
  replayNote: 'clip restarted',
};
