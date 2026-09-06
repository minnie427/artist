(() => {
  const layer = document.querySelector("[data-rose-layer]");
  if (!layer || document.body.dataset.page !== "home") return;

  const root = document.body.dataset.root || "./";
  const source = `${root}assets/rose-halftone.png`;
  let mobile = window.matchMedia("(max-width: 720px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0, active: false, down: false };
  let sprites = [];
  let cachedExclusions = [];
  let last = performance.now();

  const random = (min, max) => Math.random() * (max - min) + min;

  function roseSize() {
    const tier = Math.random();
    if (mobile) {
      if (tier < 0.52) return random(62, 100);
      if (tier < 0.9) return random(112, 168);
      return random(180, 220);
    }
    if (tier < 0.52) return random(82, 128);
    if (tier < 0.9) return random(150, 220);
    return random(250, 310);
  }

  function paint(sprite) {
    sprite.element.style.setProperty("--size", `${sprite.size}px`);
    sprite.element.style.setProperty("--x", `${sprite.x}px`);
    sprite.element.style.setProperty("--y", `${sprite.y}px`);
    sprite.element.style.setProperty("--rotation", `${sprite.rotation}deg`);
    sprite.element.style.setProperty("--scale", sprite.scale);
    sprite.element.style.setProperty("--alpha", Math.max(0, 0.9 * sprite.life));
  }

  function variedRotation() {
    const ranges = [
      [-105, -68],
      [-58, -24],
      [-18, 20],
      [28, 62],
      [72, 108]
    ];
    const [min, max] = ranges[Math.floor(Math.random() * ranges.length)];
    return random(min, max);
  }

  function createRose(centerX, centerY, burst = false, fixedSize = null, seeded = false, fixedRotation = null) {
    const element = document.createElement("div");
    const image = document.createElement("img");
    const size = fixedSize || roseSize();

    image.src = source;
    image.alt = "";
    element.className = "rose-sprite";
    element.appendChild(image);
    layer.appendChild(element);

    const sprite = {
      element,
      x: centerX - size * 0.5,
      y: centerY - size * 0.5,
      size,
      scale: burst ? 0.16 : 1,
      life: 1,
      decay: burst ? 0.018 : 0,
      seeded,
      rotation: fixedRotation ?? variedRotation(),
      spin: random(-3.1, 3.1),
      vx: random(-7.4, 7.4),
      vy: random(-6.3, 6.3),
      phase: random(0, Math.PI * 2)
    };

    paint(sprite);
    sprites.push(sprite);
  }

  function exclusionRects() {
    const padding = mobile ? 18 : 34;
    return Array.from(document.querySelectorAll(".landing-top, .landing-bottom, .global-nav__brand, .global-nav__toggle, .global-nav__links, .interaction-hint"))
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        left: rect.left - padding,
        right: rect.right + padding,
        top: rect.top - padding,
        bottom: rect.bottom + padding
      }));
  }

  function isClear(centerX, centerY, size, exclusions, placed) {
    const radius = size * 0.48;
    const bounds = {
      left: centerX - radius,
      right: centerX + radius,
      top: centerY - radius,
      bottom: centerY + radius
    };
    const overlapsText = exclusions.some((rect) => !(
      bounds.right < rect.left ||
      bounds.left > rect.right ||
      bounds.bottom < rect.top ||
      bounds.top > rect.bottom
    ));
    const crowdsRose = placed.some((rose) => (
      Math.hypot(centerX - rose.x, centerY - rose.y) < (size + rose.size) * 0.36
    ));
    return !overlapsText && !crowdsRose;
  }

  function overlapsExclusion(sprite) {
    const radius = sprite.size * 0.48;
    const centerX = sprite.x + sprite.size * 0.5;
    const centerY = sprite.y + sprite.size * 0.5;
    return cachedExclusions.some((rect) => !(
      centerX + radius < rect.left ||
      centerX - radius > rect.right ||
      centerY + radius < rect.top ||
      centerY - radius > rect.bottom
    ));
  }

  function seed() {
    mobile = window.matchMedia("(max-width: 720px)").matches;
    sprites.forEach((sprite) => sprite.element.remove());
    sprites = [];
    const scale = mobile ? 1 : Math.min(1.22, Math.max(0.9, window.innerWidth / 1856));
    const plans = mobile
      ? [
          [0.68, 0.36, 190, -18],
          [0.34, 0.34, 78, -42],
          [0.69, 0.43, 114, 37],
          [0.48, 0.59, 148, -88]
        ]
      : [
          [0.79, 0.31, 286, -18],
          [0.35, 0.34, 112, -48],
          [0.62, 0.32, 164, 26],
          [0.74, 0.53, 126, 83],
          [0.31, 0.56, 190, -96]
        ];
    cachedExclusions = exclusionRects();
    const placed = [];

    plans.forEach(([anchorX, anchorY, baseSize, rotation]) => {
      const size = baseSize * scale;
      let centerX = anchorX * window.innerWidth;
      let centerY = anchorY * window.innerHeight;
      let found = false;

      for (let attempt = 0; attempt < 36; attempt += 1) {
        const spread = attempt * (mobile ? 2.2 : 3.4);
        const candidateX = Math.min(
          window.innerWidth * (mobile ? 0.82 : 0.82),
          Math.max(window.innerWidth * (mobile ? 0.18 : 0.3), centerX + random(-spread, spread))
        );
        const candidateY = Math.min(
          window.innerHeight * (mobile ? 0.62 : 0.61),
          Math.max(window.innerHeight * (mobile ? 0.29 : 0.29), centerY + random(-spread, spread))
        );

        if (isClear(candidateX, candidateY, size, cachedExclusions, placed)) {
          centerX = candidateX;
          centerY = candidateY;
          found = true;
          break;
        }
      }

      if (!found) return;
      placed.push({ x: centerX, y: centerY, size });
      createRose(centerX, centerY, false, size, true, rotation);
    });
  }

  function updatePointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  function animate(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (!reducedMotion) {
      sprites.forEach((sprite) => {
        const previousX = sprite.x;
        const previousY = sprite.y;
        sprite.x += (sprite.vx + Math.sin(now * 0.00032 + sprite.phase) * 5.2) * dt;
        sprite.y += (sprite.vy + Math.cos(now * 0.00028 + sprite.phase) * 4.4) * dt;
        sprite.rotation += sprite.spin * dt;
        sprite.scale += (1 - sprite.scale) * Math.min(1, dt * 4.2);

        if (pointer.active) {
          const centreX = sprite.x + sprite.size * 0.5;
          const centreY = sprite.y + sprite.size * 0.5;
          const dx = centreX - pointer.x;
          const dy = centreY - pointer.y;
          const distance = Math.hypot(dx, dy);
          const range = pointer.down ? 250 : 165;

          if (distance < range && distance > 0.1) {
            const force = (range - distance) / range;
            sprite.vx += (dx / distance) * force * (pointer.down ? 32 : 10) * dt;
            sprite.vy += (dy / distance) * force * (pointer.down ? 32 : 10) * dt;
          }
        }

        sprite.vx *= 0.994;
        sprite.vy *= 0.994;
        if (sprite.decay) sprite.life -= sprite.decay * dt;

        if (sprite.seeded) {
          const minX = window.innerWidth * (mobile ? 0.15 : 0.27) - sprite.size * 0.5;
          const maxX = window.innerWidth * 0.85 - sprite.size * 0.5;
          const minY = window.innerHeight * 0.27 - sprite.size * 0.5;
          const maxY = window.innerHeight * (mobile ? 0.64 : 0.63) - sprite.size * 0.5;
          if (sprite.x < minX || sprite.x > maxX) {
            sprite.x = Math.min(maxX, Math.max(minX, sprite.x));
            sprite.vx *= -0.82;
          }
          if (sprite.y < minY || sprite.y > maxY) {
            sprite.y = Math.min(maxY, Math.max(minY, sprite.y));
            sprite.vy *= -0.82;
          }
          if (overlapsExclusion(sprite)) {
            sprite.x = previousX;
            sprite.y = previousY;
            sprite.vx *= -0.76;
            sprite.vy *= -0.76;
          }
        } else {
          const margin = sprite.size;
          if (sprite.x < -margin) sprite.x = window.innerWidth + margin * 0.2;
          if (sprite.x > window.innerWidth + margin) sprite.x = -margin * 0.8;
          if (sprite.y < -margin) sprite.y = window.innerHeight + margin * 0.2;
          if (sprite.y > window.innerHeight + margin) sprite.y = -margin * 0.8;
        }
        paint(sprite);
      });
    }

    sprites = sprites.filter((sprite) => {
      if (sprite.life > 0.02) return true;
      sprite.element.remove();
      return false;
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    pointer.down = true;
    createRose(pointer.x, pointer.y, !reducedMotion);
    while (sprites.length > (mobile ? 7 : 9)) {
      const transientIndex = sprites.findIndex((sprite) => !sprite.seeded);
      if (transientIndex < 0) break;
      const [oldestTransient] = sprites.splice(transientIndex, 1);
      oldestTransient.element.remove();
    }
  }, { passive: true });
  window.addEventListener("pointerup", () => { pointer.down = false; }, { passive: true });
  window.addEventListener("pointerleave", () => { pointer.active = false; pointer.down = false; }, { passive: true });
  window.addEventListener("resize", seed, { passive: true });

  seed();
  if (!reducedMotion) requestAnimationFrame(animate);
})();
