// Build the same visible content for people and crawlers. No user-agent variants.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const origin = "https://minniepark.art/";
const stamp = "20260911-seo-54";
const esc = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const routes = [...read("sitemap.xml").matchAll(/<loc>https:\/\/minniepark\.art\/([^<]*)<\/loc>/g)]
  .map(match => match[1]).filter(route => !route.startsWith("ko/"));
const enDescriptions = {
  home: "Minnie Park is an interactive audio-visual artist based in Seoul and Melbourne. Explore Meta Rose, living-rose installations and research into touch, colour, affect and audience participation.",
  artist: "Minnie Park’s biography, artistic practice, exhibition and workshop history, and artist CV. Interactive media art shaped by living roses, touch, colour and affect.",
  research: "Minnie Park’s ongoing research through Meta Rose: emotional ambivalence, touch, living roses, material time and photographic records, supported by the 2025 Honours study."
};
const koTitles = {
  home: "Minnie Park | 인터랙티브 미디어아트 작가 · 서울·멜버른",
  artist: "Minnie Park 소개 | 인터랙티브 미디어아트 작가",
  works: "작품 | Meta Rose · Minnie Park",
  "visual-index": "비주얼 인덱스 | Minnie Park",
  research: "리서치 | 감정·장미·터치 · Minnie Park",
  contact: "전시·리서치·협업 문의 | Minnie Park", cv: "아티스트 CV | Minnie Park"
};
const koDescriptions = {
  home: "서울과 멜버른을 기반으로 활동하는 인터랙티브 미디어아트 작가 Minnie Park. 생장미, 터치, 색, 사운드와 관객 참여를 통해 감정과 양가성을 탐구하는 Meta Rose 작품을 소개합니다.",
  artist: "Minnie Park의 작가 소개, 작업관, 전시·퍼포먼스·워크숍 이력과 CV. 생장미와 터치, 핑크와 오디오비주얼 설치를 통해 감정적 경험을 탐구합니다.",
  works: "Minnie Park의 Meta Rose 작품: Origin, Meta Kibun, Shared Resonance, The Funeral. 관객 참여형 설치와 주요 협업, 워크숍, 라이브 퍼포먼스를 소개합니다.",
  "visual-index": "Minnie Park의 인터랙티브 설치, 실시간 비주얼, 생장미와 관객 참여를 사진과 영상으로 살펴보는 비주얼 인덱스입니다.",
  research: "Meta Rose를 통해 양가적 감정, 촉각적 참여, 장미의 시간성과 사진 기록을 탐구하는 Minnie Park의 리서치. 2025년 Honours 논문을 작업의 근거로 소개합니다.",
  contact: "Minnie Park에게 전시, 큐레토리얼 협업, 연구, 토크와 예술 협업을 문의하세요. 아티스트 CV 다운로드와 별도 커미션 사이트 안내.",
  cv: "Minnie Park의 아티스트 CV. 전시, 학력, 연구, 워크숍과 주요 협업 이력을 확인하고 2026년 PDF를 다운로드할 수 있습니다."
};

function render(template, route, locale) {
  const page = template.match(/data-page="([^"]+)"/)[1];
  const project = template.match(/data-project="([^"]+)"/)?.[1] || "";
  const relative = "../".repeat(route.split("/").filter(Boolean).length + (locale === "ko" ? 1 : 0)) || "./";
  const app = { innerHTML: "" };
  let chrome = "";
  const description = {};
  const context = { window: { location: { protocol: "https:", hash: "" }, localStorage: { getItem: () => locale } },
    document: { body: { dataset: { page, project, root: relative, locale }, insertBefore(node) { if (node.className === "global-header") chrome = node.innerHTML; }, appendChild() {} }, documentElement: {},
      head: { appendChild() {} }, getElementById: () => app,
      createElement: () => ({ querySelector: () => null, setAttribute() {}, addEventListener() {} }),
      querySelector: selector => selector === 'meta[name="description"]' ? description : null }
  };
  vm.createContext(context);
  for (const file of ["site-media.js", "site-content.js", "site-render.js"]) vm.runInContext(read(file), context);
  const projectData = context.window.MP_SITE.projects[project];
  const title = locale === "en" ? context.document.title : koTitles[page] || `${projectData?.title || "작품"} | Minnie Park`;
  const summary = locale === "en" ? enDescriptions[page] || description.content : koDescriptions[page] || projectData?.cardKo || projectData?.paragraphsKo?.[0] || `${projectData?.title} — Minnie Park의 인터랙티브 오디오비주얼 작업. 작품 설명과 전시 기록을 살펴보세요.`;
  let html = template.replace(/<html lang="[^"]+">/, `<html lang="${locale}">`)
    .replace(/\s*<header class="global-header" data-search-chrome>[\s\S]*?<\/header>/g, "")
    .replace(/<main class="site-shell" id="app">[\s\S]*?<\/main>/, `<main class="site-shell" id="app">${app.innerHTML}</main>`)
    .replace(/\s*<noscript>[\s\S]*?<\/noscript>/g, "")
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*("\s*\/>)/, `$1${esc(summary)}$2`)
    .replace(/\s*<link rel="alternate" hreflang="[^"]+"[^>]*>/g, "")
    .replace(/data-root="[^"]+"(?: data-locale="[^"]+" data-route="[^"]*" data-seo-static="true")?/, `data-root="${relative}" data-locale="${locale}" data-route="${route}" data-seo-static="true"`);
  // Static head and body agree; the browser does not replace these with English metadata.
  const canonical = origin + (locale === "ko" ? "ko/" : "") + route;
  html = html.replace(/(<link rel="canonical" href=")[^"]+/, `$1${canonical}`)
    .replace(/(<meta property="og:url" content=")[^"]+/, `$1${canonical}`)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]+/g, `$1${esc(title)}`)
    .replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]+/g, `$1${esc(summary)}`);
  for (const [attribute, key, value] of [["name", "twitter:title", title], ["name", "twitter:description", summary], ["property", "og:locale", locale === "ko" ? "ko_KR" : "en_US"], ["name", "msvalidate.01", "20B9C3E42F618F8AFA82E2EDB595B31F"]]) {
    const tag = `<meta ${attribute}="${key}" content="${esc(value)}" />`;
    const pattern = new RegExp(`<meta ${attribute}="${key}"[^>]*>`);
    html = pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n</head>`);
  }
  html = html.replace('<main class="site-shell" id="app">', `<header class="global-header" data-search-chrome>${chrome}</header>\n  <main class="site-shell" id="app">`);
  html = html.replace('</head>', `  <link rel="alternate" hreflang="en" href="${origin + route}" />\n  <link rel="alternate" hreflang="ko" href="${origin}ko/${route}" />\n  <link rel="alternate" hreflang="x-default" href="${origin + route}" />\n</head>`);
  if (locale === "ko") {
    // Only template-level scripts/styles need rebasing; generated content already uses relative.
    html = html.replace(/(<(?:script|link)\b[^>]*(?:src|href)=")(\.\/|(?:\.\.\/)+)([^"#]+)(")/g,
      (_, before, oldRoot, file, after) => `${before}${relative}${file}${after}`);
    html = html.replace(/(<a class="home-mark" href=")[^"]+/, `$1${relative}ko/`)
      .replace(/(<a class="sticky-inquiry is-hidden" href=")[^"]+/, `$1${relative}ko/contact/`);
    html = html.replace('Each click introduces another rose.</span>', '클릭할 때마다 또 하나의 장미가 나타납니다.</span>')
      .replace('Each tap introduces another rose.</span>', '터치할 때마다 또 하나의 장미가 나타납니다.</span>');
  }
  html = html.replace(/((?:site-render|site-media|site-content)\.js)\?v=[^"\s]+/g, `$1?v=${stamp}`);
  const entity = { "@context": "https://schema.org", "@type": "WebPage", "@id": `${canonical}#localized-page`, url: canonical,
    name: title, description: summary, inLanguage: locale,
    isPartOf: { "@id": `${origin}#website` }, about: { "@id": `${origin}#artist` } };
  html = html.replace(/\s*<script type="application\/ld\+json" data-search-page>[\s\S]*?<\/script>/g, "")
    .replace('</head>', `  <script type="application/ld+json" data-search-page>${JSON.stringify(entity).replaceAll("<", "\\u003c")}</script>\n</head>`);
  const destination = path.join(root, locale === "ko" ? "ko" : "", route, "index.html");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, html.replace(/[\t ]+$/gm, ""));
}
for (const route of routes) {
  const template = read(`${route}index.html`);
  render(template, route, "en");
  render(template, route, "ko");
}
const urls = routes.flatMap(route => [origin + route, origin + "ko/" + route]);
fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`);
console.log(`Built ${urls.length} crawlable artist pages with reciprocal EN/KO alternates.`);
