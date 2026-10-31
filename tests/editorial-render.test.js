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
  "reintervention", "respite-iii", "melbourne-fringe", "funeral", "shared-resonance", "meta-kibun", "origin", "bugskin-chapter-2", "mugonggan",
  "artist-workshops", "live-performance", "melbourne-fashion-festival", "album-listening-session"
];
const editionKeys = ["funeral", "shared-resonance", "meta-kibun", "origin"];
assert.deepEqual(Object.keys(details).sort(), [...projectKeys].sort(), "The ten retained projects and three confirmed presentation accounts are all available");
// Compare every paragraph to its complete bilingual source, wherever a confirmed
// presentation now lives. Splitting April/Melbourne must not freeze a legacy count.
const expectedParagraphs = Object.values(details).reduce((count, project) => count + project.sections.reduce((n, section) => n + section.paragraphs.length, 0), 0);
assert(expectedParagraphs > 0);
const approvedCrops = Object.fromEntries(JSON.parse(read("tests/fixtures/works-crops-v2.json")).crops.map(crop => [crop.project, [crop.src, crop.x, crop.y, crop.zoom]]));
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
      assert.match(mail.searchParams.get("subject") || "", /^Artwork acquisition enquiry, .+/, `${label}: subject identifies the artwork`);
      continue;
    }
    if (/^\/site\/.+\.(?:png|jpe?g|webp|gif|mp4|webm|ogv)$/i.test(href)) {
      const file = decodeURI(href.slice("/site/".length));
      const target = path.resolve(root, file);
      assert(target.startsWith(root + path.sep), `${label}: gallery asset stays within the site`);
      assert(fs.existsSync(target), `${label}: native gallery fallback points to a real media file: ${file}`);
      continue;
    }
    assert(href.startsWith(prefix), `${label}: link preserves ${language} route: ${href}`);
    const route = href.slice(prefix.length).split("#")[0];
    assert(knownRoutes.has(route), `${label}: known page link: ${route}`);
  }
}

function checkAcquisitionFallback(html, titles, label, language) {
  const enquiries = [...html.matchAll(/<details class="acquisition-enquiry">([\s\S]*?)<\/details>/g)];
  assert.equal(enquiries.length, titles.length, `${label}: every intended acquisition action reveals contact details without an email app`);
  assert.equal((html.match(/href="mailto:/g) || []).length, enquiries.length, `${label}: no acquisition action remains mailto-only`);
  enquiries.forEach(([, panel], index) => {
    assert(/<summary(?:\s[^>]*)?>/.test(panel), `${label}: native keyboard-accessible disclosure`);
    assert(panel.includes('class="acquisition-enquiry__select">minniepark.studio@gmail.com</dd>'), `${label}: recipient is visible and selectable`);
    const mail = new URL(panel.match(/href="(mailto:[^"]+)"/)[1].replaceAll("&amp;", "&"));
    assert.equal(mail.pathname, "minniepark.studio@gmail.com", `${label}: correct recipient`);
    assert.equal(mail.searchParams.get("subject"), `Artwork acquisition enquiry, ${titles[index]}`, `${label}: exact artwork-specific subject`);
    assert(panel.includes(projectEscape(mail.searchParams.get("subject"))), `${label}: visible subject matches email draft subject`);
    assert(panel.includes(language === "ko" ? "주소를 복사해" : "copy the address"), `${label}: localised manual-email fallback`);
    assert(!/<form|<input|\bon(?:click|submit)=|\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/i.test(panel), `${label}: no form, interception or hidden enquiry transmission`);
  });
}

let checkedParagraphs = 0;
for (const language of ["en", "ko"]) {
  const ctx = context(language);
  const works = editorial.works(ctx);
  checkMarkup(works, `Works/${language}`, language);
  const catalogueKeys = editorial.orderedWorks(site, details);
  assert.deepEqual(Array.from(catalogueKeys), ["reintervention","respite-iii","melbourne-fringe","funeral","shared-resonance","bugskin-chapter-2","meta-kibun","mugonggan","origin","artist-workshops","live-performance","melbourne-fashion-festival","album-listening-session"]);
  checkAcquisitionFallback(works, catalogueKeys.filter(key => details[key].acquisition).map(key => details[key].title), `Works/${language}`, language);
  const cards = [...works.matchAll(/<article class="catalogue-work" id="work-([^"]+)">([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 13, "All projects and confirmed presentations use one catalogue record structure");
  assert.equal((works.match(/class="catalogue-work__record"/g) || []).length, 13);
  assert.equal((works.match(/class="catalogue-work__summary"/g) || []).length, 13, "Every project has a readable summary, including further practice");
  assert.equal((works.match(/class="catalogue-work__facts"/g) || []).length, 13, "Every project shares the same fact structure");
  assert(!/editorial-index-row|Further Practice|추가 실천|Explore the visual index/.test(works), "No text-only secondary list or long Visual Index CTA");
  for (const [key, [src, x, y, zoom]] of Object.entries(approvedCrops)) {
    const card = cards.find(match => match[1] === key)?.[2];
    assert(card, `Works/${language}: approved crop project retained: ${key}`);
    const replacement = site.projects[key].importedDocumentation && site.projects[key].image !== src ? site.projects[key].image : null;
    if (replacement) {
      assert(card.includes(`src="${ctx.media(replacement)}"`) && card.includes('data-crop-x="50"') && card.includes('data-crop-y="50"') && card.includes('data-crop-zoom="1"'), `Works/${language}: a newly selected hero is shown without borrowing the previous photograph's crop`);
    } else {
      assert(card.includes(`src="${ctx.media(src)}"`) && card.includes(`data-crop-x="${x}"`) && card.includes(`data-crop-y="${y}"`) && card.includes(`data-crop-zoom="${zoom}"`) && card.includes(`transform:scale(${zoom})`) && card.includes(`transform-origin:${x}% ${y}%`), `Works/${language}: exact retained photograph and approved crop for ${key}`);
    }
  }
  for (const key of ["respite-iii", "reintervention"]) {
    const card = cards.find(match => match[1] === key)?.[2];
    const selectedHero = sandbox.window.MP_IMPORTED_MEDIA.projects[key]?.hero;
    assert(selectedHero && card.includes(ctx.media(selectedHero.src)) && !card.includes("catalogue-work__image--pending"), `Works/${language}: new presentation photography replaces the pending state with its own selected hero`);
  }
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
    const heroFigure = html.match(/<figure class="project-detail__figure project-detail__hero">([\s\S]*?)<\/figure>/)?.[1];
    if (heroFigure) {
      const heroFrame = heroFigure.match(/<([a-z]+) class="project-detail__hero-frame">([\s\S]*?)<\/\1>/)?.[2];
      assert(heroFrame && /<(?:img|video)\b/.test(heroFrame), `${label}: hero media has its own landscape frame`);
      assert(!/<figcaption\b/.test(heroFrame), `${label}: the caption cannot change the hero frame's proportions`);
    }
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
    const accountSections = [...html.matchAll(/<section class="project-detail__section catalogue-project__section"[^>]*>([\s\S]*?)<\/section>/g)];
    assert.equal(accountSections.length, project.sections.length, `${label}: every account remains in the linear reading flow`);
    assert(!/role="tab(?:list)?"|data-chapter=|catalogue-related|related-project|other-project-promo/.test(html), `${label}: no hidden chapter tabs or other-project promotion`);
    for (const illustration of project.illustrations || []) {
      const account = accountSections[illustration.after][1];
      const heading = `<h2>${projectEscape(project.sections[illustration.after].title[language])}</h2>`;
      assert(account.includes(ctx.media(illustration.src)), `${label}: illustration belongs to its own account`);
      assert(account.indexOf(ctx.media(illustration.src)) < account.indexOf(heading), `${label}: its own photograph precedes the matching text`);
    }
    const selectedStrip = html.match(/<section class="catalogue-selected">([\s\S]*?)<\/section>/)?.[1];
    if (selectedStrip) {
      const selected = [...selectedStrip.matchAll(/<figure>([\s\S]*?)<\/figure>/g)];
      assert(selected.length > 0 && selected.length <= 6, `${label}: a short selected gallery, not a second full visual index`);
      assert(selectedStrip.includes(ctx.href("visual-index/")), `${label}: full image archive remains a separate destination`);
      for (const [, figure] of selected) {
        if (figure.includes("<video")) assert(/controls(?:\s|>)/.test(figure), `${label}: gallery videos retain native controls`);
        else assert(/<a[^>]+href="\/site\/[^"<>]+\.(?:png|jpe?g|webp|gif)"[^>]+data-catalogue-gallery/.test(figure), `${label}: image opens directly even without gallery scripting`);
      }
    }
    const mailLinks = [...html.matchAll(/href="(mailto:[^"]+)"/g)];
    assert.equal(mailLinks.length, project.acquisition ? 2 : 0, `${label}: acquisition routes only where intended`);
    for (const [, mail] of mailLinks) assert(new URL(mail).searchParams.get("subject").endsWith(project.title), `${label}: correct acquisition subject`);
    checkAcquisitionFallback(html, project.acquisition ? [project.title, project.title] : [], label, language);
  }

  const index = editions.renderIndex(ctx);
  checkMarkup(index, `Editions/${language}`, language);
  checkAcquisitionFallback(index, editionKeys.map(key => details[key].title), `Editions/${language}`, language);
  assert.equal((index.match(/class="edition-card"/g) || []).length, 4);
  assert.equal((index.match(/class="edition-card__media"/g) || []).length, 4, "Four square-thumbnail media hooks");
  assert(index.includes(ctx.href("editions/reintervention/")), "Direct software-artwork route");
  for (const key of editionKeys) assert(index.includes(ctx.href(site.projects[key].route)), `Edition links to original work: ${key}`);

  const edition = editions.renderWork(ctx);
  checkMarkup(edition, `RE:INTERVENTION/${language}`, language);
  checkAcquisitionFallback(edition, ["RE:INTERVENTION"], `RE:INTERVENTION/${language}`, language);
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
assert.equal(checkedParagraphs, expectedParagraphs * 2, "Every complete source paragraph is checked in both languages across the thirteen current accounts");

// Guard the edition module against accidental raw text or attribute insertion.
const hostile = context("en");
hostile.details = { ...details, funeral: { ...details.funeral, title: '<script>alert("x")</script>' } };
hostile.site = { ...site, external: { ...site.external, email: "javascript:alert(1)" } };
const safe = editions.renderIndex(hostile);
assert(!safe.includes("<script>") && !safe.includes("javascript:"), "Unsafe title and mail scheme are not emitted as executable markup");
for (const html of [editorial.works(hostile), editorial.project(hostile, "funeral")]) {
  assert(!html.includes("<script>") && !html.includes("javascript:"), "Editorial enquiries escape unsafe titles and reject unsafe mail schemes");
  assert(html.includes('class="acquisition-enquiry__select">minniepark.studio@gmail.com</dd>'), "Editorial enquiries retain the safe recipient fallback");
}

console.log(`PASS: ${2 * (projectKeys.length + 3)} EN/KO renders, all ${expectedParagraphs} bilingual source paragraphs, 13 common catalogue records with photograph-specific saved crops and current folder-selected heroes, linear accounts and selected native galleries, metadata/media/routes/history anchors, safe acquisition fallback and no unapproved terms. Static checks only; browser/mobile visual QA remains separate.`);
