const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { arrange } = require("../visual-index-layout.js");
const close = (a, b) => assert(Math.abs(a - b) < 0.001, `${a} != ${b}`);

function checkGeometry(ratios, width, columns, gap) {
  const result = arrange(ratios, width, columns, gap);
  const ends = Array(columns).fill(0);
  result.positions.forEach((item, index) => {
    close(item.top, Math.min(...ends)); // No group reset or unexplained blank region.
    close(item.top, ends[item.column]);
    close(item.width / item.height, ratios[index] > 0 && Number.isFinite(ratios[index]) ? ratios[index] : 1);
    assert(item.left >= 0 && item.left + item.width <= width + 0.001);
    if (index) assert(item.top >= result.positions[index - 1].top);
    ends[item.column] = item.top + item.height + gap;
  });
  close(result.height, Math.max(0, ...ends) - (ratios.length ? gap : 0));
  return result;
}

const context = { window: {} };
vm.createContext(context);
for (const name of ["site-media.js", "site-content.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", name), "utf8"), context);
}
const ratios = Array.from(context.window.MP_SITE.visualIndex, item => item.width / item.height);
assert(ratios.length > 200 && ratios.every(ratio => ratio > 0));
for (const viewport of [320, 390, 640, 641, 860, 1080, 1081, 1440, 1920, 2560]) {
  const columns = viewport <= 640 ? 1 : viewport <= 1080 ? 2 : 3;
  const gap = viewport <= 640 ? 10 : 18;
  checkGeometry(ratios, viewport - gap * 2, columns, gap);
}
checkGeometry([], 900, 3, 18);
checkGeometry([NaN, 0, 1 / 8, 8, 1, 2, 0.5], 900, 3, 18);
const seam = checkGeometry([0.5, 2, 2, 1, 1, 0.8], 936, 3, 18);
assert(seam.positions[3].top < seam.positions[0].height, "Next project must fill a shorter column instead of waiting for the tallest");

// Exercise browser integration in a small in-memory harness (not visual QA).
class Medium {
  constructor(width, height) { this.width = width; this.height = height; this.handlers = {}; }
  getAttribute(name) { return this[name] || null; }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  removeEventListener(name) { delete this.handlers[name]; }
}
const media = [new Medium(1200, 1600), new Medium(1600, 900), new Medium(900, 1600), new Medium(0, 0)];
const items = media.map(element => ({ style: {}, querySelector: () => element }));
const gallery = { clientWidth: 1440, dataset: {}, style: {}, querySelectorAll: () => items };
const frames = new Map();
const events = {};
let id = 0;
let observe;
let disconnected = false;
const browser = {
  getComputedStyle: target => {
    const narrow = target.clientWidth <= 640;
    return {
      paddingLeft: narrow ? "10px" : "18px", paddingRight: narrow ? "10px" : "18px",
      paddingTop: "0px", paddingBottom: narrow ? "10px" : "18px",
      getPropertyValue: key => key === "--index-columns" ? String(narrow ? 1 : target.clientWidth <= 1080 ? 2 : 3) : narrow ? "10px" : "18px"
    };
  },
  requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
  cancelAnimationFrame: frame => frames.delete(frame),
  addEventListener: (name, fn) => { events[name] = fn; },
  removeEventListener: name => { delete events[name]; },
  ResizeObserver: class {
    constructor(fn) { observe = fn; }
    observe() {}
    disconnect() { disconnected = true; }
  }
};
const runtime = { window: browser };
vm.createContext(runtime);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../visual-index-layout.js"), "utf8"), runtime);
const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); };
const destroy = browser.MPVisualIndexLayout.mount(gallery);
assert.equal(gallery.dataset.masonry, "ready");
assert(parseFloat(gallery.style.height) > 0);
const initial = JSON.stringify(items.map(item => item.style));
observe(); flush();
assert.equal(JSON.stringify(items.map(item => item.style)), initial, "Height-only ResizeObserver notifications must not move items");
media[2].videoWidth = 1080; media[2].videoHeight = 1920;
media[2].handlers.loadedmetadata(); // Same poster ratio: no redundant layout.
assert.equal(frames.size, 0);
media[0].naturalWidth = 1600; media[0].naturalHeight = 1200;
media[0].handlers.load();
media[3].naturalWidth = 1800; media[3].naturalHeight = 900;
media[3].handlers.load();
assert.equal(frames.size, 1, "Out-of-order media loads should batch into one frame");
flush();
close(parseFloat(items[0].style.width) / parseFloat(items[0].style.height), 4 / 3);
close(parseFloat(items[3].style.width) / parseFloat(items[3].style.height), 2);
for (const width of [1081, 1080, 641, 640, 390, 1440]) {
  gallery.clientWidth = width; events.resize(); observe(); flush();
  const columns = width <= 640 ? 1 : width <= 1080 ? 2 : 3;
  const gap = width <= 640 ? 10 : 18;
  const expected = arrange([4 / 3, 16 / 9, 9 / 16, 2], width - gap * 2, columns, gap);
  items.forEach((item, index) => {
    close(parseFloat(item.style.left), expected.positions[index].left + gap);
    close(parseFloat(item.style.top), expected.positions[index].top);
    close(parseFloat(item.style.height), expected.positions[index].height);
  });
  close(parseFloat(gallery.style.height), expected.height + gap);
}
destroy();
assert(disconnected && !events.resize && frames.size === 0);
assert(media.every(element => Object.keys(element.handlers).length === 0));
gallery.clientWidth = 0; gallery.dataset = {}; gallery.style = {};
const cleanupHidden = browser.MPVisualIndexLayout.mount(gallery);
assert(!gallery.dataset.masonry, "A hidden container must retain normal-flow fallback");
gallery.clientWidth = 390; observe(); flush();
assert.equal(gallery.dataset.masonry, "ready");
cleanupHidden();
console.log(`PASS: ${ratios.length} natural media ratios at 10 widths, seamless boundaries, no overlap, lazy/video loads, resize batching, hidden-container recovery and cleanup.`);
