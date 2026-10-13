# Adult content replacement — library adult-v2

The replacement contains 500 authored source cards, 1,000 mode variants and 5,000 steps. Stage distribution remains 40 Warm-Up / 160 Getting Personal / 300 Extreme in each mode.

This is a complete content rewrite following the owner's rejection of the previous deck's tone. The previous library and working application are retained in Git at commit `e292c9a0f4ec742630b468d4da6f71ca285b1807`. Original production baseline `7dec9af9363bec84d79db27226469adbbff5e245` remains on `backup/pre-upgrade-2026-10-13`.

## Content direction

- Every card concerns personal adult attraction, sexuality, intimacy, sexual history, body confidence, underwear, grooming, affectionate contact or intimate communication.
- No weather reports, theatrical auditions, childish roleplay, generic personality tests, dancing, unrelated hobbies or invented press conferences.
- All 30 agreed terms occur in the in-person prompts. Vocabulary is attached to its actual subject rather than added to unrelated questions. Exact counts are in `content-audit.json`; these exclude titles and do not double-count shared remote variants.
- 105 cards centre on in-person affectionate contact. The 154 in-person dares include handholding, close conversation, hugs, deep kissing, tongue-contact preferences, self-guided arm/shoulder/clothed-leg/waist contact, gentle massage and skin-safe forearm art.
- Questions include breasts/boobs/tits/nipples, penis/cock/dick/balls, pussy/vagina, pubic hair, masturbation, oral sex, blowjobs, anal sex, orgasm, kink and fetish terminology. They ask for factual personal preferences or history; they do not ask for graphic descriptions or instruct sexual acts.
- Questions become more direct and personally revealing across the five steps. Contact cards progress through an invitation, guided non-intimate contact and a requested affectionate endpoint. Evidence cards progress through increasingly personal choices or a finished artifact. Disclosure and confidence are subjective; a numerical step label alone does not certify intensity.

## Mode adaptations

In-person contact dares have separately authored remote prompts about the corresponding preference, invitation or adult experience. The remote version uses text rather than pretending a distant player can touch or kiss someone.

Remote distribution: 451 text cards, 47 Snapchat-photo cards and 2 Snapchat-video cards. Media is limited to garments alone, paper, ordinary objects or non-intimate forearm art. No nude or intimate images, sexual performances or third-party contact are required. Custom remote truths still use text and custom dares still require Snapchat evidence.

The overall rules retain consent, boundaries, Nervous, no-point Decline and Stop. All participants and past intimate experiences are adults; answers stay non-graphic and do not identify other people. Skin-safe pens are required for forearm art. No sexual breast/genital touching or sexualised exposure dares are included.

## Duplicate review

Exact whole-card and token-Jaccard screening found no duplicate candidates. TF-IDF screening prompted removal or rewriting of closely overlapping kissing, guided-leg, massage, forearm and clothing cards. The remaining high-similarity pair is explicitly documented: self-selected adult lettering on a forearm versus a partner-created crude penis drawing and caption. They share a material/location but have different authored objectives. Recurring themes and contact endpoints remain; these methods cannot prove semantic uniqueness.

## Compatibility and verification

New `adult-v2-` concept IDs prevent an existing room's old ID from silently displaying new content. The frontend fetches the library without browser caching and checks its version. When an earlier room's task is missing, completion controls are hidden, Stop remains available and the screen requests a fresh room after both devices reload. No production Firebase rules/configuration changed.

The library schema, all counts, five-step shapes, IDs, evidence types, vocabulary coverage and contact pool are covered by validation/tests. The full source can be edited in `library-source/`, rebuilt with `scripts/build-library.mjs` and screened with `scripts/validate-library.mjs` and the optional Python/scikit-learn `scripts/audit-content.py`.
