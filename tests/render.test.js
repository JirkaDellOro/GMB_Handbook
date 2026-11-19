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
    columns: ["SWE"],
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
    readFile(new URL("../AIN/index.html", import.meta.url), "utf8"),
    readFile(new URL("../GMB/index.html", import.meta.url), "utf8"),
    readFile(new URL("../GMBcorrect/index.html", import.meta.url), "utf8")
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
