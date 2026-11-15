/*
 * ============================================================================
 * Program Name:   SceneContext.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    React context that shares the tour state (current station,
 *                 focused object, hovered object) with every 3D object, so
 *                 objects can report hovers and clicks without prop drilling.
 * ============================================================================
 */

import { createContext, useContext } from 'react';

export const SceneContext = createContext(null);

// Convenience hook used by the 3D objects
export function useScene() {
  return useContext(SceneContext);
}
