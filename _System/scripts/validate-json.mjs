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

function reportError(_filePath, _message) {
  errorCount++;
  console.error(`ERROR ${_filePath}: ${_message}`);
}
