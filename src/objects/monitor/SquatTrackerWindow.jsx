/*
 * ============================================================================
 * Program Name:   SquatTrackerWindow.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    The Squat Tracker's app window: a working, simulated
 *                 version of the repo's "Bar Path Live" viewer
 *                 (src/bar_path.py). A drawn lifter squats in a phone-style
 *                 clip; every second video frame (15 fps of 30) goes through
 *                 fake detections and the ported tracking code, which builds
 *                 the red bar-path trail and the HUD exactly as the Python
 *                 draws them. The same keys work (l, a, c, space) and there
 *                 are buttons for them. Beside the clip, each finished rep is
 *                 measured with the formulas from the repo's README.
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { SQUAT_DEMO_TEXT } from '../../data/squatDemo';
import {
  CLASS_NAMES,
  barCenter,
  createRepCounter,
  currentPhase,
  frameStep,
  pickBestBarbell,
  pushTrailPoint,
  verticalVelocity,
} from './squatPipeline';
import {
  CLIP_SECONDS,
  NATIVE_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  createRandom,
  drawFrame,
  fakeDetections,
  lifterPose,
} from './squatSimulation';

// ---- Drawing constants, from bar_path.py (its colours are BGR; these are the same colours in RGB) ----
const TRAIL_COLOUR = 'rgb(255, 0, 0)';       // RED (0, 0, 255)
const TRAIL_THICKNESS = 3;
const TRAIL_ALPHA = 0.7;
const HUD_ON_COLOUR = 'rgb(255, 0, 255)';    // MAGENTA, while the trail is on
const HUD_OFF_COLOUR = 'rgb(255, 165, 0)';   // ORANGE, while it's off
const HUD_PADDING = 4;

// Ultralytics' default box colours for classes 0-2, and its keypoint colours
const CLASS_COLOURS = ['#ff3838', '#ff9d97', '#ff701f'];
const KEYPOINT_COLOURS = ['#ff8000', '#33ff33'];

const PIXEL_RATIO = 2;          // draw at 2x so the clip stays sharp on the scaled screen
const UI_REFRESH_SECONDS = 0.1; // how often the side panel numbers update
const RANDOM_SEED = 2024;
const INFERENCE_STEP = frameStep(NATIVE_FPS);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Overlay drawing: what the viewer puts on top of each frame
// ---------------------------------------------------------------------------
function drawTrail(context, trail) {
  if (trail.length < 2) return;
  context.save();
  context.globalAlpha = TRAIL_ALPHA;
  context.strokeStyle = TRAIL_COLOUR;
  context.lineWidth = TRAIL_THICKNESS;
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(trail[0].x, trail[0].y);
  for (let pointIndex = 1; pointIndex < trail.length; pointIndex += 1) {
    context.lineTo(trail[pointIndex].x, trail[pointIndex].y);
  }
  context.stroke();
  context.restore();
}

// What res.plot() adds when annotations are on: boxes, labels and keypoints
function drawAnnotations(context, detections) {
  context.save();
  context.font = '600 9px ui-monospace, Menlo, Consolas, monospace';
  for (const detection of detections) {
    const colour = CLASS_COLOURS[detection.cls];
    const { left, top, right, bottom } = detection.box;
    context.strokeStyle = colour;
    context.lineWidth = 1.5;
    context.strokeRect(left, top, right - left, bottom - top);

    const label = `${CLASS_NAMES[detection.cls]} ${detection.conf.toFixed(2)}`;
    const labelWidth = context.measureText(label).width + 6;
    context.fillStyle = colour;
    context.fillRect(left - 0.75, top - 12, labelWidth, 12);
    context.fillStyle = '#ffffff';
    context.fillText(label, left + 2.5, top - 3);

    detection.keypoints.forEach((keypoint, keypointIndex) => {
      if (keypoint.x <= 1 && keypoint.y <= 1) return;
      context.fillStyle = KEYPOINT_COLOURS[keypointIndex];
      context.beginPath();
      context.arc(keypoint.x, keypoint.y, 3, 0, Math.PI * 2);
      context.fill();
    });
  }
  context.restore();
}

// The HUD: text in a white box with an outline in the text's colour
function drawHud(context, isTrailOn, isAnnotationsOn, pointCount) {
  const hudText = `trail=${isTrailOn ? 'ON' : 'OFF'} | ann=${isAnnotationsOn ? 'ON' : 'OFF'} | pts=${pointCount}`;
  const hudColour = isTrailOn ? HUD_ON_COLOUR : HUD_OFF_COLOUR;
  context.save();
  context.font = '11px ui-monospace, Menlo, Consolas, monospace';
  const textWidth = context.measureText(hudText).width;
  const boxLeft = 8 - HUD_PADDING;
  const boxTop = 10 - HUD_PADDING;
  const boxWidth = textWidth + HUD_PADDING * 2;
  const boxHeight = 13 + HUD_PADDING * 2;
  context.fillStyle = '#ffffff';
  context.fillRect(boxLeft, boxTop, boxWidth, boxHeight);
  context.strokeStyle = hudColour;
  context.lineWidth = 2;
  context.strokeRect(boxLeft, boxTop, boxWidth, boxHeight);
  context.fillStyle = hudColour;
  context.fillText(hudText, 8, 20);
  context.restore();
}

// ---------------------------------------------------------------------------
// The window
// ---------------------------------------------------------------------------
export default function SquatTrackerWindow() {
  const text = SQUAT_DEMO_TEXT;
  const canvasRef = useRef(null);

  // Viewer toggles. Kept in refs for the animation loop and in state for the buttons.
  const [isTrailOn, setIsTrailOn] = useState(true);
  const [isAnnotationsOn, setIsAnnotationsOn] = useState(false);
  const [isPaused, setIsPaused] = useState(prefersReducedMotion);
  const togglesRef = useRef({ isTrailOn, isAnnotationsOn, isPaused });
  togglesRef.current = { isTrailOn, isAnnotationsOn, isPaused };

  // Tracking state, owned by the loop
  const trackerRef = useRef(null);
  const clearRequestedRef = useRef(false);

  // What the side panel shows
  const [liveReadout, setLiveReadout] = useState({ points: 0, phase: 'standing', velocity: 0, frame: 0 });
  const [finishedReps, setFinishedReps] = useState([]);

  // ---- Starts (or restarts) the clip from the first frame ----
  const resetTracker = useCallback(() => {
    trackerRef.current = {
      clipTime: 0,
      lastVideoFrame: -1,
      random: createRandom(RANDOM_SEED),
      trail: [],
      repCounter: createRepCounter(),
      lastDetections: [],
    };
    setFinishedReps([]);
  }, []);

  // ---- The animation loop: advance the clip, run "inference", draw ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = VIDEO_WIDTH * PIXEL_RATIO;
    canvas.height = VIDEO_HEIGHT * PIXEL_RATIO;
    resetTracker();

    let animationFrameId = 0;
    let previousTimestamp = null;
    let secondsSinceReadout = UI_REFRESH_SECONDS;

    const renderFrame = (timestamp) => {
      const elapsed = previousTimestamp === null ? 0 : Math.min(0.1, (timestamp - previousTimestamp) / 1000);
      previousTimestamp = timestamp;
      const { isTrailOn: trailOn, isAnnotationsOn: annotationsOn, isPaused: paused } = togglesRef.current;
      let tracker = trackerRef.current;

      // 'c' empties the trail, as in the Python
      if (clearRequestedRef.current) {
        tracker.trail.length = 0;
        clearRequestedRef.current = false;
      }

      if (!paused) {
        tracker.clipTime += elapsed;
        // End of the clip: replay it from the start with a fresh trail
        if (tracker.clipTime >= CLIP_SECONDS) {
          resetTracker();
          tracker = trackerRef.current;
        }

        // Run every video frame that has passed since the last draw; only every
        // INFERENCE_STEP-th one goes through the model
        const videoFrame = Math.floor(tracker.clipTime * NATIVE_FPS);
        for (let frameIndex = tracker.lastVideoFrame + 1; frameIndex <= videoFrame; frameIndex += 1) {
          if (frameIndex % INFERENCE_STEP !== 0) continue;
          const frameTime = frameIndex / NATIVE_FPS;
          const detections = fakeDetections(lifterPose(frameTime), tracker.random);
          tracker.lastDetections = detections;
          const centre = barCenter(pickBestBarbell(detections));
          if (!centre) continue;
          const point = { ...centre, time: frameTime };
          pushTrailPoint(tracker.trail, point);
          const finishedRep = tracker.repCounter.addPoint(point);
          if (finishedRep) setFinishedReps((reps) => [...reps, finishedRep]);
        }
        tracker.lastVideoFrame = videoFrame;
      }

      // Draw: the frame, then annotations, the trail and the HUD on top
      context.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
      drawFrame(context, lifterPose(tracker.clipTime));
      if (annotationsOn) drawAnnotations(context, tracker.lastDetections);
      if (trailOn) drawTrail(context, tracker.trail);
      drawHud(context, trailOn, annotationsOn, tracker.trail.length);

      secondsSinceReadout += elapsed;
      if (secondsSinceReadout >= UI_REFRESH_SECONDS || paused) {
        secondsSinceReadout = 0;
        const trail = tracker.trail;
        setLiveReadout({
          points: trail.length,
          phase: currentPhase(trail, tracker.repCounter.standingY),
          velocity: verticalVelocity(trail),
          frame: Math.max(0, tracker.lastVideoFrame),
        });
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [resetTracker]);

  // ---- Controls ----
  const toggleTrail = () => setIsTrailOn((on) => !on);
  const toggleAnnotations = () => setIsAnnotationsOn((on) => !on);
  const clearTrail = () => {
    clearRequestedRef.current = true;
  };
  const togglePause = () => setIsPaused((paused) => !paused);

  // The viewer's keys, while the window has focus
  const handleKeyDown = (event) => {
    const keyActions = { l: toggleTrail, a: toggleAnnotations, c: clearTrail, ' ': togglePause };
    const action = keyActions[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  // The rep with the cleanest path, and the one that wandered most
  let straightestRep = null;
  let mostDriftRep = null;
  if (finishedReps.length > 1) {
    straightestRep = finishedReps.reduce((best, rep) => (rep.linearityPx2 < best.linearityPx2 ? rep : best));
    mostDriftRep = finishedReps.reduce((worst, rep) => (rep.driftPx > worst.driftPx ? rep : worst));
  }

  const controlButtons = [
    { id: 'trail', control: text.controls.trail, isOn: isTrailOn, onClick: toggleTrail },
    { id: 'annotations', control: text.controls.annotations, isOn: isAnnotationsOn, onClick: toggleAnnotations },
    { id: 'clear', control: text.controls.clear, isOn: false, onClick: clearTrail },
    { id: 'pause', control: text.controls.pause, isOn: isPaused, onClick: togglePause },
  ];

  return (
    <div className="squat-demo" tabIndex={0} onKeyDown={handleKeyDown} aria-label={text.windowLabel}>
      {/* ---------------- The clip ---------------- */}
      <div className="squat-video">
        <canvas
          ref={canvasRef}
          style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}
          role="img"
          aria-label="Simulated squat clip with the tracked bar path drawn in red"
        />
      </div>

      {/* ---------------- Controls and analysis ---------------- */}
      <div className="squat-panel">
        <div className="squat-command">
          <span className="squat-prompt">$</span> {text.command}
        </div>

        <div className="squat-controls">
          {controlButtons.map(({ id, control, isOn, onClick }) => (
            <button key={id} type="button" className={isOn ? 'squat-key is-on' : 'squat-key'} onClick={onClick} aria-pressed={id === 'clear' ? undefined : isOn}>
              <kbd>{control.key}</kbd>
              {id === 'pause' && isPaused ? control.resumeLabel : control.label}
            </button>
          ))}
        </div>

        <div className="squat-section-title">{text.liveHeading}</div>
        <dl className="squat-live">
          <div><dt>{text.liveLabels.points}</dt><dd>{liveReadout.points}</dd></div>
          <div><dt>{text.liveLabels.phase}</dt><dd className={`is-${liveReadout.phase}`}>{text.phases[liveReadout.phase]}</dd></div>
          <div><dt>{text.liveLabels.velocity}</dt><dd>{Math.round(liveReadout.velocity)} px/s</dd></div>
          <div><dt>{text.liveLabels.frame}</dt><dd>{liveReadout.frame}</dd></div>
        </dl>

        <div className="squat-section-title">{text.repsHeading}</div>
        <table className="squat-reps">
          <thead>
            <tr>
              {text.repColumns.map((column, columnIndex) => (
                <th key={column}>
                  {column}
                  {text.repUnits[columnIndex] && <span className="squat-unit"> {text.repUnits[columnIndex]}</span>}
                </th>
              ))}
              <th aria-label="notes" />
            </tr>
          </thead>
          <tbody>
            {finishedReps.length === 0 ? (
              <tr>
                <td colSpan={6} className="squat-empty">{text.noRepsYet}</td>
              </tr>
            ) : (
              finishedReps.map((rep) => (
                <tr key={rep.repNumber}>
                  <td>{rep.repNumber}</td>
                  <td>{Math.round(rep.depthPx)}</td>
                  <td>{Math.round(rep.driftPx)}</td>
                  <td>{rep.linearityPx2.toFixed(1)}</td>
                  <td>{rep.seconds.toFixed(1)}</td>
                  <td className="squat-tag">
                    {rep === straightestRep && <span className="is-good">{text.straightestTag}</span>}
                    {rep === mostDriftRep && <span className="is-bad">{text.wanderingTag}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p className="squat-note">{text.note}</p>
      </div>
    </div>
  );
}
