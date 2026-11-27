let curriculumPromise;
const moduleCache = new Map();
export function loadCurriculum() {
    if (!curriculumPromise)
        curriculumPromise = fetchJson("./curriculum.json").then(normalizeCurriculum);
    return curriculumPromise;
}
export function loadModule(_reference) {
    if (!isValidModuleReference(_reference))
        return Promise.reject(new Error("Invalid module reference."));
    const cachedModule = moduleCache.get(_reference);
    if (cachedModule)
        return cachedModule;
    const request = fetchJson(_reference).then((_module) => addSourceReference(_module, _reference));
    moduleCache.set(_reference, request);
    return request;
}
function normalizeCurriculum(_file) {
    const modules = {};
    const semesters = [];
    const studyStages = [];
    _file.studyStages.forEach((stage) => {
        const numbers = stage.semesters.map((_semester) => _semester.semester);
        if (numbers.length > 0)
            studyStages.push({ title: stage.title, firstSemester: Math.min(...numbers), lastSemester: Math.max(...numbers) });
        stage.semesters.forEach((_semester) => {
            const references = [];
            _semester.modules.forEach((item) => {
                if (isSpecialization(item)) {
                    item.modules.forEach((module) => {
                        references.push(module.file);
                        addModulePlacement(modules, module, _semester.semester, item.title);
                    });
                }
                else {
                    references.push(item.file);
                    addModulePlacement(modules, item, _semester.semester);
                }
            });
            semesters.push({ title: `Semester ${_semester.semester}`, modules: references });
        });
    });
    return { programmeName: _file.programmeName, tableHeadings: _file.tableHeadings, studyTables: _file.studyTables, columns: _file.columns, studyStages, semesters, modules };
}
function isSpecialization(_item) {
    return "title" in _item && "modules" in _item;
}
function addModulePlacement(_positions, _module, _semester, _specializationTitle) {
    const placement = { column: _module.column ?? "", semester: _semester, block: _module.block, style: _module.style, span: _module.span, track: _module.track, specializationTitle: _specializationTitle };
    const position = _positions[_module.file] ?? { placements: [] };
    position.placements.push(placement);
    _positions[_module.file] = position;
}
async function fetchJson(_reference) {
    const response = await fetch(_reference);
    checkResponse(response);
    return response.json();
}
function addSourceReference(_module, _reference) {
    const expectedId = _reference.split("/").pop()?.replace(".json", "");
    if (_module.id !== expectedId)
        throw new Error(`Module ID mismatch in ${_reference}.`);
    return { ..._module, sourceRef: _reference };
}
function isValidModuleReference(_reference) {
    return /^(?:modules\/[a-z0-9]+\.json|\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(_reference);
}
function checkResponse(_response) {
    if (!_response.ok)
        throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
}
