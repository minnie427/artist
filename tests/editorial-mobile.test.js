// Static cascade and mocked navigation regression checks only.
// These checks do NOT measure browser rendering, wrapping, overlap, or device behaviour.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

// This deliberately bounded parser supports the selectors/media features used below.
// It resolves actual selector specificity, !important and stylesheet source order.
function splitTop(text, separator) {
  const pieces = [];
  let start = 0, depth = 0, quote = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote && text[i - 1] !== "\\") quote = ""; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (!depth && c === separator) { pieces.push(text.slice(start, i).trim()); start = i + 1; }
  }
  pieces.push(text.slice(start).trim());
  return pieces.filter(Boolean);
}

function functional(selector, consume) {
  let text = selector;
  for (;;) {
    const match = /:(is|not|where)\(/.exec(text);
    if (!match) return text;
    let depth = 1, end = match.index + match[0].length;
    const start = end;
    for (; end < text.length && depth; end++) {
      if (text[end] === "(") depth++;
      if (text[end] === ")") depth--;
    }
    assert.equal(depth, 0, `Unclosed functional selector ${selector}`);
    consume(match[1], text.slice(start, end - 1));
    text = text.slice(0, match.index) + text.slice(end);
  }
}

function compare(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
  return 0;
}

function specificity(selector) {
  const score = [0, 0, 0];
  let text = functional(selector, (kind, content) => {
    if (kind === "where") return;
    const highest = splitTop(content, ",").map(specificity).sort(compare).pop();
    highest.forEach((n, i) => { score[i] += n; });
  });
  text = text.replace(/\[[^\]]*\]/g, () => { score[1]++; return ""; });
  text = text.replace(/#[\w-]+/g, () => { score[0]++; return ""; });
  text = text.replace(/\.[\w-]+/g, () => { score[1]++; return ""; });
  text = text.replace(/::[\w-]+/g, () => { score[2]++; return ""; });
  text = text.replace(/:[\w-]+(?:\([^)]*\))?/g, () => { score[1]++; return ""; });
  score[2] += (text.match(/\b[a-z][\w-]*\b/gi) || []).length;
  return score;
}

function components(selector) {
  const result = [];
  let word = "", depth = 0, quote = "", relation = " ";
  const flush = () => { if (word.trim()) { result.push({ selector: word.trim(), relation }); word = ""; relation = " "; } };
  for (const c of selector) {
    if (quote) { word += c; if (c === quote) quote = ""; continue; }
    if (c === '"' || c === "'") { quote = c; word += c; continue; }
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (!depth && (c === ">" || /\s/.test(c))) { flush(); if (c === ">") relation = ">"; }
    else word += c;
  }
  flush();
  return result;
}

function matchesCompound(node, selector) {
  if (!node || selector.includes("::")) return false;
  let pass = true;
  let text = functional(selector, (kind, content) => {
    const any = splitTop(content, ",").some(option => matches(node, option));
    pass &&= kind === "not" ? !any : any;
  });
  text = text.replace(/\[([\w-]+)(?:\s*=\s*["']?([^"'\]]+)["']?)?\]/g, (_, key, value) => {
    pass &&= value === undefined ? Object.hasOwn(node.attributes, key) : node.attributes[key] === value;
    return "";
  });
  text = text.replace(/#[\w-]+/g, value => { pass &&= node.attributes.id === value.slice(1); return ""; });
  text = text.replace(/\.[\w-]+/g, value => { pass &&= node.classes.has(value.slice(1)); return ""; });
  text = text.replace(/:root/g, () => { pass &&= node.tag === "html"; return ""; });
  // Dynamic pseudo-classes, sibling selectors, etc. aren't used by our fixture states.
  if (/[:+~]/.test(text)) return false;
  text = text.trim();
  if (text && text !== "*") pass &&= node.tag === text.toLowerCase();
  return pass;
}

function matches(node, selector) {
  const parts = components(selector);
  const visit = (target, index) => {
    if (!matchesCompound(target, parts[index].selector)) return false;
    if (!index) return true;
    if (parts[index].relation === ">") return visit(target.parent, index - 1);
    for (let ancestor = target.parent; ancestor; ancestor = ancestor.parent) if (visit(ancestor, index - 1)) return true;
    return false;
  };
  return parts.length > 0 && visit(node, parts.length - 1);
}

function mediaMatches(query, viewport) {
  return splitTop(query, ",").some(branch => {
    const tests = [...branch.matchAll(/\(([^:()]+):\s*([^()]+)\)/g)];
    return tests.every(([, key, value]) => {
      key = key.trim(); value = value.trim();
      if (key === "min-width") return viewport.width >= parseFloat(value);
      if (key === "max-width") return viewport.width <= parseFloat(value);
      if (key === "min-height") return viewport.height >= parseFloat(value);
      if (key === "max-height") return viewport.height <= parseFloat(value);
      if (key === "hover") return value === viewport.hover;
      if (key === "pointer") return value === viewport.pointer;
      if (key === "prefers-reduced-motion") return value === viewport.motion;
      throw new Error(`Unsupported media expression in static test: ${key}`);
    });
  });
}

const rules = [];
function collectCSS(source, media = []) {
  source = source.replace(/\/\*[\s\S]*?\*\//g, "");
  let offset = 0;
  while (offset < source.length) {
    const open = source.indexOf("{", offset);
    if (open < 0) break;
    const selector = source.slice(offset, open).trim();
    let depth = 1, end = open + 1, quote = "";
    for (; end < source.length && depth; end++) {
      const c = source[end];
      if (quote) { if (c === quote && source[end - 1] !== "\\") quote = ""; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
    }
    assert.equal(depth, 0, `Balanced CSS block: ${selector}`);
    const body = source.slice(open + 1, end - 1);
    if (selector.startsWith("@media")) collectCSS(body, [...media, selector.slice(6)]);
    else if (!selector.startsWith("@")) {
      const declarations = splitTop(body, ";").map(declaration => {
        const colon = declaration.indexOf(":");
        assert(colon > 0, `Valid declaration: ${declaration}`);
        const raw = declaration.slice(colon + 1).trim();
        return { property: declaration.slice(0, colon).trim(), value: raw.replace(/\s*!important\s*$/, ""), important: /!important\s*$/.test(raw) };
      });
      for (const name of splitTop(selector, ",")) rules.push({ selector: name, declarations, media, specificity: specificity(name) });
    }
    offset = end;
  }
}
collectCSS(read("style.css"));
collectCSS(read("editorial.css"));
for (const route of ["", "artist/", "works/", "research/", "visual-index/", "contact/", "editions/", "editions/reintervention/"]) {
  for (const languagePrefix of ["", "ko/"]) {
    const html = read(`${languagePrefix}${route}index.html`);
    const base = html.indexOf("style.css?"), override = html.indexOf("editorial.css?");
    assert(base >= 0 && override > base, `${languagePrefix}${route}: editorial overrides load after legacy styles`);
  }
}

function element(tag, classes = "", parent = null, attributes = {}) {
  return { tag, classes: new Set(classes.split(/\s+/).filter(Boolean)), parent, attributes };
}
function fixture(page, open = false) {
  const html = element("html");
  const body = element("body", open ? "is-menu-open" : "", html, { "data-page": page });
  const app = element("main", "site-shell", body);
  return { html, body, app };
}
function cascade(node, width, extra = {}) {
  const viewport = { width, height: 900, hover: "hover", pointer: "fine", motion: "no-preference", ...extra };
  const resolved = {}, weights = {};
  rules.forEach((rule, order) => {
    if (!rule.media.every(query => mediaMatches(query, viewport)) || !matches(node, rule.selector)) return;
    rule.declarations.forEach((declaration, index) => {
      const weight = [Number(declaration.important), ...rule.specificity, order, index];
      if (!weights[declaration.property] || compare(weight, weights[declaration.property]) >= 0) {
        resolved[declaration.property] = declaration.value;
        weights[declaration.property] = weight;
      }
    });
  });
  return resolved;
}
const widths = [320, 375, 390, 640, 768, 880, 1024, 1100, 1101, 1440];
for (const width of widths) {
  for (const page of ["home", "artist", "works", "research", "contact", "editions", "project", "visual-index"]) {
    for (const opened of [false, true]) {
      const f = fixture(page, opened), header = element("header", "global-header", f.body);
      const nav = element("nav", "global-nav", header), links = element("div", "global-nav__links", nav);
      const toggle = element("button", "global-nav__toggle", nav), language = element("button", "site-language-toggle", nav);
      assert.equal(cascade(links, width).display, width <= 1100 ? opened ? "flex" : "none" : "flex", `${page}/${width}: menu visibility`);
      assert.equal(cascade(toggle, width).display, width <= 1100 ? "inline-flex" : "none", `${page}/${width}: toggle breakpoint`);
      assert.equal(cascade(language, width)["grid-column"], width <= 1100 ? "2" : "3", `${page}/${width}: language shares nav row`);
      assert.equal(cascade(language, width)["min-height"], "44px");
      assert.equal(cascade(toggle, width).position, "relative", `${page}/${width}: no old fixed-position mobile toggle`);
      if (width <= 1100 && page !== "home") {
        assert.equal(cascade(nav, width)["backdrop-filter"], "none", `${page}/${width}: fixed menu not trapped by filtered ancestor`);
        assert.equal(cascade(nav, width)["-webkit-backdrop-filter"], "none");
      }
      if (width <= 1100) assert.equal(cascade(links, width)["overflow-y"], "auto", `${width}: short viewport menu remains scrollable`);
    }
  }
  const contact = fixture("contact"), contactHero = element("section", "contact-hero", contact.app);
  const details = element("section", "contact-details content-section content-section--compact", contact.app);
  const routes = element("section", "contact-routes content-section", contact.app);
  assert.equal(cascade(contactHero, width)["grid-template-columns"], width <= 1100 ? "1fr" : "minmax(0, 1.3fr) minmax(0, 1fr)");
  for (const node of [details, routes]) assert.equal(cascade(node, width)["grid-template-columns"], width <= 880 ? "1fr" : "repeat(2, minmax(0, 1fr))", `${width}: contact stack`);
  const contactLink = element("a", "", element("div", "contact-links", details));
  assert.equal(cascade(contactLink, width)["overflow-wrap"], "anywhere", `${width}: long email wraps`);
  assert.equal(cascade(contactLink, width)["min-height"], "44px");
  const artist = fixture("artist"), artistHero = element("section", "artist-hero", artist.app);
  assert.equal(cascade(artistHero, width)["min-height"], "0", `${width}: no forced artist viewport height`);
  assert.equal(cascade(element("div", "", artistHero), width)["min-height"], "0");
  const portrait = element("img", "", element("figure", "", artistHero));
  assert.equal(cascade(portrait, width).filter, "grayscale(1) contrast(1.05)", `${width}: Artist portrait retains the approved black-and-white treatment`);
  const history = element("article", "artist-history__entry", element("div", "", artist.app));
  assert.equal(cascade(history, width)["grid-template-columns"], width <= 640 ? "1fr" : width <= 1100 ? "84px minmax(0, 1fr)" : "95px minmax(0, 1.15fr) minmax(0, 1fr)", `${width}: history never retains excessive fixed column minimums`);
  const project = fixture("project"), detail = element("article", "project-detail", project.app);
  const section = element("section", "project-detail__section", detail);
  assert.equal(cascade(section, width)["grid-template-columns"], width <= 640 ? "1fr" : "minmax(0, .65fr) minmax(0, 1.35fr)");
  const prose = element("p", "", element("div", "long-copy", section));
  assert.equal(cascade(prose, width)["font-size"], "14px");
  assert.equal(cascade(prose, width)["line-height"], "1.8");
  const legacyH1 = element("h1", "", element("section", "project-hero", project.app));
  assert.equal(cascade(legacyH1, width)["overflow-wrap"], "anywhere", `${width}: long legacy project title wraps`);
  const editions = fixture("edition"), editionArticle = element("article", "edition-page project-detail", editions.app);
  const editionHero = element("section", "page-hero project-detail__hero", editionArticle);
  assert.equal(cascade(editionHero, width).padding, width <= 640 ? "0 0 26px" : "0 0 28px", `${width}: no duplicated page-hero inset`);
  const card = element("article", "edition-card", editions.app), square = element("img", "", element("a", "edition-card__media", card));
  assert.equal(cascade(square, width)["aspect-ratio"], "1");
  assert.equal(cascade(square, width)["object-fit"], "cover");
  assert.equal(cascade(square, width)["object-position"], "50% 50%");
  assert.equal(cascade(square, width).filter, "none", `${width}: edition image retains its original colours`);
  assert.equal(cascade(card, width)["grid-template-columns"], width <= 880 ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)");
  const workImage = element("img", "", element("a", "editorial-work__media", project.app));
  assert.equal(cascade(workImage, width)["object-fit"], "contain");
  assert.equal(cascade(workImage, width).filter, "none", `${width}: Works image retains its original colours`);
  const index = fixture("visual-index"), viewer = element("dialog", "index-viewer", index.app);
  const indexImage = element("img", "", element("button", "visual-index__item", index.app));
  assert.equal(cascade(indexImage, width).filter, "none", `${width}: Visual Index image retains its original colours`);
  const stage = element("div", "index-viewer__stage", viewer), image = element("figure", "", stage);
  const prev = element("button", "index-viewer__nav index-viewer__nav--prev", stage);
  assert.equal(cascade(prev, width).width, "44px");
  assert.equal(cascade(prev, width).height, "44px");
  if (width <= 640) {
    assert.equal(cascade(image, width)["grid-column"], "1 / -1", `${width}: full mobile image width`);
    assert.equal(cascade(prev, width)["grid-row"], "2", `${width}: arrows outside image`);
    assert.equal(cascade(element("div", "index-viewer__copy", stage), width)["grid-template-columns"], "1fr");
    const home = fixture("home");
    assert.equal(cascade(home.body, width)["overflow-y"], "auto", `${width}: short-screen content can scroll`);
    assert.equal(cascade(element("div", "landing", home.app), width).height, "auto");
  }
}

const shortHome = fixture("home");
assert.equal(cascade(shortHome.body, 880, { height: 500 })["overflow-y"], "auto", "Short landscape home is not vertically locked");
assert.equal(cascade(element("section", "landing", shortHome.app), 880, { height: 500 }).height, "auto");
const pointer = element("div", "art-pointer", shortHome.body);
assert.equal(cascade(pointer, 390, { hover: "none", pointer: "coarse" }).display, "none", "Coarse pointer does not keep a mouse-only cursor");
assert.equal(cascade(element("div", "thorn-trail-layer", shortHome.body), 390, { hover: "none", pointer: "coarse" }).display, "none");

// Execute the actual header code with lightweight DOM event mocks, not a browser.
function navigationFixture(locale = "en", protocol = "https:") {
  const handlers = new Map(), mediaHandlers = [], preferences = new Map();
  let assigned = "", reloads = 0, focused = null;
  const document = {};
  const eventNode = (name, parent = null) => {
    const node = { name, parent, attributes: {}, textContent: "", innerHTML: "", inert: false };
    node.addEventListener = (type, fn) => { const key = `${name}:${type}`; handlers.set(key, [...(handlers.get(key) || []), fn]); };
    node.fire = (type, event = {}) => { for (const fn of handlers.get(`${name}:${type}`) || []) fn(event); };
    node.getAttribute = key => node.attributes[key];
    node.setAttribute = (key, value) => { node.attributes[key] = value; };
    node.focus = () => { focused = node; document.activeElement = node; };
    node.getClientRects = () => [{}];
    node.contains = target => { for (let n = target; n; n = n.parent) if (n === node) return true; return false; };
    node.closest = selector => selector === ".global-nav__links a" && name === "link" ? node : null;
    return node;
  };
  const header = eventNode("header"), brand = eventNode("brand", header), toggle = eventNode("toggle", header);
  const link = eventNode("link", header), language = eventNode("language", header), label = eventNode("label", toggle), app = eventNode("app");
  toggle.attributes["aria-expanded"] = "false";
  toggle.querySelector = () => label;
  header.querySelector = selector => ({ ".global-nav__toggle": toggle, ".site-language-toggle": language })[selector] || null;
  header.querySelectorAll = () => [brand, toggle, link, language];
  const classes = new Set();
  const body = { dataset: { page: "test", root: "../../", locale, route: "works/artist-workshops/" }, insertBefore() {}, appendChild() {}, classList: { toggle(key, force) { const yes = force === undefined ? !classes.has(key) : force; if (yes) classes.add(key); else classes.delete(key); return yes; }, contains: key => classes.has(key) } };
  Object.assign(document, eventNode("document"), { body, documentElement: {}, head: { appendChild() {} }, getElementById: () => app, querySelector: selector => selector === "header.global-header" ? header : null, createElement: tag => eventNode(tag) });
  const context = { document, window: { MP_SITE: { nav: [{ id: "works", path: "works/", label: "Works", labelKo: "작품" }] }, localStorage: { getItem: () => locale, setItem: (k, v) => preferences.set(k, v) }, location: { protocol, hash: "#touching-resonance", assign: url => { assigned = url; }, reload: () => reloads++ }, matchMedia: () => ({ addEventListener: (_, fn) => mediaHandlers.push(fn) }) } };
  vm.createContext(context);
  vm.runInContext(read("site-render.js"), context, { filename: "site-render.js" });
  return { document, header, brand, toggle, link, language, app, classes, preferences, mediaHandlers, result: () => ({ assigned, reloads, focused }) };
}

for (const locale of ["en", "ko"]) {
  for (const protocol of ["https:", "file:"]) {
    const n = navigationFixture(locale, protocol);
    const assertMenu = opened => { assert.equal(n.toggle.getAttribute("aria-expanded"), String(opened)); assert.equal(n.app.inert, opened); assert.equal(n.classes.has("is-menu-open"), opened); };
    n.toggle.fire("click"); assertMenu(true);
    n.toggle.fire("click"); assertMenu(false);
    n.toggle.fire("click"); n.document.fire("keydown", { key: "Escape" }); assertMenu(false);
    assert.equal(n.result().focused, n.toggle, "Escape restores focus to menu button");
    n.toggle.fire("click"); n.document.fire("click", { target: n.app }); assertMenu(false);
    n.toggle.fire("click"); n.header.fire("click", { target: n.link }); assertMenu(false);
    n.toggle.fire("click"); n.mediaHandlers[0]({ matches: true }); assertMenu(false);
    n.toggle.fire("click"); n.language.focus();
    let prevented = 0;
    n.document.fire("keydown", { key: "Tab", shiftKey: false, preventDefault: () => prevented++ });
    assert.equal(n.result().focused, n.brand); assert.equal(prevented, 1, "Forward tab wraps inside open menu");
    n.document.fire("keydown", { key: "Tab", shiftKey: true, preventDefault: () => prevented++ });
    assert.equal(n.result().focused, n.language); assert.equal(prevented, 2, "Backward tab wraps inside open menu");
    n.language.fire("click");
    const next = locale === "en" ? "ko" : "en";
    assert.equal(n.preferences.get("mp-language"), next);
    assert.equal(n.result().assigned, `../../${next === "ko" ? "ko/" : ""}works/artist-workshops/${protocol === "file:" ? "index.html" : ""}#touching-resonance`, "Language switch preserves project anchor and file-preview route");
    assert.equal(n.result().reloads, 0);
  }
}

console.log(`PASS: Static two-stylesheet cascade at ${widths.join(", ")}px; navigation breakpoint/filter/target sizes, contact/history/detail stacking, image rules, mobile viewer layout hooks, and four EN/KO HTTP/file navigation-event mocks. Not browser rendering or visual QA.`);
