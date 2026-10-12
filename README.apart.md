# Nervous Extreme · Apart

Play at https://stevenmyers120-boop.github.io/nervous-extreme/distance.html

A separate two-player, separate-location game. The original index.html and its rooms namespace remain unchanged.

- 120 solo, suggestive non-explicit challenge steps across three matches.
- Shared submitted text answers; drafts remain on the answering device.
- Photo/video evidence is sent privately through Snapchat, never uploaded here.
- Only the current conductor can complete a submitted response. The challenger can mark evidence sent or submit an answer. Roles alternate each round.
- Custom truths require text; custom dares require photo or video evidence. Custom topics remain freeform.
- Original scoring: completed five-level challenge or custom round +1 to challenger; challenger NERVOUS +1 to conductor; conductor NERVOUS +2 to challenger.
- Anonymous authentication, two-member distanceRooms, expiry after about four hours, revision-checked action queue, host-authoritative state. Host must reconnect to process actions.
- Compact room menu, scrollable responses and controls, no-penalty optional timer.

Build: node build-distance.mjs. Publish distance.html and database.rules.json. Builders, deck, template and distance.test.mjs are retained for maintenance. For local tests install firebase@10.14.1, firebase-tools@14.22.0, @firebase/rules-unit-testing@3.0.4 and jsdom@26.1.0, then run the test with the database emulator. No changes to the original page.

Verification: Firebase Realtime Database emulator with independent authenticated clients and jsdom. Tests cover denied outsiders/unauthenticated access, occupied rooms, guest state writes, wrong-player actions, final reveal, custom answers/evidence, safe text rendering, role swaps, nervous scoring, resume, three matches and closed-room access.

Physical iPhone/Android testing must verify on-screen keyboard, Snapchat switching, browser background suspension, clipboard/share and small-screen control visibility. Snapchat sending/review is manual; this game cannot verify the contents or delivery of a Snap.
