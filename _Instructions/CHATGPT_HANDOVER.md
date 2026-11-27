# ChatGPT handover – ModuleHandbook

Read this before working on the project. It transfers project knowledge to a new ChatGPT instance; it does not replace checking the live repository.

## Repository
- Repository: https://github.com/JirkaDellOro/GMB_Handbook
- Base branch: `main` (last verified HEAD: `3ed33e741402aab23eebe3e086ad6d48022e7feb`).
- Current working branch: `module-table-data`. Continue working there until the user explicitly asks to merge or switch branches.
- Static HFU module-handbook site, published through GitHub Pages.
- Programme directories: `AIN/`, `GMB/`, `GMBcorrect/`. GMBcorrect is a deliberate parallel/corrected variant and must be preserved.
- Shared application, styles and assets live in `_System/`.
- Project instructions are stored in `_Instructions/`: this handover and `PDF_TO_MODULEHANDBOOK.md`.
- `_System/programmes.json` registers programme landing pages and their specifics files.

## Programme directory
A programme normally contains:
- `index.html`: page shell, shared CSS/JS references into `../_System/`
- `specifics.json`: programme metadata and SPO-specific text
- `curriculum.json`: complete study-plan hierarchy, semester membership, ordered module references and visual placements
- `modules/*.json`: module descriptions
- `assets/images/cover-photo.jpg`: cover image

Module references are stored directly in `curriculum.json` as relative paths such as `modules/code1.json`. Each module's `id` must match its filename stem. Cross-programme references can be relative paths such as `../GMB/modules/code1.json`; do not duplicate shared modules without checking first. Programme `manifest.json` files have been removed.

## Data model
### specifics.json
Follow `SpecificsData` in `_System/src/types.ts`. Main fields: `title`, `programme` (official name including degree), `section`, `code`, `spoVersion`, `paragraphs` (each has `text`, optional `items`), optional `lastChange`. Display name and degree are derived from `specifics.json.programme`. Never hardcode programme name/degree in HTML or shared rendering code.

### curriculum.json
Follow the live `CurriculumFileData` and normalized `CurriculumData` types in `_System/src/types.ts`.

The file stores the complete hierarchy:
- `studyStages`: ordered sections with `title` and `semesters`
- semester: `semester` number and ordered `modules`
- a simple module entry: `id`, `file`, optional `column`, `block`, `style`, `span`, `track`
- a specialization group: `title` and nested `modules` array containing simple module entries

A group is recognized by having both `title` and `modules`; no explicit type field or group ID is needed. The hierarchy is normally **study stage → semester → module**, or **study stage → semester → specialization → module**. Presentation columns are layout metadata, not a content hierarchy.

For AIN the specialization group titles are the official names: Software Engineering, Applied Artificial Intelligence, Medieninformatik. The `track` codes (SWE, AAI, MIN) remain on individual module entries for the existing displays. The former `moduleNumber` is represented as optional `block` on each module entry; it preserves the sequence of specialization modules 1–4 and is not the specialization group title.

There is no separate `manifest.json`. The application normalizes `curriculum.json` into module placements and semester groups for rendering. Keep the data order chronological by semester and preserve module order within each semester. AIN and GMB use different layouts: use the closest matching live example, not copied academic content.

### Module JSON
Required: `id`, `title`. Optional fields are defined in `_System/src/types.ts`. Common fields:
- metadata: `module_code`, `semester`, `workload_hours`, `credits`, `frequency`, `duration`
- `components`: `label`, `name`, `language`, `contact_hours`, `self_study_hours`, `class_size`, `course_type`, `credit_points`
- `learning_outcomes_intro`, `learning_outcomes`
- `individual_component_content`, `teaching_methods`, `prerequisites`
- `assessment`: `component`, `code`, `description`, `graded_assessment`, `credits`
- `applicability`, `responsible_person`, `lecturers`, `reading_list`

Use exact property names and types from live interfaces and examples. Omit unavailable optional fields; do not invent fields or fill unknowns with guesses, empty strings, zero or null.

## Technical architecture
- `_System/src/*.ts`: TypeScript source.
- `_System/js/*.js`: generated browser JS; keep synchronized with source.
- `_System/assets/css/`: shared styles.
- `_System/programmes.json`: programme registry.
- `_System/scripts/validate-json.mjs`: JSON syntax, module IDs, nested curriculum structure and missing component-credit warnings.
- `_System/package.json`: `npm run check` runs build, tests and JSON validation.

Do not edit generated JS independently. After TypeScript changes, build and test. CSS belongs in stylesheets, not TS/JS.

## Non-negotiable working rules
- Treat `main` as authoritative unless the user explicitly specifies another branch.
- Fetch the current HEAD of the explicitly selected working branch immediately before every GitHub edit.
- Use compare-and-swap when updating the branch: exact old HEAD as `expected_sha`; never overwrite a newer commit.
- Inspect relevant files before editing; remembered contents may be stale.
- Make only requested changes and report exact changed files.
- Preserve GMBcorrect.
- Do not alter academic module content, credits or examinations unless explicitly requested; these belong to module owners.
- No programme-specific hardcoded fallbacks or duplicated programme data.
- Prefer CSS-only changes for presentation requests. Avoid unnecessary logic changes.
- Responsive design is mandatory. No absolute positioning for normal layout content; no programme-specific CSS exceptions.
- Table 1 has an intentional max-width; do not expand it on very wide screens.
- Do not alter/refactor Tables 2 and 3 unless asked; their widths have been deliberately tuned.
- TypeScript style: camelCase, PascalCase types/classes, explicit types for variables/parameters/returns, no `any`, underscore-prefixed parameters, semicolons, double quotes, constants instead of magic numbers, readable top-down structure, short functions and shallow nesting.
- Keep TS and generated JS synchronized.
- User pulls changes themselves. Never claim local or deployed success unless verified.

## GitHub edit procedure
1. Fetch `https://api.github.com/repos/JirkaDellOro/GMB_Handbook/branches/module-table-data`.
2. Record the current commit SHA and tree SHA.
3. Fetch and inspect target files from `module-table-data`.
4. Create blobs and a tree based on the fetched tree SHA.
5. Create a commit whose parent is the fetched HEAD.
6. Update `refs/heads/module-table-data` with `expected_sha` equal to that old HEAD.
7. Fetch the branch again and verify the new HEAD. If compare-and-swap fails, reconcile against the new HEAD; do not blindly retry. Do not modify `main` unless explicitly asked.

## Current state at handover
The current working branch `module-table-data` contains the unified curriculum model. All three programme `manifest.json` files are removed. AIN uses nested specialization groups for Software Engineering, Applied Artificial Intelligence and Medieninformatik; module sequence numbers are stored as `block`. GMB and GMBcorrect use the same stage → semester → module structure without specialization groups. The app derives semester lists and placement data from `curriculum.json`. Tests and JSON validation were extended for the new schema. The user has not yet asked to merge this work into `main`.

## Collaboration
The user is technically experienced and expects concise, precise communication. Avoid generic progress messages, speculative changes and overstated verification. Ask one focused question only when a decision blocks safe work.
