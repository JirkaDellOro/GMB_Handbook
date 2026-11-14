import type { CurriculumData, ModuleData, SemesterGroup } from "./types.js";

function createElement<K extends keyof HTMLElementTagNameMap>(_tag: K, _className?: string, _text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(_tag);
  if (_className) node.className = _className;
  if (_text !== undefined) node.textContent = _text;
  return node;
}
function appendText(_parent: HTMLElement, _tag: keyof HTMLElementTagNameMap, _text?: unknown, _className?: string): HTMLElement {
  const value = _text === null || _text === undefined || _text === "" ? "—" : String(_text);
  const node = createElement(_tag, _className, value);
  _parent.append(node);
  return node;
}
function addList(_parent: HTMLElement, _items: string[] = []): void {
  const list = createElement("ul");
  for (const item of _items) appendText(list, "li", item);
  _parent.append(list);
}
function section(_title: string, _parent: HTMLElement): HTMLElement {
  const node = createElement("section", "content-section");
  appendText(node, "h2", _title);
  _parent.append(node);
  return node;
}

export function renderCurriculum(_target: HTMLElement, _modules: ModuleData[], _curriculum: CurriculumData): void {
  _target.replaceChildren();
  appendText(_target, "h2", "Table 1: Module Structure", "curriculum-table-heading");
  const scroll = createElement("div", "curriculum-scroll");
  const layout = createElement("div", "curriculum-layout");
  const headings = createElement("div", "curriculum-headings");
  headings.append(createElement("span"));
  for (const name of _curriculum.columns) appendText(headings, "span", name);
  headings.append(createElement("span"));
  layout.append(headings);
  const grid = createElement("div", "curriculum-grid");
  grid.setAttribute("aria-label", "Module structure by semester and subject area");
  for (let semester = 7; semester >= 1; semester--) {
    const row = createElement("output", undefined, String(semester));
    row.style.gridColumn = "1";
    row.style.gridRow = String(8 - semester);
    grid.append(row);
  }
  for (const stageData of _curriculum.studyStages) {
    const stage = createElement("h2", undefined, stageData.title);
    const firstRow = 8 - stageData.lastSemester;
    const rowSpan = stageData.lastSemester - stageData.firstSemester + 1;
    stage.style.gridColumn = String(_curriculum.columns.length + 2);
    stage.style.gridRow = `${firstRow} / span ${rowSpan}`;
    grid.append(stage);
  }
  const cells = new Map<string, {
    row: number;
    gridColumn: string;
    entries: { module: ModuleData; semester: number; block: number | null; style: string }[];
  }>();
  for (const module of _modules) {
    const position = _curriculum.modules[module.sourceRef ?? module.id];
    if (!position) continue;
    const semester = Number(module.semester);
    const column = _curriculum.columns.indexOf(position.column);
    if (!Number.isInteger(semester) || semester < 1 || semester > 7 || column < 0) continue;
    const row = 8 - semester;
    const gridColumn = position.span ? `${column + 2} / span ${position.span}` : String(column + 2);
    const key = `${row}:${gridColumn}`;
    const cell = cells.get(key) ?? { row, gridColumn, entries: [] };
    cell.entries.push({ module, semester, block: position.block, style: position.style ?? "" });
    cells.set(key, cell);
  }
  for (const cellData of cells.values()) {
    const isStacked = cellData.entries.length > 1;
    const container = isStacked ? createElement("div", "curriculum-module-cell") : grid;
    if (isStacked) {
      container.style.gridColumn = cellData.gridColumn;
      container.style.gridRow = String(cellData.row);
      container.style.gridTemplateRows = `repeat(${cellData.entries.length}, minmax(0, 1fr))`;
      grid.append(container);
    }
    for (const entry of cellData.entries) {
      const { module, semester, block, style } = entry;
      const link = createElement("a", `curriculum-module${style ? ` curriculum-${style}` : ""}`);
      link.href = `./index.html?module=${encodeURIComponent(module.sourceRef ?? ("modules/" + module.id + ".json"))}`;
      link.setAttribute("aria-label", `${module.title}, semester ${semester}, ${module.credits ?? "unknown"} ECTS`);
      if (!isStacked) {
        link.style.gridColumn = cellData.gridColumn;
        link.style.gridRow = String(cellData.row);
      }
      appendText(link, "span", module.title);
      if (style !== "internship") {
        const blockLabel = block === null ? "–" : String(block);
        appendText(link, "span", `${blockLabel}.${module.credits ?? "—"}`);
      }
      container.append(link);
    }
  }
  layout.append(grid);
  scroll.append(layout);
  _target.append(scroll);
  const legend = createElement("p");
  legend.textContent = "Legend: x.y = position in the sequence of modules . creditpoints (ECTS)";
  _target.append(legend);
}


type StudyTableRange = { number: 2 | 3; firstSemester: number; lastSemester: number; heading: string };

const studyTableRanges = [
  { number: 2, firstSemester: 1, lastSemester: 2, heading: "Foundation Studies" },
  { number: 3, firstSemester: 3, lastSemester: 7, heading: "Advanced Studies" }
];

function componentReference(_module: ModuleData, _label?: string): string | undefined {
  if (!_label) return undefined;
  const component = _module.components?.find(_item => _item.label === _label);
  return component ? `${component.label} ${component.name ?? ""}`.trim() : _label;
}

function componentAssessments(_module: ModuleData, _component: NonNullable<ModuleData["components"]>[number], _graded: boolean): string {
  return (_module.assessment ?? [])
    .filter(_item => _item.component === _component.label && _item.graded_assessment === _graded)
    .map(_item => _item.code).filter(Boolean).join(", ");
}

function contactHoursSws(_value: NonNullable<ModuleData["components"]>[number]["contact_hours"]): string {
  if (_value === null || _value === undefined || _value === "") return "—";
  const match = String(_value).match(/^\s*(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(",", ".") : String(_value);
}

export function renderStudyTables(_target: HTMLElement, _modules: ModuleData[]): void {
  _target.replaceChildren();
  const orderedModules = [...modules].sort((_firstModule, _secondModule) => Number(_firstModule.semester) - Number(_secondModule.semester));
  for (const range of studyTableRanges) {
    const sectionNode = createElement("section");
    appendText(sectionNode, "h2", `Table ${range.number}: Games & Immersive Media B.A. (${range.firstSemester}-${range.lastSemester} ${range.heading} Curricular Semester)`);
    const semesterModules = new Map<number, ModuleData[]>();
    for (const module of orderedModules) {
      const semester = Number(module.semester);
      if (!Number.isInteger(semester) || semester < range.firstSemester || semester > range.lastSemester) continue;
      const group = semesterModules.get(semester) ?? [];
      group.push(module);
      semesterModules.set(semester, group);
    }
    const gridScroll = createElement("div", "study-grid-scroll");
    for (let semester = range.firstSemester; semester <= range.lastSemester; semester++) {
      const semesterItems = semesterModules.get(semester) ?? [];
      const semesterCard = createElement("section");
      const grid = createElement("div", "study-data-grid");
      grid.setAttribute("aria-label", `Table ${range.number}: ${semester}. Curricular Semester`);
      for (const title of ["Modules", "Component", "Type", "Hours", "Graded", "Non-Graded", "CP"]) {
        grid.append(createElement("header", undefined, title));
      }
      for (const module of semesterItems) {
        const components = module.components?.length ? module.components : [undefined];
        const moduleCell = createElement("div");
        const moduleLink = createElement("a", undefined, module.title);
        moduleLink.href = `./index.html?module=${encodeURIComponent(module.sourceRef ?? ("modules/" + module.id + ".json"))}`;
        moduleCell.append(moduleLink);
        moduleCell.style.gridRow = `span ${components.length}`;
        grid.append(moduleCell);
        for (const component of components) {
          const values = [
            component?.name ?? "—",
            component?.course_type ?? "—",
            contactHoursSws(component?.contact_hours),
            component ? componentAssessments(module, component, true) || "—" : "—",
            component ? componentAssessments(module, component, false) || "—" : "—",
            component?.credit_points ?? "—"
          ];
          for (const value of values) grid.append(createElement("div", undefined, <string>value));
        }
      }
      semesterCard.append(grid);
      const semesterCredits = semesterItems.reduce((_totalCredits, _module) => _totalCredits + (Number(_module.credits) || 0), 0);
      const semesterTotal = createElement("div", "study-semester-total");
      semesterTotal.append(createElement("span", undefined, `${semester}. Curricular Semester`));
      semesterTotal.append(createElement("span", undefined, String(semesterCredits)));
      semesterCard.append(semesterTotal);
      gridScroll.append(semesterCard);
    }
    const overallCredits = orderedModules
      .filter(_module => Number(_module.semester) >= range.firstSemester && Number(_module.semester) <= range.lastSemester)
      .reduce((_totalCredits, _module) => _totalCredits + (Number(_module.credits) || 0), 0);
    const overallGrid = createElement("div", "study-data-grid");
    const overall = createElement("div", undefined, "Overall");
    overall.style.gridColumn = "span 6";
    overallGrid.append(overall);
    overallGrid.append(createElement("div", undefined, String(overallCredits)));
    gridScroll.append(overallGrid);
    sectionNode.append(gridScroll);
    _target.append(sectionNode);
  }
}

export function renderModuleTile(_module: ModuleData): HTMLAnchorElement {
  const link = createElement("a", "module-tile");
  link.href = `./index.html?module=${encodeURIComponent(_module.sourceRef ?? ("modules/" + _module.id + ".json"))}`;
  appendText(link, "span", String(_module.semester ?? "").padStart(2, "0"));
  const main = createElement("span");
  appendText(main, "span", _module.title);
  appendText(main, "small", `Semester ${_module.semester ?? "—"} · Required module`);
  link.append(main);
  appendText(link, "span", `${_module.credits ?? "—"} ECTS`);
  appendText(link, "span", "↗");
  return link;
}

export async function renderModuleList(
  _target: HTMLElement,
  _semesters: SemesterGroup[],
  __loadModule: (_moduleReference: string) => Promise<ModuleData>
): Promise<void> {
  _target.replaceChildren();
  for (const semester of _semesters) {
    const group = section(semester.title, _target);
    const modules = await Promise.all(semester.modules.map(_moduleReference => _loadModule(_moduleReference)));
    for (const module of modules) group.append(renderModuleTile(module));
  }
}


export function renderModuleDetail(_target: HTMLElement, _module: ModuleData, _showBackLink = true): void {
  _target.replaceChildren();
  const article = createElement("article");
  appendModuleHeader(article, _module, _showBackLink);
  renderCourseComponents(article, _module);
  renderLearningOutcomes(article, _module);
  renderComponentContent(article, _module);
  renderAssessments(article, _module);
  renderApplicability(article, _module);
  renderPeople(article, _module);
  renderReadingList(article, _module);
  _target.append(article);
}

export function renderModuleDetails(_target: HTMLElement, _semesters: SemesterGroup[], _modules: ModuleData[]): void {
  _target.replaceChildren();
  const modulesByReference = new Map<string, ModuleData>();
  for (const module of _modules) modulesByReference.set(module.sourceRef ?? `modules/${module.id}.json`, module);
  for (const semester of _semesters) {
    const group = createElement("section", "module-detail-semester");
    appendText(group, "h2", semester.title);
    for (const reference of semester.modules) {
      const module = modulesByReference.get(reference);
      if (!module) continue;
      const entry = createElement("div", "module-detail-entry");
      renderModuleDetail(entry, module, false);
      group.append(entry);
    }
    _target.append(group);
  }
}

export function renderError(_target: HTMLElement, _title: string, _message: string): void {
  _target.replaceChildren();
  const box = createElement("div", "notice"); appendText(box, "h1", _title); appendText(box, "p", _message); _target.append(box);
}

function appendModuleHeader(_article: HTMLElement, _module: ModuleData, _showBackLink: boolean): void {
  if (_showBackLink) {
    const back = createElement("a", "back-link", "← All modules");
    back.href = "./index.html?view=modules";
    _article.append(back);
  }
  _article.append(createModuleHeading(_module), createModuleFacts(_module));
}

function createModuleHeading(_module: ModuleData): HTMLElement {
  const heading = createElement("div", "module-heading");
  const copy = createElement("div");
  appendText(copy, "p", `Required module · Semester ${_module.semester ?? "—"}`, "eyebrow");
  appendText(copy, "h1", _module.title);
  appendText(copy, "p", `Module code: ${_module.module_code || "—"}`, "module-code");
  heading.append(copy);
  return heading;
}


function createModuleFacts(_module: ModuleData): HTMLElement {
  const facts = createElement("section", "facts-grid");
  facts.setAttribute("aria-label", "Module information");
  const values: [string, unknown][] = [
    ["Workload", _module.workload_hours == null ? "—" : `${_module.workload_hours} h`],
    ["Semester", _module.semester],
    ["Frequency", _module.frequency],
    ["Duration", _module.duration == null ? "—" : `${_module.duration} semester`]
  ];
  for (const [label, value] of values) {
    const cell = createElement("div");
    appendText(cell, "span", label);
    appendText(cell, "span", value);
    facts.append(cell);
  }
  return facts;
}

function renderCourseComponents(_article: HTMLElement, _module: ModuleData): void {
  appendDetailGridSection(
    _article, "Course Components", "component-grid",
    ["Component", "Course type", "Language", "Contact hours", "Self-study", "Class size", "ECTS"],
    (_module.components ?? []).map(_component => [
      `${_component.label ? `${_component.label} ` : ""}${_component.name ?? ""}`.trim(),
      _component.course_type, _component.language?.join(" / "), _component.contact_hours,
      _component.self_study_hours === undefined ? undefined : `${_component.self_study_hours} h`,
      _component.class_size, _component.credit_points
    ])
  );
}

function renderLearningOutcomes(_article: HTMLElement, _module: ModuleData): void {
  const outcomes = section("Module Learning Outcomes", _article);
  if (_module.learning_outcomes_intro) appendText(outcomes, "p", _module.learning_outcomes_intro);
  const grid = createElement("div", "outcome-grid");
  for (const outcome of _module.learning_outcomes ?? []) grid.append(createOutcomeCard(outcome));
  outcomes.append(grid);
}

function createOutcomeCard(_outcome: NonNullable<ModuleData["learning_outcomes"]>[number]): HTMLElement {
  const card = createElement("div");
  appendText(card, "h3", _outcome.category);
  addList(card, _outcome.items);
  return card;
}

function renderComponentContent(_article: HTMLElement, _module: ModuleData): void {
  const content = section("Individual Component Content", _article);
  content.classList.add("component-content-panel");
  appendComponentContent(content, _module, _module.individual_component_content ?? []);
  const columns = createElement("section", "two-column-sections");
  columns.append(
    createComponentTextSection("Teaching Methods", _module, _module.teaching_methods ?? []),
    createComponentTextSection("Prerequisites", _module, _module.prerequisites ?? [])
  );
  _article.append(columns);
}

function createComponentTextSection(
  _title: string, _module: ModuleData,
  _items: NonNullable<ModuleData["teaching_methods"]>
): HTMLElement {
  const block = createElement("div", "content-section");
  appendText(block, "h2", _title);
  appendComponentContent(block, _module, _items);
  return block;
}

function renderAssessments(_article: HTMLElement, _module: ModuleData): void {
  appendDetailGridSection(
    _article, "Methods of Assessment", "assessment-grid",
    ["Component", "Code", "Assessment", "Grading", "ECTS"],
    (_module.assessment ?? []).map(_item => [
      componentReference(_module, _item.component), _item.code, _item.description,
      _item.graded_assessment == null ? undefined : _item.graded_assessment ? "Graded" : "Non-graded",
      _item.credits
    ])
  );
}

function renderApplicability(_article: HTMLElement, _module: ModuleData): void {
  const content = section("Applicability of Module", _article);
  appendText(content, "p", "Required module in:");
  addList(content, _module.applicability);
}

function renderPeople(_article: HTMLElement, _module: ModuleData): void {
  const people = section("Person responsible for Module and Lecturers", _article);
  const responsible = createElement("p");
  responsible.append(createElement("span", undefined, "Person responsible for module: "));
  responsible.append(document.createTextNode(_module.responsible_person || "—"));
  people.append(responsible);
  for (const lecturer of _module.lecturers ?? []) appendLecturer(people, _module, lecturer);
}

function appendLecturer(
  _parent: HTMLElement, _module: ModuleData,
  _lecturer: NonNullable<ModuleData["lecturers"]>[number]
): void {
  const paragraph = createElement("p");
  if (_lecturer.component) {
    appendText(paragraph, "span", componentReference(_module, _lecturer.component));
    paragraph.append(document.createElement("br"));
  }
  paragraph.append(document.createTextNode(_lecturer.names?.join(", ") || "—"));
  _parent.append(paragraph);
}

function renderReadingList(_article: HTMLElement, _module: ModuleData): void {
  const reading = section("Reading List", _article);
  const list = createElement("ul", "reading-list");
  for (const item of _module.reading_list ?? []) appendText(list, "li", item.reference);
  reading.append(list);
}

function appendDetailGridSection(
  _parent: HTMLElement, _title: string, _className: string,
  _headers: string[], _rows: unknown[][]
): void {
  const content = section(_title, _parent);
  const scroll = createElement("div", "detail-grid-scroll");
  scroll.append(createDetailGrid(_className, _headers, _rows));
  content.append(scroll);
}

function createDetailGrid(_className: string, _headers: string[], _rows: unknown[][]): HTMLElement {
  const grid = createElement("div", `detail-data-grid ${_className}`);
  grid.setAttribute("role", "table");
  appendDetailGridHeaders(grid, _headers);
  appendDetailGridRows(grid, _rows);
  return grid;
}

function appendDetailGridHeaders(_grid: HTMLElement, _headers: string[]): void {
  for (const title of _headers) {
    const cell = createElement("header", undefined, title);
    cell.setAttribute("role", "columnheader");
    _grid.append(cell);
  }
}

function appendDetailGridRows(_grid: HTMLElement, _rows: unknown[][]): void {
  for (const row of _rows) {
    for (const value of row) appendDetailGridCell(_grid, value);
  }
}

function appendDetailGridCell(_grid: HTMLElement, _value: unknown): void {
  const cell = createElement("div");
  cell.setAttribute("role", "cell");
  appendText(cell, "span", _value);
  _grid.append(cell);
}

function appendComponentContent(
  _parent: HTMLElement, _module: ModuleData,
  _items: NonNullable<ModuleData["individual_component_content"]>
): void {
  for (const item of _items) {
    if (item.component) appendText(_parent, "h3", componentReference(_module, item.component));
    addList(_parent, item.items);
  }
}
