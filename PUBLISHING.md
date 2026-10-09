# Publish SAGA on GitHub

This package is configured for the public repository `jeremyrobertdavison/saga-foundry`. It is a **game system**, not an update to the old `saga-character-studio` module. No repository or release is created automatically by this ZIP.

## First publication using GitHub's website

1. Sign in to GitHub and create a new **public** repository named `saga-foundry`. Leave the initialization options unchecked because this package already contains its README and license.
2. Extract `saga-v0.1.2.zip` to a temporary folder on your computer.
3. In the new repository, choose **uploading an existing file** (or Add file → Upload files).
4. Drag the extracted **contents**, including folders, into the upload area. Do not upload only the ZIP as source code, and do not introduce an extra enclosing folder. The repository root must contain `system.json`, `README.md`, `scripts/`, `app/`, `styles.css`, `development/`, and the other supplied files.
5. Commit the upload to `main`.
6. Open **Releases** → **Create a new release**. Create the tag `v0.1.2` targeting `main`.
7. Name the release **SAGA 0.1.2 — First test release**. Describe it as experimental and requiring a new test world.
8. Attach both the original `saga-v0.1.2.zip` and the extracted `system.json` as release assets. GitHub's automatic “Source code” downloads are not substitutes for these named assets.
9. Publish the release. For the configured `/releases/latest/` manifest URL to resolve, this must be a published release marked latest, rather than a draft or prerelease. If you prefer a prerelease, use the version-specific manifest URL below for installation.
10. Open the two download URLs below in a browser to confirm the files are publicly accessible.

Release ZIP:

```text
https://github.com/jeremyrobertdavison/saga-foundry/releases/download/v0.1.2/saga-v0.1.2.zip
```

Version-specific manifest (also works for a published prerelease):

```text
https://github.com/jeremyrobertdavison/saga-foundry/releases/download/v0.1.2/system.json
```

Latest-release manifest:

```text
https://github.com/jeremyrobertdavison/saga-foundry/releases/latest/download/system.json
```

If you choose a different username or repository, edit `url`, `manifest`, and `download` in `system.json` before packaging and publishing. Update the README links too. Keep the system ID `saga` unchanged once worlds use it.

## Install from GitHub

1. In Foundry Setup, select **Game Systems**, then **Install System**.
2. Paste the manifest URL and install.
3. Create a new world using **SAGA**.
4. Leave the old Simple Worldbuilding world alone. Import Actor copies as described in the README.
5. Perform the live acceptance checklist in `VALIDATION.md` before inviting players.

Do not install this through Add-on Modules. The old SAGA Character Studio module is not needed in the new world.

## Future releases

1. Make and test the changes. If the creator changed, run the development build.
2. Increase `version` in root `system.json` and the development package files.
3. Update `download` to match the new release tag and ZIP filename. Keep `manifest` pointed at the latest-release manifest if using regular releases.
4. Update the changelog. Keep `compatibility.verified` set to the latest Foundry build actually tested. Removing it causes unknown compatibility, which Foundry 14 excludes from world creation.
5. ZIP the package contents with `system.json` at the archive root. Exclude `node_modules`, `.git`, private exports, backups, and older ZIPs. Include the built `app/` files, `scripts/`, styles, docs, licenses, and development source.
6. Commit and publish a new release with its matching ZIP and `system.json` assets.
7. Use Foundry's system update check, then test a backed-up world before continuing the campaign.

A release tag, the manifest's `version`, its `download` URL, and the uploaded asset name must all agree.
