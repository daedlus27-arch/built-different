/*
 * Built Different · view renderers
 * Every page builds its HTML from these pieces, and Post Studio's
 * live preview uses the exact same ones.
 *
 * Common options:  { shader: false }  → don't register panels with the WebGL glass
 *                  { reveal: false }  → no fade-in animation classes
 */
(function () {
  "use strict";
  const { esc, fmtDate, fmtTime } = window.U;
  const { icon } = window.Icons;
  const SITE = window.SITE || {};

  const G = (o) => (o && o.shader === false ? "" : " data-glass");
  const R = (o) => (o && o.reveal === false ? "" : " reveal");
  const inline = (s) => window.MD.inline(s || "");
  const TONES = ["sky", "deep", "navy", "ice"];
  const tone = (t) => (TONES.includes(t) ? t : "sky");

  /* ── small pieces ─────────────────────────────────────── */
  function avatar(size = "md") {
    return `<span class="avatar avatar--${size}" aria-hidden="true">${esc((SITE.author && SITE.author.initials) || "TB")}</span>`;
  }

  function chipLink(cat) {
    return `<a class="chip" href="${window.Blog.categoryUrl(cat)}">${esc(cat)}</a>`;
  }

  function coverPills(pills) {
    return (pills || [])
      .filter(Boolean)
      .map((p, i) => `<span class="cover-pill" style="--i:${i}"><span class="cover-pill__n">${i + 1}</span>${esc(p)}</span>`)
      .join("");
  }

  function cover(post, extraClass = "") {
    const c = post.cover || {};
    return `<div class="cover cover--${tone(c.tone)} ${extraClass}">
      ${c.image ? `<img class="cover__img" src="${esc(c.image)}" alt="">` : ""}
      <div class="cover__eyebrow">${esc(c.eyebrow || "")}</div>
      ${c.pills && c.pills.length ? `<div class="cover__pills">${coverPills(c.pills)}</div>` : ""}
      ${c.tagline ? `<p class="cover__tagline">${inline(c.tagline)}</p>` : ""}
    </div>`;
  }

  function title(post) {
    const t = post.title || "";
    const a = (post.accent || "").trim();
    if (a && t.endsWith(a)) return `${inline(t.slice(0, t.length - a.length))}<span class="accent">${inline(a)}</span>`;
    return inline(t);
  }

  function meta(post) {
    return `${fmtDate(post._date)} · ${post.readTime} min read`;
  }

  /* ── post hero ────────────────────────────────────────── */
  function postHero(post, o = {}) {
    const saved = window.Saved && window.Saved.has(post.slug);
    const long = post.readTime >= 7 ? "Long read · " : "";
    return `<header class="post-hero glass${R(o)}"${G(o)}>
  ${cover(post)}
  <div class="post-hero__body">
    <div class="chips">${chipLink(post.category)}<span class="chip chip--ghost">${long}${post.readTime} min</span>${post.draft ? '<span class="chip chip--warn">Draft</span>' : ""}</div>
    <h1 class="post-title">${title(post)}</h1>
    ${post.deck ? `<p class="post-deck">${inline(post.deck)}</p>` : ""}
    <div class="post-meta">
      ${avatar("md")}
      <div class="post-meta__who">
        <div class="post-meta__name">${esc((SITE.author && SITE.author.name) || "")}${post.byline ? ` <span>· ${inline(post.byline)}</span>` : ""}</div>
        <div class="post-meta__sub">Posted ${fmtDate(post._date, { month: "short", day: "numeric", year: "numeric" })}, ${fmtTime(post._date)}${post.updatedNote ? ` · ${inline(post.updatedNote)}` : ""}</div>
      </div>
      <div class="post-actions">
        <button class="btn btn--ghost btn--sm" type="button" data-action="share" data-text="${esc(post.deck || "")}">${icon("share", 16)}<span>Share</span></button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="copy-link">${icon("link", 16)}<span>Copy link</span></button>
        <button class="btn btn--ghost btn--sm${saved ? " is-on" : ""}" type="button" data-action="save" data-slug="${esc(post.slug)}">${icon("bookmark", 16)}<span class="label">${saved ? "Saved" : "Save"}</span></button>
      </div>
    </div>
  </div>
</header>`;
  }

  /* ── stat tiles ───────────────────────────────────────── */
  function stats(list, o = {}) {
    if (!list || !list.length) return "";
    const tiles = list
      .map((s, i) => {
        const num = Array.isArray(s) ? s[0] : s.value;
        const label = Array.isArray(s) ? s[1] : s.label;
        return `<div class="stat glass${R(o)}" style="--d:${i * 60}ms"${G(o)}><div class="stat__num" data-count="${esc(num)}">${esc(num)}</div><div class="stat__label">${inline(label)}</div></div>`;
      })
      .join("");
    return `<section class="stats-wrap" aria-label="By the numbers"><span class="eyebrow stats-eyebrow">The damage, by the numbers</span><div class="stats">${tiles}</div></section>`;
  }

  /* ── timeline (sticky sidebar) ────────────────────────── */
  function timeline(post, o = {}) {
    if (!post.timeline || !post.timeline.length) return "";
    const items = post.timeline
      .map((t, i) => {
        const time = Array.isArray(t) ? t[0] : t.time;
        const text = Array.isArray(t) ? t[1] : t.text;
        const sec = Array.isArray(t) ? t[2] : t.section;
        const inner = `<span class="timeline__dot" aria-hidden="true"></span><span><span class="timeline__time">${esc(time)}</span><span class="timeline__text">${inline(text)}</span></span>`;
        return `<li class="timeline__item" data-section="${esc(sec || "")}">${sec ? `<a href="#${esc(sec)}">${inner}</a>` : `<div>${inner}</div>`}</li>`;
      })
      .join("");
    return `<nav class="widget timeline glass${R(o)}"${G(o)} aria-label="Timeline of the day">
  <span class="eyebrow">${esc(post.timelineLabel || "Yesterday, in order")}</span>
  <h3 class="widget__title">The timeline</h3>
  <p class="widget__hint">Click a step to jump to that part of the story.</p>
  <div class="timeline__track"><span class="timeline__fill" aria-hidden="true"></span><ol>${items}</ol></div>
</nav>`;
  }

  /* ── sidebar widgets ──────────────────────────────────── */
  function statusWidget(o = {}) {
    const rows = (SITE.status || []).map(([k, v]) => `<div class="status-row"><dt>${esc(k)}</dt><dd><span class="status-pill">${esc(v)}</span></dd></div>`).join("");
    return `<section class="widget glass${R(o)}"${G(o)} data-shine>
  <span class="eyebrow"><span class="live-dot" aria-hidden="true"></span>Current status</span>
  <h3 class="widget__title">How I’m doing</h3>
  <dl class="status-list">${rows}</dl>
  ${o.subscribe === false ? "" : `<a class="btn btn--primary btn--block" href="index.html#newsletter">Subscribe free</a>`}
</section>`;
  }

  function adWidget(o = {}) {
    const a = SITE.ad || {};
    return `<section class="widget ad-card glass${R(o)}"${G(o)}>
  <div class="ad-card__inner">
    <span class="eyebrow eyebrow--muted">${esc(a.label || "Advertisement")}</span>
    <div class="ad-card__title">${esc(a.title || "")} <span>${esc(a.titleAccent || "")}</span></div>
    <p>${esc(a.body || "")}</p>
    ${a.note ? `<p class="ad-card__note">${esc(a.note)}</p>` : ""}
    ${a.cta ? `<a class="btn btn--ghost btn--sm" href="${esc(a.cta.href)}">${esc(a.cta.label)}</a>` : ""}
  </div>
</section>`;
  }

  function popular(posts, current, o = {}) {
    const list = (posts || [])
      .filter((p) => !current || p.slug !== current.slug)
      .slice()
      .sort((a, b) => (+b.views || 0) - (+a.views || 0) || b._date - a._date)
      .slice(0, 5);
    if (!list.length) return "";
    const items = list
      .map((p, i) => `<li><span class="most-read__n">${String(i + 1).padStart(2, "0")}</span><a href="${window.Blog.url(p.slug)}"><span class="eyebrow">${esc(p.category)}</span><span class="most-read__title">${inline(p.title)}</span></a></li>`)
      .join("");
    return `<section class="widget glass${R(o)}"${G(o)}>
  <span class="eyebrow">Most read</span>
  <h3 class="widget__title">Popular on the blog</h3>
  <ol class="most-read">${items}</ol>
</section>`;
  }

  function authorCard(o = {}) {
    const a = SITE.author || {};
    return `<section class="author-card glass${R(o)}"${G(o)}>
  ${avatar("lg")}
  <div>
    <span class="eyebrow">About the author</span>
    <h3 class="author-card__name">${esc(a.name || "")}</h3>
    <p>${esc(a.bio || "")}</p>
    <div class="btn-row"><a class="btn btn--primary btn--sm" href="about.html">More about me</a><a class="btn btn--ghost btn--sm" href="archive.html">All posts</a></div>
  </div>
</section>`;
  }

  function tags(post) {
    if (!post.tags || !post.tags.length) return "";
    return `<footer class="post-tags">${post.tags.map((t) => `<a class="tag" href="archive.html?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join("")}</footer>`;
  }

  /* ── cards ────────────────────────────────────────────── */
  function postCard(p, o = {}) {
    const t = p.thumb || {};
    return `<a class="post-card glass${R(o)}" href="${window.Blog.url(p.slug)}"${G(o)} data-shine>
  <div class="thumb thumb--${tone(t.tone)}">${t.image ? `<img src="${esc(t.image)}" alt="" loading="lazy">` : ""}<span>${esc(t.word || "")}</span></div>
  <div class="post-card__body">
    <span class="chip">${esc(p.category)}</span>
    <h3 class="post-card__title">${inline(p.title)}</h3>
    <p class="post-card__excerpt">${inline(p.excerpt || "")}</p>
    <div class="post-card__meta">${icon("calendar", 14)}<span>${meta(p)}</span></div>
  </div>
</a>`;
  }

  function featured(p, o = {}) {
    return `<a class="featured glass${R(o)}" href="${window.Blog.url(p.slug)}"${G(o)}>
  ${cover(p, "featured__cover")}
  <div class="featured__body">
    <div class="chips"><span class="chip chip--solid">Latest</span><span class="chip">${esc(p.category)}</span></div>
    <h2 class="featured__title">${title(p)}</h2>
    ${p.deck ? `<p class="featured__deck">${inline(p.deck)}</p>` : ""}
    <div class="featured__foot">
      <span class="post-card__meta">${avatar("sm")}<span>${esc((SITE.author && SITE.author.name) || "")} · ${meta(p)}</span></span>
      <span class="btn btn--primary btn--sm">Read it ${icon("arrowRight", 16)}</span>
    </div>
  </div>
</a>`;
  }

  function keepReading(posts, current, o = {}) {
    const others = (posts || []).filter((p) => !current || p.slug !== current.slug).slice(0, 3);
    if (!others.length) return "";
    return `<section class="section keep-reading">
  <div class="section-head"><div><span class="eyebrow">More from ${esc((SITE.author && SITE.author.name.split(" ")[0]) || "me")}</span><h2 class="section-title">Keep reading</h2></div><a class="btn btn--ghost btn--sm" href="archive.html">All posts ${icon("arrowRight", 16)}</a></div>
  <div class="post-grid">${others.map((p) => postCard(p, o)).join("")}</div>
</section>`;
  }

  function newsletter(o = {}) {
    const n = SITE.newsletter || {};
    return `<section class="newsletter${o.compact ? " newsletter--compact" : ""}${R(o)}"${o.id ? ` id="${o.id}"` : ""}>
  <div class="newsletter__text"><h3>${esc(n.title || "")}</h3><p>${esc(n.body || "")}</p></div>
  <form class="newsletter__form" data-newsletter novalidate>
    <label class="sr-only" for="nl-${o.id || "inline"}">Email address</label>
    <input id="nl-${o.id || "inline"}" type="email" placeholder="${esc(n.placeholder || "you@email.com")}" autocomplete="email">
    <button class="btn btn--white" type="submit">${esc(n.button || "Subscribe")}</button>
  </form>
</section>`;
  }

  /* ── whole post page ──────────────────────────────────── */
  function postPage(post, posts, o = {}) {
    const md = window.MD.render(post.body, { lede: true, reveal: o.reveal !== false });
    post._sections = md.sections;
    return {
      sections: md.sections,
      html: `<article class="post" data-slug="${esc(post.slug)}">
  ${postHero(post, o)}
  ${stats(post.stats, o)}
  <div class="post-layout">
    <div class="post-main">
      <div class="post-body glass${R(o)}"${G(o)}>
        <div class="prose">${md.html}</div>
        ${tags(post)}
      </div>
      ${o.preview ? "" : authorCard(o)}
    </div>
    ${
      o.preview
        ? ""
        : `<aside class="post-aside" aria-label="Sidebar">
      ${statusWidget(o)}
      ${adWidget(o)}
      ${popular(posts, post, o)}
      ${post.timeline && post.timeline.length ? `<div class="timeline-wrap">${timeline(post, o)}</div>` : ""}
    </aside>`
    }
  </div>
  ${o.preview ? "" : keepReading(posts, post, o)}
</article>`,
    };
  }

  window.V = { avatar, cover, coverPills, title, meta, postHero, stats, timeline, statusWidget, adWidget, popular, authorCard, tags, postCard, featured, keepReading, newsletter, postPage, chipLink, tone };
})();
