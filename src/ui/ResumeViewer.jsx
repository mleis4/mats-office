/*
 * ============================================================================
 * Program Name:   ResumeViewer.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    The resume, taken out of the holder on the door: the page
 *                 shown large, with my business card paperclipped to its top
 *                 corner (email, LinkedIn, phone) and a "Take one" button
 *                 that downloads the PDF. Closes with Esc, the ✕ button or a
 *                 click outside the page.
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { CONTACT } from '../data/catalog';

const linkedinLabel = CONTACT.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const phoneHref = `tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`;

export default function ResumeViewer({ onClose }) {
  const closeButtonRef = useRef(null);

  // Esc closes the viewer; keyboard focus starts on the close button
  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const keepOpen = (event) => event.stopPropagation();

  return (
    <div className="resume-viewer" role="dialog" aria-modal="true" aria-label="Resume" onClick={onClose}>
      <div className="resume-scroll">
        <div className="resume-page" onClick={keepOpen}>
          <img
            className="resume-image"
            src={CONTACT.resumePreviewUrl}
            alt={`${CONTACT.name}'s resume. Use the Take one button to download it as a PDF.`}
          />

          {/* ---------------- Business card, paperclipped to the corner ---------------- */}
          <address className="business-card">
            <svg className="business-card-clip" viewBox="0 0 24 60" aria-hidden="true">
              <path d="M7 16 V44 a5 5 0 0 0 10 0 V12 a8 8 0 0 0 -16 0 V46 a11 11 0 0 0 22 0 V18" />
            </svg>
            <span className="business-card-name">{CONTACT.name}</span>
            <span className="business-card-tagline">{CONTACT.tagline}</span>
            <dl className="business-card-rows">
              <div><dt>Email</dt><dd><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></dd></div>
              <div><dt>LinkedIn</dt><dd><a href={CONTACT.linkedin} target="_blank" rel="noreferrer">{linkedinLabel}</a></dd></div>
              <div><dt>Phone</dt><dd><a href={phoneHref}>{CONTACT.phone}</a></dd></div>
            </dl>
          </address>
        </div>
      </div>

      {/* ---------------- Take one ---------------- */}
      <div className="resume-actions" onClick={keepOpen}>
        <span>Want a copy?</span>
        <a className="primary-button" href={CONTACT.resumeUrl} download={CONTACT.resumeFileName}>Take one</a>
        <button ref={closeButtonRef} type="button" className="icon-button resume-close" onClick={onClose} aria-label="Put the resume back">✕</button>
      </div>
    </div>
  );
}
