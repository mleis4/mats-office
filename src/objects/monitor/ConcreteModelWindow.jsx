/*
 * ============================================================================
 * Program Name:   ConcreteModelWindow.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The Concrete Strength Predictor's app window: a notebook
 *                 look with a predicted-vs-actual sketch and a bar chart
 *                 comparing the baseline's RMSE with the XGBoost model's.
 *                 The RMSE values are the real validation results; the
 *                 scatter is an illustration, not the real data.
 * ============================================================================
 */

const BASELINE_RMSE = 11.0; // MPa, multiple linear regression
const XGBOOST_RMSE = 4.9;   // MPa, validation set

const PLOT_SIZE = 150;
const POINT_COUNT = 46;

// Deterministic "random" scatter around the diagonal, so it looks the same on every load
const scatterPoints = Array.from({ length: POINT_COUNT }, (_, pointIndex) => {
  const along = ((pointIndex * 37) % 100) / 100;
  const wobble = (((pointIndex * 53) % 17) - 8) / 100;
  return {
    x: 12 + along * (PLOT_SIZE - 24),
    y: PLOT_SIZE - 12 - (along + wobble) * (PLOT_SIZE - 24),
  };
});

export default function ConcreteModelWindow() {
  const baselineBarHeight = 96;
  const xgboostBarHeight = (XGBOOST_RMSE / BASELINE_RMSE) * baselineBarHeight;

  return (
    <div className="notebook">
      <div className="notebook-cell">
        <span className="notebook-prompt">In [7]:</span>
        <code>evaluate(xgb_pipeline, X_val, y_val)</code>
      </div>

      <div className="notebook-output">
        <figure className="notebook-figure">
          <svg width={PLOT_SIZE} height={PLOT_SIZE} viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`} role="img" aria-label="Sketch of predicted against actual strength, clustered along the diagonal">
            <rect x="0.5" y="0.5" width={PLOT_SIZE - 1} height={PLOT_SIZE - 1} fill="#ffffff" stroke="#c9c2b4" />
            <line x1="12" y1={PLOT_SIZE - 12} x2={PLOT_SIZE - 12} y2="12" stroke="#b0a892" strokeDasharray="4 3" />
            {scatterPoints.map((point, pointIndex) => (
              <circle key={pointIndex} cx={point.x} cy={point.y} r="2.6" fill="#17345e" opacity="0.75" />
            ))}
          </svg>
          <figcaption>Predicted vs actual (sketch)</figcaption>
        </figure>

        <figure className="notebook-figure">
          <div className="rmse-bars" role="img" aria-label={`Validation RMSE: baseline ${BASELINE_RMSE} MPa, XGBoost ${XGBOOST_RMSE} MPa`}>
            <div className="rmse-bar">
              <span className="rmse-value">{BASELINE_RMSE.toFixed(1)}</span>
              <div className="rmse-fill is-baseline" style={{ height: baselineBarHeight }} />
              <span className="rmse-name">Linear</span>
            </div>
            <div className="rmse-bar">
              <span className="rmse-value">{XGBOOST_RMSE.toFixed(1)}</span>
              <div className="rmse-fill is-model" style={{ height: xgboostBarHeight }} />
              <span className="rmse-name">XGBoost</span>
            </div>
          </div>
          <figcaption>Validation RMSE (MPa)</figcaption>
        </figure>
      </div>
    </div>
  );
}
