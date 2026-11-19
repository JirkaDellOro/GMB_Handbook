import type { CurriculumData, ModuleData, SemesterGroup } from "./types.js";

let manifestPromise: Promise<SemesterGroup[]> | undefined;
let curriculumPromise: Promise<CurriculumData> | undefined;
const moduleCache = new Map<string, Promise<ModuleData>>();

export function loadManifest(): Promise<SemesterGroup[]> {
  if (!manifestPromise) manifestPromise = fetchJson<SemesterGroup[]>("./manifest.json");
  return manifestPromise;
}

export function loadCurriculum(): Promise<CurriculumData> {
  if (!curriculumPromise) curriculumPromise = fetchJson<CurriculumData>("./curriculum.json");
  return curriculumPromise;
}

export function loadModule(_reference: string): Promise<ModuleData> {
  if (!isValidModuleReference(_reference)) return Promise.reject(new Error("Invalid module reference."));
  const cachedModule = moduleCache.get(_reference);
  if (cachedModule) return cachedModule;
  const request = fetchJson<ModuleData>(_reference).then(_module => addSourceReference(_module, _reference));
  moduleCache.set(_reference, request);
  return request;
}

async function fetchJson<T>(_reference: string): Promise<T> {
  const response = await fetch(_reference);
  checkResponse(response);
  return response.json() as Promise<T>;
}

function addSourceReference(_module: ModuleData, _reference: string): ModuleData {
  const expectedId = _reference.split("/").pop()?.replace(".json", "");
  if (_module.id !== expectedId) throw new Error(`Module ID mismatch in ${_reference}.`);
  return { ..._module, sourceRef: _reference };
}

function isValidModuleReference(_reference: string): boolean {
  return /^(?:modules\/[a-z0-9]+\.json|\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(_reference);
}

function checkResponse(_response: Response): void {
  if (!_response.ok) throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
}
