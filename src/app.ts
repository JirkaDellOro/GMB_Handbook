import { loadCurriculum, loadManifest, loadModule } from "./modules.js";
import { renderCurriculum, renderError, renderModuleDetail, renderModuleDetails, renderModuleList, renderStudyTables } from "./render.js";
import { loadSpecifics } from "./specifics.js";

interface AppElements {
  curriculumView: HTMLElement | null;
  listView: HTMLElement | null;
  detailView: HTMLElement | null;
  curriculumTarget: HTMLElement | null;
  curriculumPanel: HTMLDetailsElement | null;
  detailsPanel: HTMLDetailsElement | null;
  specificsPanel: HTMLDetailsElement | null;
  specificsTarget: HTMLElement | null;
  overviewTarget: HTMLElement | null;
  detailsTarget: HTMLElement | null;
  listTarget: HTMLElement | null;
  detailTarget: HTMLElement | null;
}

async function start(): Promise<void> {
  const parameters = new URLSearchParams(window.location.search);
  const moduleRef = parameters.get("module");
  const view = parameters.get("view") ?? "curriculum";
  const elements = getElements();
  attachSpecificsPanel(elements);
  try {
    if (moduleRef) return await showModuleDetail(moduleRef, elements);
    if (view === "modules") return await showModuleList(elements);
    await showProgramme(elements);
  } catch (error) {
    renderPageError(error, moduleRef, view, elements);
  }
}

function getElements(): AppElements {
  return {
    curriculumView: document.querySelector<HTMLElement>("#curriculum-view"),
    listView: document.querySelector<HTMLElement>("#module-list-view"),
    detailView: document.querySelector<HTMLElement>("#module-detail-view"),
    curriculumTarget: document.querySelector<HTMLElement>("#curriculum-grid"),
    curriculumPanel: document.querySelector<HTMLDetailsElement>("#curriculum-panel"),
    detailsPanel: document.querySelector<HTMLDetailsElement>("#details-panel"),
    specificsPanel: document.querySelector<HTMLDetailsElement>("#specifics-panel"),
    specificsTarget: document.querySelector<HTMLElement>("#specifics-content"),
    overviewTarget: document.querySelector<HTMLElement>("#module-overview"),
    detailsTarget: document.querySelector<HTMLElement>("#module-details"),
    listTarget: document.querySelector<HTMLElement>("#module-list"),
    detailTarget: document.querySelector<HTMLElement>("#module-detail")
  };
}

function attachSpecificsPanel(_elements: AppElements): void {
  if (!_elements.specificsPanel || !_elements.specificsTarget) return;
  renderWhenOpened(_elements.specificsPanel, () => void loadSpecifics(_elements.specificsTarget!));
}

async function showModuleDetail(_reference: string, _elements: AppElements): Promise<void> {
  if (_elements.detailView) _elements.detailView.hidden = false;
  if (_elements.curriculumView) _elements.curriculumView.hidden = true;
  if (_elements.listView) _elements.listView.hidden = true;
  if (!_elements.detailTarget) return;
  const module = await loadModule(_reference);
  document.title = `${module.title} · Module Handbook`;
  renderModuleDetail(_elements.detailTarget, module);
}

async function showModuleList(_elements: AppElements): Promise<void> {
  if (_elements.listView) _elements.listView.hidden = false;
  if (_elements.curriculumView) _elements.curriculumView.hidden = true;
  if (_elements.detailView) _elements.detailView.hidden = true;
  if (!_elements.listTarget) return;
  await renderModuleList(_elements.listTarget, await loadManifest(), loadModule);
}

async function showProgramme(_elements: AppElements): Promise<void> {
  if (_elements.curriculumView) _elements.curriculumView.hidden = false;
  if (_elements.listView) _elements.listView.hidden = true;
  if (_elements.detailView) _elements.detailView.hidden = true;
  if (!_elements.curriculumTarget) return;
  const [semesters, curriculum] = await Promise.all([loadManifest(), loadCurriculum()]);
  const references = [...new Set(semesters.flatMap(semester => semester.modules))];
  const modules = await Promise.all(references.map(loadModule));
  renderCurriculum(_elements.curriculumTarget, modules, curriculum);
  attachCurriculumPanel(_elements, modules);
  attachDetailsPanel(_elements, semesters, modules);
}

function attachCurriculumPanel(_elements: AppElements, _modules: Awaited<ReturnType<typeof loadModule>>[]): void {
  if (!_elements.curriculumPanel || !_elements.overviewTarget) return;
  renderWhenOpened(_elements.curriculumPanel, () => renderStudyTables(_elements.overviewTarget!, _modules));
}

function attachDetailsPanel(
  _elements: AppElements, _semesters: Awaited<ReturnType<typeof loadManifest>>,
  _modules: Awaited<ReturnType<typeof loadModule>>[]
): void {
  if (!_elements.detailsPanel || !_elements.detailsTarget) return;
  renderWhenOpened(_elements.detailsPanel, () => renderModuleDetails(_elements.detailsTarget!, _semesters, _modules));
}

function renderPageError(_error: unknown, _moduleRef: string | null, _view: string, _elements: AppElements): void {
  const message = _error instanceof Error ? _error.message : String(_error);
  if (_elements.detailTarget && _moduleRef) renderError(_elements.detailTarget, "Module not found", message);
  if (_elements.curriculumTarget && !_moduleRef && _view !== "modules") {
    renderError(_elements.curriculumTarget, "Study structure could not be loaded", message);
  }
  if (_elements.listTarget && _view === "modules") renderError(_elements.listTarget, "Modules could not be loaded", message);
}

function renderWhenOpened(_panel: HTMLDetailsElement, _render: () => void): void {
  let rendered = false;
  const renderOnce = (): void => {
    if (!_panel.open || rendered) return;
    rendered = true;
    _render();
  };
  _panel.addEventListener("toggle", renderOnce);
  renderOnce();
}

void start();
