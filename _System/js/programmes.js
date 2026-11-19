import { getDegreeTitle, getProgrammeName } from "./specifics.js";
async function loadProgrammes() {
    const target = document.querySelector("#programme-list");
    if (!target)
        return;
    try {
        const programmes = await fetchProgrammes();
        const cards = await Promise.all(programmes.map(createProgrammeCardData));
        renderProgrammes(target, cards);
    }
    catch (error) {
        renderLoadError(target, error);
    }
}
async function fetchProgrammes() {
    const response = await fetch("./_System/programmes.json");
    checkResponse(response);
    const programmes = await response.json();
    if (!Array.isArray(programmes))
        throw new Error("The programme configuration must be a list.");
    return programmes;
}
async function createProgrammeCardData(_entry) {
    const response = await fetch(_entry.specifics);
    checkResponse(response);
    const specifics = await response.json();
    return {
        code: specifics.code,
        path: _entry.path,
        programme: getProgrammeName(specifics.programme),
        degree: getDegreeTitle(specifics.programme),
        spoVersion: specifics.spoVersion
    };
}
function renderProgrammes(_target, _programmes) {
    _target.replaceChildren();
    for (const programme of _programmes) {
        _target.append(createProgrammeCard(programme));
    }
}
function createProgrammeCard(_programme) {
    const link = document.createElement("a");
    link.className = "module-tile";
    link.href = _programme.path;
    const code = createTextElement("span", _programme.code);
    const description = document.createElement("span");
    const title = createTextElement("span", _programme.programme);
    const degree = createTextElement("small", `${_programme.degree} · SPO Version ${_programme.spoVersion}`);
    description.append(title, degree);
    const arrow = createTextElement("span", "↗");
    link.append(code, description, arrow);
    return link;
}
function createTextElement(_tag, _text) {
    const element = document.createElement(_tag);
    element.textContent = _text;
    return element;
}
function checkResponse(_response) {
    if (!_response.ok)
        throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
}
function renderLoadError(_target, _error) {
    const message = _error instanceof Error ? _error.message : String(_error);
    _target.replaceChildren();
    const notice = createTextElement("p", `Study programmes could not be loaded: ${message}`);
    notice.className = "notice";
    _target.append(notice);
}
void loadProgrammes();
