/*
 * ============================================================================
 * Program Name:   visitorEmail.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 16, 2026
 * Description:    All the words for the Cold Emailer demo on the monitor: the
 *                 made-up leads its tracker starts with, the "lead" that is
 *                 the visitor, and every message the terminal prints. The
 *                 email itself is written by apps-script/visitor-email.gs,
 *                 which runs on Google's servers so a visitor can't change
 *                 what gets sent. Keep EMAIL_SUBJECT the same in both files.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// The email the visitor receives (subject and attachment name, for the preview)
// ---------------------------------------------------------------------------
export const EMAIL_SUBJECT = 'Thanks for stopping by my office';

// ---------------------------------------------------------------------------
// The tracker's starting rows. Every company and address here is made up
// (README section 15: the real tracker is never shown).
// ---------------------------------------------------------------------------
export const SEED_APPLICATIONS = [
  { company: 'Northwind Robotics', status: 'Interview', email: 'hello@northwind-robotics.example' },
  { company: 'Tidepool Energy', status: 'Applied', email: 'jobs@tidepool-energy.example' },
  { company: 'Lumen Analytics', status: 'Rejected', email: 'team@lumen-analytics.example' },
];

// The next lead in the queue is the visitor. Same fields the real tool prints.
export const VISITOR_LEAD = {
  category: 'Both EE & AISE',
  company: 'You',
  industries: "['Visiting portfolios']",
  employees: '1',
  turnoverChange: 'n/a',
  isUnicorn: 'True',
};

export const STATUS_OPTIONS = ['Applied', 'Interview', 'Rejected', 'Accepted'];

// ---------------------------------------------------------------------------
// Terminal messages
// ---------------------------------------------------------------------------
export const TERMINAL_COPY = {
  intro: 'This is my job applicator, running in your browser. Type a number and press Enter.',
  visitorLeadHint: "(This lead is you. Type your own email and I'll send you a thank-you note with my resume attached.)",
  privacyNote: "Your address is used to send this one email. It isn't added to any list.",
  invalidEmail: "❌ That doesn't look like an email address. Try again, or press Enter to cancel.",
  sending: 'Connecting to smtp.gmail.com…',
  sent: 'Email sent successfully!',
  sentHint: 'Check your inbox (and the spam folder, it is a cold email after all).',
  cancelled: '❌ Cancelled. Nothing was sent.',
  resumeLinkLabel: 'Download my resume instead',
  errors: {
    'not-configured': "Error: this copy of the site isn't connected to a mail server yet, so nothing was sent.",
    'already-sent': 'Error: that address was already sent this email today.',
    'daily-limit': "Error: today's email limit has been reached. Try again tomorrow.",
    invalid: "Error: the mail server didn't accept that address.",
    failed: "Error: couldn't reach the mail server, so nothing was sent.",
  },
};
