/*
 * ============================================================================
 * Program Name:   Poster.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The framed Sunstang poster on the hobby-corner wall
 *                 (9:16, the "Emblem" design). It is clickable; the other
 *                 posters in the room are plain FramedPrints.
 *
 * Usage:          <Poster position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} />
 * ============================================================================
 */

import { useTexture } from '@react-three/drei';
import FramedPrint from '../FramedPrint';
import Selectable from '../Selectable';

const POSTER_URL = '/textures/sunstang_poster.jpg';
const POSTER_WIDTH = 0.72;

export default function Poster(groupProps) {
  return (
    <Selectable id="sunstang-poster" label="Sunstang poster" haloRadius={0} {...groupProps}>
      <FramedPrint url={POSTER_URL} width={POSTER_WIDTH} />
    </Selectable>
  );
}

useTexture.preload(POSTER_URL);
