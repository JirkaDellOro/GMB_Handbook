import { loadCurriculum, loadManifest, loadModule } from "./modules.js";
import { renderCurriculum, renderError, renderModuleDetail, renderModuleDetails, renderStudyTables } from "./render.js";
import { loadSpecifics } from "./specifics.js";
async function start() {
    const parameters = new URLSearchParams(window.location.search);
    const moduleRef = parameters.get("module");
    const elements = getElements();
    attachPrintControl();
    attachSpecificsPanel(elements);
    try {
        if (moduleRef)
            return await showModuleDetail(moduleRef, elements);
        await showProgramme(elements);
    }
    catch (error) {
        renderPageError(error, moduleRef, elements);
    }
}
function getElements() {
    return {
        curriculumView: document.querySelector("#curriculum-view"),
        detailView: document.querySelector("#module-detail-view"),
        curriculumTarget: document.querySelector("#curriculum-grid"),
        curriculumPanel: document.querySelector("#curriculum-panel"),
        detailsPanel: document.querySelector("#details-panel"),
        specificsPanel: document.querySelector("#specifics-panel"),
        specificsTarget: document.querySelector("#specifics-content"),
        overviewTarget: document.querySelector("#module-overview"),
        detailsTarget: document.querySelector("#module-details"),
        detailTarget: document.querySelector("#module-detail")
    };
}
function attachPrintControl() {
    const button = document.querySelector("#print-all");
    const panels = [...document.querySelectorAll("#curriculum-view .programme-accordion > details")];
    if (!button || panels.length === 0)
        return;
    button.addEventListener("click", () => {
        const previousStates = panels.map(_panel => _panel.open);
        panels.forEach(_panel => _panel.open = true);
        window.addEventListener("afterprint", () => {
            panels.forEach((_panel, _index) => _panel.open = previousStates[_index]);
        }, { once: true });
        window.print();
    });
}
function attachSpecificsPanel(_elements) {
    const panel = _elements.specificsPanel;
    const target = _elements.specificsTarget;
    if (!panel || !target)
        return;
    void loadSpecifics(target, "./specifics.json", "h2");
}
async function showModuleDetail(_reference, _elements) {
    if (_elements.detailView)
        _elements.detailView.hidden = false;
    if (_elements.curriculumView)
        _elements.curriculumView.hidden = true;
    if (!_elements.detailTarget)
        return;
    const module = await loadModule(_reference);
    document.title = `${module.title} · Module Handbook`;
    renderModuleDetail(_elements.detailTarget, module);
}
async function showProgramme(_elements) {
    if (_elements.curriculumView)
        _elements.curriculumView.hidden = false;
    if (_elements.detailView)
        _elements.detailView.hidden = true;
    if (!_elements.curriculumTarget)
        return;
    const [semesters, curriculum] = await Promise.all([loadManifest(), loadCurriculum()]);
    const references = [...new Set(semesters.flatMap(_semester => _semester.modules))];
    const modules = await Promise.all(references.map(loadModule));
    renderCurriculum(_elements.curriculumTarget, modules, curriculum);
    attachCurriculumPanel(_elements, modules);
    attachDetailsPanel(_elements, semesters, modules);
}
function attachCurriculumPanel(_elements, _modules) {
    const panel = _elements.curriculumPanel;
    const target = _elements.overviewTarget;
    if (!panel || !target)
        return;
    renderStudyTables(target, _modules);
}
function attachDetailsPanel(_elements, _semesters, _modules) {
    const panel = _elements.detailsPanel;
    const target = _elements.detailsTarget;
    if (!panel || !target)
        return;
    renderModuleDetails(target, _semesters, _modules);
}
function renderPageError(_error, _moduleRef, _elements) {
    const message = _error instanceof Error ? _error.message : String(_error);
    if (_elements.detailTarget && _moduleRef)
        renderError(_elements.detailTarget, "Module not found", message);
    if (_elements.curriculumTarget && !_moduleRef)
        renderError(_elements.curriculumTarget, "Study structure could not be loaded", message);
}
void start();
