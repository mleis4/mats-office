/*
 * ============================================================================
 * Program Name:   Projects2D.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The plain 2D portfolio: every project and hobby on one
 *                 fast page, rendered from the same JSON as the 3D office.
 *                 It is the "skip" option for people in a hurry and the
 *                 fallback when WebGL is not available.
 * ============================================================================
 */

import { useState } from 'react';
import { CONTACT, SECTIONS } from '../data/catalog';
import { ItemDetails, Lightbox } from '../ui/ProjectCard';
import Skip2DButton from '../ui/Skip2DButton';

export default function Projects2D({ canUse3D, nowPlaying }) {
  const [enlargedImage, setEnlargedImage] = useState(null);

  return (
    <div className="page-2d">
      <header className="page-header">
        <img className="page-headshot" src="/images/headshot-web.jpg" alt="Mats Leis" />
        <div>
          <h1>{CONTACT.name}</h1>
          <p>{CONTACT.tagline}</p>
          <nav className="page-contact" aria-label="Contact">
            <a href={`mailto:${CONTACT.email}`}>Email</a>
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={CONTACT.github} target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </div>
        {canUse3D && <Skip2DButton is2D />}
      </header>

      {!canUse3D && (
        <p className="page-notice">Your browser can't show the 3D office, so here is everything on one page.</p>
      )}

      <main>
        {SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`section-${section.id}`}>
            <h2 id={`section-${section.id}`}>
              {section.title}
              <span>{section.subtitle}</span>
            </h2>
            <div className="page-grid">
              {section.items.map((item) => (
                <article key={item.id} className="page-card">
                  <h3>{item.name}</h3>
                  <ItemDetails item={item} onOpenImage={setEnlargedImage} nowPlaying={nowPlaying} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      <Lightbox imageUrl={enlargedImage} onClose={() => setEnlargedImage(null)} />
    </div>
  );
}
