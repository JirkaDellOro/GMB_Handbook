const studyTableRanges = [
    { number: 2, firstSemester: 1, lastSemester: 2, heading: "Foundation Studies" },
    { number: 3, firstSemester: 3, lastSemester: 7, heading: "Advanced Studies" }
];
export function renderCurriculum(_target, _modules, _curriculum) {
    const scroll = createElement("div", "curriculum-scroll");
    const layout = createElement("div", "curriculum-layout");
    const headings = createCurriculumHeadings(_curriculum.columns);
    const grid = createCurriculumGrid(_modules, _curriculum);
    _target.replaceChildren();
    appendText(_target, "h2", _curriculum.tableHeadings?.structure ?? "Table 1: Module Structure", "curriculum-table-heading");
    layout.append(headings, grid);
    scroll.append(layout);
    _target.append(scroll);
    if (hasBlockInformation(_curriculum))
        appendCurriculumLegend(_target);
}
function createCurriculumHeadings(_columns) {
    const headings = createElement("div", "curriculum-headings");
    headings.classList.add(`curriculum-columns-${_columns.length}`);
    headings.append(createElement("span"));
    _columns.forEach((name) => {
        appendText(headings, "span", name);
    });
    headings.append(createElement("span"));
    return headings;
}
function createCurriculumGrid(_modules, _curriculum) {
    const grid = createElement("div", "curriculum-grid");
    grid.classList.add(`curriculum-columns-${_curriculum.columns.length}`);
    grid.setAttribute("aria-label", "Module structure by semester and subject area");
    appendSemesterRows(grid);
    appendStudyStages(grid, _curriculum);
    appendCurriculumCells(grid, createCurriculumCells(_modules, _curriculum));
    return grid;
}
function appendSemesterRows(_grid) {
    for (let semester = 7; semester >= 1; semester--) {
        const row = createElement("output", undefined, String(semester));
        row.style.gridColumn = "1";
        row.style.gridRow = String(8 - semester);
        _grid.append(row);
    }
}
function appendStudyStages(_grid, _curriculum) {
    _curriculum.studyStages.forEach((stageData) => {
        const stage = createElement("h2", undefined, stageData.title);
        const firstRow = 8 - stageData.lastSemester;
        const rowSpan = stageData.lastSemester - stageData.firstSemester + 1;
        stage.style.gridColumn = String(_curriculum.columns.length + 2);
        stage.style.gridRow = `${firstRow} / span ${rowSpan}`;
        _grid.append(stage);
    });
}
function createCurriculumCells(_modules, _curriculum) {
    const cells = new Map();
    _modules.forEach((module) => {
        const position = _curriculum.modules[module.sourceRef ?? module.id];
        if (!position)
            return;
        const placements = position.placements ?? [position];
        addModulePlacements(cells, module, position, placements, _curriculum.columns);
    });
    return cells;
}
function addModulePlacements(_cells, _module, _position, _placements, _columns) {
    _placements.forEach((placement) => {
        const semester = Number(placement.semester ?? _module.semester);
        const column = _columns.indexOf(placement.column);
        if (!Number.isInteger(semester) || semester < 1 || semester > 7 || column < 0)
            return;
        const row = 8 - semester;
        const gridColumn = placement.span ? `${column + 2} / span ${placement.span}` : String(column + 2);
        const key = `${row}:${gridColumn}`;
        const cell = _cells.get(key) ?? { row, gridColumn, entries: [] };
        cell.entries.push(createCurriculumCellEntry(_module, semester, placement, _position.style));
        _cells.set(key, cell);
    });
}
function createCurriculumCellEntry(_module, _semester, _placement, _positionStyle) {
    return {
        module: _module,
        semester: _semester,
        block: _placement.block,
        style: _placement.style ?? _positionStyle ?? "",
        track: _placement.track,
        moduleNumber: _placement.moduleNumber
    };
}
function appendCurriculumCells(_grid, _cells) {
    _cells.forEach((cell) => {
        if (isSpecializationCell(cell)) {
            _grid.append(createSpecializationCell(cell));
        }
        else {
            appendModuleCell(_grid, cell);
        }
    });
}
function isSpecializationCell(_cell) {
    return _cell.entries.length > 1 && _cell.entries.every((_entry) => _entry.moduleNumber !== undefined && Boolean(_entry.track));
}
function createSpecializationCell(_cell) {
    const container = createElement("div", "curriculum-specialization");
    container.style.gridColumn = _cell.gridColumn;
    container.style.gridRow = String(_cell.row);
    container.append(createElement("strong", undefined, `Vertiefungsmodul ${_cell.entries[0].moduleNumber}`));
    _cell.entries.forEach((entry) => {
        const link = createElement("a", "curriculum-specialization-track", entry.track);
        link.href = createModuleUrl(entry.module);
        link.setAttribute("aria-label", `Vertiefungsmodul ${entry.moduleNumber}, ${entry.track}: ${entry.module.title}`);
        container.append(link);
    });
    return container;
}
function appendModuleCell(_grid, _cell) {
    const isStacked = _cell.entries.length > 1;
    const container = isStacked ? createElement("div", "curriculum-module-cell") : _grid;
    if (isStacked) {
        container.style.gridColumn = _cell.gridColumn;
        container.style.gridRow = String(_cell.row);
        _grid.append(container);
    }
    _cell.entries.forEach((entry) => {
        container.append(createModuleCellLink(entry, _cell, isStacked));
    });
}
function createModuleCellLink(_entry, _cell, _isStacked) {
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
function appendModulePlacementLabel(_link, _entry) {
    if (!_entry.track && !_entry.moduleNumber)
        return;
    const label = [_entry.moduleNumber ? `Vertiefungsmodul ${_entry.moduleNumber}` : "", _entry.track ?? ""].filter(Boolean).join(" · ");
    appendText(_link, "small", label);
}
function appendModuleBlockLabel(_link, _entry) {
    if (_entry.block === undefined || _entry.style === "internship")
        return;
    const blockLabel = _entry.block === null ? "–" : String(_entry.block);
    appendText(_link, "span", `${blockLabel}.${_entry.module.credits ?? "—"}`);
}
function createModuleUrl(_module) {
    const reference = _module.sourceRef ?? `modules/${_module.id}.json`;
    return `./index.html?module=${encodeURIComponent(reference)}`;
}
function hasBlockInformation(_curriculum) {
    return Object.values(_curriculum.modules).some((_position) => _position.block !== undefined || Boolean(_position.placements?.some((_placement) => _placement.block !== undefined)));
}
function appendCurriculumLegend(_target) {
    const legend = createElement("p");
    legend.textContent = "Legend: x.y = position in the sequence of modules . creditpoints (ECTS)";
    _target.append(legend);
}
export function renderStudyTables(_target, _modules, _curriculum) {
    const ranges = _curriculum?.studyTables ?? studyTableRanges;
    const semesterModules = createSemesterModuleMap(_modules, _curriculum);
    const semesterCredits = calculateSemesterCredits(semesterModules, _curriculum);
    _target.replaceChildren();
    ranges.forEach((range) => {
        _target.append(createStudyTableRange(range, semesterModules, semesterCredits, _curriculum));
    });
}
function createSemesterModuleMap(_modules, _curriculum) {
    const semesterModules = new Map();
    _modules.forEach((module) => {
        const semesters = getModuleSemesters(module, _curriculum);
        semesters.forEach((semester) => {
            if (!isValidSemester(semester))
                return;
            const group = semesterModules.get(semester) ?? [];
            group.push(module);
            semesterModules.set(semester, group);
        });
    });
    return semesterModules;
}
function getModuleSemesters(_module, _curriculum) {
    const position = _curriculum?.modules[_module.sourceRef ?? _module.id];
    const placements = position?.placements ?? (position ? [position] : []);
    if (placements.length === 0)
        return [Number(_module.semester)];
    return [...new Set(placements.map((_placement) => Number(_placement.semester ?? _module.semester)))];
}
function isValidSemester(_semester) {
    return Number.isInteger(_semester) && _semester >= 1 && _semester <= 7;
}
function calculateSemesterCredits(_semesterModules, _curriculum) {
    const semesterCredits = new Map();
    _semesterModules.forEach((modules, semester) => {
        semesterCredits.set(semester, calculateSemesterCreditTotal(modules, semester, _curriculum));
    });
    return semesterCredits;
}
function calculateSemesterCreditTotal(_modules, _semester, _curriculum) {
    const counted = new Set();
    let total = 0;
    _modules.forEach((module) => {
        const placement = getModulePlacement(module, _semester, _curriculum);
        const group = placement?.moduleNumber ? `choice-${placement.moduleNumber}` : module.id;
        if (counted.has(group))
            return;
        counted.add(group);
        total += Number(module.credits) || 0;
    });
    return total;
}
function getModulePlacement(_module, _semester, _curriculum) {
    const position = _curriculum?.modules[_module.sourceRef ?? _module.id];
    return position?.placements?.find((_placement) => Number(_placement.semester ?? _module.semester) === _semester);
}
function createStudyTableRange(_range, _semesterModules, _semesterCredits, _curriculum) {
    const sectionNode = createElement("section");
    const gridScroll = createElement("div", "study-grid-scroll");
    appendStudyTableHeading(sectionNode, _range, _curriculum);
    for (let semester = _range.firstSemester; semester <= _range.lastSemester; semester++) {
        const semesterCard = createSemesterTable(semester, _range.number, _semesterModules.get(semester) ?? [], _semesterCredits, _curriculum);
        gridScroll.append(semesterCard);
    }
    gridScroll.append(createOverallCreditsGrid(_range, _semesterCredits));
    sectionNode.append(gridScroll);
    return sectionNode;
}
function appendStudyTableHeading(_section, _range, _curriculum) {
    const configuredHeading = _range.number === 2 ? _curriculum?.tableHeadings?.foundation : _curriculum?.tableHeadings?.advanced;
    const heading = configuredHeading ?? `Table ${_range.number}: ${_range.heading} (${_range.firstSemester}-${_range.lastSemester} Curricular Semesters)`;
    appendText(_section, "h2", heading);
}
function createSemesterTable(_semester, _tableNumber, _modules, _semesterCredits, _curriculum) {
    const entries = createStudyTableEntries(_modules, _semester, _curriculum);
    const hasBlocks = entries.some((_entry) => _entry.moduleNumber !== undefined);
    const card = createElement("section");
    const grid = createStudyDataGrid(_semester, _tableNumber, hasBlocks);
    appendStudyTableRows(grid, entries, hasBlocks);
    card.append(grid, createSemesterTotal(_semester, _semesterCredits));
    return card;
}
function createStudyTableEntries(_modules, _semester, _curriculum) {
    return _modules.map((_module) => {
        const placement = getModulePlacement(_module, _semester, _curriculum);
        return { module: _module, moduleNumber: placement?.moduleNumber, track: placement?.track };
    });
}
function createStudyDataGrid(_semester, _tableNumber, _hasBlocks) {
    const className = _hasBlocks ? "study-data-grid study-data-grid--blocks" : "study-data-grid";
    const grid = createElement("div", className);
    grid.setAttribute("aria-label", `Table ${_tableNumber}: ${_semester}. Curricular Semester`);
    appendStudyTableHeaders(grid, _hasBlocks);
    return grid;
}
function appendStudyTableHeaders(_grid, _hasBlocks) {
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
function appendStudyTableRows(_grid, _entries, _hasBlocks) {
    let gridRow = 2;
    for (let index = 0; index < _entries.length;) {
        const blockEntries = collectBlockEntries(_entries, index);
        const blockNumber = blockEntries[0].moduleNumber;
        appendStudyBlockLabel(_grid, blockNumber, gridRow, blockEntries);
        blockEntries.forEach((entry) => {
            gridRow += appendStudyModule(_grid, entry, blockNumber, _hasBlocks, gridRow);
        });
        index += blockEntries.length;
    }
}
function collectBlockEntries(_entries, _startIndex) {
    const first = _entries[_startIndex];
    if (first.moduleNumber === undefined)
        return [first];
    const blockEntries = [first];
    let index = _startIndex + 1;
    while (index < _entries.length && _entries[index].moduleNumber === first.moduleNumber) {
        blockEntries.push(_entries[index]);
        index++;
    }
    return blockEntries;
}
function appendStudyBlockLabel(_grid, _blockNumber, _gridRow, _entries) {
    if (_blockNumber === undefined)
        return;
    const rowCount = _entries.reduce((_count, _entry) => _count + Math.max(1, _entry.module.components?.length ?? 0), 0);
    const label = createElement("div", "study-block-label", `Vertiefungsmodul ${_blockNumber} · 6 CP`);
    label.style.gridColumn = "1";
    label.style.gridRow = `${_gridRow} / span ${rowCount}`;
    _grid.append(label);
}
function appendStudyModule(_grid, _entry, _blockNumber, _hasBlocks, _gridRow) {
    const components = _entry.module.components?.length ? _entry.module.components : [undefined];
    const moduleCell = createStudyModuleCell(_entry, _blockNumber, _hasBlocks, _gridRow, components.length);
    _grid.append(moduleCell);
    appendStudyComponentRows(_grid, _entry.module, components, _hasBlocks, _gridRow);
    return components.length;
}
function createStudyModuleCell(_entry, _blockNumber, _hasBlocks, _gridRow, _rowSpan) {
    const className = _blockNumber !== undefined ? "study-block-module" : "";
    const cell = createElement("div", className);
    cell.classList.toggle("study-row-shaded", _gridRow % 2 === 0);
    const title = _entry.track ? `${_entry.track}: ${_entry.module.title}` : _entry.module.title;
    const link = createElement("a", undefined, title);
    link.href = createModuleUrl(_entry.module);
    cell.append(link);
    cell.style.gridColumn = _hasBlocks ? (_blockNumber !== undefined ? "2" : "1 / span 2") : "1";
    cell.style.gridRow = `${_gridRow} / span ${_rowSpan}`;
    return cell;
}
function appendStudyComponentRows(_grid, _module, _components, _hasBlocks, _gridRow) {
    for (let index = 0; index < _components.length; index++) {
        const values = createStudyComponentValues(_module, _components[index]);
        appendStudyComponentValues(_grid, values, _hasBlocks, _gridRow + index);
    }
}
function createStudyComponentValues(_module, _component) {
    return [
        _component?.name ?? "—",
        _component?.course_type ?? "—",
        contactHoursSws(_component?.contact_hours),
        _component ? componentAssessments(_module, _component, true) || "—" : "—",
        _component ? componentAssessments(_module, _component, false) || "—" : "—",
        _component?.credit_points ?? "—"
    ];
}
function appendStudyComponentValues(_grid, _values, _hasBlocks, _gridRow) {
    _values.forEach((_value, _index) => {
        const cell = createElement("div", undefined, String(_value));
        cell.classList.toggle("study-row-shaded", _gridRow % 2 === 0);
        cell.style.gridColumn = String(_index + (_hasBlocks ? 3 : 2));
        cell.style.gridRow = String(_gridRow);
        _grid.append(cell);
    });
}
function createSemesterTotal(_semester, _credits) {
    const total = createElement("div", "study-semester-total");
    total.append(createElement("span", undefined, `${_semester}. Curricular Semester`));
    total.append(createElement("span", undefined, String(_credits.get(_semester) ?? 0)));
    return total;
}
function createOverallCreditsGrid(_range, _semesterCredits) {
    const total = [..._semesterCredits.entries()]
        .filter((_entry) => _entry[0] >= _range.firstSemester && _entry[0] <= _range.lastSemester)
        .reduce((_sum, _entry) => _sum + _entry[1], 0);
    const grid = createElement("div", "study-data-grid");
    const label = createElement("div", undefined, "Overall");
    label.style.gridColumn = "span 6";
    grid.append(label, createElement("div", undefined, String(total)));
    return grid;
}
export function renderModuleTile(_module) {
    const link = createElement("a", "module-tile");
    const main = createElement("span");
    link.href = `./index.html?module=${encodeURIComponent(_module.sourceRef ?? ("modules/" + _module.id + ".json"))}`;
    appendText(link, "span", String(_module.semester ?? "").padStart(2, "0"));
    appendText(main, "span", _module.title);
    appendText(main, "small", `Semester ${_module.semester ?? "—"} · Required module`);
    link.append(main);
    appendText(link, "span", `${_module.credits ?? "—"} ECTS`);
    appendText(link, "span", "↗");
    return link;
}
export async function renderModuleList(_target, _semesters, _loadModule) {
    _target.replaceChildren();
    for (let index = 0; index < _semesters.length; index++) {
        const semester = _semesters[index];
        const group = section(semester.title, _target);
        const modules = await Promise.all(semester.modules.map((_moduleReference) => _loadModule(_moduleReference)));
        modules.forEach((module) => {
            group.append(renderModuleTile(module));
        });
    }
}
export function renderModuleDetail(_target, _module, _showBackLink = true) {
    const article = createElement("article");
    _target.replaceChildren();
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
export function renderModuleDetails(_target, _semesters, _modules) {
    const modulesByReference = new Map();
    _target.replaceChildren();
    _modules.forEach((module) => {
        modulesByReference.set(module.sourceRef ?? `modules/${module.id}.json`, module);
    });
    _semesters.forEach((semester) => {
        const group = createElement("section", "module-detail-semester");
        appendText(group, "h2", semester.title);
        semester.modules.forEach((reference) => {
            const module = modulesByReference.get(reference);
            if (!module)
                return;
            const entry = createElement("div", "module-detail-entry");
            renderModuleDetail(entry, module, false);
            group.append(entry);
        });
        _target.append(group);
    });
}
export function renderError(_target, _title, _message) {
    const box = createElement("div", "notice");
    _target.replaceChildren();
    appendText(box, "h1", _title);
    appendText(box, "p", _message);
    _target.append(box);
}
function appendModuleHeader(_article, _module, _showBackLink) {
    if (_showBackLink) {
        const back = createElement("a", "back-link", "← Programme overview");
        back.href = "./index.html";
        _article.append(back);
    }
    _article.append(createModuleHeading(_module), createModuleFacts(_module));
}
function createModuleHeading(_module) {
    const heading = createElement("div", "module-heading");
    const copy = createElement("div");
    appendText(copy, "p", `Required module · Semester ${_module.semester ?? "—"}`, "eyebrow");
    appendText(copy, "h1", _module.title);
    appendText(copy, "p", `Module code: ${_module.module_code || "—"}`, "module-code");
    heading.append(copy);
    return heading;
}
function createModuleFacts(_module) {
    const facts = createElement("section", "facts-grid");
    const values = [
        ["Workload", _module.workload_hours == null ? "—" : `${_module.workload_hours} h`],
        ["Semester", _module.semester],
        ["Frequency", _module.frequency],
        ["Duration", _module.duration == null ? "—" : `${_module.duration} semester`]
    ];
    facts.setAttribute("aria-label", "Module information");
    values.forEach((entry) => {
        const label = entry[0];
        const value = entry[1];
        const cell = createElement("div");
        appendText(cell, "span", label);
        appendText(cell, "span", value);
        facts.append(cell);
    });
    return facts;
}
function renderCourseComponents(_article, _module) {
    appendDetailGridSection(_article, "Course Components", "component-grid", ["Component", "Course type", "Language", "Contact hours", "Self-study", "Class size", "ECTS"], (_module.components ?? []).map((_component) => [
        `${_component.label ? `${_component.label} ` : ""}${_component.name ?? ""}`.trim(),
        _component.course_type, _component.language?.join(" / "), _component.contact_hours,
        _component.self_study_hours === undefined ? undefined : `${_component.self_study_hours} h`,
        _component.class_size, _component.credit_points
    ]));
}
function renderLearningOutcomes(_article, _module) {
    const grid = createElement("div", "outcome-grid");
    const outcomes = section("Module Learning Outcomes", _article);
    if (_module.learning_outcomes_intro)
        appendText(outcomes, "p", _module.learning_outcomes_intro);
    (_module.learning_outcomes ?? []).forEach((outcome) => {
        grid.append(createOutcomeCard(outcome));
    });
    outcomes.append(grid);
}
function createOutcomeCard(_outcome) {
    const card = createElement("div");
    appendText(card, "h3", _outcome.category);
    addList(card, _outcome.items);
    return card;
}
function renderComponentContent(_article, _module) {
    const columns = createElement("section", "two-column-sections");
    const content = section("Individual Component Content", _article);
    content.classList.add("component-content-panel");
    appendComponentContent(content, _module, _module.individual_component_content ?? []);
    columns.append(createComponentTextSection("Teaching Methods", _module, _module.teaching_methods ?? []), createComponentTextSection("Prerequisites", _module, _module.prerequisites ?? []));
    _article.append(columns);
}
function createComponentTextSection(_title, _module, _items) {
    const block = createElement("div", "content-section");
    appendText(block, "h2", _title);
    appendComponentContent(block, _module, _items);
    return block;
}
function renderAssessments(_article, _module) {
    appendDetailGridSection(_article, "Methods of Assessment", "assessment-grid", ["Component", "Code", "Assessment", "Grading", "ECTS"], (_module.assessment ?? []).map((_item) => [
        componentReference(_module, _item.component), _item.code, _item.description,
        _item.graded_assessment == null ? undefined : _item.graded_assessment ? "Graded" : "Non-graded",
        _item.credits
    ]));
}
function renderApplicability(_article, _module) {
    const content = section("Applicability of Module", _article);
    appendText(content, "p", "Required module in:");
    addList(content, _module.applicability);
}
function renderPeople(_article, _module) {
    const responsible = createElement("p");
    const people = section("Person responsible for Module and Lecturers", _article);
    responsible.append(createElement("span", undefined, "Person responsible for module: "));
    responsible.append(document.createTextNode(_module.responsible_person || "—"));
    people.append(responsible);
    (_module.lecturers ?? []).forEach((lecturer) => {
        appendLecturer(people, _module, lecturer);
    });
}
function appendLecturer(_parent, _module, _lecturer) {
    const paragraph = createElement("p");
    if (_lecturer.component) {
        appendText(paragraph, "span", componentReference(_module, _lecturer.component));
        paragraph.append(document.createElement("br"));
    }
    paragraph.append(document.createTextNode(_lecturer.names?.join(", ") || "—"));
    _parent.append(paragraph);
}
function renderReadingList(_article, _module) {
    const list = createElement("ul", "reading-list");
    const reading = section("Reading List", _article);
    (_module.reading_list ?? []).forEach((item) => {
        appendText(list, "li", item.reference);
    });
    reading.append(list);
}
function appendDetailGridSection(_parent, _title, _className, _headers, _rows) {
    const scroll = createElement("div", "detail-grid-scroll");
    const content = section(_title, _parent);
    scroll.append(createDetailGrid(_className, _headers, _rows));
    content.append(scroll);
}
function createDetailGrid(_className, _headers, _rows) {
    const grid = createElement("div", `detail-data-grid ${_className}`);
    grid.setAttribute("role", "table");
    appendDetailGridHeaders(grid, _headers);
    appendDetailGridRows(grid, _rows);
    return grid;
}
function appendDetailGridHeaders(_grid, _headers) {
    _headers.forEach((title) => {
        const cell = createElement("header", undefined, title);
        cell.setAttribute("role", "columnheader");
        _grid.append(cell);
    });
}
function appendDetailGridRows(_grid, _rows) {
    _rows.forEach((row) => {
        row.forEach((value) => {
            appendDetailGridCell(_grid, value);
        });
    });
}
function appendDetailGridCell(_grid, _value) {
    const cell = createElement("div");
    cell.setAttribute("role", "cell");
    appendText(cell, "span", _value);
    _grid.append(cell);
}
function appendComponentContent(_parent, _module, _items) {
    _items.forEach((item) => {
        if (item.component)
            appendText(_parent, "h3", componentReference(_module, item.component));
        addList(_parent, item.items);
    });
}
function createElement(_tag, _className, _text) {
    const node = document.createElement(_tag);
    if (_className)
        node.className = _className;
    if (_text !== undefined)
        node.textContent = _text;
    return node;
}
function appendText(_parent, _tag, _text, _className) {
    const value = _text === null || _text === undefined || _text === "" ? "—" : String(_text);
    const node = createElement(_tag, _className, value);
    _parent.append(node);
    return node;
}
function addList(_parent, _items = []) {
    const list = createElement("ul");
    _items.forEach((item) => {
        appendText(list, "li", item);
    });
    _parent.append(list);
}
function section(_title, _parent) {
    const node = createElement("section", "content-section");
    appendText(node, "h2", _title);
    _parent.append(node);
    return node;
}
function componentReference(_module, _label) {
    if (!_label)
        return undefined;
    const component = _module.components?.find((_item) => _item.label === _label);
    return component ? `${component.label} ${component.name ?? ""}`.trim() : _label;
}
function componentAssessments(_module, _component, _graded) {
    return (_module.assessment ?? [])
        .filter((_item) => _item.component === _component.label && _item.graded_assessment === _graded)
        .map((_item) => _item.code).filter(Boolean).join(", ");
}
function contactHoursSws(_value) {
    if (_value === null || _value === undefined || _value === "")
        return "—";
    const match = String(_value).match(/^\s*(\d+(?:[.,]\d+)?)/);
    return match ? match[1].replace(",", ".") : String(_value);
}
