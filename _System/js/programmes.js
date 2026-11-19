import { getDegreeTitle, getProgrammeName } from "./specifics.js";
import type { ProgrammeEntry, SpecificsData } from "./types.js";

interface ProgrammeCardData {
  code: string;
  path: string;
  programme: string;
  degree: string;
  spoVersion: number;
}

async function loadProgrammes(): Promise<void> {
  const target: HTMLElement | null = document.querySelector<HTMLElement>("#programme-list");
  if (!target) return;
  try {
    const programmes: ProgrammeEntry[] = await fetchProgrammes();
    const cards: ProgrammeCardData[] = await Promise.all(programmes.map(createProgrammeCardData));
    renderProgrammes(target, cards);
  } catch (error) {
    renderLoadError(target, error);
  }
}

async function fetchProgrammes(): Promise<ProgrammeEntry[]> {
  const response: Response = await fetch("./_System/programmes.json");
  checkResponse(response);
  const programmes: ProgrammeEntry[] = await response.json() as ProgrammeEntry[];
  if (!Array.isArray(programmes)) throw new Error("The programme configuration must be a list.");
  return programmes;
}

async function createProgrammeCardData(_entry: ProgrammeEntry): Promise<ProgrammeCardData> {
  const response: Response = await fetch(_entry.specifics);
  checkResponse(response);
  const specifics: SpecificsData = await response.json() as SpecificsData;
  return {
    code: specifics.code,
    path: _entry.path,
    programme: getProgrammeName(specifics.programme),
    degree: getDegreeTitle(specifics.programme),
    spoVersion: specifics.spoVersion
  };
}

function renderProgrammes(_target: HTMLElement, _programmes: ProgrammeCardData[]): void {
  _target.replaceChildren();
  for (const programme of _programmes) {
    _target.append(createProgrammeCard(programme));
  }
}

function createProgrammeCard(_programme: ProgrammeCardData): HTMLAnchorElement {
  const link: HTMLAnchorElement = document.createElement("a");
  link.className = "module-tile";
  link.href = _programme.path;
  const code: HTMLSpanElement = createTextElement("span", _programme.code);
  const description: HTMLSpanElement = document.createElement("span");
  const title: HTMLSpanElement = createTextElement("span", _programme.programme);
  const degree: HTMLElement = createTextElement("small", `${_programme.degree} · SPO Version ${_programme.spoVersion}`);
  description.append(title, degree);
  const arrow: HTMLSpanElement = createTextElement("span", "↗");
  link.append(code, description, arrow);
  return link;
}

function createTextElement<K extends keyof HTMLElementTagNameMap>(_tag: K, _text: string): HTMLElementTagNameMap[K] {
  const element: HTMLElementTagNameMap[K] = document.createElement(_tag);
  element.textContent = _text;
  return element;
}

function checkResponse(_response: Response): void {
  if (!_response.ok) throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
}

function renderLoadError(_target: HTMLElement, _error: unknown): void {
  const message: string = _error instanceof Error ? _error.message : String(_error);
  _target.replaceChildren();
  const notice: HTMLParagraphElement = createTextElement("p", `Study programmes could not be loaded: ${message}`);
  notice.className = "notice";
  _target.append(notice);
}

void loadProgrammes();
