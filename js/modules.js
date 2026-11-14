let manifestPromise;
let curriculumPromise;
const moduleCache = new Map();
export function loadManifest() {
    if (!manifestPromise) manifestPromise = fetch("./manifest.json").then(checkResponse).then(response => response.json());
    return manifestPromise;
}
export function loadCurriculum() {
    if (!curriculumPromise) curriculumPromise = fetch("./curriculum.json").then(checkResponse).then(response => response.json());
    return curriculumPromise;
}
export function loadModule(reference) {
    if (!isValidModuleReference(reference)) return Promise.reject(new Error("Invalid module reference."));
    if (!moduleCache.has(reference)) {
        moduleCache.set(reference, fetch(reference).then(checkResponse).then(response => response.json()).then(module => {
            const expectedId = reference.split("/").pop()?.replace(".json", "");
            if (module.id !== expectedId) throw new Error(`Module ID mismatch in ${reference}.`);
            return { ...module, sourceRef: reference };
        }));
    }
    return moduleCache.get(reference);
}
function isValidModuleReference(reference) {
    return /^(?:modules\/[a-z0-9]+\.json|\.\/[a-z0-9_-]+\/modules\/[a-z0-9]+\.json|\.\.\/[a-z0-9_-]+\/modules\/[a-z0-9]+\.json)$/.test(reference);
}
function checkResponse(response) {
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response;
}
