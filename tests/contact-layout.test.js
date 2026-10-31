// Structural/CSS regression checks, not a replacement for browser visual QA.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
// Follow the real stylesheet order. Only exact selectors are queried below;
// actual wrapping, specificity interactions and gutter coordinates need browser QA.
const css = ["style.css", "editorial.css", "research-contact-layout.css", "page-layouts.css"].map(read).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
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
  const hero = style('.contact-overview', width);
  assert.equal(hero.display, width <= 800 ? "flex" : "block", "Approved B uses the vertical reading axis");
  assert.equal(hero.width, "min(calc(100% - var(--page-pad) * 2), var(--editorial-width))", "Contact uses the same outer width and gutter as Artist, Works and Research");
  assert.equal(hero["margin-inline"], "auto");
  assert.equal(hero.padding, "calc(var(--header-height) + var(--page-hero-offset)) 0 0", "The title inherits shared hero top-offset tokens");
  assert.equal(hero["max-width"], undefined, "Only internal content is narrow; the page title never shifts inward");
  const details = style('.contact-overview .contact-links', width);
  assert.equal(details.display, "flex");
  assert.equal(details["flex-direction"], "column", "Email and Instagram follow vertically");
  assert.equal(style('body[data-page="contact"] .contact-routes.contact-stack', width).display, "block", "CV and commission routes follow vertically");
  const article = style('body[data-page="contact"] .contact-routes.contact-stack > article', width);
  assert.equal(article.display, width <= 800 ? "block" : "grid");
  assert.equal(article["max-width"], "820px", "Secondary routes narrow internally without changing the page gutter");
  const direct = style('.contact-overview .contact-links a', width);
  assert(pixels(direct["font-size"], width) <= 25, "Both Contact links use the same restrained type scale");
  assert.equal(style('.contact-overview .contact-links .contact-instagram', width)["font-size"], undefined, "Instagram does not override the shared email typography");
  assert.equal(direct["min-height"], "44px", "Contact links retain a mobile-sized target");
  assert(pixels(style('body:not([data-page="home"]) .contact-overview__introduction .hero-main', width)["font-size"], width) <= 17);
  assert(pixels(style('body[data-page="contact"] .contact-routes.contact-stack h2', width)["font-size"].replace(/\s*!important$/, ""), width) <= 16);
}
assert.equal(style('body[data-page="contact"] .site-shell', 1440)["min-height"], "100svh");
assert.equal(style('body[data-page="contact"] .site-footer', 1440)["margin-top"], "auto");
assert.equal(style(".contact-overview", 1440)["padding-bottom"], "66px", "Contact retains intentional space before CV and commissions");
assert.equal(style('body[data-page="contact"] .contact-routes.contact-stack', 1440).padding, "0 0 100px", "The footer retains room below the final route");
const expected = {
  en: ["For exhibitions, curatorial conversations, institutional partnerships, research, talks and artistic collaborations.", "Artist Enquiries", "Seoul / Melbourne", "Working internationally", "Artist CV", "Exhibitions, education, research, public programmes and selected collaborations.", "Current PDF: 2026 edition.", "Download CV 2026", "Commercial / Commissioned Work", "For commissioned installations, brand activations, event visuals and production-led projects.", "Commissions"],
  ko: ["전시, 큐레토리얼 대화, 기관 파트너십, 리서치, 토크와 예술 협업에 관한 문의를 받습니다.", "아티스트 문의", "서울 / 멜버른", "국제적으로 활동합니다", "아티스트 CV", "전시, 교육, 리서치, 공공 프로그램과 주요 협업 기록입니다.", "현재 PDF는 2026년판입니다.", "CV 2026 다운로드", "상업 / 커미션 작업", "커미션 설치, 브랜드 액티베이션, 이벤트 비주얼과 프로덕션 중심 프로젝트를 위한 별도 사이트입니다.", "커미션"]
};
function checkContact(html, language, label) {
  assert(!html.includes("undefined"), label);
  assert(html.includes('class="contact-overview"'), label + ": B layout is rendered natively");
  assert(html.includes('class="contact-overview__introduction"'), label + ": consistent introduction and location rail");
  assert(!/layout-review|data-layout-review/.test(html), label + ": no preview controls or DOM transformation");
  for (const value of expected[language]) assert(html.includes(value), label + ": complete original copy retained: " + value);
  for (const value of ["mailto:minniepark.studio@gmail.com", "https://www.instagram.com/minniepark.studio/", language === "ko" ? "assets/Minnie_Park_Artist_CV_2026_KO.pdf" : "assets/Minnie_Park_Artist_CV_2026.pdf", "https://work.minniepark.art"]) assert(html.includes(value), label + ": " + value);
  assert(html.indexOf('class="contact-location"') < html.indexOf('class="contact-links"'), label + ": location stays with the introduction in approved B");
  assert(html.indexOf('class="contact-links"') < html.indexOf('class="contact-routes contact-stack content-section"'), label + ": routes follow direct contact");
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
  assert(staticHtml.includes("page-layouts.css?v="), route + ": approved native layout stylesheet is connected");
  assert(staticHtml.indexOf("research-contact-layout.css?v=") < staticHtml.indexOf("page-layouts.css?v="), route + ": approved B rules load after previous editorial rules");
}
console.log("PASS: native Contact B responsive source rules, common hero gutter, generous spacing, exact EN/KO original copy and direct links, vertical route order, equal link sizing, mobile targets and connected stylesheet in static pages.");
