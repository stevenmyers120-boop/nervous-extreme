# Nervous Extreme — existing-game upgrade branch

This is the **isolated upgrade awaiting hosted multiplayer verification and deployment approval**. The live original remains unchanged. Baseline: `7dec9af9363bec84d79db27226469adbbff5e245`. GitHub backup branch: `backup/pre-upgrade-2026-10-13`. Development branch: `upgrade/unified-2026-10-13`.

The room protocol is adapted from the working `distance.js`: anonymous membership, atomic guest claim, presence, ready checks, host-processed revision-tagged actions, server-adjusted clocks and session resume. A shared engine supplies all three playing modes through one `upgrade/index.html` entry point. Scoring retains the original 1-point challenger Nervous / 2-point conductor Nervous / 1-point full challenge rules and three-match championship. Only conductor controls can complete; remote completion also requires a submitted response. Decline gives no points; Stop is available even while the peer is absent. Offline Stop ends the local screen and defers room deletion until reconnect.

## Library and remaining verification

- The completed non-graphic library contains **500 authored concepts / 1,000 variants / 5,000 steps**, split 40 Warm-Up / 160 Getting Personal / 300 Extreme per mode. The editable source files are in `library-source/`; `scripts/build-library.mjs` creates JSON, and `scripts/validate-library.mjs` verifies its structure and screens similarity. Mode-specific physical adaptations are authored alongside their in-person steps.
- An isolated Spark-plan Firebase project `nervous-extreme-upgrade-test` is configured with anonymous authentication and locked-by-default Realtime Database rules. The app refuses the original production project ID.
- Frontend test URL (owner-private): https://nervous-extreme-upgrade-test.newcedar3.chatgpt.site . The original frontend checkpoint uses disabled multiplayer; configured GitHub Pages staging will be used for browser verification.
- The owner approved the **provocative, non-graphic adult content scope on 13 October 2026**. No intimate exposure, explicit sexual instructions, dangerous tasks or third-party contact are required.
- Abandoned room expiry revokes access but does not erase records. A scheduled server cleanup job is required for unattended deletion. Explicit Stop deletes the entire room.

## Run locally

Serve this directory over HTTP using your normal development server. Single Phone is independent of Firebase. The JS modules and JSON cannot run through `file://`.

## Isolated staging Firebase

Do not deploy to `nervous-extreme`. Use a separate Firebase project, enable anonymous Authentication and Realtime Database, and configure the new project's **public client configuration** in `firebase-config.json` with `enabled: true`. Set the matching staging database URL and project ID. Never put service-account keys or other credentials in this file.

`staging.rules.json` adds `upgradeRooms` and keeps both original namespaces exactly unchanged. `scripts/build-rules.py` reproduces it. `firebase.staging.json` configures only the local emulator; production `firebase.json` and `database.rules.json` remain untouched. Deploy these rules only to an explicitly selected staging project. Never change production rules or Pages settings before approval.

The host device remains authoritative and must stay online to process actions. Rules reject other players and guest completion requests on challenger turns; they do not provide a trusted server against a modified host client. Text is rendered through `textContent`. Photos/videos are never uploaded into Firebase.

## Tests

Install `jsdom`, `firebase@10.14.1`, `@firebase/rules-unit-testing@3.0.4` and `firebase-tools@13.35.1` in the development environment. Java 17 is required for the Database emulator.

```sh
node --test tests/engine.test.mjs
firebase emulators:exec --only database --project demo-nervous-upgrade --config firebase.staging.json 'node --test --test-concurrency=1 tests/engine.test.mjs tests/library.test.mjs tests/multiplayer.test.mjs'
node scripts/build-library.mjs
node scripts/validate-library.mjs
```

For a development environment with an outbound HTTP proxy, exclude loopback addresses or remove the proxy variables only from the emulator-test child process. The Firebase SDK's WebSocket connection needs direct loopback access. Expected permission-denied warnings are negative security tests.

Keep the original Pages deployment intact. A future tested replacement can be made the main entry point after the owner's deployment approval.

## Verified checkpoint — 13 October 2026

11 automated tests passed: original-file preservation, complete library schema/counts, scoring, final-step locks, custom responses, complete stage-pool exhaustion, single-phone controls, and independent two-client in-person/remote emulator play including role changes, resume, restricted writes and offline Stop cleanup. JS syntax checks passed. Exact-duplicate and token-similarity screens found no candidates at their configured thresholds; these screens are not proof of semantic uniqueness. The five-step ladders were authored and inspected for disclosure or performance progression and practical evidence. Real-phone browser layout and hosted Firebase behaviour remain unverified. Staging Firebase is now configured; production was not changed. Guest Decline validation is covered by both multiplayer modes.
