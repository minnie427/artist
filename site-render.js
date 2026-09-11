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
  // A crawlable language URL takes precedence over a device preference.
  if (["en", "ko"].includes(document.body.dataset.locale)) language = document.body.dataset.locale;
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
    "Workshop documentation": "워크숍 기록",
    "Moving-image documentation": "무빙이미지 기록",
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
    if (document.body.dataset.locale) {
      const route = document.body.dataset.route || "";
      window.location.assign(`${root}${nextLanguage === "ko" ? "ko/" : ""}${route}${window.location.protocol === "file:" ? "index.html" : ""}`);
    } else window.location.reload();
  }

  const isFilePreview = window.location.protocol === "file:";
  const href = (path = "") => {
    if (document.body.dataset.locale === "ko" && (path === "" || path.endsWith("/"))) path = `ko/${path}`;
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
  const projectUrl = (key) => {
    const project = site.projects[key];
    return project.parent
      ? `${href(site.projects[project.parent].route)}#${key}`
      : href(project.route);
  };
  const activeSection = page === "project" || page === "works" ? "works" : page === "practice" ? "artist" : page;

  function setSeo(title, description) {
    if (document.body.dataset.seoStatic === "true") return;
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
    const existingHeader = document.querySelector("header.global-header");
    const header = existingHeader || document.createElement("header");
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
    if (!existingHeader) document.body.insertBefore(header, app);

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
    const dimensions = item.width > 0 && item.height > 0 ? ` width="${item.width}" height="${item.height}"` : "";
    if (!isVideo(item.src)) return `<img src="${media(item.src)}"${dimensions} alt="${item.title}, ${item.context}" loading="lazy" decoding="async" />`;
    const poster = item.poster ? ` poster="${media(item.poster)}"` : "";
    return `<video src="${media(item.src)}"${dimensions}${poster} muted loop playsinline preload="metadata" aria-label="${item.title}, ${item.context}"></video>`;
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
      "Interactive installations, performances, moving-image works and selected commissions by Minnie Park, including the evolving Meta Rose body of work."
    );
    app.innerHTML = `
      <section class="page-hero page-hero--works" id="top">
        <p class="eyebrow">${tr("Works / 2023—ongoing", "작품 / 2023—현재")}</p>
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
              ${site.worksOpeningImages.map((item) => {
                const linked = Boolean(site.projects[item.project]);
                const tag = linked ? "a" : "div";
                return `
                <${tag} class="works-opening__item"${linked ? ` href="${projectUrl(item.project)}"` : ""}>
                  <figure>
                    ${galleryMediaMarkup(item)}
                    ${item.title ? `<figcaption>${item.title}${item.year ? ` / ${item.year}` : ""}</figcaption>` : ""}
                  </figure>
                </${tag}>
              `;
              }).join("")}
            </div>
          </div>
          <button class="works-opening__nav works-opening__nav--next" type="button" data-works-opening-step="1" aria-label="${tr("Next image", "다음 이미지")}">→</button>
        </div>
      </section>

      <section class="works-introduction content-section content-section--compact">
        <figure class="works-introduction__media works-introduction__media--rose">
          ${imageMarkup("assets/rose-halftone.png", "Halftone rose representing the ongoing Meta Rose body of work")}
        </figure>
        <div class="works-introduction__identity">
          <p class="section-kicker">${tr("Meta Rose / Ongoing body of work", "Meta Rose / 연작")}</p>
          <h2>${tr("Living roses, touch and emotional ambivalence.", "생장미, 터치와 감정의 양가성.")}</h2>
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
          ${site.primaryWorksOrder.map((key, index) => workCard(key, index, true)).join("")}
        </div>
      </section>

      <section class="content-section selected-context">
        <div class="section-heading">
          <p class="section-kicker">${tr("Exhibitions / Public Programmes", "전시 / 공공 프로그램")}</p>
          <h2>${tr(
            "Installations and artist-led programmes developed through distinct sites, collaborations and forms of participation.",
            "서로 다른 장소, 협업과 참여 방식 속에서 전개된 설치와 아티스트 주도형 프로그램입니다."
          )}</h2>
        </div>
        <div class="work-card-grid work-card-grid--selected">
          ${site.exhibitionWorksOrder.map((key, index) => workCard(key, index)).join("")}
        </div>
      </section>

      <section class="content-section selected-context">
        <div class="section-heading">
          <p class="section-kicker">${tr("Live Performance", "라이브 퍼포먼스")}</p>
          <h2>${tr(
            "Live audio-visual performances from 2023–2024.",
            "2023–2024년에 발표한 라이브 오디오비주얼 퍼포먼스입니다."
          )}</h2>
        </div>
        <div class="work-card-grid work-card-grid--selected">
          ${site.liveWorksOrder.map((key, index) => workCard(key, index)).join("")}
        </div>
      </section>

      <section class="content-section selected-context">
        <div class="section-heading">
          <p class="section-kicker">${tr("Selected Commissions", "주요 커미션")}</p>
          <h2>${tr(
            "Selected commissioned visual systems developed for cultural and event contexts.",
            "문화 및 이벤트 맥락을 위해 개발한 주요 커미션 비주얼 시스템입니다."
          )}</h2>
        </div>
        <div class="work-card-grid work-card-grid--selected">
          ${site.selectedWorksOrder.map((key, index) => workCard(key, index)).join("")}
        </div>
      </section>

      <section class="index-invitation content-section">
        <p class="section-kicker">${tr("Visual Index", "비주얼 인덱스")}</p>
        <a href="${href("visual-index/")}">${tr("Explore the Visual Index →", "비주얼 인덱스 보기 →")}</a>
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

  function renderProjectEntries(project) {
    if (!project.entries?.length) return "";
    return `
      <section class="content-section content-section--compact">
        <p class="section-kicker">${projectField(project, "entriesLabel")}</p>
        <div class="page-actions">
          ${project.entries.map((key) => `<a href="#${key}">${site.projects[key].title} / ${site.projects[key].year}</a>`).join("")}
        </div>
      </section>
      ${project.entries.map((key) => {
        const entry = site.projects[key];
        const gallery = [{ src: entry.image, alt: entry.imageAlt }, ...(entry.gallery || [])]
          .filter((item, index, items) => items.findIndex((other) => other.src === item.src) === index);
        return `
          <section class="project-entry" id="${key}" aria-labelledby="${key}-title">
            <div class="project-introduction content-section content-section--compact">
              <div>
                <p class="section-kicker">${entry.year} / ${projectField(entry, "category")}</p>
                <h2 id="${key}-title">${entry.title}</h2>
                <div class="project-meta">${projectField(entry, "metadata").map((line) => `<p>${line}</p>`).join("")}</div>
              </div>
              <div class="long-copy">
                ${projectField(entry, "paragraphs").map((paragraph) => `<p>${paragraph}</p>`).join("")}
              </div>
            </div>
            <div class="project-gallery content-section">
              ${gallery.map((item) => `<figure>${galleryMediaMarkup(item)}</figure>`).join("")}
            </div>
          </section>
        `;
      }).join("")}
    `;
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
              <p class="section-kicker">${tr("Four parts", "네 구성")}</p>
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

        ${project.community ? `
          <section class="project-introduction content-section content-section--compact" id="touchcollective" aria-labelledby="touchcollective-title">
            <div>
              <p class="section-kicker">${projectField(project.community, "role")}</p>
              <h2 id="touchcollective-title">${project.community.title}</h2>
            </div>
            <div class="long-copy">
              ${projectField(project.community, "paragraphs").map((paragraph) => `<p>${paragraph}</p>`).join("")}
            </div>
          </section>
        ` : ""}

        ${renderProjectEntries(project)}

        ${gallery.length ? `
          <section class="project-gallery content-section" aria-label="${project.title} media gallery">
            ${gallery.map((item) => `<figure>${galleryMediaMarkup(item)}</figure>`).join("")}
          </section>
        ` : project.entries?.length ? "" : `
          <section class="documentation-note content-section">
            <p class="section-kicker">${tr("Documentation", "기록")}</p>
            <p>${tr("Project photography and moving-image documentation will be added here.", "프로젝트 사진과 무빙이미지 기록을 이곳에 추가할 예정입니다.")}</p>
          </section>
        `}

        ${renderProjectNav(projectKey, isPrimary)}
      </article>
      ${renderFooter()}
    `;
    const targetId = window.location.hash.slice(1);
    if (project.entries?.includes(targetId) || (project.community && targetId === "touchcollective")) {
      requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView());
    }
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
        <figure>${imageMarkup(site.artistImage?.src || "images/liveperformance.jpg", site.artistImage?.alt || "Minnie Park during a live audio-visual performance", true)}</figure>
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
          <h2>${tr("Living materials and participatory systems.", "살아 있는 재료와 참여형 시스템.")}</h2>
        </div>
        <div class="long-copy long-copy--large">
          <p>${tr("Park works with living roses as tactile interfaces. A participant’s touch changes sound and moving image, while shared contact can complete a circuit between bodies. Participation is part of the work’s composition: its form depends on who engages with it, for how long and alongside whom.", "Park는 생장미를 촉각적 인터페이스로 사용합니다. 참여자의 터치는 사운드와 무빙이미지를 변화시키며, 함께하는 접촉은 신체 사이의 회로를 완성하기도 합니다. 참여는 작품 구성의 일부입니다. 누가, 얼마나 오래, 누구와 함께 관여하는지에 따라 작품의 형태가 달라집니다.")}</p>
          <p>${tr("Pink carries emotional intensity within her practice. Paired with grey, black, distortion and contrasting sonic textures, it allows attraction and discomfort to remain present together. The rose brings this ambivalence into material form through petals and thorns, fragility and resistance.", "그녀의 작업에서 핑크는 감정적 강도를 지닌 색입니다. 회색, 검정, 왜곡과 상반된 사운드 질감과 짝을 이루며 매혹과 불편함을 동시에 드러냅니다. 장미의 꽃잎과 가시, 연약함과 저항은 이러한 양가성을 물질의 형태로 보여줍니다.")}</p>
          <p>${tr("The installations also unfold through the changing condition of their materials. Roses are handled, begin to dry and remain after an exhibition has ended. Park retains and photographs these flowers, extending her inquiry from the live encounter to the traces that remain.", "설치는 재료의 상태가 달라지는 시간 속에서도 전개됩니다. 장미는 관객의 손을 거치고 마르기 시작하며, 전시가 끝난 뒤에도 남습니다. Park는 이 꽃들을 보관하고 촬영하며 현장의 경험에서 그 이후에 남는 흔적으로 탐구를 이어갑니다.")}</p>
          <a class="inline-link" href="${href("research/")}">${tr("Research →", "리서치 →")}</a>
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
                ${group.entries.map((entry) => {
                  const hasProject = Boolean(site.projects[entry.project]);
                  const tag = hasProject ? "a" : "article";
                  return `
                  <${tag} class="artist-history__entry"${hasProject ? ` href="${projectUrl(entry.project)}" aria-label="${entry.title} — ${tr("View project", "프로젝트 보기")}"` : ""}>
                    <p class="artist-history__date">${tr(entry.date, entry.dateKo)}</p>
                    <div class="artist-history__title">
                      <h4>${entry.title}</h4>
                      <p>${tr(entry.type, entry.typeKo)}</p>
                    </div>
                    <p class="artist-history__context">${tr(entry.context, entry.contextKo)}</p>
                  </${tag}>
                `;
                }).join("")}
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
      "Minnie Park’s ongoing research through Meta Rose: emotional ambivalence, tactile participation, the time of living materials, and the relationship between experience and its records."
    );
    app.innerHTML = `
      <section class="research-hero page-hero" id="top">
        <p class="eyebrow">${tr("Research / Practice-based", "리서치 / 실천 기반")}</p>
        <h1>${tr("Affect, touch<br />and time.", "정서, 접촉,<br />그리고 시간.")}</h1>
        <p class="hero-main">${tr("An ongoing inquiry through Meta Rose into conflicting feelings, material change and the conditions of participation.", "Meta Rose를 통해 상충하는 감정, 재료의 변화와 참여의 조건을 탐구하는 지속적인 연구입니다.")}</p>
      </section>

      <figure class="research-feature">
        ${imageMarkup("media/mugonggan/img-5898-4ee3afc5.webp", tr("Pink roses with thorn-bearing stems and electrical contacts arranged on glass blocks", "유리 블록 위에 놓인 핑크 장미, 가시가 있는 줄기와 전기 접점"), true)}
        <figcaption>${tr("Roses, thorns and electrical contacts. Meta Rose: Mugonggan, 2025.", "장미, 가시와 전기 접점. Meta Rose: Mugonggan, 2025.")}</figcaption>
      </figure>

      <section class="research-body content-section content-section--compact">
        <div>
          <p class="section-kicker">${tr("Meta Rose / Ongoing inquiry", "Meta Rose / 지속적인 탐구")}</p>
          <h2>${tr("Contradiction as a condition of feeling.", "감정의 조건으로서의 모순.")}</h2>
        </div>
        <div class="long-copy">
          <p>${tr("Minnie Park’s research develops through making, exhibiting and revisiting the works of Meta Rose. Each installation tests a different relationship between living materials, an audio-visual system and the people who activate it. The recurring question is how an artwork can make conflicting feelings available to sensory experience without requiring them to resolve into a single emotion.", "Minnie Park의 연구는 Meta Rose의 작품을 제작하고 전시하며 다시 살펴보는 과정에서 전개됩니다. 각 설치는 살아 있는 재료, 오디오비주얼 시스템과 이를 활성화하는 사람들 사이의 관계를 서로 다른 방식으로 탐구합니다. 상충하는 감정을 하나로 정리하지 않으면서 어떻게 감각적으로 경험하게 할 수 있는지가 작업을 관통하는 질문입니다.")}</p>
          <p>${tr("The rose gives this inquiry a material form. Petals and thorns hold attraction and the possibility of pain in the same object; a flower can retain its colour as it begins to wilt. Park approaches ambivalence through this simultaneity. Pink, grey and black are paired with contrasting sonic textures to work with vitality, friction and loss—not as universal codes for how a viewer should feel.", "장미는 이 질문에 물질적 형태를 부여합니다. 꽃잎과 가시는 하나의 대상 안에 매혹과 고통의 가능성을 함께 지니며, 꽃은 시들기 시작하면서도 색을 유지합니다. Park는 이러한 동시성을 통해 양가성을 다룹니다. 핑크, 회색과 검정은 상반된 사운드 질감과 짝을 이루며 생명력과 마찰, 상실을 다룹니다. 이는 관객이 느껴야 할 감정을 지시하는 보편적 코드는 아닙니다.")}</p>
          <a class="inline-link" href="${projectUrl("meta-rose")}">${tr("The Meta Rose body of work →", "Meta Rose 연작 →")}</a>
        </div>
      </section>

      <section class="research-study content-section" aria-labelledby="research-touch">
        <figure>
          ${imageMarkup("media/meta-kibun/img-8620-11ca27fe.webp", tr("A participant’s hand touching a suspended rose among cables and projected pink light", "케이블과 핑크색 투사광 사이에 매달린 장미를 만지는 참여자의 손"))}
          <figcaption>${tr("Touching a rose within The Meta Kibun Project, 2025.", "The Meta Kibun Project에서 장미를 만지는 장면, 2025.")}</figcaption>
        </figure>
        <div class="long-copy">
          <p class="section-kicker">${tr("Touch / Participation", "접촉 / 참여")}</p>
          <h2 id="research-touch">${tr("The encounter is part of the work.", "만남은 작품의 일부가 됩니다.")}</h2>
          <p>${tr("Touch connects a participant’s body to changes in sound, colour and moving image. The choice of a rose, the duration of contact and the presence of other people affect how a composition unfolds. The exhibition is therefore a research setting in which audience, material, space and artist all contribute to what can be experienced.", "터치는 참여자의 신체를 사운드, 색과 무빙이미지의 변화에 연결합니다. 어떤 장미를 선택하는지, 접촉을 얼마나 지속하는지, 다른 사람이 함께 있는지가 구성의 전개에 영향을 줍니다. 전시는 관객, 재료, 공간과 작가가 경험의 형성에 함께 관여하는 연구의 현장이 됩니다.")}</p>
          <p>${tr("The Meta Kibun Project examined personal reflection through touch, colour and Korean emotive language. Shared Resonance extends this inquiry into interdependence: two or more participants must connect to activate the work. These different arrangements ask how agency and emotional attention change between an individual encounter and a shared one.", "The Meta Kibun Project는 터치, 색과 한국어의 정서적 언어를 통해 개인의 성찰을 살펴봤습니다. Shared Resonance는 두 명 이상의 참여자가 연결되어야 작품이 활성화되도록 구성하며 이 질문을 상호의존의 관계로 확장합니다. 서로 다른 참여 구조를 통해 개인적 경험과 공동의 경험 사이에서 행위의 주도권과 감정에 대한 주의가 어떻게 달라지는지 묻습니다.")}</p>
          <p>${tr("Beauty → Wonder → Affect describes an intention for the encounter: visual attraction invites attention, a responsive material invites investigation, and participation can open a space for emotional reflection. This sequence guides the design while leaving each participant’s response open.", "Beauty → Wonder → Affect는 작품 경험을 구성하는 방향입니다. 시각적 매력이 주의를 이끌고, 반응하는 재료가 탐색을 유도하며, 참여가 감정을 성찰할 계기를 마련하도록 합니다. 이 흐름은 작품의 구성을 이끌되, 각 참여자의 반응은 열어 둡니다.")}</p>
          <a class="inline-link" href="${projectUrl("shared-resonance")}">${tr("Shared Resonance →", "Shared Resonance →")}</a>
        </div>
      </section>

      <section class="research-study research-study--time content-section" aria-labelledby="research-time">
        <div class="long-copy">
          <p class="section-kicker">${tr("Time / Material memory", "시간 / 재료의 기억")}</p>
          <h2 id="research-time">${tr("The rose continues to change after the encounter.", "만남이 끝난 뒤에도 장미는 변합니다.")}</h2>
          <p>${tr("Living roses introduce a duration that differs from the repeatable time of a digital system. Over an exhibition, many people touch the flowers while petals lose moisture, leaves curl and stems dry. Contact and natural change take place together. In Park’s practice, the flower’s remaining vitality and its deterioration make life and death perceptible as overlapping conditions rather than a simple before and after.", "생장미는 반복 가능한 디지털 시스템의 시간과 다른 지속을 작품에 들여옵니다. 전시가 이어지는 동안 여러 사람이 꽃을 만지고, 꽃잎은 수분을 잃으며 잎은 말리고 줄기는 마릅니다. 접촉과 자연적인 변화가 함께 일어납니다. Park의 작업에서 꽃에 남아 있는 생명력과 쇠퇴는 삶과 죽음을 단순한 이전과 이후가 아닌 중첩된 상태로 드러냅니다.")}</p>
          <p>${tr("After each exhibition, Park keeps and dries the roses, photographing their changing condition. The photograph cannot restore the living flower or repeat the encounter. It retains a visible record of a material state that can no longer be returned to, bringing the flower’s absence into relation with its continuing image.", "Park는 전시가 끝날 때마다 장미를 보관해 말리고, 변화한 상태를 사진으로 기록합니다. 사진은 살아 있던 꽃을 되돌리거나 그 만남을 재현할 수 없습니다. 대신 다시 돌아갈 수 없는 재료의 상태를 시각적 기록으로 남기며, 꽃의 부재와 지속되는 이미지 사이의 관계를 드러냅니다.")}</p>
          <p>${tr("Read across successive exhibitions and years, these photographs offer another way to study Meta Rose: through the materials that remain after participation has ended. This developing photographic inquiry asks what an image can retain of touch, duration and loss, and what remains outside its frame.", "여러 전시와 해에 걸쳐 이 사진들을 함께 보는 것은 참여가 끝난 뒤 남은 재료를 통해 Meta Rose를 살펴보는 또 하나의 방식입니다. 이 사진 연구는 이미지가 접촉, 지속과 상실의 무엇을 간직할 수 있으며, 무엇이 프레임 밖에 남는지 묻습니다.")}</p>
        </div>
        <figure>
          ${imageMarkup("media/funeral/img-8592-544825ad.webp", tr("Wilted pale roses and curled leaves attached to the skeleton model in Meta Rose: The Funeral", "Meta Rose: The Funeral의 해골 모형에 연결된 시든 연한 장미와 말린 잎"))}
          <figcaption>${tr("Wilting roses within Meta Rose: The Funeral, 2026. Installation detail.", "Meta Rose: The Funeral 안에서 시들어가는 장미, 2026. 설치 세부.")}</figcaption>
        </figure>
      </section>

      <section class="research-body content-section content-section--compact" id="research-data">
        <div>
          <p class="section-kicker">${tr("Data / Open questions", "데이터 / 이어지는 질문")}</p>
          <h2>${tr("What can a record of interaction tell us about feeling?", "인터랙션의 기록은 감정에 대해 무엇을 말할 수 있을까요?")}</h2>
        </div>
        <div class="long-copy">
          <p>${tr("The Funeral brings emotional naming, intervention, witness and record into a four-part installation. It extends the inquiry towards the relationship between a participant’s account of feeling and the digital traces of participation. A touch event or a duration records an action; interpreting its emotional significance requires the participant’s account and the circumstances of the encounter.", "The Funeral은 명명, 개입, 목격과 기록을 네 부분으로 구성된 설치에 담습니다. 참여자가 자신의 감정을 설명하는 언어와 참여 과정의 디지털 흔적 사이의 관계로 탐구를 확장합니다. 터치나 지속시간의 데이터는 행위를 기록하지만, 그 정서적 의미를 해석하려면 참여자의 서술과 만남의 맥락을 함께 살펴야 합니다.")}</p>
          <p>${tr("A longer-term question is whether relationships between touch, duration, colour and self-described feeling can be expressed mathematically without erasing the context that gives them meaning. Park approaches this as an artistic research question still in development, alongside the material and photographic records of the roses.", "장기적으로는 터치, 지속시간, 색과 스스로 서술한 감정 사이의 관계를, 그 의미를 형성하는 맥락을 지우지 않으면서 수학적으로 표현할 수 있는지 묻습니다. Park는 이를 장미의 물질적·사진적 기록과 함께 발전시켜 나갈 예술 연구의 질문으로 다룹니다.")}</p>
          <a class="inline-link" href="${projectUrl("funeral")}">${tr("Meta Rose: The Funeral →", "Meta Rose: The Funeral →")}</a>
        </div>
      </section>

      <section class="research-record content-section content-section--compact" aria-labelledby="research-evidence">
        <div>
          <p class="section-kicker">${tr("Research foundation / 2025", "연구의 근거 / 2025")}</p>
          <h2 id="research-evidence">The Meta Kibun Project</h2>
          <p class="research-record__meta">${tr("Practice-based Honours research<br />RMIT University, Melbourne", "창작 실천 기반 Honours 연구<br />RMIT University, Melbourne")}</p>
        </div>
        <div class="long-copy">
          <p>${tr("The 2025 study examined how tactile interactivity and Korean emotive colour terms shaped audiences’ affective experience. Drawing on kibun (기분)—mood, feeling and atmosphere—it invited participants to compose a colour term using a Korean emotive suffix or an expression in a language of their choice. The exhibition compared a non-interactive video with a tactile installation using the same audio-visual material.", "2025년 연구는 촉각적 인터랙션과 한국어의 정서적 색채어가 관객의 정서적 경험을 어떻게 형성하는지 살펴봤습니다. 감정 상태와 분위기를 아우르는 ‘기분’에서 출발해, 참여자가 한국어의 정서적 접미어나 원하는 언어의 표현을 색과 결합해 자신만의 색채어를 구성하도록 했습니다. 전시에서는 동일한 오디오비주얼 재료를 사용한 비인터랙티브 영상과 촉각적 설치를 비교했습니다.")}</p>
          <p>${tr("Fifteen semi-structured interviews and sixteen survey responses were collected over 12–13 September 2025. Participants frequently described tactile participation as more personally engaging than watching the video. Colour choice and emotive language supported reflection on feelings that were mixed, changing or difficult to articulate. These accounts provide evidence within this exhibition, rather than a universal correspondence between colour and emotion or a prediction of every audience’s response.", "2025년 9월 12–13일에 반구조화 인터뷰 15건과 설문 응답 16건을 수집했습니다. 참여자들은 영상 관람보다 촉각적 참여에서 개인적인 몰입을 더 깊게 경험했다고 자주 서술했습니다. 색의 선택과 정서적 언어는 혼합되거나 변화하며 말로 설명하기 어려운 감정의 성찰을 도왔습니다. 이 응답은 해당 전시 안에서의 근거이며, 색과 감정의 보편적 대응 관계나 모든 관객의 반응을 예측하는 결과는 아닙니다.")}</p>
          <p class="research-record__citation"><cite>The Meta Kibun Project: Exploring Interactivity, Audience, and Affective Experience in Digital Interactive Art Exhibitions</cite><br />Minnie Park / Bachelor of Media and Communication (Honours) / 2025</p>
          ${actions([
            { label: tr("View the project", "프로젝트 보기"), path: "works/meta-kibun/" },
            { label: tr("Read the Honours Exegesis ↓", "Honours 논문 읽기 ↓"), path: site.downloads.exegesis, download: true }
          ])}
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  function renderVisualIndex() {
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const projectDates = new Map();
    site.history.forEach((group) => group.entries.forEach((entry) => {
      if (!entry.project) return;
      const month = Math.max(0, ...String(entry.date).toLowerCase().split(/\s*\/\s*/).map((name) => months.indexOf(name) + 1));
      const date = Number(group.year) * 100 + month;
      projectDates.set(entry.project, Math.max(projectDates.get(entry.project) || 0, date));
    }));
    const groups = new Map();
    site.visualIndex.forEach((item, sourceIndex) => {
      const key = item.project || "unassigned";
      if (!groups.has(key)) {
        const years = String(item.year).match(/\d{4}/g)?.map(Number) || [0];
        groups.set(key, {
          key, title: item.title, year: item.year, sourceIndex,
          // Project chronology stays stable when an old image is newly copied.
          date: projectDates.get(key) || Math.max(...years) * 100,
          items: []
        });
      }
      groups.get(key).items.push({ item, sourceIndex });
    });
    const visualIndexGroups = [...groups.values()]
      .sort((a, b) => b.date - a.date || a.sourceIndex - b.sourceIndex);
    visualIndexGroups.forEach((group) => {
      group.items.sort((a, b) =>
        (Date.parse(b.item.createdAt) || 0) - (Date.parse(a.item.createdAt) || 0) || a.sourceIndex - b.sourceIndex
      );
      group.items = group.items.map(({ item }) => item);
    });
    // Deduplicate this view only, after sorting, so the first chronological
    // occurrence keeps its project label. Project galleries remain untouched.
    const filenames = new Set();
    const sourceHashes = new Set();
    const visualIndexItems = visualIndexGroups.flatMap((group) => group.items)
      .filter((item) => {
        const basename = item.originalFilename || decodeURIComponent(item.src.split(/[?#]/)[0].split("/").pop());
        const filename = basename.normalize("NFC").toLowerCase();
        if (filenames.has(filename) || (item.sourceHash && sourceHashes.has(item.sourceHash))) return false;
        filenames.add(filename);
        if (item.sourceHash) sourceHashes.add(item.sourceHash);
        return true;
      })
      .map((item, index) => ({ ...item, index }));

    setSeo(
      "Visual Index — Minnie Park",
      "A visual field of Minnie Park’s installations, real-time visual states, material studies and moments of audience participation."
    );
    app.innerHTML = `
      <h1 class="sr-only" id="top">${tr("Visual Index", "비주얼 인덱스")}</h1>
      <section class="visual-index" aria-label="${tr("Visual index gallery", "비주얼 인덱스 갤러리")}">
        ${visualIndexItems.map((item) => `
          <button class="visual-index__item" type="button"
            data-index="${item.index}"
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
    window.MPVisualIndexLayout?.mount(document.querySelector(".visual-index"));
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
          <a class="contact-instagram" href="${site.external.instagram}" target="_blank" rel="noreferrer">@minniepark.studio ↗</a>
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
  interactionScript.src = href("site-interaction.js?v=20260908-research-51");
  interactionScript.async = true;
  document.body.appendChild(interactionScript);
})();
