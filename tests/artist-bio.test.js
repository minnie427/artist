// Artist biography regression checks. No browser rendering or external requests.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const expected = {
  "en": [
    "Minnie Park is a Korean-Australian interactive audio-visual artist working between Seoul and Melbourne. Her installations combine living roses, tactile interaction, sound, light and moving image to examine affect as embodied, relational and culturally situated. Through Meta Rose, begun in 2024 and including The Meta Kibun Project, she develops distinct participatory systems around emotional ambivalence, culturally shaped feeling, relational touch and memory.",
    "Her 2025 Honours research at RMIT University examined audience accounts through The Meta Kibun Project, using interviews and surveys alongside an interactive exhibition. Park is also a co-founder of TouchCollective, an artist-led community centred on TouchDesigner, and develops workshops connecting creative practice, embodied participation and technical experimentation."
  ],
  "ko": [
    "Minnie Park는 서울과 멜버른을 기반으로 활동하는 한국계 호주 인터랙티브 오디오비주얼 아티스트입니다. 생장미, 촉각적 인터랙션, 사운드, 빛과 무빙이미지를 결합한 설치를 통해 정서를 신체적이고 관계적이며 문화적으로 형성되는 경험으로 살펴봅니다. 2024년에 시작되어 The Meta Kibun Project를 포함하는 Meta Rose를 통해 감정의 양가성, 문화적으로 형성된 감정, 관계적 터치와 기억을 다루는 서로 다른 참여형 시스템을 구축합니다.",
    "2025년 RMIT University의 Honours 연구에서는 The Meta Kibun Project의 인터랙티브 전시와 인터뷰·설문을 통해 관객의 경험 서술을 살펴봤습니다. TouchDesigner를 중심으로 활동하는 아티스트 주도 커뮤니티 TouchCollective의 공동 설립자이기도 하며, 창작 실천과 신체적 참여, 기술적 실험을 연결하는 워크숍을 발전시키고 있습니다."
  ]
};
// Preserve the approved biography, statement and earlier history. Only requested punctuation and the two verified October entries change.
const preserved = {
  en: { statement: "cf56520d5cbea5abcb4f3f8c674bea3cf56ba866155167091b4af639821670f5", history: "f66cbb159a43502892586eee6c0b5e0859735adfa5382e6557d36251c8c82bac" },
  ko: { statement: "3cbd0b0f75e95f5856dc22a3aff218ba0d3a5e4edc0177253b5862b2aad959a8", history: "e26df5af24f857f9d4e132d3627b968c96077403585ccf404a949fe532e911a5" }
};
const normalise = value => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const hash = value => crypto.createHash("sha256").update(normalise(value)).digest("hex");
const words = value => value.trim().split(/\s+/).length;

function render(language, protocol) {
  const app = { innerHTML: "" };
  const context = {
    window: { location: { protocol, hash: "" }, localStorage: { getItem: () => language } },
    document: {
      body: { dataset: { page: "artist", root: "../", locale: language }, insertBefore() {}, appendChild() {} },
      documentElement: {}, head: { appendChild() {} }, getElementById: () => app,
      createElement: () => ({ querySelector: () => null, setAttribute() {}, addEventListener() {} }),
      querySelector: () => null
    }
  };
  vm.createContext(context);
  for (const file of ["site-media.js", "site-content.js", "project-details.js", "site-editorial.js", "edition-render.js", "site-render.js"]) {
    vm.runInContext(read(file), context, { filename: file });
  }
  return app.innerHTML;
}

function check(html, language, label) {
  assert(html.includes('class="artist-overview"'), label + ": approved B layout is rendered natively");
  assert(html.includes('class="artist-overview__portrait"'), label + ": portrait retained in the shared right column");
  assert(html.includes('class="artist-bio artist-overview__biography"'), label + ": full biography follows the portrait");
  assert(!/layout-review|data-layout-review/.test(html), label + ": no preview-only transformation or controls");
  const section = html.match(/<section class="artist-bio[^>]*>([\s\S]*?)<\/section>/);
  assert(section, label + ": biography section exists");
  const copy = section[1].match(/<div class="long-copy">([\s\S]*)/)[1];
  const paragraphs = [...copy.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => normalise(match[1]));
  assert.deepEqual(paragraphs, expected[language], label + ": first paragraph unchanged and exact approved addition follows");
  for (const paragraph of expected[language]) {
    assert.equal(html.split(paragraph).length - 1, 1, label + ": each paragraph appears exactly once");
  }
  assert(/download(?:\s|>|=)/.test(copy), label + ": CV download retained");
  assert(copy.includes(language === "ko" ? "작품 보기" : "View Works"), label + ": Works action retained");
  if (language === "en") {
    assert.equal(words(paragraphs[0]), 61, label + ": approved first paragraph preserved with comma punctuation");
    assert(words(paragraphs.join(" ")) >= 100, label + ": complete biography is at least 100 words");
  }
  const statement = html.match(/<section class="artist-statement[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.equal(hash(statement), preserved[language].statement, label + ": exact approved narrative and artwork caption");
  const historyStart = html.indexOf('<section class="artist-history');
  const historyEnd = html.indexOf("<footer", historyStart);
  assert(historyStart >= 0 && historyEnd > historyStart, label + ": selected history retained");
  // Exact current history approved with October presentations, workshop,
  // solo classifications and the Body Morphosis medium correction.
  assert.equal(hash(html.slice(historyStart, historyEnd)), preserved[language].history, label + ": exact approved history and roles retained");
}

for (const language of ["en", "ko"]) {
  const route = (language === "ko" ? "ko/" : "") + "artist/index.html";
  const staticHtml = read(route);
  check(staticHtml, language, route + "/static");
  assert(staticHtml.includes("page-layouts.css?v="), route + ": approved B stylesheet is connected");
  assert(staticHtml.includes("site-render.js?v=20261031-layout-b-media-78"), route + ": refreshed renderer cache version");
  for (const protocol of ["https:", "file:"]) check(render(language, protocol), language, language + "/" + protocol);
}
console.log("PASS: Artist biography " + words(expected.en.join(" ")) + " English words (" + words(expected.en[0]) + " original + " + words(expected.en[1]) + " added); exact EN/KO biography and approved narrative in static and HTTP/file runtime renders; history and actions retained.");
