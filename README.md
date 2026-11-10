# GMB Module Handbook

Static website for the B.A. Games & Immersive Media module handbook. The site uses plain HTML, external CSS, TypeScript source files and browser JavaScript. Module content is stored in individual JSON files and loaded at runtime with `fetch()`.

## Structure

- `index.html` – landing page
- `modules.html` – dynamically generated module list
- `module.html?id=code1` – shared module detail view
- `modules/*.json` – one JSON file per module
- `modules/manifest.json` – list of module IDs and JSON filenames
- `src/*.ts` – editable TypeScript source
- `js/*.js` – compiled JavaScript loaded by the browser
- `assets/css/style.css` – external stylesheet
- `assets/images/` – existing visual assets

Module IDs and filenames do not contain hyphens, e.g. `code1.json`, `sound1.json`, `project1.json`.

## Local preview

Because the browser loads JSON via `fetch()`, do not open the HTML files directly with `file://`. Start a local static server in the repository root, for example:

```sh
npx serve .
```

Then open the local URL printed by the server.

## Editing TypeScript

Install TypeScript if necessary and compile after changing files in `src/`:

```sh
npm install --save-dev typescript
npx tsc -p tsconfig.json
```

The generated files in `js/` are committed as well, so GitHub Pages can serve the site without a build pipeline. Keep `src/` and `js/` synchronized by compiling before publishing.

## Adding a module

1. Add a JSON file to `modules/`, e.g. `newmodule.json`.
2. Set its `id` field to exactly `newmodule`.
3. Add an entry to `modules/manifest.json` with `id`, `file`, `title`, `semester` and `credits`.
4. Keep the JSON structure aligned with `src/types.ts`.

## Publishing on GitHub Pages

Publish the repository root from the `main` branch using **Settings → Pages → Deploy from a branch → main → /(root)**. No Jekyll, Ruby, plugin or server-side build is required.
