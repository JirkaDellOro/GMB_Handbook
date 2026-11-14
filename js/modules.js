let manifestPromise;
let curriculumPromise;
const moduleCache = new Map();
export function loadManifest() {
    if (!manifestPromise) manifestPromise = fetch("./manifest.json").then(checkResponse).then(_response => _response.json());
    return manifestPromise;
}
export function loadCurriculum() {
    if (!curriculumPromise) curriculumPromise = fetch("./curriculum.json").then(checkResponse).then(_response => _response.json());
    return curriculumPromise;
}
export function loadModule(_reference) {
    if (!isValidModuleReference(_reference)) return Promise.reject(new Error("Invalid module _reference."));
    if (!moduleCache.has(_reference)) {
        moduleCache.set(_reference, fetch(_reference).then(checkResponse).then(_response => _response.json()).then(_module => {
            const expectedId = _reference.split("/").pop()?.replace(".json", "");
            if (_module.id !== expectedId) throw new Error(`Module ID mismatch in ${_reference}.`);
            return { ..._module, sourceRef: _reference };
        }));
    }
    return moduleCache.get(_reference);
}
function isValidModuleReference(_reference) {
    return /^(?:modules\/[a-z0-9]+\.json|\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[A-Za-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(_reference);
}
function checkResponse(_response) {
    if (!_response.ok) throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
    return _response;
}
