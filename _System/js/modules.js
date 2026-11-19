let manifestPromise;
let curriculumPromise;
const moduleCache = new Map();
export function loadManifest() {
    if (!manifestPromise)
        manifestPromise = fetchJson("./manifest.json");
    return manifestPromise;
}
export function loadCurriculum() {
    if (!curriculumPromise)
        curriculumPromise = fetchJson("./curriculum.json");
    return curriculumPromise;
}
export function loadModule(_reference) {
    if (!isValidModuleReference(_reference))
        return Promise.reject(new Error("Invalid module reference."));
    const cachedModule = moduleCache.get(_reference);
    if (cachedModule)
        return cachedModule;
    const request = fetchJson(_reference).then((_module) => addSourceReference(_module, _reference));
    moduleCache.set(_reference, request);
    return request;
}
async function fetchJson(_reference) {
    const response = await fetch(_reference);
    checkResponse(response);
    return response.json();
}
function addSourceReference(_module, _reference) {
    const expectedId = _reference.split("/").pop()?.replace(".json", "");
    if (_module.id !== expectedId)
        throw new Error(`Module ID mismatch in ${_reference}.`);
    return { ..._module, sourceRef: _reference };
}
function isValidModuleReference(_reference) {
    return /^(?:modules\/[a-z0-9]+\.json|\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(_reference);
}
function checkResponse(_response) {
    if (!_response.ok)
        throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
}
