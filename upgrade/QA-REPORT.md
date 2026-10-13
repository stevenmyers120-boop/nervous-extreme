# Upgrade acceptance checks — 13 October 2026

Test URL: https://stevenmyers120-boop.github.io/nervous-extreme/upgrade/

## Automated results

| Check | Evidence | Result |
|---|---|---|
| Original files and old rules preserved | engine preservation tests; Git diff against baseline | Passed |
| 500 concepts / 1,000 variants / 5,000 steps; 40/160/300 per mode | library validator and library tests | Passed |
| Unique IDs, five-step schema and evidence metadata | library tests | Passed |
| Exact and near-duplicate screening | token Jaccard ≥0.65; TF-IDF cosine >0.48 | No candidates |
| Scoring, stage transitions, exhaustion and fresh pools | engine tests; all 500 concepts exhausted per mode | Passed |
| Single Phone controls, consent, final reveal, Nervous and Stop | actual app in JSDOM | Passed |
| Both multiplayer modes, room joining and mode inheritance | independent Firebase emulator clients; hosted anonymous clients | Passed |
| Outsider/unauthenticated access and challenger completion rejected | negative rules tests | Passed |
| Conductor rotation, timer state, retry, text clearing and XSS-safe rendering | multiplayer tests | Passed |
| Custom truth/text and dare/photo/video markers | multiplayer tests | Passed |
| Session resume, championship and temporary history clearing | multiplayer tests | Passed |
| Online Stop during a pending action; offline Stop queues deletion before reconnect | regression assertions in both environments | Passed |
| Late ended-session callbacks do not replace Stop message with a permissions error | regression assertions | Passed |

The final emulator suite reports **11 passed, 0 failed**. The hosted suite reports **3 passed, 0 failed**. Authentication is real anonymous Firebase authentication in hosted tests; JSDOM wraps the app controls and the SDK connections are independent. Browser authentication/token values are never extracted. JavaScript syntax checks and JSON validation passed. Raw outputs are saved alongside this report.

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

The Snapchat evidence check uses a synthetic test acknowledgement, not a real media transfer. No player data or intimate media was used in testing.

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
