/*
 * ============================================================================
 * Program Name:   squatSimulation.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    Stands in for the camera and the trained model in the
 *                 Squat Tracker demo. It animates a drawn lifter doing a set
 *                 of five squats (each rep a little different, the later ones
 *                 drifting forward as they tire), draws the gym "video"
 *                 frame, and produces fake YOLO pose detections from it: the
 *                 two plate keypoints with a little noise, a confidence, the
 *                 odd missed frame, and a stray plate on the floor that the
 *                 model sometimes picks up as a Side Plate. The real model
 *                 never runs in the browser.
 * ============================================================================
 */

// ---- The video frame ----
export const VIDEO_WIDTH = 280;
export const VIDEO_HEIGHT = 398;
export const NATIVE_FPS = 30; // squat.MOV is a phone clip

const FLOOR_Y = 356;
const ANKLE = { x: 118, y: 348 };
const SHIN_LENGTH = 76;
const THIGH_LENGTH = 80;
const TORSO_LENGTH = 90;
const HEAD_RADIUS = 12;
const STANDING_HIP_DROP = 98;       // how far the hip falls at full depth
const HIP_BACK_AT_DEPTH = 56;       // and how far it sits back

// The barbell seen from the front-left: the near plate is toward the camera,
// the far plate behind the lifter. A plate is 45 cm across; at this scale
// that is about 80 px for the near plate.
const BAR_AXIS = { x: -31, y: 15 };
const NEAR_PLATE_RADIUS = 38;
const FAR_PLATE_RADIUS = 31;

// ---- The set: timing and how each rep differs ----
const INTRO_SECONDS = 1.2;
const REPS = [
  // depth: share of full depth; driftPx: how far the bar wanders forward at the bottom;
  // descent/ascent in seconds; the last reps are slower and less tidy, like a real set
  { depth: 0.96, driftPx: 2, descent: 1.15, ascent: 0.95 },
  { depth: 1.0, driftPx: 4, descent: 1.2, ascent: 1.0 },
  { depth: 0.92, driftPx: 3, descent: 1.15, ascent: 1.05 },
  { depth: 1.02, driftPx: 11, descent: 1.25, ascent: 1.3 },
  { depth: 0.98, driftPx: 19, descent: 1.3, ascent: 1.65 },
];
const BOTTOM_PAUSE = 0.15;
const TOP_HOLD = 0.85;

const repTimings = [];
let runningTime = INTRO_SECONDS;
for (const rep of REPS) {
  const start = runningTime;
  const length = rep.descent + BOTTOM_PAUSE + rep.ascent + TOP_HOLD;
  repTimings.push({ ...rep, start, length });
  runningTime += length;
}
export const CLIP_SECONDS = runningTime + 0.6;

// ---- Small helpers ----
const smoothstep = (value) => value * value * (3 - 2 * value);

// Seeded random numbers, so every replay of the clip is the same "video"
export function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random) {
  const first = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * random());
}

// How deep the lifter is (0 standing, about 1 at parallel) and how far the bar
// has drifted forward, at a moment in the clip
function setProgress(timeSec) {
  for (const rep of repTimings) {
    const intoRep = timeSec - rep.start;
    if (intoRep < 0 || intoRep >= rep.length) continue;

    let depthShare;
    if (intoRep < rep.descent) depthShare = smoothstep(intoRep / rep.descent);
    else if (intoRep < rep.descent + BOTTOM_PAUSE) depthShare = 1;
    else if (intoRep < rep.descent + BOTTOM_PAUSE + rep.ascent) depthShare = 1 - smoothstep((intoRep - rep.descent - BOTTOM_PAUSE) / rep.ascent);
    else depthShare = 0;

    // The drift peaks just after the bottom, where tired lifters tip forward
    const movingTime = rep.descent + BOTTOM_PAUSE + rep.ascent;
    const driftShape = intoRep < movingTime ? Math.sin(Math.PI * Math.min(1, intoRep / movingTime)) ** 1.5 : 0;
    return { depth: depthShare * rep.depth, drift: driftShape * rep.driftPx };
  }
  return { depth: 0, drift: 0 };
}

// Two-bone leg: places the knee so the shin and thigh keep their lengths,
// bending forward (toward +x, the way the lifter faces)
function solveKnee(ankle, hip) {
  const deltaX = hip.x - ankle.x;
  const deltaY = hip.y - ankle.y;
  const distance = Math.min(Math.hypot(deltaX, deltaY), SHIN_LENGTH + THIGH_LENGTH - 0.01);
  const cosAngle = (SHIN_LENGTH ** 2 + distance ** 2 - THIGH_LENGTH ** 2) / (2 * SHIN_LENGTH * distance);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const baseAngle = Math.atan2(deltaY, deltaX);
  const candidates = [baseAngle + angle, baseAngle - angle].map((heading) => ({
    x: ankle.x + SHIN_LENGTH * Math.cos(heading),
    y: ankle.y + SHIN_LENGTH * Math.sin(heading),
  }));
  return candidates[0].x > candidates[1].x ? candidates[0] : candidates[1];
}

// ---- The lifter's pose at a moment in the clip ----
export function lifterPose(timeSec) {
  const { depth, drift } = setProgress(timeSec);
  // A slow, small sway so the standing bar isn't perfectly still
  const sway = Math.sin(timeSec * 1.7) * 0.8;

  const hip = {
    x: ANKLE.x - 6 - depth * HIP_BACK_AT_DEPTH,
    y: ANKLE.y - (SHIN_LENGTH + THIGH_LENGTH) * 0.985 + depth * STANDING_HIP_DROP,
  };
  const knee = solveKnee(ANKLE, hip);

  // The torso leans so the bar stays over mid-foot, plus whatever drift this rep has
  const barTargetX = ANKLE.x + 10 + drift + sway;
  const shoulderX = barTargetX + 3;
  const lean = Math.asin(Math.max(-0.95, Math.min(0.95, (shoulderX - hip.x) / TORSO_LENGTH)));
  const shoulder = { x: hip.x + TORSO_LENGTH * Math.sin(lean), y: hip.y - TORSO_LENGTH * Math.cos(lean) };
  const neck = { x: shoulder.x + 8 * Math.sin(lean), y: shoulder.y - 8 * Math.cos(lean) };
  const head = { x: neck.x + 4 + HEAD_RADIUS * Math.sin(lean), y: neck.y - HEAD_RADIUS * Math.cos(lean) };

  const barCentre = { x: shoulder.x - 3, y: shoulder.y - 1 };
  const elbow = { x: shoulder.x - 15, y: shoulder.y + 20 };
  const hand = { x: barCentre.x + 9, y: barCentre.y + 3 };

  return {
    ankle: ANKLE,
    knee,
    hip,
    shoulder,
    neck,
    head,
    elbow,
    hand,
    lean,
    bar: {
      centre: barCentre,
      nearPlate: { x: barCentre.x + BAR_AXIS.x, y: barCentre.y + BAR_AXIS.y },
      farPlate: { x: barCentre.x - BAR_AXIS.x, y: barCentre.y - BAR_AXIS.y },
    },
  };
}

// ---- Fake model output for one inferred frame ----
// Shaped like what bar_path.py reads off an Ultralytics result: class,
// confidence, a box, and the two plate keypoints.
const STRAY_PLATE = { x: 236, y: FLOOR_Y - 22 };

export function fakeDetections(pose, random) {
  const detections = [];

  // About one frame in forty the model misses the bar (motion blur, the lifter's arm in the way)
  if (random() > 0.025) {
    const jitter = () => gaussian(random) * 1.4;
    const front = { x: pose.bar.nearPlate.x + jitter(), y: pose.bar.nearPlate.y + jitter() };
    const side = { x: pose.bar.farPlate.x + jitter(), y: pose.bar.farPlate.y + jitter() };
    detections.push({
      cls: 0,
      conf: Math.min(0.98, 0.88 + gaussian(random) * 0.03),
      box: {
        left: Math.min(front.x - NEAR_PLATE_RADIUS, side.x - FAR_PLATE_RADIUS),
        top: Math.min(front.y - NEAR_PLATE_RADIUS, side.y - FAR_PLATE_RADIUS),
        right: Math.max(front.x + NEAR_PLATE_RADIUS, side.x + FAR_PLATE_RADIUS),
        bottom: Math.max(front.y + NEAR_PLATE_RADIUS, side.y + FAR_PLATE_RADIUS),
      },
      keypoints: [front, side],
    });
  }

  // The plate leaning on the rack sometimes shows up as a Side Plate. It's
  // class 2, so pick_best_barbell ignores it.
  if (random() < 0.4) {
    detections.push({
      cls: 2,
      conf: 0.3 + random() * 0.25,
      box: { left: STRAY_PLATE.x - 24, top: STRAY_PLATE.y - 24, right: STRAY_PLATE.x + 24, bottom: STRAY_PLATE.y + 24 },
      keypoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
    });
  }

  return detections;
}

// ===========================================================================
// Drawing the frame
// ===========================================================================

function drawLimb(context, from, to, width, colour) {
  context.strokeStyle = colour;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}

function drawPlate(context, centre, radius, shade) {
  // Plates seen at an angle look like ellipses
  context.save();
  context.translate(centre.x, centre.y);
  context.rotate(-0.12);
  context.fillStyle = shade;
  context.beginPath();
  context.ellipse(0, 0, radius * 0.42, radius, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,0.08)';
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(0, 0, radius * 0.3, radius * 0.72, 0, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = '#8a8a8a';
  context.beginPath();
  context.ellipse(0, 0, 3, 6, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBackground(context) {
  // Wall
  const wall = context.createLinearGradient(0, 0, 0, FLOOR_Y);
  wall.addColorStop(0, '#2b2a2e');
  wall.addColorStop(1, '#3b3936');
  context.fillStyle = wall;
  context.fillRect(0, 0, VIDEO_WIDTH, FLOOR_Y);

  // Squat rack uprights behind the lifter, with J-hooks
  context.fillStyle = '#1b1c20';
  context.fillRect(30, 40, 12, FLOOR_Y - 40);
  context.fillRect(212, 28, 12, FLOOR_Y - 28);
  context.fillStyle = '#2a2c31';
  for (let holeY = 60; holeY < FLOOR_Y - 10; holeY += 16) {
    context.fillRect(34, holeY, 4, 4);
    context.fillRect(216, holeY, 4, 4);
  }
  context.fillStyle = '#4a4c52';
  context.fillRect(42, 112, 10, 5);
  context.fillRect(200, 104, 12, 5);

  // Rubber floor
  context.fillStyle = '#1e1d1c';
  context.fillRect(0, FLOOR_Y, VIDEO_WIDTH, VIDEO_HEIGHT - FLOOR_Y);
  context.strokeStyle = '#2a2826';
  context.lineWidth = 1;
  for (let tileX = -40; tileX < VIDEO_WIDTH + 40; tileX += 56) {
    context.beginPath();
    context.moveTo(tileX, FLOOR_Y);
    context.lineTo(tileX - 30, VIDEO_HEIGHT);
    context.stroke();
  }

  // The stray plate leaning against the rack
  drawPlate(context, STRAY_PLATE, 22, '#24252a');

  // A little vignette, like a phone clip in a dim gym
  const vignette = context.createRadialGradient(VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2, 80, VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2, 260);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
}

export function drawFrame(context, pose) {
  drawBackground(context);
  const { ankle, knee, hip, shoulder, neck, head, elbow, hand, bar } = pose;
  const skin = '#c99a76';
  const shirt = '#3d5a80';
  const shorts = '#22252b';

  // Far plate and the bar sleeve behind the lifter
  drawPlate(context, bar.farPlate, FAR_PLATE_RADIUS, '#18191c');
  drawLimb(context, bar.farPlate, bar.centre, 3, '#9a9a9a');

  // Far leg, a touch behind and darker
  const offset = (point) => ({ x: point.x + 6, y: point.y - 3 });
  drawLimb(context, offset(hip), offset(knee), 15, '#1a1c21');
  drawLimb(context, offset(knee), offset(ankle), 11, '#a8805f');

  // Feet
  context.fillStyle = '#e8e3da';
  context.fillRect(ankle.x - 10, ankle.y - 3, 38, 9);
  context.fillRect(ankle.x - 4, ankle.y - 6, 38, 9);

  // Near leg
  drawLimb(context, knee, ankle, 12, skin);
  drawLimb(context, hip, knee, 17, shorts);

  // Torso
  drawLimb(context, hip, shoulder, 26, shirt);
  drawLimb(context, shoulder, neck, 9, skin);
  context.fillStyle = skin;
  context.beginPath();
  context.arc(head.x, head.y, HEAD_RADIUS, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#2b211b';
  context.beginPath();
  context.arc(head.x - 2, head.y - 3, HEAD_RADIUS - 1, Math.PI * 0.9, Math.PI * 2.1);
  context.fill();

  // Near arm up to the bar
  drawLimb(context, shoulder, elbow, 10, shirt);
  drawLimb(context, elbow, hand, 8, skin);

  // The bar sleeve toward the camera and the near plate
  drawLimb(context, bar.centre, bar.nearPlate, 3.5, '#b5b5b5');
  drawPlate(context, bar.nearPlate, NEAR_PLATE_RADIUS, '#202126');
}
