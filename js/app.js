import { loadCurriculum, loadManifest, loadModule } from "./modules.js";
import { renderCurriculum, renderError, renderModuleDetail, renderModuleDetails, renderModuleList, renderStudyTables } from "./render.js";
import { loadSpecifics } from "./specifics.js";
async function start() {
    const parameters = new URLSearchParams(window.location.search);
    const moduleRef = parameters.get("module");
    const view = parameters.get("view") ?? "curriculum";
    const elements = getElements();
    attachSpecificsPanel(elements);
    try {
        if (moduleRef)
            return await showModuleDetail(moduleRef, elements);
        if (view === "modules")
            return await showModuleList(elements);
        await showProgramme(elements);
    }
    catch (error) {
        renderPageError(error, moduleRef, view, elements);
    }
}
function getElements() {
    return {
        curriculumView: document.querySelector("#curriculum-view"),
        listView: document.querySelector("#module-list-view"),
        detailView: document.querySelector("#module-detail-view"),
        curriculumTarget: document.querySelector("#curriculum-grid"),
        curriculumPanel: document.querySelector("#curriculum-panel"),
        detailsPanel: document.querySelector("#details-panel"),
        specificsPanel: document.querySelector("#specifics-panel"),
        specificsTarget: document.querySelector("#specifics-content"),
        overviewTarget: document.querySelector("#module-overview"),
        detailsTarget: document.querySelector("#module-details"),
        listTarget: document.querySelector("#module-list"),
        detailTarget: document.querySelector("#module-detail")
    };
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
    if (_elements.listView)
        _elements.listView.hidden = true;
    if (!_elements.detailTarget)
        return;
    const module = await loadModule(_reference);
    document.title = `${module.title} · Module Handbook`;
    renderModuleDetail(_elements.detailTarget, module);
}
async function showModuleList(_elements) {
    if (_elements.listView)
        _elements.listView.hidden = false;
    if (_elements.curriculumView)
        _elements.curriculumView.hidden = true;
    if (_elements.detailView)
        _elements.detailView.hidden = true;
    if (!_elements.listTarget)
        return;
    await renderModuleList(_elements.listTarget, await loadManifest(), loadModule);
}
async function showProgramme(_elements) {
    if (_elements.curriculumView)
        _elements.curriculumView.hidden = false;
    if (_elements.listView)
        _elements.listView.hidden = true;
    if (_elements.detailView)
        _elements.detailView.hidden = true;
    if (!_elements.curriculumTarget)
        return;
    const [semesters, curriculum] = await Promise.all([loadManifest(), loadCurriculum()]);
    const references = [...new Set(semesters.flatMap(semester => semester.modules))];
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
function renderPageError(_error, _moduleRef, _view, _elements) {
    const message = _error instanceof Error ? _error.message : String(_error);
    if (_elements.detailTarget && _moduleRef)
        renderError(_elements.detailTarget, "Module not found", message);
    if (_elements.curriculumTarget && !_moduleRef && _view !== "modules") {
        renderError(_elements.curriculumTarget, "Study structure could not be loaded", message);
    }
    if (_elements.listTarget && _view === "modules")
        renderError(_elements.listTarget, "Modules could not be loaded", message);
}
function renderWhenOpened(_panel, _render) {
    let rendered = false;
    const renderOnce = () => {
        if (!_panel.open || rendered)
            return;
        rendered = true;
        _render();
    };
    _panel.addEventListener("toggle", renderOnce);
    renderOnce();
}
void start();
