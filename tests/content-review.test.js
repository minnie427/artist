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
  assert.equal((research.match(/<figure/g) || []).length, 9, "Nine verified temporary photographs across the six approved research accounts");
  const sections = [...research.matchAll(/<section class="research-sequence content-section[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)];
  assert.deepEqual(sections.map(match => match[1]), ["meta-rose", "research-culture", "research-time", "research-touch", "research-making", "research-data"], "The full ongoing Meta Rose body of work precedes the cultural study and subsequent research");
  for (const [, id, section] of sections) {
    assert(section.indexOf('class="research-sequence__media') >= 0, id + ": media exists");
    assert(section.indexOf('class="research-sequence__media') < section.indexOf('class="research-sequence__account"'), id + ": photographs appear above the heading and body account");
    assert(section.includes("<figure>") && /<figcaption(?: |>)/.test(section), id + ": image has its own source-specific caption");
    assert(!/<h2[^>]*>[^<]*\?/.test(section), id + ": statement heading rather than a question");
  }
  assert.equal((sections.find(match => match[1] === "research-time")[2].match(/<figure>/g) || []).length, 4, "Four source-specific 2026 photos form the dried rose collection, without inventing multi-year documentation");
  assert(language === "en" ? sections[0][2].includes("Meta Rose is Minnie Park’s central, long-term body of work.") : sections[0][2].includes("Meta Rose는 Minnie Park 작업의 중심을 이루는 장기 연작입니다."));
  assert(language === "en" ? sections[0][2].includes("Minnie Park’s research develops through making") : sections[0][2].includes("Minnie Park의 연구는 Meta Rose의 작품을 제작하고"), "The existing account of the artistic research method is retained");
  assert(language === "en" ? research.includes("sixteen survey responses") : research.includes("설문 응답 16건"));
  assert(language === "en" ? research.includes("compared a non-interactive video with a tactile installation using the same audio-visual material") : research.includes("동일한 오디오비주얼 재료를 사용한 비인터랙티브 영상과 촉각적 설치를 비교"));
  assert(!/data-order=|media-pending|class="pending"/.test(research), "No order chooser or placeholder archive is published");
  assert(research.indexOf('id="research-time"') < research.indexOf('id="research-evidence"'));
  assert(research.indexOf('id="research-data"') < research.indexOf('id="research-evidence"'));
  assert(research.includes("assets/honours-exegesis.pdf"));
  assert(!research.includes('class="research-grid"'), "Evidence must not become oversized statistics cards");
  assert(language === "en" ? research.includes("mathematically") : research.includes("수학적으로"));
  assert(language === "en" ? research.includes("fifteen") || research.includes("Fifteen") : research.includes("15건"));
  for (const page of ["home", "artist", "works", "contact", "cv"]) checkMarkup(render(page, language).html, `${page}/${language}`);
  for (const key of Object.keys(site.projects)) checkMarkup(render("project", language, key).html, `${key}/${language}`);
  assert(site.projects.funeral.metadata.some(s => s.includes("15-18 August 2026")));
  assert(site.projects.funeral.metadata.some(s => s.includes("Mijin Floor")));
  assert(site.projects.mugonggan.metadata.some(s => s.includes("5 July 2025")));
  assert(site.projects.mugonggan.metadata.some(s => s.includes("Seongnam")));
  assert(site.projects["touching-resonance"].metadata.includes("Led by Minnie Park"));
  assert(!site.projects["touching-resonance"].paragraphs.join(" ").includes("TouchCollective"));
  assert(site.projects["meta-kibun"].metadata[0].startsWith("12-13 September 2025 /"));
  assert(!site.projects.funeral.placeholder);
}

const css = read("style.css");
assert.match(css, /\.research-feature img,[\s\S]*?height:\s*auto;\s*object-fit:\s*contain;/);
assert.match(css, /\.research-study\s*\{\s*grid-template-columns:\s*1fr;/);
const approvedLayout = read("research-contact-layout.css");
assert.match(approvedLayout, /\.research-sequence__media img\s*\{[^}]*height:\s*100%;[^}]*object-fit:\s*cover;[^}]*filter:\s*none;/);
assert.match(approvedLayout, /\.research-media-panel\s*\{[^}]*aspect-ratio:\s*16 \/ 9;[^}]*gap:\s*0;/);
const researchHtml = read("research/index.html");
const schema = JSON.parse(researchHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema["@type"], "WebPage");
assert.equal(schema.citation.dateCreated, "2025");
assert.equal(schema.citation["@type"], "CreativeWork");
assert(researchHtml.includes("material time"));
assert(!read("works/funeral/index.html").includes("the%20meta%20rose%20project.webp"));
console.log("PASS: all EN/KO pages and project renders, local media, Research full ongoing account first, six image-above accounts with nine source-captioned images, source-correct facts and credits, and search-facing consistency.");
