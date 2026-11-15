/*
 * ============================================================================
 * Program Name:   ModelProp.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Drops a downloaded .glb into the scene at a chosen size.
 *                 The model is measured first, so it doesn't matter what
 *                 units it was exported in: you say how tall (or wide, or
 *                 deep) it should be in the scene and it is scaled to fit,
 *                 sitting on the surface at its position.
 *
 * Usage:          <ModelProp url="/models/trophy.glb" height={0.3} position={[x, y, z]} />
 *                 Give exactly one of height, width, depth or longest
 *                 (longest = the size of the model's longest side).
 *                 modelRotation turns the model before it is measured.
 * ============================================================================
 */

import useFittedModel from './useFittedModel';

export default function ModelProp({ url, height, width, depth, longest, modelRotation, layFlat = false, ...groupProps }) {
  const model = useFittedModel(url, { rotation: modelRotation, layFlat });

  // Scale from whichever target size was given
  let modelScale = 1;
  if (longest) modelScale = longest / Math.max(model.size.x, model.size.y, model.size.z);
  else if (height) modelScale = height / model.size.y;
  else if (width) modelScale = width / model.size.x;
  else if (depth) modelScale = depth / model.size.z;

  return (
    <group {...groupProps}>
      <primitive object={model.object} scale={modelScale} />
    </group>
  );
}
