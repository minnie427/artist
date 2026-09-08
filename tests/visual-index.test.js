const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

function render(page, language = "en", override) {
  const app = { innerHTML: "" };
  const context = {
    window: { location: { protocol: "file:", hash: "" }, localStorage: { getItem: () => language } },
    document: {
      body: { dataset: { page, root: "../" }, insertBefore() {}, appendChild() {} },
      documentElement: {}, head: { appendChild() {} }, getElementById: () => app,
      createElement: () => ({ querySelector: () => null }), querySelector: () => null
    }
  };
  vm.createContext(context);
  for (const name of ["site-media.js", "site-content.js"]) vm.runInContext(read(name), context);
  if (override) context.window.MP_SITE.visualIndex = override;
  vm.runInContext(read("site-render.js"), context);
  assert(!app.innerHTML.includes("undefined"));
  return { html: app.innerHTML, site: context.window.MP_SITE };
}

for (const language of ["en", "ko"]) {
  const { html, site } = render("visual-index", language);
  assert.equal((html.match(/<section class="visual-index"/g) || []).length, 1);
  assert(!html.includes("visual-index-project"));
  assert(!html.includes("visual-index-hero"));
  assert.match(html, /<h1 class="sr-only" id="top">/);
  assert(!html.includes("data-visual-project"));
  const projects = [...html.matchAll(/data-project="([^"]+)"/g)].map((match) => match[1]);
  const projectOrder = [...new Set(projects)];
  assert.equal(projectOrder.length, new Set(site.visualIndex.map((item) => item.project)).size);
  assert.equal(projectOrder[0], "funeral");
  assert(!html.includes("visual-index__group"), "Project wrappers must not interrupt the continuous layout");
  assert.deepEqual(projects, projectOrder.flatMap(project =>
    site.visualIndex.filter(item => item.project === project).map(() => project)
  ));
  const dimensions = [...html.matchAll(/<(?:img|video) src="\.\.\/[^\"]+" width="(\d+)" height="(\d+)"/g)];
  assert.equal(dimensions.length, site.visualIndex.length, "Reserve every media ratio before loading");
  assert(dimensions.every(([, width, height]) => Number(width) > 0 && Number(height) > 0));
  const indices = [...html.matchAll(/data-index="(\d+)"/g)].map((match) => Number(match[1]));
  assert.deepEqual(indices, Array.from({ length: site.visualIndex.length }, (_, index) => index));
  const actualSources = [...html.matchAll(/class="visual-index__item"[\s\S]*?<(?:img|video) src="\.\.\/([^"]+)"/g)].map((match) => match[1]);
  assert.equal(actualSources.length, site.visualIndex.length);
  let offset = 0;
  for (const project of projectOrder) {
    const expected = site.visualIndex.filter((item) => item.project === project);
    expected.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    for (const item of expected) {
      const src = item.src.replace(/^images\/(.+)\.(png|jpe?g)$/i, "images/web/$1.webp");
      assert.equal(actualSources[offset++], src);
      assert(fs.existsSync(path.join(root, src)), src);
    }
  }
  const contact = render("contact", language).html;
  assert.match(contact, /class="contact-instagram" href="https:\/\/www.instagram.com\/minniepark.studio\/"/);
  assert(!/<a class="contact-instagram" href="mailto:/.test(contact));
}

const custom = [
  { project: "origin", year: "2024", title: "Origin", src: "old-project-new-copy.webp", createdAt: "2026-09-08T12:00:00Z", context: "Study" },
  { project: "funeral", year: "2026", title: "Funeral", src: "older.webp", createdAt: "2026-08-15T12:00:00Z", context: "Study" },
  { project: "funeral", year: "2026", title: "Funeral", src: "undated.webp", context: "Study" },
  { project: "funeral", year: "2026", title: "Funeral", src: "newer.webp", createdAt: "2026-08-18T12:00:00Z", context: "Study" }
];
const sample = render("visual-index", "en", custom).html;
assert(sample.indexOf("newer.webp") < sample.indexOf("older.webp"));
assert(sample.indexOf("older.webp") < sample.indexOf("undated.webp"));
assert(sample.indexOf("undated.webp") < sample.indexOf("old-project-new-copy.webp"));

const css = read("style.css");
assert(!/\.visual-index\s*\{[^}]*column-count:/.test(css), "The whole gallery must not be balanced across columns");
assert.match(css, /\.visual-index\s*\{\s*--index-columns:\s*3/);
assert.match(css.slice(css.indexOf("@media (max-width: 1080px)")), /\.visual-index\s*\{\s*--index-columns:\s*2/);
assert.match(css.slice(css.indexOf("@media (max-width: 640px)")), /\.visual-index\s*\{\s*--index-columns:\s*1/);
assert(!css.includes(".visual-index__group"));
assert.match(css, /\.visual-index__item:hover :is\(img, video\),\s*\.visual-index__item:focus-visible :is\(img, video\)\s*\{\s*transform: scale\(1\.025\)/);
assert(read("visual-index/index.html").indexOf("visual-index-layout.js") < read("visual-index/index.html").indexOf("site-render.js"));
assert.match(css, /\.contact-links \.contact-instagram:focus-visible\s*\{\s*background:\s*var\(--ink\);\s*color:\s*var\(--pink\)/);
console.log("PASS: continuous title-free gallery; preserved project chronology and viewer indices; reserved media dimensions; 3/2/1 columns; hover and Contact styles intact.");
