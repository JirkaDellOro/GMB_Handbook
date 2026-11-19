import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderCurriculum, renderModuleDetail, renderStudyTables } from "../js/render.js";

class MockElement {
  constructor(_tagName) {
    this.tagName = _tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this.attributes = {};
    this.parentNode = null;
    this.className = "";
    this.classList = { add: (..._names) => { this.className = [...new Set([...this.className.split(" "), ..._names])].filter(Boolean).join(" "); } };
    this.textContent = "";
    this.href = "";
  }

  append(..._nodes) {
    for (const node of _nodes) {
      if (node.parentNode) node.parentNode.children = node.parentNode.children.filter(_child => _child !== node);
      node.parentNode = this;
      this.children.push(node);
    }
  }

  replaceChildren(..._nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(..._nodes);
  }

  setAttribute(_name, _value) {
    this.attributes[_name] = _value;
  }
}

function createDocument() {
  return {
    createElement: _tagName => new MockElement(_tagName),
    createTextNode: _text => {
      const node = new MockElement("#text");
      node.textContent = _text;
      return node;
    }
  };
}

function createCurriculum(_withBlockInfo) {
  return {
    columns: ["SWE", "AAI", "MIN", "X", "Y"],
    studyStages: [],
    modules: {
      "modules/test.json": {
        column: "SWE",
        semester: 1,
        ...(_withBlockInfo ? { block: 1 } : {})
      }
    }
  };
}

function createModule() {
  return { id: "test", sourceRef: "modules/test.json", title: "Test module", semester: 1, credits: 6 };
}

test("curriculum renders a single legend when block information exists", () => {
  globalThis.document = createDocument();
  const target = new MockElement("main");

  renderCurriculum(target, [createModule()], createCurriculum(true));

  assert.equal(target.children.filter(_child => _child.tagName === "P").length, 1);
  assert.equal(target.children.filter(_child => _child.className === "curriculum-scroll").length, 1);
  const grid = findElement(target, _element => _element.className.includes("curriculum-grid"));
  assert.ok(grid.className.includes("curriculum-columns-5"));
  assert.equal(grid.style.gridTemplateColumns, undefined);
  delete globalThis.document;
});

test("curriculum omits the legend when block information is absent", () => {
  globalThis.document = createDocument();
  const target = new MockElement("main");

  renderCurriculum(target, [createModule()], createCurriculum(false));

  assert.equal(target.children.filter(_child => _child.tagName === "P").length, 0);
  delete globalThis.document;
});

test("study table module links inherit the programme document language", () => {
  globalThis.document = createDocument();
  const target = new MockElement("main");

  renderStudyTables(target, [createModule()]);

  const moduleLink = findElement(target, _element => _element.tagName === "A");
  assert.ok(moduleLink);
  assert.equal(moduleLink.attributes.lang, undefined);
  delete globalThis.document;
});

test("module detail back link returns to the programme overview", () => {
  globalThis.document = createDocument();
  const target = new MockElement("main");

  renderModuleDetail(target, createModule());

  const backLink = target.children[0].children.find(_child => _child.className === "back-link");
  assert.ok(backLink);
  assert.equal(backLink.href, "./index.html");
  assert.equal(backLink.textContent, "← Programme overview");
  delete globalThis.document;
});

test("programme overview retains the intentional GMB correct variant", async () => {
  const programmes = JSON.parse(await readFile(new URL("../programmes.json", import.meta.url), "utf8"));
  assert.ok(programmes.some(_programme => _programme.path === "./GMBcorrect/index.html"));
});

test("programme entry points declare their primary document language", async () => {
  const [ain, gmb, gmbCorrect] = await Promise.all([
    readFile(new URL("../../AIN/index.html", import.meta.url), "utf8"),
    readFile(new URL("../../GMB/index.html", import.meta.url), "utf8"),
    readFile(new URL("../../GMBcorrect/index.html", import.meta.url), "utf8")
  ]);

  assert.match(ain, /<html lang="de">/);
  assert.match(gmb, /<html lang="en">/);
  assert.match(gmbCorrect, /<html lang="en">/);
});

function findElement(_root, _predicate) {
  if (_predicate(_root)) return _root;
  for (const child of _root.children) {
    const match = findElement(child, _predicate);
    if (match) return match;
  }
  return undefined;
}


test("programme names, degrees and SPO versions come from specifics data", async () => {
  const [ain, gmb, programmeConfig] = await Promise.all([
    readFile(new URL("../../AIN/specifics.json", import.meta.url), "utf8"),
    readFile(new URL("../../GMB/specifics.json", import.meta.url), "utf8"),
    readFile(new URL("../programmes.json", import.meta.url), "utf8")
  ]);
  const specifics = [JSON.parse(ain), JSON.parse(gmb)];
  assert.match(specifics[0].programme, /B\.\s*Sc\.$/);
  assert.match(specifics[1].programme, /B\.A\.$/);
  assert.deepEqual(specifics.map(_item => _item.spoVersion), [14, 11]);
  const entries = JSON.parse(programmeConfig);
  assert.ok(entries.every(_entry => !("title" in _entry) && !("degree" in _entry)));
  assert.deepEqual(specifics.map(_item => _item.code), ["AIN", "GMB"]);
  assert.ok(entries.every(_entry => !("code" in _entry)));
  assert.equal(entries[0].specifics, entries[1].specifics);
});

test("programme pages contain no duplicated programme names or degree labels", async () => {
  const pages = await Promise.all([
    readFile(new URL("../../AIN/index.html", import.meta.url), "utf8"),
    readFile(new URL("../../GMB/index.html", import.meta.url), "utf8"),
    readFile(new URL("../../GMBcorrect/index.html", import.meta.url), "utf8")
  ]);
  for (const page of pages) {
    assert.match(page, /id="programme-name"/);
    assert.match(page, /id="programme-degree"/);
    assert.match(page, /Module Handbook – Hochschule Furtwangen/);
    assert.doesNotMatch(page, /Allgemeine Informatik|Games &amp; Immersive Media/);
  }
  assert.match(pages[2], /data-specifics="\.\.\/GMB\/specifics\.json"/);
});


test("specifics pages use centralized programme metadata", async () => {
  const [gmb, gmbCorrect] = await Promise.all([
    readFile(new URL("../../GMB/specifics.html", import.meta.url), "utf8"),
    readFile(new URL("../../GMBcorrect/specifics.html", import.meta.url), "utf8")
  ]);
  for (const page of [gmb, gmbCorrect]) {
    assert.match(page, /id="programme-name-header"/);
    assert.match(page, /id="programme-version-header"/);
    assert.doesNotMatch(page, /Games &amp; Immersive Media|B\.A\.|SPO Version 11/);
  }
  assert.match(gmbCorrect, /data-specifics="\.\.\/GMB\/specifics\.json"/);
});
