const specificsCache = new Map();
export async function loadSpecifics(_target, _reference = "./specifics.json", _headingTag = "h1") {
    try {
        const data = await fetchSpecifics(_reference);
        renderSpecifics(_target, data, _headingTag);
    }
    catch (error) {
        renderLoadError(_target, error);
    }
}
export async function loadProgrammeMetadata(_reference = "./specifics.json") {
    const data = await fetchSpecifics(_reference);
    const programmeName = getProgrammeName(data.programme);
    const isSpecificsPage = document.body.classList.contains("specifics-page");
    document.title = isSpecificsPage ? `Specifics – ${programmeName}` : `${programmeName} – Module Handbook`;
    const description = isSpecificsPage
        ? `Programme specifics for ${data.programme}`
        : `Module handbook and study structure for ${data.programme}`;
    setMetaDescription(description);
    setText("#programme-name-header", programmeName);
    setText("#programme-name", programmeName);
    setText("#programme-degree", getDegreeTitle(data.programme));
    setText("#programme-version-header", String(data.spoVersion));
}
export function getProgrammeName(_programme) {
    return _programme.replace(/\s+(?:B\.A\.|B\.\s*Sc\.)$/, "");
}
export function getDegreeTitle(_programme) {
    if (_programme.endsWith("B. Sc."))
        return "Bachelor of Science";
    if (_programme.endsWith("B.A."))
        return "Bachelor of Arts";
    return "Bachelor";
}
function fetchSpecifics(_reference) {
    const cached = specificsCache.get(_reference);
    if (cached)
        return cached;
    const request = fetch(_reference).then(checkResponse).then((_response) => _response.json());
    specificsCache.set(_reference, request);
    return request;
}
function renderSpecifics(_target, _data, _headingTag) {
    _target.replaceChildren();
    const heading = createElement("header", "specifics-heading");
    heading.append(createElement("p", "eyebrow", _data.section));
    heading.append(createElement(_headingTag, undefined, _data.title));
    heading.append(createElement("p", "specifics-programme", _data.programme));
    const content = createElement("div", "specifics-content");
    _data.paragraphs.forEach((_paragraph, _index) => content.append(createParagraph(_paragraph, _index + 1)));
    _target.append(heading, content);
    if (_data.lastChange)
        _target.append(createElement("p", "specifics-last-change", _data.lastChange));
}
function createParagraph(_paragraph, _number) {
    const item = createElement("section", "specific-paragraph");
    const number = createElement("span", "specific-number", `(${_number})`);
    const content = createElement("div", "specific-copy");
    content.append(createElement("p", undefined, _paragraph.text));
    if (_paragraph.items)
        content.append(createSubparagraphs(_paragraph.items));
    item.append(number, content);
    return item;
}
function createSubparagraphs(_items) {
    const list = createElement("ol", "specific-subparagraphs");
    list.type = "a";
    _items.forEach((item) => {
        const entry = createElement("li");
        entry.append(createElement("p", undefined, item.text));
        list.append(entry);
    });
    return list;
}
function setText(_selector, _value) {
    const target = document.querySelector(_selector);
    if (target)
        target.textContent = _value;
}
function setMetaDescription(_description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
        meta.content = _description;
}
function checkResponse(_response) {
    if (!_response.ok)
        throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
    return _response;
}
function renderLoadError(_target, _error) {
    const message = _error instanceof Error ? _error.message : String(_error);
    _target.replaceChildren(createElement("p", "notice", `Programme specifics could not be loaded: ${message}`));
}
function createElement(_tag, _className, _text) {
    const element = document.createElement(_tag);
    if (_className)
        element.className = _className;
    if (_text !== undefined)
        element.textContent = _text;
    return element;
}
if (document.body.classList.contains("specifics-page")) {
    const target = document.querySelector("#specifics-content");
    if (target) {
        const reference = document.body.dataset.specifics ?? "./specifics.json";
        void loadProgrammeMetadata(reference);
        void loadSpecifics(target, reference);
    }
}
