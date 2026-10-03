/* Built Different · single post page (post.html?p=slug) */
(function () {
  "use strict";
  Site.init("post");

  const root = document.getElementById("post-root");
  const SITE = window.SITE || {};
  const slug = Site.params().get("p") || Site.params().get("slug");

  Blog.load().then((posts) => {
    const post = slug ? posts.find((p) => p.slug === slug) : posts[0];
    if (!post) {
      document.title = "Post not found — " + (SITE.title || "");
      root.innerHTML = `<section class="empty glass reveal" data-glass>
  <span class="eyebrow">404 · post not found</span>
  <h1>This post ran a stop sign.</h1>
  <p>Couldn't find a post called <strong>${U.esc(slug || "")}</strong>. It might have been renamed, or it isn't listed in <strong>content/posts/_list.js</strong> yet.</p>
  <div class="btn-row"><a class="btn btn--primary" href="index.html">Back home</a><a class="btn btn--ghost" href="archive.html">Browse the archive</a></div>
</section>`;
      Site.reveal(root);
      return;
    }

    document.title = `${post.title} — ${SITE.title || ""}`;
    Site.setMeta("description", post.excerpt);

    const { html, sections } = V.postPage(post, posts);
    root.innerHTML = html;
    Site.reveal(root);
    timeline(sections);
    progress();
    countUp();
    Site.scrollToHash();
  });

  /* highlight where you are in the story */
  function timeline(sections) {
    const nav = document.querySelector(".timeline");
    if (!nav) return;
    const items = Array.from(nav.querySelectorAll(".timeline__item"));
    const order = sections.map((s) => s.id);
    const heads = order.map((id) => document.getElementById(id));
    const fill = nav.querySelector(".timeline__fill");
    const track = nav.querySelector(".timeline__track");
    let current = -2;

    function update() {
      const line = window.innerHeight * 0.36;
      let idx = -1;
      heads.forEach((h, i) => {
        if (h && h.getBoundingClientRect().top - line <= 0) idx = i;
      });
      let active = -1;
      items.forEach((it, i) => {
        const si = order.indexOf(it.dataset.section);
        if (si !== -1 && si <= idx) active = i;
      });
      if (active === current) return;
      current = active;
      items.forEach((it, i) => {
        it.classList.toggle("is-active", i === active);
        it.classList.toggle("is-done", i < active);
      });
      if (fill && track) {
        const dot = active >= 0 ? items[active].querySelector(".timeline__dot") : null;
        const h = dot ? dot.getBoundingClientRect().top - track.getBoundingClientRect().top + 8 - 14 : 0;
        fill.style.setProperty("--fill", Math.max(0, h) + "px");
      }
    }
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          update();
        });
      },
      { passive: true }
    );
    window.addEventListener("resize", () => {
      current = -2;
      update();
    });
    update();
  }

  /* reading progress line in the menu bar */
  function progress() {
    const bar = document.querySelector(".nav__progress");
    const body = document.querySelector(".post-body");
    if (!bar || !body) return;
    const update = () => {
      const r = body.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight * 0.5);
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.25 - r.top) / total));
      bar.style.setProperty("--progress", p.toFixed(4));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* numbers count up when the stat tiles appear */
  function countUp() {
    const nums = document.querySelectorAll(".stat__num[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const el = e.target;
          const m = String(el.dataset.count).match(/^(\D*)([\d,]*\.?\d+)(.*)$/);
          if (!m) return;
          const target = parseFloat(m[2].replace(/,/g, ""));
          const decimals = (m[2].split(".")[1] || "").length;
          const commas = m[2].includes(",");
          const start = performance.now();
          const dur = 1000 + Math.min(900, target);
          const fmt = (v) => {
            let s = v.toFixed(decimals);
            if (commas) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            return m[1] + s + m[3];
          };
          const step = (now) => {
            const k = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - k, 4);
            el.textContent = fmt(target * eased);
            if (k < 1) requestAnimationFrame(step);
            else el.textContent = el.dataset.count;
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((n) => io.observe(n));
  }
})();
