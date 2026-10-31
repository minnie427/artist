// The artist's explicit portrait selection is independent of bulk library imports.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const approved = {
  src: "media/profile/artist2.webp",
  alt: "Minnie Park holding a rose within an interactive installation"
};
assert(fs.existsSync(path.join(root, approved.src)), "Approved artist2 image remains available");
for (const locale of ["en", "ko"]) {
  for (const imported of [undefined, { profile: null }, {
    profile: { src: "media/profile/unapproved-new-photo.webp", alt: "Automatically imported candidate" },
    projects: {}
  }]) {
    const app = { innerHTML: "" };
    const context = {
      window: {
        MP_IMPORTED_MEDIA: imported,
        location: { protocol: "https:", hash: "" },
        localStorage: { getItem: () => locale }
      },
      document: {
        body: { dataset: { page: "artist", locale, root: locale === "ko" ? "../../" : "../" }, insertBefore() {}, appendChild() {} },
        documentElement: {}, head: { appendChild() {} }, getElementById: () => app,
        createElement: () => ({ querySelector: () => null, setAttribute() {}, addEventListener() {} }),
        querySelector: () => null
      }
    };
    vm.createContext(context);
    vm.runInContext(read("site-content.js"), context, { filename: "site-content.js" });
    assert.equal(JSON.stringify(context.window.MP_SITE.artistImage), JSON.stringify(approved), "Bulk profile data cannot replace artist2");
    vm.runInContext(read("site-render.js"), context, { filename: "site-render.js" });
    const portrait = app.innerHTML.match(/<figure class="artist-overview__portrait">([\s\S]*?)<\/figure>/)?.[1];
    assert(portrait?.includes(approved.src), locale + ": approved portrait is rendered");
    assert(!portrait.includes("unapproved-new-photo"), locale + ": imported candidate stays unpublished");
  }
}
console.log("PASS: approved artist2 portrait and original alt retained in EN/KO, including absent, empty and conflicting bulk profile imports.");
