(() => {
  "use strict";
  const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll(String.fromCharCode(34), "&quot;");
  const local = (value, language) => typeof value === "string" ? value : value?.[language] || value?.en || "";
  const list = value => Array.isArray(value) ? value : value ? [value] : [];
  const approvedCrops = {
  "melbourne-fringe": {
    "src": "media/melbourne-fringe/img-1983.webp",
    "x": 100,
    "y": 49.9,
    "zoom": 1.12
  },
  "funeral": {
    "src": "media/funeral/img-8821-340c5ad7.webp",
    "x": 39.4,
    "y": 100,
    "zoom": 1.12
  },
  "shared-resonance": {
    "src": "media/shared-resonance/img-1603-763eb4f5.webp",
    "x": 100,
    "y": 49,
    "zoom": 1
  },
  "bugskin-chapter-2": {
    "src": "media/bugskin-chapter-2/img-0727-b0a7b7e7.webp",
    "x": 68,
    "y": 41,
    "zoom": 1
  },
  "meta-kibun": {
    "src": "media/meta-kibun/installation-07d43c32.webp",
    "x": 50,
    "y": 57,
    "zoom": 1
  },
  "mugonggan": {
    "src": "media/mugonggan/img-5898-4ee3afc5.webp",
    "x": 65.8,
    "y": 91.9,
    "zoom": 1.22
  },
  "origin": {
    "src": "media/origin/the-meta-rose-project-631d0c1a.webp",
    "x": 62.6,
    "y": 64.6,
    "zoom": 1.41
  },
  "live-performance": {
    "src": "media/median/liveperformance.jpg",
    "x": 47.3,
    "y": 50.1,
    "zoom": 1
  },
  "artist-workshops": {
    "src": "media/touching-resonance/touching-resonance-b956e3bc.webp",
    "x": 0,
    "y": 0,
    "zoom": 1.12
  },
  "melbourne-fashion-festival": {
    "src": "images/fashionrunway.png",
    "x": 50,
    "y": 100,
    "zoom": 1
  },
  "album-listening-session": {
    "src": "images/listening-session.png",
    "x": 50,
    "y": 50,
    "zoom": 1
  }
};

  const catalogueFacts = {
    funeral: {
      location: { en: "Mijin Floor, Yeonnam-dong, Seoul", ko: "미진플로어, 서울 연남동" },
      presentation: { en: "Seoul Fringe Festival, solo exhibition, 15 to 18 August 2026", ko: "서울프린지페스티벌 개인전, 2026년 8월 15~18일" },
      participation: { en: "Touch, gesture, proximity and observation across Naming, Intervention, Witness and Record.", ko: "명명, 개입, 목격과 기록에서 접촉, 제스처, 가까워짐과 관찰을 서로 다른 참여 방식으로 구성합니다." }
    },
    "shared-resonance": {
      location: { en: "118 Greeves Street, Fitzroy, Melbourne", ko: "118 Greeves Street, Fitzroy, 멜버른" },
      presentation: { en: "Platform Presents: Hybrid, 18 April 2026", ko: "Platform Presents: Hybrid, 2026년 4월 18일" },
      participation: { en: "Two or more participants connect through roses, water and hand-to-hand contact to activate the installation.", ko: "두 명 이상의 참여자가 장미, 물과 손을 맞잡는 접촉을 통해 설치를 함께 활성화합니다." }
    },
    "meta-kibun": {
      location: { en: "RMIT University, Melbourne", ko: "RMIT University, 멜버른" },
      presentation: { en: "12 to 13 September 2025, solo exhibition", ko: "2025년 9월 12~13일, 개인전" },
      participation: { en: "Participants compose a colour term, then touch roses and water to alter sound and moving image.", ko: "참여자는 자신만의 색채어를 구성하고, 장미와 물을 만지며 사운드와 무빙이미지에 변화를 더합니다." }
    },
    origin: {
      location: { en: "Seventh Gallery and Blackbox, RMIT University, Melbourne", ko: "Seventh Gallery 및 RMIT University Blackbox, 멜버른" },
      presentation: { en: "Group exhibition, 29 May 2024; solo exhibitions, 7 June and November 2024", ko: "2024년 5월 29일 그룹전, 6월 7일 및 11월 개인전" },
      participation: { en: "Touching living roses combines sound and image. An interactive game forms a separate part of the full presentation.", ko: "생장미를 만지며 사운드와 이미지를 조합합니다. 전체 발표에는 별도의 인터랙티브 게임이 함께 구성됩니다." }
    },
    "bugskin-chapter-2": {
      location: { en: "Norla Dome, Docklands, Melbourne", ko: "Norla Dome, Docklands, 멜버른" },
      presentation: { en: "November 2025, group exhibition", ko: "2025년 11월, 그룹전" },
      materials: { en: "Suspended living roses, sound and real-time moving image.", ko: "공중에 매단 생장미, 사운드와 실시간 무빙이미지." },
      participation: { en: "Suspended living roses form tactile interfaces for the audio-visual installation.", ko: "공중에 매단 생장미가 오디오비주얼 설치의 촉각적 인터페이스를 이룹니다." }
    },
    mugonggan: {
      location: { en: "Mugonggan, Seongnam, Gyeonggi-do, South Korea", ko: "무공간, 경기도 성남시" },
      presentation: { en: "5 July 2025, solo exhibition", ko: "2025년 7월 5일, 개인전" },
      materials: { en: "Living roses, pink glass blocks, touch, sound and moving image.", ko: "생장미, 핑크 유리 블록, 터치, 사운드와 무빙이미지." },
      participation: { en: "Rose interfaces arranged on pink glass blocks connect touch with sound and moving image.", ko: "핑크 유리 블록 위의 장미 인터페이스가 접촉을 사운드와 무빙이미지로 연결합니다." }
    },
    "live-performance": {
      location: { en: "Miscellania, Melbourne", ko: "Miscellania, 멜버른" },
      presentation: { en: "Median, 2023; Median 2, 2024", ko: "Median, 2023년 / Median 2, 2024년" },
      materials: { en: "Original sound and real-time moving image.", ko: "오리지널 사운드와 실시간 무빙이미지." },
      participation: { en: "A live composition of sound, image and the duration of performance.", ko: "사운드와 이미지, 공연의 지속시간을 라이브로 구성합니다." }
    },
    "artist-workshops": {
      location: { en: "The Mission to Seafarers Victoria, Seventh Gallery and Science Gallery Melbourne", ko: "The Mission to Seafarers Victoria, Seventh Gallery 및 Science Gallery Melbourne" },
      presentation: { en: "Flower your Face, 2 October 2026; Touching Resonance, 15 April 2026; creative technology and community workshops", ko: "Flower your Face, 2026년 10월 2일. Touching Resonance, 2026년 4월 15일. 크리에이티브 테크놀로지 및 커뮤니티 워크숍" },
      materials: { en: "TouchDesigner, MediaPipe, tracking data, tactile interfaces, sound and real-time image.", ko: "TouchDesigner, MediaPipe, 트래킹 데이터, 촉각적 인터페이스, 사운드와 실시간 이미지." },
      participation: { en: "Practical exercises and shared experimentation in creative technology.", ko: "크리에이티브 테크놀로지를 활용한 실습과 공동 실험을 진행합니다." }
    },
    "melbourne-fashion-festival": {
      location: { en: "PayPal Melbourne Fashion Festival, Melbourne", ko: "PayPal Melbourne Fashion Festival, 멜버른" },
      presentation: { en: "Premium Runways, March 2025", ko: "Premium Runways, 2025년 3월" },
      materials: { en: "Moving image for runway-scale screens.", ko: "런웨이 스케일의 스크린을 위한 무빙이미지." },
      participation: { en: "Sixteen moving-image sequences presented within the runway programme.", ko: "런웨이 프로그램에서 16개의 무빙이미지 시퀀스를 선보였습니다." }
    },
    "album-listening-session": {
      location: { en: "Pre-release album listening session, Seoul", ko: "앨범 선공개 청음회, 서울" },
      presentation: { en: "2026, commissioned event visuals", ko: "2026년, 이벤트 비주얼 커미션" },
      materials: { en: "Audio-reactive moving image.", ko: "오디오에 반응하는 무빙이미지." },
      participation: { en: "A 30-minute visual composition developed for the listening session.", ko: "청음회를 위해 30분 길이의 비주얼 구성을 제작했습니다." }
    }
  };
  const enquiryAction = (ctx, title, label = ["Acquisition enquiry", "작품 소장 문의"]) => {
    const text = (en, ko) => esc(ctx.tr(en, ko));
    const email = /^mailto:[^?\s]+@[^?\s]+$/.test(ctx.site.external.email || "") ? ctx.site.external.email : "mailto:minniepark.studio@gmail.com";
    const subject = `Artwork acquisition enquiry, ${title}`;
    return `<details class="acquisition-enquiry"><summary class="inline-link">${text(...label)}</summary><div class="acquisition-enquiry__panel"><p>${text("Tell me which work interests you and where you would like to present it.", "관심 작품과 설치하려는 공간을 알려주세요.")}</p><dl><dt>${text("Email", "이메일")}</dt><dd class="acquisition-enquiry__select">${esc(email.slice(7))}</dd><dt>${text("Subject", "제목")}</dt><dd class="acquisition-enquiry__select">${esc(subject)}</dd></dl><a href="${esc(`${email}?subject=${encodeURIComponent(subject)}`)}">${text("Open email app →", "메일 앱에서 작성 →")}</a><p>${text("Or copy the address into your email service.", "주소를 복사해 사용하는 이메일 서비스에서 작성해도 됩니다.")}</p></div></details>`;
  };
  function orderedWorks(site, details) {
    const candidates = [...(site.worksCatalogueOrder || []), ...(site.primaryWorksOrder || []), ...(site.projectSequence || []), ...Object.keys(details)];
    const available = [...new Set(candidates)].filter(key => site.projects[key]?.route && details[key]);
    const rank = key => key === "artist-workshops" ? 1 : key === "live-performance" ? 2 : ["melbourne-fashion-festival", "album-listening-session"].includes(key) || /commission/i.test(site.projects[key].category || "") ? 3 : 0;
    // Keep exhibition presentations chronological, including month-only records.
    const dates = { reintervention: 20261011, "respite-iii": 20261009, "melbourne-fringe": 20261004, funeral: 20260818, "shared-resonance": 20260418, "bugskin-chapter-2": 20251100, "meta-kibun": 20250913, mugonggan: 20250705, origin: 20241100 };
    const date = key => dates[key] || (parseInt(site.projects[key].year, 10) || 0) * 10000;
    return available.map((key,index)=>({key,index})).sort((a,b)=>rank(a.key)-rank(b.key)||(rank(a.key) === 0 ? date(b.key)-date(a.key) : 0)||a.index-b.index).map(item=>item.key);
  }

  function workFacts(original, detail, key, language) {
    const overrides = original.catalogue || {};
    const fallback = catalogueFacts[key] || {};
    const field = name => local(overrides[name] || fallback[name], language);
    const materials = field("materials") || local(detail.technical?.[0]?.materials, language);
    return { location: field("location"), presentation: field("presentation"), materials, participation: field("participation") };
  }
  function works(ctx) {
    const { site, details, language, tr, href, media, renderFooter } = ctx;
    const keys = orderedWorks(site, details);
    let previousExhibitionYear = "";
    const cards = keys.map((key,index) => {
      const p = details[key], original = site.projects[key], facts = workFacts(original,p,key,language);
      const savedCrop = approvedCrops[key];
      const image = original.photoPending || original.documentationPending ? null : original.importedDocumentation ? original.image : savedCrop?.src || original.image || p.hero?.src;
      // A crop belongs to its selected photograph, never a replacement hero.
      const crop = savedCrop && savedCrop.src === image ? savedCrop : null;
      const position = crop ? `${crop.x}% ${crop.y}%` : "50% 50%";
      const zoom = crop?.zoom || 1;
      const year = language === "ko" ? String(original.year).replace(/(\d{4}) onwards/, "$1년부터 현재") : original.year;
      const isExhibition = !["live-performance", "artist-workshops", "melbourne-fashion-festival", "album-listening-session"].includes(key) && !/commission/i.test(original.category || "");
      const exhibitionYear = String(original.year).match(/\d{4}/)?.[0] || String(original.year);
      const yearHeading = isExhibition && previousExhibitionYear !== exhibitionYear ? `<header class="catalogue-year"><h2>${esc(exhibitionYear)}</h2></header>` : "";
      if (isExhibition) previousExhibitionYear = exhibitionYear;
      const category = language === "ko" ? original.categoryKo || original.category : original.category;
      const summary = language === "ko" ? original.cardKo || local(p.lead,language) : original.card || local(p.lead,language);
      const alt = key === "shared-resonance" ? tr("Shared Resonance, April 2026 presentation", "Shared Resonance, 2026년 4월 발표") : original.imageAlt || local(p.hero?.caption,language) || p.title;
      return `${yearHeading}<article class="catalogue-work" id="work-${esc(key)}"><a class="catalogue-work__image${image ? "" : " catalogue-work__image--pending"}" href="${href(original.route)}" aria-label="${esc(tr("View ", "작품 보기: ") + p.title)}">${image ? `<img src="${esc(media(image))}" alt="${esc(alt)}" loading="${index===0 ? "eager" : "lazy"}" decoding="async" data-crop-x="${crop?.x ?? 50}" data-crop-y="${crop?.y ?? 50}" data-crop-zoom="${zoom}" style="object-position:${position};transform:scale(${zoom});transform-origin:${position}" />` : `<span>${tr("Documentation to follow", "전시 기록 준비 중")}</span>`}</a><div class="catalogue-work__record"><div><p class="section-kicker">${esc(year)} / ${esc(category)}</p><h2><a href="${href(original.route)}">${esc(language === "ko" ? p.titleKo || p.title : p.title)}</a></h2><div class="editorial-work__actions"><a class="inline-link" href="${href(original.route)}">${tr("View project →", "작품 보기 →")}</a>${p.acquisition ? enquiryAction(ctx,p.title) : ""}</div></div><div><p class="catalogue-work__summary">${esc(summary)}</p><dl class="catalogue-work__facts">${[["year",tr("Year","연도"),year],["format",tr("Format","형식"),category],["location",tr("Location","장소"),facts.location],["presentation",tr("Presentation","발표"),facts.presentation],["materials",tr("Materials","재료"),facts.materials],["participation",tr("Participation","참여 방식"),facts.participation]].filter(([, , value])=>value).map(([,label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl></div></div></article>`;
    }).join("");
    return `<section class="page-hero page-hero--works catalogue-hero" id="top"><p class="eyebrow">${tr("Selected works", "주요 작품")}</p><h1>${tr("Works", "작품")}</h1><p class="hero-main">${tr("Installations, artist-led workshops, live audio-visual works and selected commissions.", "설치, 아티스트 워크숍, 라이브 오디오비주얼 작업과 주요 커미션.")}</p></section><section class="content-section catalogue-works" aria-label="${tr("Selected artworks", "주요 작품")}">${cards}</section><section class="content-section catalogue-index-link"><a class="inline-link" href="${href("visual-index/")}">${tr("Visual Index →", "비주얼 인덱스 →")}</a><p>${tr("Installation views, moving-image records and traces of participation.", "설치 전경, 무빙이미지 기록과 참여의 흔적.")}</p></section>${renderFooter()}`;
  }
  function selectedGallery(original, detail, site) {
    const used = new Set([detail.hero?.src, ...(detail.illustrations || []).map(item=>item.src)].filter(Boolean));
    const related = (original.entries || []).flatMap(key => {
      const entry = site.projects[key];
      return entry ? [{src:entry.image,alt:entry.imageAlt},...(entry.gallery || [])] : [];
    });
    const explicit = detail.selectedGallery || original.selectedGallery;
    const candidates = explicit || [...(original.gallery || []),...related];
    const unique = candidates.filter(item=>item?.src && !used.has(item.src) && (used.add(item.src),true));
    if (explicit) return unique.slice(0,6);
    const records = unique.filter(item=>/installation|participation|workshop|performance|설치|참여|워크숍|공연/i.test(item.alt || ""));
    const videos = unique.filter(item=>/\.(mp4|webm|ogv)$/i.test(item.src));
    const choices = [...videos.slice(0,1),...records,...unique];
    const selected = new Set();
    return choices.filter(item=>!selected.has(item.src) && (selected.add(item.src),true)).slice(0,6);
  }
  function project(ctx,key) {
    const { site,details,language,tr,href,imageMarkup,galleryMediaMarkup,media,renderFooter,renderProjectNav } = ctx;
    const p=details[key],original=site.projects[key];
    const text=value=>esc(local(value,language));
    const hero = p.hero?.src && !original.photoPending && !original.documentationPending ? p.hero : null;
    const gallery = selectedGallery(original,p,site);
    const archive = p.phoneHubArchiveUrl;
    const archiveLink = typeof archive === "string" && /^https:\/\/[^\s<>]+$/i.test(archive) ? `<a class="inline-link" href="${esc(archive)}" target="_blank" rel="noreferrer" data-phone-hub-archive title="${tr("Read-only exhibition archive", "읽기 전용 전시 아카이브")}">${tr("Explore the Phone Hub Archive", "폰 허브 아카이브 보기")}</a>` : "";
    const imageItems = gallery.filter(item=>! /\.(mp4|webm|ogv)$/i.test(item.src));
    const selectedStrip = gallery.length ? `<section class="catalogue-selected"><div class="catalogue-selected__heading"><h2>${tr("Selected documentation","주요 기록")}</h2><a class="inline-link" href="${href("visual-index/")}">Visual Index →</a></div><div class="catalogue-selected__strip">${gallery.map(item=>`<figure>${/\.(mp4|webm|ogv)$/i.test(item.src) ? galleryMediaMarkup(item) : `<a href="${esc(media(item.src))}" target="_blank" rel="noreferrer" data-catalogue-gallery aria-label="${esc(tr("Enlarge image: ","이미지 확대: ") + (item.alt || p.title))}">${imageMarkup(item.src,item.alt || p.title)}</a>`}${item.alt ? `<figcaption>${esc(item.alt)}</figcaption>` : ""}</figure>`).join("")}</div></section>` : "";
    const viewer = imageItems.length ? `<dialog class="catalogue-viewer" aria-label="${tr("Selected artwork documentation","선택한 작품 기록")}"><button class="catalogue-viewer__close" type="button" data-catalogue-close aria-label="${tr("Close image","이미지 닫기")}">×</button><div class="catalogue-viewer__stage"><button type="button" data-catalogue-prev aria-label="${tr("Previous image","이전 이미지")}">‹</button><figure><img alt="${tr("Selected artwork documentation","선택한 작품 기록")}" /><figcaption></figcaption></figure><button type="button" data-catalogue-next aria-label="${tr("Next image","다음 이미지")}">›</button></div></dialog>` : "";
    return `<article class="project-detail catalogue-project" id="top"><header class="project-detail__header"><p class="eyebrow catalogue-project__eyebrow"><a href="${href("works/")}">← ${tr("Works","작품")}</a></p><h1>${esc(language === "ko" ? p.titleKo || p.title : p.title)}</h1>${p.subtitle ? `<p class="project-subtitle">${text(p.subtitle)}</p>` : ""}<div class="project-meta">${list(local(p.meta,language)).map(line=>`<p>${esc(line)}</p>`).join("")}</div>${p.acquisition ? `<div class="editorial-work__actions">${enquiryAction(ctx,p.title)}<a class="inline-link" href="${href("editions/")}">Editions →</a>${archiveLink}</div>` : archiveLink}</header>${hero ? `<figure class="project-detail__figure project-detail__hero"><div class="project-detail__hero-frame">${imageMarkup(hero.src,local(hero.caption,language) || p.title,true)}</div>${hero.caption ? `<figcaption>${text(hero.caption)}</figcaption>` : ""}</figure>` : ""}<p class="project-detail__lead">${text(p.lead)}</p>${p.sections.map((section,index)=>{const illustration=(p.illustrations || []).find(item=>item.after===index && item.src);return `<section class="project-detail__section catalogue-project__section"${section.id ? ` id="${esc(section.id)}"` : ""}>${illustration ? `<figure class="project-detail__figure catalogue-project__illustration">${galleryMediaMarkup({...illustration,alt:local(illustration.caption,language) || p.title})}${illustration.caption ? `<figcaption>${text(illustration.caption)}</figcaption>` : ""}</figure>` : ""}<h2>${text(section.title)}</h2><div class="long-copy">${section.paragraphs.map(para=>`<p>${text(para)}</p>`).join("")}</div></section>`;}).join("")}${p.technical?.length ? `<section class="project-detail__section catalogue-project__technical" id="technical-details" aria-labelledby="technical-title"><h2 id="technical-title">${tr("Technical details","작품 기술 정보")}</h2><div>${p.technical.map(record=>`<div class="project-technical-record"><h3>${text(record.label)}</h3><dl>${[["medium","Medium","매체"],["materials","Materials","재료"],["dimensions","Dimensions","설치 크기"],["tools","Tools / software","제작 도구"],["credit","Artist / production","작가 / 제작"]].filter(([field])=>record[field]).map(([field,en,ko])=>`<div><dt>${tr(en,ko)}</dt><dd>${text(record[field])}</dd></div>`).join("")}</dl></div>`).join("")}</div></section>` : ""}${p.sources?.length ? `<details class="project-detail__sources"><summary>${tr("Project documentation","프로젝트 자료")}</summary>${p.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noreferrer">${esc(language === "ko" ? source.labelKo || source.label : source.label)} ↗</a>`).join("")}</details>` : ""}${selectedStrip}<div class="editorial-work__actions catalogue-project__actions"><a class="inline-link" href="${href("visual-index/")}">Visual Index →</a>${p.acquisition ? enquiryAction(ctx,p.title,["Acquisition enquiry →","작품 소장 문의 →"]) : ""}</div>${renderProjectNav(key,site.primaryWorksOrder.includes(key))}${viewer}</article>${renderFooter()}`;
  }
  function bindGallery(container) {
    if (!container?.querySelectorAll) return;
    const links=[...container.querySelectorAll('[data-catalogue-gallery]')];
    const dialog=container.querySelector('.catalogue-viewer');
    if (!links.length || !dialog || typeof dialog.showModal !== "function" || dialog.dataset.bound) return;
    dialog.dataset.bound="true";
    const image=dialog.querySelector('img'),caption=dialog.querySelector('figcaption');
    let current=0;
    const show=index=>{current=(index+links.length)%links.length;const link=links[current];image.src=link.href;image.alt=link.querySelector('img')?.alt || "";caption.textContent=image.alt;if(!dialog.open){dialog.showModal();document.body.classList.add('is-catalogue-viewer-open');}};
    links.forEach((link,index)=>link.addEventListener('click',event=>{if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;event.preventDefault();show(index);}));
    dialog.querySelector('[data-catalogue-close]').addEventListener('click',()=>dialog.close());
    dialog.querySelector('[data-catalogue-prev]').addEventListener('click',()=>show(current-1));
    dialog.querySelector('[data-catalogue-next]').addEventListener('click',()=>show(current+1));
    dialog.addEventListener('click',event=>{if(event.target===dialog || event.target.classList.contains('catalogue-viewer__stage'))dialog.close();});
    dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}});
    dialog.addEventListener('close',()=>document.body.classList.remove('is-catalogue-viewer-open'));
  }
  window.MP_EDITORIAL = { works, project, bindGallery, orderedWorks };
})();
