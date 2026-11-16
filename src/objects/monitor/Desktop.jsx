/*
 * ============================================================================
 * Program Name:   Desktop.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The fake desktop shown on the monitor, laid out like a
 *                 Windows home screen: a wallpaper, one desktop icon per
 *                 software project, and a taskbar with pinned apps and a
 *                 clock. Clicking an app opens its window on the screen and
 *                 its Project Card beside it. This is plain DOM rendered onto
 *                 the screen by drei's <Html transform>, which runs in its
 *                 own React root, so it gets everything it needs through
 *                 props, not context.
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import ColdEmailerWindow from './ColdEmailerWindow';
import ConcreteModelWindow from './ConcreteModelWindow';
import SquatTrackerWindow from './SquatTrackerWindow';

export const DESKTOP_WIDTH_PX = 960;
export const DESKTOP_HEIGHT_PX = 560;

const CLOCK_REFRESH_MS = 20000;

// ---------------------------------------------------------------------------
// App icons, drawn as small SVGs so no image files are needed
// ---------------------------------------------------------------------------
function MailGlyph() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#2f7de1" />
      <rect x="9" y="14" width="30" height="21" rx="3" fill="#ffffff" />
      <path d="M10 16 L24 27 L38 16" fill="none" stroke="#2f7de1" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}

function NotebookGlyph() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#f08a24" />
      <rect x="10" y="24" width="7" height="14" rx="1.5" fill="#ffffff" />
      <rect x="20.5" y="17" width="7" height="21" rx="1.5" fill="#ffffff" />
      <rect x="31" y="10" width="7" height="28" rx="1.5" fill="#ffffff" />
    </svg>
  );
}

function TrackerGlyph() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#1f9d57" />
      <rect x="8" y="22.5" width="32" height="3" rx="1.5" fill="#ffffff" />
      <rect x="11" y="14" width="5" height="20" rx="2" fill="#ffffff" />
      <rect x="32" y="14" width="5" height="20" rx="2" fill="#ffffff" />
      <rect x="6" y="18" width="3.5" height="12" rx="1.5" fill="#ffffff" />
      <rect x="38.5" y="18" width="3.5" height="12" rx="1.5" fill="#ffffff" />
    </svg>
  );
}

// Four tiles, the taskbar's start button
function StartGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" rx="1" fill="#6cb8ff" />
      <rect x="11" y="1" width="8" height="8" rx="1" fill="#6cb8ff" />
      <rect x="1" y="11" width="8" height="8" rx="1" fill="#6cb8ff" />
      <rect x="11" y="11" width="8" height="8" rx="1" fill="#6cb8ff" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The apps: one per software project. The ids match src/data/aiseProjects.json.
// ---------------------------------------------------------------------------
const APPS = [
  // isInteractive: the window is used, not just looked at, so clicking inside it doesn't reopen its card
  { id: 'cold-emailer', iconLabel: 'Cold Emailer', windowTitle: 'Cold Emailer: python main.py', className: 'app-window is-mail', Glyph: MailGlyph, Content: ColdEmailerWindow, isInteractive: true },
  { id: 'concrete-model', iconLabel: 'Concrete Model', windowTitle: 'concrete_strength.ipynb', className: 'app-window is-notebook', Glyph: NotebookGlyph, Content: ConcreteModelWindow },
  { id: 'squat-tracker', iconLabel: 'Squat Tracker', windowTitle: 'Squat Tracker', className: 'app-window is-tracker', Glyph: TrackerGlyph, Content: SquatTrackerWindow },
];

// ---------------------------------------------------------------------------
// useClock: the current time, refreshed often enough for a minutes display
// ---------------------------------------------------------------------------
function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setNow(new Date()), CLOCK_REFRESH_MS);
    return () => clearInterval(clockTimer);
  }, []);

  return now;
}

export default function Desktop({ focusId, onOpenApp }) {
  const [openAppId, setOpenAppId] = useState(focusId ?? null);
  const now = useClock();

  // If a project is opened from somewhere else (the 2D page, a link), show its window too
  useEffect(() => {
    if (focusId) setOpenAppId(focusId);
  }, [focusId]);

  const openApp = APPS.find((app) => app.id === openAppId);

  let taskbarHint = 'click an app to open it';
  if (openApp) taskbarHint = openApp.isInteractive ? 'type in the window to use it' : 'click the window to read about it';

  // Opens the app's window on the screen and its Project Card beside it
  const launchApp = (event, appId) => {
    event.stopPropagation();
    setOpenAppId(appId);
    onOpenApp(appId);
  };

  const closeWindow = (event) => {
    event.stopPropagation();
    setOpenAppId(null);
  };

  return (
    <div className="desktop" style={{ width: DESKTOP_WIDTH_PX, height: DESKTOP_HEIGHT_PX }}>
      {/* ---------------- Desktop icons ---------------- */}
      <div className="desktop-icons">
        {APPS.map(({ id, iconLabel, Glyph }) => (
          <button
            key={id}
            type="button"
            className={openAppId === id ? 'desktop-icon is-open' : 'desktop-icon'}
            onClick={(event) => launchApp(event, id)}
            aria-label={`Open ${iconLabel}`}
          >
            <span className="app-glyph"><Glyph /></span>
            <span className="desktop-icon-label">{iconLabel}</span>
          </button>
        ))}
      </div>

      {/* ---------------- The open app's window ---------------- */}
      {openApp && (
        <div className={focusId === openApp.id ? `${openApp.className} is-focused` : openApp.className}>
          <div className="app-titlebar">
            <span className="app-glyph is-small"><openApp.Glyph /></span>
            <span className="app-title">{openApp.windowTitle}</span>
            <span className="app-controls">
              <i className="app-control is-minimise" />
              <i className="app-control is-maximise" />
              <button type="button" className="app-control is-close" onClick={closeWindow} aria-label={`Close ${openApp.iconLabel}`}>
                ✕
              </button>
            </span>
          </div>
          {openApp.isInteractive ? (
            <div className="app-content is-interactive">
              <openApp.Content />
            </div>
          ) : (
            <button
              type="button"
              className="app-content"
              onClick={(event) => launchApp(event, openApp.id)}
              aria-label={`Read about ${openApp.iconLabel}`}
            >
              <openApp.Content />
            </button>
          )}
        </div>
      )}

      {/* ---------------- Taskbar ---------------- */}
      <div className="desktop-taskbar">
        <span className="taskbar-start"><StartGlyph /></span>
        <div className="taskbar-apps">
          {APPS.map(({ id, iconLabel, Glyph }) => (
            <button
              key={id}
              type="button"
              className={openAppId === id ? 'taskbar-app is-open' : 'taskbar-app'}
              onClick={(event) => launchApp(event, id)}
              aria-label={`Open ${iconLabel}`}
            >
              <span className="app-glyph is-small"><Glyph /></span>
            </button>
          ))}
        </div>
        <span className="taskbar-hint">{taskbarHint}</span>
        <span className="taskbar-clock">
          <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{now.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </span>
      </div>
    </div>
  );
}
