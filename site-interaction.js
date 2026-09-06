(() => {
  const root = document.body.dataset.root || "./";
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const trailLayer = document.createElement("div");
  trailLayer.className = "thorn-trail-layer";
  trailLayer.setAttribute("aria-hidden", "true");

  const pointerFlower = document.createElement("div");
  pointerFlower.className = "art-pointer";
  pointerFlower.setAttribute("aria-hidden", "true");

  document.body.append(trailLayer, pointerFlower);

  const viewer = document.querySelector(".index-viewer");
  if (viewer) {
    viewer.addEventListener("toggle", () => {
      const host = viewer.open ? viewer : document.body;
      host.append(trailLayer, pointerFlower);
      trailLayer.style.display = viewer.open ? "none" : "";
      if (viewer.open) stamps.slice().forEach(removeStamp);
    });
  }

  const pointerAsset = new Image();
  pointerAsset.addEventListener("load", () => {
    if (finePointer) document.documentElement.classList.add("has-art-pointer");
  }, { once: true });
  pointerAsset.src = `${root}assets/rose-pointer-v2.png`;

  const pointer = {
    targetX: -120,
    targetY: -120,
    x: -120,
    y: -120,
    visible: false
  };
  const trailPoint = { x: 0, y: 0, ready: false };
  const stamps = [];
  let pointerFrame = 0;

  const random = (min, max) => Math.random() * (max - min) + min;

  function drawPointer() {
    pointerFrame = 0;
    const easing = reducedMotion ? 1 : 0.46;
    pointer.x += (pointer.targetX - pointer.x) * easing;
    pointer.y += (pointer.targetY - pointer.y) * easing;
    pointerFlower.style.setProperty("--pointer-x", `${pointer.x}px`);
    pointerFlower.style.setProperty("--pointer-y", `${pointer.y}px`);

    if (Math.hypot(pointer.targetX - pointer.x, pointer.targetY - pointer.y) > 0.28) {
      pointerFrame = requestAnimationFrame(drawPointer);
    }
  }

  function schedulePointer() {
    if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
  }

  function removeStamp(stamp) {
    const index = stamps.indexOf(stamp);
    if (index >= 0) stamps.splice(index, 1);
    stamp.remove();
  }

  function softenTrailTail() {
    const count = stamps.length;
    if (!count) return;

    stamps.forEach((stamp, index) => {
      const recency = (index + 1) / count;
      const opacity = 0.035 + Math.pow(recency, 1.55) * 0.705;
      stamp.style.setProperty("--thorn-opacity", opacity.toFixed(3));
    });
  }

  function toneFor(target) {
    const element = target?.nodeType === 1 ? target : target?.parentElement;
    if (!element?.closest) return "";

    if (element.closest(
      ".practice-structure, .project-hero__media.is-placeholder, .work-card--placeholder figure, .works-introduction__media--rose"
    )) return "dark";

    if (element.closest(
      ".work-card figure, .project-hero__media, .project-gallery figure, .artist-hero figure, .research-feature, .visual-index__item, .index-viewer"
    )) return "pink";

    return "";
  }

  function applyPointerTone(tone) {
    pointerFlower.classList.toggle("is-dark-ink", tone === "dark");
    pointerFlower.classList.toggle("is-pink-ink", tone === "pink");
  }

  function addStamp(x, y, angle, tone = "") {
    const stamp = document.createElement("span");
    const compact = window.innerWidth <= 720;
    const size = random(compact ? 24 : 28, compact ? 32 : 38);
    const life = random(860, 1160);

    stamp.className = "thorn-stamp";
    stamp.style.setProperty("--thorn-x", `${x}px`);
    stamp.style.setProperty("--thorn-y", `${y}px`);
    stamp.style.setProperty("--thorn-size", `${size}px`);
    stamp.style.setProperty("--thorn-angle", `${angle + random(-4, 4)}deg`);
    stamp.style.setProperty("--thorn-flip", Math.random() > 0.5 ? "-1" : "1");
    stamp.style.setProperty("--thorn-life", `${life}ms`);
    stamp.style.setProperty("--thorn-opacity", 0.78);
    if (tone === "dark") stamp.style.setProperty("--stamp-ink", "#150e13");
    if (tone === "pink") stamp.style.setProperty("--stamp-ink", "var(--pink)");
    trailLayer.appendChild(stamp);
    stamps.push(stamp);

    while (stamps.length > (compact ? 16 : 22)) removeStamp(stamps[0]);
    softenTrailTail();
    window.setTimeout(() => removeStamp(stamp), life + 100);
  }

  function growTrail(x, y, tone) {
    if (!trailPoint.ready) {
      trailPoint.x = x;
      trailPoint.y = y;
      trailPoint.ready = true;
      return;
    }

    const compact = window.innerWidth <= 720;
    const step = reducedMotion ? (compact ? 24 : 26) : (compact ? 12 : 14);
    let dx = x - trailPoint.x;
    let dy = y - trailPoint.y;
    let distance = Math.hypot(dx, dy);
    let count = 0;

    while (distance >= step && count < 10) {
      const ratio = step / distance;
      const nextX = trailPoint.x + dx * ratio;
      const nextY = trailPoint.y + dy * ratio;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      addStamp(nextX, nextY, angle, tone);
      trailPoint.x = nextX;
      trailPoint.y = nextY;
      dx = x - trailPoint.x;
      dy = y - trailPoint.y;
      distance = Math.hypot(dx, dy);
      count += 1;
    }
  }

  function updatePointer(event) {
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    const tone = toneFor(event.target);

    if (finePointer) {
      if (!pointer.visible) {
        pointer.visible = true;
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
        pointerFlower.classList.add("is-visible");
      }
      applyPointerTone(tone);
      pointerFlower.classList.toggle("is-over-link", Boolean(event.target.closest?.("a, button, [role='button']")));
      schedulePointer();
    }

    if (!viewer?.open) growTrail(event.clientX, event.clientY, tone);
  }

  window.addEventListener("pointermove", updatePointer, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    document.body.classList.add("has-interacted");
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    trailPoint.x = event.clientX;
    trailPoint.y = event.clientY;
    trailPoint.ready = true;
    const tone = toneFor(event.target);
    applyPointerTone(tone);

  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    pointer.visible = false;
    trailPoint.ready = false;
    pointerFlower.classList.remove("is-visible", "is-over-link");
  }, { passive: true });

  window.addEventListener("blur", () => {
    pointer.visible = false;
    trailPoint.ready = false;
    pointerFlower.classList.remove("is-visible", "is-over-link");
  });
})();
