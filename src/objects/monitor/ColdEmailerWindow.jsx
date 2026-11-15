/*
 * ============================================================================
 * Program Name:   ColdEmailerWindow.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The Cold Emailer's app window on the fake desktop: a mail
 *                 client where drafts type themselves out and send. Every
 *                 recipient and company here is made up. The real template
 *                 and tracker are never shown.
 * ============================================================================
 */

import { useEffect, useState } from 'react';

const TYPING_INTERVAL_MS = 28;
const PAUSE_AFTER_SEND_MS = 1600;

// Made-up leads, in the shape the real tool works with
const FAKE_DRAFTS = [
  {
    recipient: 'hello@northwind-robotics.example',
    company: 'Northwind Robotics',
    list: 'EE + AISE',
    body: 'Hi Northwind Robotics team, I am an Electrical and AI Systems Engineering student looking for a summer internship. Your work in robotics caught my eye. My resume is attached.',
  },
  {
    recipient: 'jobs@tidepool-energy.example',
    company: 'Tidepool Energy',
    list: 'EE',
    body: 'Hi Tidepool Energy team, I design PCBs and embedded systems, and I would love to help with your hardware this summer. My resume is attached.',
  },
  {
    recipient: 'team@lumen-analytics.example',
    company: 'Lumen Analytics',
    list: 'AISE',
    body: 'Hi Lumen Analytics team, I build machine-learning tools in Python and would like to intern with you this summer. My resume is attached.',
  },
];

export default function ColdEmailerWindow() {
  const [draftIndex, setDraftIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  const draft = FAKE_DRAFTS[draftIndex];
  const isSent = typedLength >= draft.body.length;

  // Type one character at a time, pause on "Sent", then start the next draft
  useEffect(() => {
    if (!isSent) {
      const typingTimer = setTimeout(() => setTypedLength((length) => length + 1), TYPING_INTERVAL_MS);
      return () => clearTimeout(typingTimer);
    }
    const nextDraftTimer = setTimeout(() => {
      setSentCount((count) => count + 1);
      setDraftIndex((index) => (index + 1) % FAKE_DRAFTS.length);
      setTypedLength(0);
    }, PAUSE_AFTER_SEND_MS);
    return () => clearTimeout(nextDraftTimer);
  }, [isSent, typedLength]);

  return (
    <div className="mail">
      <div className="mail-sidebar">
        <div className="mail-sidebar-title">Lead lists</div>
        <div className={draft.list === 'EE + AISE' ? 'mail-list is-active' : 'mail-list'}>Both (first)</div>
        <div className={draft.list === 'EE' ? 'mail-list is-active' : 'mail-list'}>EE</div>
        <div className={draft.list === 'AISE' ? 'mail-list is-active' : 'mail-list'}>AISE</div>
        <div className="mail-sent">Sent this demo: {sentCount}</div>
      </div>

      <div className="mail-draft">
        <div className="mail-field"><span>To</span>{draft.recipient}</div>
        <div className="mail-field"><span>Subject</span>Summer internship: {draft.company}</div>
        <p className="mail-body">
          {draft.body.slice(0, typedLength)}
          {!isSent && <span className="mail-caret" />}
        </p>
        <div className="mail-footer">
          <span className="mail-attachment">resume.pdf</span>
          <span className={isSent ? 'mail-status is-sent' : 'mail-status'}>{isSent ? 'Sent' : 'Drafting…'}</span>
        </div>
      </div>
    </div>
  );
}
