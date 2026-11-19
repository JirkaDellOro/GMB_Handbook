import type { SpecificParagraph, SpecificSubparagraph, SpecificsData } from "./types.js";

const specificsCache = new Map<string, Promise<SpecificsData>>();

export async function loadSpecifics(_target: HTMLElement, _reference = "./specifics.json", _headingTag: "h1" | "h2" = "h1"): Promise<void> {
  try {
    const data = await fetchSpecifics(_reference);
    renderSpecifics(_target, data, _headingTag);
  } catch (error) {
    renderLoadError(_target, error);
  }
}

export async function loadProgrammeMetadata(_reference = "./specifics.json"): Promise<void> {
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

export function getProgrammeName(_programme: string): string {
  return _programme.replace(/\s+(?:B\.A\.|B\.\s*Sc\.)$/, "");
}

export function getDegreeTitle(_programme: string): string {
  if (_programme.endsWith("B. Sc.")) return "Bachelor of Science";
  if (_programme.endsWith("B.A.")) return "Bachelor of Arts";
  return "Bachelor";
}

function fetchSpecifics(_reference: string): Promise<SpecificsData> {
  const cached = specificsCache.get(_reference);
  if (cached) return cached;
  const request = fetch(_reference).then(checkResponse).then(_response => _response.json() as Promise<SpecificsData>);
  specificsCache.set(_reference, request);
  return request;
}

function renderSpecifics(_target: HTMLElement, _data: SpecificsData, _headingTag: "h1" | "h2"): void {
  _target.replaceChildren();
  const heading = createElement("header", "specifics-heading");
  heading.append(createElement("p", "eyebrow", _data.section));
  heading.append(createElement(_headingTag, undefined, _data.title));
  heading.append(createElement("p", "specifics-programme", _data.programme));
  const content = createElement("div", "specifics-content");
  _data.paragraphs.forEach((_paragraph, _index) => content.append(createParagraph(_paragraph, _index + 1)));
  _target.append(heading, content);
  if (_data.lastChange) _target.append(createElement("p", "specifics-last-change", _data.lastChange));
}

function createParagraph(_paragraph: SpecificParagraph, _number: number): HTMLElement {
  const item = createElement("section", "specific-paragraph");
  const number = createElement("span", "specific-number", `(${_number})`);
  const content = createElement("div", "specific-copy");
  content.append(createElement("p", undefined, _paragraph.text));
  if (_paragraph.items) content.append(createSubparagraphs(_paragraph.items));
  item.append(number, content);
  return item;
}

function createSubparagraphs(_items: SpecificSubparagraph[]): HTMLOListElement {
  const list = createElement("ol", "specific-subparagraphs");
  list.type = "a";
  for (const item of _items) {
    const entry = createElement("li");
    entry.append(createElement("p", undefined, item.text));
    list.append(entry);
  }
  return list;
}

function setText(_selector: string, _value: string): void {
  const target = document.querySelector<HTMLElement>(_selector);
  if (target) target.textContent = _value;
}

function setMetaDescription(_description: string): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.content = _description;
}

function checkResponse(_response: Response): Response {
  if (!_response.ok) throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
  return _response;
}

function renderLoadError(_target: HTMLElement, _error: unknown): void {
  const message = _error instanceof Error ? _error.message : String(_error);
  _target.replaceChildren(createElement("p", "notice", `Programme specifics could not be loaded: ${message}`));
}

function createElement<K extends keyof HTMLElementTagNameMap>(_tag: K, _className?: string, _text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(_tag);
  if (_className) element.className = _className;
  if (_text !== undefined) element.textContent = _text;
  return element;
}

if (document.body.classList.contains("specifics-page")) {
  const target = document.querySelector<HTMLElement>("#specifics-content");
  if (target) {
    const reference = document.body.dataset.specifics ?? "./specifics.json";
    void loadProgrammeMetadata(reference);
    void loadSpecifics(target, reference);
  }
}
