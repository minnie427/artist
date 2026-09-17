(() => {
  "use strict";

  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const entries = [
    {
      key: "funeral", year: "2026", title: "The Funeral",
      image: "media/funeral/img-8821-340c5ad7.webp",
      description: [
        "Works within The Funeral connect touch, duration and intervention with living materials and responsive digital systems.",
        "The Funeral을 구성하는 작품들은 터치, 지속 시간, 개입을 살아 있는 재료와 반응형 디지털 시스템에 연결합니다."
      ],
      format: [
        "Enquiries may concern individual works within the project. The work, software version, physical components, installation requirements, price and edition terms are specified individually.",
        "프로젝트 안의 개별 작품에 대해 소장을 문의할 수 있습니다. 소장 대상 작품, 소프트웨어 버전, 물리적 구성, 설치 조건, 가격, 에디션 조건을 개별적으로 정합니다."
      ]
    },
    {
      key: "shared-resonance", year: "2026", title: "Shared Resonance",
      image: "media/shared-resonance/img-1603-763eb4f5.webp",
      description: [
        "An interactive audio-visual installation activated through conductive touch and connection between participants.",
        "전도성 터치와 참여자 간의 연결로 활성화되는 인터랙티브 오디오비주얼 설치입니다."
      ],
      format: [
        "Acquisition format is discussed individually. The relationship between participants, the rose interface, audio-visual system and spatial arrangement informs the installation specification. Price, edition size and delivery scope are confirmed as part of an acquisition proposal.",
        "소장 형태는 개별적으로 상담합니다. 참여자 사이의 관계, 장미 인터페이스, 오디오비주얼 시스템과 공간 배치가 설치 구성을 결정합니다. 가격, 에디션 수와 전달 범위는 개별 소장 제안을 통해 확정합니다."
      ]
    },
    {
      key: "meta-kibun", year: "2025", title: "The Meta Kibun Project",
      image: "media/meta-kibun/installation-07d43c32.webp",
      description: [
        "Interactive work developed through practice-led research into colour, touch and culturally situated emotional experience.",
        "색, 터치, 문화적 맥락 속의 감정 경험에 관한 실천 기반 연구에서 전개된 인터랙티브 작업입니다."
      ],
      format: [
        "Acquisition format is discussed individually. A specific work and version are identified with their interaction, display and installation requirements. Price, edition size and delivery scope are confirmed as part of an acquisition proposal.",
        "소장 형태는 개별적으로 상담합니다. 구체적인 작품과 버전을 선정하고 인터랙션, 디스플레이와 설치 조건을 정합니다. 가격, 에디션 수와 전달 범위는 개별 소장 제안을 통해 확정합니다."
      ]
    },
    {
      key: "origin", year: "2024", title: "Origin",
      image: "media/origin/the-meta-rose-project-631d0c1a.webp",
      description: [
        "The first Meta Rose chapter brings living roses, pink and distinct touch-responsive audio-visual systems into an installation.",
        "Meta Rose의 첫 장은 생장미, 핑크, 터치에 반응하는 서로 다른 오디오비주얼 시스템을 하나의 설치 안에 놓습니다."
      ],
      format: [
        "Acquisition format is discussed individually. The selected work, version and installation configuration are established before an offer is made. Price, edition size and delivery scope are confirmed as part of that proposal.",
        "소장 형태는 개별적으로 상담합니다. 판매 제안 전에 대상 작품, 버전과 설치 구성을 정합니다. 가격, 에디션 수와 전달 범위는 해당 제안을 통해 확정합니다."
      ]
    }
  ];

  function helpers(ctx) {
    const text = (en, ko) => escape(ctx.tr(en, ko));
    const url = (route) => escape(ctx.href(route));
    const image = (src, alt, eager = false) => `<img src="${escape(ctx.media(src))}" alt="${escape(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async" />`;
    const email = /^mailto:[^?\s]+@[^?\s]+$/.test(ctx.site.external.email || "")
      ? ctx.site.external.email : "mailto:minniepark.studio@gmail.com";
    const enquiry = (title) => escape(`${email}?subject=${encodeURIComponent(`Artwork acquisition enquiry — ${title}`)}`);
    const action = (title, label = ["Acquisition enquiry →", "작품 소장 문의 →"]) => `<a class="edition-enquiry" href="${enquiry(title)}">${text(...label)}</a>`;
    return { text, url, image, action };
  }

  function renderIndex(ctx) {
    const { text, url, image, action } = helpers(ctx);
    const cards = entries.map((entry, index) => {
      const fullTitle = ctx.details?.[entry.key]?.title || entry.title;
      const route = `works/${entry.key}/`;
      return `
        <article class="edition-card" aria-labelledby="edition-${entry.key}">
          <a class="edition-card__media" href="${url(route)}" aria-label="${text(`View ${fullTitle}`, `${fullTitle} 보기`)}">
            ${image(entry.image, `${fullTitle} — ${ctx.tr("installation documentation", "설치 기록")}`, index === 0)}
          </a>
          <div class="edition-card__content">
            <p class="eyebrow">${entry.year} / Meta Rose</p>
            <h2 id="edition-${entry.key}">${escape(entry.title)}</h2>
            <p>${text(...entry.description)}</p>
            <details>
              <summary>${text("Format & installation", "소장 형태와 설치")}</summary>
              <p>${text(...entry.format)}</p>
              ${entry.key === "funeral" ? `<p><a href="${url("editions/reintervention/")}">${text("RE:INTERVENTION — software artwork →", "RE:INTERVENTION — 소프트웨어 작품 →")}</a></p>` : ""}
            </details>
            <div class="page-actions project-links">
              ${action(fullTitle)}
              <a href="${url(route)}">${text("View work →", "작품 보기 →")}</a>
            </div>
          </div>
        </article>`;
    }).join("");

    return `
      <section class="page-hero page-hero--editions" id="top">
        <p class="eyebrow">${text("Artwork acquisition", "작품 소장")}</p>
        <h1>Editions</h1>
        <p class="hero-main">${text("Existing works, considered for a new setting.", "기존 작품을 새로운 공간에서 경험하는 방식.")}</p>
        <p class="edition-intro">${text(
          "Explore acquisition possibilities across Minnie Park’s projects. Each enquiry begins with the work and its intended setting; the acquisition format, edition details and installation requirements are discussed individually.",
          "Minnie Park의 여러 프로젝트에 관한 소장 가능성을 살펴봅니다. 관심 작품과 설치하려는 공간을 바탕으로 소장 형태, 에디션 정보와 설치 조건을 개별적으로 안내합니다."
        )}</p>
      </section>
      <section class="content-section content-section--compact edition-grid" aria-label="${text("Works for acquisition enquiries", "소장 문의 작품")}">${cards}</section>
      <section class="content-section content-section--compact project-detail__section">
        <h2>${text("A new work for a particular brief?", "특정 기획을 위한 새로운 작업이 필요하다면.")}</h2>
        <div class="long-copy">
          <p>${text("Acquisition concerns an existing artwork. Commissioned projects are developed for a particular brief or setting through work.minniepark.art.", "소장은 기존 작품을 대상으로 합니다. 특정 기획이나 공간을 위한 새로운 작업은 work.minniepark.art에서 상담할 수 있습니다.")}</p>
          <div class="page-actions"><a href="${escape(ctx.site.external.commercial)}" target="_blank" rel="noreferrer">${text("Commissions ↗", "커미션 ↗")}</a></div>
          <p>${text("Availability, price and edition terms are confirmed individually before acquisition.", "소장 가능 여부, 가격과 에디션 조건은 소장 전에 개별적으로 확인합니다.")}</p>
        </div>
      </section>
      ${ctx.renderFooter()}`;
  }

  function renderWork(ctx) {
    const { text, url, image, action } = helpers(ctx);
    const spec = (en, ko, valueEn, valueKo) => `<div><dt>${text(en, ko)}</dt><dd>${text(valueEn, valueKo)}</dd></div>`;
    const terms = [
      ["Edition & delivery", "에디션과 전달 구성",
        "An acquisition proposal identifies the software version, associated media, file manifest, installation and operating documentation, authentication and initial setup arrangements. The final delivery package and support scope are agreed in writing before acquisition.",
        "소장 제안에는 소프트웨어 버전, 관련 미디어, 파일 목록, 설치·운영 문서, 작품 인증과 초기 설치 지원에 관한 사항을 명시합니다. 최종 전달 구성과 지원 범위는 소장 전에 서면으로 합의합니다."],
      ["Hardware & installation", "하드웨어와 설치 조건",
        "The acquisition concerns the software artwork, not a complete hardware installation. Computer, camera, display or projector, audio equipment, controller hardware, sculptural elements, living roses and third-party software licences are supplied separately unless expressly included in the written agreement. The supported operating system, TouchDesigner build, equipment and installation configuration are confirmed before acquisition.",
        "소장 대상은 소프트웨어 작품이며 전체 하드웨어 설치를 포함하는 것은 아닙니다. 컴퓨터, 카메라, 디스플레이·프로젝터, 음향 장비, 컨트롤러 하드웨어, 조형 요소, 생장미와 서드파티 소프트웨어 라이선스는 서면 합의에 명시적으로 포함하지 않는 한 별도입니다. 지원되는 운영체제, TouchDesigner 빌드, 장비와 설치 구성은 소장 전에 확정합니다."],
      ["Rights & conservation", "권리와 보존",
        "Acquisition is for a defined artwork under an agreed exhibition and preservation licence. Copyright remains with the artist. It is not a reusable template or a licence for client work, asset extraction or redistribution. Backup, migration, transfer and resale conditions require a written agreement.",
        "소장은 합의된 전시·보존 라이선스에 따른 특정 작품을 대상으로 하며 저작권은 작가에게 있습니다. 재사용 템플릿이나 클라이언트 작업, 자산 추출, 재배포를 위한 라이선스가 아닙니다. 백업, 이전, 양도와 재판매 조건은 서면으로 합의해야 합니다."],
      ["PhoneHub & ongoing support", "PhoneHub와 유지 지원",
        "If PhoneHub is included, deployment or access arrangements, hosting duration, maintenance responsibilities and any additional support fees are agreed before delivery. Perpetual hosting, unlimited support and compatibility with future software versions are not included unless expressly agreed in writing.",
        "PhoneHub를 포함하는 경우 배포·접근 방식, 호스팅 기간, 유지관리 책임과 추가 지원 비용을 전달 전에 합의합니다. 영구 호스팅, 무제한 지원과 향후 소프트웨어 버전과의 호환성은 서면으로 별도 합의하지 않는 한 포함되지 않습니다."]
    ];

    return `
      <article class="edition-page project-detail">
        <section class="page-hero project-detail__hero" id="top">
          <p><a href="${url("editions/")}">← Editions</a></p>
          <p class="eyebrow">${text("Meta Rose 2026: The Funeral / Software artwork", "Meta Rose 2026: The Funeral / 소프트웨어 작품")}</p>
          <h1>RE:<wbr>INTERVENTION</h1>
          <p class="hero-main">${text("Acquisition on enquiry.", "소장 문의를 통해 안내합니다.")}</p>
        </section>
        <figure class="project-detail__media">
          ${image("media/funeral/06cd1114-ef2a-4879-bc97-366cc63064b3-sub1-20260816-192-ef874377.webp", ctx.tr("Moving-image documentation from The Funeral", "The Funeral 무빙이미지 기록"), true)}
          <figcaption>${text("The Funeral / Moving-image context", "The Funeral / 무빙이미지 맥락")}</figcaption>
        </figure>
        <section class="content-section content-section--compact project-detail__section">
          <h2>${text("A work to install, experience and preserve.", "설치하고, 경험하고, 보존하는 작품.")}</h2>
          <div class="long-copy">
            <p>${text("RE:INTERVENTION brings physical controls and camera-tracked bodily movement into a responsive audio-visual system. Developed within The Funeral, it considers intervention, observation and the relation between an acting body and its digital image.", "RE:INTERVENTION은 물리적 조작 장치와 카메라로 추적한 신체 움직임을 반응형 오디오비주얼 시스템으로 연결합니다. The Funeral에서 전개된 이 작품은 개입, 관찰, 행동하는 신체와 디지털 이미지의 관계를 다룹니다.")}</p>
            <p>${text("Acquisition concerns a defined version of this software work, rather than the complete four-part exhibition. Edition size, price, applicable taxes, delivery and licence terms are confirmed through an individual written proposal.", "소장은 네 부분으로 이루어진 전시 전체가 아니라 이 소프트웨어 작품의 특정 버전을 대상으로 합니다. 에디션 수, 가격, 적용 세금, 전달 구성과 라이선스 조건은 개별 서면 제안을 통해 확정합니다.")}</p>
            <div class="page-actions">${action("RE:INTERVENTION", ["Enquire about acquisition →", "작품 소장 문의 →"])}</div>
          </div>
        </section>
        <section class="content-section content-section--compact project-detail__section" aria-labelledby="edition-specification">
          <h2 id="edition-specification">${text("Work & acquisition", "작품과 소장")}</h2>
          <div>
            <dl class="edition-specs">
              ${spec("Artist", "작가", "Minnie Park", "Minnie Park")}
              ${spec("Year", "제작 연도", "2026", "2026")}
              ${spec("Medium", "매체", "Interactive audio-visual software installation", "인터랙티브 오디오비주얼 소프트웨어 설치")}
              ${spec("Edition", "에디션", "Details on enquiry", "문의 후 개별 안내")}
              ${spec("Delivery", "전달 방식", "Digital delivery and installation documentation; scope agreed before acquisition", "디지털 전달과 설치 문서 · 소장 전 구성 협의")}
              ${spec("Acquisition", "소장 방식", "Subject to installation and licence agreement", "설치 조건과 라이선스 합의 후 진행")}
            </dl>
          </div>
        </section>
        <section class="content-section content-section--compact project-detail__section" aria-labelledby="edition-terms-title">
          <h2 id="edition-terms-title">${text("Installation & terms", "설치와 소장 조건")}</h2>
          <div class="edition-terms">
            ${terms.map((term, index) => `<details${index === 0 ? " open" : ""}><summary>${text(term[0], term[1])}</summary><p>${text(term[2], term[3])}</p></details>`).join("")}
          </div>
        </section>
        <section class="content-section content-section--compact">
          <div class="page-actions"><a href="${url("works/funeral/")}">${text("Return to the exhibition context →", "전시의 맥락으로 돌아가기 →")}</a></div>
        </section>
      </article>
      ${ctx.renderFooter()}`;
  }

  window.MP_EDITIONS = { renderIndex, renderWork };
})();
