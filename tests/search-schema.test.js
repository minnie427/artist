const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateSearchSchema } = require("../scripts/validate-search-schema.js");
const root = path.resolve(__dirname, "..");
let count = 0, profiles = 0;
for (const [,url] of fs.readFileSync(path.join(root,"sitemap.xml"),"utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const html = fs.readFileSync(path.join(root,new URL(url).pathname,"index.html"),"utf8");
  profiles += validateSearchSchema(html,url).profiles;
  count++;
}
assert.equal(count,42);
assert.equal(profiles,4);
const url = "https://example.com/profile/";
const person = { "@type":"Person", "@id":"https://example.com/#person", name:"Test Person" };
const page = { "@context":"https://schema.org", "@type":"ProfilePage", "@id":url+"#page", url, name:"Test", inLanguage:"en", mainEntity:person };
const html = data => `<html lang="en"><title>Test</title><script type="application/ld+json">${JSON.stringify(data)}</script></html>`;
assert.doesNotThrow(()=>validateSearchSchema(html(page),url));
assert.throws(()=>validateSearchSchema(html({...page,mainEntity:{"@id":person["@id"]}}),url), /mainEntity/);
assert.throws(()=>validateSearchSchema(html({...page,dateModified:"2026-09-06"}),url), /DateTime/);
assert.throws(()=>validateSearchSchema(html({...page,url:"https://example.com/other/"}),url), /URL/);
assert.throws(()=>validateSearchSchema(html({...page,inLanguage:"ko"}),url), /language/);
assert.doesNotThrow(()=>validateSearchSchema(html({...page,dateModified:"2026-09-06T12:00:00+09:00"}),url));
assert.doesNotThrow(()=>validateSearchSchema(html({"@context":"https://schema.org","@graph":[{...page,mainEntity:{"@id":person["@id"]}},person]}),url));
console.log("PASS: 42 artist pages, 4 ProfilePages, page-local identity, localized metadata and negative regression fixtures.");
