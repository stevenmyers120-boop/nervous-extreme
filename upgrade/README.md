# Nervous Extreme — existing-game upgrade branch

This is an **incomplete engineering checkpoint**, not the complete approved replacement. The live original remains unchanged. Baseline: `7dec9af9363bec84d79db27226469adbbff5e245`. GitHub backup branch: `backup/pre-upgrade-2026-10-13`. Development branch: `upgrade/unified-2026-10-13`.

The room protocol is adapted from the working `distance.js`: anonymous membership, atomic guest claim, presence, ready checks, host-processed revision-tagged actions, server-adjusted clocks and session resume. A shared engine supplies all three playing modes through one `upgrade/index.html` entry point. Scoring retains the original 1-point challenger Nervous / 2-point conductor Nervous / 1-point full challenge rules and three-match championship. Only conductor controls can complete; remote completion also requires a submitted response. Decline gives no points; Stop is available even while the peer is absent. Offline Stop ends the local screen and defers room deletion until reconnect.

## Incomplete work

- The included earlier non-graphic starter deck is **30 concepts / 60 variants / 300 steps**, not 500 / 1,000 / 5,000. It has 10 cards per stage per mode, rather than 40 / 160 / 300. `scripts/validate-library.mjs` deliberately fails the required counts. Do not describe this checkpoint as a full game upgrade.
- No remote staging Firebase project is configured. `firebase-config.json` disables network multiplayer and refuses the production project ID. The mode screens are implemented, but room creation on a hosted copy requires separate staging configuration.
- No deployed test URL or browser/mobile visual QA yet. JSDOM verifies actual control interactions, not browser layout or real phone behavior.
- The requested explicit sexual dares are not generated. A full new library would need a non-graphic scope agreement.
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
firebase emulators:exec --only database --project demo-nervous-upgrade --config firebase.staging.json 'node --test --test-concurrency=1 tests/*.test.mjs'
node scripts/validate-library.mjs
```

For a development environment with an outbound HTTP proxy, exclude loopback addresses or remove the proxy variables only from the emulator-test child process. The Firebase SDK's WebSocket connection needs direct loopback access. Expected permission-denied warnings are negative security tests.

Keep the original Pages deployment intact. A future tested replacement can be made the main entry point after the owner's deployment approval.
