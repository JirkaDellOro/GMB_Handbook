function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
function appendText(parent, tag, text, className) {
    const value = text === null || text === undefined || text === '' ? '—' : String(text);
    const node = el(tag, className, value);
    parent.append(node);
    return node;
}
function addList(parent, items = [], className) {
    const ul = el('ul', className);
    for (const item of items)
        appendText(ul, 'li', item);
    parent.append(ul);
}
function section(title, parent) {
    const node = el('section', 'content-section');
    appendText(node, 'h2', title);
    parent.append(node);
    return node;
}
export function renderCurriculum(target, modules, curriculum) {
    target.replaceChildren();
    const scroll = el('div', 'curriculum-scroll');
    const layout = el('div', 'curriculum-layout');
    const headings = el('div', 'curriculum-headings');
    headings.append(el('span'));
    for (const name of curriculum.columns)
        appendText(headings, 'span', name);
    headings.append(el('span'));
    layout.append(headings);
    const grid = el('div', 'curriculum-grid');
    grid.setAttribute('aria-label', 'Module structure by semester and subject area');
    for (let semester = 7; semester >= 1; semester--) {
        const row = el('output', undefined, String(semester));
        row.style.gridColumn = '1';
        row.style.gridRow = String(8 - semester);
        grid.append(row);
    }
    for (const stageData of curriculum.studyStages) {
        const stage = el('h2', undefined, stageData.title);
        const firstRow = 8 - stageData.lastSemester;
        const rowSpan = stageData.lastSemester - stageData.firstSemester + 1;
        stage.style.gridColumn = String(curriculum.columns.length + 2);
        stage.style.gridRow = `${firstRow} / span ${rowSpan}`;
        grid.append(stage);
    }
    const cells = new Map();
    for (const module of modules) {
        const position = curriculum.modules[module.id];
        if (!position)
            continue;
        const semester = Number(module.semester);
        const column = curriculum.columns.indexOf(position.column);
        if (!Number.isInteger(semester) || semester < 1 || semester > 7 || column < 0)
            continue;
        const row = 8 - semester;
        const gridColumn = position.span ? `${column + 2} / span ${position.span}` : String(column + 2);
        const key = `${row}:${gridColumn}`;
        const cell = cells.get(key) ?? { row, gridColumn, entries: [] };
        cell.entries.push({ module, semester, block: position.block, style: position.style ?? '' });
        cells.set(key, cell);
    }
    for (const cellData of cells.values()) {
        const isStacked = cellData.entries.length > 1;
        const container = isStacked ? el('div', 'curriculum-module-cell') : grid;
        if (isStacked) {
            container.style.gridColumn = cellData.gridColumn;
            container.style.gridRow = String(cellData.row);
            container.style.gridTemplateRows = `repeat(${cellData.entries.length}, minmax(0, 1fr))`;
            grid.append(container);
        }
        for (const entry of cellData.entries) {
            const { module, semester, block, style } = entry;
            const link = el('a', `curriculum-module${style ? ` curriculum-${style}` : ''}`);
            link.href = `./module.html?id=${encodeURIComponent(module.id)}`;
            link.setAttribute('aria-label', `${module.title}, semester ${semester}, ${module.credits ?? 'unknown'} ECTS`);
            if (!isStacked) {
                link.style.gridColumn = cellData.gridColumn;
                link.style.gridRow = String(cellData.row);
            }
            appendText(link, 'span', module.title);
            if (style !== 'internship') {
                const blockLabel = block === null ? '–' : String(block);
                appendText(link, 'span', `${blockLabel}.${module.credits ?? '—'}`);
            }
            container.append(link);
        }
    }
    layout.append(grid);
    scroll.append(layout);
    target.append(scroll);
    const legend = el('p');
    legend.textContent = 'Legend: x.y = position in the sequence of modules . creditpoints (ECTS)';
    target.append(legend);
}
const studyTableRanges = [
    { number: 2, firstSemester: 1, lastSemester: 2, heading: 'Foundation Studies' },
    { number: 3, firstSemester: 3, lastSemester: 7, heading: 'Advanced Studies' }
];
function componentReference(module, label) {
    if (!label)
        return undefined;
    const component = module.components?.find(item => item.label === label);
    return component ? `${component.label} ${component.name ?? ''}`.trim() : label;
}
function componentAssessments(module, component, graded) {
    return (module.assessment ?? [])
        .filter(item => item.component === component.label && item.graded_assessment === graded)
        .map(item => item.code).filter(Boolean).join(', ');
}
function contactHoursSws(value) {
    if (value === null || value === undefined || value === '')
        return '—';
    const match = String(value).match(/^\s*(\d+(?:[.,]\d+)?)/);
    return match ? match[1].replace(',', '.') : String(value);
}
export function renderStudyTables(target, modules) {
    target.replaceChildren();
    const orderedModules = [...modules].sort((a, b) => Number(a.semester) - Number(b.semester));
    for (const range of studyTableRanges) {
        const sectionNode = el('section');
        appendText(sectionNode, 'h2', `Table ${range.number}: Games & Immersive Media B.A. (${range.firstSemester}-${range.lastSemester} ${range.heading} Curricular Semester)`);
        const semesterModules = new Map();
        for (const module of orderedModules) {
            const semester = Number(module.semester);
            if (!Number.isInteger(semester) || semester < range.firstSemester || semester > range.lastSemester)
                continue;
            const group = semesterModules.get(semester) ?? [];
            group.push(module);
            semesterModules.set(semester, group);
        }
        const gridScroll = el('div', 'study-grid-scroll');
        for (let semester = range.firstSemester; semester <= range.lastSemester; semester++) {
            const semesterItems = semesterModules.get(semester) ?? [];
            const semesterCard = el('section');
            const grid = el('div', 'study-data-grid');
            grid.setAttribute('aria-label', `Table ${range.number}: ${semester}. Curricular Semester`);
            for (const title of ['Modules', 'Component', 'Type', 'Hours', 'Graded', 'Non-Graded', 'CP']) {
                grid.append(el('header', undefined, title));
            }
            for (const module of semesterItems) {
                const components = module.components?.length ? module.components : [undefined];
                const moduleCell = el('div');
                const moduleLink = el('a', undefined, module.title);
                moduleLink.href = `./module.html?id=${encodeURIComponent(module.id)}`;
                moduleCell.append(moduleLink);
                moduleCell.style.gridRow = `span ${components.length}`;
                grid.append(moduleCell);
                for (const component of components) {
                    const values = [
                        component?.name ?? '—',
                        component?.course_type ?? '—',
                        contactHoursSws(component?.contact_hours),
                        component ? componentAssessments(module, component, true) || '—' : '—',
                        component ? componentAssessments(module, component, false) || '—' : '—',
                        component?.credit_points ?? '—'
                    ];
                    for (const value of values)
                        grid.append(el('div', undefined, value));
                }
            }
            semesterCard.append(grid);
            const semesterCredits = semesterItems.reduce((sum, module) => sum + (Number(module.credits) || 0), 0);
            const semesterTotal = el('div', 'study-semester-total');
            semesterTotal.append(el('span', undefined, `${semester}. Curricular Semester`));
            semesterTotal.append(el('span', undefined, String(semesterCredits)));
            semesterCard.append(semesterTotal);
            gridScroll.append(semesterCard);
        }
        const overallCredits = orderedModules
            .filter(module => Number(module.semester) >= range.firstSemester && Number(module.semester) <= range.lastSemester)
            .reduce((sum, module) => sum + (Number(module.credits) || 0), 0);
        const overallGrid = el('div', 'study-data-grid');
        const overall = el('div', undefined, 'Overall');
        overall.style.gridColumn = 'span 6';
        overallGrid.append(overall);
        overallGrid.append(el('div', undefined, String(overallCredits)));
        gridScroll.append(overallGrid);
        sectionNode.append(gridScroll);
        target.append(sectionNode);
    }
}
export function renderModuleTile(module) {
    const link = el('a', 'module-tile');
    link.href = `./module.html?id=${encodeURIComponent(module.id)}`;
    appendText(link, 'span', String(module.semester ?? '').padStart(2, '0'));
    const main = el('span');
    appendText(main, 'span', module.title);
    appendText(main, 'small', `Semester ${module.semester ?? '—'} · Required module`);
    link.append(main);
    appendText(link, 'span', `${module.credits ?? '—'} ECTS`);
    appendText(link, 'span', '↗');
    return link;
}
export async function renderModuleList(target, semesters, loadModule) {
    target.replaceChildren();
    for (const semester of semesters) {
        const group = section(semester.title, target);
        const modules = await Promise.all(semester.modules.map(id => loadModule(id)));
        for (const module of modules)
            group.append(renderModuleTile(module));
    }
}

export function renderModuleDetail(_target, _module) {
    _target.replaceChildren();
    const article = el("article");
    appendModuleHeader(article, _module);
    renderCourseComponents(article, _module);
    renderLearningOutcomes(article, _module);
    renderComponentContent(article, _module);
    renderAssessments(article, _module);
    renderApplicability(article, _module);
    renderPeople(article, _module);
    renderReadingList(article, _module);
    _target.append(article);
}

export function renderError(target, title, message) {
    target.replaceChildren();
    const box = el('div', 'notice');
    appendText(box, 'h1', title);
    appendText(box, 'p', message);
    target.append(box);
}

function appendModuleHeader(_article, _module) {
    const back = el("a", "back-link", "← All modules");
    back.href = "./modules.html";
    _article.append(back, createModuleHeading(_module), createModuleFacts(_module));
}
function createModuleHeading(_module) {
    const heading = el("div", "module-heading");
    const copy = el("div");
    appendText(copy, "p", `Required module · Semester ${_module.semester ?? "—"}`, "eyebrow");
    appendText(copy, "h1", _module.title);
    appendText(copy, "p", `Module code: ${_module.module_code || "—"}`, "module-code");
    heading.append(copy, createCreditCard(_module));
    return heading;
}
function createCreditCard(_module) {
    const credit = el("div", "credit-card");
    appendText(credit, "span", _module.credits ?? "—");
    appendText(credit, "span", "ECTS");
    return credit;
}
function createModuleFacts(_module) {
    const facts = el("section", "facts-grid");
    facts.setAttribute("aria-label", "Module information");
    const values = [
        ["Workload", _module.workload_hours == null ? "—" : `${_module.workload_hours} h`],
        ["Semester", _module.semester],
        ["Frequency", _module.frequency],
        ["Duration", _module.duration == null ? "—" : `${_module.duration} semester`]
    ];
    for (const [label, value] of values) {
        const cell = el("div");
        appendText(cell, "span", label);
        appendText(cell, "span", value);
        facts.append(cell);
    }
    return facts;
}
function renderCourseComponents(_article, _module) {
    appendDetailGridSection(_article, "Course Components", "component-grid", ["Component", "Course type", "Language", "Contact hours", "Self-study", "Class size", "ECTS"], (_module.components ?? []).map(_component => [
        `${_component.label ? `${_component.label} ` : ""}${_component.name ?? ""}`.trim(),
        _component.course_type, _component.language?.join(" / "), _component.contact_hours,
        _component.self_study_hours === undefined ? undefined : `${_component.self_study_hours} h`,
        _component.class_size, _component.credit_points
    ]));
}
function renderLearningOutcomes(_article, _module) {
    const outcomes = section("Module Learning Outcomes", _article);
    if (_module.learning_outcomes_intro)
        appendText(outcomes, "p", _module.learning_outcomes_intro);
    const grid = el("div", "outcome-grid");
    for (const outcome of _module.learning_outcomes ?? [])
        grid.append(createOutcomeCard(outcome));
    outcomes.append(grid);
}
function createOutcomeCard(_outcome) {
    const card = el("div");
    appendText(card, "h3", _outcome.category);
    addList(card, _outcome.items);
    return card;
}
function renderComponentContent(_article, _module) {
    const content = section("Individual Component Content", _article);
    content.classList.add("component-content-panel");
    appendComponentContent(content, _module, _module.individual_component_content ?? []);
    const columns = el("section", "two-column-sections");
    columns.append(
        createComponentTextSection("Teaching Methods", _module, _module.teaching_methods ?? []),
        createComponentTextSection("Prerequisites", _module, _module.prerequisites ?? [])
    );
    _article.append(columns);
}
function createComponentTextSection(_title, _module, _items) {
    const block = el("div", "content-section");
    appendText(block, "h2", _title);
    appendComponentContent(block, _module, _items);
    return block;
}
function renderAssessments(_article, _module) {
    appendDetailGridSection(_article, "Methods of Assessment", "assessment-grid", ["Component", "Code", "Assessment", "Grading", "ECTS"], (_module.assessment ?? []).map(_item => [
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
    const people = section("Person responsible for Module and Lecturers", _article);
    const responsible = el("p");
    responsible.append(el("span", undefined, "Person responsible for module: "));
    responsible.append(document.createTextNode(_module.responsible_person || "—"));
    people.append(responsible);
    for (const lecturer of _module.lecturers ?? [])
        appendLecturer(people, _module, lecturer);
}
function appendLecturer(_parent, _module, _lecturer) {
    const paragraph = el("p");
    if (_lecturer.component) {
        appendText(paragraph, "span", componentReference(_module, _lecturer.component));
        paragraph.append(document.createElement("br"));
    }
    paragraph.append(document.createTextNode(_lecturer.names?.join(", ") || "—"));
    _parent.append(paragraph);
}
function renderReadingList(_article, _module) {
    const reading = section("Reading List", _article);
    const list = el("ul", "reading-list");
    for (const item of _module.reading_list ?? [])
        appendText(list, "li", item.reference);
    reading.append(list);
}
function appendDetailGridSection(_parent, _title, _className, _headers, _rows) {
    const content = section(_title, _parent);
    const grid = el("div", `detail-data-grid ${_className}`);
    grid.setAttribute("role", "table");
    for (const title of _headers) {
        const cell = el("header", undefined, title);
        cell.setAttribute("role", "columnheader");
        grid.append(cell);
    }
    for (const row of _rows) {
        for (const value of row) {
            const cell = el("div");
            cell.setAttribute("role", "cell");
            appendText(cell, "span", value);
            grid.append(cell);
        }
    }
    const scroll = el("div", "detail-grid-scroll");
    scroll.append(grid);
    content.append(scroll);
}
function appendComponentContent(_parent, _module, _items) {
    for (const item of _items) {
        if (item.component)
            appendText(_parent, "h3", componentReference(_module, item.component));
        addList(_parent, item.items);
    }
}
