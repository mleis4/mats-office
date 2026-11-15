/*
 * ============================================================================
 * Program Name:   Skip2DButton.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The always-visible link that switches between the 3D
 *                 office and the plain 2D portfolio. It is a real link to
 *                 the #2d hash, so it also works without JavaScript events
 *                 and can be bookmarked.
 * ============================================================================
 */

export default function Skip2DButton({ is2D }) {
  return (
    <a className="skip-link" href={is2D ? '#' : '#2d'}>
      {is2D ? 'Enter the 3D office' : 'Skip to 2D'}
    </a>
  );
}
