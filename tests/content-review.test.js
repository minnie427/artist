// Source/render regression checks; these do not constitute browser visual QA.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

function render(page, language = "en", project = "") {
  const app = { innerHTML: "" };
  const context = {
    window: { location: { protocol: "file:", hash: "" }, localStorage: { getItem: () => language } },
    document: {
      body: { dataset: { page, project, root: "../" }, insertBefore() {}, appendChild() {} },
      documentElement: {}, head: { appendChild() {} }, getElementById: () => app,
      createElement: () => ({ querySelector: () => null, setAttribute() {}, addEventListener() {} }), querySelector: () => null
    }
  };
  vm.createContext(context);
  for (const file of ["site-media.js", "site-content.js", "site-render.js"]) vm.runInContext(read(file), context);
  return { html: app.innerHTML, site: context.window.MP_SITE };
}

function checkMarkup(html, name) {
  assert(!/undefined|\[object Object\]/.test(html), name);
  const stack = [];
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  for (const [, close, tag] of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/g)) {
    if (voidTags.has(tag)) continue;
    if (close) assert.equal(stack.pop(), tag, `${name}: closing ${tag}`);
    else stack.push(tag);
  }
  assert.deepEqual(stack, [], `${name}: unclosed elements`);
  for (const [, src] of html.matchAll(/(?:src|poster)="\.\.\/([^"]+)"/g)) {
    assert(fs.existsSync(path.join(root, decodeURI(src))), `${name}: missing media ${src}`);
  }
}

for (const language of ["en", "ko"]) {
  const { html: research, site } = render("research", language);
  checkMarkup(research, `research/${language}`);
  assert.equal((research.match(/<figure/g) || []).length, 3);
  assert(!research.includes('images/web/the meta kibun project.webp'));
  assert(research.indexOf('id="research-time"') < research.indexOf('id="research-evidence"'));
  assert(research.indexOf('id="research-data"') < research.indexOf('id="research-evidence"'));
  assert(research.includes("assets/honours-exegesis.pdf"));
  assert(!research.includes('class="research-grid"'), "Evidence must not become oversized statistics cards");
  assert(language === "en" ? research.includes("mathematically") : research.includes("수학적으로"));
  assert(language === "en" ? research.includes("fifteen") || research.includes("Fifteen") : research.includes("15건"));
  for (const page of ["home", "artist", "works", "contact", "cv"]) checkMarkup(render(page, language).html, `${page}/${language}`);
  for (const key of Object.keys(site.projects)) checkMarkup(render("project", language, key).html, `${key}/${language}`);
  assert(site.projects.funeral.metadata.some(s => s.includes("15–18 August 2026")));
  assert(site.projects.funeral.metadata.some(s => s.includes("Mijin Floor")));
  assert(site.projects.mugonggan.metadata.some(s => s.includes("5 July 2025")));
  assert(site.projects.mugonggan.metadata.some(s => s.includes("Seongnam")));
  assert(site.projects["touching-resonance"].metadata.includes("Led by Minnie Park"));
  assert(!site.projects["touching-resonance"].paragraphs.join(" ").includes("TouchCollective"));
  assert(site.projects["meta-kibun"].metadata[0].startsWith("12–13 September 2025 /"));
  assert(!site.projects.funeral.placeholder);
}

const css = read("style.css");
assert.match(css, /\.research-feature img,[\s\S]*?height:\s*auto;\s*object-fit:\s*contain;/);
assert.match(css, /\.research-study\s*\{\s*grid-template-columns:\s*1fr;/);
const researchHtml = read("research/index.html");
const schema = JSON.parse(researchHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema["@type"], "WebPage");
assert.equal(schema.citation.dateCreated, "2025");
assert.equal(schema.citation["@type"], "CreativeWork");
assert(researchHtml.includes("material time"));
assert(!read("works/funeral/index.html").includes("the%20meta%20rose%20project.webp"));
console.log("PASS: all EN/KO pages and project renders, local media, Research inquiry/evidence order, source-correct dates and credits, and search-facing consistency.");
