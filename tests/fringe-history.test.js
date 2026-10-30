// Official event facts and version boundaries; no browser/network requests.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ["site-media.js", "site-content.js", "project-details.js"]) vm.runInContext(read(file), sandbox);
const { MP_SITE: site, MP_PROJECT_DETAILS: details } = sandbox.window;
const entries = site.history.find(group => group.year === "2026").entries;
const shared = entries.filter(entry => entry.project === "shared-resonance");
assert.equal(shared.length, 2, "April and Fringe remain separate exhibition records");
assert.equal(shared[0].date, "September / October");
assert.equal(shared[0].dateKo, "9월 / 10월");
assert.equal(shared[1].date, "April");
assert.match(shared[0].context, /Melbourne Fringe Festival.*Celia Little Room.*Docklands/);
assert.match(shared[1].context, /Platform Presents: Hybrid.*118 Greeves/);
assert.equal(shared[0].indexMediaAvailable, false, "New history must not redate existing April photographs");
const funeral = entries.find(entry => entry.project === "funeral");
assert.match(funeral.context, /Seoul Fringe Festival.*Mijin Floor/);
assert(!/Melbourne|forthcoming|예정/.test(JSON.stringify(funeral)));
assert(!/Melbourne|forthcoming|예정/.test(JSON.stringify(details.funeral)));
assert(!/Melbourne|forthcoming|예정/.test(JSON.stringify(site.projects.funeral.metadata)));
const project = details["shared-resonance"];
const fringe = project.sections.find(section => section.id === "melbourne-fringe");
assert(fringe, "Dedicated confirmed Fringe presentation section");
assert.equal(fringe.paragraphs.length, 2);
assert.match(fringe.paragraphs[0].en, /30 September to 4 October 2026/);
assert.match(fringe.paragraphs[0].en, /Celia Little Room at The Mission to Seafarers Victoria, Docklands/);
assert.match(fringe.paragraphs[0].en, /individual interactions as well as collective activation/);
assert.match(fringe.paragraphs[0].en, /observe without touching/);
assert.match(fringe.paragraphs[0].ko, /2026년 9월 30일부터 10월 4일까지/);
assert.match(fringe.paragraphs[1].en, /Access Fringe to improve accessibility/);
assert.match(fringe.paragraphs[1].ko, /접근성 향상.*Access Fringe/);
assert.match(project.sections[0].paragraphs[0].en, /April 2026 presentation/);
assert.match(project.sections[1].paragraphs[0].en, /In the April installation/);
assert.match(project.sections[2].paragraphs[0].en, /the April presentation/);
assert.match(project.hero.caption.en, /April 2026/);
assert.match(project.illustrations[0].caption.en, /April 2026/);
const official = "https://www.melbournefringe.com.au/whats-on/events/the-meta-rose-shared-resonance";
assert(project.sources.some(source => source.url === official));
for (const locale of ["", "ko/"]) {
  const artist = read(locale + "artist/index.html");
  const page = read(locale + "works/shared-resonance/index.html");
  assert.match(artist, /Celia Little Room/);
  assert(!/Melbourne Fringe Festival\s*\((forthcoming|예정)\)/.test(artist));
  assert.match(page, /id="melbourne-fringe"/);
  assert(page.includes(official));
  for (const script of ["site-content", "project-details", "site-render"]) {
    assert(page.includes(`${script}.js?v=20261029-fringe-60`), "Static and runtime cache versions agree");
  }
}
assert.match(read("site-render.js"), /The April 2026 presentation of Shared Resonance/);
console.log("PASS: separate April/Melbourne history, official dates/venue/access credit, Seoul Funeral, bilingual static pages and version-specific media captions; existing Visual Index chronology retained.");
