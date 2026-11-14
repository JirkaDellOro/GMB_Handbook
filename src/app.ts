import { loadCurriculum, loadManifest, loadModule } from "./modules.js";
import { renderCurriculum, renderError, renderModuleDetail, renderModuleDetails, renderStudyTables } from "./render.js";
import { loadSpecifics } from "./specifics.js";
import type { ModuleData, SemesterGroup } from "./types.js";

interface AppElements {
  curriculumView: HTMLElement | null;
  detailView: HTMLElement | null;
  curriculumTarget: HTMLElement | null;
  curriculumPanel: HTMLElement | null;
  detailsPanel: HTMLElement | null;
  specificsPanel: HTMLElement | null;
  specificsTarget: HTMLElement | null;
  overviewTarget: HTMLElement | null;
  detailsTarget: HTMLElement | null;
  detailTarget: HTMLElement | null;
}

async function start(): Promise<void> {
  const parameters = new URLSearchParams(window.location.search);
  const moduleRef = parameters.get("module");
  const elements = getElements();
  attachPrintControl();
  attachSpecificsPanel(elements);

  try {
    if (moduleRef) return await showModuleDetail(moduleRef, elements);
    await showProgramme(elements);
  } catch (error) {
    renderPageError(error, moduleRef, elements);
  }
}

function getElements(): AppElements {
  return {
    curriculumView: document.querySelector<HTMLElement>("#curriculum-view"),
    detailView: document.querySelector<HTMLElement>("#module-detail-view"),
    curriculumTarget: document.querySelector<HTMLElement>("#curriculum-grid"),
    curriculumPanel: document.querySelector<HTMLElement>("#curriculum-panel"),
    detailsPanel: document.querySelector<HTMLElement>("#details-panel"),
    specificsPanel: document.querySelector<HTMLElement>("#specifics-panel"),
    specificsTarget: document.querySelector<HTMLElement>("#specifics-content"),
    overviewTarget: document.querySelector<HTMLElement>("#module-overview"),
    detailsTarget: document.querySelector<HTMLElement>("#module-details"),
    detailTarget: document.querySelector<HTMLElement>("#module-detail")
  };
}

function attachPrintControl(): void {
  const button = document.querySelector<HTMLButtonElement>("#print-all");
  const panels = [...document.querySelectorAll<HTMLDetailsElement>("#curriculum-view .programme-accordion > details")];
  if (!button || panels.length === 0) return;

  button.addEventListener("click", () => {
    const previousStates = panels.map(panel => panel.open);
    panels.forEach(panel => panel.open = true);
    window.addEventListener("afterprint", () => {
      panels.forEach((panel, index) => panel.open = previousStates[index]);
    }, { once: true });
    window.print();
  });
}

function attachSpecificsPanel(_elements: AppElements): void {
  const panel = _elements.specificsPanel;
  const target = _elements.specificsTarget;
  if (!panel || !target) return;
  void loadSpecifics(target, "./specifics.json", "h2");
}

async function showModuleDetail(_reference: string, _elements: AppElements): Promise<void> {
  if (_elements.detailView) _elements.detailView.hidden = false;
  if (_elements.curriculumView) _elements.curriculumView.hidden = true;
  if (!_elements.detailTarget) return;
  const module = await loadModule(_reference);
  document.title = `${module.title} · Module Handbook`;
  renderModuleDetail(_elements.detailTarget, module);
}

async function showProgramme(_elements: AppElements): Promise<void> {
  if (_elements.curriculumView) _elements.curriculumView.hidden = false;
  if (_elements.detailView) _elements.detailView.hidden = true;
  if (!_elements.curriculumTarget) return;
  const [semesters, curriculum] = await Promise.all([loadManifest(), loadCurriculum()]);
  const references = [...new Set(semesters.flatMap(semester => semester.modules))];
  const modules = await Promise.all(references.map(loadModule));
  renderCurriculum(_elements.curriculumTarget, modules, curriculum);
  attachCurriculumPanel(_elements, modules);
  attachDetailsPanel(_elements, semesters, modules);
}

function attachCurriculumPanel(_elements: AppElements, _modules: ModuleData[]): void {
  const panel = _elements.curriculumPanel;
  const target = _elements.overviewTarget;
  if (!panel || !target) return;
  renderStudyTables(target, _modules);
}

function attachDetailsPanel(
  _elements: AppElements, _semesters: SemesterGroup[], _modules: ModuleData[]
): void {
  const panel = _elements.detailsPanel;
  const target = _elements.detailsTarget;
  if (!panel || !target) return;
  renderModuleDetails(target, _semesters, _modules);
}

function renderPageError(_error: unknown, _moduleRef: string | null, _elements: AppElements): void {
  const message = _error instanceof Error ? _error.message : String(_error);
  if (_elements.detailTarget && _moduleRef) {
    renderError(_elements.detailTarget, "Module not found", message);
  }
  if (_elements.curriculumTarget && !_moduleRef) {
    renderError(_elements.curriculumTarget, "Study structure could not be loaded", message);
  }
}

void start();
