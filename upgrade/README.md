# Nervous Extreme — unified upgrade test

Working test URL: https://stevenmyers120-boop.github.io/nervous-extreme/upgrade/

The original root game remains unchanged. Every original tracked file matches baseline commit `7dec9af9363bec84d79db27226469adbbff5e245`, preserved on `backup/pre-upgrade-2026-10-13`. Development is preserved on `upgrade/unified-2026-10-13`. Only the additive `upgrade/` directory is published for testing. Replacing the root entry point still requires the owner's approval.

## Implemented

- One entry point: Single Phone, Multiple Devices In Person, Multiple Devices Remote. Joining inherits the host's mode.
- Existing scoring and room/action protocol adapted into a shared engine: challenger Nervous awards conductor 1; conductor Nervous awards challenger 2; completing five steps awards challenger 1. Three matches, selectable 10/15/20 targets, final-step reveal, optional timers and custom surprise rounds.
- Dark crimson mobile layout, orange glow, bold distressed typography, real accessible controls, shared scores, challenge cards and room screens.
- Conductor-only completion. Shared text answers for remote truths; Snapchat photo/video evidence markers for remote dares. No media uploads into the database. Custom challenges accept any topic within the overall rules.
- No repeated concept within a game, eligible current-stage selection, fresh pools for new games and graceful stage exhaustion.
- Decline skips without points. Stop closes the local game immediately, queues deletion even while offline and retries after reconnect/session resume. Late callbacks from the ended session cannot overwrite the final message. Submitted answers clear at the next step; selection history clears at championship completion.

## Challenge library — adult-v2

The library was completely rewritten after the owner rejected the previous deck's tone. Every card is now adult-personal or sexually relevant, with 105 contact-centred cards and 154 in-person dares. All 30 agreed terms are represented. See `CONTENT-REVIEW.md` and `content-audit.json`. The library has **500 authored concepts, 1,000 mode variants and 5,000 steps**. Editable packed source is in `library-source/`; `scripts/build-library.mjs` produces the maintainable JSON.

| Stage | In Person | Remote |
|---|---:|---:|
| Warm-Up | 40 | 40 |
| Getting Personal | 160 | 160 |
| Extreme | 300 | 300 |
| Total | 500 | 500 |

Each variant has its own ID, title, stage, category, mode, five progressive prompts and evidence metadata. Physical adaptations are authored alongside their remote alternatives. Exact-duplicate and token screens found no candidates. TF-IDF review led to several concept rewrites; one shared forearm-art motif is documented and retained as two different authored objectives. Similarity screens do not prove semantic uniqueness; the authored ladders were inspected for disclosure/performance progression and practical evidence.

## Isolated Firebase

The no-cost Spark project `nervous-extreme-upgrade-test` has anonymous authentication and Realtime Database in Belgium. `firebase-config.json` contains its public Web SDK configuration; the app refuses the original production project ID. No service-account credentials are included.

`staging-only.rules.json` is deployed to this separate project. `staging.rules.json` additionally retains both old namespaces exactly for preservation tests. `scripts/build-rules.py` generates both. Production `firebase.json` and `database.rules.json` are untouched.

Rules restrict membership, guest claims, readiness, revision-tagged actions, role permissions and payload sizes. The host phone processes actions and must remain connected; this architecture does not prevent a modified host from cheating. Submitted text is visible to the partner and stored temporarily in Firebase; screenshots cannot be prevented. Snapchat is an external manual evidence channel.

## Verification — 13 October 2026

See `QA-REPORT.md`, `CONTENT-REVIEW.md`, `test-results.txt` and `hosted-test-results.txt`.

- 12 engine/library/actual-control emulator tests passed, including adult-v2 content coverage and old-room compatibility.
- 3 tests with actual anonymous accounts and independent connections to hosted staging Firebase passed.
- Comprehensive Chromium mechanics checks passed on the preceding release. Fresh adult-v2 checks passed for Single Phone five-step completion/scoring, remote joining and mode inheritance, shared text, conductor permissions, synchronisation and Stop; see the QA release checkpoint.
- Four phone-sized iframe viewports were inspected and exercised: 360×740, 390×844, 414×896, 740×360. No horizontal content overflow; setup, completion, Decline and Stop worked.

Physical Android/iOS devices and Safari were not available. Snapchat transmission itself was not automated; the game's instructions and evidence marker were verified. Room expiry revokes access after four hours but does not delete unattended abandoned records; a scheduled server cleanup service would be required for that. Explicit Stop deletes the entire room. Completed games clear text and selection history.

## Development

Use Node 24.15+ and Java 17. Install pinned development dependencies with `npm install`. Serve this directory over HTTP; ES modules and JSON cannot run through `file://`.

```sh
npm run validate
firebase emulators:exec --only database --project demo-nervous-upgrade --config firebase.staging.json 'npm test'
npm run test:hosted
```

Hosted tests guard against any project except the isolated test project and create disposable anonymous accounts/rooms. Expected permission-denied warnings are negative security tests. For an environment with an outbound proxy, exclude loopback or remove proxy variables only from the emulator-test child process; do not remove the external networking configuration from hosted tests. `qa.html` provides the browser layout fixtures.

Existing rooms from the earlier library must stop and restart after both devices reload. The IDs and version check deliberately prevent silent challenge substitution. Previous content remains in Git at `e292c9a0f4ec742630b468d4da6f71ca285b1807`.
