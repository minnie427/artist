// Keep Google-facing entities complete on every page, not only on the homepage.
const pageTypes = new Set(["WebPage", "ProfilePage", "CollectionPage", "ContactPage"]);
const scripts = /\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
function parseSchemas(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/data-search-page/.test(match[0].split(">")[0]))
    .flatMap(match => {
      const data = JSON.parse(match[1]);
      return data["@graph"] || (Array.isArray(data) ? data : [data]);
    });
}
function structuredData(html, { canonical, title, description, locale, person, website }) {
  const entities = parseSchemas(html).filter(entity => !["Person", "WebSite"].includes(entity["@type"]));
  let hasPage = false;
  for (const entity of entities) {
    if (!pageTypes.has(entity["@type"])) continue;
    hasPage = true;
    Object.assign(entity, { "@id": canonical + "#page", url: canonical, name: title,
      description, inLanguage: locale, isPartOf: { "@id": website["@id"] } });
    if (entity["@type"] === "ProfilePage") {
      entity.mainEntity = { ...person };
      // These optional fields previously contained date-only values. The actual
      // profile-edit time is not recorded: omit rather than invent a timestamp.
      delete entity.dateModified;
      delete entity.dateCreated;
    }
  }
  const graph = [website, person];
  if (!hasPage) graph.push({ "@type": "WebPage", "@id": canonical + "#page", url: canonical,
    name: title, description, inLanguage: locale, isPartOf: { "@id": website["@id"] },
    about: { "@id": person["@id"] },
    ...(entities.find(e => ["CreativeWork", "CreativeWorkSeries"].includes(e["@type"]))
      ? { mainEntity: { "@id": entities.find(e => ["CreativeWork", "CreativeWorkSeries"].includes(e["@type"]))["@id"] } } : {}) });
  const json = value => JSON.stringify(value).replaceAll("<", "\\u003c");
  const markup = entities.map(entity => `  <script type="application/ld+json">${json({ "@context": "https://schema.org", ...entity })}</script>`);
  markup.push(`  <script type="application/ld+json" data-search-page>${json({ "@context": "https://schema.org", "@graph": graph })}</script>`);
  return html.replace(scripts, "").replace("</head>", markup.join("\n") + "\n</head>");
}
module.exports = { parseSchemas, structuredData };
