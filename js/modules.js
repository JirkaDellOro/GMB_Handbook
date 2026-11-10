const MODULES_PATH = './modules/';
let manifestPromise;
const moduleCache = new Map();
export function loadManifest() {
    if (!manifestPromise) {
        manifestPromise = fetch('./manifest.json')
            .then(checkResponse)
            .then(response => response.json());
    }
    return manifestPromise;
}
export function loadModule(id) {
    if (!/^[a-z0-9]+$/.test(id))
        return Promise.reject(new Error('Invalid module ID.'));
    if (!moduleCache.has(id)) {
        moduleCache.set(id, fetch(`${MODULES_PATH}${encodeURIComponent(id)}.json`)
            .then(checkResponse)
            .then(response => response.json())
            .then(module => {
            if (module.id !== id)
                throw new Error(`Module ID mismatch in ${id}.json`);
            return module;
        }));
    }
    return moduleCache.get(id);
}
function checkResponse(response) {
    if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response;
}
