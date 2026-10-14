# Upgrade acceptance checks — 13 October 2026

Test URL: https://stevenmyers120-boop.github.io/nervous-extreme/upgrade/

Library under test: **adult-v2**, the complete adult-content replacement. See `CONTENT-REVIEW.md`.

## Automated results

| Check | Evidence | Result |
|---|---|---|
| Original files and old rules preserved | engine preservation tests; Git diff against baseline | Passed |
| 500 concepts / 1,000 variants / 5,000 steps; 40/160/300 per mode | library validator and library tests | Passed |
| Unique IDs, five-step schema and evidence metadata | library tests | Passed |
| Exact and near-duplicate screening | token Jaccard ≥0.65; TF-IDF cosine >0.60 | No token candidates; one reviewed forearm-art motif retained |
| Scoring, stage transitions, exhaustion and fresh pools | engine tests; all 500 concepts exhausted per mode | Passed |
| Single Phone controls, consent, final reveal, Nervous and Stop | actual app in JSDOM | Passed |
| Both multiplayer modes, room joining and mode inheritance | independent Firebase emulator clients; hosted anonymous clients | Passed |
| Outsider/unauthenticated access and challenger completion rejected | negative rules tests | Passed |
| Conductor rotation, timer state, retry, text clearing and XSS-safe rendering | multiplayer tests | Passed |
| Custom truth/text and dare/photo/video markers | multiplayer tests | Passed |
| Session resume, championship and temporary history clearing | multiplayer tests | Passed |
| Online Stop during a pending action; offline Stop queues deletion before reconnect | regression assertions in both environments | Passed |
| Late ended-session callbacks do not replace Stop message with a permissions error | regression assertions | Passed |

The final emulator suite reports **12 passed, 0 failed**. The hosted suite reports **3 passed, 0 failed**. Authentication is real anonymous Firebase authentication in hosted tests; JSDOM wraps the app controls and the SDK connections are independent. Browser authentication/token values are never extracted. JavaScript syntax checks and JSON validation passed. Raw outputs are saved alongside this report.

The new content checks verify all 30 terms, a contact pool of at least 100, removal of performance categories and versioned IDs. Both independent-client tests also check that an old-library task hides completion controls, keeps Stop available and recovers when the current task is restored.

## Actual Chromium browser checks

| Flow | Result |
|---|---|
| In-person room creation, independent joining, readiness and automatic mode inheritance | Passed |
| Both devices display the same challenge, step, score and role changes | Passed |
| Complete hidden on challenger; final reveal available only to conductor | Passed |
| Guest conductor can complete after role rotation | Passed |
| Remote text typing, unsent draft privacy, submitted response sharing and five-step completion | Passed |
| Optional timer display | Passed |
| Remote session reload resumes the same challenge and mode | Passed |
| Custom truth accepts in-game text response | Passed |
| Custom video dare uses Snapchat instructions; Complete requires evidence marker | Passed |
| Decline and immediate local Stop; peer room closure | Passed |
| Firebase data view after completed QA runs | Test records removed |

The full browser mechanics table above was performed on the preceding working release. Fresh adult-v2 checks are recorded below. The Snapchat evidence check uses a synthetic test acknowledgement, not a real media transfer. No player data or intimate media was used in testing.

## Responsive checks

Four actual game documents were rendered in Chromium iframe viewports:

| Viewport | Content width | Horizontal overflow | Controls |
|---|---:|---|---|
| 360×740 | 345px with native vertical scrollbar | None | Setup, five steps, reveal, Decline, Stop passed |
| 390×844 | 390px | None | Same checks passed |
| 414×896 | 414px | None | Same checks passed |
| 740×360 landscape | 725px with native vertical scrollbar | None | Same checks passed |

Screens were visually inspected for hierarchy, readable prompts and accessible real buttons. These are browser viewport checks, not physical-device or Safari tests.

## Boundaries and remaining limitations

- The implemented content scope is provocative, non-graphic adult play; graphic sexual instructions and intimate media are excluded.
- Host device authority is inherited from the original architecture. A modified host can cheat; this is not a trusted game server.
- Explicit Stop removes the entire room; offline Stop requires reconnecting to finish server deletion. Reloading the same session can resume its deletion request. Closing the tab or clearing session storage can lose an unacknowledged request; the peer can still Stop the room.
- Completed games clear text and selection history. Unattended abandoned records expire from access but require a scheduled server service for automatic erasure.
- No physical Android/iOS or Safari hardware verification; no automated Snapchat transfer.
- Semantic variety and escalation cannot be certified by similarity metrics alone; the five-step source ladders were authored and inspected.

## Deployment preservation

Only the new `upgrade/` test directory has been added to GitHub Pages. Root production game files and Firebase rules/configuration remain byte-identical to original commit `7dec9af9363bec84d79db27226469adbbff5e245`. That commit is retained on `backup/pre-upgrade-2026-10-13`. The original main website has not been replaced. Approval is required before promotion to the root entry point.

## Adult-v2 published release checkpoint — 13 October 2026

Content release PR #4 was merged; the script link was then versioned as `app.js?v=adult-v2` so earlier cached scripts are not reused. Public `challenge-library.json`, `app.js` and `index.html` were retrieved and compared byte-for-byte with the tested local files; all matched. The hosted library reports `adult-v2`.

Fresh Chromium checks on the published test URL passed:

- Single Phone rendered WAIST INVITATION from the replacement library; all five steps, conductor final reveal, +1 challenger score and role rotation worked. Stop returned to the opening screen.
- Remote room creation and independent second-tab joining worked. The joining player initially chose In Person and inherited the host's Remote mode. Both displayed FOREHEAD PAUSE with its remote text adaptation.
- A synthetic text answer was shared, challenger Complete was hidden, conductor Complete advanced both sessions to the same next prompt, and Stop closed the peer's room.
- The 360-pixel phone fixture rendered THE FIRST HUG through final reveal. Body content/scroll widths matched at 360, 390, 414 and 725 pixels (the landscape fixture has a native scrollbar). No horizontal overflow was observed. Only the small phone fixture was newly exercised through the full five-step flow; other sizes were inspected at the opening screen.

`qa-adult-v2.jpg` captures the newly published contact card and phone layouts. No personal answers or intimate media were used. The recorded 12 core/emulator and 3 hosted-client tests remain the comprehensive automated evidence for both multiplayer modes. The HTML-only script-link change was followed by 9 passing engine/library checks; it did not change gameplay logic or the library.

The original root game and production Firebase remain unchanged; root promotion still requires owner approval. Earlier rooms must Stop, both devices must reload, and players must create a fresh room.

## Owner-edited import — 13 October 2026

The owner supplied `challenge-library-proofread.json` and required unchanged wording. It replaced the runtime JSON byte-for-byte. All 1,000 IDs, metadata and five-step shapes are unchanged; only 89 titles and 1,733 prompts differ from the prior release. No coding correction was required. SHA-256 is recorded in `manual-import-validation.json`.

Eight engine/library checks passed; the duplicate-content test failed because the supplied file has 41 repeated five-step sequence findings. They were preserved, as required. The validator's INCOMPLETE label reflects those content findings; no structural errors were found. Earlier semantic audits and comprehensive multiplayer tests above apply to the previous release. The imported JSON is now canonical and protected from legacy source regeneration.

Published verification: the hosted library was downloaded and its SHA-256 matched the supplied attachment exactly (`496f68e632925234cfca4b17daa4cb4bf5ea62d79b587135eed740afd86be310`). A fresh Chromium Single Phone session rendered an imported prompt; Stop returned to the opening screen. The no-regeneration safeguard is saved in Git. `qa-manual-import.jpg` records the saved commit and unchanged original root files. No multiplayer logic or Firebase rules were changed during this import.

## Further owner-edited import — 13 October 2026

`challenge-library-PRODUCTION.json` replaces the earlier proofread import byte-for-byte. All 1,000 IDs, stages, modes, kinds, evidence types and five-step metadata match the previous library. No coding correction or wording edit was required. Forty-one exact extra repeated step sequences remain in the supplied file and are retained. Gameplay code and Firebase configuration are unchanged. The SHA-256 is recorded in `manual-import-validation.json`; earlier test results remain historical.


## Owner-edited library import — 14 October 2026

Imported the supplied challenge-library-PRODUCTION.json byte-for-byte, SHA256 d00e6785c2e425756eabaad179c5f608acb6e66582a5fe98337f21af8f487a97. No wording or coding corrections. Gameplay metadata unchanged. Structural validator passed: 1,000 variants, 500 concepts, 5,000 steps; required stage counts, unique IDs and five steps checked, no duplicate candidates detected.

Existing automated checks: 8 of 9 passed. The remaining check expects the literal phrase “via Snapchat”; the edited prompt instead says “Take a Snapchat photo”. This is a wording assertion, not a JSON or gameplay compatibility error; the owner's wording was preserved. Full multiplayer tests from earlier releases remain historical and were not rerun for this text-only import.


## Round progression and rename — 14 October 2026

Renamed the review game Behind Closed Doors: Unfiltered and changed the visible Nervous wording to Too Far. Fixed target to 15; removed score selection. Round 1 uses Warm-Up until combined score 7, Getting Personal until either score 12, then Extreme. Round 2 starts Getting Personal and switches at either score 10. Round 3 is Extreme throughout. Selection changes after a challenge ends, preserving active steps. Championship still counts round wins; scores reset between rounds.

Nine engine tests passed, including both modes, exact thresholds, a two-point threshold jump, active-card continuity, fixed-target enforcement, completion permissions, scoring, remote responses, no repeats and original-file preservation. App JavaScript syntax and referenced UI IDs checked. Latest owner-edited challenge file preserved; existing editorial wording assertion limitation remains as documented above.

Hosted browser verification: Single Phone setup shows the fixed 15-point rule with no target selector. Too Far controls function. Played all three rounds through visible controls: Round 1 changed at combined 8 (two-point jump over 7) and individual 12; Round 2 changed at individual 10; Round 3 stayed Extreme. Scores reset at each next round. The final screen recorded three round wins and the 0–3 championship result. Transport/Firebase configuration unchanged; a new two-device session was not rerun for this change.
