# mats-office: a 3D workshop portfolio

> **For Claude Code:** this is the source of truth for what the site is, how it should feel, and what's already decided. Read it fully before writing code. Anything marked **TODO** or **VERIFY** is not decided yet: ask Mats, don't invent it. Never invent project facts, numbers or quotes.

---

## 1. What this is

A personal portfolio for **Mats Leis**, an Electrical Engineering + AI Systems Engineering student at Western University (London, Ontario). He is a hardware person first: PCB design, embedded systems, FPGA, with an AI/software side.

Instead of a scrolling page, the site is a **3D electronics workshop**: Mats's office. Visitors arrive at a closed office door, open it, and step into a warm workshop where every project is a physical object:

- **Workbench (centre):** EE/hardware projects as real boards and robots on the bench.
- **Hobby corner (left wall):** record crate with a live "now playing" turntable, guitar, tennis rackets, Sunstang poster.
- **Desk + monitor (right wall):** AI/software projects as app windows on a fake desktop.

The camera moves between **fixed stations**. There is no free-roam and no WASD walking. It should feel like a guided, cinematic tour that anyone can use with a mouse, a trackpad or a thumb.

**Audience:** recruiters and engineers (Neuralink, SpaceX, Stripe and similar), so it must load fast, and the content must be reachable in under 10 seconds. A **"skip to 2D"** version is mandatory.

---

## 2. The visitor's journey (in order)

1. **The door (landing).** A closed office door fills the screen:
   - A brass nameplate reading "Mats Leis · Electrical & AI Systems Engineering"
   - Mats's photo pinned on like an ID badge
   - A sticky note with a one-line bio (**TODO:** copy from Mats)
   - A small, always-visible "Skip to 2D" link in a corner

   The rest of the room preloads behind the door while the visitor reads.
2. **Entering.** The visitor clicks the handle (or presses Enter/Space, or scrolls). The door swings open and the camera glides through it, settling on the workbench view under a warm desk lamp.
3. **Workbench station (EE).** This is the first full view of the room:
   - The LEGO SPIKE RoboCup robot on a shelf above the bench, labelled as where it all started
   - The FSM detector board, which is interactive
   - The Sunstang Driver Controls board
   - The GlobalReader radio board and baseboard, next to a JLCPCB box

   Hover → the object glows and shows a small label. Click → the camera zooms to the object and a **Project Card** opens.
4. **Turn left → hobby corner.**
   - A milk crate of vinyl records that visitors can flip through
   - A turntable on top showing what Mats is listening to now (Last.fm)
   - A guitar on a stand and tennis rackets on a wall pegboard
   - The **Sunstang poster** on the wall
5. **Turn right → desk station.** The camera pushes into the monitor, which becomes a small fake desktop. Each AISE project is an app window: the Cold Emailer, the Concrete model and the Squat Tracker.
6. **Always available:**
   - Station navigation: arrows, dots, ←/→ keys, swipe on touch
   - A back/close control for any close-up (Esc too)
   - A resume clipboard on a hook (opens the PDF)
   - Contact links: email, LinkedIn, GitHub
   - "Skip to 2D"

**Phones:** the same journey. Tap arrows/dots to move, with a lighter scene (no shadows, lower DPR, simpler props) and Project Cards as bottom sheets.

---

## 3. Room layout

Top-down plan (the camera starts at the door looking toward the back wall):

```
                 BACK WALL
   +-------------------------------------+
   | HOBBY      |  WORKBENCH  |   DESK +  |
   | CORNER     |  (EE)       |   MONITOR |
   | (left)     |             |   (AISE)  |
   |            |             |  (right)  |
   | records,   |             |           |
   | turntable, |             |           |
   | guitar,    |             |           |
   | rackets,   |             |           |
   | poster     |             |           |
   +----------------[ DOOR ]-------------+
```

Coordinate convention (suggestion, adjust if needed): metres, +Y up, the door at +Z, the back wall at −Z, the hobby corner at −X, the desk at +X. Define every camera pose in **one** file, `src/scene/stations.js`:

| Station id  | Looks at                | Notes                                   |
|-------------|-------------------------|-----------------------------------------|
| `door`      | Closed door, front-on   | Landing. Room hidden/preloading behind  |
| `bench`     | Workbench, slightly down| Default after entering                  |
| `hobbies`   | Left wall               | ← from bench                            |
| `desk`      | Right wall / monitor    | → from bench                            |
| `focus:<id>`| One object, close-up    | Opened by clicking an object            |

Order for ←/→ cycling: `hobbies ⇄ bench ⇄ desk`. `door` is only the entry.

---

## 4. Look and feel

- **Working default:** cozy, warm room with a clean, minimal UI on top. Think wood workbench, warm desk-lamp pool of light, darker walls, soft shadows. Overlay UI is quiet, monospace-accented, with small type. (**VERIFY** with Mats. He earlier liked light/minimal and used https://www.zachjordan.io/ as inspiration.)
- **Palette anchors** from the chosen Sunstang poster:
  - Warm black `#1A1814`
  - Cream `#D7C2A0`
  - Paper `#F4EDE0`
  - Navy `#141E33`
  - Sunstang gold `#EBA706`
  - Sun yellow `#FEDE4E`
  - PCB navy `#17345E`
- **Type:** Jost (Futura-like, matches Sunstang branding) for UI headings. System monospace (`ui-monospace, Menlo, Consolas`) for labels and data.
- **Motion:** camera moves of about 0.8–1.2 s with ease-in-out. Respect `prefers-reduced-motion`: cut or fade instead of flying.
- No AI-tropey gradients or emoji. Real `<button>`/`<a>` elements for all controls.

---

## 5. Tech stack and decisions

| Area        | Decision |
|-------------|----------|
| Build       | **Vite** + **React** (JSX, no TypeScript unless Mats asks) |
| 3D          | **three**, **@react-three/fiber**, **@react-three/drei** |
| Tested with | react 19.2, @react-three/fiber 9.8, @react-three/drei 10.7, three 0.187, vite 8 |
| Camera      | drei `CameraControls` (or a custom tween) driven by `stations.js`; user orbit disabled or tightly clamped |
| Models      | `.glb` only, compressed with `npx gltfjsx model.glb --transform` (Draco + WebP + a generated JSX component) |
| Simple props| Desk, monitor, shelves, crate: modelled in code (boxes, cylinders, lathes) |
| Generic props| Acoustic guitar, Head Speed Pro 2022 racket, turntable, lab equipment (scope, PSU, multimeter, soldering station, microscope), posters: sourced by the **prop-finder** agent (CC0/CC-BY only), compressed by **modeler**. Fall back to code-modelled if nothing fits the budget |
| Hosting     | **GitHub Pages**, built by GitHub Actions (`.github/workflows/deploy.yml`) |
| Domain      | Bought on **Wix**. Nameservers are locked, so add DNS **A records** for GitHub Pages and a `www` CNAME to `mleis4.github.io` inside Wix. Domain name goes in `public/CNAME` (**TODO**) |
| Vite base   | `base: '/'` with a custom domain; `'./'` also works for previews |
| Routing     | Static site, so use the hash for the 2D view (e.g. `#2d`); no server routes |
| Now Playing | **Last.fm** `user.getRecentTracks` from the browser (Spotify scrobbles to Last.fm). No server, no Spotify Premium needed. Spotify's own API is avoided: since Feb 2026 Development Mode needs Premium plus a server for the secret |
| Analytics   | Optional, later (GoatCounter or Cloudflare Web Analytics) |

**Performance budget**
- Initial load under ~5 MB total; the door must be interactive within about 2 s on a decent connection.
- Each prop model 2 MB or less after compression.
- `dpr={[1, 2]}`; on mobile clamp to 1.5, disable shadows, fewer lights.
- Bake lighting where possible. Suspend + preload (`useGLTF.preload`) behind the door.

---

## 6. File structure

The scaffold already exists (`mats-office/`). Keep this layout:

```
mats-office/
├─ .claude/agents/
│  ├─ architect.md          # model: claude-fable-5-2. Hard problems only
│  ├─ builder.md            # model: sonnet. Routine work
│  ├─ modeler.md            # model: opus. Finds/creates/compresses every .glb
│  └─ prop-finder.md        # model: sonnet. Generic props, album covers, posters (CC0/CC-BY)
├─ .github/workflows/deploy.yml
├─ CLAUDE.md                # points at this README + current status
├─ README.md                # this file
├─ task-list.txt            # content Mats still has to gather
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ CNAME                 # TODO: domain
│  ├─ models/               # .glb only, credited in models/CREDITS.md
│  │  ├─ robocup_robot.glb  # LEGO SPIKE RoboCup robot. In MILLIMETRES (scale 0.001); compress first
│  │  ├─ BaseBoard.glb      # GlobalReader baseboard (metres). ⚠️ PRIVATE, see §15
│  │  ├─ RadioBoard.glb     # GlobalReader radio board, a shield on BaseBoard (metres). ⚠️ PRIVATE
│  │  └─ CREDITS.md         # source + licence of every downloaded model
│  ├─ textures/             # sunstang_poster.png etc.
│  └─ images/
│     ├─ projects/          # photos + app screenshots (~1600px long side, JPG/WebP)
│     │                     #   Robocup.jpeg, Robocup(1).jpeg: Team Canada at RoboCup Jr. Worlds 2023
│     ├─ records/           # album covers
│     ├─ props/             # generic posters/textures found by prop-finder
│     ├─ Inspiration/       # style references only. NOT site content, exclude from the build
│     ├─ headshot.jpg       # Mats's photo (Door ID badge)
│     ├─ *-thumb.png        # card thumbnails: fpga, sunstang, superangel, squat-tracker, smartics
│     ├─ globalreader-thumb.png  # ⚠️ PcbDraw pinout render of the RF board: PRIVATE until approved (§15)
│     └─ CREDITS.md         # source + licence of every downloaded image
└─ src/
   ├─ main.jsx
   ├─ App.jsx               # Canvas + overlay UI + 2D toggle
   ├─ styles/global.css
   ├─ scene/
   │  ├─ Office.jsx         # room shell: walls, floor, lamp, furniture
   │  ├─ Lighting.jsx
   │  ├─ CameraRig.jsx      # moves between stations.js poses
   │  └─ stations.js        # ALL camera poses + station order
   ├─ stations/
   │  ├─ Door.jsx
   │  ├─ Workbench.jsx      # places bench objects
   │  ├─ Monitor.jsx        # desk + monitor + fake desktop
   │  └─ HobbyCorner.jsx
   ├─ objects/
   │  ├─ bench/   SunstangBoard, GlobalReaderBoards, FsmDetector (DONE), fsmLogic.js (DONE), SpikeRobot
   │  ├─ monitor/ Desktop, ColdEmailerWindow, ConcreteModelWindow, SquatTrackerWindow
   │  └─ hobbies/ RecordCrate, Turntable, Guitar, TennisRackets (+ Poster)
   ├─ ui/       ProjectCard, StationNav, Skip2DButton
   ├─ pages/    Projects2D.jsx  # full 2D portfolio, same data
   ├─ data/     eeProjects.json, aiseProjects.json, hobbies.json, records.json (DONE)
   └─ hooks/    useNowPlaying.js  # Last.fm polling
```

**Rule:** all project and hobby text lives in `src/data/*.json`. 3D components read from the data and never hard-code copy. The 2D page renders the same JSON, which also gives SEO and accessibility for free.

---

## 7. Data shapes

`eeProjects.json` / `aiseProjects.json` (array):

```json
{
  "id": "fsm-detector",
  "name": "Moore FSM Sequence Detector",
  "pitch": "One line.",
  "role": "Class project (ECE 2277A), individual",
  "summary": "2–4 sentences on what it does and what Mats did.",
  "tech": ["Quartus", "D flip-flops", "K-maps"],
  "results": ["Circuit cost cut from 60 to 51 (15% lower)"],
  "links": [{ "label": "GitHub", "url": "https://..." }],
  "dates": "Fall 2025",
  "images": ["/images/projects/fsm-1.webp"],
  "station": "bench",
  "object": "FsmDetector",
  "private": false
}
```

`hobbies.json`: `{ "id", "name", "blurb", "object", "images": [] }`. Hobbies open a ProjectCard too, so they need images (see §10).
`records.json`: `{ "title", "artist", "year", "edition", "front", "back", "source", "note" }` × 13. `front`/`back` are cover images in `public/images/records/`. `source` is where Mats got the record and `note` is what it means to him; both show in the card when that album is picked (**TODO:** Mats to write them).

---

## 8. Content: the projects

Source: Mats's resume, his reports and repos. These facts are confirmed unless marked otherwise.

### Workbench (EE)

**1. RoboCup Jr. Rescue Robot (origins)** · Oct 2022 – Jul 2023 · high school team, St. Andrew's College
- Where Mats found out he likes EE. He helped design the robot and did some of the programming.
- The main robot was an Arduino Mega with an OpenMV H7 camera (CV), MPU6050 IMU, TCS34725 colour sensor, HC-SR04 ultrasonic sensor and an IR line array.
- The team never calculated the total current draw, so the day before regionals the robot would not run with everything connected. They switched to their **LEGO SPIKE backup robot** and with it **qualified for Team Canada at RoboCup Jr. Worlds (July 2023)**.
- Lesson for the card: power budgeting matters, the same thread as his later power-architecture work on Sunstang and GlobalReader.
- Photos: `public/images/projects/Robocup.jpeg` and `Robocup(1).jpeg` (team photos at Worlds with the Canadian flag) go in this card's gallery.
- 3D: `public/models/robocup_robot.glb` exists (in millimetres, so scale 0.001; compress it first). Component: `SpikeRobot.jsx`. It sits on a shelf **above** the bench, labelled "where it started". **TODO:** Worlds placing (optional).

**2. Moore FSM Sequence Detector** · ECE 2277A, report submitted Dec 9, 2025
- An 8-state Moore machine with 3 D flip-flops. **Z goes HIGH after `0011`, back LOW after `0101`** or on reset. (The report's problem statement says 1010, but the state table, waveform and implementation all detect 0101. Use 0101.)
- Gray-code assignment cost 60 → adjacency-rule assignment cost 54 → shared terms, final cost **51**. Built structurally in Quartus.
- **Already built:** `src/objects/bench/FsmDetector.jsx` + `fsmLogic.js`:
  - An interactive FPGA dev board with an X switch, CLK, RST, Q1–Q3 LEDs, a Z LED, and a floating info panel (bit history, state map, Send 0/1, Play demo)
  - `fsmLogic.js` implements the report's optimized equations. It was verified against the state table (16/16) and 200k random bits
  - Usage: `<FsmDetector position={[x,y,z]} scale={0.5} />`
  - **Do not remove** the `portal={panelPortalRef}` on its `<Html>`. Without it drei's Html re-mounts its React root and the panel renders blank (fiber 9.8 + drei 10.7 bug)
  - Show the info panel only when the camera is at `bench` or `focus:fsm-detector` (prop `showPanel`)
- Live preview of the board: https://claude.ai/artifact/5nYsYHzrPMv9WJHSeZW1Ed

**3. Sunstang Driver Controls Board** · Western Sunstang solar car team, Driver Controls subteam · Jan 2025 (**VERIFY** start/finish)
- Led the move from Nucleo prototyping (STM32 Nucleo-F302R8) to a custom STM32 PCB: the interface between driver inputs, the powertrain and the safety-critical CAN network.
- CAN with selectable 120 Ω termination, a 12 V → 3.3 V switching supply, a 4-layer stackup with power/ground planes, USB-UART, SWD, diagnostic LEDs, hand-solderable DFM.
- 3D: export from KiCad to `.glb`/`.step` (**TODO**). Optional touch: a small steering-wheel button panel wired to it that lights board LEDs.
- **TODO:** outcome (fabricated? in the car?).

**4. GlobalReader Radio Board + Baseboard** · Embedded Systems Engineering Intern, GlobalReader (Tartu, Estonia) · May – Aug 2026
- Sole in-house hardware engineer. Led the from-scratch KiCad redesign of two production IoT PCBs that had been outsourced.
- Redesigned the cellular + WiFi subsystem (Quectel BG770A-GL LTE-M, ESP32-WROOM-32UE; **VERIFY** final modem vs Telit ME310G1-W1).
- Replaced the two-stage power design (24 V → 4 V → 3.3 V) to fix a 3.3 V thermal defect under WiFi transmit bursts.
- Ideal-diode reverse polarity (LM74700 + P-MOSFET) in place of a lossy Schottky pair. SMBJ58A/SMBJ26A surge protection.
- Debugged first boards with oscilloscope UART capture (a firmware issue, fixed by reflashing). Built the JLCPCB pipeline (KiKit panelization, BOM/CPL scripts, kicad-cli).
- Parts: Nuvoton M487 MCU, IP101GR Ethernet PHY, LM76005 buck.
- ✅ **Approved (Nov 14, 2026):** Mats has GlobalReader's permission to show the boards. The 3D models and the pinout render are in use.
- 3D (once approved): `BaseBoard.glb` + `RadioBoard.glb` (metres, ~8 cm boards). **The radio board is a shield that plugs onto the baseboard**, so always render them as one `<group>` with the radio board stacked on the baseboard's headers, never as two separate props. The exports don't share an origin: measure the stack offset with `Box3`, hand-tune X/Z until the headers line up, then hard-code it as a named constant. Optional: click to lift the shield off. Until approved, the generic placeholder should still read as a two-board stack.

### Desk / monitor (AISE)

**5. SuperAngel500 Job Applicator (the "Cold Emailer")** · solo · Feb 2026 · https://github.com/mleis4/SuperAngel500-Job-Applicator
- A Python CLI that scraped the Superangel 500 list (~680 Estonian startups) from its JSON endpoint and split companies into EE / AISE / both lead lists by industry, queueing "both" first.
- For each lead it shows company metrics (headcount, turnover change, unicorn status), fills a template with the company's industry and growth, and sends a personalized email with the resume attached via Gmail SMTP.
- A CSV tracker follows Applied → Interview → Rejected → Accepted, with conversion stats.
- Tech: Python, requests, pandas, smtplib.
- Monitor window: a mail-client look with drafts typing themselves out and sending. ⚠️ Use **fake recipients**. The real template names a relative and has a phone number: never show it.
- **TODO:** results (emails sent, replies, did it lead to GlobalReader?).

**6. Concrete Strength Predictor** · DS3000 group project (Group 07) · Fall 2026
- Predicts concrete compressive strength from mix recipe + age (OpenML dataset, 1,030 mixes, split 618/206/206). Mats wrote the Stage 2 XGBoost model (hyperparameter search, pipeline, evaluation).
- Validation RMSE **4.9 MPa**, R² **0.91**, vs 11.0 MPa for the best baseline (multiple linear regression). **VERIFY:** swap in test-set numbers when final.
- Tech: Python, scikit-learn, XGBoost, pandas, Jupyter.
- Monitor window: notebook look with a predicted-vs-actual plot and an RMSE bar comparison. ⚠️ A group class project: don't link the repo until Mats confirms.

**7. Squat Tracker** · with a partner · Feb 2024 – present
- A computer-vision form analyzer. A custom YOLOv8n-pose model finds two barbell keypoints (no markers) and their midpoint traces the bar path in real time. Rep segmentation scores each rep by bar-path linearity.
- Pose mAP50 99%, mAP50-95 95.7%.
- Tech: Python, Ultralytics YOLOv8, OpenCV, Roboflow, Google Colab.
- Monitor window: a looping video with the bar-path overlay. **TODO:** clip and repo link; whether the partner wants credit.

**Possible extras** (Mats to decide): SmartICS, Engineering Part Sourcer (AISE 3309), castorini/rank_llm contributions, PID Arduino bi-copter, Estonian/Finnish vocab Chrome extension, SmartCal hackathon.

---

## 9. Hobby corner

- **Record crate:** the data is done in `records.json` (13 albums: King Crimson, Bowie, Pink Floyd 50th anniversary, Joy Division, The Jam, two Smiths records, Foo Fighters ×2, The Strokes *Is This It* US cover, Kids See Ghosts, Denzel Curry ×2). Interaction: hover to flip through sleeves; click to pull one out, showing the cover, title/artist/year/edition and Mats's note. Covers: download once into `public/images/records/` with a small script (Cover Art Archive / MusicBrainz) rather than hot-linking at runtime. Respect the specific editions in the data.
- **Turntable (now playing):** sits on top of the crate. `useNowPlaying` polls Last.fm `user.getRecentTracks` every 30–60 s and shows the current or last track with its art on a spinning record (spinning only while "now playing"). On failure, fall back to a record from the crate. **TODO:** Last.fm username + API key (read-only key, fine in client code).
- **Guitar** on a stand. **TODO:** make/model/colour + blurb.
- **Tennis rackets** on a pegboard. Racket: **Head Speed Pro 2022**. Blurb draft: intermediate/advanced player, coached 50+ students aged 4–60+ at Johnston Tennis Academy (2022–2024).
- **Sunstang poster** on the wall: **Option C, "Emblem"**. The cream Sunstang horse emblem on warm black `#1A1814`, the car's plan view rotated vertically behind it at ~14% opacity, and "WESTERN UNIVERSITY · EST. 1991" at the bottom. 9:16, 1080×1920. Design canvas: https://claude.ai/artifact/E2UqFprbKoaVwuAWKpfhhE. **TODO:** export it to `public/textures/sunstang_poster.png` and map it onto a framed plane.

---

## 10. Interaction and UI rules

- **Hover** (desktop): emissive glow + a small label. **Tap** (touch): the first tap selects, the second opens.
- **ProjectCard:** a DOM overlay (not in-world). Desktop: side panel. Mobile: bottom sheet. Shows pitch, role, summary, tech chips, results, links, and a **photo gallery** (thumbnails, click to enlarge). Closes with Esc, a ✕ button, or clicking empty scene.
- **Every clickable object opens a ProjectCard**, with no exceptions: projects, monitor apps **and hobbies** (crate, turntable, guitar, rackets, poster). One shared component; objects pass their data `id`. Interactive objects (FSM board, crate) keep their own controls, and the card opens from the object body or an info button.
- **StationNav:** ← → buttons + dots + keyboard arrows + swipe. Shows the current station name (Hobbies / Workbench / Desk).
- **Skip to 2D:** switches to `Projects2D` (hash `#2d`) with the same JSON as a clean, fast page. It must also be the fallback when WebGL is unavailable.
- **Monitor:** drei `<Html transform>` on the screen plane hosts the fake desktop, with real DOM windows (draggable is optional).
- **Accessibility:** every control is a real button or link with a label; alt text on images; focus styles; reduced motion respected; text contrast ≥ 4.5:1.

---

## 11. Code conventions (required)

Every source file starts with this header (Mats's class style), as in `fsmLogic.js`:

```js
/*
 * ============================================================================
 * Program Name:   FileName.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           Month D, YYYY
 * Description:    What this file does, in plain English.
 * ============================================================================
 */
```

- Descriptive variable names (`currentStation`, not `cs`), meaningful comments that say *why*, consistent 2-space indentation.
- Section dividers (`// ---- Section ----`) between logical blocks, as in `FsmDetector.jsx`.
- No hard-coded project copy in components (see §6).
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:` …).

---

## 12. Agent routing (Claude Code)

| Give to **architect** (Fable 5.2)              | Give to **builder** (Sonnet)                   |
|------------------------------------------------|------------------------------------------------|
| `CameraRig` + `stations.js` design             | `package.json`, Vite config, deploy workflow   |
| Room composition, lighting, performance tuning | JSON data files, ProjectCard, StationNav UI    |
| Monitor `<Html transform>` desktop system      | Simple code-modelled props (crate, rackets…)   |
| Record-crate flip interaction                  | Projects2D page, CSS, copy edits               |
| Mobile fallback strategy, tricky bugs          | Cover-download script, Last.fm hook            |

| Give to **modeler** (Opus)                     | Give to **prop-finder** (Sonnet)               |
|------------------------------------------------|------------------------------------------------|
| Compressing/rescaling every `.glb`             | Album covers for `records.json`                |
| KiCad/CAD exports → web-ready models           | Acoustic guitar, Head Speed Pro 2022 racket    |
| GlobalReader stacked assembly                  | Lab equipment, turntable, posters/decor        |
| Wiring models into components                  | Credits + licences (CC0/CC-BY only)            |

Run the main session on Sonnet. Call the architect explicitly for hard tasks.

---

## 13. Build order (milestones)

1. **Boot:** fill `package.json`, `vite.config.js`, `main.jsx`/`App.jsx`; a deploy workflow that publishes to GitHub Pages; `git init` (first check the stray `.git` in `C:\Users\Mats`).
2. **Room shell + camera:** walls, floor, bench, desk, lamp; `stations.js` + `CameraRig`; StationNav; the door open → bench transition. Use placeholder boxes for all objects.
3. **Data + cards:** JSON files, ProjectCard, hover/click focus, Projects2D.
4. **Workbench:** drop in `FsmDetector` (done), the compressed RoboCup robot, the Sunstang board (KiCad export), the GlobalReader placeholder.
5. **Desk:** monitor desktop with the three app windows (screenshots/clips from Mats).
6. **Hobby corner:** crate + covers, turntable + Last.fm, guitar, rackets, poster.
7. **Polish:** lighting/bake, mobile pass, reduced motion, loading, analytics, domain + HTTPS.

---

## 14. Known gotchas

- **drei `<Html>` renders empty** with fiber 9.8 + drei 10.7 unless given a stable `portal` ref (see FsmDetector). Apply the same fix to every `<Html>`.
- Mats is on **Windows / PowerShell**. Node must be installed (`winget install OpenJS.NodeJS.LTS`, then reopen the terminal). If scripts are blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- Keep the repo **out of OneDrive** (it has broken `.git` folders before).
- Downloaded models: compress before committing. Credit CC-BY creators.

---

## 15. Privacy rules (hard)

- GlobalReader hardware: approved by GlobalReader on Nov 14, 2026 (3D models + pinout render). Anything beyond those (schematics, other boards) still needs a fresh OK.
- Phone number: never on the site. Email and LinkedIn are fine.
- Cold Emailer: fake recipients only. Never display the real email template or `application_status.csv`.
- DS3000 code/repo: only with group/course OK.

---

## 16. Open TODO list (ask Mats)

- [ ] Door bio line + photo
- [ ] Graduation date (resume says May 2029, elsewhere May 2028)
- [ ] Domain name for `public/CNAME`; GitHub repo name
- [ ] Resume PDF
- [ ] Photos/screenshots for every project
- [ ] KiCad exports: Sunstang board (and GlobalReader once approved)
- [ ] Sunstang board outcome; GlobalReader final modem
- [ ] Cold Emailer results; Squat Tracker clip/repo + partner credit
- [ ] Concrete model test-set numbers
- [ ] Last.fm username + API key
- [ ] Guitar details; hobby blurbs; record notes (racket: Head Speed Pro 2022 ✓)
- [ ] Photos for every hobby card (guitar, racket, records, turntable)
- [x] GlobalReader: permission to show `BaseBoard.glb` / `RadioBoard.glb` (Nov 14, 2026)
- [ ] GlobalReader: confirm the stacked orientation in `GlobalReaderBoards.jsx` matches the real hardware
- [ ] Confirm the vibe (warm room + minimal UI)
- [ ] Export the Sunstang poster (Option C) to `public/textures/`

Contact for the site: leismats@gmail.com · https://www.linkedin.com/in/mats-leis-4b9911271/ · https://github.com/mleis4
