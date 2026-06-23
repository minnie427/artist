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

const FPS = prefersReducedMotion ? 8 : isMobile ? 16 : 24;
const MAX_BLOBS = isMobile ? 8 : 11;
const TEXT_COUNT = isHomePage ? (isMobile ? 22 : 30) : 0;
const MAX_CANVAS_PIXELS = isMobile ? 1800000 : 3200000;

const pointer = {
  x: 0,
  y: 0,
  active: false,
  down: false
};

const snippets = [
  "Minnie Park interactive audio-visual artist",
  "interactive audio-visual artist",
  "affect colour touch culturally situated emotion",
  "immersive digital installations",
  "roses water sound colour tactile interfaces",
  "audience participation digital bodies memory",
  "Korean emotional nuance affective experience",
  "touch colour sound real-time visual systems",
  "터치는 신호가 되고 신호는 색이 된다",
  "색은 정서적 분위기가 됩니다",
  "interactive installation live performance research-led practice",
  "The Meta Kibun Project",
  "The Meta Rose Project",
  "Touching Resonance Seventh Gallery Melbourne",
  "PayPal Melbourne Fashion Festival Premium Runway",
  "Melbourne Fringe Science Gallery TouchCollective",
  "Bugskin Chapter 2 Norla Dome Docklands",
  "Median live audio-visual performance",
  "Quantum Faces What Colour Is Your Voice MEMI",
  "Touching Resonance participatory AV workshop",
  "<section class=\"hero-visual\" id=\"heroVisual\">",
  "<canvas id=\"textCanvas\" aria-hidden=\"true\"></canvas>",
  "<canvas id=\"blobCanvas\" aria-hidden=\"true\"></canvas>",
  "<script src=\"./hero-visual.js\"></script>",
  "const hero = document.getElementById(\"heroVisual\");",
  "const textCanvas = document.getElementById(\"textCanvas\");",
  "const blobCanvas = document.getElementById(\"blobCanvas\");",
  "const textCtx = textCanvas.getContext(\"2d\", { alpha: true });",
  "const blobCtx = blobCanvas.getContext(\"2d\", { alpha: true });",
  "const rect = hero.getBoundingClientRect();",
  "canvas.width = Math.floor(W * DPR);",
  "ctx.createRadialGradient(px, py, 0, px, py, petalRadius);",
  "hero.addEventListener(\"pointerdown\", (event) => {",
  "spawnBlob(pointer.x, pointer.y);",
  "spawnText(pointer.x, pointer.y);",
  "playTextNoise(pointer.x / W, pointer.y / H);",
  "audioContext = new AudioContextClass();",
  "source.buffer = createTextNoiseBuffer(ctx, seed, duration);",
  "if (touch) { colour.bloom(); }",
  "system.output = emotionalAtmosphere;",
  "audioReactive.visuals.render();",
  "const feeling = input.map(kibun);",
  "touch input colour sound atmosphere",

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

if (!isHomePage) {
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
let lastBottomSeedAt = 0;
let lastPageEndSeedKey = "";
let layoutObserver = null;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPageDensity() {
  return 1;
}

function getMaxBlobCount() {
  return Math.round(MAX_BLOBS * getPageDensity());
}

function getTextCount() {
  return Math.round(TEXT_COUNT * getPageDensity());
}

function resize() {
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

  const shouldResetScene = !sceneInitialized || Math.abs(W - previousWidth) > 12;

  if (shouldResetScene) {
    initScene();
    sceneInitialized = true;
    return;
  }

  lastScrollY = window.scrollY;
  maxSeededScrollBottom = Math.max(maxSeededScrollBottom, window.scrollY + window.innerHeight);
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
    this.blur = isMobile ? rand(22, 42) : rand(34, 62);
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
      this.drawSoftMobile(ctx, t);
      return;
    }

    const points = 36;
    const morph = Math.sin(t * 0.28 + this.phase) * 0.09;
    const animatedRadius = this.baseRadius * (1 + Math.sin(t * 0.17 + this.phase) * 0.06);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.scale(this.sx + morph, this.sy - morph * 0.5);
    ctx.globalAlpha = Math.max(0, this.opacity * this.life);
    ctx.filter = `blur(${this.blur}px)`;

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

    ctx.filter = "none";
    ctx.restore();
  }

  drawSoftMobile(ctx, t) {
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
  constructor(x, y, burst = false) {
    this.x = x;
    this.y = y;
    this.vx = rand(-3.4, 3.4);
    this.vy = rand(-2.8, 2.8);
    this.phase = rand(0, Math.PI * 2);
    this.size = burst ? rand(10, 14) : rand(isMobile ? 9 : 10, isMobile ? 12 : 14);
    this.cols = Math.floor(rand(isMobile ? 8 : 12, isMobile ? 23 : 38));
    this.rowCount = Math.floor(rand(3, isMobile ? 8 : 11));
    this.alpha = burst ? 0.74 : rand(0.58, 0.84);
    this.rot = rand(-0.035, 0.035);
    this.changeEvery = rand(4.5, 9);
    this.lastChange = 0;
    this.burst = burst;
    this.life = 1;
    this.decay = burst ? 0.08 : 0;
    this.setText();
  }

  setText() {
    const raw = pick(snippets);
    const extra = Math.random() > 0.28 ? ` ${pick(snippets)}` : "";
    const tail = Math.random() > 0.58 ? ` ${pick(snippets)}` : "";
    const source = Array.from((raw + extra + tail).replace(/\s+/g, " "));
    const maxChars = this.cols * this.rowCount;
    const targetChars = Math.floor(maxChars * rand(0.5, 1));
    const chars = [];

    while (chars.length < targetChars) {
      chars.push(...source, " ");
    }

    this.chars = chars.slice(0, targetChars);
    this.rowSeed = rand(0, 1000);
  }

  update(dt, t) {
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
      this.cols = Math.floor(rand(isMobile ? 8 : 12, isMobile ? 23 : 38));
      this.rowCount = Math.floor(rand(3, isMobile ? 8 : 11));
      this.setText();
      this.lastChange = t;
    }

    if (this.decay > 0) this.life -= this.decay * dt;
  }

  draw(ctx, t) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot + Math.sin(t * 0.18 + this.phase) * 0.025);

    ctx.font = `${this.size}px "Courier New", "SFMono-Regular", ui-monospace, monospace`;
    ctx.fillStyle = "rgba(28, 27, 25, 0.78)";
    ctx.globalAlpha = Math.max(0, this.alpha * this.life);
    ctx.textBaseline = "top";

    const charW = this.size * 0.66;
    const charH = this.size * 1.04;

    for (let i = 0; i < this.chars.length; i++) {
      const ch = this.chars[i];
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);
      const rowNoise = Math.sin((row + 1) * 12.9898 + this.rowSeed) * 43758.5453;
      const edgeNoise = rowNoise - Math.floor(rowNoise);
      const rowWidth = Math.max(4, Math.floor(this.cols * randFrom(edgeNoise, 0.42, 1)));
      const rowIndent = Math.floor((this.cols - rowWidth) * randFrom(edgeNoise * 1.7, 0, 0.85));
      const cellNoise = Math.sin((i + 1) * 78.233 + this.rowSeed) * 43758.5453;
      const cellValue = cellNoise - Math.floor(cellNoise);

      if (col < rowIndent || col > rowIndent + rowWidth || cellValue < 0.11) {
        continue;
      }

      const waveX =
        Math.sin(t * 0.28 + row * 0.31 + this.phase) * 1.5 +
        Math.cos(t * 0.18 + col * 0.21) * 0.8;

      const waveY =
        Math.cos(t * 0.26 + col * 0.28 + this.phase) * 1.1 +
        Math.sin(t * 0.14 + row * 0.14) * 0.6;

      const chunkShift = Math.sin(row * 4.21 + this.rowSeed) * this.size * 1.8;
      const x = col * charW + chunkShift + waveX;
      const y = row * charH + waveY;

      if (Math.random() > 0.0015) {
        ctx.fillText(ch, x, y);
      }
    }

    ctx.restore();
  }
}

function randFrom(seed, min, max) {
  const normalized = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return normalized * (max - min) + min;
}

function initScene() {
  blobs = [];
  texts = [];
  lastPageEndSeedKey = "";
  lastScrollY = window.scrollY;
  maxSeededScrollBottom = window.scrollY + window.innerHeight;

  const density = getPageDensity();
  const initialBlobCount = Math.round((isMobile ? 8 : 11) * density);
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

  for (let i = 0; i < getTextCount(); i++) {
    const anchor = textAnchors[i % textAnchors.length];
    texts.push(
      new TextBlock(
        anchor[0] * W + rand(-70, 70),
        anchor[1] * H + rand(-55, 55)
      )
    );
  }

  seedViewport(0, true);
  seedPageEndVisuals();

  draw(performance.now() * 0.001);
}

function seedViewport(scrollY = 0, initial = false) {
  const top = 0;
  const bottom = H;
  const blobCount = initial ? (isMobile ? 3 : 4) : (isMobile ? 1 : 2);
  const textCount = initial ? (isMobile ? 6 : 8) : blobCount;
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

  const text = new TextBlock(x, y, burst);
  const estimatedWidth = text.cols * text.size * 0.66;
  const estimatedHeight = text.rowCount * text.size * 1.04;

  text.x = x - estimatedWidth * rand(0.18, 0.82) + rand(-90, 90);
  text.y = y - estimatedHeight * rand(0.18, 0.82) + rand(-72, 72);

  texts.push(text);

  while (texts.length > getTextCount() + 5) {
    texts.shift();
  }
}

function spawnPointerVisuals(x, y) {
  const blobX = x + rand(-42, 42);
  const blobY = y + rand(-42, 42);
  const textX = x + rand(-120, 120);
  const textY = y + rand(-96, 96);

  spawnBlob(blobX, blobY);
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

function update(dt, t) {
  for (const blob of blobs) blob.update(dt, t);
  for (const text of texts) text.update(dt, t);

  blobs = blobs.filter((b) => b.life > 0.03);
  texts = texts.filter((txt) => txt.life > 0.03);
}

function draw(t) {
  if (isHomePage) {
    textCtx.clearRect(0, 0, W, H);
  }
  blobCtx.clearRect(0, 0, W, H);

  if (isHomePage) {
    for (const text of texts) {
      text.draw(textCtx, t);
    }
  }

  blobCtx.globalCompositeOperation = "source-over";
  for (const blob of blobs) {
    blob.draw(blobCtx, t);
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

  const delta = now - last;
  if (delta < frameInterval) return;

  const dt = Math.min(delta / 1000, 0.045);
  last = now - (delta % frameInterval);

  const t = now * 0.001;

  update(dt, t);
  draw(t);
}

function updatePointer(event) {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
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

window.addEventListener("pointermove", (event) => {
  updatePointer(event);
}, { passive: true });

window.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") return;

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

  window.setTimeout(() => {
    document.body.classList.add("is-hint-dismissed");
    window.setTimeout(() => {
      document.body.classList.add("is-hint-gone");
    }, 1300);
  }, 5600);
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
