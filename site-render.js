(() => {
  const site = window.MP_SITE;
  const root = document.body.dataset.root || "./";
  const page = document.body.dataset.page || "home";
  const projectKey = document.body.dataset.project || "";
  const app = document.getElementById("app");

  if (!site || !app) return;

  const href = (path) => `${root}${path}`;
  const img = (name) => `${root}images/optimized/${name}`;
  const projectUrl = (key) => href(site.projects[key].route);
  const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  const cta = (items) => `
    <div class="page-actions">
      ${items.map((item) => `<a href="${item.external ? item.path : href(item.path)}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>${item.label}</a>`).join("")}
    </div>
  `;

  function renderChrome() {
    const nav = document.createElement("nav");
    nav.className = "global-nav";
    nav.setAttribute("aria-label", "Primary navigation");
    nav.innerHTML = `
      <a class="global-nav__brand" href="${href("")}">Minnie Park</a>
      <div class="global-nav__links">
        ${site.nav.map((item) => `<a href="${href(item.path)}">${item.label}</a>`).join("")}
        <a class="global-nav__external" href="${site.external.commercial}" target="_blank" rel="noreferrer">Commercial Work</a>
      </div>
    `;
    document.body.insertBefore(nav, app);
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div>
          <p>minniepark.studio@gmail.com<br />@minniepark.studio</p>
          <p>Based in Seoul and Melbourne, working internationally.</p>
        </div>
        <nav aria-label="Footer navigation">
          ${site.nav.map((item) => `<a href="${href(item.path)}">${item.label}</a>`).join("")}
          <a href="${site.external.instagram}" target="_blank" rel="noreferrer">Instagram</a>
          <a href="${site.external.email}">Email</a>
          <a href="${site.external.commercial}" target="_blank" rel="noreferrer">Commercial Work</a>
        </nav>
      </footer>
    `;
  }

  function renderShowreel() {
    return `
      <div class="showreel-carousel" aria-label="Showreel image carousel">
        <button class="showreel-nav showreel-nav--prev" type="button" aria-label="Previous showreel image"></button>
        <div class="showreel-track">
          ${site.showreel.map((name, index) => `<figure><img src="${img(name)}" alt="Showreel image ${index + 1}" loading="lazy" decoding="async" /></figure>`).join("")}
        </div>
        <button class="showreel-nav showreel-nav--next" type="button" aria-label="Next showreel image"></button>
      </div>
    `;
  }

  function workCard(key, index, compact = false) {
    const project = site.projects[key];
    return `
      <a class="${compact ? "work-card" : "work-card work-card--large"}" href="${projectUrl(key)}">
        <figure>
          <img src="${img(project.image)}" alt="${project.title}" loading="lazy" decoding="async" />
        </figure>
        <div>
          <p class="work-index">${String(index + 1).padStart(2, "0")} / ${project.year} / ${project.category}</p>
          <h3>${project.title}</h3>
          <p>${project.card}</p>
        </div>
      </a>
    `;
  }

  function renderHome() {
    document.title = "Minnie Park - Interactive Audio-Visual Artist";
    app.innerHTML = `
      <section class="landing" id="top" aria-labelledby="heroTitle">
        <div class="landing-top">
          <h1 id="heroTitle">Minnie Park</h1>
          <p class="eyebrow">Interactive Audio-Visual Artist<br />Seoul / Melbourne</p>
        </div>
        <div class="landing-bottom">
          <p class="hero-main">Exploring affect, colour, touch, and culturally situated emotional experience through immersive digital installations.</p>
          <p class="hero-note">터치, 색, 사운드, 장미와 물을 통해 감정의 미묘함과 관객의 정서적 경험을 탐구합니다.</p>
          ${cta([
            { label: "View Works", path: "works/" },
            { label: "Download CV", path: "cv/" }
          ])}
        </div>
      </section>

      <section class="content-section" id="featured-works">
        <div class="section-heading">
          <p class="section-kicker">Featured Works</p>
          <h2>Three key works across research-based installation, an ongoing rose-based world, and participatory public programming.</h2>
        </div>
        <div class="work-card-grid">
          ${site.featuredOrder.map((key, index) => workCard(key, index, true)).join("")}
        </div>
      </section>

      <section class="content-section split-section" id="practice-preview">
        <div class="section-heading">
          <p class="section-kicker">Practice</p>
          <h2>Interactive audio-visual environments where emotional interfaces are activated through touch, colour, sound, and presence.</h2>
          ${cta([{ label: "Read Practice", path: "practice/" }])}
        </div>
        <div class="studio-list">
          <article>
            <p>Minnie Park creates interactive audio-visual environments where touch, colour, sound, roses, water, and audience participation become emotional interfaces. Her research-led practice explores affect, memory, mixed emotions, and culturally situated feeling through immersive digital systems in which audiences activate and transform the work through their presence and gestures.</p>
          </article>
        </div>
      </section>

      <section class="content-section" id="recent-highlights">
        <div class="section-heading">
          <p class="section-kicker">Recent Highlights</p>
          <h2>Selected recent presentations and public programs.</h2>
          ${cta([{ label: "View Full CV", path: "cv/" }])}
        </div>
        <div class="type-columns">
          <article>
            <h3>The Meta Kibun Project</h3>
            <p>Black Box, RMIT, Melbourne, 2025</p>
          </article>
          <article>
            <h3>The Meta Rose Project Expansion</h3>
            <p>Bugskin Chapter 2, Norla Dome, Docklands, Melbourne, 2025</p>
          </article>
          <article>
            <h3>Touching Resonance</h3>
            <p>Seventh Gallery, Melbourne, 2026</p>
          </article>
        </div>
      </section>

      <section class="content-section split-section" id="home-contact">
        <div class="section-heading">
          <p class="section-kicker">Contact</p>
          <h2>For exhibition, curatorial, residency, performance, public program, research, and workshop inquiries.</h2>
          ${cta([{ label: "Contact", path: "contact/" }])}
        </div>
        <div class="studio-list">
          <article>
            <p>minniepark.studio@gmail.com<br />Instagram: @minniepark.studio<br />Based in Seoul and Melbourne / working internationally</p>
          </article>
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  function renderWorks() {
    document.title = "Works - Minnie Park";
    app.innerHTML = `
      ${renderPageHero("Works", "Selected interactive installations, digital environments, live audio-visual performances, participatory projects, and research-led public programs.", "Minnie Park의 작업은 인터랙티브 설치, 라이브 오디오비주얼 퍼포먼스, 디지털 월드, 크리에이티브 테크놀로지 워크숍, 리서치 기반 공공 프로그램을 가로지릅니다.")}
      <section class="content-section">
        <div class="section-heading">
          <p class="section-kicker">Works Index</p>
          <h2>Touch, colour, sound, and symbolic materials operate as active interfaces for affective experience.</h2>
        </div>
        <div class="work-card-grid">
          ${site.worksOrder.map((key, index) => workCard(key, index, true)).join("")}
        </div>
      </section>
      <section class="content-section">
        <div class="section-heading">
          <p class="section-kicker">Categories</p>
          <h2>A working archive across installation, performance, workshops, digital worlds, and community education.</h2>
        </div>
        <div class="service-grid">
          ${site.categories.map((category, index) => `
            <article class="service-item">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${category[0]}</h3>
              <p>${category[1]}</p>
            </article>
          `).join("")}
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  function renderProject() {
    const project = site.projects[projectKey];
    if (!project) {
      app.innerHTML = `${renderPageHero("Project not found", "Return to the works index.", "")}${cta([{ label: "View Works", path: "works/" }])}${renderFooter()}`;
      return;
    }

    document.title = `${project.title} - Minnie Park`;
    app.innerHTML = `
      <section class="project-hero" id="top">
        <div>
          <p class="section-kicker">${project.category}</p>
          <h1>${project.title}</h1>
          <p class="project-meta">${project.meta}</p>
          <p class="hero-note">${project.card}</p>
          ${cta([
            { label: "Works Index", path: "works/" },
            { label: "Contact", path: "contact/" }
          ])}
        </div>
        <figure>
          <img src="${img(project.image)}" alt="${project.title}" loading="eager" decoding="async" />
        </figure>
      </section>

      <section class="content-section">
        <div class="media-grid">
          ${project.gallery.map((name) => `<figure><img src="${img(name)}" alt="${project.title}" loading="lazy" decoding="async" /></figure>`).join("")}
        </div>
      </section>

      <section class="content-section split-section">
        <div class="section-heading">
          <p class="section-kicker">Project</p>
          <h2>${project.title}</h2>
        </div>
        <div class="studio-list">
          <article>
            <h3>Description</h3>
            <p>${project.copy}</p>
          </article>
          ${project.interaction ? `<article><h3>Interaction / Audience Experience</h3><p>${project.interaction}</p></article>` : ""}
          <article>
            <h3>Materials / Technologies</h3>
            <p>${project.materials}</p>
          </article>
          ${project.history.length ? `<article><h3>Exhibition / Presentation History</h3>${list(project.history)}</article>` : ""}
          <article>
            <h3>한국어</h3>
            <p>${project.korean}</p>
          </article>
        </div>
      </section>
      ${renderProjectNav(projectKey)}
      ${renderFooter()}
    `;
  }

  function renderProjectNav(currentKey) {
    const index = site.worksOrder.indexOf(currentKey);
    const previous = site.worksOrder[(index - 1 + site.worksOrder.length) % site.worksOrder.length];
    const next = site.worksOrder[(index + 1) % site.worksOrder.length];
    return `
      <section class="content-section project-nav">
        <a href="${projectUrl(previous)}">Previous<br /><strong>${site.projects[previous].title}</strong></a>
        <a href="${href("works/")}">All Works</a>
        <a href="${projectUrl(next)}">Next<br /><strong>${site.projects[next].title}</strong></a>
      </section>
    `;
  }

  function renderPractice() {
    document.title = "Practice - Minnie Park";
    app.innerHTML = `
      ${renderPageHero("Practice", "I make interactive audio-visual environments where touch becomes a way of feeling.", "저는 터치가 감정을 느끼는 방식이 되는 인터랙티브 오디오비주얼 환경을 만듭니다.")}
      <section class="content-section split-section">
        <div class="section-heading">
          <p class="section-kicker">Artist Statement</p>
          <h2>Emotion is felt, translated, and amplified through interactive digital environments.</h2>
        </div>
        <div class="studio-list">
          <article>
            <p>Minnie Park's practice investigates how emotion is felt, translated, and amplified through interactive digital environments. Working across TouchDesigner, real-time 3D visuals, original sound, tactile interfaces, symbolic materials, and live performance, she creates immersive systems where audiences become active participants in the formation of meaning.</p>
          </article>
          <article>
            <p>Her recurring materials - roses, water, the colour pink, digital avatars, and responsive sound - operate as emotional interfaces. Through them, Park explores affect, memory, femininity, cultural nuance, and the unstable boundary between the virtual and the physical.</p>
          </article>
          <article>
            <h3>2026 Public Program Extension</h3>
            <p>In 2026, this practice expanded into public programming through Touching Resonance at Seventh Gallery, Melbourne. The workshop translated Park's tactile audio-visual research into a collective format, inviting participants to activate sound and real-time visuals through conductive touch, flowers, plants, and shared presence.</p>
          </article>
        </div>
      </section>
      <section class="content-section split-section">
        <div class="section-heading">
          <p class="section-kicker">Signature Visual Language</p>
          <h2>Pink and real roses are not decorative motifs, but core components of Park's artistic language.</h2>
        </div>
        <div class="studio-list">
          <article>
            <h3>Pink</h3>
            <p>Pink functions as an affective energy: a colour that shapes atmosphere, emotional intensity, and sensory proximity. It carries softness and force at once, holding intimacy, warmth, artificiality, and tension within the same visual field.</p>
          </article>
          <article>
            <h3>Real Roses</h3>
            <p>Real roses extend this language into material form. Their simultaneous beauty and fragility, softness and thorns, make them a charged expression of mixed and layered feeling.</p>
          </article>
          <article>
            <h3>한국어</h3>
            <p>핑크와 실제 장미, 특히 핑크 장미는 반복적으로 등장하는 핵심 시각·개념 재료입니다. 살아 있는 장미를 상징적 오브젝트이자 촉각 인터페이스로 사용함으로써 작업은 끌림, 취약함, 돌봄, 위험이 동시에 존재하는 상태를 드러냅니다.</p>
          </article>
        </div>
      </section>
      <section class="content-section">
        <div class="section-heading">
          <p class="section-kicker">Themes</p>
          <h2>Affect, touch, colour, roses, water, audience participation, Korean emotional nuance, and digital / physical thresholds.</h2>
        </div>
        <div class="service-grid">
          ${[
            ["Affect and emotional atmosphere", "감정과 분위기를 고정된 카테고리가 아니라 관계적이고 상황적인 경험으로 다룹니다."],
            ["Touch, haptics, and tactile interfaces", "관객의 터치와 제스처를 작품을 작동시키는 핵심 입력으로 사용합니다."],
            ["Colour, pink, and Korean emotional nuance", "색, 핑크, 한국적 정서 프레임워크를 통해 감정의 미묘함과 문화적 위치성을 탐구합니다."],
            ["Roses, water, and sensory interfaces", "장미와 물을 상징적 재료이자 촉각 인터페이스로 사용합니다."],
            ["Audience participation and co-creation", "관객을 passive viewer가 아니라 performer, co-creator, situated knower로 위치시킵니다."],
            ["Public programs and collective performance", "워크숍과 공공 프로그램을 통해 촉각적 오디오비주얼 시스템을 집단적 참여 형식으로 확장합니다."]
          ].map((item, index) => `<article class="service-item"><span>${String(index + 1).padStart(2, "0")}</span><h3>${item[0]}</h3><p>${item[1]}</p></article>`).join("")}
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  function renderResearch() {
    document.title = "Research - Minnie Park";
    app.innerHTML = `
      ${renderPageHero("Research", "Interactivity, Audience, and Affective Experience", "촉각 인터랙션, 색, 문화적으로 위치한 정서 프레임워크가 디지털 인터랙티브 전시에서 관객의 affective experience를 어떻게 형성하는지 탐구합니다.")}
      <section class="content-section split-section">
        <div class="section-heading">
          <p class="section-kicker">Research Summary</p>
          <h2>The Meta Kibun Project investigates Korean emotional nuance, tactile interaction, and audio-visual systems.</h2>
          ${cta([{ label: "Read The Meta Kibun Project", path: "works/meta-kibun/" }, { label: "View CV", path: "cv/" }, { label: "Contact", path: "contact/" }])}
        </div>
        <div class="studio-list">
          <article>
            <p>Minnie Park's research-based practice examines how interactivity, particularly through touch and colour, shapes the affective experiences of audiences in digital interactive exhibition settings. Her Honours research, The Meta Kibun Project, investigates how Korean emotional nuance, tactile interaction, and audio-visual systems can create situated and culturally responsive experiences of feeling.</p>
          </article>
          <article>
            <h3>2026 Research Extension</h3>
            <p>The research into touch, affect, and audience participation continues through public-facing formats such as Touching Resonance. While The Meta Kibun Project operates as an exhibition-based research installation, Touching Resonance translates related concerns into a collective workshop and performance environment, demonstrating how tactile interaction can support shared sensory experience, public engagement, and creative technology education.</p>
          </article>
        </div>
      </section>
      <section class="content-section">
        <div class="type-columns">
          <article>
            <h3>Research Question</h3>
            <p>How does the interactivity in The Meta Kibun 기분 Project, centred on Korean emotive colour terms and tactile elements, influence the affective experiences of audiences?</p>
          </article>
          <article>
            <h3>Methods</h3>
            ${list(["Creative practice-based research", "Exhibition as an experimental site", "Audience interviews", "Surveys and rating-scale questions", "Analysis of subjective narrative evidence and affective response"])}
          </article>
          <article>
            <h3>Key Findings</h3>
            ${list(["Tactile elements such as roses and water heightened audience affective engagement.", "Colour choice and Korean emotive frameworks helped participants reflect on layered and complex feelings.", "The interactive version was experienced as more personal, alive, and emotionally engaging than the non-interactive video version.", "Audience participation transformed viewers into performers and co-creators of meaning.", "Affective experience should be understood as situated, cultural, relational, and difficult to reduce to fixed emotional categories."])}
          </article>
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  function renderCv() {
    document.title = "CV - Minnie Park";
    const cvSections = [
      ["Selected Festivals & Public Programs", site.cv.festivals],
      ["Selected Exhibitions & Projects", site.cv.exhibitions],
      ["Live Performance", site.cv.performance],
      ["Talks, Demonstrations & Education", site.cv.talks],
      ["Research", site.cv.research],
      ["Education", site.cv.education],
      ["Certification", site.cv.certification]
    ].filter((section) => section[1]?.length);

    app.innerHTML = `
      ${renderPageHero("CV", "Minnie Park / Interactive Audio-Visual Artist / Seoul and Melbourne", "minniepark.studio@gmail.com / www.minniepark.art / @minniepark.studio")}
      <section class="content-section split-section">
        <div class="section-heading">
          <p class="section-kicker">Short Bio</p>
          <h2>Installation, performance, research, and creative technology.</h2>
        </div>
        <div class="studio-list">
          <article><p>Minnie Park is a Seoul- and Melbourne-based interactive audio-visual artist whose practice explores affect, touch, colour, and culturally situated emotional experience. Working across installation, performance, research, and creative technology, she creates environments in which audiences participate in the generation of visual and sonic responses through tactile interaction.</p></article>
          <article><p>Minnie Park는 서울과 멜버른을 기반으로 활동하는 인터랙티브 오디오비주얼 아티스트입니다. 설치, 퍼포먼스, 리서치, 크리에이티브 테크놀로지를 가로지르며, 관객이 촉각 인터랙션을 통해 시각적·청각적 반응 생성에 참여하는 환경을 만듭니다.</p></article>
        </div>
      </section>
      ${cvSections.map((section) => `
        <section class="content-section cv-section">
          <div class="section-heading">
            <p class="section-kicker">${section[0]}</p>
            <h2>${section[0]}</h2>
          </div>
          <div class="cv-list">${section[1].map((item) => `<article><p>${item}</p></article>`).join("")}</div>
        </section>
      `).join("")}
      <section class="content-section split-section">
        <div class="section-heading">
          <p class="section-kicker">Community Leadership</p>
          <h2>TouchCollective - Co-founder</h2>
        </div>
        <div class="studio-list">
          <article>
            <p>Co-founded a Melbourne-based community for tech artists, new media artists, DJs, VJs, digital artists, and creative practitioners working across interactive media and digital art. Activities include artist meet-ups, jam sessions, workshops, online programming, and international live sessions.</p>
          </article>
        </div>
      </section>
      <section class="content-section">
        <div class="section-heading">
          <p class="section-kicker">Selected Skills</p>
          <h2>TouchDesigner, Unreal Engine, Blender, Maya, Unity, Ableton Live, Three.js, HTML/CSS/JavaScript, creative coding, real-time visual systems, original sound composition, interactive installation design, live AV performance, workshop facilitation, community programming.</h2>
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  function renderContact() {
    document.title = "Contact - Minnie Park";
    app.innerHTML = `
      ${renderPageHero("Contact", "For exhibition, curatorial, residency, festival, performance, research, workshop, and collaboration inquiries.", "전시, 큐레이션, 레지던시, 페스티벌, 퍼포먼스, 리서치, 워크숍, 협업 문의는 아래로 연락 주세요.")}
      ${renderContactPreview(true)}
      <section class="content-section">
        <div class="section-heading">
          <p class="section-kicker">Inquiry Types</p>
          <h2>Available for exhibitions, interactive installations, artist-led workshops, public programs, creative technology sessions, and research-based collaborations.</h2>
        </div>
        <div class="service-grid">
          ${[
            "Exhibitions and gallery presentations",
            "Residencies and research opportunities",
            "Interactive installations and audio-visual works",
            "Artist-led workshops and public programs",
            "Creative technology education",
            "Live audio-visual performance",
            "Curatorial and institutional collaborations"
          ].map((item, index) => `<article class="service-item"><span>${String(index + 1).padStart(2, "0")}</span><h3>${item}</h3></article>`).join("")}
        </div>
      </section>
      ${renderFooter()}
    `;
  }

  function renderContactPreview(full = false) {
    return `
      <section class="content-section contact-section" id="contact">
        <div>
          <p class="section-kicker">${full ? "Contact Details" : "Contact"}</p>
          <h2>Based in Seoul and Melbourne / working internationally.</h2>
          <p>서울과 멜버른 기반 / 국내외 프로젝트 가능</p>
        </div>
        <div class="contact-actions">
          <a href="${site.external.email}">minniepark.studio@gmail.com</a>
          <a href="${site.external.instagram}" target="_blank" rel="noreferrer">Instagram</a>
          <a href="${href("cv/")}">View CV</a>
          <a href="${site.external.commercial}" target="_blank" rel="noreferrer">Commercial Work</a>
        </div>
      </section>
    `;
  }

  function renderPageHero(title, subtitle, korean) {
    return `
      <section class="page-hero" id="top">
        <p class="eyebrow">Minnie Park</p>
        <h1>${title}</h1>
        <p class="hero-main">${subtitle}</p>
        ${korean ? `<p class="hero-note">${korean}</p>` : ""}
      </section>
    `;
  }

  renderChrome();

  if (page === "home") renderHome();
  else if (page === "works") renderWorks();
  else if (page === "project") renderProject();
  else if (page === "practice") renderPractice();
  else if (page === "research") renderResearch();
  else if (page === "cv") renderCv();
  else if (page === "contact") renderContact();
})();
