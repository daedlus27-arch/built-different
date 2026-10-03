/* Built Different · home page */
(function () {
  "use strict";
  Site.init("home");

  const root = document.getElementById("home-root");
  const { esc } = U;
  const { icon } = Icons;
  const SITE = window.SITE || {};

  Blog.load().then((posts) => {
    const featured = posts.find((p) => p.featured) || posts[0];
    const rest = posts.filter((p) => p !== featured).slice(0, 6);
    const counts = {};
    posts.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
    const brand = SITE.brand || ["built", "different"];

    const hero = `
<section class="home-hero glass reveal" data-glass>
  <div>
    <span class="eyebrow">${esc(SITE.subtitle || "")}</span>
    <h1 class="display">${esc(brand[0])} <span class="accent">${esc(brand[1])}.</span></h1>
    <p class="lead">${esc(SITE.tagline || "")} ${esc(SITE.description || "")}</p>
    <div class="btn-row">
      ${featured ? `<a class="btn btn--primary" href="${Blog.url(featured.slug)}">Read the latest ${icon("arrowRight", 16)}</a>` : ""}
      <a class="btn btn--ghost" href="about.html">About me</a>
    </div>
    <div class="home-hero__meta">
      <span>${icon("pin", 15)} ${esc(SITE.location || "")}</span>
      <span>${icon("sparkle", 15)} ${esc(SITE.weather || "")}</span>
      <span>${icon("pen", 15)} ${posts.length} ${posts.length === 1 ? "post" : "posts"}</span>
    </div>
  </div>
  <div class="home-hero__side">${V.statusWidget({ shader: false, reveal: false })}</div>
</section>`;

    if (!posts.length) {
      root.innerHTML =
        hero +
        `<section class="section empty glass reveal" data-glass><span class="eyebrow">Nothing here yet</span><h2>No posts yet.</h2><p>Open <strong>studio.html</strong> to write your first one, then save it into <strong>content/posts</strong>.</p><div class="btn-row"><a class="btn btn--primary" href="studio.html">Open Post Studio</a></div></section>`;
      Site.reveal(root);
      return;
    }

    const latest = featured
      ? `<section class="section">
  <div class="section-head"><div><span class="eyebrow">Fresh off the keyboard</span><h2 class="section-title">Latest post</h2></div></div>
  ${V.featured(featured)}
</section>`
      : "";

    const more = rest.length
      ? `<section class="section">
  <div class="section-head"><div><span class="eyebrow">The blog</span><h2 class="section-title">More stories</h2></div><a class="btn btn--ghost btn--sm" href="archive.html">See all ${icon("arrowRight", 16)}</a></div>
  <div class="post-grid">${rest.map((p, i) => V.postCard(p).replace('class="post-card glass reveal"', `class="post-card glass reveal" style="--d:${(i % 3) * 80}ms"`)).join("")}</div>
</section>`
      : "";

    const cats = `<section class="section">
  <div class="section-head"><div><span class="eyebrow">Browse</span><h2 class="section-title">By category</h2></div></div>
  <div class="cat-grid">${(SITE.categories || [])
    .map(
      (c, i) =>
        `<a class="cat-card glass reveal" style="--d:${i * 70}ms" href="${Blog.categoryUrl(c.name)}" data-glass data-shine><div class="cat-card__top"><span class="cat-card__name">${esc(c.name)}</span><span class="cat-card__count">${counts[c.name] || 0}</span></div><p>${esc(c.blurb || "")}</p></a>`
    )
    .join("")}</div>
</section>`;

    root.innerHTML = hero + latest + more + cats + V.newsletter({ id: "newsletter" });
    Site.reveal(root);
    Site.scrollToHash();
  });
})();
