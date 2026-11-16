/*
 * ============================================================================
 * Program Name:   ColdEmailerWindow.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 16, 2026
 * Description:    The Cold Emailer's app window on the fake desktop: a working
 *                 copy of my SuperAngel500 Job Applicator's command-line menu
 *                 (main.py), rebuilt for the browser. The visitor types the
 *                 same numbers I did. "Apply to next company" makes them the
 *                 lead: they type their own email and the site sends them a
 *                 thank-you note with my resume attached. The tracker's other
 *                 rows are made up, and the real template and tracker are
 *                 never shown.
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import { CONTACT } from '../../data/catalog';
import {
  EMAIL_SUBJECT, SEED_APPLICATIONS, STATUS_OPTIONS, TERMINAL_COPY, VISITOR_LEAD,
} from '../../data/visitorEmail';
import { looksLikeEmail, sendVisitorEmail } from './sendVisitorEmail';

const MENU_WIDTH = 50;   // the banner widths main.py prints
const LEAD_WIDTH = 60;

// What the terminal is waiting for, and the prompt it shows while waiting
const PROMPTS = {
  menu: 'Select an option (1-4): ',
  email: 'Email: ',
  confirm: 'Send it? (y/n): ',
  pickCompany: 'Enter company name or number: ',
  pickStatus: 'Select new status (1-4): ',
  exited: 'Press Enter to run main.py again: ',
  sending: null, // no typing while the email is on its way
};

// ---------------------------------------------------------------------------
// Text helpers, matching what main.py prints
// ---------------------------------------------------------------------------
const centred = (text, width) => ' '.repeat(Math.max(0, Math.floor((width - text.length) / 2))) + text;

const banner = (title, width) => ['='.repeat(width), centred(title, width), '='.repeat(width)];

const MENU_LINES = [
  '',
  ...banner('JOB APPLICATION TRACKER', MENU_WIDTH),
  '',
  '1. Apply to next company',
  '2. Update application status',
  '3. View statistics',
  '4. Exit',
  '',
];

const STARTING_LINES = [{ text: '$ python main.py', tone: 'typed' }, { text: TERMINAL_COPY.intro, tone: 'dim' }, ...MENU_LINES];

// A line is either a plain string or { text, tone, href }; give each a stable key
let nextLineId = 0;
const toLine = (line) => ({ id: nextLineId++, ...(typeof line === 'string' ? { text: line } : line) });

export default function ColdEmailerWindow() {
  const [lines, setLines] = useState(() => STARTING_LINES.map(toLine));
  const [mode, setMode] = useState('menu');
  const [typedText, setTypedText] = useState('');
  const [applications, setApplications] = useState(SEED_APPLICATIONS);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pickedCompanyIndex, setPickedCompanyIndex] = useState(null);

  const logRef = useRef(null);
  const inputRef = useRef(null);
  const isMountedRef = useRef(true);

  const prompt = PROMPTS[mode];
  const hasVisitorApplied = applications.some((application) => application.isVisitor);

  const print = (...newLines) => setLines((currentLines) => [...currentLines, ...newLines.map(toLine)]);
  const backToMenu = () => { print(...MENU_LINES); setMode('menu'); };

  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Keep the newest line in view and the cursor in the prompt
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    inputRef.current?.focus({ preventScroll: true });
  }, [lines, mode]);

  // ---------------- 1. Apply to next company ----------------
  const showNextLead = () => {
    print('', ...banner('NEXT APPLICATION', LEAD_WIDTH), '');
    if (hasVisitorApplied) {
      print("🎉 You've applied to all companies! Great work!");
      backToMenu();
      return;
    }
    print(
      `Category: ${VISITOR_LEAD.category}`,
      `Company: ${VISITOR_LEAD.company}`,
      `Industries: ${VISITOR_LEAD.industries}`,
      `Employees: ${VISITOR_LEAD.employees}`,
      `Turnover Change: ${VISITOR_LEAD.turnoverChange}`,
      `Is Unicorn: ${VISITOR_LEAD.isUnicorn}`,
      '',
      '📧 Find their email address and enter it below:',
      { text: TERMINAL_COPY.visitorLeadHint, tone: 'dim' },
    );
    setMode('email');
  };

  const readEmail = (answer) => {
    if (!answer) {
      print('❌ No email entered. Application not saved.');
      backToMenu();
    } else if (!looksLikeEmail(answer)) {
      print({ text: TERMINAL_COPY.invalidEmail, tone: 'error' });
    } else {
      setPendingEmail(answer);
      print(
        '',
        `To:         ${answer}`,
        `Subject:    ${EMAIL_SUBJECT}`,
        `Attachment: ${CONTACT.resumeFileName}`,
        { text: TERMINAL_COPY.privacyNote, tone: 'dim' },
        '',
      );
      setMode('confirm');
    }
  };

  const confirmSend = async (answer) => {
    if (!answer.toLowerCase().startsWith('y')) {
      print(TERMINAL_COPY.cancelled);
      backToMenu();
      return;
    }

    print({ text: TERMINAL_COPY.sending, tone: 'dim' });
    setMode('sending');
    const result = await sendVisitorEmail(pendingEmail);
    if (!isMountedRef.current) return;

    if (result.isSent) {
      setApplications((currentApplications) => [
        ...currentApplications,
        { company: VISITOR_LEAD.company, status: 'Applied', email: pendingEmail, isVisitor: true },
      ]);
      print(
        '',
        `✅ Added ${VISITOR_LEAD.company} to tracker!`,
        { text: TERMINAL_COPY.sent, tone: 'ok' },
        { text: TERMINAL_COPY.sentHint, tone: 'dim' },
      );
    } else {
      print(
        { text: TERMINAL_COPY.errors[result.reason] ?? TERMINAL_COPY.errors.failed, tone: 'error' },
        { text: TERMINAL_COPY.resumeLinkLabel, href: CONTACT.resumeUrl },
      );
    }
    backToMenu();
  };

  // ---------------- 2. Update application status ----------------
  const listApplications = () => {
    print(
      '',
      '--- Update Application Status ---',
      '',
      'Current applications:',
      ...applications.map((application, index) => `${index + 1}. ${application.company} - ${application.status}`),
      '',
    );
    setMode('pickCompany');
  };

  const pickCompany = (answer) => {
    const isNumber = /^\d+$/.test(answer);
    const companyIndex = isNumber
      ? Number(answer) - 1
      : applications.findIndex((application) => application.company.toLowerCase() === answer.toLowerCase());

    if (companyIndex < 0 || companyIndex >= applications.length) {
      print(isNumber ? '❌ Invalid number!' : `❌ ${answer || 'That company'} not found!`);
      backToMenu();
      return;
    }

    setPickedCompanyIndex(companyIndex);
    print(
      '',
      `Current status: ${applications[companyIndex].status}`,
      '',
      'Status options:',
      ...STATUS_OPTIONS.map((status, index) => `${index + 1}. ${status}`),
      '',
    );
    setMode('pickStatus');
  };

  const pickStatus = (answer) => {
    const newStatus = STATUS_OPTIONS[Number(answer) - 1];
    if (!/^\d+$/.test(answer) || !newStatus) {
      print('❌ Invalid choice!');
    } else {
      const { company } = applications[pickedCompanyIndex];
      setApplications((currentApplications) => currentApplications.map((application, index) => (
        index === pickedCompanyIndex ? { ...application, status: newStatus } : application
      )));
      print(`✅ Updated ${company} to '${newStatus}'`);
    }
    backToMenu();
  };

  // ---------------- 3. View statistics ----------------
  const showStatistics = () => {
    const countWithStatus = (status) => applications.filter((application) => application.status === status).length;
    const totalLeads = SEED_APPLICATIONS.length + 1; // the made-up leads, plus the visitor
    print(
      '',
      '--- Application Statistics ---',
      '',
      `Total Applications: ${applications.length}`,
      ...STATUS_OPTIONS.map((status) => `  ${status}: ${countWithStatus(status)}`),
      '',
      `📊 Remaining jobs: ${totalLeads - applications.length}/${totalLeads}`,
    );
    backToMenu();
  };

  // ---------------- The menu ----------------
  const readMenuChoice = (answer) => {
    if (answer === '1') showNextLead();
    else if (answer === '2') listApplications();
    else if (answer === '3') showStatistics();
    else if (answer === '4') {
      print('', 'Good luck with your applications! 🚀', '');
      setMode('exited');
    } else {
      print('❌ Invalid choice! Please enter 1-4.');
      backToMenu();
    }
  };

  const restart = () => {
    print({ text: '$ python main.py', tone: 'typed' });
    backToMenu();
  };

  const ANSWER_HANDLERS = {
    menu: readMenuChoice,
    email: readEmail,
    confirm: confirmSend,
    pickCompany,
    pickStatus,
    exited: restart,
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!prompt) return;
    const answer = typedText.trim();
    print({ text: `${prompt}${answer}`, tone: 'typed' }); // echo what was typed, like a real terminal
    setTypedText('');
    ANSWER_HANDLERS[mode](answer);
  };

  // Clicks stay in the window (they must not reach the 3D scene), and put the cursor in the prompt
  const handleClick = (event) => {
    event.stopPropagation();
    if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="terminal" onClick={handleClick}>
      <div className="terminal-log" ref={logRef} aria-live="polite">
        {lines.map((line) => (
          line.href
            ? <a key={line.id} className="terminal-line is-link" href={line.href} download={CONTACT.resumeFileName}>{line.text}</a>
            : <div key={line.id} className={line.tone ? `terminal-line is-${line.tone}` : 'terminal-line'}>{line.text || ' '}</div>
        ))}

        {prompt && (
          <form className="terminal-prompt" onSubmit={handleSubmit} noValidate>
            <label htmlFor="terminal-input">{prompt}</label>
            <input
              id="terminal-input"
              ref={inputRef}
              type={mode === 'email' ? 'email' : 'text'}
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
              autoComplete={mode === 'email' ? 'email' : 'off'}
              autoCapitalize="off"
              spellCheck={false}
            />
          </form>
        )}
      </div>
    </div>
  );
}
