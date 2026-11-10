import { loadManifest, loadModule } from './modules.js';
import { renderError, renderModuleDetail, renderModuleList } from './render.js';

async function start(): Promise<void> {
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
    if (listTarget) {
      const semesters = await loadManifest();
      await renderModuleList(listTarget, semesters, loadModule);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (detailTarget) renderError(detailTarget, 'Module not found', message);
    if (listTarget) renderError(listTarget, 'Modules could not be loaded', message);
  }
}

void start();
