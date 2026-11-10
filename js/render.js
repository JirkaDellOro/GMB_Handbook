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
export function renderModuleTile(entry) {
    const link = el('a', 'module-tile');
    link.href = `./module.html?id=${encodeURIComponent(entry.id)}`;
    appendText(link, 'span', String(entry.semester ?? '').padStart(2, '0'), 'tile-number');
    const main = el('span', 'tile-main');
    appendText(main, 'strong', entry.title);
    appendText(main, 'small', `Semester ${entry.semester ?? '—'} · Required module`);
    link.append(main);
    appendText(link, 'span', `${entry.credits ?? '—'} ECTS`, 'tile-credits');
    appendText(link, 'span', '↗', 'tile-arrow');
    return link;
}
export function renderModuleList(target, entries) {
    target.replaceChildren();
    const sorted = [...entries].sort((a, b) => Number(a.semester ?? 99) - Number(b.semester ?? 99) || a.title.localeCompare(b.title));
    for (const entry of sorted)
        target.append(renderModuleTile(entry));
}
export function renderModuleDetail(target, module) {
    target.replaceChildren();
    const article = el('article', 'module-page');
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
    const components = section('Components', article);
    for (const component of module.components ?? []) {
        const card = el('div', 'component-card');
        appendText(card, 'h3', `${component.label ? `${component.label} ` : ''}${component.name ?? ''}`.trim());
        const details = el('dl', 'detail-grid');
        const values = [
            ['Language', component.language?.join(' / ')], ['Contact hours', component.contact_hours],
            ['Self-study', component.self_study_hours === undefined ? undefined : `${component.self_study_hours} h`], ['Class size', component.class_size]
        ];
        for (const [label, value] of values) {
            const wrap = el('div');
            appendText(wrap, 'dt', label);
            appendText(wrap, 'dd', value);
            details.append(wrap);
        }
        card.append(details);
        components.append(card);
    }
    const outcomes = section('Module Learning Outcomes', article);
    if (module.learning_outcomes_intro)
        appendText(outcomes, 'p', module.learning_outcomes_intro);
    const outcomeGrid = el('div', 'outcome-grid');
    for (const outcome of module.learning_outcomes ?? []) {
        const card = el('div', 'outcome-card');
        appendText(card, 'h3', outcome.category);
        addList(card, outcome.items);
        outcomeGrid.append(card);
    }
    outcomes.append(outcomeGrid);
    const content = section('Individual Component Content', article);
    for (const item of module.individual_component_content ?? []) {
        if (item.component)
            appendText(content, 'h3', item.component);
        addList(content, item.items, 'tag-list');
    }
    const twoCol = el('section', 'two-column-sections');
    for (const [title, items] of [['Teaching Methods', module.teaching_methods], ['Prerequisites', module.prerequisites]]) {
        const block = el('div', 'content-section');
        appendText(block, 'h2', title);
        for (const item of items ?? []) {
            if (item.component)
                appendText(block, 'h3', item.component);
            addList(block, item.items);
        }
        twoCol.append(block);
    }
    article.append(twoCol);
    const assessment = section('Methods of Assessment', article);
    for (const item of module.assessment ?? []) {
        const row = el('div', 'assessment-row');
        appendText(row, 'strong', item.component);
        appendText(row, 'span', item.description);
        appendText(row, 'span', item.graded_assessment === null || item.graded_assessment === undefined ? '—' : item.graded_assessment ? 'Graded assessment' : 'Non-graded assessment');
        appendText(row, 'strong', item.credits === null || item.credits === undefined ? '—' : `${item.credits} CP`);
        assessment.append(row);
    }
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
            p.append(el('strong', undefined, item.component), document.createElement('br'));
        p.append(document.createTextNode(item.names?.join(', ') || '—'));
        people.append(p);
    }
    const reading = section('Reading List', article);
    const readingList = el('ul', 'reading-list');
    for (const item of module.reading_list ?? [])
        appendText(readingList, 'li', item.reference);
    reading.append(readingList);
    if (module.extraction_note)
        appendText(article, 'p', module.extraction_note, 'source-note');
    target.append(article);
}
export function renderError(target, title, message) {
    target.replaceChildren();
    const box = el('div', 'notice');
    appendText(box, 'h1', title);
    appendText(box, 'p', message);
    target.append(box);
}
