# Jekyll Module Handbook – Test Project

This is a small GitHub Pages/Jekyll test site for the Games & Immersive Media B.A. module handbook.

## What is included

- One sample module: **Code 1**, extracted from PDF pages 10–12 of the supplied module handbook.
- Structured JSON data in `_data/modules/code-1.json`.
- A reusable Jekyll layout in `_layouts/module.html` that renders module data.
- A module listing and a landing page.
- Responsive screen styling and a basic print stylesheet.
- Three extracted image assets from the original PDF (logo, cover photo, running header mark).

The text is based on the PDF text extraction. It has not been editorially corrected. The project is a technical demonstration, not a complete or officially checked module handbook.

## Publish on GitHub Pages

1. Create a new repository on GitHub, for example `gmb-module-handbook`.
2. Upload **all files and folders inside this project folder** to the repository root (not the enclosing ZIP folder).
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for the Pages deployment. GitHub will show the public URL in the Pages settings.

No local Ruby/Jekyll installation is needed to publish through GitHub Pages.

## Add another module

1. Add a JSON file to `_data/modules/`, e.g. `code-2.json`.
2. Copy `modules/code-1.md` to `modules/code-2.md` and change `module_id`, `title`, and `permalink` in its YAML front matter.
3. The module appears automatically in the module list, provided its JSON filename (without `.json`) matches `module_id`.

The JSON structure should use arrays for lists and repeated content. Keep the key names consistent with the sample unless the data model is deliberately revised.

## Important GitHub Pages note

The project intentionally uses only built-in Jekyll features and no custom plugins, to keep it compatible with GitHub Pages' standard build process.

## Local preview (optional)

If Ruby and Jekyll are installed, run:

```sh
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000/`.

### Repository name and base URL

The sample `_config.yml` assumes that the repository is named `gmb-module-handbook`, so the project site URL is expected below `/gmb-module-handbook/`. If you choose a different repository name, change `baseurl` in `_config.yml` to `/<your-repository-name>`. If you publish at a user/organization root domain, use an empty `baseurl` instead.
