import type { CurriculumData, ModuleData, SemesterGroup } from "./types.js";
let manifestPromise: Promise<SemesterGroup[]> | undefined;
let curriculumPromise: Promise<CurriculumData> | undefined;
const moduleCache = new Map<string, Promise<ModuleData>>();
export function loadManifest(): Promise<SemesterGroup[]> {
  if (!manifestPromise) manifestPromise = fetch("./manifest.json").then(checkResponse).then(response => response.json() as Promise<SemesterGroup[]>);
  return manifestPromise;
}
export function loadCurriculum(): Promise<CurriculumData> {
  if (!curriculumPromise) curriculumPromise = fetch("./curriculum.json").then(checkResponse).then(response => response.json() as Promise<CurriculumData>);
  return curriculumPromise;
}
export function loadModule(reference: string): Promise<ModuleData> {
  if (!isValidModuleReference(reference)) return Promise.reject(new Error("Invalid module reference."));
  if (!moduleCache.has(reference)) {
    moduleCache.set(reference, fetch(reference).then(checkResponse).then(response => response.json() as Promise<ModuleData>).then(module => {
      const expectedId = reference.split("/").pop()?.replace(".json", "");
      if (module.id !== expectedId) throw new Error(`Module ID mismatch in ${reference}.`);
      return { ...module, sourceRef: reference };
    }));
  }
  return moduleCache.get(reference)!;
}
function isValidModuleReference(reference: string): boolean {
  return /^(?:modules\/[a-z0-9]+\.json|\.\/[a-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[a-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(reference);
}
function checkResponse(response: Response): Response {
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response;
}
