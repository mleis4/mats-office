/*
 * ============================================================================
 * Program Name:   SpikeRobot.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The RoboCup Jr. rescue robot, sitting on the shelf above
 *                 the workbench with a small "where it started" tag. The
 *                 model is exported in millimetres, so it is measured and
 *                 scaled to a fixed scene size.
 *
 * Usage:          <SpikeRobot position={[x, y, z]} />
 * ============================================================================
 */

import { useGLTF } from '@react-three/drei';
import Selectable from '../Selectable';
import TextPlane from '../TextPlane';
import useFittedModel from '../useFittedModel';

const ROBOT_URL = '/models/robocup_robot.glb';
const ROBOT_SCENE_SIZE = 0.42; // longest horizontal side, in scene units

export default function SpikeRobot(groupProps) {
  const robot = useFittedModel(ROBOT_URL);
  const modelScale = ROBOT_SCENE_SIZE / Math.max(robot.size.x, robot.size.z);

  return (
    <Selectable id="robocup-robot" label="RoboCup Jr. robot" haloRadius={0.3} {...groupProps}>
      <primitive object={robot.object} scale={modelScale} />

      {/* Paper tag leaning against the shelf edge */}
      <TextPlane
        lines={['where it started']}
        width={0.3}
        height={0.06}
        colour="#1a1814"
        background="#f4ede0"
        fontFamily="ui-monospace, Menlo, Consolas, monospace"
        fontWeight="500"
        fontSizeRatio={0.5}
        position={[0.36, 0.035, 0.1]}
        rotation={[-0.2, 0, 0]}
      />
    </Selectable>
  );
}

useGLTF.preload(ROBOT_URL);
