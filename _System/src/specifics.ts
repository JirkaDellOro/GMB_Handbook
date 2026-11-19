import type { SpecificParagraph, SpecificSubparagraph, SpecificsData } from "./types.js";

const specificsCache: Map<string, Promise<SpecificsData>> = new Map<string, Promise<SpecificsData>>();

export async function loadSpecifics(_target: HTMLElement, _reference: string = "./specifics.json", _headingTag: "h1" | "h2" = "h1"): Promise<void> {
  try {
    const data: SpecificsData = await fetchSpecifics(_reference);
    renderSpecifics(_target, data, _headingTag);
  } catch (error) {
    renderLoadError(_target, error);
  }
}

export async function loadProgrammeMetadata(_reference: string = "./specifics.json"): Promise<void> {
  const data: SpecificsData = await fetchSpecifics(_reference);
  const programmeName: string = getProgrammeName(data.programme);
  const isSpecificsPage: boolean = document.body.classList.contains("specifics-page");
  document.title = isSpecificsPage ? `Specifics – ${programmeName}` : `${programmeName} – Module Handbook`;
  const description: string = isSpecificsPage
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
  const cached: Promise<SpecificsData> | undefined = specificsCache.get(_reference);
  if (cached) return cached;
  const request: Promise<SpecificsData> = fetch(_reference).then(checkResponse).then((_response: Response): Promise<SpecificsData> => _response.json() as Promise<SpecificsData>);
  specificsCache.set(_reference, request);
  return request;
}

function renderSpecifics(_target: HTMLElement, _data: SpecificsData, _headingTag: "h1" | "h2"): void {
  _target.replaceChildren();
  const heading: HTMLElement = createElement("header", "specifics-heading");
  heading.append(createElement("p", "eyebrow", _data.section));
  heading.append(createElement(_headingTag, undefined, _data.title));
  heading.append(createElement("p", "specifics-programme", _data.programme));
  const content: HTMLDivElement = createElement("div", "specifics-content");
  _data.paragraphs.forEach((_paragraph: SpecificParagraph, _index: number): void => content.append(createParagraph(_paragraph, _index + 1)));
  _target.append(heading, content);
  if (_data.lastChange) _target.append(createElement("p", "specifics-last-change", _data.lastChange));
}

function createParagraph(_paragraph: SpecificParagraph, _number: number): HTMLElement {
  const item: HTMLElement = createElement("section", "specific-paragraph");
  const number: HTMLSpanElement = createElement("span", "specific-number", `(${_number})`);
  const content: HTMLDivElement = createElement("div", "specific-copy");
  content.append(createElement("p", undefined, _paragraph.text));
  if (_paragraph.items) content.append(createSubparagraphs(_paragraph.items));
  item.append(number, content);
  return item;
}

function createSubparagraphs(_items: SpecificSubparagraph[]): HTMLOListElement {
  const list: HTMLOListElement = createElement("ol", "specific-subparagraphs");
  list.type = "a";
  _items.forEach((item: SpecificSubparagraph): void => {
    const entry: HTMLLIElement = createElement("li");
    entry.append(createElement("p", undefined, item.text));
    list.append(entry);
  });
  return list;
}

function setText(_selector: string, _value: string): void {
  const target: HTMLElement | null = document.querySelector<HTMLElement>(_selector);
  if (target) target.textContent = _value;
}

function setMetaDescription(_description: string): void {
  const meta: HTMLMetaElement | null = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.content = _description;
}

function checkResponse(_response: Response): Response {
  if (!_response.ok) throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
  return _response;
}

function renderLoadError(_target: HTMLElement, _error: unknown): void {
  const message: string = _error instanceof Error ? _error.message : String(_error);
  _target.replaceChildren(createElement("p", "notice", `Programme specifics could not be loaded: ${message}`));
}

function createElement<K extends keyof HTMLElementTagNameMap>(_tag: K, _className?: string, _text?: string): HTMLElementTagNameMap[K] {
  const element: HTMLElementTagNameMap[K] = document.createElement(_tag);
  if (_className) element.className = _className;
  if (_text !== undefined) element.textContent = _text;
  return element;
}

if (document.body.classList.contains("specifics-page")) {
  const target: HTMLElement | null = document.querySelector<HTMLElement>("#specifics-content");
  if (target) {
    const reference: string = document.body.dataset.specifics ?? "./specifics.json";
    void loadProgrammeMetadata(reference);
    void loadSpecifics(target, reference);
  }
}
