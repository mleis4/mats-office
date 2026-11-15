/*
 * ============================================================================
 * Program Name:   Workbench.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Places everything on the workbench: the four hardware
 *                 projects (RoboCup robot, FSM detector, Sunstang board,
 *                 GlobalReader boards) plus the lab equipment that sets the
 *                 scene. The oscilloscope, soldering station and desk lamp
 *                 are downloaded models, as are the trophy and flaglet that
 *                 sit beside the robot. The mat, bench supply, JLCPCB box and
 *                 the tool pegboard on the wall are built in code.
 * ============================================================================
 */

import { useGLTF } from '@react-three/drei';
import FsmDetector from '../objects/bench/FsmDetector';
import GlobalReaderBoards from '../objects/bench/GlobalReaderBoards';
import SpikeRobot from '../objects/bench/SpikeRobot';
import SunstangBoard from '../objects/bench/SunstangBoard';
import ToolPegboard from '../objects/bench/ToolPegboard';
import ModelProp from '../objects/ModelProp';
import Selectable from '../objects/Selectable';
import TextPlane from '../objects/TextPlane';
import { useScene } from '../scene/SceneContext';
import {
  BACK_WALL_Z, BENCH, BENCH_MAT_THICKNESS, BENCH_TOP_Y, OBJECTS, PEGBOARD_STANDOFF, SHELF, SHELF_TOP_Y, TOOL_PEGBOARD,
} from '../scene/stations';

const OSCILLOSCOPE_URL = '/models/laboratory_oscilloscope_20mhz.glb';
const SOLDERING_STATION_URL = '/models/soldering_iron_station.glb';
const DESK_LAMP_URL = '/models/desk_lamp_low_poly.glb';
const TROPHY_URL = '/models/trophy.glb';
const FLAGLET_URL = '/models/flaglet.glb';

const OSCILLOSCOPE_LEVELLING = [-(2*Math.PI)/45+0.12, 0, 0]; // radians; undoes the model's 8 degree tilt

const EQUIPMENT_CREAM = '#e6e2d8';
const MAT_BLUE = '#3e8edb';
const MONO_FONT = 'ui-monospace, Menlo, Consolas, monospace';

// ---------------------------------------------------------------------------
// Bench power supply with a red seven-segment style readout
// ---------------------------------------------------------------------------
function BenchSupply(groupProps) {
  return (
    <group {...groupProps}>
      <mesh position={[0, 0.11, 0]} castShadow>
        <boxGeometry args={[0.3, 0.22, 0.2]} />
        <meshStandardMaterial color={EQUIPMENT_CREAM} roughness={0.6} />
      </mesh>
      <TextPlane
        lines={['12.00 V', '0.42 A']}
        width={0.17}
        height={0.1}
        colour="#ff5a36"
        background="#1a0d0a"
        fontFamily={MONO_FONT}
        fontSizeRatio={0.62}
        position={[-0.04, 0.14, 0.101]}
      />
      <mesh position={[0.1, 0.16, 0.108]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.02, 20]} />
        <meshStandardMaterial color="#8d8a82" roughness={0.5} />
      </mesh>
      <mesh position={[0.08, 0.05, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
        <meshStandardMaterial color="#c5402f" roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.05, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// The blue box the boards arrived in
// ---------------------------------------------------------------------------
function JlcpcbBox(groupProps) {
  return (
    <group {...groupProps}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.34, 0.1, 0.24]} />
        <meshStandardMaterial color="#1f5fd0" roughness={0.7} />
      </mesh>
      <TextPlane
        lines={['JLCPCB']}
        width={0.26}
        height={0.07}
        colour="#ffffff"
        fontSizeRatio={0.8}
        position={[0, 0.1006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Workbench
// ---------------------------------------------------------------------------
export default function Workbench() {
  const { focusId } = useScene();
  const robotPosition = OBJECTS['robocup-robot'].position;

  return (
    <group>
      {/* ---------------- Scene dressing ---------------- */}
      {/* Silicone soldering mat */}
      <mesh position={[0.34, BENCH_TOP_Y + BENCH_MAT_THICKNESS / 2, BENCH.z + 0.09]} receiveShadow>
        <boxGeometry args={[1.5, BENCH_MAT_THICKNESS, 0.62]} />
        <meshStandardMaterial color={MAT_BLUE} roughness={0.9} />
      </mesh>

      <ModelProp url={DESK_LAMP_URL} height={0.62} position={[-1.0, BENCH_TOP_Y, BENCH.z - 0.27]} />
      <JlcpcbBox position={[-0.7, BENCH_TOP_Y, BENCH.z - 0.29]} rotation={[0, 0.25, 0]} />
      {/* The station stands on the bench behind the mat's corner; only its iron and lead reach onto the mat */}
      <ModelProp url={SOLDERING_STATION_URL} longest={0.45} position={[0.88, BENCH_TOP_Y, BENCH.z - 0.27]} />

      {/* Tool pegboard on the wall, between the bench and the shelf */}
      <ToolPegboard width={TOOL_PEGBOARD.width} height={TOOL_PEGBOARD.height} position={[0, TOOL_PEGBOARD.y, BACK_WALL_Z + PEGBOARD_STANDOFF]} />

      {/* Test equipment on the wall shelf */}
      {/* The scope model is tipped back on its stand; levelling it lets it sit flat on the shelf */}
      <ModelProp url={OSCILLOSCOPE_URL} depth={SHELF.depth} modelRotation={OSCILLOSCOPE_LEVELLING} position={[0.38, SHELF_TOP_Y-0.05, SHELF.z]} />
      <BenchSupply position={[0.86, SHELF_TOP_Y, SHELF.z]} />

      {/* Trophy and flaglet from RoboCup, beside the robot. The trophy stands at
          the back of the shelf and the flaglet at the front, so they don't touch. */}
      <ModelProp url={TROPHY_URL} height={0.3} position={[robotPosition[0] + 0.28, SHELF_TOP_Y, SHELF.z - 0.05]} />
      <ModelProp url={FLAGLET_URL} height={0.28} position={[robotPosition[0] - 0.24, SHELF_TOP_Y, SHELF.z ]} rotation={[0,Math.PI/4,0  ]} />

      {/* ---------------- The projects ---------------- */}
      <SpikeRobot position={robotPosition} rotation={[0,Math.PI/2,0]} />
      <GlobalReaderBoards position={OBJECTS.globalreader.position} rotation={[0, 0.35, 0]} />
      <SunstangBoard position={OBJECTS['sunstang-board'].position} rotation={[0, -0.18, 0]} />

      <Selectable id="fsm-detector" label="Moore FSM detector" haloRadius={0.44} position={OBJECTS['fsm-detector'].position}>
        {/* The panel floats to the left of the board so it never covers the LEDs */}
        <FsmDetector scale={0.55} showPanel={focusId === 'fsm-detector'} panelPosition={[-1.02, 0.42, 0.05]} />
      </Selectable>
    </group>
  );
}

[OSCILLOSCOPE_URL, SOLDERING_STATION_URL, DESK_LAMP_URL, TROPHY_URL, FLAGLET_URL].forEach((url) => useGLTF.preload(url));
