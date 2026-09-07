(() => {
  const site = window.MP_SITE;
  const root = document.body.dataset.root || "./";
  const page = document.body.dataset.page || "home";
  const projectKey = document.body.dataset.project || "";
  const app = document.getElementById("app");
  let language = "en";

  if (!site || !app) return;

  try {
    language = window.localStorage.getItem("mp-language") === "ko" ? "ko" : "en";
  } catch (_) {
    language = "en";
  }
  document.documentElement.lang = language;

  const tr = (english, korean) => language === "ko" ? korean : english;
  const contextKo = {
    "Installation view": "설치 전경",
    "Suspended rose interface": "공중에 매단 장미 인터페이스",
    "Runway screen installation": "런웨이 스크린 설치",
    "Digital rose study": "디지털 장미 연구",
    "Collective interaction": "집단적 인터랙션",
    "Runway documentation": "런웨이 기록",
    "Real-time visual state": "실시간 비주얼 상태",
    "Visual study": "비주얼 연구",
    "Suspended rose installation": "공중에 매단 장미 설치",
    "Artist-led workshop": "아티스트 주도형 워크숍",
    "Participatory interface": "참여형 인터페이스",
    "Rose-interface installation": "장미 인터페이스 설치",
    "Project match to be confirmed": "프로젝트 연결 확인 예정",
    "Rose interface": "장미 인터페이스",
    "Interaction station": "인터랙션 스테이션",
    "Performance documentation": "퍼포먼스 기록",
    "Moving-image study": "무빙이미지 연구",
    "Conductive rose detail": "전도성 장미 디테일",
    "Installation documentation": "설치 기록",
    "Audio-visual study": "오디오비주얼 연구"
  };
  const projectField = (project, field) => {
    if (language !== "ko") return project[field];
    return project[`${field}Ko`] || project[field];
  };

  function switchLanguage() {
    const nextLanguage = language === "en" ? "ko" : "en";
    try {
      window.localStorage.setItem("mp-language", nextLanguage);
    } catch (_) {
      // Continue with the current browser's normal reload behavior.
    }
    window.location.reload();
  }

  const isFilePreview = window.location.protocol === "file:";
  const href = (path = "") => {
    const url = `${root}${path}`;
    if (!isFilePreview) return url;
    if (path === "") return `${root}index.html`;
    if (path.endsWith("/")) return `${url}index.html`;
    return url;
  };
  const media = (path) => {
    if (/^images\/.+\.(png|jpe?g)$/i.test(path)) {
      return href(path.replace(/^images\//, "images/web/").replace(/\.(png|jpe?g)$/i, ".webp"));
    }
    return href(path);
  };
  const projectUrl = (key) => href(site.projects[key].route);
  const activeSection = page === "project" || page === "works" ? "works" : page === "practice" ? "artist" : page;

  function setSeo(title, description) {
    document.title = title;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description;
  }

  function navLink(item, footer = false) {
    const external = item.external;
    const url = external ? item.path : href(item.path);
    const current = item.id === activeSection ? ' aria-current="page"' : "";
    const target = external ? ' target="_blank" rel="noreferrer"' : "";
    const cls = external ? `${footer ? "" : "global-nav__external"}` : "";
    return `<a${cls ? ` class="${cls}"` : ""} href="${url}"${target}${current}>${tr(item.label, item.labelKo || item.label)}</a>`;
  }

  function renderChrome() {
    const header = document.createElement("header");
    header.className = "global-header";
    header.innerHTML = `
      <nav class="global-nav" aria-label="${tr("Primary navigation", "주요 메뉴")}">
        <a class="global-nav__brand" href="${href("")}" aria-label="Minnie Park — ${tr("Home", "홈")}">Minnie Park</a>
        <button class="global-nav__toggle" type="button" aria-expanded="false" aria-controls="primaryLinks">
          <span>${tr("Menu", "메뉴")}</span>
        </button>
        <div class="global-nav__links" id="primaryLinks">
          ${site.nav.map((item) => navLink(item)).join("")}
        </div>
      </nav>
    `;
    document.body.insertBefore(header, app);

    if (page === "home") {
      const languageButton = document.createElement("button");
      languageButton.className = "home-language-toggle";
      languageButton.type = "button";
      languageButton.setAttribute("aria-label", tr("View this site in Korean", "영문 사이트 보기"));
      languageButton.textContent = tr("한국어 ↗", "English ↗");
      languageButton.addEventListener("click", switchLanguage);
      document.body.insertBefore(languageButton, app);
    }

    const toggle = header.querySelector(".global-nav__toggle");
    toggle?.addEventListener("click", () => {
      const open = document.body.classList.toggle("is-menu-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector("span").textContent = open ? tr("Close", "닫기") : tr("Menu", "메뉴");
    });

    const desktopHint = document.querySelector(".interaction-hint--desktop .interaction-hint__copy");
    const mobileHint = document.querySelector(".interaction-hint--mobile .interaction-hint__copy");
    if (desktopHint) desktopHint.textContent = tr("Each click introduces another rose.", "클릭할 때마다 또 하나의 장미가 나타납니다.");
    if (mobileHint) mobileHint.textContent = tr("Each tap introduces another rose.", "터치할 때마다 또 하나의 장미가 나타납니다.");
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="site-footer__identity">
          <p>Minnie Park</p>
          <p>${tr("Interactive Audio-Visual Artist", "인터랙티브 오디오비주얼 아티스트")}<br />${tr("Seoul / Melbourne", "서울 / 멜버른")}</p>
        </div>
        <nav aria-label="${tr("Footer navigation", "하단 메뉴")}">
          ${site.nav.map((item) => navLink(item, true)).join("")}
          <a href="${href(site.downloads.cv)}" download>${tr("CV 2026 ↓", "CV 2026 다운로드 ↓")}</a>
          <a href="${site.external.instagram}" target="_blank" rel="noreferrer">Instagram ↗</a>
        </nav>
        <div class="site-footer__contact">
          <a href="${site.external.email}">minniepark.studio@gmail.com</a>
          <p>© ${new Date().getFullYear()} Minnie Park</p>
        </div>
      </footer>
    `;
  }

  function actions(items) {
    return `
      <div class="page-actions">
        ${items.map((item) => {
          const url = item.external ? item.path : href(item.path);
          const target = item.external ? ' target="_blank" rel="noreferrer"' : "";
          const download = item.download ? " download" : "";
          return `<a href="${url}"${target}${download}>${item.label}</a>`;
        }).join("")}
      </div>
    `;
  }

  function imageMarkup(src, alt, eager = false) {
    return `<img src="${media(src)}" alt="${alt}" loading="${eager ? "eager" : "lazy"}" decoding="async" />`;
  }

  const isVideo = (src = "") => /\.(mp4|webm|ogv)(?:[?#].*)?$/i.test(src);

  function indexedMediaMarkup(item) {
    if (!isVideo(item.src)) return imageMarkup(item.src, `${item.title}, ${item.context}`);
    const poster = item.poster ? ` poster="${media(item.poster)}"` : "";
    return `<video src="${media(item.src)}"${poster} muted loop playsinline preload="metadata" aria-label="${item.title}, ${item.context}"></video>`;
  }

  function galleryMediaMarkup(item) {
    if (!isVideo(item.src)) return imageMarkup(item.src, item.alt);
    const poster = item.poster ? ` poster="${media(item.poster)}"` : "";
    return `<video src="${media(item.src)}"${poster} controls playsinline preload="metadata" aria-label="${item.alt}"></video>`;
  }

  function workCard(key, index, feature = false, imageOverride = null) {
    const project = site.projects[key];
    const displayImage = imageOverride || {
      src: project.image,
      alt: project.imageAlt,
      placeholder: project.placeholder
    };
    const placeholder = displayImage.placeholder ? " work-card--placeholder" : "";
    return `
      <a class="work-card${feature ? " work-card--feature" : ""}${placeholder}" href="${projectUrl(key)}">
        <figure>
          ${imageMarkup(displayImage.src, displayImage.alt)}
          ${displayImage.placeholder ? `<figcaption>${tr(displayImage.placeholder, "임시 이미지 — f01로 교체 예정")}</figcaption>` : ""}
        </figure>
        <div class="work-card__copy">
          <p class="work-index">${String(index + 1).padStart(2, "0")} / ${project.year} / ${projectField(project, "category")}</p>
          <h3>${project.title}</h3>
          <p>${projectField(project, "card")}</p>
          <span class="text-link">${tr("View project →", "프로젝트 보기 →")}</span>
        </div>
      </a>
    `;
  }

  function renderHome() {
    setSeo(
      "Minnie Park — Interactive Audio-Visual Artist",
      "Minnie Park creates tactile, interactive worlds where roses, colour, sound and moving image give form to feelings that resist a single name."
    );
    app.innerHTML = `
      <section class="landing" id="top" aria-labelledby="heroTitle">
        <div class="landing-top">
          <h1 id="heroTitle">Minnie Park</h1>
          <p class="eyebrow">${tr("Interactive Audio-Visual Artist", "인터랙티브 오디오비주얼 아티스트")}<br />${tr("Seoul / Melbourne", "서울 / 멜버른")}</p>
        </div>
        <div class="landing-bottom">
          <p class="hero-main">${tr(
            "Exploring affect, colour, touch, and culturally situated emotional experience through immersive digital installations.",
            "감정, 색, 터치와 문화적으로 형성되는 정서적 경험을 몰입형 디지털 설치를 통해 탐구합니다."
          )}</p>
          <p class="hero-note">${tr(
            "Through roses, water, sound and moving image, touch becomes a way of entering complex feeling.",
            "장미, 물, 사운드와 무빙이미지를 통해 터치는 복합적인 감정으로 들어가는 방식이 됩니다."
          )}</p>
          ${actions([
            { label: tr("Works", "작품"), path: "works/" }
          ])}
        </div>
      </section>
    `;
  }

  function renderWorks() {
    setSeo(
      "Works — Minnie Park",
      "Interactive audio-visual installations and moving-image works by Minnie Park, including the evolving Meta Rose and Meta Kibun projects."
    );
    app.innerHTML = `
      <section class="page-hero page-hero--works" id="top">
        <p class="eyebrow">${tr("Works / 2024—ongoing", "작품 / 2024—현재")}</p>
        <h1>${tr("Works", "작품")}</h1>
        <p class="hero-main">${tr(
          "An evolving body of interactive audio-visual work shaped by roses, touch, colour and audience participation.",
          "장미, 터치, 색과 관객 참여를 통해 계속 확장되는 인터랙티브 오디오비주얼 작업입니다."
        )}</p>
      </section>

      <section class="works-opening" aria-labelledby="worksOpeningTitle">
        <div class="works-opening__head">
          <p class="section-kicker" id="worksOpeningTitle">${tr("Selected Images / 2024—2026", "주요 이미지 / 2024—2026")}</p>
          <p>${tr("Installations, real-time visual states and moments of participation.", "설치, 실시간 비주얼 상태와 관객 참여의 순간들.")}</p>
        </div>
        <div class="works-opening__frame" data-works-opening>
          <button class="works-opening__nav works-opening__nav--prev" type="button" data-works-opening-step="-1" aria-label="${tr("Previous image", "이전 이미지")}">←</button>
          <div class="works-opening__viewport">
            <div class="works-opening__track">
              ${site.worksOpeningImages.map((item) => `
                <a class="works-opening__item" href="${projectUrl(item.project)}">
                  <figure>
                    ${imageMarkup(item.src, item.alt)}
                    <figcaption>${item.title} / ${item.year}</figcaption>
                  </figure>
                </a>
              `).join("")}
            </div>
          </div>
          <button class="works-opening__nav works-opening__nav--next" type="button" data-works-opening-step="1" aria-label="${tr("Next image", "다음 이미지")}">→</button>
        </div>
      </section>

      <section class="works-introduction content-section content-section--compact">
        <figure class="works-introduction__media works-introduction__media--rose">
          ${imageMarkup(site.projects.funeral.image, "Halftone rose representing the ongoing Meta Rose body of work")}
        </figure>
        <div class="works-introduction__identity">
          <p class="section-kicker">${tr("Meta Rose / Ongoing body of work", "Meta Rose / 연작")}</p>
          <h2>${tr("A recurring grammar, recomposed through every chapter.", "되풀이되는 조형 언어를 매 장마다 새롭게 구성합니다.")}</h2>
        </div>
        <div class="long-copy">
          <p>${tr(
            "Meta Rose is Minnie Park’s central, long-term body of work. Begun in 2024, it treats the rose, pink and touch as a recurring artistic grammar. Each chapter begins with a new emotional question and recomposes that grammar as a distinct installation, with its own spatial arrangement, audio-visual system and conditions of participation.",
            "Meta Rose는 Minnie Park 작업의 중심을 이루는 장기 연작입니다. 2024년에 시작된 이 연작은 장미, 핑크와 터치를 반복되는 조형 언어로 다룹니다. 각 장은 새로운 감정적 질문에서 출발하며, 고유한 공간 구성, 오디오비주얼 시스템과 참여 조건을 지닌 서로 다른 설치로 이 언어를 다시 구성합니다."
          )}</p>
          <p>${tr(
            "Across the series, living roses move between interface, image, body, memorial and data trace. Opposing states—bloom and decay, tenderness and friction, life and death—remain in tension rather than resolving into a single emotional reading.",
            "연작에서 생장미는 인터페이스, 이미지, 신체, 기념물과 데이터 흔적 사이를 이동합니다. 개화와 소멸, 부드러움과 마찰, 삶과 죽음 같은 대립하는 상태는 하나의 감정적 해석으로 정리되지 않은 채 긴장 속에 함께 존재합니다."
          )}</p>
          <a class="inline-link" href="${projectUrl("meta-rose")}">${tr("About Meta Rose →", "Meta Rose 소개 →")}</a>
        </div>
      </section>

      <section class="work-catalogue content-section">
        <div class="section-heading section-heading--row">
          <p class="section-kicker">${tr("Meta Rose / Chapters", "Meta Rose / 장")}</p>
          <p>${tr("2024—ongoing", "2024—현재")}</p>
        </div>
        <div class="work-card-grid work-card-grid--primary">
          ${site.primaryWorksOrder.map((key, index) => workCard(
            key,
            index,
            true,
            key === "funeral" ? {
              src: site.projects["meta-rose"].image,
              alt: site.projects["meta-rose"].imageAlt,
              placeholder: null
            } : null
          )).join("")}
        </div>
      </section>

      <section class="content-section selected-context">
        <div class="section-heading">
          <p class="section-kicker">${tr("Selected Collaborations", "주요 협업")}</p>
          <h2>${tr(
            "Selected collaborations carry this visual language into public and cultural contexts while preserving its distinct identity.",
            "주요 협업은 고유한 정체성을 유지하며 이 비주얼 언어를 공공·문화적 맥락으로 확장합니다."
          )}</h2>
        </div>
        <div class="work-card-grid work-card-grid--selected">
          ${site.selectedWorksOrder.map((key, index) => workCard(key, index)).join("")}
        </div>
      </section>

      <section class="index-invitation content-section">
        <p class="section-kicker">${tr("Visual Index", "비주얼 인덱스")}</p>
        <a href="${href("visual-index/")}">${tr("Enter the growing field of images →", "확장되는 이미지의 장으로 들어가기 →")}</a>
      </section>
      ${renderFooter()}
    `;
    initWorksOpening();
  }

  function initWorksOpening() {
    const frame = document.querySelector("[data-works-opening]");
    const viewport = frame?.querySelector(".works-opening__viewport");
    const items = Array.from(frame?.querySelectorAll(".works-opening__item") || []);
    if (!frame || !viewport || !items.length) return;

    frame.querySelectorAll("[data-works-opening-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const viewportLeft = viewport.getBoundingClientRect().left;
        const positions = items.map((item) => viewport.scrollLeft + item.getBoundingClientRect().left - viewportLeft);
        const currentIndex = positions.reduce((nearest, position, index) => (
          Math.abs(position - viewport.scrollLeft) < Math.abs(positions[nearest] - viewport.scrollLeft) ? index : nearest
        ), 0);
        const targetIndex = Math.min(items.length - 1, Math.max(0, currentIndex + Number(button.dataset.worksOpeningStep)));
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        viewport.scrollTo({ left: positions[targetIndex], behavior });
      });
    });
  }

  function renderProject() {
    const project = site.projects[projectKey];
    if (!project) {
      setSeo("Project — Minnie Park", "Project page by Minnie Park.");
      app.innerHTML = `
        <section class="page-hero"><p class="eyebrow">Minnie Park</p><h1>Project not found.</h1>${actions([{ label: "Return to Works", path: "works/" }])}</section>
        ${renderFooter()}
      `;
      return;
    }

    setSeo(`${project.title} — Minnie Park`, project.card);
    const isPrimary = site.primaryWorksOrder.includes(projectKey);
    const gallery = project.gallery || [];
    const metadata = projectField(project, "metadata") || project.metadata;
    const paragraphs = projectField(project, "paragraphs") || project.paragraphs;
    app.innerHTML = `
      <article class="project-page">
        <section class="project-hero" id="top">
          <div class="project-hero__copy">
            <p class="eyebrow">${projectField(project, "eyebrow")}</p>
            <h1>${project.title}</h1>
            <p class="project-subtitle">${projectField(project, "subtitle")}</p>
            <div class="project-meta">${metadata.map((line) => `<p>${line}</p>`).join("")}</div>
          </div>
          <figure class="project-hero__media${project.placeholder ? " is-placeholder" : ""}">
            ${imageMarkup(project.image, project.imageAlt, true)}
            ${project.placeholder ? `<figcaption>${tr(project.placeholder, "임시 이미지 — f01로 교체 예정")}</figcaption>` : ""}
          </figure>
        </section>

        <section class="project-introduction content-section content-section--compact">
          <div>
            <p class="section-kicker">${tr("Project", "프로젝트")}</p>
            <h2>${projectField(project, "lead")}</h2>
          </div>
          <div class="long-copy">
            ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            ${project.role ? `<p class="project-role"><strong>${tr("Role", "역할")}</strong><br />${projectField(project, "role")}</p>` : ""}
          </div>
        </section>

        ${project.chapters ? `
          <section class="content-section project-chapters">
            <div class="section-heading">
              <p class="section-kicker">${tr("Four works / One passage", "네 작품 / 하나의 통과")}</p>
              <h2>${tr("Naming / Intervention / Witness / Record", "명명 / 개입 / 목격 / 기록")}</h2>
            </div>
            <div class="chapter-grid">
              ${project.chapters.map((chapter) => `
                <article>
                  <p>${chapter.number}</p>
                  <h3>${tr(chapter.title, chapter.korean)}</h3>
                  <p>${tr(chapter.text, chapter.textKo || chapter.text)}</p>
                </article>
              `).join("")}
            </div>
          </section>
        ` : ""}

        ${gallery.length ? `
          <section class="project-gallery content-section" aria-label="${project.title} media gallery">
            ${gallery.map((item) => `<figure>${galleryMediaMarkup(item)}</figure>`).join("")}
          </section>
        ` : `
          <section class="documentation-note content-section">
            <p class="section-kicker">${tr("Documentation", "기록")}</p>
            <p>${tr("Project photography and moving-image documentation will be added here.", "프로젝트 사진과 무빙이미지 기록을 이곳에 추가할 예정입니다.")}</p>
          </section>
        `}

        ${renderProjectNav(projectKey, isPrimary)}
      </article>
      ${renderFooter()}
    `;
  }

  function renderProjectNav(currentKey, isPrimary) {
    const sequence = site.projectSequence;
    const index = sequence.indexOf(currentKey);
    if (index < 0) {
      return `
        <nav class="project-nav content-section" aria-label="Project navigation">
          <a href="${href("works/")}">${tr("All Works", "전체 작품")}</a>
          <a href="${href("visual-index/")}">${tr("Visual Index →", "비주얼 인덱스 →")}</a>
        </nav>
      `;
    }
    const previous = sequence[(index - 1 + sequence.length) % sequence.length];
    const next = sequence[(index + 1) % sequence.length];
    return `
      <nav class="project-nav content-section" aria-label="Project navigation">
        <a href="${projectUrl(previous)}"><span>${tr("Previous", "이전")}</span>${site.projects[previous].shortTitle}</a>
        <a class="project-nav__all" href="${href("works/")}">${tr("All Works", "전체 작품")}</a>
        <a href="${projectUrl(next)}"><span>${tr("Next", "다음")}</span>${site.projects[next].shortTitle} →</a>
      </nav>
    `;
  }

  function renderArtist() {
    setSeo(
      "Artist — Minnie Park",
      "Minnie Park is a Korean-Australian interactive audio-visual artist working with roses, touch, colour, sound and moving image between Seoul and Melbourne."
    );
    app.innerHTML = `
      <section class="artist-hero" id="top">
        <div>
          <p class="eyebrow">${tr("Artist", "아티스트")}</p>
          <h1>Minnie<br />Park</h1>
          <p class="hero-main">${tr("A Korean-Australian interactive audio-visual artist working between Seoul and Melbourne.", "서울과 멜버른을 기반으로 활동하는 한국계 호주 인터랙티브 오디오비주얼 아티스트입니다.")}</p>
        </div>
        <figure>${imageMarkup("images/liveperformance.jpg", "Minnie Park during a live audio-visual performance", true)}</figure>
      </section>

      <section class="artist-bio content-section content-section--compact">
        <div>
          <p class="section-kicker">${tr("Short Bio", "짧은 소개")}</p>
          <h2>${tr("Interactive audio-visual installation / Research / Moving image", "인터랙티브 오디오비주얼 설치 / 리서치 / 무빙이미지")}</h2>
        </div>
        <div class="long-copy">
          <p>${tr("Minnie Park is a Korean-Australian interactive audio-visual artist working between Seoul and Melbourne. Her installations combine living roses, tactile interaction, sound, light and moving image to examine affect as embodied, relational and culturally situated. Through Meta Rose—begun in 2024 and including The Meta Kibun Project—she develops distinct participatory systems around emotional ambivalence, culturally shaped feeling, relational touch and memory.", "Minnie Park는 서울과 멜버른을 기반으로 활동하는 한국계 호주 인터랙티브 오디오비주얼 아티스트입니다. 생장미, 촉각적 인터랙션, 사운드, 빛과 무빙이미지를 결합한 설치를 통해 정서를 신체적이고 관계적이며 문화적으로 형성되는 경험으로 살펴봅니다. 2024년에 시작되어 The Meta Kibun Project를 포함하는 Meta Rose를 통해 감정의 양가성, 문화적으로 형성된 감정, 관계적 터치와 기억을 다루는 서로 다른 참여형 시스템을 구축합니다.")}</p>
          ${actions([
            { label: tr("Download CV 2026 ↓", "CV 2026 다운로드 ↓"), path: site.downloads.cv, download: true },
            { label: tr("View Works", "작품 보기"), path: "works/" }
          ])}
        </div>
      </section>

      <section class="artist-statement content-section content-section--compact">
        <div>
          <p class="section-kicker">${tr("Artist Statement", "작가 노트")}</p>
          <h2>${tr("Feeling takes form through bodies, materials and live systems.", "감정은 신체, 재료와 살아 움직이는 시스템을 통해 형태를 얻습니다.")}</h2>
        </div>
        <div class="long-copy long-copy--large">
          <p>${tr("Park develops responsive installations in which living roses, colour, sound, light and moving image organise encounters with feelings that resist a single name. Touch changes an audio-visual composition; bodies complete a circuit; audience choices become conditions of the work rather than inputs added after it is made.", "Park는 생장미, 색, 사운드, 빛과 무빙이미지가 하나의 이름으로 고정되지 않는 감정과의 만남을 구성하는 반응형 설치를 만듭니다. 터치는 오디오비주얼 구성을 바꾸고, 신체는 회로를 완성하며, 관객의 선택은 완성된 작품에 덧붙는 입력이 아니라 작업을 성립시키는 조건이 됩니다.")}</p>
          <p>${tr("Colour operates as emotional material rather than surface treatment: atmosphere, frequency and force experienced through the body. Pink recurs as a carrier of vitality, emotional energy and contradiction. Living roses bring scent, fragility, texture and biological time into contact with computational systems.", "색은 표면적 장식이 아니라 신체를 통해 경험되는 분위기, 주파수와 힘인 감정적 재료로 작동합니다. 핑크는 생명력, 정서적 에너지와 모순을 운반하는 색으로 반복됩니다. 생장미는 향, 연약함, 질감과 생물학적 시간을 컴퓨테이셔널 시스템과 접촉시킵니다.")}</p>
          <p>${tr("At the centre of her practice is Meta Rose, begun in 2024. Living roses, pink, touch and opposing states form a distinct grammar; each chapter begins with a different emotional question and rebuilds that grammar through a new installation, audio-visual logic and participatory relationship.", "작업의 중심에는 2024년에 시작된 Meta Rose가 있습니다. 생장미, 핑크, 터치와 대립하는 상태들은 고유한 조형 언어를 이룹니다. 각 장은 서로 다른 감정적 질문에서 출발해 새로운 설치, 오디오비주얼 논리와 참여 관계를 통해 이 언어를 다시 구축합니다.")}</p>
          <p>${tr("Her practice-based research treats feeling as embodied, relational and culturally situated. It asks how interactive art can make room for nuanced, mixed and difficult-to-articulate states without assigning universal meanings to colour or emotion.", "그녀의 창작 실천 기반 리서치는 감정을 신체적이고 관계적이며 문화적으로 형성되는 경험으로 다룹니다. 색이나 감정에 보편적 의미를 부여하지 않으면서, 인터랙티브 아트가 미묘하고 혼합되어 말로 규정하기 어려운 상태를 어떻게 담을 수 있는지 묻습니다.")}</p>
        </div>
      </section>

      <section class="artist-history content-section" aria-labelledby="artistHistoryTitle">
        <div class="section-heading artist-history__heading">
          <p class="section-kicker">${tr("Exhibitions / Performances / Public Programmes", "전시 / 퍼포먼스 / 공공 프로그램")}</p>
          <h2 id="artistHistoryTitle">${tr("Selected History", "주요 이력")}</h2>
          <p>${tr("A selected chronology of exhibitions, performances, workshops and public presentations. The full record is available in the 2026 Artist CV.", "전시, 퍼포먼스, 워크숍과 공개 프레젠테이션을 시간순으로 정리한 주요 이력입니다. 전체 기록은 2026 Artist CV에서 확인할 수 있습니다.")}</p>
        </div>
        <div class="artist-history__list">
          ${site.history.map((group) => `
            <section class="artist-history__year" aria-labelledby="history-${group.year}">
              <h3 id="history-${group.year}">${group.year}</h3>
              <div>
                ${group.entries.map((entry) => `
                  <article class="artist-history__entry">
                    <p class="artist-history__date">${tr(entry.date, entry.dateKo)}</p>
                    <div class="artist-history__title">
                      <h4>${entry.title}</h4>
                      <p>${tr(entry.type, entry.typeKo)}</p>
                    </div>
                    <p class="artist-history__context">${tr(entry.context, entry.contextKo)}</p>
                  </article>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>
      </section>

      ${renderFooter()}
    `;
  }

  function renderResearch() {
    setSeo(
      "Research — Minnie Park",
      "Practice-based research by Minnie Park on tactile interaction, colour, Korean emotional language and culturally situated affect."
    );
    app.innerHTML = `
      <section class="research-hero page-hero" id="top">
        <p class="eyebrow">${tr("Research / Practice-based", "리서치 / 실천 기반")}</p>
        <h1>${tr("Feeling is<br />situated.", "감정은<br />맥락 속에 있습니다.")}</h1>
        <p class="hero-main">${tr("How can an interactive artwork hold emotional complexity without reducing it to a fixed label?", "인터랙티브 작품은 감정의 복잡함을 하나의 고정된 이름으로 축소하지 않고 어떻게 담아낼 수 있을까요?")}</p>
      </section>

      <figure class="research-feature">${imageMarkup("images/the meta kibun project.png", "The Meta Kibun Project research exhibition", true)}</figure>

      <section class="research-body content-section content-section--compact">
        <div>
          <p class="section-kicker">The Meta Kibun Project</p>
          <h2>${tr("Touch, colour and language as conditions for emotional reflection.", "터치, 색과 언어를 감정적 성찰의 조건으로 구성합니다.")}</h2>
        </div>
        <div class="long-copy">
          <p>${tr("Park’s 2025 Honours research asks how interactivity centred on tactile elements and Korean emotive colour terms influences audiences’ affective experience in a digital exhibition. It treats feeling as embodied and situated—shaped by personal, social and cultural position—rather than as a universal signal waiting to be decoded.", "Park의 2025년 Honours 리서치는 촉각적 요소와 한국어의 정서적 색채어를 중심으로 한 인터랙션이 디지털 전시에서 관객의 정서적 경험에 어떤 영향을 미치는지 묻습니다. 감정을 해독을 기다리는 보편적 신호가 아니라 개인적·사회적·문화적 위치에 의해 형성되는 신체적이고 상황적인 경험으로 다룹니다.")}</p>
          <p>${tr("The Meta Kibun Project formed the creative practice component of the study. Drawing on kibun (기분)—a Korean term encompassing mood, feeling and atmosphere—participants composed a colour term using one of the project’s Korean emotive suffixes—or invented one in a language of their choice. They then encountered the same audio-visual material first as a non-interactive video and then through a tactile installation of living roses and water.", "The Meta Kibun Project는 이 연구의 창작 실천 작업입니다. 기분, 감정 상태와 분위기를 포괄하는 한국어 ‘기분’에서 출발해, 참여자는 프로젝트에서 제시한 한국어 정서적 접미어를 선택하거나 원하는 언어로 직접 접미어를 만들어 색과 결합했습니다. 이후 동일한 오디오비주얼 재료를 비인터랙티브 영상으로 먼저 보고, 생장미와 물을 사용하는 촉각적 설치로 다시 경험했습니다.")}</p>
          <p>${tr("Across the two-day exhibition, the study conducted fifteen semi-structured interviews and collected sixteen survey responses. Participants commonly described touch as deepening bodily and personal engagement. Colour choice and emotive language prompted reflection on feelings that were layered, changing and difficult to articulate; the interactive installation was generally described as more personally meaningful than the video presentation.", "이틀간의 전시에서 반구조화 인터뷰 15건을 진행하고 설문 응답 16건을 수집했습니다. 참여자들은 터치가 신체적이고 개인적인 몰입을 깊게 했다고 공통적으로 서술했습니다. 색의 선택과 정서적 언어는 층위가 있고 변화하며 말로 규정하기 어려운 감정을 성찰하게 했으며, 인터랙티브 설치는 대체로 영상 프레젠테이션보다 개인적으로 더 의미 있는 경험으로 서술되었습니다.")}</p>
          <p>${tr("The study deliberately avoids establishing universal associations between colour and emotion. Participant accounts are treated as situated evidence—meaningful within the conditions of the exhibition, yet resistant to generalisation. Rather than decoding emotion, the research examines how touch, colour and language can create conditions for reflection.", "이 연구는 색과 감정 사이의 보편적 연관성을 확립하지 않습니다. 참여자의 서사는 전시의 조건 안에서 의미를 갖지만 일반화될 수 없는 상황적 근거로 다뤄집니다. 감정을 해독하기보다 터치, 색과 언어가 성찰의 조건을 어떻게 만들 수 있는지 살펴봅니다.")}</p>
        </div>
      </section>

      <section class="research-record content-section">
        <div class="section-heading">
          <p class="section-kicker">${tr("Research Record", "리서치 기록")}</p>
          <h2>The Meta Kibun Project: Exploring Interactivity, Audience, and Affective Experience in Digital Interactive Art Exhibitions</h2>
          <p>RMIT University / Bachelor of Media and Communication (Honours) / 2025</p>
        </div>
        <div class="research-grid">
          <article><span>02</span><h3>${tr("Exhibition days", "전시 일수")}</h3><p>${tr("A comparative interactive and non-interactive presentation.", "인터랙티브 설치와 비인터랙티브 영상을 비교한 전시입니다.")}</p></article>
          <article><span>15</span><h3>${tr("Interviews", "인터뷰")}</h3><p>${tr("Semi-structured, one-to-one accounts of situated experience.", "상황적 경험을 다룬 반구조화 일대일 인터뷰입니다.")}</p></article>
          <article><span>16</span><h3>${tr("Survey responses", "설문 응답")}</h3><p>${tr("Open-ended and rating-scale responses on touch, colour, participation and affect.", "터치, 색, 참여와 정서적 경험을 다룬 개방형·평정형 응답입니다.")}</p></article>
        </div>
        ${actions([
          { label: tr("Read The Meta Kibun Project", "The Meta Kibun Project 보기"), path: "works/meta-kibun/" },
          { label: tr("Read the Honours Exegesis ↓", "Honours 논문 읽기 ↓"), path: site.downloads.exegesis, download: true }
        ])}
      </section>
      ${renderFooter()}
    `;
  }

  function renderVisualIndex() {
    const visualIndexItems = site.visualIndex
      .map((item, sourceIndex) => {
        const years = String(item.year).match(/\d{4}/g)?.map(Number) || [];
        return {
          item,
          sourceIndex,
          sortYear: /ongoing/i.test(String(item.year))
            ? new Date().getFullYear()
            : years.length ? Math.max(...years) : Number.NEGATIVE_INFINITY
        };
      })
      .sort((a, b) => (b.sortYear - a.sortYear) || (a.sourceIndex - b.sourceIndex))
      .map(({ item }) => item);

    setSeo(
      "Visual Index — Minnie Park",
      "A visual field of Minnie Park’s installations, real-time visual states, material studies and moments of audience participation."
    );
    app.innerHTML = `
      <section class="visual-index-hero" id="top">
        <div>
          <p class="eyebrow">${tr("Visual Index / Ongoing record", "비주얼 인덱스 / 확장되는 기록")}</p>
          <h1>${tr("Visual<br />Index", "비주얼<br />인덱스")}</h1>
        </div>
        <p>${tr("A growing field of installations, real-time visual states, moving-image stills, material studies and moments of participation. Select any image or clip for its project, year and context.", "설치, 실시간 비주얼 상태, 무빙이미지 스틸, 재료 연구와 관객 참여의 순간이 쌓이는 비주얼의 장입니다. 이미지나 영상을 선택하면 프로젝트, 연도와 맥락을 확인할 수 있습니다.")}</p>
      </section>

      <section class="visual-index" aria-label="Visual index">
        ${visualIndexItems.map((item, index) => `
          <button class="visual-index__item" type="button"
            data-index="${index}"
            data-title="${item.title}"
            data-year="${item.year}"
            data-context="${item.context}"
            data-project="${item.project || ""}"
            aria-label="${item.title}, ${item.year}, ${tr(item.context, item.contextKo || contextKo[item.context] || item.context)}">
            ${indexedMediaMarkup(item)}
          </button>
        `).join("")}
      </section>

      <dialog class="index-viewer" id="indexViewer" aria-labelledby="indexViewerTitle">
        <button class="index-viewer__close" type="button" data-viewer-close aria-label="${tr("Close media", "미디어 닫기")}">
          <span aria-hidden="true">×</span>
        </button>
        <div class="index-viewer__stage">
          <button class="index-viewer__nav index-viewer__nav--prev" type="button" data-viewer-step="-1" aria-label="${tr("Previous item", "이전 항목")}">
            <span aria-hidden="true">←</span>
          </button>
          <figure>
            <img src="" alt="" />
            <video controls playsinline preload="metadata" hidden></video>
          </figure>
          <button class="index-viewer__nav index-viewer__nav--next" type="button" data-viewer-step="1" aria-label="${tr("Next item", "다음 항목")}">
            <span aria-hidden="true">→</span>
          </button>
          <div class="index-viewer__copy">
            <div class="index-viewer__heading">
              <p class="section-kicker">${tr("Project / Year / Context", "프로젝트 / 연도 / 맥락")}</p>
              <h2 id="indexViewerTitle"></h2>
            </div>
            <dl>
              <div><dt>${tr("Year", "연도")}</dt><dd data-viewer-year></dd></div>
              <div><dt>${tr("Context", "맥락")}</dt><dd data-viewer-context></dd></div>
            </dl>
            <a data-viewer-project href="">${tr("View Project →", "프로젝트 보기 →")}</a>
          </div>
        </div>
      </dialog>
      ${renderFooter()}
    `;
    initVisualIndex(visualIndexItems);
  }

  function initVisualIndex(visualIndexItems) {
    const viewer = document.querySelector(".index-viewer");
    if (!viewer) return;
    const viewerImage = viewer.querySelector("img");
    const viewerVideo = viewer.querySelector("video");
    const viewerTitle = viewer.querySelector("h2");
    const viewerYear = viewer.querySelector("[data-viewer-year]");
    const viewerContext = viewer.querySelector("[data-viewer-context]");
    const viewerProject = viewer.querySelector("[data-viewer-project]");
    const closeButton = viewer.querySelector("[data-viewer-close]");
    const stepButtons = Array.from(viewer.querySelectorAll("[data-viewer-step]"));
    const indexButtons = Array.from(document.querySelectorAll(".visual-index__item"));
    let selectedButton = null;
    let currentIndex = -1;

    function setViewerOrientation(width, height) {
      const ratio = width / Math.max(1, height);
      viewer.dataset.orientation = ratio > 1.12 ? "landscape" : ratio < 0.88 ? "portrait" : "square";
    }

    viewerImage.addEventListener("load", () => setViewerOrientation(viewerImage.naturalWidth, viewerImage.naturalHeight));
    viewerVideo.addEventListener("loadedmetadata", () => setViewerOrientation(viewerVideo.videoWidth, viewerVideo.videoHeight));

    const indexVideos = Array.from(document.querySelectorAll(".visual-index__item video"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let videoObserver = null;
    if (!reduceMotion && "IntersectionObserver" in window) {
      videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.play().catch(() => {});
          else entry.target.pause();
        });
      }, { threshold: 0.35 });
      indexVideos.forEach((video) => videoObserver.observe(video));
    }

    function pauseIndexVideos() {
      indexVideos.forEach((video) => video.pause());
    }

    function resumeVisibleIndexVideos() {
      if (reduceMotion || !videoObserver) return;
      indexVideos.forEach((video) => {
        const rect = video.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) video.play().catch(() => {});
      });
    }

    function resetSelection(restoreFocus = false) {
      selectedButton?.setAttribute("aria-expanded", "false");
      if (restoreFocus) selectedButton?.focus();
      selectedButton = null;
    }

    function showItem(index, openViewer = true) {
      const normalizedIndex = (index % visualIndexItems.length + visualIndexItems.length) % visualIndexItems.length;
      const button = indexButtons[normalizedIndex];
      const item = visualIndexItems[normalizedIndex];
      const project = item.project ? site.projects[item.project] : null;

      selectedButton?.setAttribute("aria-expanded", "false");
      selectedButton = button;
      currentIndex = normalizedIndex;
      button?.setAttribute("aria-expanded", "true");
      if (isVideo(item.src)) {
        viewerImage.hidden = true;
        viewerImage.removeAttribute("src");
        viewerImage.alt = "";
        viewerVideo.hidden = false;
        viewerVideo.src = media(item.src);
        if (item.poster) viewerVideo.poster = media(item.poster);
        else viewerVideo.removeAttribute("poster");
        viewerVideo.setAttribute("aria-label", `${item.title}, ${item.context}`);
        viewerVideo.load();
      } else {
        viewerVideo.pause();
        viewerVideo.hidden = true;
        viewerVideo.removeAttribute("src");
        viewerVideo.removeAttribute("poster");
        viewerVideo.removeAttribute("aria-label");
        viewerImage.hidden = false;
        viewerImage.src = media(item.src);
        viewerImage.alt = `${item.title}, ${item.context}`;
      }
      viewerTitle.textContent = item.title;
      viewerYear.textContent = item.year;
      viewerContext.textContent = tr(item.context, item.contextKo || contextKo[item.context] || item.context);

      if (project) {
        viewerProject.hidden = false;
        viewerProject.href = projectUrl(item.project);
        viewerProject.textContent = tr(`View ${project.shortTitle || project.title} →`, `${project.shortTitle || project.title} 보기 →`);
      } else {
        viewerProject.hidden = true;
        viewerProject.removeAttribute("href");
        viewerProject.textContent = "";
      }

      if (openViewer && !viewer.open) {
        pauseIndexVideos();
        viewer.showModal();
      }
    }

    indexButtons.forEach((button) => {
      button.setAttribute("aria-controls", "indexViewer");
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => {
        showItem(Number(button.dataset.index));
      });
    });

    closeButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      viewer.close();
    });

    stepButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showItem(currentIndex + Number(button.dataset.viewerStep), false);
      });
    });

    viewer.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-viewer-step], [data-viewer-close], video")) return;
      viewer.close();
    });
    viewer.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      showItem(currentIndex + (event.key === "ArrowLeft" ? -1 : 1), false);
    });
    viewer.addEventListener("close", () => {
      viewerVideo.pause();
      resetSelection(true);
      currentIndex = -1;
      resumeVisibleIndexVideos();
    });
  }

  function renderContact() {
    setSeo(
      "Contact — Minnie Park",
      "Contact Minnie Park for exhibitions, curatorial conversations, research, talks and artistic collaborations."
    );
    app.innerHTML = `
      <section class="contact-hero" id="top">
        <p class="eyebrow">${tr("Contact", "연락")}</p>
        <h1>${tr("Begin a<br />conversation.", "대화를<br />시작해 주세요.")}</h1>
        <p class="hero-main">${tr("For exhibitions, curatorial conversations, institutional partnerships, research, talks and artistic collaborations.", "전시, 큐레토리얼 대화, 기관 파트너십, 리서치, 토크와 예술 협업에 관한 문의를 받습니다.")}</p>
      </section>

      <section class="contact-details content-section content-section--compact">
        <div>
          <p class="section-kicker">${tr("Artist Enquiries", "아티스트 문의")}</p>
          <h2>${tr("Seoul / Melbourne<br />Working internationally", "서울 / 멜버른<br />국제적으로 활동합니다")}</h2>
        </div>
        <div class="contact-links">
          <a href="${site.external.email}">minniepark.studio@gmail.com</a>
          <a href="${site.external.instagram}" target="_blank" rel="noreferrer">@minniepark.studio ↗</a>
        </div>
      </section>

      <section class="contact-routes content-section">
        <article>
          <p class="section-kicker">${tr("Artist CV", "아티스트 CV")}</p>
          <h2>${tr("Exhibitions, education, research, public programmes and selected collaborations.", "전시, 교육, 리서치, 공공 프로그램과 주요 협업 기록입니다.")}</h2>
          <p class="cv-status">${tr("Current PDF: 2026 edition.", "현재 PDF는 2026년판입니다.")}</p>
          ${actions([{ label: tr("Download CV 2026 ↓", "CV 2026 다운로드 ↓"), path: site.downloads.cv, download: true }])}
        </article>
        <article>
          <p class="section-kicker">${tr("Commercial / Commissioned Work", "상업 / 커미션 작업")}</p>
          <h2>${tr("For commissioned installations, brand activations, event visuals and production-led projects.", "커미션 설치, 브랜드 액티베이션, 이벤트 비주얼과 프로덕션 중심 프로젝트를 위한 별도 사이트입니다.")}</h2>
          ${actions([{ label: tr("Commissions ↗", "커미션 ↗"), path: site.external.commercial, external: true }])}
        </article>
      </section>
      ${renderFooter()}
    `;
  }

  function renderCv() {
    setSeo("Artist CV — Minnie Park", "Download the artist CV of interactive audio-visual artist Minnie Park.");
    app.innerHTML = `
      <section class="cv-hero page-hero" id="top">
        <p class="eyebrow">${tr("Artist CV / 2026 edition", "아티스트 CV / 2026년판")}</p>
        <h1>Curriculum<br />Vitae</h1>
        <p class="hero-main">${tr("A record of exhibitions, education, research, public programmes and selected collaborations.", "전시, 교육, 리서치, 공공 프로그램과 주요 협업 기록입니다.")}</p>
        <p class="cv-status">${tr("The 2026 Artist CV is available to download.", "2026년 아티스트 CV를 다운로드할 수 있습니다.")}</p>
        ${actions([{ label: tr("Download CV 2026 ↓", "CV 2026 다운로드 ↓"), path: site.downloads.cv, download: true }])}
      </section>
      <section class="cv-summary content-section content-section--compact">
        <div><p class="section-kicker">${tr("Short Bio", "짧은 소개")}</p><h2>Minnie Park / ${tr("Interactive Audio-Visual Artist", "인터랙티브 오디오비주얼 아티스트")}</h2></div>
        <div class="long-copy">
          <p>${tr("Minnie Park is a Korean-Australian interactive audio-visual artist working between Seoul and Melbourne. Through tactile installations combining living roses, touch, colour, sound and moving image, she explores how feeling is shaped by bodies, culture and relation.", "Minnie Park는 서울과 멜버른을 기반으로 활동하는 한국계 호주 인터랙티브 오디오비주얼 아티스트입니다. 생장미, 터치, 색, 사운드와 무빙이미지를 결합한 촉각적 설치를 통해 감정이 신체, 문화와 관계 속에서 어떻게 형성되는지 탐구합니다.")}</p>
          <p>${tr("For a project-specific introduction, exhibition history or high-resolution portfolio package, contact", "프로젝트별 소개, 전시 이력 또는 고해상도 포트폴리오 패키지는")} <a class="inline-link" href="${site.external.email}">minniepark.studio@gmail.com</a>${tr(".", "으로 문의해 주세요.")}</p>
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  renderChrome();

  if (page === "home") renderHome();
  else if (page === "works") renderWorks();
  else if (page === "project") renderProject();
  else if (page === "artist" || page === "practice") renderArtist();
  else if (page === "research") renderResearch();
  else if (page === "visual-index") renderVisualIndex();
  else if (page === "contact") renderContact();
  else if (page === "cv") renderCv();

  const interactionScript = document.createElement("script");
  interactionScript.src = href("site-interaction.js?v=20260905-rose-cursor-23");
  interactionScript.async = true;
  document.body.appendChild(interactionScript);
})();
