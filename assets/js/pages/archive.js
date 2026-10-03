/* Built Different · archive (search + category filters) */
(function () {
  "use strict";
  Site.init("archive");

  const root = document.getElementById("archive-root");
  const { esc, fmtDate } = U;
  const { icon } = Icons;
  const SITE = window.SITE || {};
  const params = Site.params();
  let query = params.get("q") || "";
  let cat = params.get("c") || "All";

  Blog.load().then((posts) => {
    const cats = ["All"].concat((SITE.categories || []).map((c) => c.name), ["Saved"]);
    if (!cats.includes(cat)) cat = "All";

    const count = (c) => {
      if (c === "All") return posts.length;
      if (c === "Saved") return posts.filter((p) => Saved.has(p.slug)).length;
      return posts.filter((p) => p.category === c).length;
    };

    root.innerHTML = `
<section class="archive-head glass reveal" data-glass>
  <span class="eyebrow">The archive</span>
  <h1>Every post. <span class="accent">All of them.</span></h1>
  <p>${posts.length} ${posts.length === 1 ? "post" : "posts"} and counting. Search titles, tags, anything. Press <strong>/</strong> to jump to the search box.</p>
  <div class="search" id="search">${icon("search", 20)}<input type="search" id="q" placeholder="Search posts…" value="${esc(query)}" aria-label="Search posts" autocomplete="off" spellcheck="false"></div>
  <div class="filter-chips" role="group" aria-label="Filter by category">
    ${cats.map((c) => `<button class="chip chip--toggle${c === cat ? " is-on" : ""}" type="button" data-cat="${esc(c)}" aria-pressed="${c === cat}">${c === "Saved" ? icon("bookmark", 13) : ""}${esc(c)} <span class="chip__count">${count(c)}</span></button>`).join("")}
  </div>
</section>
<section class="archive-list glass reveal" data-glass><div id="results" aria-live="polite"></div></section>`;

    const input = document.getElementById("q");
    const results = document.getElementById("results");

    const haystack = (p) => [p.title, p.deck, p.excerpt, p.category, (p.tags || []).join(" "), p.body].join(" ").toLowerCase();
    const highlight = (text) => {
      const safe = esc(text);
      const q = query.trim();
      if (!q) return safe;
      const re = new RegExp("(" + esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      return safe.replace(re, "<mark>$1</mark>");
    };
    const plain = (s) => String(s || "").replace(/[*_]/g, "");

    function render() {
      const q = query.trim().toLowerCase();
      const list = posts.filter((p) => {
        if (cat === "Saved" && !Saved.has(p.slug)) return false;
        if (cat !== "All" && cat !== "Saved" && p.category !== cat) return false;
        return !q || haystack(p).includes(q);
      });
      if (!list.length) {
        results.innerHTML = `<div class="archive-empty">${cat === "Saved" && !q ? "Nothing saved yet. Hit <strong>Save</strong> on any post and it'll show up here." : `No posts match <strong>${esc(query)}</strong>. Try something shorter.`}</div>`;
        return;
      }
      let month = "";
      results.innerHTML = list
        .map((p) => {
          const m = fmtDate(p._date, { month: "long", year: "numeric" });
          const head = m !== month ? `<h2 class="archive-month">${esc(m)}</h2>` : "";
          month = m;
          return `${head}<a class="archive-item" href="${Blog.url(p.slug)}">
  <span class="archive-item__date">${fmtDate(p._date, { month: "short" })}<b>${p._date.getDate()}</b></span>
  <span>
    <span class="chip">${esc(p.category)}</span>
    <h3 class="archive-item__title">${highlight(plain(p.title))}</h3>
    <p class="archive-item__deck">${highlight(plain(p.excerpt))}</p>
  </span>
  <span class="archive-item__meta">${p.readTime} min ${icon("arrowRight", 15)}</span>
</a>`;
        })
        .join("");
    }

    function syncUrl() {
      const sp = new URLSearchParams();
      if (query.trim()) sp.set("q", query.trim());
      if (cat !== "All") sp.set("c", cat);
      const qs = sp.toString();
      try {
        history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
      } catch (e) {}
    }

    input.addEventListener("input", () => {
      query = input.value;
      render();
      syncUrl();
    });
    root.querySelector(".filter-chips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      cat = b.dataset.cat;
      root.querySelectorAll("[data-cat]").forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", String(on));
      });
      render();
      syncUrl();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input && !/input|textarea|select/i.test((document.activeElement || {}).tagName || "")) {
        e.preventDefault();
        input.focus();
      }
    });

    render();
    Site.reveal(root);
    if (location.hash === "#search") setTimeout(() => input.focus({ preventScroll: true }), 300);
  });
})();
