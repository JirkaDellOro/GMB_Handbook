# PDF to ModuleHandbook – instructions for an AI

## Task and expected result
Convert the supplied existing module-handbook PDF into a complete programme directory for the HFU ModuleHandbook website. Return that directory as a ZIP. The requester has read-only access to the public repository; do not assume GitHub write access.

Repository: https://github.com/JirkaDellOro/GMB_Handbook

## 1. Inspect the live repository first
Use the public GitHub interface before extracting data. Do not rely on this instruction alone for the current schema. Read:
- `AIN/specifics.json`, `AIN/curriculum.json`, one AIN module JSON
- `GMB/specifics.json`, `GMB/curriculum.json`, one GMB module JSON
- `_System/src/types.ts`, `_System/programmes.json`, `AIN/index.html` or `GMB/index.html`

AIN and GMB have different curriculum layouts. Choose the closest structural template based on the PDF. Use GMBcorrect only if explicitly requested.

## 2. ZIP structure
Create a folder named with the acronym for the programme, e.g. `ABC/`:
```
ABC/
  index.html
  specifics.json
  curriculum.json
  assets/images/cover-photo.jpg
  modules/module-id.json
```
Copy the page shell and a suitable cover image from the chosen live programme. Adjust the root `lang` attribute to the handbook language. Preserve shared CSS/JS references to `../_System/`. Do not include shared application code or edit `_System/programmes.json`; the maintainer will register the new programme after receiving the ZIP.

If your environment cannot create files and ZIP archives, say so clearly. Never claim to have created an archive that does not exist.

## 3. Extract the entire PDF
Read every relevant page, including tables, footnotes, appendices and all module descriptions. Use OCR/page inspection when needed. Keep page references in working notes so every value can be traced.

Extract, where present:
- official programme title, degree, programme code, SPO version and programme-specific regulations
- semester structure, module order and study stages
- all module titles, identifiers/codes and semester assignments
- workload, credits, frequency and duration
- components/courses, languages, course types, contact/self-study hours, class size and component credits
- learning outcomes and categories
- component-specific content, teaching methods and prerequisites
- assessments, codes/descriptions, grading status and credit allocation
- applicability, responsible person, lecturers and reading list
- curriculum columns, tracks, blocks and placements

Do not omit difficult content silently. Revisit unclear pages and cross-check all extracted values against the PDF.

## 4. Accuracy rules
1. Never invent or infer academic facts: no made-up titles, credits, hours, assessment types, semester placements, names, SPO versions or regulation wording.
2. Preserve source wording and language. Do not translate unless requested.
3. Preserve decimal values and units. Do not round or convert unless exact and required by the data format.
4. Distinguish module credits, component credits and assessment credits.
5. Distinguish contact hours, SWS and total workload.
6. Associate assessments with the correct module/component; do not broaden their scope.
7. Preserve repeated appearances and specialization/track assignments. One module used in several tracks may need several curriculum placements, not duplicate files.
8. If a value is absent, omit the optional property. Never use plausible defaults, empty strings, zero or null to disguise missing information.
9. For ambiguity, contradiction, illegibility or missing source information, do not guess. Add `OPEN_QUESTIONS.md` to the ZIP with PDF page, module/field, issue and decision needed. Mark the package as a draft if any issue could affect academic content or structure.
10. Keep confidence notes and interpretations out of the JSON data.

## 5. Construct the files

### specifics.json
Follow `SpecificsData` in `_System/src/types.ts`: `title`, `programme` (official name including degree), `section`, `code`, `spoVersion`, `paragraphs` (each with `text` and optional `items`), optional `lastChange`. The display name and degree are derived from `specifics.json.programme`; do not hardcode them in HTML.

### curriculum.json
Follow the live `CurriculumFileData` interface in `_System/src/types.ts`. This single file contains the complete study-plan hierarchy and replaces the former separate manifest.

Use the hierarchy:
- `studyStages`: ordered study sections, each with `title` and `semesters`
- semester: `semester` number and ordered `modules`
- simple module entry: `id`, `file`, optional `column`, `block`, `style` (`project` or `internship`), `span`, `track`
- specialization group: `title` and nested `modules` array containing simple module entries

A specialization group is identified by having both `title` and `modules`; no extra type field or group ID is needed. Use a group only when the PDF distinguishes a specialization/track. Otherwise put simple module entries directly in the semester's `modules` array. Presentation columns are layout metadata, not a hierarchy level.

Preserve semester order, module order, specialization assignments and optional block sequence. The module `id` must match the filename stem; `file` is a relative path such as `modules/algorithmen.json`. Check every referenced file exists. Do not invent placements.

### Module JSON
Required: `id`, `title`. Follow exact names and types in `_System/src/types.ts` and live examples. Supported groups include:
- metadata: `module_code`, `semester`, `workload_hours`, `credits`, `frequency`, `duration`
- `components`: `label`, `name`, `language`, `contact_hours`, `self_study_hours`, `class_size`, `course_type`, `credit_points`
- `learning_outcomes_intro`, `learning_outcomes`
- `individual_component_content`, `teaching_methods`, `prerequisites`
- `assessment`
- `applicability`, `responsible_person`, `lecturers`, `reading_list`

Keep component relationships explicit where the schema supports a `component` property. Use unique lowercase ASCII IDs; filename must be `<id>.json` and its `id` must equal the filename stem. Do not invent unsupported fields. Avoid cross-programme module dependencies in a supposedly self-contained ZIP; if unavoidable, document them as an open question for the maintainer.

### index.html and cover
Use a current programme page as template. Preserve expected element IDs and shared CSS/JS links. Set `lang` to `de` or `en` as appropriate. Do not hardcode programme name, degree or SPO version in HTML. Copy a suitable existing `cover-photo.jpg` unless the requester supplies a relevant image; do not imply a generic image is programme-specific.

## 6. Validate before delivery
- Parse every JSON file as UTF-8 JSON.
- Check every module filename stem against its `id`.
- Check every module `file` reference in `curriculum.json` resolves to a module file.
- Check every module ID matches its referenced filename.
- Check all modules are represented in the curriculum in the correct semester, order and specialization.
- Check semester order, tracks, columns and placements against the PDF.
- Reconcile module credits and component credits with the source; report discrepancies, do not silently fix them.
- Check all module components, outcomes, assessments, regulations and other source content were transferred.
- Check `specifics.json` programme, code and SPO version.
- Check HTML language and shared asset paths.
- Re-open generated files and inspect ZIP contents.

The repository's `npm run check` is defined under `_System/`; it requires a local repository copy and Node/npm. Run it if possible. If not, perform equivalent JSON/reference checks and explicitly state that the full repository test suite was not run.

## 7. Final response
Provide the ZIP link, programme code/title, counts of modules and semester groups, validation summary and unresolved issues. Label the ZIP as a draft if unresolved questions could change academic content or structure. Never claim it is publication-ready in that situation.
