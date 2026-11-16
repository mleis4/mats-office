/*
 * ============================================================================
 * Program Name:   sendVisitorEmail.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 16, 2026
 * Description:    Asks my mail script (apps-script/visitor-email.gs, a Google
 *                 Apps Script web app) to send the thank-you email and resume
 *                 to one address. The browser only sends the address; the
 *                 script decides the wording, attaches the resume and enforces
 *                 the limits.
 *
 *                 Setup: add the web app's URL to .env.local as
 *                   VITE_VISITOR_EMAIL_URL=https://script.google.com/macros/s/.../exec
 *                 Without it, nothing is sent and the terminal says so.
 * ============================================================================
 */

const MAIL_SCRIPT_URL = import.meta.env.VITE_VISITOR_EMAIL_URL;

// A light check before asking the server, which checks again
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

export const looksLikeEmail = (text) => text.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(text);

// ---------------------------------------------------------------------------
// sendVisitorEmail: resolves to { isSent: true } or { isSent: false, reason },
// where reason is a key of TERMINAL_COPY.errors. It never throws.
// ---------------------------------------------------------------------------
export async function sendVisitorEmail(emailAddress) {
  if (!MAIL_SCRIPT_URL) return { isSent: false, reason: 'not-configured' };

  try {
    // text/plain keeps this a "simple" request, which Apps Script needs:
    // it can't answer the preflight check a JSON content type would trigger
    const response = await fetch(MAIL_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ email: emailAddress }),
    });
    const result = await response.json();
    return result.ok ? { isSent: true } : { isSent: false, reason: result.reason ?? 'failed' };
  } catch {
    return { isSent: false, reason: 'failed' };
  }
}
