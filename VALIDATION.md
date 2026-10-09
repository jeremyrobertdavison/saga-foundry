# Validation for 0.1.1

Completed locally:

- 0.1.1: all eight sample sheet rows exercised in a DOM simulation; correct attribute and linked formulas, actor speaker, roll visibility, read-only restrictions, and unchanged Play Mode state.

- TypeScript check and production creator build.
- 18 automated tests covering rules, save/reopen/edit, ownership, creation permission, conflicts, Play Mode state, import copies, preservation of source backups, and iframe HTML handling.
- DOM smoke checks of native sheet edit/play controls, resource saves, read-only access, escaped character names, and legacy formula editing.
- Native sheet smoke check with the supplied Witchling Actor export; the export is not distributed in this public package.
- React creator mounts an existing Actor in both edit and Play Mode through the standalone system bridge.
- Integration APIs checked against Foundry's public v14 documentation.

The automated integration tests use Foundry mocks and DOM simulation, not a running Foundry server. The maintainer confirmed world creation, character creation, sheet opening, and Play Mode on Foundry 14.368. The manifest now declares that tested build. New sheet rolls still need live confirmation. Browser screenshots, real multiplayer sessions, token behavior, server permissions, portrait uploads, and real Foundry schema validation still need live testing.

## Live acceptance checklist

Use a new Foundry 14 SAGA world with no add-on modules enabled initially.

1. Launch the world. Confirm no startup errors or missing script requests.
2. Create a blank Actor from Foundry. Double-click it and confirm the SAGA sheet opens.
3. Open the creator, complete a character, save it, close both windows, and reopen the Actor.
4. Edit its name and allocations, save, and reopen again. Confirm no duplicate Actor was created.
5. Open Play Mode from the sheet. Roll one attribute and one linked skill/power. Check the chat formulas.
6. Change Heroism and conditions, close, reload Foundry, and confirm they persist.
7. As a non-GM Owner, repeat edit and roll. As an Observer, confirm the sheet is readable and not editable.
8. Import an old module-managed Actor and a formula-only export. Confirm new IDs, preserved formulas, biography, images, and trackers. Rebuilding a legacy Actor must retain its source backup.
9. Load a .sagaChar file in the creator and save it. Test text/PNG/.sagaChar export.
10. Place a linked token and open its sheet. Confirm it uses the world character. Confirm unlinked-token creator access shows the explanatory message.
11. Check portrait upload permissions and Foundry roll visibility modes.
12. Have another owner change the Actor while an editor is open. Confirm stale saves are rejected.

Keep the previous world and exports until these checks pass on your server.
