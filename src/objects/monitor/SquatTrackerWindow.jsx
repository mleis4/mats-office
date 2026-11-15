/*
 * ============================================================================
 * Program Name:   SquatTrackerWindow.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The Squat Tracker's app window: a training batch from the
 *                 barbell keypoint model with an animated bar path drawn on
 *                 top, the way the tracker traces a lift.
 * ============================================================================
 */

export default function SquatTrackerWindow() {
  return (
    <div className="tracker">
      <img className="tracker-image" src="/images/squat-tracker-web.jpg" alt="Training images with barbell bounding boxes and keypoints" />

      {/* Bar path overlay: down and back up, slightly off vertical */}
      <svg className="tracker-overlay" viewBox="0 0 100 60" aria-hidden="true">
        <path d="M50 8 C 48 20, 53 32, 51 50 C 53 34, 49 20, 50 8" fill="none" stroke="#fede4e" strokeWidth="1" />
        {/* The dot is the barbell midpoint, riding the path down and back up */}
        <circle r="2.2" fill="#33ff66" stroke="#0c0c0e" strokeWidth="0.5">
          <animateMotion dur="3.2s" repeatCount="indefinite" path="M50 8 C 48 20, 53 32, 51 50 C 53 34, 49 20, 50 8" />
        </circle>
      </svg>

      <div className="tracker-readout">
        <span>bar path</span>
        <span>rep 3 · tracking</span>
      </div>
    </div>
  );
}
