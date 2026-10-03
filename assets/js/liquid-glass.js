/*
 * Built Different · liquid glass for floating UI
 *
 * The floating menu bar and the back-to-top button sit ON TOP of the page,
 * so the WebGL sky can't reach what's under them. For those, Chromium-based
 * browsers (Chrome, Edge, Opera, Brave) get a real SVG displacement filter
 * as their backdrop: text and cards scrolling underneath bend at the edges
 * with a little colour fringing, like a thick piece of glass.
 * Other browsers fall back to a frosted blur (see glass.css).
 *
 * Mark any element with  data-liquid  to get the effect.
 */
(function () {
  "use strict";

  const root = document.documentElement;
  const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  const chromium = brands.some((b) => /Chromium|Google Chrome|Microsoft Edge|Opera|Brave/i.test(b.brand));
  const supported = chromium && window.CSS && CSS.supports && CSS.supports("backdrop-filter", "url(#x)");

  if (!supported || /[?&]noglass\b/.test(location.search)) {
    root.classList.add("no-liquid");
    window.LiquidGlass = { refresh() {} };
    return;
  }
  root.classList.add("has-liquid");

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  const defs = document.createElementNS(NS, "defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);

  const items = new Map();
  let uid = 0;

  const sdRR = (px, py, hw, hh, r) => {
    const qx = Math.abs(px) - hw + r;
    const qy = Math.abs(py) - hh + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Displacement map: red/green = how far to shift x/y. Neutral grey in the
  // middle, a strong inward pull along a rounded bevel at the edges.
  function makeMap(w, h, r, bevel) {
    const s = 0.5;
    const W = Math.max(2, Math.round(w * s));
    const H = Math.max(2, Math.round(h * s));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(W, H);
    const d = img.data;
    const hw = w / 2;
    const hh = h / 2;
    const rr = Math.min(r, hw, hh);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const px = (x + 0.5) / s - hw;
        const py = (y + 0.5) / s - hh;
        const sd = sdRR(px, py, hw, hh, rr);
        let dx = 0;
        let dy = 0;
        if (sd < 0) {
          const t = 1 - smooth(0, bevel, -sd);
          const k = t * t;
          const nx = sdRR(px + 1, py, hw, hh, rr) - sdRR(px - 1, py, hw, hh, rr);
          const ny = sdRR(px, py + 1, hw, hh, rr) - sdRR(px, py - 1, hw, hh, rr);
          const len = Math.hypot(nx, ny) || 1;
          dx = -(nx / len) * k;
          dy = -(ny / len) * k;
        }
        const i = (y * W + x) * 4;
        d[i] = 128 + dx * 127;
        d[i + 1] = 128 + dy * 127;
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function el(name, attrs) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function attach(node) {
    const id = "liquid-" + ++uid;
    const strength = parseFloat(node.dataset.liquidStrength || "34");
    const frost = parseFloat(node.dataset.liquidFrost || "2.2");
    const f = el("filter", { id, x: "0", y: "0", width: "100%", height: "100%", "color-interpolation-filters": "sRGB" });
    const img = el("feImage", { result: "map", x: "0", y: "0", width: "1", height: "1", preserveAspectRatio: "none" });
    f.appendChild(img);
    // three displacement passes, one per colour channel → chromatic fringe
    [
      ["dR", strength, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", "cR"],
      ["dG", strength * 0.93, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", "cG"],
      ["dB", strength * 0.86, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", "cB"],
    ].forEach(([res, scale, matrix, out]) => {
      f.appendChild(el("feDisplacementMap", { in: "SourceGraphic", in2: "map", scale: String(scale), xChannelSelector: "R", yChannelSelector: "G", result: res }));
      f.appendChild(el("feColorMatrix", { in: res, type: "matrix", values: matrix, result: out }));
    });
    f.appendChild(el("feBlend", { in: "cR", in2: "cG", mode: "screen", result: "cRG" }));
    f.appendChild(el("feBlend", { in: "cRG", in2: "cB", mode: "screen", result: "rgb" }));
    f.appendChild(el("feGaussianBlur", { in: "rgb", stdDeviation: String(frost), result: "soft" }));
    f.appendChild(el("feColorMatrix", { in: "soft", type: "saturate", values: "1.45" }));
    defs.appendChild(f);
    const item = { id, img, w: 0, h: 0 };
    items.set(node, item);
    update(node);
  }

  function update(node) {
    const item = items.get(node);
    if (!item) return;
    const w = Math.round(node.offsetWidth);
    const h = Math.round(node.offsetHeight);
    if (!w || !h || (w === item.w && h === item.h)) return;
    item.w = w;
    item.h = h;
    const r = parseFloat(getComputedStyle(node).borderTopLeftRadius) || h / 2;
    const bevel = Math.min(parseFloat(node.dataset.liquidBevel || "16"), Math.min(w, h) / 2);
    item.img.setAttribute("href", makeMap(w, h, r, bevel));
    item.img.setAttribute("width", String(w));
    item.img.setAttribute("height", String(h));
    const value = `url(#${item.id})`;
    node.style.backdropFilter = value;
    node.style.webkitBackdropFilter = value;
  }

  const ro = "ResizeObserver" in window ? new ResizeObserver((entries) => entries.forEach((e) => update(e.target))) : null;

  function refresh() {
    document.querySelectorAll("[data-liquid]").forEach((node) => {
      if (items.has(node)) {
        update(node);
        return;
      }
      attach(node);
      if (ro) ro.observe(node);
    });
  }

  refresh();
  window.addEventListener("resize", refresh, { passive: true });
  window.LiquidGlass = { refresh };
})();
