/*
 * Built Different · WebGL glass
 *
 * Paints the whole sky (soft orbs + a fine dot grid) on one fixed canvas
 * behind the page. Every element marked [data-glass] becomes a pane of
 * glass: the shader finds its rounded rectangle on screen each frame and
 * refracts, frosts and splits (chromatic aberration) whatever is behind
 * it. The sky moves slower than the page, so the warping slides around as
 * you scroll. The rim light follows the mouse.
 *
 * Add  ?noglass  to any URL to see the plain CSS fallback.
 */
(function () {
  "use strict";

  const root = document.documentElement;
  const MAX = 24;
  const reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  if (/[?&]noglass\b/.test(location.search)) {
    root.classList.add("no-webgl");
    return;
  }

  let canvas = null;
  let gl = null;
  try {
    canvas = document.createElement("canvas");
    canvas.id = "glass-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "high-performance" };
    gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
  } catch (e) {
    gl = null;
  }
  if (!gl) {
    root.classList.add("no-webgl");
    return;
  }

  const VS = "attribute vec2 a;\nvoid main(){ gl_Position = vec4(a, 0.0, 1.0); }";

  const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uDpr;
uniform float uTime;
uniform float uScroll;
uniform vec2  uMouse;
uniform int   uCount;
uniform vec4  uRects[MAXP];
uniform float uRad[MAXP];
uniform float uAlpha[MAXP];

float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec3 orbColor(float h) {
  vec3 c = vec3(0.729, 0.902, 0.992);                    // sky-200
  c = mix(c, vec3(0.490, 0.827, 0.988), step(0.25, h));  // sky-300
  c = mix(c, vec3(0.220, 0.741, 0.973), step(0.50, h));  // sky-400
  c = mix(c, vec3(0.640, 0.878, 1.000), step(0.75, h));  // ice
  return c;
}

// The world behind the glass, in CSS pixels.
// orbs(): soft drifting colour, parallax 0.35 (cheap enough to run once per pixel)
vec3 orbs(vec2 p) {
  float vw = uRes.x / uDpr;
  float vh = uRes.y / uDpr;
  vec3 col = mix(vec3(0.973, 0.988, 1.0), vec3(0.874, 0.945, 0.996), smoothstep(0.0, 1.0, p.y / vh) * 0.9);
  vec2 P = vec2(p.x, p.y + uScroll * 0.35);
  float period = 720.0;
  float base = floor(P.y / period);
  for (int k = -1; k <= 1; k++) {
    float ty = base + float(k);
    for (int j = 0; j < 3; j++) {
      float s = ty * 3.0 + float(j);
      float h1 = hash(s * 1.37 + 0.11);
      float h2 = hash(s * 2.11 + 4.70);
      float h3 = hash(s * 0.73 + 9.30);
      float h4 = hash(s * 3.17 + 1.90);
      vec2 c = vec2(mix(-0.08, 1.08, h1) * vw, (ty + h2) * period);
      c += vec2(sin(uTime * 0.12 + h3 * 6.2831), cos(uTime * 0.10 + h4 * 6.2831)) * 46.0;
      float r = mix(210.0, 380.0, h3);
      vec2 d = P - c;
      col = mix(col, orbColor(h4), exp(-dot(d, d) / (r * r)) * 0.66);
    }
  }
  return col;
}

// dots(): a fine grid, parallax 0.6 — this is what visibly bends at the glass edges
float dots(vec2 p, float blur) {
  vec2 Q = vec2(p.x, p.y + uScroll * 0.6);
  float sp = 26.0;
  vec2 cell = mod(Q, sp) - sp * 0.5;
  float fade = clamp(1.0 - blur / 8.0, 0.0, 1.0);
  return (1.0 - smoothstep(1.0, 1.9 + blur * 0.45, length(cell))) * fade * 0.28;
}

const vec3 DOT = vec3(0.20, 0.55, 0.82);

float sdRR(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec3 col = mix(orbs(frag), DOT, dots(frag, 0.0));
  vec3 base = col;

  for (int i = 0; i < MAXP; i++) {
    if (i >= uCount) break;
    vec4 R = uRects[i];
    vec2 hs = R.zw * 0.5;
    vec2 lp = frag - (R.xy + hs);
    float rad = min(uRad[i], min(hs.x, hs.y));
    float d = sdRR(lp, hs, rad);
    if (d < 0.0) {
      vec2 e = vec2(1.0, 0.0);
      vec2 n = vec2(sdRR(lp + e.xy, hs, rad) - sdRR(lp - e.xy, hs, rad),
                    sdRR(lp + e.yx, hs, rad) - sdRR(lp - e.yx, hs, rad));
      n /= max(length(n), 1e-4);

      float bevel = min(26.0, min(hs.x, hs.y) * 0.5);
      float t = 1.0 - smoothstep(0.0, bevel, -d);       // 1 at the rim, 0 inside
      float k = t * t * (3.0 - 2.0 * t);

      vec2 off = -n * k * bevel * 0.6;                   // refraction: the rim magnifies what's just inside
      vec2 ca  = -n * k * 2.6;                           // colour fringing at the rim
      float blur = mix(6.5, 1.5, k);

      vec3 g = orbs(frag + off);
      g.r = mix(g.r, DOT.r, dots(frag + off + ca, blur));
      g.g = mix(g.g, DOT.g, dots(frag + off, blur));
      g.b = mix(g.b, DOT.b, dots(frag + off - ca, blur));
      g = mix(g, vec3(1.0), 0.08 + 0.10 * (1.0 - k));    // frost

      vec2 toL = uMouse - frag;                          // rim light follows the pointer
      float near = exp(-dot(toL, toL) / (520.0 * 520.0));
      float facing = clamp(dot(n, normalize(toL + vec2(0.001))), 0.0, 1.0);
      float rim = t * t * t;
      g += rim * (0.06 + 0.24 * facing * (0.35 + 0.65 * near));
      g -= rim * 0.04 * clamp(n.y, 0.0, 1.0);

      col = mix(base, g, uAlpha[i]);
      break;
    }
  }

  float grain = (hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) - 0.5) / 255.0 * 2.0;
  gl_FragColor = vec4(col + grain, 1.0);
}`.replace(/MAXP/g, String(MAX));

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("[glass] shader error:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) {
    root.classList.add("no-webgl");
    return;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("[glass] link error:", gl.getProgramInfoLog(prog));
    root.classList.add("no-webgl");
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ["uRes", "uDpr", "uTime", "uScroll", "uMouse", "uCount", "uRects", "uRad", "uAlpha"].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  document.body.insertBefore(canvas, document.body.firstChild);
  root.classList.add("has-glass-shader");

  /* ── which elements are glass? ─────────────────────────── */
  const visible = new Set();
  const tracked = new WeakSet();
  const radius = new WeakMap();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
    },
    { rootMargin: "160px 0px" }
  );
  const readRadius = (el) => {
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius);
    return isFinite(r) ? r : 24;
  };
  function scan() {
    document.querySelectorAll("[data-glass]").forEach((el) => {
      if (tracked.has(el)) return;
      tracked.add(el);
      radius.set(el, readRadius(el));
      io.observe(el);
    });
  }
  scan();
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.addedNodes.length) {
        scan();
        break;
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener(
    "resize",
    () => document.querySelectorAll("[data-glass]").forEach((el) => radius.set(el, readRadius(el))),
    { passive: true }
  );

  function alphaOf(el, now) {
    if (!el.classList.contains("reveal")) return 1;
    if (!el.classList.contains("in")) return 0;
    const k = Math.min(1, Math.max(0, (now - (+el.dataset.revealAt || 0)) / 700));
    return 1 - Math.pow(1 - k, 3);
  }

  /* ── render loop ───────────────────────────────────────── */
  let quality = Math.min(1, Math.max(0.25, parseFloat((location.search.match(/[?&]glassquality=([\d.]+)/) || [])[1] || "1")));
  const stats = { frames: 0, panels: 0 };
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    const w = Math.max(1, Math.round(window.innerWidth * dpr));
    const h = Math.max(1, Math.round(window.innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  const mouse = { x: -400, y: -400, tx: -400, ty: -400 };
  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
    },
    { passive: true }
  );

  const rects = new Float32Array(MAX * 4);
  const rads = new Float32Array(MAX);
  const alph = new Float32Array(MAX);
  const start = performance.now();
  let last = 0;
  let slow = 0;
  let lost = false;

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    root.classList.remove("has-glass-shader");
    root.classList.add("no-webgl");
    canvas.style.display = "none";
  });

  function frame(now) {
    if (lost) return;
    requestAnimationFrame(frame);
    if (document.hidden) {
      last = 0;
      return;
    }
    // drop resolution on slow machines
    if (last) {
      const dt = now - last;
      if (dt > 34) slow++;
      else if (slow > 0) slow -= 0.5;
      if (slow > 45 && quality > 0.5) {
        quality = Math.max(0.5, quality - 0.25);
        slow = 0;
      }
    }
    last = now;
    size();

    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;

    let n = 0;
    const vh = window.innerHeight;
    for (const el of visible) {
      if (n >= MAX) break;
      if (!el.isConnected) {
        visible.delete(el);
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < -60 || r.top > vh + 60) continue;
      rects[n * 4] = r.left;
      rects[n * 4 + 1] = r.top;
      rects[n * 4 + 2] = r.width;
      rects[n * 4 + 3] = r.height;
      rads[n] = radius.get(el) || 24;
      alph[n] = alphaOf(el, now);
      n++;
    }

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uDpr, canvas.width / Math.max(1, window.innerWidth));
    gl.uniform1f(U.uTime, reduceMotion.matches ? 0 : (now - start) / 1000);
    gl.uniform1f(U.uScroll, window.scrollY || window.pageYOffset || 0);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform1i(U.uCount, n);
    gl.uniform4fv(U.uRects, rects);
    gl.uniform1fv(U.uRad, rads);
    gl.uniform1fv(U.uAlpha, alph);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    stats.frames++;
    stats.panels = n;
  }
  requestAnimationFrame(frame);

  window.GlassShader = { refresh: scan, stats, get quality() { return quality; } };
})();
