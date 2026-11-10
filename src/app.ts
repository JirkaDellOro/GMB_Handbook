import { loadManifest, loadModule } from './modules.js';
import { renderError, renderModuleDetail, renderModuleList } from './render.js';

async function start(): Promise<void> {
  const listTarget = document.querySelector<HTMLElement>('#module-list');
  const previewTarget = document.querySelector<HTMLElement>('#module-preview-list');
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
    if (listTarget || previewTarget) {
      const entries = await loadManifest();
      if (listTarget) renderModuleList(listTarget, entries);
      if (previewTarget) {
        const firstModules = [...entries].sort((a, b) => Number(a.semester ?? 99) - Number(b.semester ?? 99) || a.title.localeCompare(b.title)).slice(0, 5);
        renderModuleList(previewTarget, firstModules);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (detailTarget) renderError(detailTarget, 'Module not found', message);
    if (listTarget) renderError(listTarget, 'Modules could not be loaded', message);
    if (previewTarget) renderError(previewTarget, 'Modules could not be loaded', message);
  }
}

void start();
