import type { CurriculumData, ModuleData, SemesterGroup } from './types.js';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function appendText(parent: HTMLElement, tag: keyof HTMLElementTagNameMap, text?: unknown, className?: string): HTMLElement {
  const value = text === null || text === undefined || text === '' ? '—' : String(text);
  const node = el(tag, className, value);
  parent.append(node);
  return node;
}
function addList(parent: HTMLElement, items: string[] = [], className?: string): void {
  const ul = el('ul', className);
  for (const item of items) appendText(ul, 'li', item);
  parent.append(ul);
}
function section(title: string, parent: HTMLElement): HTMLElement {
  const node = el('section', 'content-section');
  appendText(node, 'h2', title);
  parent.append(node);
  return node;
}

export function renderCurriculum(target: HTMLElement, modules: ModuleData[], curriculum: CurriculumData): void {
  target.replaceChildren();
  const scroll = el('div', 'curriculum-scroll');
  const layout = el('div', 'curriculum-layout');
  const headings = el('div', 'curriculum-headings');
  headings.append(el('span', 'curriculum-heading-spacer'));
  for (const name of curriculum.columns) appendText(headings, 'span', name, 'curriculum-column-heading');
  headings.append(el('span', 'curriculum-heading-spacer'));
  layout.append(headings);
  const grid = el('div', 'curriculum-grid');
  grid.setAttribute('aria-label', 'Module structure by semester and subject area');
  for (let semester = 7; semester >= 1; semester--) {
    const row = el('span', 'curriculum-semester', String(semester));
    row.style.gridColumn = '1';
    row.style.gridRow = String(8 - semester);
    grid.append(row);
  }
  for (const stageData of curriculum.studyStages) {
    const stage = el('span', 'curriculum-stage', stageData.title);
    const firstRow = 8 - stageData.lastSemester;
    const rowSpan = stageData.lastSemester - stageData.firstSemester + 1;
    stage.style.gridColumn = String(curriculum.columns.length + 2);
    stage.style.gridRow = `${firstRow} / span ${rowSpan}`;
    grid.append(stage);
  }
  const cells = new Map<string, {
    row: number;
    gridColumn: string;
    entries: { module: ModuleData; semester: number; block: number | null; style: string }[];
  }>();
  for (const module of modules) {
    const position = curriculum.modules[module.id];
    if (!position) continue;
    const semester = Number(module.semester);
    const column = curriculum.columns.indexOf(position.column);
    if (!Number.isInteger(semester) || semester < 1 || semester > 7 || column < 0) continue;
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
      appendText(link, 'strong', module.title, 'curriculum-module-title');
      if (style !== 'internship') {
        const blockLabel = block === null ? '–' : String(block);
        appendText(link, 'span', `${blockLabel}.${module.credits ?? '—'}`, 'curriculum-module-meta');
      }
      container.append(link);
    }
  }
  layout.append(grid);
  scroll.append(layout);
  target.append(scroll);
  const legend = el('p', 'curriculum-legend');
  legend.textContent = 'Blocknummer des Moduls   x.y   Leistungspunkte nach ECTS';
  target.append(legend);
}


type StudyTableRow = { name: string; type: string; hours: string; graded: string; nonGraded: string; credits: string };
type StudyTableModule = { id: string; title: string; credits: number; rows: StudyTableRow[] };
type StudyTableSemester = { semester: number; credits: number; modules: StudyTableModule[] };

const studyTableData: StudyTableSemester[] = [
  { semester: 1, credits: 30, modules: [
    { id: 'code1', title: 'Code 1', credits: 6, rows: [{ name: 'Code 1', type: 'S', hours: '4', graded: '1sbK', nonGraded: '', credits: '6' }] },
    { id: 'theory1', title: 'Theory 1', credits: 6, rows: [{ name: 'Computer Science and HCI Theory', type: 'V/S', hours: '4', graded: '1sbK', nonGraded: '1R', credits: '6' }] },
    { id: 'stem1', title: 'STEM 1', credits: 6, rows: [
      { name: 'STEM 1 Seminar', type: 'S', hours: '3', graded: '1K', nonGraded: '', credits: '4' },
      { name: 'STEM 1 Practical', type: 'P', hours: '1', graded: '', nonGraded: '1sbA', credits: '2' }
    ] },
    { id: 'visual1', title: 'Visual 1', credits: 6, rows: [{ name: 'Visual 1', type: 'S/P', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] },
    { id: 'project1', title: 'Project 1', credits: 6, rows: [{ name: 'Entry Project - No Code', type: 'W', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] }
  ] },
  { semester: 2, credits: 30, modules: [
    { id: 'code2', title: 'Code 2', credits: 6, rows: [{ name: 'Code 2', type: 'S/P', hours: '4', graded: '1sbK', nonGraded: '', credits: '6' }] },
    { id: 'theory2', title: 'Theory 2', credits: 6, rows: [
      { name: 'Theory 2 - Game Design', type: 'S/P', hours: '2', graded: '1sbK', nonGraded: '', credits: '3' },
      { name: 'Theory 2 - Data Driven Game Design', type: 'S', hours: '2', graded: '1KO', nonGraded: '', credits: '3' }
    ] },
    { id: 'sound1', title: 'Sound 1', credits: 6, rows: [{ name: 'Sound 1 - Basics of sound and music design', type: 'S', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] },
    { id: 'visual2', title: 'Visual 2', credits: 6, rows: [{ name: 'Visual 2 - Game Asset Creation', type: 'S/P', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] },
    { id: 'project2', title: 'Project 2', credits: 6, rows: [{ name: 'Project 2 - Physical Game', type: 'W', hours: '3', graded: '1A', nonGraded: '', credits: '6' }] }
  ] },
  { semester: 3, credits: 30, modules: [
    { id: 'code3', title: 'Code 3', credits: 6, rows: [{ name: 'Code 3 - Realtime Computer Graphics', type: 'S/P', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] },
    { id: 'sound2', title: 'Sound 2', credits: 6, rows: [{ name: 'Sound 2 - Concepts and techniques in interactive and immersive audio design', type: 'S/P', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] },
    { id: 'stem2', title: 'STEM 2', credits: 6, rows: [{ name: 'STEM 2', type: 'S', hours: '4', graded: '1sbK, 1sbA', nonGraded: '', credits: '6' }] },
    { id: 'visual3', title: 'Visual 3', credits: 6, rows: [{ name: 'Visual 3 - Game Character Design and Animation', type: 'S/P', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] },
    { id: 'project3', title: 'Project 3', credits: 6, rows: [{ name: 'Project 3 - Intermediate Digital Project', type: 'W', hours: '3', graded: '1A', nonGraded: '', credits: '6' }] }
  ] },
  { semester: 4, credits: 30, modules: [
    { id: 'code4', title: 'Code 4', credits: 6, rows: [{ name: 'Code 4', type: 'S/P', hours: '4', graded: '1K', nonGraded: '', credits: '6' }] },
    { id: 'theory3', title: 'Theory 3', credits: 6, rows: [{ name: 'Theory 3', type: 'S', hours: '4', graded: '1sbK', nonGraded: '', credits: '6' }] },
    { id: 'business1', title: 'Business 1', credits: 6, rows: [{ name: 'Business 1', type: 'S', hours: '4', graded: '1sbK', nonGraded: '', credits: '6' }] },
    { id: 'stem3', title: 'STEM 3', credits: 6, rows: [{ name: 'STEM 3 - Physical Computing', type: 'S/P', hours: '4', graded: '1sbA', nonGraded: '', credits: '6' }] },
    { id: 'project4', title: 'Project 4', credits: 6, rows: [{ name: 'Project 4 - Advanced Digital Project', type: 'W', hours: '3', graded: '1A', nonGraded: '', credits: '6' }] }
  ] },
  { semester: 5, credits: 30, modules: [
    { id: 'internship', title: 'Internship', credits: 30, rows: [
      { name: 'Internship', type: '', hours: '', graded: '', nonGraded: '1sbA', credits: '28' },
      { name: 'Seminar Internship', type: 'S', hours: '1', graded: '', nonGraded: '1R', credits: '2' }
    ] }
  ] },
  { semester: 6, credits: 30, modules: [
    { id: 'elective1', title: 'Elective 1', credits: 6, rows: [{ name: 'Elective Course (WPM) see (5)', type: '', hours: '', graded: 'PL', nonGraded: 'SL', credits: '6' }] },
    { id: 'elective2', title: 'Elective 2', credits: 6, rows: [{ name: 'Elective Course (WPM) see (5)', type: '', hours: '', graded: 'PL', nonGraded: 'SL', credits: '6' }] },
    { id: 'business2', title: 'Business 2', credits: 6, rows: [{ name: 'Business 2', type: 'S', hours: '4', graded: '1sbK', nonGraded: '', credits: '6' }] },
    { id: 'project5', title: 'Project 5', credits: 12, rows: [{ name: 'Project 5 - Complex Digital Project', type: 'W', hours: '3', graded: '1A', nonGraded: '', credits: '12' }] }
  ] },
  { semester: 7, credits: 30, modules: [
    { id: 'elective3', title: 'Elective 3', credits: 6, rows: [{ name: 'Elective Course (WPM) see (5)', type: '', hours: '', graded: 'PL', nonGraded: 'SL', credits: '6' }] },
    { id: 'elective4', title: 'Elective 4', credits: 6, rows: [{ name: 'Elective Course (WPM) see (5)', type: '', hours: '', graded: 'PL', nonGraded: 'SL', credits: '6' }] },
    { id: 'thesis', title: 'Thesis', credits: 18, rows: [
      { name: 'Bachelor thesis', type: '', hours: '', graded: '1T', nonGraded: '', credits: '12' },
      { name: 'Thesis Seminar', type: 'S', hours: '2', graded: '', nonGraded: '1PN', credits: '6' }
    ] }
  ] }
];

export function renderStudyTables(target: HTMLElement): void {
  target.replaceChildren();
  for (const [tableNumber, semesters, heading] of [
    [2, studyTableData.slice(0, 2), 'Foundation Studies'],
    [3, studyTableData.slice(2), 'Advanced Studies']
  ] as [number, StudyTableSemester[], string][]) {
    const sectionNode = el('section', 'study-table-section');
    appendText(sectionNode, 'h2', `Table ${tableNumber}: Games & Immersive Media B.A. (${tableNumber === 2 ? '1-2' : '3-7'} ${heading} Curricular Semester)`);
    const scroll = el('div', 'table-scroll');
    const table = el('table', 'study-table');
    const thead = el('thead');
    const header = el('tr');
    for (const title of ['Module', 'Module component', 'Type of course', 'No. contact hours per week', 'Graded assessment', 'Non-graded assessment', 'Credit points']) appendText(header, 'th', title);
    thead.append(header);
    table.append(thead);
    const body = el('tbody');
    for (const semester of semesters) {
      const semesterRow = el('tr', 'semester-row');
      const semesterCell = el('th', undefined, `${semester.semester}. Curricular Semester`);
      semesterCell.colSpan = 6;
      semesterRow.append(semesterCell);
      const total = el('th', undefined, String(semester.credits));
      total.className = 'semester-total';
      semesterRow.append(total);
      body.append(semesterRow);
      for (const module of semester.modules) {
        module.rows.forEach((item, index) => {
          const row = el('tr', index === 0 ? 'module-first-row' : 'module-continuation-row');
          if (index === 0) {
            const moduleCell = el('th', 'module-group', `${module.title} (${module.credits} credits)`);
            moduleCell.rowSpan = module.rows.length;
            row.append(moduleCell);
          }
          appendText(row, 'td', item.name);
          appendText(row, 'td', item.type);
          appendText(row, 'td', item.hours);
          appendText(row, 'td', item.graded);
          appendText(row, 'td', item.nonGraded);
          appendText(row, 'td', item.credits);
          body.append(row);
        });
      }
    }
    if (tableNumber === 3) {
      const overall = el('tr', 'overall-row');
      const label = el('th', undefined, 'Overall'); label.colSpan = 6; overall.append(label);
      overall.append(el('th', undefined, '150'));
      body.append(overall);
    } else {
      const overall = el('tr', 'overall-row');
      const label = el('th', undefined, 'Overall'); label.colSpan = 6; overall.append(label);
      overall.append(el('th', undefined, '60'));
      body.append(overall);
    }
    table.append(body);
    scroll.append(table);
    sectionNode.append(scroll);
    target.append(sectionNode);
  }
}


export function renderModuleTile(module: ModuleData): HTMLAnchorElement {
  const link = el('a', 'module-tile');
  link.href = `./module.html?id=${encodeURIComponent(module.id)}`;
  appendText(link, 'span', String(module.semester ?? '').padStart(2, '0'), 'tile-number');
  const main = el('span', 'tile-main');
  appendText(main, 'strong', module.title);
  appendText(main, 'small', `Semester ${module.semester ?? '—'} · Required module`);
  link.append(main);
  appendText(link, 'span', `${module.credits ?? '—'} ECTS`, 'tile-credits');
  appendText(link, 'span', '↗', 'tile-arrow');
  return link;
}

export async function renderModuleList(
  target: HTMLElement,
  semesters: SemesterGroup[],
  loadModule: (id: string) => Promise<ModuleData>
): Promise<void> {
  target.replaceChildren();
  for (const semester of semesters) {
    const group = section(semester.title, target);
    const modules = await Promise.all(semester.modules.map(id => loadModule(id)));
    for (const module of modules) group.append(renderModuleTile(module));
  }
}

export function renderModuleDetail(target: HTMLElement, module: ModuleData): void {
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
  const factValues: [string, unknown][] = [
    ['Workload', module.workload_hours === null || module.workload_hours === undefined ? '—' : `${module.workload_hours} h`],
    ['Semester', module.semester], ['Frequency', module.frequency],
    ['Duration', module.duration === null || module.duration === undefined ? '—' : `${module.duration} semester`]
  ];
  for (const [label, value] of factValues) {
    const cell = el('div'); appendText(cell, 'span', label); appendText(cell, 'strong', value); facts.append(cell);
  }
  article.append(facts);

  const components = section('Course Components', article);
  const componentScroll = el('div', 'table-scroll');
  const componentTable = el('table', 'component-table');
  const componentHead = el('thead');
  const componentHeader = el('tr');
  for (const heading of ['Component', 'Course type', 'Language', 'Contact hours', 'Self-study', 'Class size', 'ECTS']) appendText(componentHeader, 'th', heading);
  componentHead.append(componentHeader);
  componentTable.append(componentHead);
  const componentBody = el('tbody');
  for (const component of module.components ?? []) {
    const row = el('tr');
    appendText(row, 'td', `${component.label ? `${component.label} ` : ''}${component.name ?? ''}`.trim());
    appendText(row, 'td', component.course_type);
    appendText(row, 'td', component.language?.join(' / '));
    appendText(row, 'td', component.contact_hours);
    appendText(row, 'td', component.self_study_hours === undefined ? undefined : `${component.self_study_hours} h`);
    appendText(row, 'td', component.class_size);
    appendText(row, 'td', component.credit_points);
    componentBody.append(row);
  }
  componentTable.append(componentBody);
  componentScroll.append(componentTable);
  components.append(componentScroll);

  const outcomes = section('Module Learning Outcomes', article);
  if (module.learning_outcomes_intro) appendText(outcomes, 'p', module.learning_outcomes_intro);
  const outcomeGrid = el('div', 'outcome-grid');
  for (const outcome of module.learning_outcomes ?? []) {
    const card = el('div', 'outcome-card'); appendText(card, 'h3', outcome.category); addList(card, outcome.items); outcomeGrid.append(card);
  }
  outcomes.append(outcomeGrid);

  const content = section('Individual Component Content', article);
  for (const item of module.individual_component_content ?? []) {
    if (item.component) appendText(content, 'h3', item.component);
    addList(content, item.items, 'tag-list');
  }

  const twoCol = el('section', 'two-column-sections');
  for (const [title, items] of [['Teaching Methods', module.teaching_methods], ['Prerequisites', module.prerequisites]] as const) {
    const block = el('div', 'content-section'); appendText(block, 'h2', title);
    for (const item of items ?? []) { if (item.component) appendText(block, 'h3', item.component); addList(block, item.items); }
    twoCol.append(block);
  }
  article.append(twoCol);

  const assessment = section('Methods of Assessment', article);
  const assessmentScroll = el('div', 'table-scroll');
  const assessmentTable = el('table', 'assessment-table');
  const assessmentHead = el('thead');
  const assessmentHeader = el('tr');
  for (const heading of ['Component', 'Code', 'Assessment', 'Grading', 'ECTS']) appendText(assessmentHeader, 'th', heading);
  assessmentHead.append(assessmentHeader);
  assessmentTable.append(assessmentHead);
  const assessmentBody = el('tbody');
  for (const item of module.assessment ?? []) {
    const row = el('tr');
    appendText(row, 'td', item.component);
    appendText(row, 'td', item.code);
    appendText(row, 'td', item.description);
    appendText(row, 'td', item.graded_assessment === null || item.graded_assessment === undefined ? undefined : item.graded_assessment ? 'Graded' : 'Non-graded');
    appendText(row, 'td', item.credits);
    assessmentBody.append(row);
  }
  assessmentTable.append(assessmentBody);
  assessmentScroll.append(assessmentTable);
  assessment.append(assessmentScroll);

  const applicability = section('Applicability of Module', article);
  appendText(applicability, 'p', 'Required module in:'); addList(applicability, module.applicability);

  const people = section('Person responsible for Module and Lecturers', article);
  const responsible = el('p'); const label = el('strong', undefined, 'Person responsible for module: '); responsible.append(label, document.createTextNode(module.responsible_person || '—')); people.append(responsible);
  for (const item of module.lecturers ?? []) {
    const p = el('p'); if (item.component) p.append(el('strong', undefined, item.component), document.createElement('br'));
    p.append(document.createTextNode(item.names?.join(', ') || '—')); people.append(p);
  }

  const reading = section('Reading List', article);
  const readingList = el('ul', 'reading-list');
  for (const item of module.reading_list ?? []) appendText(readingList, 'li', item.reference);
  reading.append(readingList);

  if (module.extraction_note) appendText(article, 'p', module.extraction_note, 'source-note');
  target.append(article);
}

export function renderError(target: HTMLElement, title: string, message: string): void {
  target.replaceChildren();
  const box = el('div', 'notice'); appendText(box, 'h1', title); appendText(box, 'p', message); target.append(box);
}
