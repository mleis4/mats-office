# mats-office

**Read `README.md` fully before doing anything.** It is the source of truth: the visitor journey, room layout, look and feel, tech stack, file structure, data shapes, project facts, privacy rules, agent routing and build order. Anything marked TODO or VERIFY there: ask Mats, don't invent it.

This file only tracks the **current state of the repo**, which the README doesn't.

## Running it

`npm run dev` serves the site at **http://localhost:3000** (fixed port, set in `vite.config.js`). `npm run build` makes the production build.

## Current state (2026-11-14)

A first full version is built and runs: door → workbench → hobby corner → desk, every object clickable with a Project Card, plus the 2D page at `#2d`. README milestones 1–6 are done in first-pass form; milestone 7 (polish) is not.

Files beyond the README's structure:
- `src/scene/SceneContext.js`: tour state shared with the 3D objects. It is provided **inside** `<Canvas>`, because context doesn't cross into the canvas.
- `src/data/catalog.js`: joins the three JSON files into `SECTIONS` and `ITEMS_BY_ID`, and holds the contact links.
- `src/objects/Selectable.jsx`: wraps any object to give it the hover halo, label and click-to-open.
- `src/objects/TextPlane.jsx`: text on a plane via a canvas texture (nameplate, sleeves, labels).
- `src/objects/useFittedModel.js`: loads a `.glb`, moves its origin to the bottom-centre and returns its size, so units don't matter.
- `src/objects/hobbies/Poster.jsx`: the framed Sunstang poster.

Things that are stand-ins for now:
- `SunstangBoard.jsx` is modelled in code until the KiCad export exists.
- Record sleeves show title/artist text, not real covers. No cover-download script yet.
- Downloaded models (added by Mats, Draco/WebP compressed) are placed with `src/objects/ModelProp.jsx`: guitar, tennis rackets, ball can, desk lamp, oscilloscope, soldering station, Casio keyboard (decor, not clickable), trophy and flaglet (beside the robot). **Their sources and licences are still missing from `public/models/CREDITS.md`.**
- Also models: the hobby-corner cabinet, two speakers (one at each end of the cabinet), the turntable, the skis and the Ski The East sign (`Skis.jsx`, id `skiing`; its blurb is a placeholder). The turntable model has no separate platter, so it no longer spins while a track is playing.
- Still modelled in code (no model in `public/models/`): record crate, bench supply, monitor/keyboard/mouse, JLCPCB box, both pegboards, workbench, shelf, desk.
- `src/objects/Pegboard.jsx` is the shared pegboard (tennis wall and the tool wall). `src/objects/bench/ToolPegboard.jsx` fills the one under the bench shelf with code-built electronics tools (decor, not clickable).
- `src/objects/FramedPrint.jsx` hangs any poster image at a given width. The decor posters (Moby, Jeff Buckley, Finland, Tartu) are listed in `WALL_POSTERS` in `HobbyCorner.jsx`. **Their sources and licences are not recorded yet** (`public/images/CREDITS.md`). `public/textures/unnamed.jpg` (a snowflake logo) is not used.
- The oscilloscope model is tipped back 8 degrees on its stand; `Workbench.jsx` levels it so it sits flat on the shelf.
- **Room size and layout** live in `src/scene/stations.js` (`ROOM`, `BENCH`, `SHELF`, `DESK`, `CABINET`). Everything is measured from the walls. The room is 5.0 × 4.6 × 2.7 m and the bench is 2.3 m wide.
- **Left-wall run** (`LEFT_WALL_RUN` in `stations.js`): speaker, cabinet, speaker, guitar are spaced evenly between the back wall and the keyboard, using each model's measured size (the constants above it). If a model's scene size changes, update its constant there. The left-wall posters share one centre line (`posterRowY`).
- Wall-mounted things sit flush: prints at the wall's x/z, pegboards at wall + `PEGBOARD_STANDOFF`. Boards on the soldering mat are raised by `BENCH_MAT_THICKNESS`.
- **Record browsing:** opening the crate puts the camera over the bin (`OBJECTS.records.focus`). The wheel (anywhere, including over the card), Up/Down, or hovering a sleeve or list row sets `browseRecordIndex`, which raises that record. Clicking picks it (`selectedRecordIndex`): the camera switches to `pickedFocus` and the album floats between the turntable and the card. Each record's `source` and `note` in `records.json` are still empty.
- The turntable falls back to a record from the crate until `.env.local` has `VITE_LASTFM_USER` and `VITE_LASTFM_KEY`.
- No resume clipboard yet (no PDF). The sticky note on the door has a "come in" hint, not the bio line.
- `robocup_robot.glb` is uncompressed (1.3 MB). No deploy workflow yet.

## Things to keep in mind

- **GlobalReader is approved**: Mats has permission to show the boards (2026-11-14). `BaseBoard.glb`, `RadioBoard.glb` and `globalreader-thumb.png` are in use. The old `Scouter_*.glb` exports are still in git history (commit 997719e).
- **GlobalReader stack** (`GlobalReaderBoards.jsx`): the baseboard sits connector-side up; the radio board goes on face-down, turned a quarter turn, so its 3-pin and 8-pin headers drop into the baseboard's two sockets. The offsets were tuned by eye from screenshots. Mats should confirm the orientation against the real hardware.
- The fake desktop on the monitor (`Desktop.jsx`) runs in drei's separate React root, so it gets props, not context. It is only mounted at the desk station, because DOM always draws on top of the canvas.
- Every `<Html>` needs the stable `portal` ref (README §14).
- Large originals are still in `public/` (`headshot.jpg` 7.6 MB, `squat-tracker-thumb.png` 6.2 MB, `Sunstang Poster.png` 1.8 MB, `Inspiration/`). The site uses the resized copies (`headshot-web.jpg`, `squat-tracker-web.jpg`, `textures/sunstang_poster.jpg`). Move the originals out of `public/` before deploying.
- `smartics-thumb.png` exists but SmartICS isn't a project in the data yet (README lists it as a possible extra).
- Style: the build follows README §4 (warm room, minimal UI). The three mockups at https://claude.ai/artifact/2R2mjo9UBytB9hhfBmt8t6 were never chosen between.
- Agents: see README §12. Every downloaded asset gets a line in `public/models/CREDITS.md` or `public/images/CREDITS.md`.
