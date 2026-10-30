// Public website evidence requirements; no application or external submission.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(read("project-details.js"), context);
const details = context.window.MP_PROJECT_DETAILS;
const primary = ["funeral", "meta-kibun", "origin", "shared-resonance"];
for (const key of primary) {
  const records = details[key].technical;
  assert.equal(records.length, key === "shared-resonance" ? 2 : 1);
  for (const record of records) {
    for (const field of ["label", "medium", "materials", "tools", "dimensions", "credit"]) {
      for (const locale of ["en", "ko"]) assert(record[field][locale]?.trim(), `${key}: ${field}/${locale}`);
    }
    assert.match(record.dimensions.en, /variable according to venue/i);
    assert.match(record.tools.en, /TouchDesigner/);
    assert.match(record.credit.en, /Minnie Park.*concept, exhibition planning and production/);
    assert(!/\d/.test(record.dimensions.en), "Do not invent measured dimensions");
  }
  for (const locale of ["", "ko/"]) {
    const html = read(`${locale}works/${key}/index.html`);
    assert.equal((html.match(/id="technical-title"/g) || []).length, 1);
    assert.equal((html.match(/class="project-technical-record"/g) || []).length, records.length);
    assert.equal((html.match(/<dt>/g) || []).length >= records.length * 5, true);
    assert(html.includes(locale ? "장소와" : "according to venue"));
    assert(!/TBC|TBD|Dimensions unknown|치수 미확인/.test(html), "No internal placeholders on the public page");
  }
}
assert.match(details.origin.technical[0].tools.en, /TouchDesigner.*Unreal Engine/);
assert.match(details["shared-resonance"].technical[0].tools.en, /TouchDesigner/);
assert.match(details["shared-resonance"].technical[0].medium.en, /two or more/);
assert.match(details["shared-resonance"].technical[1].medium.en, /individual.*collective.*without touching/);
for (const locale of ["", "ko/"]) {
  const research = read(`${locale}research/index.html`);
  const process = research.match(/<section[^>]*id="research-making"[\s\S]*?<\/section>/)?.[0];
  assert(process, "Public making narrative is statically readable without JavaScript");
  assert(process.includes("https://minnie427.github.io/TheMetaRoseProject_blog/"));
  assert(process.includes(locale ? "표정에서 추론하는 것이 아니라" : "not inferred from facial expression"));
  assert(!/award application|submit your entry|신청서/.test(process));
  for (const anchor of ["meta-rose", "research-making", "research-time", "research-evidence"]) {
    assert(research.includes(`href="#${anchor}"`));
    assert(research.includes(`id="${anchor}"`));
  }
  if (!locale) {
    const paragraphs = [...process.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<[^>]+>/g, "")).join(" ");
    assert(paragraphs.split(/\s+/).length >= 200, "Creation narrative exceeds the supplied 100-word requirement");
  }
}
console.log("PASS: four bilingual artwork records, five distinct presentations, confirmed variable dimensions, verified process link, statically accessible creation narrative and local section navigation. No application actions.");
