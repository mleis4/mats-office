/*
 * ============================================================================
 * Program Name:   Selectable.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Wraps any 3D object to make it clickable. Hovering shows a
 *                 gold halo and a label; clicking flies the camera to the
 *                 object and opens its Project Card. On touch screens the
 *                 first tap selects and the second opens.
 *
 * Usage:          <Selectable id="guitar" label="Guitar" position={[x, y, z]}>
 *                   ...meshes...
 *                 </Selectable>
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScene } from '../scene/SceneContext';

const HALO_COLOUR = '#eba706'; // Sunstang gold
const HOVER_SCALE = 1.035;

export default function Selectable({
  id,
  label,
  haloRadius = 0.3,        // 0 hides the halo (used for wall-mounted objects)
  haloHeight = 0.004,
  children,
  ...groupProps
}) {
  const { focusId, hoveredId, setHovered, selectObject } = useScene();
  const innerGroupRef = useRef(null);
  const haloMaterialRef = useRef(null);

  const isHovered = hoveredId === id;
  const isFocused = focusId === id;

  // Pointer cursor while hovering
  useEffect(() => {
    if (!isHovered) return undefined;
    document.body.style.cursor = 'pointer';
    return () => { document.body.style.cursor = 'auto'; };
  }, [isHovered]);

  // Ease the halo and the little "lift" in and out
  useFrame((_, deltaSeconds) => {
    const blend = 1 - Math.exp(-12 * Math.min(deltaSeconds, 0.1));
    if (haloMaterialRef.current) {
      const goalOpacity = isHovered ? 0.75 : isFocused ? 0.4 : 0;
      haloMaterialRef.current.opacity += (goalOpacity - haloMaterialRef.current.opacity) * blend;
    }
    if (innerGroupRef.current) {
      const goalScale = isHovered && !isFocused ? HOVER_SCALE : 1;
      const nextScale = innerGroupRef.current.scale.x + (goalScale - innerGroupRef.current.scale.x) * blend;
      innerGroupRef.current.scale.setScalar(nextScale);
    }
  });

  const handleClick = (event) => {
    event.stopPropagation();
    const isTouch = event.nativeEvent?.pointerType === 'touch';
    if (isTouch && !isHovered) {
      setHovered({ id, label }); // first tap: just show the label
      return;
    }
    selectObject(id);
  };

  return (
    <group
      {...groupProps}
      onClick={handleClick}
      onPointerOver={(event) => { event.stopPropagation(); setHovered({ id, label }); }}
      onPointerOut={() => setHovered(null)}
    >
      <group ref={innerGroupRef}>{children}</group>

      {haloRadius > 0 && (
        <mesh position={[0, haloHeight, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[haloRadius * 0.86, haloRadius, 48]} />
          <meshBasicMaterial ref={haloMaterialRef} color={HALO_COLOUR} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
