// Semantic regression checks for the schema types used by these two sites.
// Not a substitute for Google's Rich Results Test or Search Console validation.
const assert = require("node:assert/strict");
const pageTypes = new Set(["WebPage", "ProfilePage", "CollectionPage", "ContactPage"]);
function validateSearchSchema(html, url) {
  const documents = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => JSON.parse(m[1]));
  assert(documents.length, `${url}: missing structured data`);
  const nodes = [];
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    nodes.push(value);
    Object.values(value).forEach(visit);
  }
  documents.forEach(document => {
    assert.equal(document["@context"], "https://schema.org", `${url}: context`);
    visit(document);
  });
  const byId = new Map();
  for (const node of nodes) if (node["@id"] && node["@type"]) byId.set(node["@id"], { ...byId.get(node["@id"]), ...node });
  const resolve = node => ({ ...byId.get(node?.["@id"]), ...node });
  const types = node => [].concat(node?.["@type"] || []);
  const lang = html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1];
  const decode = text => text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&#39;", "'");
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
  const pages = nodes.filter(node => types(node).some(type => pageTypes.has(type)));
  assert.equal(pages.length, 1, `${url}: one unambiguous page entity`);
  for (const page of pages) {
    assert.equal(page.url, url, `${url}: schema page URL must match canonical`);
    assert(page["@id"]?.startsWith(url + "#"), `${url}: localized page ID`);
    assert.equal(page.inLanguage, lang, `${url}: schema language`);
    assert.equal(page.name, title, `${url}: schema title`);
    if (types(page).includes("ProfilePage")) {
      const main = resolve(page.mainEntity);
      assert(types(main).some(t => ["Person", "Organization"].includes(t)), `${url}: ProfilePage mainEntity must resolve to Person or Organization on this page`);
      assert(main.name || main.alternateName, `${url}: profile entity name`);
      for (const key of ["dateCreated", "dateModified"]) if (page[key] !== undefined) {
        assert.match(page[key], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/, `${url}: ProfilePage ${key} requires complete DateTime`);
        assert(Number.isFinite(Date.parse(page[key])), `${url}: invalid ${key}`);
      }
    }
    if (page.mainEntity) assert(resolve(page.mainEntity)["@type"], `${url}: unresolved mainEntity`);
  }
  for (const node of nodes) {
    if (types(node).includes("Person")) assert(node.name || node.alternateName, `${url}: Person name`);
    for (const role of ["author", "creator", "publisher", "provider"]) if (node[role]) {
      for (const value of [].concat(node[role])) {
        const entity = resolve(value);
        assert(types(entity).some(t => ["Person", "Organization"].includes(t)), `${url}: unresolved ${role}`);
        assert(entity.name || entity.alternateName, `${url}: ${role} name`);
      }
    }
    if (types(node).includes("Service")) assert(node.name && node.url && node.provider, `${url}: complete Service`);
    if (types(node).includes("WebSite")) assert(node.name && node.url, `${url}: complete WebSite`);
    if (types(node).some(t => ["CreativeWork", "CreativeWorkSeries"].includes(t))) assert(node.name, `${url}: artwork/citation name`);
  }
  return { profiles: pages.filter(p => p["@type"] === "ProfilePage").length, documents: documents.length };
}
module.exports = { validateSearchSchema };
