// Structural/CSS regression checks, not a replacement for browser visual QA.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
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
  const hero = style(".contact-hero", width);
  const links = style(".contact-links a", width);
  assert.equal(hero["min-height"], "0");
  assert.equal(hero.display, "grid");
  assert.equal(hero["grid-template-columns"], width <= 860 ? "1fr" : "minmax(0, 1.8fr) minmax(0, 1fr)");
  const detailColumns = width <= 860 ? "1fr" : "repeat(2, minmax(0, 1fr))";
  assert.equal(style(".contact-details.content-section", width)["grid-template-columns"], detailColumns);
  assert.equal(style(".contact-routes.content-section", width)["grid-template-columns"], detailColumns);
  assert.equal(style(".contact-hero h1", width)["font-size"], style(".page-hero h1", width)["font-size"]);
  assert.equal(style(".contact-hero h1", width)["line-height"], style(".page-hero h1", width)["line-height"]);
  assert(pixels(links["font-size"], width) <= 22);
  assert(pixels(style(".contact-details h2", width)["font-size"], width) <= 21);
  assert(pixels(style(".contact-hero .hero-main", width)["font-size"], width) <= 17);
  assert(pixels(style(".contact-routes h2", width)["font-size"], width) <= 16);
  assert.equal(links["min-height"], width <= 640 ? "44px" : "32px");
}

assert.equal(style('body[data-page="contact"] .site-shell', 1440)["min-height"], "100svh");
assert.equal(style('body[data-page="contact"] .site-footer', 1440)["margin-top"], "auto");
assert.match(style(".contact-details.content-section", 1440).padding, /clamp\(40px, 5svh, 64px\)/);
assert.match(style(".contact-routes.content-section", 1440).padding, /clamp\(64px, 9svh, 112px\)/);

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
  assert(!app.innerHTML.includes("undefined"));
  for (const value of ["mailto:minniepark.studio@gmail.com", "https://www.instagram.com/minniepark.studio/", "assets/Minnie_Park_Artist_CV_2026.pdf", "https://work.minniepark.art"])
    assert(app.innerHTML.includes(value), value);
}
console.log("PASS: Contact at eight CSS breakpoints: shared title scale, generous spacing, viewport-height shell, compact body, mobile targets and bilingual links.");
