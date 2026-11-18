/*
 * ============================================================================
 * Program Name:   squatPipeline.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    A JavaScript port of The Perfect Squat's tracking code
 *                 (src/bar_path.py in github.com/hanjing06/The-Perfect-Squat),
 *                 plus the rep analysis that the repo's README lists under
 *                 "Math (for later)". The tracking half matches the Python:
 *                 same constants, the same "most confident barbell" choice,
 *                 the bar position as the midpoint of the two plate
 *                 keypoints, and a capped trail of points. The analysis half
 *                 (phase, depth, drift, linearity) is not in the repo's code
 *                 yet; it follows the README's formulas.
 * ============================================================================
 */

// ---- Constants, as in bar_path.py ----
export const CONF = 0.25;          // detections below this confidence are dropped by the model
export const TARGET_FPS = 15;      // inference rate: lower for faster, higher for smoother
export const BARBELL_CLS = 0;      // class 0 Barbell, 1 Front Plate, 2 Side Plate
export const KP0 = 0;              // keypoint 0: front plate centre
export const KP1 = 1;              // keypoint 1: side plate centre
export const MAX_POINTS = 5000;    // the trail deque's maxlen

export const CLASS_NAMES = ['Barbell', 'Front Plate', 'Side Plate'];

// ---- Frame sampling ----
// Only every step-th video frame is run through the model. A video that
// reports no frame rate is treated as 30 fps, as in the Python.
export function frameStep(nativeFps) {
  const fps = nativeFps > 0 ? nativeFps : 30;
  return Math.max(1, Math.round(fps / TARGET_FPS));
}

// ---- pick_best_barbell ----
// Keeps the class-0 detections above CONF and returns the most confident one,
// or null when there is no barbell in the frame.
export function pickBestBarbell(detections) {
  let best = null;
  for (const detection of detections) {
    if (detection.cls !== BARBELL_CLS || detection.conf < CONF) continue;
    if (!best || detection.conf > best.conf) best = detection;
  }
  return best;
}

// ---- Bar centre ----
// The midpoint of the two plate keypoints. A keypoint at (or next to) the
// origin means the model didn't place it, so the frame is skipped.
export function barCenter(detection) {
  if (!detection) return null;
  const plate0 = detection.keypoints[KP0];
  const plate1 = detection.keypoints[KP1];
  const isMissing = (point) => point.x <= 1 && point.y <= 1;
  if (isMissing(plate0) || isMissing(plate1)) return null;
  return {
    x: Math.trunc((plate0.x + plate1.x) / 2),
    y: Math.trunc((plate0.y + plate1.y) / 2),
  };
}

// ---- Trail ----
// Appends a point and drops the oldest once MAX_POINTS is reached, like
// Python's deque(maxlen=MAX_POINTS).
export function pushTrailPoint(trail, point) {
  trail.push(point);
  if (trail.length > MAX_POINTS) trail.shift();
}

// ===========================================================================
// Rep analysis: the README's "Math (for later)" formulas
// ===========================================================================

const START_DESCENT_PX = 8;   // the bar has to drop this far below standing before a rep starts
const TURN_AROUND_PX = 6;     // rising this far off the lowest point means the ascent has begun
const LOCKOUT_PX = 7;         // back within this distance of standing counts as locked out
const MIN_DEPTH_PX = 30;      // anything shallower is a wobble, not a rep
const STILL_SPEED_PX_S = 25;  // below this vertical speed the bar counts as still

// v_y between the last two points, in pixels per second. Image y grows downward,
// so a positive v_y is the bar going down.
export function verticalVelocity(trail) {
  if (trail.length < 2) return 0;
  const last = trail[trail.length - 1];
  const previous = trail[trail.length - 2];
  const elapsed = last.time - previous.time;
  return elapsed > 0 ? (last.y - previous.y) / elapsed : 0;
}

// Phase from the sign of v_y: descent while it's positive, ascent while
// negative, and bottom or standing when the bar is (nearly) still.
export function currentPhase(trail, standingY) {
  if (trail.length < 2) return 'standing';
  const velocityY = verticalVelocity(trail);
  if (velocityY > STILL_SPEED_PX_S) return 'descent';
  if (velocityY < -STILL_SPEED_PX_S) return 'ascent';
  const depthNow = trail[trail.length - 1].y - standingY;
  return depthNow > MIN_DEPTH_PX ? 'bottom' : 'standing';
}

// Least-squares fit of x = a*y + b over one rep. The linearity error is the
// mean squared horizontal distance from that line (px²): a clean vertical or
// evenly slanted path scores near zero, a path that wanders scores high.
export function linearityError(points) {
  const count = points.length;
  if (count < 3) return 0;
  let sumY = 0, sumX = 0, sumYY = 0, sumXY = 0;
  for (const point of points) {
    sumY += point.y;
    sumX += point.x;
    sumYY += point.y * point.y;
    sumXY += point.x * point.y;
  }
  const denominator = count * sumYY - sumY * sumY;
  const slope = denominator === 0 ? 0 : (count * sumXY - sumY * sumX) / denominator;
  const intercept = (sumX - slope * sumY) / count;
  let squaredError = 0;
  for (const point of points) {
    const residual = point.x - (slope * point.y + intercept);
    squaredError += residual * residual;
  }
  return squaredError / count;
}

// Depth, drift and linearity for one finished rep
function measureRep(points, repNumber) {
  const start = points[0];
  let deepest = start.y;
  let drift = 0;
  for (const point of points) {
    deepest = Math.max(deepest, point.y);
    drift = Math.max(drift, Math.abs(point.x - start.x));
  }
  return {
    repNumber,
    depthPx: deepest - start.y,
    driftPx: drift,
    linearityPx2: linearityError(points),
    seconds: points[points.length - 1].time - start.time,
  };
}

// Splits the trail into reps as points arrive. Feed it every new point; it
// returns a finished rep when the bar locks out at the top, otherwise null.
export function createRepCounter() {
  let state = 'top';
  let standingY = null;
  let lowestY = 0;
  let repPoints = [];
  let repsCounted = 0;

  return {
    get standingY() {
      return standingY ?? 0;
    },

    addPoint(point) {
      if (standingY === null) standingY = point.y;

      if (state === 'top') {
        // Standing height is the highest the bar sits between reps
        standingY = Math.min(standingY, point.y);
        repPoints.push(point);
        // Keep only the last few standing points so the rep starts right at the unrack height
        if (repPoints.length > 4) repPoints.shift();
        if (point.y - standingY > START_DESCENT_PX) {
          state = 'down';
          lowestY = point.y;
        }
        return null;
      }

      repPoints.push(point);
      lowestY = Math.max(lowestY, point.y);
      if (state === 'down' && point.y < lowestY - TURN_AROUND_PX) state = 'up';

      if (state === 'up' && point.y - standingY < LOCKOUT_PX) {
        const isRealRep = lowestY - standingY >= MIN_DEPTH_PX;
        const finishedRep = isRealRep ? measureRep(repPoints, repsCounted + 1) : null;
        if (isRealRep) repsCounted += 1;
        state = 'top';
        standingY = point.y;
        repPoints = [point];
        return finishedRep;
      }
      return null;
    },
  };
}
