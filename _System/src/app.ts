import { loadCurriculum, loadManifest, loadModule } from "./modules.js";
import { renderCurriculum, renderError, renderModuleDetail, renderModuleDetails, renderStudyTables } from "./render.js";
import { loadProgrammeMetadata, loadSpecifics } from "./specifics.js";
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
  const parameters: URLSearchParams = new URLSearchParams(window.location.search);
  const moduleRef: string | null = parameters.get("module");
  const elements: AppElements = getElements();
  attachPrintControl();
  if (!moduleRef) attachSpecificsPanel(elements, document.body.dataset.specifics ?? "./specifics.json");

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
  const button: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>("#print-all");
  const panels: HTMLDetailsElement[] = [...document.querySelectorAll<HTMLDetailsElement>("#curriculum-view .programme-accordion > details")];
  if (!button || panels.length === 0) return;

  button.addEventListener("click", () => {
    const previousStates: boolean[] = panels.map((_panel: HTMLDetailsElement): boolean => _panel.open);
    panels.forEach((_panel: HTMLDetailsElement): void => _panel.open = true);
    window.addEventListener("afterprint", () => {
      panels.forEach((_panel: HTMLDetailsElement, _index: number): void => _panel.open = previousStates[_index]);
    }, { once: true });
    window.print();
  });
}

function attachSpecificsPanel(_elements: AppElements, _reference: string): void {
  const panel: HTMLElement | null = _elements.specificsPanel;
  const target: HTMLElement | null = _elements.specificsTarget;
  if (!panel || !target) return;
  void loadProgrammeMetadata(_reference);
  void loadSpecifics(target, _reference, "h2");
}

async function showModuleDetail(_reference: string, _elements: AppElements): Promise<void> {
  if (_elements.detailView) _elements.detailView.hidden = false;
  if (_elements.curriculumView) _elements.curriculumView.hidden = true;
  if (!_elements.detailTarget) return;
  const module: ModuleData = await loadModule(_reference);
  document.title = `${module.title} · Module Handbook`;
  renderModuleDetail(_elements.detailTarget, module);
}

async function showProgramme(_elements: AppElements): Promise<void> {
  if (_elements.curriculumView) _elements.curriculumView.hidden = false;
  if (_elements.detailView) _elements.detailView.hidden = true;
  if (!_elements.curriculumTarget) return;
  const [semesters, curriculum]: [SemesterGroup[], Awaited<ReturnType<typeof loadCurriculum>>] = await Promise.all([loadManifest(), loadCurriculum()]);
  const references: string[] = [...new Set(semesters.flatMap((_semester: SemesterGroup): string[] => _semester.modules))];
  const modules: ModuleData[] = await Promise.all(references.map(loadModule));
  renderCurriculum(_elements.curriculumTarget, modules, curriculum);
  attachCurriculumPanel(_elements, modules, curriculum);
  attachDetailsPanel(_elements, semesters, modules);
}

function attachCurriculumPanel(_elements: AppElements, _modules: ModuleData[], _curriculum: Awaited<ReturnType<typeof loadCurriculum>>): void {
  const panel: HTMLElement | null = _elements.curriculumPanel;
  const target: HTMLElement | null = _elements.overviewTarget;
  if (!panel || !target) return;
  renderStudyTables(target, _modules, _curriculum);
}

function attachDetailsPanel(
  _elements: AppElements, _semesters: SemesterGroup[], _modules: ModuleData[]
): void {
  const panel: HTMLElement | null = _elements.detailsPanel;
  const target: HTMLElement | null = _elements.detailsTarget;
  if (!panel || !target) return;
  renderModuleDetails(target, _semesters, _modules);
}

function renderPageError(_error: unknown, _moduleRef: string | null, _elements: AppElements): void {
  const message: string = _error instanceof Error ? _error.message : String(_error);
  if (_elements.detailTarget && _moduleRef) {
    renderError(_elements.detailTarget, "Module not found", message);
  }
  if (_elements.curriculumTarget && !_moduleRef) {
    renderError(_elements.curriculumTarget, "Study structure could not be loaded", message);
  }
}

void start();
