const hero = document.getElementById("heroVisual");
const textCanvas = document.getElementById("textCanvas");
const blobCanvas = document.getElementById("blobCanvas");

const textCtx = textCanvas.getContext("2d", { alpha: true });
const blobCtx = blobCanvas.getContext("2d", { alpha: true });

const isMobile = window.matchMedia("(max-width: 720px)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pageType = document.body.dataset.page || "home";
const isHomePage = pageType === "home";
const pageHueMap = {
  works: 142,
  project: 142,
  practice: 330,
  research: 272,
  cv: 214,
  contact: 4
};

let W = 0;
let H = 0;
let DPR = 1;

const FPS = prefersReducedMotion ? 6 : isMobile ? 10 : 12;
const MAX_BLOBS = 0;
const TEXT_COUNT = isHomePage ? (isMobile ? 19 : 26) : 0;
const MAX_CANVAS_PIXELS = isMobile ? 900000 : 1800000;

const pointer = {
  x: 0,
  y: 0,
  active: false,
  down: false
};

const snippetPairs = [
  {
    en: "Minnie Park works with real roses, touch, pink, sound and moving image to create affective experiences felt through the body.",
    ko: "Minnie Park는 생장미, 터치, 핑크, 사운드와 무빙이미지를 통해 신체로 느껴지는 정서적 경험을 만든다."
  },
  {
    en: "In Meta Rose, the pink rose shifts between living matter, interface, image, body, memorial and data trace.",
    ko: "Meta Rose 안에서 핑크 장미는 살아 있는 물질, 인터페이스, 이미지, 신체, 기념물과 데이터 흔적 사이를 이동한다."
  },
  {
    en: "Pink operates as emotional material: an atmosphere, a frequency and a force experienced through the body.",
    ko: "핑크는 표면의 색이 아니라 신체로 경험되는 분위기이자 주파수이며 감정적 힘으로 작동한다."
  },
  {
    en: "Ambivalence unfolds as attraction and resistance, tenderness and friction, felt at once.",
    ko: "양가성은 끌림과 저항, 다정함과 마찰이 동시에 감각되는 상태로 펼쳐진다."
  },
  {
    en: "Simultaneity holds bloom and decay, life and death, within the same present.",
    ko: "동시성은 피어남과 소멸, 생과 사가 같은 현재 안에 머물게 한다."
  },
  {
    en: "Each rose carries a contradiction: fragile yet insistent, organic yet mediated.",
    ko: "각 장미는 연약하지만 끈질기고, 유기적이지만 매개된 존재라는 모순을 품는다."
  },
  {
    en: "The work moves through dualities: pink and grey, softness and friction, intimacy and distance.",
    ko: "작품은 핑크와 회색, 부드러움과 마찰, 친밀함과 거리감이라는 이중성 사이를 이동한다."
  },
  {
    en: "Living roses bring fragility, scent, texture and material time into contact with responsive digital systems.",
    ko: "생장미의 연약함, 향, 질감과 물질적 시간은 반응형 디지털 시스템과 접촉한다."
  },
  {
    en: "Interactivity turns touch into a signal connecting the participant’s body with colour, sound and moving image.",
    ko: "인터랙션은 터치를 참여자의 신체와 색, 사운드, 무빙이미지를 연결하는 신호로 바꾼다."
  },
  {
    en: "Each Meta Rose chapter develops a distinct visual, sonic and spatial system around a new emotional question.",
    ko: "Meta Rose의 각 장은 새로운 감정적 질문을 중심으로 서로 다른 비주얼, 사운드와 공간 시스템을 구성한다."
  },
  {
    en: "Responsive systems do not explain emotion; they let its tensions be felt in real time.",
    ko: "반응형 시스템은 감정을 설명하지 않고 그 안의 긴장을 실시간으로 감각하게 한다."
  },
  {
    en: "Emotion is embodied and culturally situated, formed through memory, language, environment and relation.",
    ko: "감정은 기억, 언어, 환경과 관계 속에서 신체적이고 문화적으로 형성된다."
  }
];

const voiceFragments = [
  "터치는 신호가 되고",
  "신호는 색이 된다",
  "색은",
  "정서적 분위기가",
  "됩니다"
];

const hues = [
  224, // cobalt blue
  248, // soft violet
  352, // rose coral
  24,  // warm apricot
  150, // mineral green
  174  // cyan teal
];

const activeHues = isHomePage ? hues : [pageHueMap[pageType] || 142];

if (isHomePage) {
  textCanvas.style.display = "block";
} else {
  textCanvas.style.display = "none";
}

let blobs = [];
let texts = [];
let lastScrollSpawnY = 0;
let lastScrollSpawnAt = 0;
let lastScrollY = 0;
let maxSeededScrollBottom = 0;
let isFormActive = false;
let sceneInitialized = false;
let resizeFrame = 0;
let layoutRefreshFrame = 0;
let animationFrame = 0;
let isVisualInView = true;
let lastTextDrawAt = 0;
let visualActiveUntil = performance.now() + 1800;
let lastBottomSeedAt = 0;
let lastPageEndSeedKey = "";
let layoutObserver = null;
let landingCopyExclusionRects = [];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPageDensity() {
  return isHomePage ? 1 : 0;
}

function getMaxBlobCount() {
  return Math.round(MAX_BLOBS * getPageDensity());
}

function getTextCount() {
  return Math.round(TEXT_COUNT * getPageDensity());
}

function getInitialViewportTextCount() {
  return isHomePage ? (isMobile ? 4 : 5) : 0;
}

function getInitialAnchoredTextCount() {
  const viewportTextCount = getInitialViewportTextCount();
  const currentInitialTotal = getTextCount() + viewportTextCount;
  const reducedInitialTotal = Math.round(currentInitialTotal * 0.6561);

  return Math.max(0, reducedInitialTotal - viewportTextCount);
}

function getContentRect(element, includeElementBox = false) {
  if (includeElementBox) return element.getBoundingClientRect();

  const range = document.createRange();
  range.selectNodeContents(element);
  const textRect = range.getBoundingClientRect();

  return textRect.width && textRect.height ? textRect : element.getBoundingClientRect();
}

function getPaddedGroupRect(selector, padX, padY, boxedSelector = "") {
  const elements = Array.from(document.querySelectorAll(selector));
  if (elements.length === 0) return null;

  const rects = elements
    .map((element) => getContentRect(element, boxedSelector && element.matches(boxedSelector)))
    .filter((rect) => rect.width && rect.height);

  if (rects.length === 0) return null;

  return {
    left: Math.max(0, Math.min(...rects.map((rect) => rect.left)) - padX),
    top: Math.max(0, Math.min(...rects.map((rect) => rect.top)) - padY),
    right: Math.min(W, Math.max(...rects.map((rect) => rect.right)) + padX),
    bottom: Math.min(H, Math.max(...rects.map((rect) => rect.bottom)) + padY)
  };
}

function refreshLandingCopyExclusions() {
  if (!isHomePage) {
    landingCopyExclusionRects = [];
    return;
  }

  const topRect = getPaddedGroupRect(
    ".landing-top h1, .landing-top .eyebrow",
    isMobile ? 22 : 48,
    isMobile ? 18 : 34
  );
  const bottomRect = getPaddedGroupRect(
    ".landing-bottom .hero-main, .landing-bottom .hero-note, .landing-bottom .page-actions",
    isMobile ? 18 : 38,
    isMobile ? 16 : 30,
    ".page-actions"
  );

  landingCopyExclusionRects = [topRect, bottomRect].filter(Boolean);
}

function getTextBlockBounds(text) {
  textCtx.save();
  textCtx.font = `${text.size}px "Courier New", "SFMono-Regular", "Apple SD Gothic Neo", Pretendard, ui-monospace, monospace`;

  let minIndent = 0;
  let maxLineRight = 0;

  text.lines.forEach((line, index) => {
    const indent = text.lineStyles[index]?.indent || 0;
    minIndent = Math.min(minIndent, indent);
    maxLineRight = Math.max(
      maxLineRight,
      indent + textCtx.measureText(line).width * (isMobile ? 1.08 : 1.16)
    );
  });

  textCtx.restore();

  const margin = isMobile ? 16 : 24;
  const lineHeight = text.size * (isMobile ? 1.15 : 1.22);

  return {
    left: text.x + minIndent - margin,
    top: text.y - margin,
    right: text.x + maxLineRight + margin,
    bottom: text.y + text.rowCount * lineHeight + margin
  };
}

function rectanglesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function overlapsLandingCopy(rect) {
  return landingCopyExclusionRects.some((exclusionRect) => rectanglesOverlap(rect, exclusionRect));
}

function getDefaultTextSafeAnchors() {
  return isMobile
    ? [
        [0.03, 0.3], [0.48, 0.31], [0.16, 0.39], [0.6, 0.42],
        [0.02, 0.5], [0.42, 0.53], [0.18, 0.61], [0.64, 0.64],
        [0.04, 0.7], [0.46, 0.72]
      ]
    : [
        [0.5, 0.12], [0.76, 0.17], [0.04, 0.3], [0.34, 0.32],
        [0.66, 0.34], [0.84, 0.4], [0.08, 0.47], [0.4, 0.49],
        [0.7, 0.52], [0.02, 0.61], [0.3, 0.64], [0.61, 0.67],
        [0.82, 0.7], [0.1, 0.76]
      ];
}

function placeDefaultTextAwayFromCopy(text, index = 0) {
  if (text.burst || !overlapsLandingCopy(getTextBlockBounds(text))) return true;

  const safeAnchors = getDefaultTextSafeAnchors();
  const originalX = text.x;
  const originalY = text.y;

  for (let attempt = 0; attempt < safeAnchors.length * 2; attempt++) {
    const anchor = safeAnchors[(index + attempt) % safeAnchors.length];
    const seed = (index + 1) * 41.7 + attempt * 17.3;
    text.x = anchor[0] * W + randFrom(seed, isMobile ? -18 : -42, isMobile ? 18 : 42);
    text.y = anchor[1] * H + randFrom(seed + 9.1, isMobile ? -14 : -30, isMobile ? 14 : 30);

    if (!overlapsLandingCopy(getTextBlockBounds(text))) return true;
  }

  text.x = originalX;
  text.y = originalY;
  return false;
}

function clearDefaultTextsFromLandingCopy() {
  if (landingCopyExclusionRects.length === 0) return;

  texts = texts.filter((text, index) => {
    if (text.burst || !overlapsLandingCopy(getTextBlockBounds(text))) return true;
    return placeDefaultTextAwayFromCopy(text, index);
  });
}

function keepDefaultTextOutsideLandingCopy(text) {
  if (text.burst || landingCopyExclusionRects.length === 0) return;

  for (let pass = 0; pass < landingCopyExclusionRects.length + 1; pass++) {
    const bounds = getTextBlockBounds(text);
    const exclusionRect = landingCopyExclusionRects.find((rect) => rectanglesOverlap(bounds, rect));
    if (!exclusionRect) return;

    const gap = isMobile ? 10 : 16;
    const candidates = [
      { dx: exclusionRect.left - bounds.right - gap, dy: 0, axis: "x" },
      { dx: exclusionRect.right - bounds.left + gap, dy: 0, axis: "x" },
      { dx: 0, dy: exclusionRect.top - bounds.bottom - gap, axis: "y" },
      { dx: 0, dy: exclusionRect.bottom - bounds.top + gap, axis: "y" }
    ]
      .map((candidate) => {
        const moved = {
          left: bounds.left + candidate.dx,
          right: bounds.right + candidate.dx,
          top: bounds.top + candidate.dy,
          bottom: bounds.bottom + candidate.dy
        };
        const outsideAllCopy = !overlapsLandingCopy(moved);
        const insideVisualField =
          moved.right > 12 && moved.left < W - 12 && moved.bottom > 12 && moved.top < H - 12;

        return {
          ...candidate,
          valid: outsideAllCopy && insideVisualField,
          distance: Math.abs(candidate.dx) + Math.abs(candidate.dy)
        };
      })
      .filter((candidate) => candidate.valid)
      .sort((a, b) => a.distance - b.distance);

    const move = candidates[0];
    if (!move) {
      if (!placeDefaultTextAwayFromCopy(text, Math.floor(text.phase * 100))) {
        text.life = 0;
      }
      return;
    }

    text.x += move.dx;
    text.y += move.dy;

    if (move.axis === "x") text.vx *= -0.72;
    else text.vy *= -0.72;
  }
}

function positionStaticBaseTextsAwayFromCopy() {
  const spans = Array.from(document.querySelectorAll(".hero-visual__text-base span"));
  if (spans.length === 0 || landingCopyExclusionRects.length === 0) return;

  const safeAnchors = getDefaultTextSafeAnchors();

  spans.forEach((span, index) => {
    span.style.visibility = "hidden";

    if (!overlapsLandingCopy(span.getBoundingClientRect())) {
      span.style.visibility = "";
      return;
    }

    span.style.right = "auto";
    span.style.bottom = "auto";
    let placed = false;

    for (let attempt = 0; attempt < safeAnchors.length * 2; attempt++) {
      const anchor = safeAnchors[(index * 2 + attempt) % safeAnchors.length];
      const seed = (index + 1) * 67.9 + attempt * 13.7;
      span.style.left = `${anchor[0] * W + randFrom(seed, isMobile ? -14 : -34, isMobile ? 14 : 34)}px`;
      span.style.top = `${anchor[1] * H + randFrom(seed + 5.3, isMobile ? -12 : -24, isMobile ? 12 : 24)}px`;

      const bounds = span.getBoundingClientRect();
      const visibleInViewport = bounds.right > 8 && bounds.left < W - 8 && bounds.bottom > 8 && bounds.top < H - 8;

      if (!overlapsLandingCopy(bounds) && visibleInViewport) {
        placed = true;
        break;
      }
    }

    span.style.visibility = placed ? "" : "hidden";
  });
}

function wakeVisual(duration = 1400) {
  visualActiveUntil = Math.max(visualActiveUntil, performance.now() + duration);
}

function resize() {
  wakeVisual(1200);

  const previousWidth = W;
  const previousHeight = H;

  W = window.innerWidth;
  H = window.innerHeight;

  const deviceDpr = window.devicePixelRatio || 1;
  const pixelSafeDpr = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, W * H));
  DPR = Math.max(0.65, Math.min(deviceDpr, isMobile ? 0.85 : 0.95, pixelSafeDpr));

  hero.style.width = `${W}px`;
  hero.style.height = `${H}px`;

  for (const canvas of [textCanvas, blobCanvas]) {
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
  }

  textCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  blobCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  lastTextDrawAt = 0;
  refreshLandingCopyExclusions();
  positionStaticBaseTextsAwayFromCopy();

  const shouldResetScene = !sceneInitialized || Math.abs(W - previousWidth) > 12;

  if (shouldResetScene) {
    initScene();
    sceneInitialized = true;
    return;
  }

  lastScrollY = window.scrollY;
  maxSeededScrollBottom = Math.max(maxSeededScrollBottom, window.scrollY + window.innerHeight);
  clearDefaultTextsFromLandingCopy();
  updateVisualVisibility();

  if (Math.abs(H - previousHeight) > 80) {
    seedPageEndVisuals(true);
  }

  draw(performance.now() * 0.001);
}

class Blob {
  constructor(x, y, radius, hue, strong = false) {
    this.x = x;
    this.y = y;
    this.vx = rand(-6.4, 6.4);
    this.vy = rand(-5.5, 5.5);
    this.radius = radius;
    this.baseRadius = radius;
    this.hue = hue;
    this.phase = rand(0, Math.PI * 2);
    this.speed = rand(0.2, 0.46);
    this.sx = rand(0.9, 1.85);
    this.sy = rand(0.7, 1.35);
    this.rot = rand(-Math.PI, Math.PI);
    this.opacity = strong ? rand(0.66, 0.86) : rand(0.48, 0.78);
    this.life = 1;
    this.decay = strong ? 0.01 : 0;
  }

  update(dt, t) {
    const driftX = Math.sin(t * this.speed + this.phase) * 5.8;
    const driftY = Math.cos(t * this.speed * 0.9 + this.phase) * 5;

    this.x += (this.vx + driftX) * dt;
    this.y += (this.vy + driftY) * dt;

    this.rot += Math.sin(t * 0.14 + this.phase) * 0.002;

    if (pointer.active) {
      const dx = this.x - pointer.x;
      const dy = this.y - pointer.y;
      const d = Math.hypot(dx, dy);
      const avoidRadius = pointer.down ? 260 : 190;

      if (d < avoidRadius && d > 0.01) {
        const force = (avoidRadius - d) / avoidRadius;
        this.vx += (dx / d) * force * (pointer.down ? 34 : 16) * dt;
        this.vy += (dy / d) * force * (pointer.down ? 34 : 16) * dt;
      }
    }

    this.vx *= 0.992;
    this.vy *= 0.992;

    const margin = this.radius * 1.8;
    if (this.x < -margin) this.x = W + margin;
    if (this.x > W + margin) this.x = -margin;
    if (this.y < -margin) this.y = H + margin;
    if (this.y > H + margin) this.y = -margin;

    if (this.decay > 0) {
      this.life -= this.decay * dt;
    }
  }

  draw(ctx, t) {
    if (isMobile) {
      this.drawSoft(ctx, t);
      return;
    }

    const points = 28;
    const morph = Math.sin(t * 0.28 + this.phase) * 0.09;
    const animatedRadius = this.baseRadius * (1 + Math.sin(t * 0.17 + this.phase) * 0.06);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(this.sx + morph, this.sy - morph * 0.5);
    ctx.globalAlpha = Math.max(0, this.opacity * this.life);

    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2;
      const wave =
        1 +
        Math.sin(a * 3 + t * 0.42 + this.phase) * 0.1 +
        Math.cos(a * 5 - t * 0.24 + this.phase) * 0.07;

      const r = animatedRadius * wave;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();

    const hueShift = this.hue + Math.sin(t * 0.18 + this.phase) * (isHomePage ? 28 : 8);
    const gradient = ctx.createRadialGradient(
      -animatedRadius * 0.25,
      -animatedRadius * 0.2,
      animatedRadius * 0.05,
      0,
      0,
      animatedRadius * 1.25
    );

    gradient.addColorStop(0, `hsla(${hueShift + 18}, 98%, 68%, 0.96)`);
    gradient.addColorStop(0.38, `hsla(${hueShift}, 94%, 56%, 0.72)`);
    gradient.addColorStop(0.78, `hsla(${hueShift - 28}, 88%, 62%, 0.3)`);
    gradient.addColorStop(1, `hsla(${hueShift - 34}, 84%, 62%, 0)`);

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  drawSoft(ctx, t) {
    const morph = Math.sin(t * 0.28 + this.phase) * 0.09;
    const animatedRadius = this.baseRadius * (1 + Math.sin(t * 0.17 + this.phase) * 0.06);
    const petalCount = 5;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(this.sx + morph, this.sy - morph * 0.5);
    ctx.globalAlpha = Math.max(0, this.opacity * this.life);
    ctx.globalCompositeOperation = "source-over";

    for (let i = 0; i < petalCount; i++) {
      const seed = this.phase * 1000 + i * 19.19;
      const angle = (i / petalCount) * Math.PI * 2 + Math.sin(seed) * 0.7;
      const offset = animatedRadius * randFrom(seed, 0.02, 0.24);
      const petalRadius = animatedRadius * randFrom(seed * 1.3, 0.72, 1.12);
      const px = Math.cos(angle + t * 0.018) * offset;
      const py = Math.sin(angle - t * 0.016) * offset;
      const hueShift = this.hue + Math.sin(t * 0.14 + this.phase + i) * (isHomePage ? 22 : 7);
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, petalRadius);

      gradient.addColorStop(0, `hsla(${hueShift + 18}, 98%, 68%, 0.46)`);
      gradient.addColorStop(0.36, `hsla(${hueShift}, 94%, 56%, 0.32)`);
      gradient.addColorStop(0.72, `hsla(${hueShift - 28}, 88%, 62%, 0.13)`);
      gradient.addColorStop(1, `hsla(${hueShift - 34}, 84%, 62%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, petalRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class TextBlock {
  constructor(x, y, burst = false, language = "en") {
    this.x = x;
    this.y = y;
    this.vx = rand(-3.4, 3.4);
    this.vy = rand(-2.8, 2.8);
    this.phase = rand(0, Math.PI * 2);
    this.size = burst ? rand(10, 14) : rand(isMobile ? 9 : 10, isMobile ? 12 : 14);
    this.cols = Math.floor(rand(isMobile ? 18 : 28, isMobile ? 33 : 52));
    this.rowCount = 1;
    this.alpha = burst ? 0.82 : rand(0.82, 0.9);
    this.rot = rand(isMobile ? -0.018 : -0.035, isMobile ? 0.018 : 0.035);
    this.changeEvery = rand(12, 22);
    this.lastChange = 0;
    this.burst = burst;
    this.language = language;
    this.life = 1;
    this.createdAt = performance.now();
    this.lifetime = burst ? rand(70000, 90000) : rand(95000, 135000);
    this.setText();
  }

  setText() {
    const source = pick(snippetPairs)[this.language].replace(/\s+/g, " ").trim();
    const words = source.split(" ");
    const lines = [];
    let line = "";
    const lineWidthMin = isMobile ? 0.72 : 0.58;
    const lineWidthMax = isMobile ? 0.98 : 1.1;
    let lineLimit = Math.max(12, Math.floor(this.cols * rand(lineWidthMin, lineWidthMax)));

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= lineLimit || line.length === 0) {
        line = candidate;
        return;
      }
      lines.push(line);
      line = word;
      lineLimit = Math.max(12, Math.floor(this.cols * rand(lineWidthMin, lineWidthMax)));
    });

    if (line) lines.push(line);

    this.lines = lines;
    this.rowCount = lines.length;
    this.rowSeed = rand(0, 1000);
    const estimatedWidth = this.cols * this.size * 0.58;

    this.lineStyles = lines.map((_, index) => {
      const seed = this.rowSeed + (index + 1) * 7.31;

      return {
        indent: randFrom(seed, isMobile ? -0.03 : -0.14, isMobile ? 0.09 : 0.3) * estimatedWidth,
        lift: randFrom(seed + 1.7, isMobile ? -0.1 : -0.22, isMobile ? 0.1 : 0.22) * this.size,
        rotation: randFrom(seed + 3.4, isMobile ? -0.008 : -0.024, isMobile ? 0.008 : 0.024),
        opacity: randFrom(seed + 5.1, isMobile ? 0.92 : 0.9, 1)
      };
    });
  }

  update(dt, t, now) {
    this.x += this.vx * dt + Math.sin(t * 0.18 + this.phase) * 0.04;
    this.y += this.vy * dt + Math.cos(t * 0.17 + this.phase) * 0.04;

    if (pointer.active) {
      const dx = this.x - pointer.x;
      const dy = this.y - pointer.y;
      const d = Math.hypot(dx, dy);
      const avoidRadius = 125;

      if (d < avoidRadius && d > 0.01) {
        const force = (avoidRadius - d) / avoidRadius;
        this.vx += (dx / d) * force * 10 * dt;
        this.vy += (dy / d) * force * 10 * dt;
      }
    }

    this.vx *= 0.994;
    this.vy *= 0.994;

    const margin = 190;
    if (this.x < -margin) this.x = W + margin;
    if (this.x > W + margin) this.x = -margin;
    if (this.y < -margin) this.y = H + margin;
    if (this.y > H + margin) this.y = -margin;

    if (!isMobile && t - this.lastChange > this.changeEvery) {
      this.cols = Math.floor(rand(28, 52));
      this.setText();
      this.lastChange = t;
    }

    const progress = Math.min(1, Math.max(0, (now - this.createdAt) / this.lifetime));
    this.life = progress < 0.58 ? 1 : 1 - (progress - 0.58) / 0.42;
    keepDefaultTextOutsideLandingCopy(this);
  }

  draw(ctx, t) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot + Math.sin(t * 0.18 + this.phase) * (isMobile ? 0.012 : 0.025));

    ctx.font = `${this.size}px "Courier New", "SFMono-Regular", "Apple SD Gothic Neo", Pretendard, ui-monospace, monospace`;
    ctx.fillStyle = "rgba(28, 27, 25, 0.84)";
    const blockAlpha = Math.max(0, this.alpha * this.life);
    ctx.globalAlpha = blockAlpha;
    ctx.textBaseline = "top";

    const charH = this.size * (isMobile ? 1.15 : 1.22);
    const spaceWidth = ctx.measureText(" ").width;

    this.lines.forEach((line, row) => {
      const waveX =
        Math.sin(t * 0.28 + row * 0.31 + this.phase) * 1.5 +
        Math.cos(t * 0.18 + row * 0.21) * 0.8;

      const waveY =
        Math.cos(t * 0.26 + row * 0.28 + this.phase) * 1.1 +
        Math.sin(t * 0.14 + row * 0.14) * 0.6;

      const style = this.lineStyles[row];
      const words = line.split(" ");

      ctx.save();
      ctx.translate(style.indent + waveX, row * charH + style.lift + waveY);
      ctx.rotate(style.rotation);

      let cursorX = 0;

      words.forEach((word, index) => {
        const seed = this.rowSeed + row * 31.7 + index * 17.3;
        const offsetX = randFrom(seed + 2.2, isMobile ? -0.03 : -0.1, isMobile ? 0.07 : 0.18) * this.size;
        const offsetY = randFrom(seed + 4.4, isMobile ? -0.16 : -0.36, isMobile ? 0.16 : 0.36) * this.size;
        const wordAlpha = randFrom(seed + 6.6, isMobile ? 0.88 : 0.87, 1);

        ctx.globalAlpha = blockAlpha * style.opacity * wordAlpha;
        ctx.fillText(word, cursorX + offsetX, offsetY);

        cursorX +=
          ctx.measureText(word).width +
          spaceWidth * randFrom(seed + 8.8, isMobile ? 0.82 : 0.52, isMobile ? 1.26 : 1.72);
      });

      ctx.restore();
    });

    ctx.restore();
  }
}

function randFrom(seed, min, max) {
  const normalized = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return normalized * (max - min) + min;
}

function balancedTextLanguage() {
  const englishCount = texts.reduce((count, text) => count + (text.language === "en" ? 1 : 0), 0);
  const koreanCount = texts.length - englishCount;
  return englishCount <= koreanCount ? "en" : "ko";
}

function initScene() {
  blobs = [];
  texts = [];
  lastTextDrawAt = 0;
  lastPageEndSeedKey = "";
  lastScrollY = window.scrollY;
  maxSeededScrollBottom = window.scrollY + window.innerHeight;

  const density = getPageDensity();
  const initialBlobCount = Math.round(MAX_BLOBS * density);
  const clusterSpreadX = isMobile ? W * 0.16 : W * 0.18;
  const clusterSpreadY = window.innerHeight * (isMobile ? 0.12 : 0.16);
  const blobAnchors = [
    [0.5, 0.035], [0.72, 0.09], [0.28, 0.14],
    [0.56, 0.08], [0.32, 0.2], [0.68, 0.34],
    [0.42, 0.5], [0.64, 0.66], [0.28, 0.84]
  ];

  for (let i = 0; i < initialBlobCount; i++) {
    const clustered = i < initialBlobCount * 0.78;
    const anchor = blobAnchors[i % blobAnchors.length];
    const angle = rand(0, Math.PI * 2);
    const distance = Math.pow(Math.random(), 1.8);
    const clusterX = clustered
      ? anchor[0] * W + Math.cos(angle) * clusterSpreadX * distance
      : rand(-W * 0.08, W * 1.08);
    const clusterY = clustered
      ? anchor[1] * H + Math.sin(angle) * clusterSpreadY * distance
      : rand(-H * 0.08, H * 1.08);

    blobs.push(
      new Blob(
        clusterX,
        clusterY,
        rand(isMobile ? 58 : 82, isMobile ? 128 : 190),
        pick(activeHues)
      )
    );
  }

  const textAnchors = [
    [-0.05, 0.012], [0.12, 0.08], [0.54, 0.12], [0.82, 0.18],
    [0.08, 0.18], [0.18, 0.54], [0.02, 0.78],
    [0.34, 0.04], [0.43, 0.34], [0.48, 0.66],
    [0.72, 0.02], [0.82, 0.22], [0.88, 0.58], [0.74, 0.78],
    [0.57, 0.44], [0.28, 0.82]
  ];

  for (let i = 0; i < getInitialAnchoredTextCount(); i++) {
    const anchor = textAnchors[i % textAnchors.length];
    texts.push(
      new TextBlock(
        anchor[0] * W + rand(-70, 70),
        anchor[1] * H + rand(-55, 55),
        false,
        balancedTextLanguage()
      )
    );
  }

  seedViewport(0, true);
  clearDefaultTextsFromLandingCopy();
  seedPageEndVisuals();

  draw(performance.now() * 0.001);
}

function seedViewport(scrollY = 0, initial = false) {
  const top = 0;
  const bottom = H;
  const density = getPageDensity();
  const blobCount = MAX_BLOBS > 0
    ? Math.max(1, Math.round((initial ? (isMobile ? 2 : 3) : 1) * density))
    : 0;
  const textCount = isHomePage ? (initial ? getInitialViewportTextCount() : blobCount) : 0;
  const spawnBottom = bottom - window.innerHeight * 0.08;

  for (let i = 0; i < blobCount; i++) {
    const y = rand(top + window.innerHeight * 0.12, spawnBottom);
    const x = rand(-W * 0.06, W * 1.06);
    spawnBlob(x, y, initial ? 0.82 : 0.9);
  }

  for (let i = 0; i < textCount; i++) {
    spawnText(
      rand(-W * 0.08, W * 0.92),
      rand(top + window.innerHeight * 0.08, spawnBottom),
      !initial
    );
  }
}

function seedPageEndVisuals(force = false) {
  const seedKey = `viewport:${Math.round(W / 40)}:${Math.round(H / 40)}`;

  if (!force && seedKey === lastPageEndSeedKey) return;
  lastPageEndSeedKey = seedKey;
}

function spawnBlob(x, y, scale = 1, strong = true) {
  if (MAX_BLOBS === 0) return;
  blobs.push(
    new Blob(
      x,
      y,
      rand(isMobile ? 58 : 78, isMobile ? 118 : 165) * scale,
      pick(activeHues),
      strong
    )
  );

  while (blobs.length > getMaxBlobCount()) {
    blobs.shift();
  }
}

function spawnText(x, y, burst = true) {
  if (!isHomePage) return;

  while (texts.length >= getTextCount() + 5) {
    texts.shift();
  }

  const text = new TextBlock(x, y, burst, balancedTextLanguage());
  const estimatedWidth = text.cols * text.size * 0.66;
  const estimatedHeight = text.rowCount * text.size * 1.04;

  text.x = x - estimatedWidth * rand(0.18, 0.82) + rand(-90, 90);
  text.y = y - estimatedHeight * rand(0.18, 0.82) + rand(-72, 72);

  texts.push(text);
}

function spawnPointerVisuals(x, y) {
  const textX = x + rand(-120, 120);
  const textY = y + rand(-96, 96);

  spawnText(textX, textY);
}

function ensureBottomVisualAt(y) {
  return;
}

function spawnScrollVisuals() {
  if (prefersReducedMotion) return;

  const now = performance.now();
  const currentScrollY = window.scrollY;
  const isScrollingDown = currentScrollY > lastScrollY;
  const scrollDelta = Math.abs(currentScrollY - lastScrollSpawnY);

  lastScrollY = currentScrollY;

  if (!isScrollingDown) return;

  if (scrollDelta < (isMobile ? 420 : 640) || now - lastScrollSpawnAt < 700) return;

  lastScrollSpawnY = currentScrollY;
  lastScrollSpawnAt = now;
  seedViewport(0, false);
}

function update(dt, t, now) {
  for (const blob of blobs) blob.update(dt, t);
  for (const text of texts) text.update(dt, t, now);

  blobs = blobs.filter((b) => b.life > 0.03);
  texts = texts.filter((txt) => txt.life > 0.03);
}

function draw(t) {
  const shouldDrawText =
    isHomePage &&
    (lastTextDrawAt === 0 || performance.now() - lastTextDrawAt > (prefersReducedMotion ? 1000 : 260));

  if (shouldDrawText) {
    textCtx.clearRect(0, 0, W, H);

    for (const text of texts) {
      text.draw(textCtx, t);
    }

    lastTextDrawAt = performance.now();
  }

  blobCtx.clearRect(0, 0, W, H);
  blobCtx.globalCompositeOperation = "source-over";

  for (const blob of blobs) {
    blob.drawSoft(blobCtx, t);
  }
}

let last = performance.now();
const frameInterval = 1000 / FPS;

function animate(now) {
  animationFrame = requestAnimationFrame(animate);

  if (document.hidden || !isVisualInView) {
    last = now;
    return;
  }

  if (isFormActive) {
    last = now;
    return;
  }

  const isActiveVisual = pointer.down || now < visualActiveUntil;
  const targetInterval = isActiveVisual ? frameInterval : 1000;
  const delta = now - last;

  if (delta < targetInterval) return;

  const dt = Math.min(delta / 1000, 0.045);
  last = now - (delta % targetInterval);

  const t = now * 0.001;

  update(dt, t, now);
  draw(t);
}

function updatePointer(event) {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
  wakeVisual(900);
}

let audioContext = null;
let audioMaster = null;
let lastAudioTouch = 0;
let voiceFragmentIndex = 0;

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function textSeed(text) {
  let seed = 0;

  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }

  return seed || 1;
}

function ensureAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
    audioMaster = audioContext.createGain();
    audioMaster.gain.value = 0.42;
    audioMaster.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function createTextNoiseBuffer(ctx, seed, duration) {
  const random = seededRandom(seed);
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const pulseCount = 5 + Math.floor(random() * 6);

  for (let i = 0; i < length; i++) {
    const progress = i / length;
    const attack = Math.min(1, progress / 0.06);
    const release = Math.min(1, (1 - progress) / 0.28);
    const envelope = Math.sin(progress * Math.PI) * attack * release;
    const pulse = Math.sin(progress * Math.PI * pulseCount) > 0.12 ? 1 : 0.35;
    const crackle = random() > 0.985 ? random() * 2 - 1 : 0;

    data[i] = ((random() * 2 - 1) * pulse + crackle * 0.7) * envelope;
  }

  return buffer;
}

function playTextNoise(xRatio = 0.5, yRatio = 0.5) {
  const ctx = ensureAudio();
  if (!ctx || !audioMaster) return;

  const now = ctx.currentTime;
  const text = voiceFragments[voiceFragmentIndex % voiceFragments.length];
  voiceFragmentIndex += 1;
  const seed = textSeed(text);
  const random = seededRandom(seed + Math.floor(xRatio * 1000));
  const duration = 0.2 + random() * 0.18;
  const source = ctx.createBufferSource();
  const highpass = ctx.createBiquadFilter();
  const formantA = ctx.createBiquadFilter();
  const formantB = ctx.createBiquadFilter();
  const gainA = ctx.createGain();
  const gainB = ctx.createGain();
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  const output = ctx.createGain();
  const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

  source.buffer = createTextNoiseBuffer(ctx, seed, duration);
  highpass.type = "highpass";
  highpass.frequency.value = 240 + yRatio * 420;

  formantA.type = "bandpass";
  formantA.frequency.value = 520 + random() * 820 + xRatio * 300;
  formantA.Q.value = 7 + random() * 8;

  formantB.type = "bandpass";
  formantB.frequency.value = 1450 + random() * 1600 + yRatio * 500;
  formantB.Q.value = 5 + random() * 7;

  gainA.gain.value = 0.92;
  gainB.gain.value = 0.52;

  tone.type = random() > 0.5 ? "triangle" : "sine";
  tone.frequency.setValueAtTime(90 + random() * 160 + xRatio * 80, now);
  tone.frequency.exponentialRampToValueAtTime(55 + random() * 80, now + duration);

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.22 + random() * 0.1, now + 0.01);
  output.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  toneGain.gain.setValueAtTime(0.0001, now);
  toneGain.gain.exponentialRampToValueAtTime(0.03, now + 0.018);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.9);

  source.connect(highpass);
  highpass.connect(formantA);
  highpass.connect(formantB);
  formantA.connect(gainA);
  formantB.connect(gainB);
  gainA.connect(output);
  gainB.connect(output);
  tone.connect(toneGain);
  toneGain.connect(output);

  if (panner) {
    panner.pan.value = xRatio * 1.4 - 0.7;
    output.connect(panner);
    panner.connect(audioMaster);
  } else {
    output.connect(audioMaster);
  }

  source.start(now);
  tone.start(now);
  source.stop(now + duration);
  tone.stop(now + duration);
  playGlitchTicks(ctx, now, duration, random, output);
}

function playGlitchTicks(ctx, startTime, duration, random, destination) {
  const tickCount = 3 + Math.floor(random() * 5);

  for (let i = 0; i < tickCount; i++) {
    const tickTime = startTime + random() * duration * 0.82;
    const tickDuration = 0.018 + random() * 0.04;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.type = random() > 0.5 ? "square" : "sawtooth";
    oscillator.frequency.setValueAtTime(420 + random() * 2200, tickTime);
    oscillator.frequency.exponentialRampToValueAtTime(110 + random() * 320, tickTime + tickDuration);
    filter.type = "bandpass";
    filter.frequency.value = 700 + random() * 2600;
    filter.Q.value = 10 + random() * 16;
    gain.gain.setValueAtTime(0.0001, tickTime);
    gain.gain.exponentialRampToValueAtTime(0.055 + random() * 0.035, tickTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, tickTime + tickDuration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    oscillator.start(tickTime);
    oscillator.stop(tickTime + tickDuration);
  }
}

function playPointerAudio() {
  const now = performance.now();
  if (now - lastAudioTouch < 70) return;

  lastAudioTouch = now;
  playTextNoise(W > 0 ? pointer.x / W : 0.5, H > 0 ? pointer.y / H : 0.5);
}

if (isHomePage) {
window.addEventListener("pointermove", (event) => {
  updatePointer(event);
}, { passive: true });

window.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") return;

  wakeVisual(1800);
  markInteracted();
  updatePointer(event);
  pointer.down = true;

  if (!event.target.closest?.(".contact-form")) {
    isFormActive = false;
    document.body.classList.remove("is-form-active");
  }

  playPointerAudio();
  spawnPointerVisuals(pointer.x, pointer.y);
  ensureBottomVisualAt(pointer.y);
}, { passive: true });

window.addEventListener("touchstart", (event) => {
  wakeVisual(1800);
  markInteracted();
  const touch = event.touches[0];
  if (!touch) return;

  pointer.x = touch.clientX;
  pointer.y = touch.clientY;
  pointer.active = true;

  playPointerAudio();
  spawnPointerVisuals(pointer.x, pointer.y);
  ensureBottomVisualAt(pointer.y);
}, { passive: true });

window.addEventListener("pointerup", () => {
  pointer.down = false;
});

window.addEventListener("pointerleave", () => {
  pointer.active = false;
  pointer.down = false;
});

window.addEventListener("blur", () => {
  pointer.active = false;
  pointer.down = false;
});

window.addEventListener("resize", scheduleResize);
window.addEventListener("scroll", handleScroll, { passive: true });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    return;
  }

  last = performance.now();

  if (!prefersReducedMotion && animationFrame === 0) {
    animationFrame = requestAnimationFrame(animate);
  }
});
}

function scheduleResize() {
  if (resizeFrame) return;

  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    resize();
  });
}

function scheduleLayoutRefresh() {
  if (layoutRefreshFrame) return;

  layoutRefreshFrame = requestAnimationFrame(() => {
    layoutRefreshFrame = 0;
    scheduleResize();

    requestAnimationFrame(() => {
      if (!sceneInitialized) return;

      seedPageEndVisuals(true);
      draw(performance.now() * 0.001);
    });
  });
}

function initLayoutObservers() {
  window.addEventListener("load", scheduleResize, { once: true });
}

function handleScroll() {
  wakeVisual(900);
  updateVisualVisibility();
  spawnScrollVisuals();
}

function updateVisualVisibility() {
  isVisualInView = true;
}

function addClickPulse(selector) {
  document.querySelectorAll(selector).forEach((element) => {
    element.addEventListener("click", () => {
      element.classList.remove("is-clicked");
      void element.offsetWidth;
      element.classList.add("is-clicked");

      window.setTimeout(() => {
        element.classList.remove("is-clicked");
      }, 340);
    });
  });
}

function initCustomSelects() {
  document.querySelectorAll("[data-custom-select]").forEach((select) => {
    const trigger = select.querySelector(".custom-select-trigger");
    const input = select.querySelector("input[type='hidden']");
    const options = select.querySelectorAll("[role='option']");

    if (!trigger || !input || options.length === 0) return;

    trigger.addEventListener("click", () => {
      const isOpen = select.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.dataset.value || option.textContent.trim();

        input.value = value;
        trigger.textContent = value;
        select.classList.add("has-value");
        select.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");

        options.forEach((item) => item.setAttribute("aria-selected", "false"));
        option.setAttribute("aria-selected", "true");
      });
    });
  });

  document.addEventListener("click", (event) => {
    document.querySelectorAll("[data-custom-select].is-open").forEach((select) => {
      if (select.contains(event.target)) return;

      const trigger = select.querySelector(".custom-select-trigger");
      select.classList.remove("is-open");
      trigger?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll(".contact-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emptySelect = Array
        .from(form.querySelectorAll("[data-custom-select] input[required]"))
        .find((input) => !input.value);

      if (emptySelect) {
        const select = emptySelect.closest("[data-custom-select]");
        const trigger = select?.querySelector(".custom-select-trigger");
        const label = select?.querySelector("span")?.textContent?.trim() || "필수 항목";

        select?.classList.add("is-open");
        trigger?.setAttribute("aria-expanded", "true");
        trigger?.focus();
        alert(`${label}을 선택해 주세요.`);
        return;
      }

      if (!form.reportValidity()) return;

      await submitContactForm(form);
    });
  });
}

async function submitContactForm(form) {
  const status = form.querySelector(".form-status");
  const submitButton = form.querySelector("button[type='submit']");
  const formData = new FormData(form);

  formData.set("_subject", `Minnie Park artist inquiry — ${formData.get("name") || "new inquiry"}`);

  if (status) {
    status.textContent = "문의 내용을 전송하는 중입니다.";
    status.classList.remove("is-error", "is-success");
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "전송 중";
  }

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Form submission failed");
    }

    form.reset();
    form.querySelectorAll("[data-custom-select]").forEach((select) => {
      const trigger = select.querySelector(".custom-select-trigger");
      const options = select.querySelectorAll("[role='option']");

      select.classList.remove("has-value", "is-open");
      trigger.textContent = "";
      trigger.setAttribute("aria-expanded", "false");
      options.forEach((option) => option.setAttribute("aria-selected", "false"));
    });

    if (status) {
      status.textContent = "문의가 등록되었습니다. 확인 후 이메일로 답변드릴게요.";
      status.classList.add("is-success");
    }

    isFormActive = false;
    document.body.classList.remove("is-form-active");
    document.activeElement?.blur?.();
    seedPageEndVisuals();
    draw(performance.now() * 0.001);
  } catch (error) {
    if (status) {
      status.textContent = "전송에 실패했습니다. 잠시 후 다시 시도하거나 이메일로 직접 문의해 주세요.";
      status.classList.add("is-error");
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "문의 보내기";
    }
  }
}

function initFormPerformanceMode() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("focusin", () => {
    isFormActive = true;
    document.body.classList.add("is-form-active");
  });

  form.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (form.contains(document.activeElement)) return;

      isFormActive = false;
      document.body.classList.remove("is-form-active");
    }, 80);
  });
}

function markInteracted() {
  document.body.classList.add("has-interacted");
  window.setTimeout(() => {
    document.body.classList.add("is-hint-gone");
  }, 1300);
}

function initInteractionHint() {
  const hints = document.querySelectorAll(".interaction-hint");
  if (hints.length === 0) return;

  hints.forEach(randomizeInteractionHint);
}

function randomizeInteractionHint(hint) {
  const hintHues = [24, 34, 142, 150, 174, 206, 224, 248, 318, 352];
  const shuffledHues = [...hintHues].sort(() => Math.random() - 0.5).slice(0, 4);
  const positions = [
    [rand(14, 34), rand(18, 38)],
    [rand(48, 70), rand(22, 44)],
    [rand(66, 88), rand(58, 80)],
    [rand(22, 46), rand(64, 86)]
  ].sort(() => Math.random() - 0.5);

  shuffledHues.forEach((hue, index) => {
    const number = index + 1;
    hint.style.setProperty(`--hint-h${number}`, hue);
    hint.style.setProperty(`--hint-x${number}`, `${positions[index][0]}%`);
    hint.style.setProperty(`--hint-y${number}`, `${positions[index][1]}%`);
  });
}

function initShowreelControls() {
  const carousel = document.querySelector(".showreel-carousel");
  const track = carousel?.querySelector(".showreel-track");
  const previousButton = carousel?.querySelector(".showreel-nav--prev");
  const nextButton = carousel?.querySelector(".showreel-nav--next");

  if (!carousel || !track || !previousButton || !nextButton) return;

  const items = Array.from(track.querySelectorAll("figure"));

  if (items.length === 0) return;

  const getGap = () => parseFloat(getComputedStyle(track).gap) || 0;

  const getStep = () => {
    const firstItem = track.querySelector("figure");
    const gap = getGap();

    return firstItem ? firstItem.getBoundingClientRect().width + gap : carousel.clientWidth * 0.8;
  };

  previousButton.addEventListener("click", () => {
    carousel.scrollBy({ left: -getStep(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    carousel.scrollBy({ left: getStep(), behavior: "smooth" });
  });
}

if (isHomePage) {
  addClickPulse(".home-mark, .sticky-inquiry");
  initCustomSelects();
  initFormPerformanceMode();
  initInteractionHint();
  initShowreelControls();
  initLayoutObservers();

  resize();

  if (prefersReducedMotion) {
    draw(performance.now() * 0.001);
  } else {
    animationFrame = requestAnimationFrame(animate);
  }
}
