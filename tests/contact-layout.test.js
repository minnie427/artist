// Structural/CSS regression checks, not a replacement for browser visual QA.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
// Follow the real stylesheet order. Only exact selectors are queried below;
// actual wrapping, specificity interactions and gutter coordinates need browser QA.
const css = ["style.css", "editorial.css", "research-contact-layout.css"].map(read).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [];

function collect(source, limit = Infinity) {
  let offset = 0;
  while (offset < source.length) {
    const open = source.indexOf("{", offset);
    if (open === -1) break;
    const selector = source.slice(offset, open).trim();
    let depth = 1;
    let end = open + 1;
    let quote = "";
    for (; end < source.length && depth; end++) {
      const char = source[end];
      if (quote) { if (char === quote && source[end - 1] !== "\\") quote = ""; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === "{") depth++;
      else if (char === "}") depth--;
    }
    assert.equal(depth, 0, `Unclosed CSS rule: ${selector}`);
    const body = source.slice(open + 1, end - 1);
    if (selector.startsWith("@media")) {
      const width = selector.match(/max-width:\s*(\d+)px/);
      if (width) collect(body, Math.min(limit, Number(width[1])));
    } else if (!selector.startsWith("@")) {
      const declarations = Object.fromEntries(body.split(";").filter(s => s.includes(":")).map(s => {
        const index = s.indexOf(":");
        return [s.slice(0, index).trim(), s.slice(index + 1).trim()];
      }));
      for (const name of selector.split(",")) rules.push({ selector: name.trim(), limit, declarations });
    }
    offset = end;
  }
}
collect(css);

function style(selector, width) {
  return Object.assign({}, ...rules.filter(r => r.selector === selector && width <= r.limit).map(r => r.declarations));
}
function pixels(value, width) {
  if (value.startsWith("clamp(")) {
    const [low, ideal, high] = value.slice(6, -1).split(",").map(part => pixels(part.trim(), width));
    return Math.max(low, Math.min(ideal, high));
  }
  assert(/^-?[\d.]+(?:px|vw)$/.test(value), value);
  return parseFloat(value) * (value.endsWith("vw") ? width / 100 : 1);
}

for (const width of [320, 390, 640, 768, 1024, 1280, 1440, 1728]) {
  const hero = style('body[data-page="contact"] .contact-hero--direct', width);
  assert.equal(hero.display, "block", "Approved B hero uses the shared full-width reading axis");
  for (const property of ["width", "max-width", "left", "margin-left", "padding-left", "padding-top"]) assert.equal(hero[property], undefined, "The Contact override must inherit the shared Artist/page hero gutter and top offset");
  const details = style('body[data-page="contact"] .contact-details.contact-stack', width);
  assert.equal(details.display, "grid");
  assert.equal(details["grid-template-columns"], "minmax(0, 1fr)", "Direct links and location stack at all widths");
  assert.equal(style('body[data-page="contact"] .contact-routes.contact-stack', width).display, "block", "CV and commission routes follow vertically");
  const article = style('body[data-page="contact"] .contact-routes.contact-stack > article', width);
  assert.equal(article.display, width <= 640 ? "block" : "grid");
  const direct = style('body[data-page="contact"] .contact-stack .contact-links > a:first-child', width);
  assert(pixels(direct["font-size"], width) <= (width <= 640 ? 28 : 38), "Direct email stays within the approved B scale");
  assert.equal(style(".contact-links a", width)["min-height"], "44px", "Contact links retain a mobile-sized target");
  assert(pixels(style(".contact-hero .hero-main", width)["font-size"], width) <= 17);
  assert(pixels(style(".contact-routes h2", width)["font-size"].replace(/\s*!important$/, ""), width) <= 16);
}
assert.equal(style('body[data-page="contact"] .site-shell', 1440)["min-height"], "100svh");
assert.equal(style('body[data-page="contact"] .site-footer', 1440)["margin-top"], "auto");
assert.match(style(".contact-details.content-section", 1440)["padding-block"], /64px/);
assert.match(style(".contact-routes.content-section", 1440)["padding-bottom"], /96px/);
const expected = {
  en: ["For exhibitions, curatorial conversations, institutional partnerships, research, talks and artistic collaborations.", "Artist Enquiries", "Seoul / Melbourne", "Working internationally", "Artist CV", "Exhibitions, education, research, public programmes and selected collaborations.", "Current PDF: 2026 edition.", "Download CV 2026", "Commercial / Commissioned Work", "For commissioned installations, brand activations, event visuals and production-led projects.", "Commissions"],
  ko: ["전시, 큐레토리얼 대화, 기관 파트너십, 리서치, 토크와 예술 협업에 관한 문의를 받습니다.", "아티스트 문의", "서울 / 멜버른", "국제적으로 활동합니다", "아티스트 CV", "전시, 교육, 리서치, 공공 프로그램과 주요 협업 기록입니다.", "현재 PDF는 2026년판입니다.", "CV 2026 다운로드", "상업 / 커미션 작업", "커미션 설치, 브랜드 액티베이션, 이벤트 비주얼과 프로덕션 중심 프로젝트를 위한 별도 사이트입니다.", "커미션"]
};
function checkContact(html, language, label) {
  assert(!html.includes("undefined"), label);
  assert(html.includes('contact-hero--direct page-hero'), label + ": shared hero sizing with B layout");
  for (const value of expected[language]) assert(html.includes(value), label + ": complete original copy retained: " + value);
  for (const value of ["mailto:minniepark.studio@gmail.com", "https://www.instagram.com/minniepark.studio/", "assets/Minnie_Park_Artist_CV_2026.pdf", "https://work.minniepark.art"]) assert(html.includes(value), label + ": " + value);
  assert(html.indexOf('class="contact-links"') < html.indexOf('class="contact-location"'), label + ": email/Instagram precede location");
  assert(html.indexOf('class="contact-location"') < html.indexOf('class="contact-routes contact-stack content-section"'), label + ": routes follow direct contact");
  assert(html.indexOf(language === "ko" ? "아티스트 CV" : "Artist CV") < html.indexOf(language === "ko" ? "상업 / 커미션 작업" : "Commercial / Commissioned Work"), label + ": CV precedes commissioned work");
  assert(/<a[^>]*\bdownload(?:\s|>|=)/.test(html), label + ": CV remains a download");
  assert(html.includes('class="contact-instagram"'), label + ": Instagram retains its existing hover class");
}

for (const language of ["en", "ko"]) {
  const app = { innerHTML: "" };
  const context = {
    window: { location: { protocol: "file:", hash: "" }, localStorage: { getItem: () => language } },
    document: {
      body: { dataset: { page: "contact", root: "../" }, insertBefore() {}, appendChild() {} },
      documentElement: {}, head: { appendChild() {} }, getElementById: () => app,
      createElement: () => ({ querySelector: () => null }), querySelector: () => null
    }
  };
  vm.createContext(context);
  for (const file of ["site-content.js", "site-render.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  checkContact(app.innerHTML, language, "runtime/" + language);
  const route = (language === "ko" ? "ko/" : "") + "contact/index.html";
  const staticHtml = read(route);
  checkContact(staticHtml, language, route);
  assert(staticHtml.includes("research-contact-layout.css?v="), route + ": approved layout stylesheet is connected");
  assert(staticHtml.indexOf("editorial.css?v=") < staticHtml.indexOf("research-contact-layout.css?v="), route + ": scoped Contact rules load after shared editorial rules");
}
console.log("PASS: Contact B responsive source rules, inherited hero alignment, generous spacing, full EN/KO original copy and direct links, vertical route order, mobile targets and connected stylesheet in static pages.");
