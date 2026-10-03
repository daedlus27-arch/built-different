/*
 * Built Different · core
 * Shared helpers, the post loader (window.Blog), header/footer,
 * reveal-on-scroll, toasts, share / copy link / save.
 */
(function () {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");
  const SITE = window.SITE || {};

  /* ── small helpers ─────────────────────────────────────── */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[‘’“”'"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  function parseDate(s) {
    if (s instanceof Date) return s;
    const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (!m) {
      const d = new Date(s);
      return isNaN(d) ? new Date() : d;
    }
    return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 9, m[5] ? +m[5] : 0);
  }
  const fmtDate = (d, o) => d.toLocaleDateString("en-US", o || { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const pad = (n) => String(n).padStart(2, "0");
  const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function plainText(md) {
    return String(md || "")
      .replace(/^:::.*$/gm, " ")
      .replace(/^\s*(?:org|dept|name|title|number|access|photo|footer)\s*:.*$/gim, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_~`|<=-]/g, " ");
  }
  const wordCount = (md) => (plainText(md).match(/[A-Za-z0-9’']+/g) || []).length;
  const readTime = (md) => Math.max(1, Math.round(wordCount(md) / 230));
  function firstParagraph(md) {
    const blocks = String(md || "").split(/\n\s*\n/);
    for (const b of blocks) {
      const t = b.trim();
      if (!t || /^(:::|#|>|!\[|-\s|\d+\.)/.test(t)) continue;
      const clean = plainText(t).replace(/\s+/g, " ").trim();
      return clean.length > 220 ? clean.slice(0, 217).replace(/\s+\S*$/, "") + "…" : clean;
    }
    return "";
  }

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
  };

  /* ── icons (stroke, 24×24) ─────────────────────────────── */
  const ICONS = {
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5"/>',
    share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v12M7 8l5-5 5 5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17v.01"/>',
  };
  const icon = (name, size = 18, extra = "") =>
    `<svg class="icon ${extra}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;

  /* ── post registry ─────────────────────────────────────── */
  const BASE = (document.querySelector('meta[name="bd-base"]') || {}).content || "";
  const raw = [];
  let loading = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(src);
      s.onerror = () => reject(new Error("Could not load " + src));
      document.head.appendChild(s);
    });
  }

  function normalize(p, file) {
    const post = Object.assign(
      { title: "Untitled post", accent: "", deck: "", category: (SITE.categories && SITE.categories[0] && SITE.categories[0].name) || "Life", tags: [], body: "", stats: [], timeline: [] },
      p || {}
    );
    post.slug = slugify(post.slug || post.title) || "post";
    post._date = parseDate(post.date);
    post.tags = Array.isArray(post.tags) ? post.tags : String(post.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    post.readTime = +post.readTime || readTime(post.body);
    post.excerpt = post.excerpt || post.deck || firstParagraph(post.body);
    post.file = file || post.file || "";
    const cover = Object.assign({}, post.cover || {});
    const thumb = Object.assign({}, post.thumb || {});
    post.cover = {
      eyebrow: cover.eyebrow || fmtDate(post._date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) + (SITE.location ? " · " + SITE.location : ""),
      pills: Array.isArray(cover.pills) ? cover.pills.filter(Boolean) : [],
      tagline: cover.tagline || "",
      tone: cover.tone || "sky",
      image: cover.image || "",
    };
    const firstWords = post.title.split(/[:.!?(]/)[0].trim().split(/\s+/).slice(0, 2).join(" ");
    post.thumb = { word: thumb.word || firstWords, tone: thumb.tone || post.cover.tone, image: thumb.image || "" };
    post.stats = Array.isArray(post.stats) ? post.stats : [];
    post.timeline = Array.isArray(post.timeline) ? post.timeline : [];
    return post;
  }

  const Blog = {
    showDrafts: false,
    post(p) {
      const cs = document.currentScript;
      const file = cs && cs.src ? decodeURIComponent(cs.src.split("/").pop().split("?")[0]) : "";
      const n = normalize(p, file);
      n._raw = p;
      raw.push(n);
    },
    normalize,
    load() {
      if (loading) return loading;
      const files = (window.POST_FILES || []).filter(Boolean);
      loading = Promise.all(
        files.map((f) =>
          loadScript(BASE + "content/posts/" + f).catch((err) => {
            console.warn("[Built Different] " + err.message + " — is it listed correctly in content/posts/_list.js?");
          })
        )
      ).then(() => {
        const seen = new Map();
        raw.forEach((p) => seen.set(p.slug, p)); // later files win on duplicate slugs
        const list = Array.from(seen.values()).filter((p) => Blog.showDrafts || !p.draft);
        list.sort((a, b) => b._date - a._date);
        Blog.all = list;
        return list;
      });
      return loading;
    },
    all: [],
    url: (slug) => "post.html?p=" + encodeURIComponent(slug),
    categoryUrl: (c) => "archive.html?c=" + encodeURIComponent(c),
    find: (slug) => Blog.all.find((p) => p.slug === slug),
  };

  /* ── saved posts ───────────────────────────────────────── */
  const Saved = {
    list: () => store.get("bd:saved", []),
    has: (slug) => Saved.list().includes(slug),
    toggle(slug) {
      const l = Saved.list();
      const i = l.indexOf(slug);
      if (i >= 0) l.splice(i, 1);
      else l.unshift(slug);
      store.set("bd:saved", l);
      return i < 0;
    },
  };

  /* ── header / footer ───────────────────────────────────── */
  function brandHtml() {
    const b = SITE.brand || ["built", "different"];
    return `${esc(b[0])} <span>${esc(b[1] || "")}</span>`;
  }

  function headerHtml(page) {
    const links = (SITE.nav || [])
      .map((n) => {
        const on = n.page === page;
        return `<a class="nav__link${on ? " is-active" : ""}" href="${esc(n.href)}"${on ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`;
      })
      .join("");
    return `
<header class="site-header">
  <nav class="nav" data-liquid aria-label="Main">
    <a class="nav__brand" href="index.html" aria-label="${esc(SITE.title)} — home">
      <span class="logo">${esc(SITE.logo || "BD")}</span>
      <span class="brand-text"><span class="brand-name">${brandHtml()}</span><span class="brand-sub">${esc(SITE.subtitle || "")}</span></span>
    </a>
    <div class="nav__links">${links}</div>
    <div class="nav__actions">
      <a class="icon-btn" href="archive.html#search" aria-label="Search posts">${icon("search")}</a>
      <a class="btn btn--primary btn--sm nav__cta" href="index.html#newsletter">Subscribe</a>
      <button class="icon-btn nav__toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon("menu")}</button>
    </div>
    <span class="nav__progress" aria-hidden="true"><span></span></span>
  </nav>
  <div class="mobile-menu" id="mobile-menu" hidden>
    ${links}
    <a class="btn btn--primary" href="index.html#newsletter">Subscribe</a>
  </div>
</header>`;
  }

  function footerHtml() {
    const f = SITE.footer || {};
    const cats = (SITE.categories || []).map((c) => `<a href="${Blog.categoryUrl(c.name)}">${esc(c.name)}</a>`).join("");
    return `
<footer class="site-footer container">
  <div class="footer glass" data-glass>
    <div class="footer__brand">
      <a class="nav__brand" href="index.html"><span class="logo">${esc(SITE.logo || "BD")}</span><span class="brand-name">${brandHtml()}</span></a>
      <p>${esc(f.blurb || SITE.description || "")}</p>
    </div>
    <div class="footer__col"><h4>Sections</h4>${cats}</div>
    <div class="footer__col"><h4>The blog</h4><a href="index.html">Home</a><a href="archive.html">Archive</a><a href="about.html">About me</a><a href="contact.html">Contact</a></div>
    <div class="footer__col"><h4>Support</h4><a href="index.html#newsletter">Subscribe</a><a href="contact.html#tips">Send a tip</a><a href="contact.html#advertise">Advertise (please)</a><a href="contact.html#corrections">Corrections (no)</a></div>
    <div class="footer__bottom">
      <span>© ${new Date().getFullYear()} ${esc(SITE.title || "")}. ${esc(f.legal || "")}</span>
      <span class="footer__joke">${esc(f.joke || "")}</span>
    </div>
  </div>
</footer>`;
  }

  function bindHeader() {
    const toggle = $(".nav__toggle");
    const menu = $("#mobile-menu");
    if (!toggle || !menu) return;
    const set = (open) => {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.innerHTML = icon(open ? "close" : "menu");
    };
    toggle.addEventListener("click", () => set(menu.hidden));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) set(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) set(false);
    });
    const header = $(".site-header");
    const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ── reveal on scroll ──────────────────────────────────── */
  let revealIO = null;
  function reveal(scope = document) {
    const items = $$(".reveal:not(.in)", scope);
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.dataset.revealAt = String(performance.now());
            e.target.classList.add("in");
            revealIO.unobserve(e.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.02 }
      );
    }
    items.forEach((el) => revealIO.observe(el));
  }

  /* ── toast ─────────────────────────────────────────────── */
  let toastEl = null;
  let toastTimer = 0;
  function toast(msg, ms = 2600) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  /* ── clipboard ─────────────────────────────────────────── */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    ta.remove();
    return ok;
  }

  /* ── back to top ───────────────────────────────────────── */
  function toTop() {
    const b = document.createElement("button");
    b.className = "to-top";
    b.type = "button";
    b.setAttribute("aria-label", "Back to top");
    b.setAttribute("data-liquid", "");
    b.setAttribute("data-liquid-strength", "42");
    b.setAttribute("data-liquid-bevel", "20");
    b.setAttribute("data-liquid-frost", "1.2");
    b.innerHTML = icon("arrowUp", 20);
    b.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(b);
    const on = () => b.classList.toggle("show", window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /* ── delegated actions ─────────────────────────────────── */
  function bindActions() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const act = btn.dataset.action;
      const url = btn.dataset.url ? new URL(btn.dataset.url, location.href).href : location.href;
      if (act === "share") {
        e.preventDefault();
        const data = { title: document.title, text: btn.dataset.text || "", url };
        if (navigator.share) {
          try {
            await navigator.share(data);
            return;
          } catch (err) {
            if (err && err.name === "AbortError") return;
          }
        }
        toast((await copyText(url)) ? "Link copied. Go spread the word." : "Couldn't copy. The link is in your address bar.");
      } else if (act === "copy-link") {
        e.preventDefault();
        toast((await copyText(url)) ? "Link copied." : "Couldn't copy. The link is in your address bar.");
      } else if (act === "save") {
        e.preventDefault();
        const on = Saved.toggle(btn.dataset.slug);
        btn.classList.toggle("is-on", on);
        const label = btn.querySelector(".label");
        if (label) label.textContent = on ? "Saved" : "Save";
        toast(on ? "Saved. Find it under Saved in the archive." : "Removed from saved.");
      }
    });

    document.addEventListener("submit", (e) => {
      const form = e.target.closest("[data-newsletter]");
      if (!form) return;
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      if (input && !input.value.trim()) {
        input.focus();
        toast("Pop an email in first.");
        return;
      }
      toast((SITE.newsletter && SITE.newsletter.thanks) || "Thanks!", 3600);
      form.reset();
    });

    // soft light that follows the pointer on glass cards
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest && e.target.closest("[data-shine]");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      },
      { passive: true }
    );
  }

  /* ── page boot ─────────────────────────────────────────── */
  function init(page) {
    document.body.dataset.page = page || document.body.dataset.page || "";
    const h = $("#site-header");
    if (h) h.outerHTML = headerHtml(page);
    const f = $("#site-footer");
    if (f) f.outerHTML = footerHtml();
    bindHeader();
    bindActions();
    toTop();
    reveal();
    if (window.LiquidGlass) window.LiquidGlass.refresh();
  }

  function params() {
    return new URLSearchParams(location.search);
  }

  // content is rendered after load, so jump to #anchors ourselves
  function scrollToHash() {
    if (!location.hash || location.hash.length < 2) return;
    let el = null;
    try {
      el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch (e) {}
    if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 80);
  }

  function setMeta(name, content) {
    let m = document.querySelector(`meta[name="${name}"]`);
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", name);
      document.head.appendChild(m);
    }
    m.setAttribute("content", content || "");
  }

  window.Blog = Blog;
  window.Saved = Saved;
  window.U = { $, $$, esc, slugify, parseDate, fmtDate, fmtTime, isoDay, wordCount, readTime, firstParagraph, store, copyText, pad };
  window.Icons = { icon, ICONS };
  window.Site = { init, reveal, toast, params, scrollToHash, setMeta, headerHtml, footerHtml };
})();
