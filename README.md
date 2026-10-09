# SAGA for Foundry Virtual Tabletop

SAGA is a standalone superhero roleplaying game system for **Foundry VTT 14**. It includes the SAGA character creator, native character sheets, and Play Mode. It does not require Simple Worldbuilding, the SAGA Character Studio module, Google AI Studio, or an AI API key.

**Version 0.1.0 is an experimental first release.** Automated checks pass, but a live Foundry 14 playtest is still required. Use a new test world before moving a campaign. Foundry 13 is not supported by this package.

## Features

- Guided character creation: details, attributes, skills, powers, and weaknesses.
- Save directly to Foundry Actors; reopen the same Actor with **Edit Character**.
- **Play Mode** from the character sheet, with Foundry chat rolls, Heroism, conditions, and roll history.
- Attribute checks roll only their die. Skills and powers roll their die plus linked attribute points.
- Existing creator themes, rules reference, read-aloud support, and `.sagaChar`, text, and PNG exports.
- Import copies of exported Simple Worldbuilding or SAGA Actors.
- Native Foundry V2 character and basic item sheets, ownership checks, and stale-editor conflict detection.

## Installation

After this repository's release assets have been published, open Foundry Setup → **Game Systems** → **Install System** and paste:

```text
https://github.com/jeremyrobertdavison/saga-foundry/releases/latest/download/system.json
```

Install SAGA, create a **new world**, and select **SAGA** as its game system. The manifest above becomes available only after the maintainer publishes the release; see [PUBLISHING.md](PUBLISHING.md).

For local testing before publication, stop Foundry, create `Data/systems/saga/` inside your Foundry User Data directory, and extract the release ZIP into that directory. `system.json` must sit directly inside `Data/systems/saga/`, alongside `scripts/`, `app/`, and `styles.css`. Restart Foundry and create a new SAGA world.

## Create and edit a character

1. Open the Actors directory and click **SAGA Character Studio**.
2. Complete the guided creation steps, or use **Load Hero** to load a `.sagaChar` save.
3. Click **Save to Foundry**. This creates a character Actor owned by the saving user.
4. Close the creator and double-click the Actor. Its native SAGA sheet should open.
5. Click **Edit Character** to revise that Actor, or **Play Mode** to use it during a session.

Players need Create Actors permission to create new characters. Alternatively, a GM can create a blank character, assign Owner permission, and have the player open its creator. Uploading a new portrait requires File Upload permission. Portraits and token artwork already assigned to an Actor are preserved when editing its build.

Save before closing the creator. Export `.sagaChar` progress before reopening after a conflict warning. Opening an Actor already in the creator brings its existing window forward; use the creator's navigation to switch modes.

## Move characters from Simple Worldbuilding

**Keep the original world intact. Do not change its system ID or copy its database into a SAGA world.**

1. Back up the old world.
2. In its Actors directory, right-click a character and choose **Export Data** to save its JSON.
3. Launch the new SAGA world.
4. Click **Import SAGA / SWB Actor copy** in the Actors directory and select that JSON.
5. Open the new Actor and check its artwork, biography, resources, and formulas.
6. If it contains a saved SAGA Character Studio build, **Edit Character** and **Play Mode** are immediately available.
7. If it contains formulas only, those formulas remain on the sheet with roll buttons. Use **Open Character Creator**, then load a `.sagaChar` save or choose **Enter missing build choices** to reconstruct the build with reviewed allocations. Saving replaces the SAGA formula groups with the new build.

The importer creates a new Actor with a new ID and gives the importing user ownership. The GM must reassign player permissions. New copies use linked tokens. Portrait and token image paths are retained, but image files are not copied; transfer them or correct their paths if moving servers.

The original export is retained in `system.legacyBackup.source`. Item names, images, descriptions, and quantities become basic SAGA items; each item's original data is retained in its backup. Old active effects, sheet assignments, folder links, and system-specific item behavior are not activated. They remain in the source backup for manual review. Importing does not migrate scenes, journals, compendiums, macros, or world settings.

Dice tiers do not uniquely identify point allocations. Legacy formulas cannot supply missing level, skill links, or point totals reliably, so the importer does not guess. Legacy roll buttons roll their stored formula only; they do not apply Play Mode conditions or award Heroism.

## Rules and current limits

Attribute, skill, and power pools are respectively 5, 6, and 5 points per level. Play Mode applies Injured and Empowered roll modifiers, handles Heroism, and includes the existing creator's condition reminders and restrictions. It is not a complete combat automation engine.

SAGA uses narrative turn order. Manage turns manually; the system does not supply a SAGA initiative roll. Optional health and power fields are generic campaign trackers, not new SAGA rules.

The creator edits world Actors. Use linked tokens; editing an unlinked token's independent build or Play Mode state is not supported in this release. Actor-level condition lists are not automatically synchronized to Foundry token status icons. Generic items have no automatic equipment or combat effects.

The React creator runs inside a local iframe. It loads bundled assets through `srcdoc` so Foundry 14 serving HTML as plain text does not display source code instead of the app. It uses no hosted AI service. Browser read-aloud support depends on available browser voices.

## Development

The runtime is at the repository root. Creator TypeScript and development tooling are in `development/`:

```sh
cd development
npm ci
npm run check
npm test
npm run build
```

The build updates the root `app/` directory. Foundry integration lives in root `scripts/`; tests in `development/tests/` exercise those files. Commit the built `app/` assets when releasing. See [VALIDATION.md](VALIDATION.md) for checks completed and live acceptance steps, and [PUBLISHING.md](PUBLISHING.md) for GitHub hosting.

## Feedback and licensing

Report the Foundry build, SAGA version, reproduction steps, and console errors with bug reports. Remove private campaign material before posting Actor exports publicly.

See [LICENSE](LICENSE) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). This project is not affiliated with Foundry Gaming LLC.
