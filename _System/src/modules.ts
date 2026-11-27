import type { CurriculumData, CurriculumFileData, CurriculumItem, CurriculumModuleEntry, CurriculumModulePosition, CurriculumPlacement, CurriculumSpecialization, ModuleData, SemesterGroup, StudyStage } from "./types.js";

let curriculumPromise: Promise<CurriculumData> | undefined;
const moduleCache: Map<string, Promise<ModuleData>> = new Map<string, Promise<ModuleData>>();

export function loadCurriculum(): Promise<CurriculumData> {
  if (!curriculumPromise) curriculumPromise = fetchJson<CurriculumFileData>("./curriculum.json").then(normalizeCurriculum);
  return curriculumPromise;
}

export function loadModule(_reference: string): Promise<ModuleData> {
  if (!isValidModuleReference(_reference)) return Promise.reject(new Error("Invalid module reference."));
  const cachedModule: Promise<ModuleData> | undefined = moduleCache.get(_reference);
  if (cachedModule) return cachedModule;
  const request: Promise<ModuleData> = fetchJson<ModuleData>(_reference).then((_module: ModuleData): ModuleData => addSourceReference(_module, _reference));
  moduleCache.set(_reference, request);
  return request;
}

function normalizeCurriculum(_file: CurriculumFileData): CurriculumData {
  const modules: Record<string, CurriculumModulePosition> = {};
  const semesters: SemesterGroup[] = [];
  const studyStages: StudyStage[] = [];
  _file.studyStages.forEach((stage: CurriculumFileData["studyStages"][number]): void => {
    const numbers: number[] = stage.semesters.map((_semester: CurriculumFileData["studyStages"][number]["semesters"][number]): number => _semester.semester);
    if (numbers.length > 0) studyStages.push({ title: stage.title, firstSemester: Math.min(...numbers), lastSemester: Math.max(...numbers) });
    stage.semesters.forEach((_semester: CurriculumFileData["studyStages"][number]["semesters"][number]): void => {
      const references: string[] = [];
      _semester.modules.forEach((item: CurriculumItem): void => {
        if (isSpecialization(item)) {
          item.modules.forEach((module: CurriculumModuleEntry): void => {
            references.push(module.file);
            addModulePlacement(modules, module, _semester.semester, item.title);
          });
        } else {
          references.push(item.file);
          addModulePlacement(modules, item, _semester.semester);
        }
      });
      semesters.push({ title: `Semester ${_semester.semester}`, modules: references });
    });
  });
  return { programmeName: _file.programmeName, tableHeadings: _file.tableHeadings, studyTables: _file.studyTables, columns: _file.columns, studyStages, semesters, modules };
}

function isSpecialization(_item: CurriculumItem): _item is CurriculumSpecialization {
  return "title" in _item && "modules" in _item;
}

function addModulePlacement(_positions: Record<string, CurriculumModulePosition>, _module: CurriculumModuleEntry, _semester: number, _specializationTitle?: string): void {
  const placement: CurriculumPlacement = {
    column: _module.column ?? "",
    semester: _semester,
    block: _module.block,
    style: _module.style,
    span: _module.span,
    track: _module.track,
    specializationTitle: _specializationTitle
  };
  const position: CurriculumModulePosition = _positions[_module.file] ?? { placements: [] };
  position.placements.push(placement);
  _positions[_module.file] = position;
}

async function fetchJson<T>(_reference: string): Promise<T> {
  const response: Response = await fetch(_reference);
  checkResponse(response);
  return response.json() as Promise<T>;
}

function addSourceReference(_module: ModuleData, _reference: string): ModuleData {
  const expectedId: string | undefined = _reference.split("/").pop()?.replace(".json", "");
  if (_module.id !== expectedId) throw new Error(`Module ID mismatch in ${_reference}.`);
  return { ..._module, sourceRef: _reference };
}

function isValidModuleReference(_reference: string): boolean {
  return /^(?:modules\/[a-z0-9]+\.json|\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(_reference);
}

function checkResponse(_response: Response): void {
  if (!_response.ok) throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
}
