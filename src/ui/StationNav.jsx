/*
 * ============================================================================
 * Program Name:   StationNav.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The station navigation at the bottom of the screen: left
 *                 and right arrows, one dot per station, and the current
 *                 station's name. Keyboard arrows and swipes are handled in
 *                 App.jsx and call the same functions.
 * ============================================================================
 */

import { STATIONS, STATION_ORDER } from '../scene/stations';

export default function StationNav({ station, onGoTo, onStep }) {
  const stationIndex = STATION_ORDER.indexOf(station);
  const isFirst = stationIndex <= 0;
  const isLast = stationIndex === STATION_ORDER.length - 1;

  return (
    <nav className="station-nav" aria-label="Stations">
      <button type="button" className="icon-button" onClick={() => onStep(-1)} disabled={isFirst} aria-label="Previous station">←</button>

      <div className="station-dots">
        {STATION_ORDER.map((stationId) => (
          <button
            key={stationId}
            type="button"
            className={stationId === station ? 'station-dot is-current' : 'station-dot'}
            onClick={() => onGoTo(stationId)}
            aria-label={`Go to ${STATIONS[stationId].label}`}
            aria-current={stationId === station ? 'true' : undefined}
          >
            <span />
          </button>
        ))}
      </div>

      <span className="station-name" aria-live="polite">{STATIONS[station]?.label}</span>

      <button type="button" className="icon-button" onClick={() => onStep(1)} disabled={isLast} aria-label="Next station">→</button>
    </nav>
  );
}
