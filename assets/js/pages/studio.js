/*
 * Built Different · Post Studio
 * Write a post with a live preview, then save it straight into
 * content/posts (Chrome / Edge) or download the file.
 */
(function () {
  "use strict";
  Site.init("studio");
  Blog.showDrafts = true;

  const { esc, slugify, pad, store, copyText, parseDate } = U;
  const { icon } = Icons;
  const SITE = window.SITE || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const DRAFT_KEY = "bd:studio-draft";
  const TONES = [
    ["sky", "Sky blue"],
    ["deep", "Deep blue"],
    ["navy", "Navy"],
    ["ice", "Ice"],
  ];

  const STARTER =
    "**Start strong.** This first paragraph shows up a little bigger, like a newspaper lede.\n\n" +
    "## Part 01 | Your first section\n\n" +
    "Write normally. Leave an empty line between paragraphs. Use the buttons above to drop in quotes, phone screenshots, ID badges and more.\n\n" +
    ':::quote by="Someone wise"\nA line worth pulling out.\n:::\n';

  const SNIPPETS = {
    section: { text: "\n## Part 02 | Section title\n\n", select: "Section title" },
    link: { text: "[link text](https://)", select: "link text" },
    postlink: { text: "[another post](post:its-slug)", select: "its-slug" },
    list: { text: "\n- First thing\n- Second thing\n", select: "First thing" },
    numbered: { text: "\n1. First thing\n2. Second thing\n", select: "First thing" },
    divider: { text: "\n---\n" },
    quote: { text: '\n:::quote by="Who said it"\nThe line worth pulling out.\n:::\n', select: "The line worth pulling out." },
    phone: {
      text: '\n:::phone contact="Name" caption="What the screenshot shows." credit="Screenshot: my phone"\n> A text I sent\n< A text I got back\n:::\n',
      select: "Name",
    },
    badge: {
      text: '\n:::badge caption="A caption under the badge."\norg: Los Santos City Government\ndept: Department of IT\nname: T. Barrett\ntitle: Junior IT Specialist\nnumber: 225422\naccess: City buildings & IT areas\n:::\n',
      select: "A caption under the badge.",
    },
    callout: { text: '\n:::callout post="slug-of-another-post"\nA little note under the link.\n:::\n', select: "slug-of-another-post" },
    psa: { text: '\n:::psa title="Wear a helmet." label="Ad · unpaid"\nIt won\'t stop everything.\nIt\'ll stop more than nothing.\n:::\n', select: "Wear a helmet." },
    card: { text: '\n:::card title="What I learned"\n1. First lesson\n2. Second lesson\n:::\n', select: "What I learned" },
    note: { text: "\n:::note\nP.S. A little aside.\n:::\n", select: "P.S. A little aside." },
    stats: { text: "\n:::stats\n2 | black eyes\n$1,200 | on two drinks\n:::\n" },
    image: { text: '\n![What the picture shows](content/images/your-photo.jpg "Caption under the photo")\n', select: "your-photo.jpg" },
    youtube: { text: '\n:::youtube id="VIDEO_ID" caption="What the clip shows."\n:::\n', select: "VIDEO_ID" },
    newsletter: { text: "\n:::newsletter\n:::\n" },
  };

  /* ── state ─────────────────────────────────────────────── */
  const nowLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const firstCategory = () => (SITE.categories && SITE.categories[0] && SITE.categories[0].name) || "Life";
  function blank() {
    return {
      slug: "",
      title: "",
      accent: "",
      deck: "",
      date: nowLocal(),
      category: firstCategory(),
      tags: [],
      byline: "",
      updatedNote: "",
      featured: false,
      draft: false,
      views: "",
      cover: { eyebrow: "", pills: [], tagline: "", tone: "sky", image: "" },
      thumb: { word: "", tone: "sky" },
      stats: [],
      timelineLabel: "",
      timeline: [],
      body: STARTER,
    };
  }
  function fromRaw(r) {
    r = JSON.parse(JSON.stringify(r || {}));
    const p = Object.assign(blank(), r);
    p.cover = Object.assign(blank().cover, r.cover || {});
    p.thumb = Object.assign(blank().thumb, r.thumb || {});
    p.cover.pills = Array.isArray(p.cover.pills) ? p.cover.pills : [];
    p.tags = Array.isArray(r.tags) ? r.tags : String(r.tags || "").split(",").map((s) => s.trim()).filter(Boolean);
    p.stats = (r.stats || []).map((s) => (Array.isArray(s) ? [String(s[0] ?? ""), String(s[1] ?? "")] : [String(s.value ?? ""), String(s.label ?? "")]));
    p.timeline = (r.timeline || []).map((t) =>
      Array.isArray(t) ? { time: t[0] || "", text: t[1] || "", section: t[2] || "" } : { time: t.time || "", text: t.text || "", section: t.section || "" }
    );
    p.body = String(r.body || "").replace(/^\n+/, "");
    p.views = r.views || "";
    p.date = toStoreDate(parseDate(r.date));
    return p;
  }
  const toStoreDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const toInput = (s) => String(s || "").replace(" ", "T").slice(0, 16);
  const fromInput = (v) => String(v || "").replace("T", " ");

  let state = { post: blank(), file: "", slugTouched: false, dirty: false };
  let dir = null;
  let lastSections = [];
  let lastKey = "";

  /* ── serialize to a post file ──────────────────────────── */
  function cleaned(p) {
    const c = JSON.parse(JSON.stringify(p));
    c.slug = slugify(c.slug || c.title) || "untitled";
    c.stats = (c.stats || []).filter((s) => String(s[0]).trim() || String(s[1]).trim());
    c.timeline = (c.timeline || []).filter((t) => String(t.time).trim() || String(t.text).trim());
    c.views = +c.views || 0;
    return c;
  }

  function serialize(p) {
    const c = cleaned(p);
    const out = {};
    const put = (k, v) => {
      if (v === undefined || v === null || v === "" || v === false || v === 0 || (Array.isArray(v) && !v.length)) return;
      out[k] = v;
    };
    put("slug", c.slug);
    put("title", c.title || "Untitled post");
    put("accent", c.accent);
    put("deck", c.deck);
    put("date", c.date);
    put("category", c.category);
    put("tags", c.tags);
    put("byline", c.byline);
    put("updatedNote", c.updatedNote);
    put("featured", c.featured);
    put("draft", c.draft);
    put("views", c.views);
    const cover = {};
    if (c.cover.eyebrow) cover.eyebrow = c.cover.eyebrow;
    if (c.cover.pills && c.cover.pills.length) cover.pills = c.cover.pills;
    if (c.cover.tagline) cover.tagline = c.cover.tagline;
    if (c.cover.tone && c.cover.tone !== "sky") cover.tone = c.cover.tone;
    if (c.cover.image) cover.image = c.cover.image;
    if (Object.keys(cover).length) out.cover = cover;
    const thumb = {};
    if (c.thumb.word) thumb.word = c.thumb.word;
    if (c.thumb.tone && c.thumb.tone !== "sky") thumb.tone = c.thumb.tone;
    if (Object.keys(thumb).length) out.thumb = thumb;
    put("stats", c.stats);
    put("timelineLabel", c.timelineLabel);
    put("timeline", c.timeline.map((t) => (t.section ? { time: t.time, text: t.text, section: t.section } : { time: t.time, text: t.text })));
    return out;
  }

  function pretty(v, ind) {
    const padStr = " ".repeat(ind);
    if (Array.isArray(v)) {
      if (!v.length) return "[]";
      if (v.every((x) => x === null || typeof x !== "object")) return "[" + v.map((x) => JSON.stringify(x)).join(", ") + "]";
      return "[\n" + v.map((x) => padStr + "  " + pretty(x, ind + 2)).join(",\n") + ",\n" + padStr + "]";
    }
    if (v && typeof v === "object") {
      const entries = Object.entries(v);
      const flat = entries.every(([, x]) => x === null || typeof x !== "object" || (Array.isArray(x) && x.every((y) => typeof y !== "object")));
      const one = "{ " + entries.map(([k, x]) => `${k}: ${pretty(x, ind + 2)}`).join(", ") + " }";
      if (flat && one.length <= 100) return one;
      return "{\n" + entries.map(([k, x]) => `${padStr}  ${k}: ${pretty(x, ind + 2)}`).join(",\n") + ",\n" + padStr + "}";
    }
    return JSON.stringify(v);
  }

  const escTpl = (s) => String(s).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

  function fileText(p = state.post) {
    const meta = serialize(p);
    const title = String(meta.title || "").replace(/\*\//g, "* /");
    let s = `/*\n * ${title}\n * Written in Post Studio. Edit by hand, or open it again in studio.html.\n */\nBlog.post({\n`;
    for (const [k, v] of Object.entries(meta)) s += `  ${k}: ${pretty(v, 2)},\n`;
    s += "  body: `\n" + escTpl(String(p.body || "").replace(/\s+$/, "")) + "\n`,\n});\n";
    return s;
  }

  function fileName(p = state.post) {
    const day = (String(p.date || "").match(/^\d{4}-\d{2}-\d{2}/) || [toStoreDate(new Date()).slice(0, 10)])[0];
    return `${day}-${slugify(p.slug || p.title) || "untitled"}.js`;
  }

  function listText(files) {
    return (
      "/*\n * POST LIST\n * Every post file in this folder has to be listed here, or the\n * site won't load it. Order doesn't matter (posts sort by date).\n *\n" +
      " * Post Studio's \"Save to posts folder\" button rewrites this file\n * for you. If you add a post by hand, add its filename below.\n * (Files starting with _ are ignored.)\n */\n" +
      "window.POST_FILES = [\n" +
      files.map((f) => `  ${JSON.stringify(f)},`).join("\n") +
      "\n];\n"
    );
  }

  function updatedList() {
    const name = fileName();
    let files = (window.POST_FILES || []).slice();
    if (state.file && state.file !== name) files = files.filter((f) => f !== state.file);
    if (!files.includes(name)) files.push(name);
    return files.sort().reverse();
  }

  function parseFile(text) {
    let captured = null;
    const fake = { post: (p) => (captured = p) };
    // eslint-disable-next-line no-new-func
    new Function("Blog", "window", String(text))(fake, { POST_FILES: [] });
    if (!captured) throw new Error("No Blog.post({ … }) found in that file.");
    return captured;
  }

  /* ── form ──────────────────────────────────────────────── */
  const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const set = (o, path, v) => {
    const ks = path.split(".");
    let x = o;
    ks.slice(0, -1).forEach((k) => {
      if (!x[k] || typeof x[k] !== "object") x[k] = {};
      x = x[k];
    });
    x[ks[ks.length - 1]] = v;
  };

  function fillForm() {
    $$("[data-bind]").forEach((el) => {
      const v = get(state.post, el.dataset.bind);
      if (el.type === "checkbox") el.checked = !!v;
      else if (el.dataset.kind === "list") el.value = (v || []).join(", ");
      else if (el.type === "datetime-local") el.value = toInput(v);
      else el.value = v == null ? "" : v;
    });
    lastKey = "";
    renderRows();
    update();
  }

  function readField(el) {
    const path = el.dataset.bind;
    let v;
    if (el.type === "checkbox") v = el.checked;
    else if (el.dataset.kind === "list") v = el.value.split(",").map((s) => s.trim()).filter(Boolean);
    else if (el.type === "datetime-local") v = fromInput(el.value);
    else v = el.value;
    set(state.post, path, v);
    if (path === "slug") state.slugTouched = !!el.value.trim();
    if (path === "title" && !state.slugTouched) {
      state.post.slug = slugify(state.post.title);
      const s = $("#f-slug");
      if (s) s.value = state.post.slug;
    }
  }

  function renderRows() {
    const st = $("#rows-stats");
    st.innerHTML =
      state.post.stats
        .map(
          (s, i) => `<div class="row-item row-item--stat">
  <input class="input" data-row="stats" data-i="${i}" data-k="0" value="${esc(s[0])}" placeholder="2" aria-label="Number">
  <input class="input" data-row="stats" data-i="${i}" data-k="1" value="${esc(s[1])}" placeholder="black eyes" aria-label="Label">
  <button class="row-del" type="button" data-del="stats" data-i="${i}" aria-label="Remove tile">${icon("close", 14)}</button>
</div>`
        )
        .join("") || '<p class="field__hint">No number tiles. They show under the banner when you add some.</p>';

    const tl = $("#rows-timeline");
    tl.innerHTML =
      state.post.timeline
        .map((t, i) => {
          const opts = lastSections
            .map((s) => `<option value="${esc(s.id)}"${s.id === t.section ? " selected" : ""}>${esc((s.eyebrow ? s.eyebrow + ": " : "") + s.title)}</option>`)
            .join("");
          const missing = t.section && !lastSections.some((s) => s.id === t.section) ? `<option value="${esc(t.section)}" selected>#${esc(t.section)} (not found)</option>` : "";
          return `<div class="row-item row-item--tl">
  <input class="input" data-row="timeline" data-i="${i}" data-k="time" value="${esc(t.time)}" placeholder="8:00 PM" aria-label="Time">
  <input class="input" data-row="timeline" data-i="${i}" data-k="text" value="${esc(t.text)}" placeholder="What happened" aria-label="What happened">
  <select class="input" data-row="timeline" data-i="${i}" data-k="section" aria-label="Jumps to"><option value="">No link</option>${opts}${missing}</select>
  <button class="row-del" type="button" data-del="timeline" data-i="${i}" aria-label="Remove step">${icon("close", 14)}</button>
</div>`;
        })
        .join("") || '<p class="field__hint">No timeline. Add steps to get the sticky timeline in the sidebar.</p>';
  }

  /* ── preview ───────────────────────────────────────────── */
  let timer = 0;
  function changed() {
    state.dirty = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      update();
      autosave();
    }, 140);
  }

  function update() {
    const post = Blog.normalize(cleaned(state.post), state.file);
    const others = Blog.all.filter((p) => p.slug !== post.slug);
    let out;
    try {
      out = V.postPage(post, others.concat([post]), { shader: false, reveal: false, preview: true });
    } catch (err) {
      $("#preview").innerHTML = `<div class="preview-error">Preview hiccup: ${esc(err.message)}</div>`;
      return;
    }
    const timelineHtml = post.timeline.length ? `<div class="preview-label">Sidebar timeline</div>${V.timeline(post, { shader: false, reveal: false })}` : "";
    const card = `<div class="preview-label">The card on the home page</div><div class="preview-card">${V.postCard(post, { shader: false, reveal: false })}</div>`;
    const scroller = $("#preview");
    const keep = scroller.scrollTop;
    scroller.innerHTML = out.html + timelineHtml + card;
    scroller.scrollTop = keep;

    $("#count").textContent = `${U.wordCount(state.post.body).toLocaleString()} words · ${post.readTime} min read`;
    $("#file-name").textContent = fileName();
    $("#slug-preview").textContent = post.slug;
    $("#studio-heading").textContent = state.post.title || "New post";

    const key = out.sections.map((s) => s.id + "|" + s.title).join("~");
    if (key !== lastKey) {
      lastKey = key;
      lastSections = out.sections;
      if (!document.activeElement || !document.activeElement.closest("#rows-timeline")) renderRows();
    }
  }

  function autosave() {
    store.set(DRAFT_KEY, { post: state.post, file: state.file, slugTouched: state.slugTouched, at: Date.now() });
  }
  const status = (msg) => ($("#studio-status").textContent = msg);

  /* ── commands ──────────────────────────────────────────── */
  function download(name, text) {
    const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1500);
  }

  // The repo's content/posts upload page, if config.js has github.repo set.
  function githubUploadUrl() {
    const g = SITE.github || {};
    const repo = String(g.repo || "").trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return "";
    return `https://github.com/${repo}/upload/${encodeURIComponent(g.branch || "main")}/content/posts`;
  }

  // kind: "download" (after Download) or "saved" (after Save to posts folder)
  function openSheet(kind = "download") {
    const saved = kind === "saved";
    const gh = githubUploadUrl();
    $$(".sheet-file").forEach((el) => (el.textContent = fileName()));
    $$("#sheet [data-sheet]").forEach((el) => (el.hidden = el.dataset.sheet !== kind));
    $("#sheet-eyebrow").textContent = saved ? "Saved" : "Almost there";
    $("#sheet-title").textContent = saved ? "Saved to your folder" : "One more step";
    $("#sheet [data-gh]").hidden = !gh;
    const link = $("#sheet [data-gh-link]");
    link.hidden = !gh;
    if (gh) link.href = gh;
    link.classList.toggle("btn--primary", saved);
    link.classList.toggle("btn--ghost", !saved);
    const list = $('[data-cmd="download-list"]');
    list.hidden = saved;
    $("#sheet").hidden = false;
    (saved ? link : list).focus();
  }
  function closeSheet() {
    $("#sheet").hidden = true;
  }

  async function writeFile(handle, name, text) {
    const fh = await handle.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(text);
    await w.close();
  }

  async function saveToFolder() {
    if (!state.post.title.trim()) {
      toast("Give it a title first.");
      $('[data-tab="write"]').click();
      $("#f-title").focus();
      return;
    }
    if (!("showDirectoryPicker" in window)) {
      Site.toast("This browser can't save straight into folders, so here's a download instead. (Chrome and Edge can.)", 4200);
      return doDownload();
    }
    try {
      if (!dir) {
        dir = await window.showDirectoryPicker({ id: "bd-posts", mode: "readwrite" });
        let hasList = false;
        for await (const name of dir.keys()) {
          if (name === "_list.js") {
            hasList = true;
            break;
          }
        }
        if (!hasList && !confirm("That folder has no _list.js in it.\nPick the content/posts folder inside your site.\n\nSave here anyway?")) {
          dir = null;
          return;
        }
      }
      if (dir.queryPermission && (await dir.queryPermission({ mode: "readwrite" })) !== "granted") {
        if ((await dir.requestPermission({ mode: "readwrite" })) !== "granted") {
          Site.toast("Studio wasn't allowed to save there.");
          return;
        }
      }
      const name = fileName();
      await writeFile(dir, name, fileText());
      if (state.file && state.file !== name && confirm(`You renamed this post.\nDelete the old file "${state.file}"?`)) {
        try {
          await dir.removeEntry(state.file);
        } catch (e) {}
      }
      const files = [];
      for await (const [n, h] of dir.entries()) {
        if (h.kind === "file" && /\.js$/i.test(n) && !n.startsWith("_")) files.push(n);
      }
      files.sort().reverse();
      await writeFile(dir, "_list.js", listText(files));
      window.POST_FILES = files;
      state.file = name;
      state.dirty = false;
      autosave();
      status(`Saved ${name}. ${files.length} posts listed. Reload the blog to see it.`);
      if (githubUploadUrl()) openSheet("saved");
      else Site.toast("Saved! Reload the blog to see your post.");
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.error(err);
      dir = null;
      Site.toast("Couldn't save to that folder (" + (err.message || err) + "). Try Download instead.", 4800);
    }
  }

  function doDownload() {
    download(fileName(), fileText());
    state.dirty = false;
    status(`Downloaded ${fileName()}.`);
    openSheet();
  }

  const toast = (m) => Site.toast(m);

  function newPost() {
    if (state.dirty && !confirm("Start a new post? Your current draft will be cleared.")) return;
    state = { post: blank(), file: "", slugTouched: false, dirty: false };
    fillForm();
    autosave();
    status("New post. Your draft autosaves in this browser while you type.");
    $("#open-post").value = "";
    $('[data-tab="write"]').click();
    $("#f-title").focus();
  }

  function loadRaw(raw, file, label) {
    state = { post: fromRaw(raw), file: file || "", slugTouched: true, dirty: false };
    fillForm();
    autosave();
    status(`Editing ${label || file || "a post"}. Save to overwrite it.`);
  }

  /* ── toolbar ───────────────────────────────────────────── */
  const body = () => $("#f-body");
  function insertText(text, select) {
    const ta = body();
    ta.focus();
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    ta.setRangeText(text, s, e, "end");
    if (select) {
      const i = ta.value.indexOf(select, s);
      if (i >= 0) ta.setSelectionRange(i, i + select.length);
    }
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function wrapText(l, r, placeholder) {
    const ta = body();
    ta.focus();
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = ta.value.slice(s, e) || placeholder;
    ta.setRangeText(l + sel + r, s, e, "end");
    ta.setSelectionRange(s + l.length, s + l.length + sel.length);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function runInsert(kind) {
    if (kind === "bold") return wrapText("**", "**", "bold text");
    if (kind === "italic") return wrapText("*", "*", "italic text");
    if (kind === "link") {
      const ta = body();
      if (ta.selectionEnd > ta.selectionStart) return wrapText("[", "](https://)", "");
    }
    const sn = SNIPPETS[kind];
    if (sn) insertText(sn.text, sn.select);
  }

  /* ── wire everything up ────────────────────────────────── */
  function setup() {
    // selects
    $("#f-category").innerHTML = (SITE.categories || [{ name: "Life" }]).map((c) => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("");
    $$("[data-tones]").forEach((s) => (s.innerHTML = TONES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")));

    // tabs
    $$(".tab").forEach((t) =>
      t.addEventListener("click", () => {
        $$(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
        $$(".tab-panel").forEach((p) => (p.hidden = p.dataset.panel !== t.dataset.tab));
      })
    );

    // fields
    const onField = (e) => {
      const el = e.target;
      if (el.matches("[data-bind]")) {
        readField(el);
        changed();
        return;
      }
      const row = el.closest("[data-row]");
      if (row) {
        const arr = state.post[row.dataset.row];
        const i = +row.dataset.i;
        if (!arr || !arr[i]) return;
        if (row.dataset.row === "stats") arr[i][+row.dataset.k] = row.value;
        else arr[i][row.dataset.k] = row.value;
        changed();
      }
    };
    document.addEventListener("input", onField);
    document.addEventListener("change", onField);

    document.addEventListener("click", (e) => {
      const del = e.target.closest("[data-del]");
      if (del) {
        state.post[del.dataset.del].splice(+del.dataset.i, 1);
        renderRows();
        changed();
        return;
      }
      const add = e.target.closest("[data-add]");
      if (add) {
        if (add.dataset.add === "stats") state.post.stats.push(["", ""]);
        else state.post.timeline.push({ time: "", text: "", section: "" });
        renderRows();
        changed();
        const rows = $(add.dataset.add === "stats" ? "#rows-stats" : "#rows-timeline").querySelectorAll(".row-item");
        const last = rows[rows.length - 1];
        if (last) last.querySelector("input").focus();
        return;
      }
      const ins = e.target.closest("[data-ins]");
      if (ins) {
        runInsert(ins.dataset.ins);
        return;
      }
      const cmd = e.target.closest("[data-cmd]");
      if (!cmd) return;
      const c = cmd.dataset.cmd;
      if (c === "new") newPost();
      else if (c === "load") $("#file-input").click();
      else if (c === "copy") copyText(fileText()).then((ok) => toast(ok ? "Post code copied." : "Couldn't copy. Use Download instead."));
      else if (c === "download") {
        if (!state.post.title.trim()) return toast("Give it a title first.");
        doDownload();
      } else if (c === "save") saveToFolder();
      else if (c === "download-list") download("_list.js", listText(updatedList()));
      else if (c === "close-sheet") closeSheet();
    });

    // links inside the preview shouldn't navigate away
    $("#preview").addEventListener("click", (e) => {
      if (e.target.closest("a")) e.preventDefault();
    });

    $("#sheet").addEventListener("click", (e) => {
      if (e.target.id === "sheet") closeSheet();
    });

    // open a file
    $("#file-input").addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        loadRaw(parseFile(await f.text()), f.name, f.name);
        toast("Opened " + f.name);
      } catch (err) {
        toast("That doesn't look like a post file: " + err.message);
      }
      e.target.value = "";
    });

    // keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "Escape" && !$("#sheet").hidden) closeSheet();
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        saveToFolder();
      } else if (document.activeElement === body() && (k === "b" || k === "i" || k === "k")) {
        e.preventDefault();
        runInsert(k === "b" ? "bold" : k === "i" ? "italic" : "link");
      }
    });

    window.addEventListener("beforeunload", (e) => {
      if (state.dirty) autosave();
    });

    if (!("showDirectoryPicker" in window)) {
      const b = $("#save-btn");
      b.textContent = "Download post";
      b.title = "This browser can't save into folders directly";
    }
  }

  setup();

  Blog.load().then((posts) => {
    // fill "Edit an existing post…"
    const sel = $("#open-post");
    sel.innerHTML =
      '<option value="">Edit an existing post…</option>' +
      posts.map((p) => `<option value="${esc(p.slug)}">${esc(U.fmtDate(p._date))} · ${esc(p.title.slice(0, 60))}${p.draft ? " (draft)" : ""}</option>`).join("");
    sel.addEventListener("change", () => {
      const p = posts.find((x) => x.slug === sel.value);
      if (!p) return;
      if (state.dirty && !confirm("Open this post? Unsaved changes to your current draft will be lost.")) {
        sel.value = "";
        return;
      }
      loadRaw(p._raw || p, p.file, p.title);
    });

    // ?edit=slug opens a post straight away
    const editSlug = Site.params().get("edit");
    const editing = editSlug && posts.find((p) => p.slug === editSlug);
    const saved = store.get(DRAFT_KEY, null);
    if (editing) {
      loadRaw(editing._raw || editing, editing.file, editing.title);
      sel.value = editing.slug;
    } else if (saved && saved.post) {
      state = { post: Object.assign(blank(), saved.post), file: saved.file || "", slugTouched: !!saved.slugTouched, dirty: false };
      fillForm();
      status("Picked up your last draft from " + new Date(saved.at || Date.now()).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) + ".");
    } else {
      fillForm();
    }
  });
})();
