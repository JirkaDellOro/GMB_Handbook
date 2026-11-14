import { loadCurriculum, loadManifest, loadModule } from "./modules.js";
import { renderCurriculum, renderError, renderModuleDetail, renderModuleList, renderStudyTables } from "./render.js";

async function start(): Promise<void> {
  const parameters = new URLSearchParams(window.location.search);
  const moduleRef = parameters.get("module");
  const view = parameters.get("view") ?? "curriculum";
  const curriculumView = document.querySelector<HTMLElement>("#curriculum-view");
  const listView = document.querySelector<HTMLElement>("#module-list-view");
  const detailView = document.querySelector<HTMLElement>("#module-detail-view");
  const curriculumTarget = document.querySelector<HTMLElement>("#curriculum-grid");
  const overviewTarget = document.querySelector<HTMLElement>("#module-overview");
  const listTarget = document.querySelector<HTMLElement>("#module-list");
  const detailTarget = document.querySelector<HTMLElement>("#module-detail");
  try {
    if (moduleRef) {
      if (detailView) detailView.hidden = false;
      if (curriculumView) curriculumView.hidden = true;
      if (listView) listView.hidden = true;
      if (!detailTarget) return;
      const module = await loadModule(moduleRef);
      document.title = `${module.title} · Module Handbook`;
      renderModuleDetail(detailTarget, module);
      return;
    }
    if (view === "modules") {
      if (listView) listView.hidden = false;
      if (curriculumView) curriculumView.hidden = true;
      if (detailView) detailView.hidden = true;
      if (!listTarget) return;
      await renderModuleList(listTarget, await loadManifest(), loadModule);
      return;
    }
    if (curriculumView) curriculumView.hidden = false;
    if (listView) listView.hidden = true;
    if (detailView) detailView.hidden = true;
    if (!curriculumTarget) return;
    const [semesters, curriculum] = await Promise.all([loadManifest(), loadCurriculum()]);
    const refs = [...new Set(semesters.flatMap(semester => semester.modules))];
    const modules = await Promise.all(refs.map(loadModule));
    renderCurriculum(curriculumTarget, modules, curriculum);
    if (overviewTarget) renderStudyTables(overviewTarget, modules);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (detailTarget && moduleRef) renderError(detailTarget, "Module not found", message);
    if (curriculumTarget && !moduleRef && view !== "modules") renderError(curriculumTarget, "Study structure could not be loaded", message);
    if (listTarget && view === "modules") renderError(listTarget, "Modules could not be loaded", message);
  }
}
void start();
