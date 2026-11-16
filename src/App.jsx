/*
 * ============================================================================
 * Program Name:   App.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The app shell. It owns the tour state (which station the
 *                 camera is at, which object is open), renders the 3D canvas
 *                 with the overlay UI on top, and switches to the 2D page
 *                 when the URL hash is #2d or WebGL is unavailable.
 * ============================================================================
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { CONTACT, ITEMS_BY_ID } from './data/catalog';
import records from './data/records.json';
import useNowPlaying from './hooks/useNowPlaying';
import Projects2D from './pages/Projects2D';
import CameraRig from './scene/CameraRig';
import Hallway from './scene/Hallway';
import Lighting from './scene/Lighting';
import Office from './scene/Office';
import { SceneContext } from './scene/SceneContext';
import { OBJECTS, STATIONS, STATION_ORDER } from './scene/stations';
import Door from './stations/Door';
import HobbyCorner from './stations/HobbyCorner';
import Monitor from './stations/Monitor';
import Workbench from './stations/Workbench';
import ProjectCard from './ui/ProjectCard';
import ResumeViewer from './ui/ResumeViewer';
import Skip2DButton from './ui/Skip2DButton';
import StationNav from './ui/StationNav';

const BACKGROUND_COLOUR = '#1a1814'; // warm black
const SWIPE_MIN_DISTANCE_PX = 60;
const RECORD_STEP_INTERVAL_MS = 110; // one record per scroll notch, not per pixel

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function detectWebGL() {
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const isTypingTarget = (element) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName);
const isControl = (element) => Boolean(element?.closest?.('button, a'));

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const canUse3D = useMemo(detectWebGL, []);
  const isSmallScreen = useMemo(
    () => window.matchMedia('(max-width: 720px), (pointer: coarse)').matches,
    [],
  );

  const [is2D, setIs2D] = useState(() => window.location.hash === '#2d');
  const [hasEntered, setHasEntered] = useState(false);
  const [station, setStation] = useState('door');
  const [focusId, setFocusId] = useState(null);
  const [hovered, setHovered] = useState(null); // { id, label } | null
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(null); // album lifted out of the crate
  const [browseRecordIndex, setBrowseRecordIndex] = useState(null);     // album raised while browsing
  const [isResumeOpen, setIsResumeOpen] = useState(false);               // resume taken out of the door holder
  const lastRecordStepRef = useRef(0);

  const nowPlaying = useNowPlaying();
  const { active: isLoading, progress: loadProgress } = useProgress();
  const touchStartRef = useRef(null);

  const show2D = is2D || !canUse3D;
  const focusedItem = focusId ? ITEMS_BY_ID[focusId] : null;

  // ---------------- Tour actions ----------------
  const enterOffice = useCallback(() => {
    setHasEntered(true);
    setStation('bench');
  }, []);

  const selectObject = useCallback((objectId) => {
    setFocusId(objectId);
    setStation(OBJECTS[objectId].station);
    setHovered(null);
    setSelectedRecordIndex(null);
    setBrowseRecordIndex(objectId === 'records' ? 0 : null); // start with the front record raised
  }, []);

  const openResume = useCallback(() => {
    setIsResumeOpen(true);
    setHovered(null);
  }, []);
  const closeResume = useCallback(() => setIsResumeOpen(false), []);

  const closeFocus = useCallback(() => {
    setFocusId(null);
    setSelectedRecordIndex(null);
    setBrowseRecordIndex(null);
  }, []);

  // Browsing the crate: raise the next or previous record
  const isBrowsingRecords = focusId === 'records' && selectedRecordIndex === null;
  const stepRecord = useCallback((direction) => {
    setBrowseRecordIndex((currentIndex) => {
      if (currentIndex === null) return 0;
      return Math.min(Math.max(currentIndex + direction, 0), records.length - 1);
    });
  }, []);

  const goToStation = useCallback((stationId) => {
    closeFocus();
    setStation(stationId);
  }, [closeFocus]);

  const stepStation = useCallback((direction) => {
    setStation((currentStation) => {
      const currentIndex = STATION_ORDER.indexOf(currentStation);
      const nextIndex = Math.min(Math.max(currentIndex + direction, 0), STATION_ORDER.length - 1);
      return STATION_ORDER[nextIndex];
    });
    closeFocus();
  }, [closeFocus]);

  // ---------------- 2D view follows the URL hash ----------------
  useEffect(() => {
    const syncWithHash = () => setIs2D(window.location.hash === '#2d');
    window.addEventListener('hashchange', syncWithHash);
    return () => window.removeEventListener('hashchange', syncWithHash);
  }, []);

  // ---------------- Keyboard and scroll ----------------
  useEffect(() => {
    // The resume viewer handles its own keys and scrolls on its own
    if (show2D || isResumeOpen) return undefined;

    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;

      if (event.key === 'Escape') {
        closeFocus();
      } else if (!hasEntered && (event.key === 'Enter' || event.key === ' ') && !isControl(event.target)) {
        event.preventDefault();
        enterOffice();
      } else if (hasEntered && event.key === 'ArrowLeft') {
        stepStation(-1);
      } else if (hasEntered && event.key === 'ArrowRight') {
        stepStation(1);
      } else if (isBrowsingRecords && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        stepRecord(event.key === 'ArrowDown' ? 1 : -1);
      } else if (isBrowsingRecords && event.key === 'Enter' && !isControl(event.target) && browseRecordIndex !== null) {
        setSelectedRecordIndex(browseRecordIndex);
      }
    };

    const handleWheel = (event) => {
      if (!hasEntered) {
        enterOffice();
        return;
      }
      // While browsing the crate, the wheel flips through records anywhere
      // on the page, including over the list in the card
      if (!isBrowsingRecords) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastRecordStepRef.current < RECORD_STEP_INTERVAL_MS || event.deltaY === 0) return;
      lastRecordStepRef.current = now;
      stepRecord(event.deltaY > 0 ? 1 : -1);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [show2D, isResumeOpen, hasEntered, closeFocus, enterOffice, stepStation, stepRecord, isBrowsingRecords, browseRecordIndex]);

  // ---------------- Swipe between stations on touch screens ----------------
  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !hasEntered || focusId) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_MIN_DISTANCE_PX && Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
    if (isHorizontalSwipe) stepStation(deltaX < 0 ? 1 : -1);
  };

  // Shared with every 3D object. Created inside the Canvas tree below,
  // because React context doesn't cross into the canvas on its own.
  const sceneState = useMemo(() => ({
    station,
    focusId,
    hoveredId: hovered?.id ?? null,
    setHovered,
    selectObject,
    nowPlaying,
    selectedRecordIndex,
    setSelectedRecordIndex,
    browseRecordIndex,
    setBrowseRecordIndex,
  }), [station, focusId, hovered, selectObject, nowPlaying, selectedRecordIndex, browseRecordIndex]);

  // ---------------- 2D page ----------------
  if (show2D) {
    return <Projects2D canUse3D={canUse3D} nowPlaying={nowPlaying} />;
  }

  // ---------------- 3D office ----------------
  return (
    <div className="office" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <Canvas
        shadows={!isSmallScreen}
        dpr={[1, isSmallScreen ? 1.5 : 2]}
        camera={{ fov: 50, near: 0.05, far: 60, position: STATIONS.door.position }}
        onPointerMissed={() => { if (focusId) closeFocus(); }}
      >
        <color attach="background" args={[BACKGROUND_COLOUR]} />
        <SceneContext.Provider value={sceneState}>
          <CameraRig station={station} focusId={focusId} usePickedPose={selectedRecordIndex !== null} />
          <Lighting enableShadows={!isSmallScreen} />

          {/* The door shows first; the room loads behind it */}
          <Suspense fallback={null}>
            <Door isOpen={hasEntered} onEnter={enterOffice} onOpenResume={openResume} />
            <Hallway />
          </Suspense>
          <Suspense fallback={null}>
            <Office />
            <Workbench />
            <Monitor />
            <HobbyCorner />
          </Suspense>
        </SceneContext.Provider>
      </Canvas>

      {/* ---------------- Overlay UI ---------------- */}
      <div className="overlay">
        <header className="overlay-top">
          {hasEntered ? (
            <div className="brand">
              <span className="brand-name">{CONTACT.name}</span>
              <span className="brand-tagline">{CONTACT.tagline}</span>
            </div>
          ) : <span />}
          <Skip2DButton is2D={false} />
        </header>

        {!hasEntered && (
          <div className="door-hint">
            <button type="button" className="primary-button" onClick={enterOffice}>Open the door</button>
            <span>{isLoading ? `Setting up the workshop… ${Math.round(loadProgress)}%` : 'or click the handle, press Enter, or scroll · my resume is in the holder'}</span>
          </div>
        )}

        {hovered && !focusId && !isResumeOpen && (
          <div className="hover-label" role="status">{hovered.label} · click to open</div>
        )}

        {hasEntered && (
          <footer className={focusId ? 'overlay-bottom has-card' : 'overlay-bottom'}>
            <nav className="contact-links" aria-label="Contact">
              <a href={`mailto:${CONTACT.email}`}>Email</a>
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={CONTACT.github} target="_blank" rel="noreferrer">GitHub</a>
              <a href={CONTACT.resumeUrl} onClick={(event) => { event.preventDefault(); openResume(); }}>Resume</a>
            </nav>
            <StationNav station={station} onGoTo={goToStation} onStep={stepStation} />
            <span className="overlay-spacer" />
          </footer>
        )}

        {focusedItem && (
          <ProjectCard
            item={focusedItem}
            onClose={closeFocus}
            nowPlaying={nowPlaying}
            selectedRecordIndex={selectedRecordIndex}
            onSelectRecord={setSelectedRecordIndex}
            browseRecordIndex={browseRecordIndex}
            onBrowseRecord={setBrowseRecordIndex}
          />
        )}

        {isResumeOpen && <ResumeViewer onClose={closeResume} />}
      </div>
    </div>
  );
}
