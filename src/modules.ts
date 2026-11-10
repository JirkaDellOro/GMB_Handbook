import type { ModuleData, ModuleManifestEntry } from './types.js';

const MODULES_PATH = './modules/';
let manifestPromise: Promise<ModuleManifestEntry[]> | undefined;
const moduleCache = new Map<string, Promise<ModuleData>>();

export function loadManifest(): Promise<ModuleManifestEntry[]> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${MODULES_PATH}manifest.json`)
      .then(checkResponse)
      .then(response => response.json() as Promise<ModuleManifestEntry[]>);
  }
  return manifestPromise;
}

export function loadModule(id: string): Promise<ModuleData> {
  if (!/^[a-z0-9]+$/.test(id)) return Promise.reject(new Error('Invalid module ID.'));
  if (!moduleCache.has(id)) {
    moduleCache.set(id, fetch(`${MODULES_PATH}${encodeURIComponent(id)}.json`)
      .then(checkResponse)
      .then(response => response.json() as Promise<ModuleData>)
      .then(module => {
        if (module.id !== id) throw new Error(`Module ID mismatch in ${id}.json`);
        return module;
      }));
  }
  return moduleCache.get(id)!;
}

function checkResponse(response: Response): Response {
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response;
}
