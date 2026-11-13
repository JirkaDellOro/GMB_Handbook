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
        const stage = el('aside', undefined, stageData.title);
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
            appendText(link, 'strong', module.title);
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
    appendText(main, 'strong', module.title);
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
export function renderModuleDetail(target, module) {
    target.replaceChildren();
    const article = el('article');
    const back = el('a', 'back-link', '← All modules');
    back.href = './modules.html';
    article.append(back);
    const heading = el('div', 'module-heading');
    const headingCopy = el('div');
    appendText(headingCopy, 'p', `Required module · Semester ${module.semester ?? '—'}`, 'eyebrow');
    appendText(headingCopy, 'h1', module.title);
    appendText(headingCopy, 'p', `Module code: ${module.module_code || '—'}`, 'module-code');
    heading.append(headingCopy);
    const credit = el('div', 'credit-card');
    appendText(credit, 'strong', module.credits ?? '—');
    appendText(credit, 'span', 'ECTS');
    heading.append(credit);
    article.append(heading);
    const facts = el('section', 'facts-grid');
    facts.setAttribute('aria-label', 'Module information');
    const factValues = [
        ['Workload', module.workload_hours === null || module.workload_hours === undefined ? '—' : `${module.workload_hours} h`],
        ['Semester', module.semester], ['Frequency', module.frequency],
        ['Duration', module.duration === null || module.duration === undefined ? '—' : `${module.duration} semester`]
    ];
    for (const [label, value] of factValues) {
        const cell = el('div');
        appendText(cell, 'span', label);
        appendText(cell, 'strong', value);
        facts.append(cell);
    }
    article.append(facts);
    const components = section('Course Components', article);
    const componentGrid = el('div', 'detail-data-grid component-grid');
    componentGrid.setAttribute('role', 'table');
    for (const heading of ['Component', 'Course type', 'Language', 'Contact hours', 'Self-study', 'Class size', 'ECTS']) {
        const cell = el('header', undefined, heading);
        cell.setAttribute('role', 'columnheader');
        componentGrid.append(cell);
    }
    for (const component of module.components ?? []) {
        const values = [
            `${component.label ? `${component.label} ` : ''}${component.name ?? ''}`.trim(),
            component.course_type, component.language?.join(' / '), component.contact_hours,
            component.self_study_hours === undefined ? undefined : `${component.self_study_hours} h`,
            component.class_size, component.credit_points
        ];
        for (const value of values) {
            const cell = el('div');
            cell.setAttribute('role', 'cell');
            appendText(cell, 'span', value);
            componentGrid.append(cell);
        }
    }
    const componentScroll = el('div', 'detail-grid-scroll');
    componentScroll.append(componentGrid);
    components.append(componentScroll);
    const outcomes = section('Module Learning Outcomes', article);
    if (module.learning_outcomes_intro)
        appendText(outcomes, 'p', module.learning_outcomes_intro);
    const outcomeGrid = el('div', 'outcome-grid');
    for (const outcome of module.learning_outcomes ?? []) {
        const card = el('div');
        appendText(card, 'h3', outcome.category);
        addList(card, outcome.items);
        outcomeGrid.append(card);
    }
    outcomes.append(outcomeGrid);
    const content = section('Individual Component Content', article);
    content.classList.add('component-content-panel');
    for (const item of module.individual_component_content ?? []) {
        if (item.component)
            appendText(content, 'h3', componentReference(module, item.component));
        addList(content, item.items);
    }
    const twoCol = el('section', 'two-column-sections');
    for (const [title, items] of [['Teaching Methods', module.teaching_methods], ['Prerequisites', module.prerequisites]]) {
        const block = el('div', 'content-section');
        appendText(block, 'h2', title);
        for (const item of items ?? []) {
            if (item.component)
                appendText(block, 'h3', componentReference(module, item.component));
            addList(block, item.items);
        }
        twoCol.append(block);
    }
    article.append(twoCol);
    const assessment = section('Methods of Assessment', article);
    const assessmentGrid = el('div', 'detail-data-grid assessment-grid');
    assessmentGrid.setAttribute('role', 'table');
    for (const heading of ['Component', 'Code', 'Assessment', 'Grading', 'ECTS']) {
        const cell = el('header', undefined, heading);
        cell.setAttribute('role', 'columnheader');
        assessmentGrid.append(cell);
    }
    for (const item of module.assessment ?? []) {
        const values = [
            componentReference(module, item.component), item.code, item.description,
            item.graded_assessment === null || item.graded_assessment === undefined ? undefined : item.graded_assessment ? 'Graded' : 'Non-graded',
            item.credits
        ];
        for (const value of values) {
            const cell = el('div');
            cell.setAttribute('role', 'cell');
            appendText(cell, 'span', value);
            assessmentGrid.append(cell);
        }
    }
    const assessmentScroll = el('div', 'detail-grid-scroll');
    assessmentScroll.append(assessmentGrid);
    assessment.append(assessmentScroll);
    const applicability = section('Applicability of Module', article);
    appendText(applicability, 'p', 'Required module in:');
    addList(applicability, module.applicability);
    const people = section('Person responsible for Module and Lecturers', article);
    const responsible = el('p');
    const label = el('strong', undefined, 'Person responsible for module: ');
    responsible.append(label, document.createTextNode(module.responsible_person || '—'));
    people.append(responsible);
    for (const item of module.lecturers ?? []) {
        const p = el('p');
        if (item.component)
            p.append(el('strong', undefined, componentReference(module, item.component)), document.createElement('br'));
        p.append(document.createTextNode(item.names?.join(', ') || '—'));
        people.append(p);
    }
    const reading = section('Reading List', article);
    const readingList = el('ul', 'reading-list');
    for (const item of module.reading_list ?? [])
        appendText(readingList, 'li', item.reference);
    reading.append(readingList);
    target.append(article);
}
export function renderError(target, title, message) {
    target.replaceChildren();
    const box = el('div', 'notice');
    appendText(box, 'h1', title);
    appendText(box, 'p', message);
    target.append(box);
}
