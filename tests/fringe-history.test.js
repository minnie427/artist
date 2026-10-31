// Confirmed event facts and presentation/media/link boundaries; no browser/network requests.
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
const respite = entries.find(entry => entry.title === "Respite III");
const platform = entries.find(entry => entry.title === "RE:INTERVENTION");
assert(respite && platform, "Both confirmed October presentations are retained");
for (const entry of [respite, platform]) {
  assert.equal(entry.date, "October");
  assert.equal(entry.dateKo, "10월");
  assert.match(entry.type, /Group.*exhibition/);
  assert(site.projects[entry.project] && details[entry.project], "The history now opens its own confirmed project account");
}
assert.equal(respite.project, "respite-iii");
assert.equal(platform.project, "reintervention");
assert.match(respite.context, /XFLOS.*Collingwood Yards.*Melbourne/);
assert.match(platform.context, /LUCKY777.*Platform Presents.*Abbotsford Convent.*Melbourne/);
const respiteText = details["respite-iii"].sections.flatMap(section => section.paragraphs).map(paragraph => paragraph.en).join(" ");
assert.match(details["respite-iii"].meta.en.join(" "), /9 October 2026.*Collingwood Yards/);
assert.match(respiteText, /floral workshop was hosted by XFLOS and SOYA/);
assert(!/FOZZA.{0,30}curat|curat.{0,30}FOZZA/i.test(respiteText), "Do not invent a curatorial credit");
const lucky = details.reintervention;
assert.match(lucky.meta.en.join(" "), /10-11 October 2026.*Abbotsford Convent/);
assert.match(lucky.subtitle.en, /LUCKY777.*Platform Presents/);
const luckyEn = lucky.sections.flatMap(section => section.paragraphs).map(paragraph => paragraph.en).join(" ");
const luckyKo = lucky.sections.flatMap(section => section.paragraphs).map(paragraph => paragraph.ko).join(" ");
assert.match(luckyEn, /interactive RE:INTERVENTION work/);
assert.match(luckyEn, /also screened a behind-the-scenes video and Record/);
assert.match(luckyKo, /비하인드 더 신 영상.*기록도 함께 상영/);
assert(!lucky.sections.some(section => /Naming|Witness/.test(section.title.en)), "LUCKY777 is not presented as a repeat of the complete four-part Fringe exhibition");

const workshop = entries.find(entry => entry.title === "Flower your Face");
assert.equal(workshop.project, "artist-workshops");
assert.equal(workshop.anchor, "flower-your-face");
const teaching = details["artist-workshops"].sections.find(section => section.id === "flower-your-face");
assert.match(teaching.paragraphs[0].en, /led by Minnie Park/);
assert.match(teaching.paragraphs[0].en, /co-hosted by Park and Jessica Dang/);
assert.match(teaching.paragraphs[0].en, /capacity of 40 participants/);
const allHistory = site.history.flatMap(group => group.entries);
assert.equal(allHistory.filter(entry => entry.type.startsWith("Solo exhibition")).length, 5);
assert.match(allHistory.find(entry => entry.title === "Body Morphosis").type, /Duo exhibition.*Interactive audio-visual artworks/);

const shared = entries.filter(entry => entry.project === "shared-resonance" || entry.project === "melbourne-fringe");
assert.equal(shared.length, 2, "April and Fringe remain separate exhibition records with distinct detail routes");
const fringeEntry = shared.find(entry => entry.project === "melbourne-fringe");
const aprilEntry = shared.find(entry => entry.project === "shared-resonance");
assert.equal(fringeEntry.date, "September / October");
assert.equal(fringeEntry.dateKo, "9월 / 10월");
assert.equal(aprilEntry.date, "April");
assert.match(fringeEntry.context, /Melbourne Fringe Festival.*Celia Little Room.*Docklands/);
assert.match(aprilEntry.context, /Platform Presents: Hybrid.*118 Greeves/);
assert.notEqual(site.projects[fringeEntry.project].route, site.projects[aprilEntry.project].route);
const funeral = entries.find(entry => entry.project === "funeral");
assert.match(funeral.context, /Seoul Fringe Festival.*Mijin Floor/);
assert(!/Melbourne|forthcoming|예정/.test(JSON.stringify(funeral)));
assert(!/Melbourne|forthcoming|예정/.test(JSON.stringify(details.funeral)));
assert(!/Melbourne|forthcoming|예정/.test(JSON.stringify(site.projects.funeral.metadata)));

const april = details["shared-resonance"], fringe = details["melbourne-fringe"];
assert(fringe, "The confirmed Melbourne presentation has its own full account");
const fringeParagraphs = fringe.sections.flatMap(section => section.paragraphs);
const originalPresentation = fringeParagraphs.find(paragraph => paragraph.en.startsWith("The work was presented at Melbourne Fringe Festival"));
const access = fringeParagraphs.find(paragraph => paragraph.en.includes("Access Fringe to improve accessibility"));
assert(originalPresentation && access, "Original Melbourne presentation and access paragraphs remain present after relocation");
assert.match(originalPresentation.en, /30 September to 4 October 2026/);
assert.match(originalPresentation.en, /Celia Little Room at The Mission to Seafarers Victoria, Docklands/);
assert.match(originalPresentation.en, /individual interactions as well as collective activation/);
assert.match(originalPresentation.en, /observe without touching/);
assert.match(originalPresentation.ko, /2026년 9월 30일부터 10월 4일까지/);
assert.match(access.ko, /접근성 향상.*Access Fringe/);
assert.match(april.sections[0].paragraphs[0].en, /April 2026 presentation/);
assert.match(april.sections[1].paragraphs[0].en, /In the April installation/);
assert.match(april.sections[2].paragraphs[0].en, /the April presentation/);
assert.match(april.hero.caption.en, /April 2026/);
assert.match(april.illustrations[0].caption.en, /April 2026/);
assert(!april.sections.some(section => section.id === "melbourne-fringe"), "No combined April/Melbourne detail account remains");
assert(april.technical.every(record => /April 2026/.test(record.label.en)), "April technology is not labelled as the Melbourne installation");
assert(fringe.technical.every(record => /Melbourne Fringe/.test(record.label.en)));
const official = "https://www.melbournefringe.com.au/whats-on/events/the-meta-rose-shared-resonance";
assert(fringe.sources.some(source => source.url === official));
assert(!april.sources.some(source => source.url === official));
for (const id of ["naming", "intervention", "witness", "record"]) assert(fringe.sections.some(section => section.id === id), "Melbourne has its own four-work account: " + id);
const melbourneMedia = site.visualIndex.filter(item => item.src.startsWith("media/melbourne-fringe/"));
assert(melbourneMedia.length > 0, "Newly selected Melbourne documentation is available");
for (const item of melbourneMedia) assert.equal(item.project, "melbourne-fringe", "Melbourne images do not acquire April/Seoul context");
for (const item of site.visualIndex.filter(item => item.src.startsWith("media/shared-resonance/"))) assert.equal(item.project, "shared-resonance", "Existing April media identity remains unchanged");

// Each public, read-only exhibition archive belongs to its own presentation.
const operationalPhoneHubUrl = "https://minnie427.github.io/metarose-funeral/";
const archiveUrls = {
  funeral: "https://meta-rose-exhibition-archives.hw4225.chatgpt.site/seoul-2026/",
  "melbourne-fringe": "https://meta-rose-exhibition-archives.hw4225.chatgpt.site/melbourne-2026/",
  reintervention: "https://meta-rose-exhibition-archives.hw4225.chatgpt.site/lucky777-2026/"
};
for (const [key,url] of Object.entries(archiveUrls)) {
  assert.equal(details[key].phoneHubArchiveUrl,url, key + ": correct archive edition");
  for (const [other,record] of Object.entries(details)) if (other !== key) assert(!JSON.stringify(record).includes(url), other + ": no borrowed archive destination");
}
for (const record of Object.values(details)) assert(!JSON.stringify(record).includes(operationalPhoneHubUrl), "The operating interface is no longer a public project action");

const version = read("scripts/build-search-pages.js").match(/const stamp = "([^"]+)";/)[1];
for (const locale of ["", "ko/"]) {
  const artist = read(locale + "artist/index.html");
  const aprilPage = read(locale + "works/shared-resonance/index.html");
  const fringePage = read(locale + "works/melbourne-fringe/index.html");
  assert.match(artist, /Celia Little Room/);
  assert(artist.includes("Respite III") && artist.includes("LUCKY777 / Platform Presents"));
  assert(artist.includes(`href="${locale ? "../../ko/" : "../"}works/reintervention/`), "History opens the LUCKY777 work");
  assert(artist.includes(`href="${locale ? "../../ko/" : "../"}works/respite-iii/`), "History opens Respite III");
  assert(!artist.includes("Short Bio") && !artist.includes("짧은 소개"));
  assert(artist.includes(locale ? "크리에이티브 테크놀로지스트" : "Creative technologist"));
  assert(!/Melbourne Fringe Festival\s*\((forthcoming|예정)\)/.test(artist));
  assert(fringePage.includes(official));
  for (const [key,url] of Object.entries(archiveUrls)) {
    const html = read(locale + `works/${key}/index.html`);
    const links = [...html.matchAll(/<a\b([^>]*data-phone-hub-archive[^>]*)>([^<]+)<\/a>/g)];
    assert.equal(links.length,1, key + ": one clear archive action in the project header");
    assert(links[0][1].includes(`href="${url}"`), key + ": correct version destination");
    assert.equal(links[0][2], locale ? "폰 허브 아카이브 보기" : "Explore the Phone Hub Archive", key + ": shared exact localised button name");
    assert(links[0][1].includes('target="_blank"') && links[0][1].includes('rel="noreferrer"'), key + ": external archive retains existing link behaviour");
    assert(links[0][1].includes(locale ? "읽기 전용 전시 아카이브" : "Read-only exhibition archive"));
    assert(!html.includes(operationalPhoneHubUrl));
  }
  assert(!aprilPage.includes(operationalPhoneHubUrl));
  for (const id of ["naming", "intervention", "witness", "record"]) assert(fringePage.includes(`id="${id}"`));
  for (const key of ["funeral", "shared-resonance", "reintervention", "respite-iii"]) assert(!read(locale + `works/${key}/index.html`).includes(operationalPhoneHubUrl));
  for (const page of [aprilPage, fringePage]) for (const script of ["site-content", "project-details", "site-render"]) assert(page.includes(`${script}.js?v=${version}`), "Static and runtime cache versions agree");
}
assert.match(read("site-render.js"), /The April 2026 presentation of Shared Resonance/);
console.log("PASS: three October presentation accounts, distinct April/Melbourne routes/media, relocated official facts/access credits, Seoul Funeral, Lucky RE:INTERVENTION with BTS/Record screenings, three exact read-only exhibition archive URLs, bilingual static routes and current cache versions.");
