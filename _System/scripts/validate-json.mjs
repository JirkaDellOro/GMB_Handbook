import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ignoredDirectories = new Set([".git", "node_modules"]);
const repositoryRoot = path.resolve(process.cwd(), "..");
const jsonFiles = await findJsonFiles(repositoryRoot);
let moduleCount = 0;
let errorCount = 0;
let warningCount = 0;

for (const filePath of jsonFiles) {
  const content = await readFile(filePath, "utf8");
  let data;

  try {
    data = JSON.parse(content);
  } catch (error) {
    reportError(filePath, error.message);
    continue;
  }

  if (isModuleFile(filePath)) {
    moduleCount++;
    validateModuleId(filePath, data);
    warningCount += reportMissingComponentCredits(filePath, data);
  }
  if (path.basename(filePath) === "curriculum.json" && ["AIN", "GMB", "GMBcorrect"].includes(path.basename(path.dirname(filePath)))) {
    validateCurriculum(filePath, data);
  }
}

if (errorCount > 0) process.exitCode = 1;
console.log(`Validated ${jsonFiles.length} JSON files and ${moduleCount} module IDs.`);
console.log(`Found ${errorCount} errors and ${warningCount} completeness warnings.`);

async function findJsonFiles(_directory) {
  const entries = await readdir(_directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async _entry => {
    const entryPath = path.join(_directory, _entry.name);
    if (_entry.isDirectory()) {
      if (ignoredDirectories.has(_entry.name)) return [];
      return findJsonFiles(entryPath);
    }
    return _entry.isFile() && _entry.name.endsWith(".json") ? [entryPath] : [];
  }));
  return nestedFiles.flat();
}

function isModuleFile(_filePath) {
  return _filePath.split(path.sep).includes("modules");
}

function validateModuleId(_filePath, _module) {
  const expectedId = path.basename(_filePath, ".json");
  if (_module.id !== expectedId) {
    reportError(_filePath, `module id must be "${expectedId}"`);
  }
}

function reportMissingComponentCredits(_filePath, _module) {
  const missing = (_module.components ?? []).filter(_component => _component.credit_points === undefined || _component.credit_points === null);
  if (missing.length === 0) return 0;
  console.warn(`WARNING ${_filePath}: ${missing.length} component(s) have no credit_points entry.`);
  return 1;
}

function validateCurriculum(_filePath, _curriculum) {
  if (!Array.isArray(_curriculum.studyStages) || !Array.isArray(_curriculum.columns)) {
    reportError(_filePath, "curriculum must define columns and studyStages arrays");
    return;
  }
  for (const stage of _curriculum.studyStages) {
    if (!stage.title || !Array.isArray(stage.semesters)) {
      reportError(_filePath, "each study stage must have a title and semesters array");
      continue;
    }
    for (const semester of stage.semesters) {
      if (!Number.isInteger(semester.semester) || !Array.isArray(semester.modules)) {
        reportError(_filePath, "each semester must have an integer semester number and modules array");
        continue;
      }
      for (const item of semester.modules) {
        if (isSpecialization(item)) {
          if (!item.title || !Array.isArray(item.modules) || item.modules.length === 0) {
            reportError(_filePath, "specialization groups need a title and non-empty modules array");
            continue;
          }
          item.modules.forEach(module => validateCurriculumModule(_filePath, module));
        } else validateCurriculumModule(_filePath, item);
      }
    }
  }
}
function isSpecialization(_item) {
  return _item && typeof _item === "object" && "title" in _item && "modules" in _item;
}
function validateCurriculumModule(_filePath, _module) {
  if (!_module || typeof _module !== "object" || !_module.id || !_module.file || path.basename(_module.file, ".json") !== _module.id) {
    reportError(_filePath, "each module entry must have matching id and file values");
  }
}
function reportError(_filePath, _message) {
  errorCount++;
  console.error(`ERROR ${_filePath}: ${_message}`);
}
