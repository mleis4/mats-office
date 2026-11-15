/*
 * ============================================================================
 * Program Name:   Desktop.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The fake desktop shown on the monitor. Each software
 *                 project is an app window; clicking one opens its Project
 *                 Card. This is plain DOM rendered onto the screen by drei's
 *                 <Html transform>, which runs in its own React root, so it
 *                 gets everything it needs through props, not context.
 * ============================================================================
 */

import ColdEmailerWindow from './ColdEmailerWindow';
import ConcreteModelWindow from './ConcreteModelWindow';
import SquatTrackerWindow from './SquatTrackerWindow';

export const DESKTOP_WIDTH_PX = 960;
export const DESKTOP_HEIGHT_PX = 560;

const APP_WINDOWS = [
  { id: 'cold-emailer', title: 'Cold Emailer', className: 'app-window is-mail', Content: ColdEmailerWindow },
  { id: 'concrete-model', title: 'concrete_strength.ipynb', className: 'app-window is-notebook', Content: ConcreteModelWindow },
  { id: 'squat-tracker', title: 'Squat Tracker', className: 'app-window is-tracker', Content: SquatTrackerWindow },
];

export default function Desktop({ focusId, onOpenApp }) {
  return (
    <div className="desktop" style={{ width: DESKTOP_WIDTH_PX, height: DESKTOP_HEIGHT_PX }}>
      {APP_WINDOWS.map(({ id, title, className, Content }) => (
        <button
          key={id}
          type="button"
          className={focusId === id ? `${className} is-focused` : className}
          onClick={(event) => { event.stopPropagation(); onOpenApp(id); }}
          aria-label={`Open ${title}`}
        >
          <span className="app-titlebar">
            <span className="app-dots"><i /><i /><i /></span>
            <span className="app-title">{title}</span>
          </span>
          <span className="app-content"><Content /></span>
        </button>
      ))}

      <div className="desktop-taskbar">
        <span>mats@office</span>
        <span>click a window to read about it</span>
      </div>
    </div>
  );
}
