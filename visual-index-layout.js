(function (root) {
  "use strict";

  // Consume the chronological sequence once, without resetting at project seams.
  function arrange(ratios, width, columns, gap) {
    const columnWidth = (width - gap * (columns - 1)) / columns;
    const heights = Array(columns).fill(0);
    const positions = ratios.map((ratio) => {
      const column = heights.indexOf(Math.min(...heights));
      const height = columnWidth / (Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
      const position = { left: column * (columnWidth + gap), top: heights[column], width: columnWidth, height, column };
      heights[column] += height + gap;
      return position;
    });
    return { positions, height: Math.max(0, ...heights) - (positions.length ? gap : 0) };
  }

  function mount(gallery) {
    if (!gallery) return;
    const items = Array.from(gallery.querySelectorAll(".visual-index__item"));
    const media = items.map((item) => item.querySelector("img, video"));
    function ratioOf(element) {
      const width = element.naturalWidth || element.videoWidth || Number(element.getAttribute("width"));
      const height = element.naturalHeight || element.videoHeight || Number(element.getAttribute("height"));
      return width > 0 && height > 0 ? width / height : 1;
    }
    const ratios = media.map(ratioOf);
    let frame = 0;
    let lastGeometry = "";
    let dirty = true;

    function layout() {
      frame = 0;
      const css = root.getComputedStyle(gallery);
      const left = parseFloat(css.paddingLeft) || 0;
      const top = parseFloat(css.paddingTop) || 0;
      const width = gallery.clientWidth - left - (parseFloat(css.paddingRight) || 0);
      if (width <= 0) return;
      const columns = Math.max(1, parseInt(css.getPropertyValue("--index-columns"), 10) || 1);
      const gap = parseFloat(css.getPropertyValue("--index-gap")) || 0;
      const geometry = [width, columns, gap, left, top, css.paddingBottom].join(":");
      if (!dirty && geometry === lastGeometry) return;
      lastGeometry = geometry;
      dirty = false;
      const result = arrange(ratios, width, columns, gap);
      result.positions.forEach((position, index) => {
        Object.assign(items[index].style, {
          left: `${position.left + left}px`, top: `${position.top + top}px`,
          width: `${position.width}px`, height: `${position.height}px`
        });
      });
      gallery.style.height = `${result.height + top + (parseFloat(css.paddingBottom) || 0)}px`;
      gallery.dataset.masonry = "ready";
    }

    function schedule() {
      if (!frame) frame = root.requestAnimationFrame(layout);
    }
    const onLoads = media.map((element, index) => {
      const update = () => {
        const ratio = ratioOf(element);
        if (Math.abs(ratios[index] - ratio) < 0.0001) return;
        ratios[index] = ratio;
        dirty = true;
        schedule();
      };
      element.addEventListener("load", update);
      element.addEventListener("loadedmetadata", update);
      return update;
    });
    const observer = root.ResizeObserver ? new root.ResizeObserver(schedule) : null;
    observer?.observe(gallery);
    root.addEventListener("resize", schedule);
    layout();

    return () => {
      observer?.disconnect();
      root.removeEventListener("resize", schedule);
      if (frame) root.cancelAnimationFrame(frame);
      media.forEach((element, index) => {
        element.removeEventListener("load", onLoads[index]);
        element.removeEventListener("loadedmetadata", onLoads[index]);
      });
    };
  }

  const api = { arrange, mount };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MPVisualIndexLayout = api;
})(typeof window !== "undefined" ? window : globalThis);
