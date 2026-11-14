import { loadCurriculum, loadManifest, loadModule } from "./modules.js";
import { renderCurriculum, renderError, renderModuleDetail, renderModuleDetails, renderModuleList, renderStudyTables } from "./render.js";
import { loadSpecifics } from "./specifics.js";
async function start() {
    const parameters = new URLSearchParams(window.location.search);
    const moduleRef = parameters.get("module");
    const view = parameters.get("view") ?? "curriculum";
    const curriculumView = document.querySelector("#curriculum-view");
    const listView = document.querySelector("#module-list-view");
    const detailView = document.querySelector("#module-detail-view");
    const curriculumTarget = document.querySelector("#curriculum-grid");
    const curriculumPanel = document.querySelector("#curriculum-panel");
    const detailsPanel = document.querySelector("#details-panel");
    const specificsPanel = document.querySelector("#specifics-panel");
    const specificsTarget = document.querySelector("#specifics-content");
    const overviewTarget = document.querySelector("#module-overview");
    const detailsTarget = document.querySelector("#module-details");
    const listTarget = document.querySelector("#module-list");
    const detailTarget = document.querySelector("#module-detail");
    if (specificsPanel && specificsTarget) {
        renderWhenOpened(specificsPanel, () => void loadSpecifics(specificsTarget));
    }
    try {
        if (moduleRef) {
            if (detailView)
                detailView.hidden = false;
            if (curriculumView)
                curriculumView.hidden = true;
            if (listView)
                listView.hidden = true;
            if (!detailTarget)
                return;
            const module = await loadModule(moduleRef);
            document.title = `${module.title} · Module Handbook`;
            renderModuleDetail(detailTarget, module);
            return;
        }
        if (view === "modules") {
            if (listView)
                listView.hidden = false;
            if (curriculumView)
                curriculumView.hidden = true;
            if (detailView)
                detailView.hidden = true;
            if (!listTarget)
                return;
            await renderModuleList(listTarget, await loadManifest(), loadModule);
            return;
        }
        if (curriculumView)
            curriculumView.hidden = false;
        if (listView)
            listView.hidden = true;
        if (detailView)
            detailView.hidden = true;
        if (!curriculumTarget)
            return;
        const [semesters, curriculum] = await Promise.all([loadManifest(), loadCurriculum()]);
        const references = [...new Set(semesters.flatMap(semester => semester.modules))];
        const modules = await Promise.all(references.map(loadModule));
        renderCurriculum(curriculumTarget, modules, curriculum);
        if (curriculumPanel && overviewTarget) {
            renderWhenOpened(curriculumPanel, () => renderStudyTables(overviewTarget, modules));
        }
        if (detailsPanel && detailsTarget) {
            renderWhenOpened(detailsPanel, () => renderModuleDetails(detailsTarget, semesters, modules));
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (detailTarget && moduleRef)
            renderError(detailTarget, "Module not found", message);
        if (curriculumTarget && !moduleRef && view !== "modules") {
            renderError(curriculumTarget, "Study structure could not be loaded", message);
        }
        if (listTarget && view === "modules")
            renderError(listTarget, "Modules could not be loaded", message);
    }
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
