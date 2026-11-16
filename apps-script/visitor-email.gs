/*
 * ============================================================================
 * Program Name:   visitor-email.gs
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 16, 2026
 * Description:    The mail server behind the Cold Emailer demo on my site's
 *                 monitor. A visitor types their email into the terminal; the
 *                 site posts it here; this script sends them a thank-you note
 *                 from my Gmail with my resume attached. It is the web version
 *                 of EmailSender.py in the SuperAngel500 Job Applicator.
 *
 *                 It runs on Google's servers (Google Apps Script), not in the
 *                 browser, so the wording, the attachment and the limits can't
 *                 be changed by a visitor. The only thing it accepts is one
 *                 email address.
 *
 * Setup (once):   1. Go to https://script.google.com, make a new project and
 *                    paste this file in.
 *                 2. Deploy > New deployment > Web app. Execute as: Me.
 *                    Who has access: Anyone. Approve the Gmail permission.
 *                 3. Copy the web app URL (it ends in /exec) into .env.local:
 *                      VITE_VISITOR_EMAIL_URL=<that URL>
 *                    and add the same value as a GitHub Actions secret for
 *                    the deploy build.
 *                 After editing this file, deploy a new version (Deploy >
 *                 Manage deployments > edit > New version) or the old code
 *                 keeps running.
 * ============================================================================
 */

// ---- Settings ----
const SITE_URL = 'https://leismbedded.ca';
const RESUME_URL = SITE_URL + '/textures/Resume.pdf';
const RESUME_FILE_NAME = 'Mats-Leis-Resume.pdf';
const SENDER_NAME = 'Mats Leis';

const DAILY_SEND_LIMIT = 25;          // most emails this script will send in one day
const REPEAT_BLOCK_SECONDS = 21600;   // one email per address per 6 hours (the cache's longest lifetime)
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---- The email. Keep EMAIL_SUBJECT the same as in src/data/visitorEmail.js ----
const EMAIL_SUBJECT = 'Thanks for stopping by my office';
const EMAIL_BODY = [
  'Hi,',
  '',
  'Thanks for visiting my office at leismbedded.ca. You just ran the web version of my SuperAngel500 Job Applicator, the tool I wrote to send personalized emails to Estonian startups. This time the lead was you.',
  '',
  "My resume is attached. I'm an Electrical & AI Systems Engineering student at Western University. I design PCBs and embedded systems, and I build machine-learning tools in Python.",
  '',
  "If you'd like to talk about a role, a project or anything you saw on the site, just reply to this email.",
  '',
  'Thanks again for stopping by,',
  'Mats Leis',
  'https://www.linkedin.com/in/mats-leis-4b9911271/',
  '',
  '--',
  'You are getting this because this address was typed into the Cold Emailer demo on leismbedded.ca. It is a one-time email and you have not been added to any list.',
].join('\n');

// ---------------------------------------------------------------------------
// doPost: runs once for every request from the site
// ---------------------------------------------------------------------------
function doPost(event) {
  let emailAddress = '';
  try {
    emailAddress = String(JSON.parse(event.postData.contents).email || '').trim().toLowerCase();
  } catch (parseError) {
    return jsonReply({ ok: false, reason: 'invalid' });
  }

  if (emailAddress.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(emailAddress)) {
    return jsonReply({ ok: false, reason: 'invalid' });
  }

  // One request at a time, so two visitors can't both slip under the daily limit
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    // ---- Limit 1: one email per address every few hours ----
    const cache = CacheService.getScriptCache();
    const repeatKey = 'sent-' + hashText(emailAddress); // a hash, so the address itself isn't stored
    if (cache.get(repeatKey)) return jsonReply({ ok: false, reason: 'already-sent' });

    // ---- Limit 2: a daily cap, well under Gmail's own quota ----
    const properties = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), 'Etc/UTC', 'yyyy-MM-dd');
    const sentToday = properties.getProperty('countDate') === today ? Number(properties.getProperty('count')) : 0;
    if (sentToday >= DAILY_SEND_LIMIT || MailApp.getRemainingDailyQuota() < 1) {
      return jsonReply({ ok: false, reason: 'daily-limit' });
    }

    // ---- Send ----
    const resume = UrlFetchApp.fetch(RESUME_URL).getBlob().setName(RESUME_FILE_NAME);
    MailApp.sendEmail({
      to: emailAddress,
      subject: EMAIL_SUBJECT,
      body: EMAIL_BODY,
      name: SENDER_NAME,
      attachments: [resume],
    });

    properties.setProperties({ countDate: today, count: String(sentToday + 1) });
    cache.put(repeatKey, '1', REPEAT_BLOCK_SECONDS);
    return jsonReply({ ok: true });
  } catch (sendError) {
    return jsonReply({ ok: false, reason: 'failed' });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jsonReply(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function hashText(text) {
  const digestBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  return Utilities.base64EncodeWebSafe(digestBytes);
}
