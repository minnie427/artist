// Static renderer regression checks. These are not browser or responsive visual QA.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);
// The project renderer escapes double quotes but leaves apostrophes as text.
const projectEscape = value => escape(value).replaceAll("&#39;", "'");
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ["site-media.js", "site-content.js", "project-details.js", "site-editorial.js", "edition-render.js"]) {
  vm.runInContext(read(file), sandbox, { filename: file });
}

const { MP_SITE: site, MP_PROJECT_DETAILS: details, MP_EDITORIAL: editorial, MP_EDITIONS: editions } = sandbox.window;
const projectKeys = [
  "funeral", "shared-resonance", "meta-kibun", "origin", "bugskin-chapter-2", "mugonggan",
  "artist-workshops", "live-performance", "melbourne-fashion-festival", "album-listening-session"
];
assert.deepEqual(Object.keys(details).sort(), [...projectKeys].sort(), "All ten approved projects must be retained");
assert.equal(Object.values(details).reduce((count, project) => count + project.sections.reduce((n, section) => n + section.paragraphs.length, 0), 0), 52, "Retain all 52 approved bilingual paragraphs");
assert(!/\/Users\/|cautions|heroLocal/.test(read("project-details.js")), "Do not publish private source paths or notes");

const knownRoutes = new Set([
  "", "artist/", "works/", "research/", "visual-index/", "contact/", "editions/", "editions/reintervention/",
  ...Object.values(site.projects).map(project => project.route).filter(Boolean)
]);

function context(language) {
  const tr = (en, ko) => language === "ko" ? ko : en;
  const href = route => `/site/${language === "ko" ? "ko/" : ""}${route}`;
  const media = src => `/site/${encodeURI(src)}`;
  const imageMarkup = (src, alt, eager = false) => `<img src="${escape(media(src))}" alt="${escape(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async" />`;
  return {
    site, details, language, tr, href, media, imageMarkup,
    galleryMediaMarkup: item => /\.(mp4|webm|ogv)$/i.test(item.src)
      ? `<video src="${escape(media(item.src))}"${item.poster ? ` poster="${escape(media(item.poster))}"` : ""} controls playsinline></video>`
      : imageMarkup(item.src, item.alt || ""),
    renderFooter: () => '<footer class="test-footer">Minnie Park</footer>',
    renderProjectNav: () => `<nav aria-label="${tr("Project navigation", "작품 탐색")}"><a href="${href("works/")}">${tr("All works", "전체 작품")}</a></nav>`
  };
}

function checkMarkup(html, label, language) {
  assert(!/undefined|\[object Object\]|data-go=|data-acquire=/.test(html), `${label}: no unresolved data or preview-only actions`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${label}: exactly one main heading`);
  assert.equal((html.match(/<footer(?:\s|>)/g) || []).length, 1, `${label}: exactly one footer`);

  const stack = [];
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  for (const [, close, tag] of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/g)) {
    if (voidTags.has(tag)) continue;
    if (close) assert.equal(stack.pop(), tag, `${label}: closing ${tag}`);
    else stack.push(tag);
  }
  assert.deepEqual(stack, [], `${label}: no unclosed elements`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${label}: no duplicate IDs`);
  for (const [, src] of html.matchAll(/(?:src|poster)="\/site\/([^"]+)"/g)) {
    assert(fs.existsSync(path.join(root, decodeURI(src))), `${label}: media exists: ${src}`);
  }
  for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
    assert(/\balt="[^"]+"/.test(match[1]), `${label}: artwork image has descriptive alt text`);
  }

  const prefix = `/site/${language === "ko" ? "ko/" : ""}`;
  for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
    if (/^https:\/\//.test(href)) continue;
    if (href.startsWith("mailto:")) {
      const mail = new URL(href.replaceAll("&amp;", "&"));
      assert.equal(mail.pathname, "minniepark.studio@gmail.com", `${label}: enquiry recipient`);
      assert.match(mail.searchParams.get("subject") || "", /^Artwork acquisition enquiry — .+/, `${label}: subject identifies the artwork`);
      continue;
    }
    assert(href.startsWith(prefix), `${label}: link preserves ${language} route: ${href}`);
    const route = href.slice(prefix.length).split("#")[0];
    assert(knownRoutes.has(route), `${label}: known page link: ${route}`);
  }
}

let checkedParagraphs = 0;
for (const language of ["en", "ko"]) {
  const ctx = context(language);
  const works = editorial.works(ctx);
  checkMarkup(works, `Works/${language}`, language);
  assert.equal((works.match(/class="editorial-work"/g) || []).length, 4, "Four primary works use the same card layout");
  assert.equal((works.match(/class="editorial-index-row"/g) || []).length, 6, "All six further-practice entries remain visible");
  assert.equal((works.match(/is-pair/g) || []).length, 2, "Shared Resonance and Meta Kibun retain uncropped portrait pairs");
  for (const key of projectKeys) {
    assert(works.includes(`href="${ctx.href(site.projects[key].route)}"`), `Works/${language}: direct route for ${key}`);
    assert(fs.existsSync(path.join(root, site.projects[key].route, "index.html")), `Existing project template: ${key}`);
  }
  assert(works.indexOf(site.projects["melbourne-fashion-festival"].route) < works.indexOf(site.projects["album-listening-session"].route), "Fashion festival precedes listening session");

  for (const key of projectKeys) {
    const project = details[key];
    const html = editorial.project(ctx, key);
    const label = `${key}/${language}`;
    checkMarkup(html, label, language);
    assert(html.includes(projectEscape(project.lead[language])), `${label}: complete lead retained`);
    for (const section of project.sections) {
      assert(html.includes(`<h2>${projectEscape(section.title[language])}</h2>`), `${label}: section title retained`);
      if (section.id) assert(html.includes(`id="${section.id}"`), `${label}: direct history anchor retained`);
      for (const paragraph of section.paragraphs) {
        assert.equal(typeof paragraph.en, "string", `${label}: English paragraph exists`);
        assert.equal(typeof paragraph.ko, "string", `${label}: Korean paragraph exists`);
        const expected = `<p>${projectEscape(paragraph[language])}</p>`;
        assert.equal(html.split(expected).length - 1, 1, `${label}: complete paragraph rendered exactly once`);
        checkedParagraphs += 1;
      }
    }
    for (const line of [].concat(project.meta[language])) assert(html.includes(projectEscape(line)), `${label}: complete metadata`);
    if (project.subtitle) assert(html.includes(projectEscape(project.subtitle[language])), `${label}: full subtitle`);
    for (const illustration of project.illustrations) {
      const heading = `<h2>${projectEscape(project.sections[illustration.after].title[language])}</h2>`;
      assert(html.indexOf(ctx.media(illustration.src)) > html.indexOf(heading), `${label}: illustration follows its own section`);
    }
    const mailLinks = [...html.matchAll(/href="(mailto:[^"]+)"/g)];
    assert.equal(mailLinks.length, project.acquisition ? 2 : 0, `${label}: acquisition routes only where intended`);
    for (const [, mail] of mailLinks) assert(new URL(mail).searchParams.get("subject").endsWith(project.title), `${label}: correct acquisition subject`);
  }

  const index = editions.renderIndex(ctx);
  checkMarkup(index, `Editions/${language}`, language);
  assert.equal((index.match(/class="edition-card"/g) || []).length, 4);
  assert.equal((index.match(/class="edition-card__media"/g) || []).length, 4, "Four square-thumbnail media hooks");
  assert(index.includes(ctx.href("editions/reintervention/")), "Direct software-artwork route");
  for (const key of site.primaryWorksOrder) assert(index.includes(ctx.href(site.projects[key].route)), `Edition links to original work: ${key}`);

  const edition = editions.renderWork(ctx);
  checkMarkup(edition, `RE:INTERVENTION/${language}`, language);
  assert(edition.includes(ctx.href("works/funeral/")), "Return to parent exhibition context");
  assert(edition.includes(ctx.href("editions/")), "Return to Editions");
  assert(edition.includes("TouchDesigner"), "Execution requirements are documented");
  assert(edition.includes("PhoneHub"), "Hosting and support scope is documented");
  assert(edition.includes(language === "ko" ? "서면" : "writing"), "Rights and delivery remain conditional on written agreement");
  for (const html of [index, edition]) {
    assert(!/\bAUD\b|1,800|3 \+ 1|available now|private preview|design preview|<form|<input/i.test(html), "No unapproved prices, stock claims, fake forms or preview notices");
    assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(html), "No hidden enquiry transmission");
  }
}
assert.equal(checkedParagraphs, 104, "All 52 paragraphs checked in both languages");

// Guard the edition module against accidental raw text or attribute insertion.
const hostile = context("en");
hostile.details = { ...details, funeral: { ...details.funeral, title: '<script>alert("x")</script>' } };
hostile.site = { ...site, external: { ...site.external, email: "javascript:alert(1)" } };
const safe = editions.renderIndex(hostile);
assert(!safe.includes("<script>") && !safe.includes("javascript:"), "Unsafe title and mail scheme are not emitted as executable markup");

console.log("PASS: 26 EN/KO renders (10 projects + Works + 2 Editions pages per language), all 52 bilingual paragraphs, metadata, media, real routes, history anchors, artwork-specific enquiries, common card structure, and no unapproved acquisition terms. Static checks only; browser/mobile visual QA remains separate.");
