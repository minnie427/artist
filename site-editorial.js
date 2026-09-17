(() => {
  "use strict";
  const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const local = (value, language) => typeof value === "string" ? value : value?.[language] || value?.en || "";
  const list = value => Array.isArray(value) ? value : [value];
  const further = ["bugskin-chapter-2", "mugonggan", "artist-workshops", "live-performance", "melbourne-fashion-festival", "album-listening-session"];
  const enquiry = title => "mailto:minniepark.studio@gmail.com?subject=" + encodeURIComponent("Artwork acquisition enquiry — " + title);

  function works(ctx) {
    const { site, details, language, tr, href, imageMarkup, renderFooter } = ctx;
    const pairs = {
      "shared-resonance": ["media/shared-resonance/img-1603-763eb4f5.webp", "media/shared-resonance/img-1773-c9a5bfa0.webp"],
      "meta-kibun": ["media/meta-kibun/installation-07d43c32.webp", "media/meta-kibun/img-8620-11ca27fe.webp"]
    };
    return `<section class="page-hero page-hero--works" id="top"><p class="eyebrow">${tr("Selected Works / 2024—2026", "주요 작품 / 2024—2026")}</p><h1>${tr("Works", "작품")}</h1><p class="hero-main">${tr("Interactive installations, moving image and participatory systems.", "인터랙티브 설치, 무빙이미지와 관객 참여 시스템.")}</p></section>
      <section class="editorial-works-intro content-section content-section--compact"><p>${tr("Meta Rose is Minnie Park’s ongoing body of work, developed through distinct installations. Roses, pink and touch connect an inquiry into emotional ambivalence, participation and time.", "Meta Rose는 서로 다른 설치로 이어지는 Minnie Park의 지속적인 작업입니다. 장미, 핑크, 터치를 통해 감정의 양가성, 참여와 시간을 탐구합니다.")}</p><a class="inline-link" href="${href("research/")}">${tr("Read the research →", "작업의 배경 읽기 →")}</a></section>
      <section class="editorial-works content-section" aria-label="${tr("Selected artworks", "주요 작품")}">
      ${site.primaryWorksOrder.map((key, index) => {
        const p = details[key], original = site.projects[key];
        const images = pairs[key] || [p.hero.src];
        return `<article class="editorial-work"><a class="editorial-work__media${images.length > 1 ? " is-pair" : ""}" href="${href(original.route)}" aria-label="${esc(tr("View ", "작품 보기: ") + p.title)}">${images.map(src => imageMarkup(src, p.title + " / " + tr("Installation documentation", "설치 기록"), index === 0)).join("")}</a>
          <div class="editorial-work__caption"><div><p class="section-kicker">${esc(original.year)} / ${esc(local(original.categoryKo && language === "ko" ? original.categoryKo : original.category, language))}</p><h2><a href="${href(original.route)}">${esc(p.title)}</a></h2></div><div><p>${esc(local(p.lead, language))}</p><div class="editorial-work__actions"><a class="inline-link" href="${href(original.route)}">${tr("View work →", "작품 보기 →")}</a><a class="inline-link" href="${enquiry(p.title)}">${tr("Acquisition enquiry", "작품 소장 문의")}</a></div></div></div></article>`;
      }).join("")}</section>
      <section class="content-section editorial-further"><div class="section-heading section-heading--row"><h2>${tr("Further practice", "작업의 확장")}</h2><a class="inline-link" href="${href("artist/")}#artistHistoryTitle">${tr("Exhibition history →", "전시·활동 이력 →")}</a></div>
      ${further.map(key => { const p = details[key]; return `<article class="editorial-index-row"><span>${esc(site.projects[key].year)}</span><div><h3><a href="${href(site.projects[key].route)}">${esc(p.title)}</a></h3><p>${esc(local(p.lead, language))}</p></div><a class="inline-link" href="${href(site.projects[key].route)}">${tr("View work →", "작품 보기 →")}</a></article>`; }).join("")}</section>
      <section class="index-invitation content-section"><p class="section-kicker">Visual Index</p><a href="${href("visual-index/")}">${tr("Explore the Visual Index →", "비주얼 인덱스 보기 →")}</a><p>${tr("Installation views, visual studies and traces of participation.", "설치 전경, 비주얼 스터디와 참여의 흔적.")}</p></section>${renderFooter()}`;
  }

  function project(ctx, key) {
    const { site, details, language, tr, href, imageMarkup, galleryMediaMarkup, renderFooter, renderProjectNav } = ctx;
    const p = details[key], original = site.projects[key];
    const text = value => esc(local(value, language));
    const used = new Set([p.hero.src, ...(p.illustrations || []).map(item => item.src)]);
    const relatedEntries = (original.entries || []).flatMap(entryKey => {
      const entry = site.projects[entryKey];
      return [{ src: entry.image, alt: entry.imageAlt }, ...(entry.gallery || [])];
    });
    const gallery = [...(original.gallery || []), ...relatedEntries].filter(item => {if (used.has(item.src)) return false; used.add(item.src); return true;});
    return `<article class="project-detail" id="top">
      <header class="project-detail__header"><a class="inline-link" href="${href("works/")}">← ${tr("Works", "작품")}</a><h1>${esc(language === "ko" ? p.titleKo || p.title : p.title)}</h1>${p.subtitle ? `<p class="project-subtitle">${text(p.subtitle)}</p>` : ""}<div class="project-meta">${list(local(p.meta, language)).map(line => `<p>${esc(line)}</p>`).join("")}</div>
      ${p.acquisition ? `<div class="editorial-work__actions"><a class="inline-link" href="${enquiry(p.title)}">${tr("Acquisition enquiry", "작품 소장 문의")}</a><a class="inline-link" href="${href("editions/")}">Editions →</a></div>` : ""}</header>
      <figure class="project-detail__figure project-detail__hero">${imageMarkup(p.hero.src, local(p.hero.caption, language), true)}<figcaption>${text(p.hero.caption)}</figcaption></figure>
      <p class="project-detail__lead">${text(p.lead)}</p>
      ${p.sections.map((section, index) => {
        const illustration = (p.illustrations || []).find(item => item.after === index);
        return `<section class="project-detail__section"${section.id ? ` id="${esc(section.id)}"` : ""}><h2>${text(section.title)}</h2><div class="long-copy">${section.paragraphs.map(para => `<p>${text(para)}</p>`).join("")}</div></section>${illustration ? `<figure class="project-detail__figure">${imageMarkup(illustration.src, local(illustration.caption, language))}<figcaption>${text(illustration.caption)}</figcaption></figure>` : ""}`;
      }).join("")}
      ${key === "funeral" ? `<section class="edition-enquiry project-detail__section"><div><p class="section-kicker">${tr("Software edition", "소프트웨어 에디션")}</p><h2>RE:INTERVENTION</h2></div><div class="long-copy"><p>${tr("A software work developed within The Funeral. Explore acquisition possibilities and the conditions for presenting the work.", "The Funeral에서 전개된 소프트웨어 작품입니다. 소장 가능성과 작품 구현 조건을 살펴볼 수 있습니다.")}</p><a class="inline-link" href="${href("editions/reintervention/")}">${tr("Acquisition details →", "소장 안내 →")}</a></div></section>` : ""}
      ${p.sources.length ? `<details class="project-detail__sources"><summary>${tr("Project documentation", "프로젝트 자료")}</summary>${p.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noreferrer">${esc(source.label)} ↗</a>`).join("")}</details>` : ""}
      ${gallery.length ? `<section class="project-gallery" aria-label="${esc(p.title)} — ${tr("documentation", "기록")}">${gallery.map(item => `<figure>${galleryMediaMarkup(item)}</figure>`).join("")}</section>` : ""}
      <div class="editorial-work__actions"><a class="inline-link" href="${href("visual-index/")}">Visual Index →</a>${p.acquisition ? `<a class="inline-link" href="${enquiry(p.title)}">${tr("Acquisition enquiry →", "작품 소장 문의 →")}</a>` : ""}</div>
      ${renderProjectNav(key, site.primaryWorksOrder.includes(key))}</article>${renderFooter()}`;
  }
  window.MP_EDITORIAL = { works, project };
})();
