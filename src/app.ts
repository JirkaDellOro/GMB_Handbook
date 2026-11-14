import { loadCurriculum, loadManifest, loadModule } from './modules.js';
import { renderCurriculum, renderError, renderModuleDetail, renderModuleList, renderStudyTables } from './render.js';

void start();

async function start(): Promise<void> {
  const curriculumTarget = document.querySelector<HTMLElement>('#curriculum-grid');
  const overviewTarget = document.querySelector<HTMLElement>('#module-overview');
  const listTarget = document.querySelector<HTMLElement>('#module-list');
  const detailTarget = document.querySelector<HTMLElement>('#module-detail');

  try {
    if (detailTarget) {
      const id = new URLSearchParams(window.location.search).get('id') ?? '';
      if (!id) throw new Error('No module ID was provided in the URL.');
      const module = await loadModule(id);
      document.title = `${module.title} · Games & Immersive Media – Module Handbook`;
      renderModuleDetail(detailTarget, module);
      return;
    }

    if (curriculumTarget) {
      const [semesters, curriculum] = await Promise.all([loadManifest(), loadCurriculum()]);
      const modules = await Promise.all(
        [...new Set(semesters.flatMap(semester => semester.modules))].map(loadModule)
      );
      renderCurriculum(curriculumTarget, modules, curriculum);
      if (overviewTarget) renderStudyTables(overviewTarget, modules);
      return;
    }

    if (listTarget) {
      const semesters = await loadManifest();
      await renderModuleList(listTarget, semesters, loadModule);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (detailTarget) renderError(detailTarget, 'Module not found', message);
    if (curriculumTarget) renderError(curriculumTarget, 'Study structure could not be loaded', message);
    if (listTarget) renderError(listTarget, 'Modules could not be loaded', message);
  }
}
