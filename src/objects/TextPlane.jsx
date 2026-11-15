/*
 * ============================================================================
 * Program Name:   TextPlane.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    A flat plane with text drawn on it (nameplates, sticky
 *                 notes, record sleeves, labels on equipment). The text is
 *                 drawn on a canvas texture so no font files are downloaded.
 *
 * Usage:          <TextPlane lines={['Hello']} width={0.4} height={0.1} />
 * ============================================================================
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const PIXELS_PER_METRE = 1400;
const MAX_CANVAS_SIDE = 1024;

export default function TextPlane({
  lines,
  width,
  height,
  colour = '#f4ede0',
  background = null,          // null = transparent
  fontFamily = 'Jost, "Century Gothic", Futura, sans-serif',
  fontWeight = '600',
  fontSizeRatio = 0.5,        // text height as a share of one line's height
  align = 'center',
  lit = false,                // true = reacts to scene lighting
  ...meshProps
}) {
  const textKey = lines.join('\n');

  const texture = useMemo(() => {
    const scale = Math.min(PIXELS_PER_METRE, MAX_CANVAS_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(8, Math.round(width * scale));
    canvas.height = Math.max(8, Math.round(height * scale));

    const context = canvas.getContext('2d');
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const lineHeight = canvas.height / lines.length;
    const padding = canvas.width * 0.06;
    context.fillStyle = colour;
    context.textAlign = align;
    context.textBaseline = 'middle';

    lines.forEach((line, lineIndex) => {
      // Shrink long lines so they always fit the plane
      let fontSize = lineHeight * fontSizeRatio;
      context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const availableWidth = canvas.width - padding * 2;
      const measuredWidth = context.measureText(line).width;
      if (measuredWidth > availableWidth) {
        fontSize *= availableWidth / measuredWidth;
        context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      }
      const textX = align === 'left' ? padding : canvas.width / 2;
      context.fillText(line, textX, lineHeight * (lineIndex + 0.5));
    });

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.anisotropy = 4;
    return canvasTexture;
  }, [textKey, width, height, colour, background, fontFamily, fontWeight, fontSizeRatio, align]);

  // Free GPU memory when the text changes or the plane unmounts
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh {...meshProps}>
      <planeGeometry args={[width, height]} />
      {lit ? (
        <meshStandardMaterial map={texture} transparent={!background} roughness={0.8} />
      ) : (
        <meshBasicMaterial map={texture} transparent={!background} depthWrite={Boolean(background)} toneMapped={false} />
      )}
    </mesh>
  );
}
