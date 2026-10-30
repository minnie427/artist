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
    "Minnie Park is a Korean-Australian interactive audio-visual artist working between Seoul and Melbourne. Her installations combine living roses, tactile interaction, sound, light and moving image to examine affect as embodied, relational and culturally situated. Through Meta Rose—begun in 2024 and including The Meta Kibun Project—she develops distinct participatory systems around emotional ambivalence, culturally shaped feeling, relational touch and memory.",
    "Her 2025 Honours research at RMIT University examined audience accounts through The Meta Kibun Project, using interviews and surveys alongside an interactive exhibition. Park is also a co-founder of TouchCollective, an artist-led community centred on TouchDesigner, and develops workshops connecting creative practice, embodied participation and technical experimentation."
  ],
  "ko": [
    "Minnie Park는 서울과 멜버른을 기반으로 활동하는 한국계 호주 인터랙티브 오디오비주얼 아티스트입니다. 생장미, 촉각적 인터랙션, 사운드, 빛과 무빙이미지를 결합한 설치를 통해 정서를 신체적이고 관계적이며 문화적으로 형성되는 경험으로 살펴봅니다. 2024년에 시작되어 The Meta Kibun Project를 포함하는 Meta Rose를 통해 감정의 양가성, 문화적으로 형성된 감정, 관계적 터치와 기억을 다루는 서로 다른 참여형 시스템을 구축합니다.",
    "2025년 RMIT University의 Honours 연구에서는 The Meta Kibun Project의 인터랙티브 전시와 인터뷰·설문을 통해 관객의 경험 서술을 살펴봤습니다. TouchDesigner를 중심으로 활동하는 아티스트 주도 커뮤니티 TouchCollective의 공동 설립자이기도 하며, 창작 실천과 신체적 참여, 기술적 실험을 연결하는 워크숍을 발전시키고 있습니다."
  ]
};
// Normalised text snapshots taken before the single-paragraph biography addition.
const preserved = {
  en: { statement: "6378adcd7fec2ace83e852df12506fd76fe6c6215d26ff1b0c08c9a2f35b2221", history: "d8349cb673aa44bd25808310eb0ab75bc6c6b278096c4ef90bb2f4da4c9ef54c" },
  ko: { statement: "5ad22a7e82c7c388ebbfd732beeae819585240e34713f2cd849b3c4c93662e34", history: "60d1294292cd750cc8dbbd69163bc03d2e9157f4b376e7968c1a5e1854e87e77" }
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
    assert.equal(words(paragraphs[0]), 59, label + ": existing 59-word first paragraph preserved");
    assert(words(paragraphs.join(" ")) >= 100, label + ": complete biography is at least 100 words");
  }
  const statement = html.match(/<section class="artist-statement[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.equal(hash(statement), preserved[language].statement, label + ": Artist Statement text is unchanged");
  const historyStart = html.indexOf('<section class="artist-history');
  const historyEnd = html.indexOf("<footer", historyStart);
  assert(historyStart >= 0 && historyEnd > historyStart, label + ": selected history retained");
  // Undo only the confirmed Fringe correction before comparing the original
  // history snapshot. Dedicated fringe-history tests assert the new facts.
  const priorHistory = html.slice(historyStart, historyEnd)
    .replace(/<a class="artist-history__entry"[^>]*>[\s\S]*?<\/a>/g, row => {
      if (row.includes("Celia Little Room")) return "";
      if (!row.includes("Meta Rose: The Funeral")) return row;
      const suffix = language === "ko" ? " / Melbourne Fringe Festival(예정)" : " / Melbourne Fringe Festival (forthcoming)";
      return row.replace(/(<p class="artist-history__context">[^<]+)(<\/p>)/, `$1${suffix}$2`);
    });
  assert.equal(hash(priorHistory), preserved[language].history, label + ": unrelated selected history text is unchanged");
}

for (const language of ["en", "ko"]) {
  const route = (language === "ko" ? "ko/" : "") + "artist/index.html";
  const staticHtml = read(route);
  check(staticHtml, language, route + "/static");
  assert(staticHtml.includes("site-render.js?v=20261031-artwork-record-62"), route + ": refreshed renderer cache version");
  for (const protocol of ["https:", "file:"]) check(render(language, protocol), language, language + "/" + protocol);
}
console.log("PASS: Artist biography " + words(expected.en.join(" ")) + " English words (" + words(expected.en[0]) + " original + " + words(expected.en[1]) + " added); exact EN/KO copy in static and HTTP/file runtime renders; original statement, history and actions retained.");
