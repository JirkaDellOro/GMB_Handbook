function createElement(_tag, _className, _text) {
    const element = document.createElement(_tag);
    if (_className)
        element.className = _className;
    if (_text !== undefined)
        element.textContent = _text;
    return element;
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
    for (const item of _items) {
        const entry = createElement("li");
        entry.append(createElement("p", undefined, item.text));
        list.append(entry);
    }
    return list;
}
function renderSpecifics(_target, _data, _headingTag) {
    _target.replaceChildren();
    const heading = createElement("header", "specifics-heading");
    heading.append(createElement("p", "eyebrow", _data.section));
    heading.append(createElement(_headingTag, undefined, _data.title));
    heading.append(createElement("p", "specifics-programme", _data.programme));
    const content = createElement("div", "specifics-content");
    _data.paragraphs.forEach((paragraph, index) => content.append(createParagraph(paragraph, index + 1)));
    _target.append(heading, content);
    if (_data.lastChange)
        _target.append(createElement("p", "specifics-last-change", _data.lastChange));
}
export async function loadSpecifics(_target, _reference = "./specifics.json", _headingTag = "h1") {
    try {
        const response = await fetch(_reference);
        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);
        renderSpecifics(_target, await response.json(), _headingTag);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        _target.replaceChildren(createElement("p", "notice", `Programme specifics could not be loaded: ${message}`));
    }
}
if (document.body.classList.contains("specifics-page")) {
    const target = document.querySelector("#specifics-content");
    if (target)
        void loadSpecifics(target);
}
