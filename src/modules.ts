import type { CurriculumData, ModuleData, SemesterGroup } from "./types.js";
let manifestPromise: Promise<SemesterGroup[]> | undefined;
let curriculumPromise: Promise<CurriculumData> | undefined;
const moduleCache = new Map<string, Promise<ModuleData>>();
export function loadManifest(): Promise<SemesterGroup[]> {
  if (!manifestPromise) manifestPromise = fetch("./manifest.json").then(checkResponse).then(_response => _response.json() as Promise<SemesterGroup[]>);
  return manifestPromise;
}
export function loadCurriculum(): Promise<CurriculumData> {
  if (!curriculumPromise) curriculumPromise = fetch("./curriculum.json").then(checkResponse).then(_response => _response.json() as Promise<CurriculumData>);
  return curriculumPromise;
}
export function loadModule(_reference: string): Promise<ModuleData> {
  if (!isValidModuleReference(_reference)) return Promise.reject(new Error("Invalid module reference."));
  if (!moduleCache.has(_reference)) {
    moduleCache.set(_reference, fetch(_reference).then(checkResponse).then(_response => _response.json() as Promise<ModuleData>).then(module => {
      const expectedId = _reference.split("/").pop()?.replace(".json", "");
      if (module.id !== expectedId) throw new Error(`Module ID mismatch in ${_reference}.`);
      return { ...module, sourceRef: _reference };
    }));
  }
  return moduleCache.get(_reference)!;
}
function isValidModuleReference(_reference: string): boolean {
  return /^(?:modules\/[a-z0-9]+\.json|\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(_reference);
}
function checkResponse(_response: Response): Response {
  if (!_response.ok) throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
  return _response;
}
