import type { CurriculumCell, CurriculumData, CurriculumPlacement, DetailGridRows, DetailGridValue, ModuleComponent, ModuleData, SemesterGroup, StudyTableEntry, StudyTableRange } from "./types.js";

function createElement<K extends keyof HTMLElementTagNameMap>(_tag: K, _className?: string, _text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(_tag);
  if (_className) node.className = _className;
  if (_text !== undefined) node.textContent = _text;
  return node;
}
function appendText(_parent: HTMLElement, _tag: keyof HTMLElementTagNameMap, _text?: DetailGridValue, _className?: string): HTMLElement {
  const value = _text === null || _text === undefined || _text === "" ? "—" : String(_text);
  const node = createElement(_tag, _className, value);
  _parent.append(node);
  return node;
}
function addList(_parent: HTMLElement, _items: string[] = []): void {
  const list = createElement("ul");
  for (const item of _items) {
    appendText(list, "li", item);
  }
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
  appendText(_target, "h2", _curriculum.tableHeadings?.structure ?? "Table 1: Module Structure", "curriculum-table-heading");
  const scroll = createElement("div", "curriculum-scroll");
  const layout = createElement("div", "curriculum-layout");
  const headings = createCurriculumHeadings(_curriculum.columns);
  const grid = createCurriculumGrid(_modules, _curriculum);
  layout.append(headings, grid);
  scroll.append(layout);
  _target.append(scroll);
  if (hasBlockInformation(_curriculum)) appendCurriculumLegend(_target);
}

function createCurriculumHeadings(_columns: string[]): HTMLElement {
  const headings = createElement("div", "curriculum-headings");
  headings.classList.add(`curriculum-columns-${_columns.length}`);
  headings.append(createElement("span"));
  for (const name of _columns) {
    appendText(headings, "span", name);
  }
  headings.append(createElement("span"));
  return headings;
}

function createCurriculumGrid(_modules: ModuleData[], _curriculum: CurriculumData): HTMLElement {
  const grid = createElement("div", "curriculum-grid");
  grid.classList.add(`curriculum-columns-${_curriculum.columns.length}`);
  grid.setAttribute("aria-label", "Module structure by semester and subject area");
  appendSemesterRows(grid);
  appendStudyStages(grid, _curriculum);
  appendCurriculumCells(grid, createCurriculumCells(_modules, _curriculum));
  return grid;
}

function appendSemesterRows(_grid: HTMLElement): void {
  for (let semester = 7; semester >= 1; semester--) {
    const row = createElement("output", undefined, String(semester));
    row.style.gridColumn = "1";
    row.style.gridRow = String(8 - semester);
    _grid.append(row);
  }
}

function appendStudyStages(_grid: HTMLElement, _curriculum: CurriculumData): void {
  for (const stageData of _curriculum.studyStages) {
    const stage = createElement("h2", undefined, stageData.title);
    const firstRow = 8 - stageData.lastSemester;
    const rowSpan = stageData.lastSemester - stageData.firstSemester + 1;
    stage.style.gridColumn = String(_curriculum.columns.length + 2);
    stage.style.gridRow = `${firstRow} / span ${rowSpan}`;
    _grid.append(stage);
  }
}

function createCurriculumCells(_modules: ModuleData[], _curriculum: CurriculumData): Map<string, CurriculumCell> {
  const cells = new Map<string, CurriculumCell>();
  for (const module of _modules) {
    const position = _curriculum.modules[module.sourceRef ?? module.id];
    if (!position) continue;
    const placements = position.placements ?? [position as CurriculumPlacement];
    addModulePlacements(cells, module, position, placements, _curriculum.columns);
  }
  return cells;
}

function addModulePlacements(_cells: Map<string, CurriculumCell>, _module: ModuleData, _position: CurriculumData["modules"][string], _placements: CurriculumPlacement[], _columns: string[]): void {
  for (const placement of _placements) {
    const semester = Number(placement.semester ?? _module.semester);
    const column = _columns.indexOf(placement.column);
    if (!Number.isInteger(semester) || semester < 1 || semester > 7 || column < 0) continue;
    const row = 8 - semester;
    const gridColumn = placement.span ? `${column + 2} / span ${placement.span}` : String(column + 2);
    const key = `${row}:${gridColumn}`;
    const cell = _cells.get(key) ?? { row, gridColumn, entries: [] };
    cell.entries.push(createCurriculumCellEntry(_module, semester, placement, _position.style));
    _cells.set(key, cell);
  }
}

function createCurriculumCellEntry(_module: ModuleData, _semester: number, _placement: CurriculumPlacement, _positionStyle?: string): CurriculumCell["entries"][number] {
  return {
    module: _module,
    semester: _semester,
    block: _placement.block,
    style: _placement.style ?? _positionStyle ?? "",
    track: _placement.track,
    moduleNumber: _placement.moduleNumber
  };
}

function appendCurriculumCells(_grid: HTMLElement, _cells: Map<string, CurriculumCell>): void {
  for (const cell of _cells.values()) {
    if (isSpecializationCell(cell)) {
      _grid.append(createSpecializationCell(cell));
    } else {
      appendModuleCell(_grid, cell);
    }
  }
}

function isSpecializationCell(_cell: CurriculumCell): boolean {
  return _cell.entries.length > 1 && _cell.entries.every(_entry => _entry.moduleNumber !== undefined && Boolean(_entry.track));
}

function createSpecializationCell(_cell: CurriculumCell): HTMLElement {
  const container = createElement("div", "curriculum-specialization");
  container.style.gridColumn = _cell.gridColumn;
  container.style.gridRow = String(_cell.row);
  container.append(createElement("strong", undefined, `Vertiefungsmodul ${_cell.entries[0].moduleNumber}`));
  for (const entry of _cell.entries) {
    const link = createElement("a", "curriculum-specialization-track", entry.track);
    link.href = createModuleUrl(entry.module);
    link.setAttribute("aria-label", `Vertiefungsmodul ${entry.moduleNumber}, ${entry.track}: ${entry.module.title}`);
    container.append(link);
  }
  return container;
}

function appendModuleCell(_grid: HTMLElement, _cell: CurriculumCell): void {
  const isStacked = _cell.entries.length > 1;
  const container = isStacked ? createElement("div", "curriculum-module-cell") : _grid;
  if (isStacked) {
    container.style.gridColumn = _cell.gridColumn;
    container.style.gridRow = String(_cell.row);
    _grid.append(container);
  }
  for (const entry of _cell.entries) {
    container.append(createModuleCellLink(entry, _cell, isStacked));
  }
}

function createModuleCellLink(_entry: CurriculumCell["entries"][number], _cell: CurriculumCell, _isStacked: boolean): HTMLAnchorElement {
  const module = _entry.module;
  const link = createElement("a", `curriculum-module${_entry.style ? ` curriculum-${_entry.style}` : ""}`);
  link.href = createModuleUrl(module);
  link.setAttribute("aria-label", `${module.title}, semester ${_entry.semester}, ${module.credits ?? "unknown"} ECTS`);
  if (!_isStacked) {
    link.style.gridColumn = _cell.gridColumn;
    link.style.gridRow = String(_cell.row);
  }
  appendText(link, "span", module.title);
  appendModulePlacementLabel(link, _entry);
  appendModuleBlockLabel(link, _entry);
  return link;
}

function appendModulePlacementLabel(_link: HTMLElement, _entry: CurriculumCell["entries"][number]): void {
  if (!_entry.track && !_entry.moduleNumber) return;
  const label = [_entry.moduleNumber ? `Vertiefungsmodul ${_entry.moduleNumber}` : "", _entry.track ?? ""].filter(Boolean).join(" · ");
  appendText(_link, "small", label);
}

function appendModuleBlockLabel(_link: HTMLElement, _entry: CurriculumCell["entries"][number]): void {
  if (_entry.block === undefined || _entry.style === "internship") return;
  const blockLabel = _entry.block === null ? "–" : String(_entry.block);
  appendText(_link, "span", `${blockLabel}.${_entry.module.credits ?? "—"}`);
}

function createModuleUrl(_module: ModuleData): string {
  const reference = _module.sourceRef ?? `modules/${_module.id}.json`;
  return `./index.html?module=${encodeURIComponent(reference)}`;
}

function hasBlockInformation(_curriculum: CurriculumData): boolean {
  return Object.values(_curriculum.modules).some(_position =>
    _position.block !== undefined || _position.placements?.some(_placement => _placement.block !== undefined)
  );
}

function appendCurriculumLegend(_target: HTMLElement): void {
  const legend = createElement("p");
  legend.textContent = "Legend: x.y = position in the sequence of modules . creditpoints (ECTS)";
  _target.append(legend);
}




const studyTableRanges: StudyTableRange[] = [
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

export function renderStudyTables(_target: HTMLElement, _modules: ModuleData[], _curriculum?: CurriculumData): void {
  _target.replaceChildren();
  const ranges = _curriculum?.studyTables ?? studyTableRanges;
  const semesterModules = createSemesterModuleMap(_modules, _curriculum);
  const semesterCredits = calculateSemesterCredits(semesterModules, _curriculum);
  for (const range of ranges) {
    _target.append(createStudyTableRange(range, semesterModules, semesterCredits, _curriculum));
  }
}

function createSemesterModuleMap(_modules: ModuleData[], _curriculum?: CurriculumData): Map<number, ModuleData[]> {
  const semesterModules = new Map<number, ModuleData[]>();
  for (const module of _modules) {
    const semesters = getModuleSemesters(module, _curriculum);
    for (const semester of semesters) {
      if (!isValidSemester(semester)) continue;
      const group = semesterModules.get(semester) ?? [];
      group.push(module);
      semesterModules.set(semester, group);
    }
  }
  return semesterModules;
}

function getModuleSemesters(_module: ModuleData, _curriculum?: CurriculumData): number[] {
  const position = _curriculum?.modules[_module.sourceRef ?? _module.id];
  const placements = position?.placements ?? (position ? [position as CurriculumPlacement] : []);
  if (placements.length === 0) return [Number(_module.semester)];
  return [...new Set(placements.map(_placement => Number(_placement.semester ?? _module.semester)))];
}

function isValidSemester(_semester: number): boolean {
  return Number.isInteger(_semester) && _semester >= 1 && _semester <= 7;
}

function calculateSemesterCredits(_semesterModules: Map<number, ModuleData[]>, _curriculum?: CurriculumData): Map<number, number> {
  const semesterCredits = new Map<number, number>();
  for (const [semester, modules] of _semesterModules) {
    semesterCredits.set(semester, calculateSemesterCreditTotal(modules, semester, _curriculum));
  }
  return semesterCredits;
}

function calculateSemesterCreditTotal(_modules: ModuleData[], _semester: number, _curriculum?: CurriculumData): number {
  const counted = new Set<string>();
  let total = 0;
  for (const module of _modules) {
    const placement = getModulePlacement(module, _semester, _curriculum);
    const group = placement?.moduleNumber ? `choice-${placement.moduleNumber}` : module.id;
    if (counted.has(group)) continue;
    counted.add(group);
    total += Number(module.credits) || 0;
  }
  return total;
}

function getModulePlacement(_module: ModuleData, _semester: number, _curriculum?: CurriculumData): CurriculumPlacement | undefined {
  const position = _curriculum?.modules[_module.sourceRef ?? _module.id];
  return position?.placements?.find(_placement => Number(_placement.semester ?? _module.semester) === _semester);
}

function createStudyTableRange(_range: StudyTableRange, _semesterModules: Map<number, ModuleData[]>, _semesterCredits: Map<number, number>, _curriculum?: CurriculumData): HTMLElement {
  const sectionNode = createElement("section");
  appendStudyTableHeading(sectionNode, _range, _curriculum);
  const gridScroll = createElement("div", "study-grid-scroll");
  for (let semester = _range.firstSemester; semester <= _range.lastSemester; semester++) {
    const semesterCard = createSemesterTable(semester, _range.number, _semesterModules.get(semester) ?? [], _semesterCredits, _curriculum);
    gridScroll.append(semesterCard);
  }
  gridScroll.append(createOverallCreditsGrid(_range, _semesterCredits));
  sectionNode.append(gridScroll);
  return sectionNode;
}

function appendStudyTableHeading(_section: HTMLElement, _range: StudyTableRange, _curriculum?: CurriculumData): void {
  const configuredHeading = _range.number === 2 ? _curriculum?.tableHeadings?.foundation : _curriculum?.tableHeadings?.advanced;
  const heading = configuredHeading ?? `Table ${_range.number}: ${_range.heading} (${_range.firstSemester}-${_range.lastSemester} Curricular Semesters)`;
  appendText(_section, "h2", heading);
}

function createSemesterTable(_semester: number, _tableNumber: number, _modules: ModuleData[], _semesterCredits: Map<number, number>, _curriculum?: CurriculumData): HTMLElement {
  const entries = createStudyTableEntries(_modules, _semester, _curriculum);
  const hasBlocks = entries.some(_entry => _entry.moduleNumber !== undefined);
  const card = createElement("section");
  const grid = createStudyDataGrid(_semester, _tableNumber, hasBlocks);
  appendStudyTableRows(grid, entries, hasBlocks);
  card.append(grid, createSemesterTotal(_semester, _semesterCredits));
  return card;
}

function createStudyTableEntries(_modules: ModuleData[], _semester: number, _curriculum?: CurriculumData): StudyTableEntry[] {
  return _modules.map(_module => {
    const placement = getModulePlacement(_module, _semester, _curriculum);
    return { module: _module, moduleNumber: placement?.moduleNumber, track: placement?.track };
  });
}

function createStudyDataGrid(_semester: number, _tableNumber: number, _hasBlocks: boolean): HTMLElement {
  const className = _hasBlocks ? "study-data-grid study-data-grid--blocks" : "study-data-grid";
  const grid = createElement("div", className);
  grid.setAttribute("aria-label", `Table ${_tableNumber}: ${_semester}. Curricular Semester`);
  appendStudyTableHeaders(grid, _hasBlocks);
  return grid;
}

function appendStudyTableHeaders(_grid: HTMLElement, _hasBlocks: boolean): void {
  const headings = ["Modules", "Component", "Type", "Hours", "Graded", "Non-Graded", "CP"];
  if (_hasBlocks) {
    const spacer = createElement("header");
    spacer.style.gridColumn = "1";
    spacer.style.gridRow = "1";
    _grid.append(spacer);
  }
  headings.forEach((_title, _index) => {
    const header = createElement("header", undefined, _title);
    header.style.gridColumn = String(_index + (_hasBlocks ? 2 : 1));
    header.style.gridRow = "1";
    _grid.append(header);
  });
}

function appendStudyTableRows(_grid: HTMLElement, _entries: StudyTableEntry[], _hasBlocks: boolean): void {
  let gridRow = 2;
  for (let index = 0; index < _entries.length;) {
    const blockEntries = collectBlockEntries(_entries, index);
    const blockNumber = blockEntries[0].moduleNumber;
    appendStudyBlockLabel(_grid, blockNumber, gridRow, blockEntries);
    for (const entry of blockEntries) {
      gridRow += appendStudyModule(_grid, entry, blockNumber, _hasBlocks, gridRow);
    }
    index += blockEntries.length;
  }
}

function collectBlockEntries(_entries: StudyTableEntry[], _startIndex: number): StudyTableEntry[] {
  const first = _entries[_startIndex];
  if (first.moduleNumber === undefined) return [first];
  const blockEntries: StudyTableEntry[] = [first];
  let index = _startIndex + 1;
  while (index < _entries.length && _entries[index].moduleNumber === first.moduleNumber) {
    blockEntries.push(_entries[index]);
    index++;
  }
  return blockEntries;
}

function appendStudyBlockLabel(_grid: HTMLElement, _blockNumber: number | undefined, _gridRow: number, _entries: StudyTableEntry[]): void {
  if (_blockNumber === undefined) return;
  const rowCount = _entries.reduce((_count, _entry) => _count + Math.max(1, _entry.module.components?.length ?? 0), 0);
  const label = createElement("div", "study-block-label", `Vertiefungsmodul ${_blockNumber} · 6 CP`);
  label.style.gridColumn = "1";
  label.style.gridRow = `${_gridRow} / span ${rowCount}`;
  _grid.append(label);
}

function appendStudyModule(_grid: HTMLElement, _entry: StudyTableEntry, _blockNumber: number | undefined, _hasBlocks: boolean, _gridRow: number): number {
  const components: (ModuleComponent | undefined)[] = _entry.module.components?.length ? _entry.module.components : [undefined];
  const moduleCell = createStudyModuleCell(_entry, _blockNumber, _hasBlocks, _gridRow, components.length);
  _grid.append(moduleCell);
  appendStudyComponentRows(_grid, _entry.module, components, _hasBlocks, _gridRow);
  return components.length;
}

function createStudyModuleCell(_entry: StudyTableEntry, _blockNumber: number | undefined, _hasBlocks: boolean, _gridRow: number, _rowSpan: number): HTMLElement {
  const className = _blockNumber !== undefined ? "study-block-module" : "";
  const cell = createElement("div", className);
  const title = _entry.track ? `${_entry.track}: ${_entry.module.title}` : _entry.module.title;
  const link = createElement("a", undefined, title);
  link.href = createModuleUrl(_entry.module);
  cell.append(link);
  cell.style.gridColumn = _hasBlocks ? (_blockNumber !== undefined ? "2" : "1 / span 2") : "1";
  cell.style.gridRow = `${_gridRow} / span ${_rowSpan}`;
  return cell;
}

function appendStudyComponentRows(_grid: HTMLElement, _module: ModuleData, _components: (ModuleComponent | undefined)[], _hasBlocks: boolean, _gridRow: number): void {
  for (let index = 0; index < _components.length; index++) {
    const values = createStudyComponentValues(_module, _components[index]);
    appendStudyComponentValues(_grid, values, _hasBlocks, _gridRow + index);
  }
}

function createStudyComponentValues(_module: ModuleData, _component?: ModuleComponent): DetailGridValue[] {
  return [
    _component?.name ?? "—",
    _component?.course_type ?? "—",
    contactHoursSws(_component?.contact_hours),
    _component ? componentAssessments(_module, _component, true) || "—" : "—",
    _component ? componentAssessments(_module, _component, false) || "—" : "—",
    _component?.credit_points ?? "—"
  ];
}

function appendStudyComponentValues(_grid: HTMLElement, _values: DetailGridValue[], _hasBlocks: boolean, _gridRow: number): void {
  _values.forEach((_value, _index) => {
    const cell = createElement("div", undefined, String(_value));
    cell.style.gridColumn = String(_index + (_hasBlocks ? 3 : 2));
    cell.style.gridRow = String(_gridRow);
    _grid.append(cell);
  });
}

function createSemesterTotal(_semester: number, _credits: Map<number, number>): HTMLElement {
  const total = createElement("div", "study-semester-total");
  total.append(createElement("span", undefined, `${_semester}. Curricular Semester`));
  total.append(createElement("span", undefined, String(_credits.get(_semester) ?? 0)));
  return total;
}

function createOverallCreditsGrid(_range: StudyTableRange, _semesterCredits: Map<number, number>): HTMLElement {
  const total = [..._semesterCredits.entries()]
    .filter(([_semester]) => _semester >= _range.firstSemester && _semester <= _range.lastSemester)
    .reduce((_sum, [_semester, _credits]) => _sum + _credits, 0);
  const grid = createElement("div", "study-data-grid");
  const label = createElement("div", undefined, "Overall");
  label.style.gridColumn = "span 6";
  grid.append(label, createElement("div", undefined, String(total)));
  return grid;
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

export async function renderModuleList(_target: HTMLElement, _semesters: SemesterGroup[], _loadModule: (_moduleReference: string) => Promise<ModuleData>): Promise<void> {
  _target.replaceChildren();
  for (const semester of _semesters) {
    const group = section(semester.title, _target);
    const modules = await Promise.all(semester.modules.map(_moduleReference => _loadModule(_moduleReference)));
    for (const module of modules) {
      group.append(renderModuleTile(module));
    }
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
  for (const module of _modules) {
    modulesByReference.set(module.sourceRef ?? `modules/${module.id}.json`, module);
  }
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
    const back = createElement("a", "back-link", "← Programme overview");
    back.href = "./index.html";
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
  const values: [string, DetailGridValue][] = [
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
  for (const outcome of _module.learning_outcomes ?? []) {
    grid.append(createOutcomeCard(outcome));
  }
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

function createComponentTextSection(_title: string, _module: ModuleData, _items: NonNullable<ModuleData["teaching_methods"]>): HTMLElement {
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
  for (const lecturer of _module.lecturers ?? []) {
    appendLecturer(people, _module, lecturer);
  }
}

function appendLecturer(_parent: HTMLElement, _module: ModuleData, _lecturer: NonNullable<ModuleData["lecturers"]>[number]): void {
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
  for (const item of _module.reading_list ?? []) {
    appendText(list, "li", item.reference);
  }
  reading.append(list);
}

function appendDetailGridSection(_parent: HTMLElement, _title: string, _className: string, _headers: string[], _rows: DetailGridRows): void {
  const content = section(_title, _parent);
  const scroll = createElement("div", "detail-grid-scroll");
  scroll.append(createDetailGrid(_className, _headers, _rows));
  content.append(scroll);
}

function createDetailGrid(_className: string, _headers: string[], _rows: DetailGridRows): HTMLElement {
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

function appendDetailGridRows(_grid: HTMLElement, _rows: DetailGridRows): void {
  for (const row of _rows) {
    for (const value of row) {
      appendDetailGridCell(_grid, value);
    }
  }
}

function appendDetailGridCell(_grid: HTMLElement, _value: DetailGridValue): void {
  const cell = createElement("div");
  cell.setAttribute("role", "cell");
  appendText(cell, "span", _value);
  _grid.append(cell);
}

function appendComponentContent(_parent: HTMLElement, _module: ModuleData, _items: NonNullable<ModuleData["individual_component_content"]>): void {
  for (const item of _items) {
    if (item.component) appendText(_parent, "h3", componentReference(_module, item.component));
    addList(_parent, item.items);
  }
}
