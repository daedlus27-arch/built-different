/*
 * Built Different · Markdown renderer
 *
 * Normal Markdown:
 *   **bold**  *italic*  [link](https://…)  [another post](post:slug)
 *   ## Eyebrow | Section title      (eyebrow optional, e.g. "## Round 01 | The beatdown")
 *   ### Smaller heading
 *   - bullet list        1. numbered list        > quote        ---  divider
 *   ![Alt text](assets/img/photo.jpg "Caption")
 *
 * Special blocks (start with :::name, end with :::):
 *   :::quote by="Who said it"            :::phone contact="R." caption="…" credit="…"
 *   :::badge caption="…"                 :::callout title="…" post="other-post-slug"
 *   :::psa title="Wear a helmet." label="Ad · unpaid"
 *   :::card title="What I learned"       :::note       :::stats       :::newsletter
 *   :::image src="…" caption="…"         :::youtube id="VIDEO_ID" caption="…"
 */
(function () {
  "use strict";

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
  const slugify =
    (window.U && window.U.slugify) ||
    ((s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));

  /* typographer: curly quotes, ellipses, em dashes — text only, never inside tags */
  function smart(html) {
    return html
      .split(/(<[^>]+>)/g)
      .map((seg) => {
        if (!seg || seg.charAt(0) === "<") return seg;
        return seg
          .replace(/(^|[\s(\[{—–\-\/])"(?=\S)/g, "$1“")
          .replace(/"/g, "”")
          .replace(/(^|[\s(\[{—–\-\/])'(?=\S)/g, "$1‘")
          .replace(/'/g, "’")
          .replace(/ -- /g, " — ")
          .replace(/\.\.\./g, "…");
      })
      .join("");
  }

  function linkHref(url) {
    url = String(url).trim();
    if (/^post:/i.test(url)) return "post.html?p=" + encodeURIComponent(url.slice(5));
    if (/^javascript:/i.test(url)) return "#";
    return url.replace(/"/g, "%22");
  }

  function inline(text) {
    let s = esc(text);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, label, url, title) => {
      const href = linkHref(url);
      const ext = /^https?:\/\//i.test(href);
      return `<a href="${href}"${title ? ` title="${escAttr(title)}"` : ""}${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
    });
    s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^\w])_([^_\n]+?)_(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    s = s.replace(/ {2,}\n|\\\n/g, "<br>");
    s = s.replace(/\n/g, " ");
    return smart(s);
  }

  function parseAttrs(str) {
    const attrs = {};
    let rest = String(str || "");
    rest = rest.replace(/([\w-]+)\s*=\s*"([^"]*)"|([\w-]+)\s*=\s*'([^']*)'/g, (m, k1, v1, k2, v2) => {
      attrs[(k1 || k2).toLowerCase()] = v1 != null ? v1 : v2;
      return " ";
    });
    attrs.arg = rest.trim();
    return attrs;
  }

  const isBlockStart = (l) =>
    /^:::/.test(l) || /^#{1,4}\s/.test(l) || /^>\s?/.test(l) || /^\s*[-*+]\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l) || /^!\[/.test(l) || /^(-{3,}|\*{3,}|_{3,})\s*$/.test(l);

  function caption(attrs) {
    if (!attrs.caption && !attrs.credit) return "";
    return `<figcaption class="figcaption">${attrs.caption ? inline(attrs.caption) : ""}${attrs.credit ? ` <strong>${esc(attrs.credit)}</strong>` : ""}</figcaption>`;
  }

  /* ── special blocks ────────────────────────────────────── */
  const BLOCKS = {
    quote(a, body, o) {
      const by = a.by || a.arg;
      return `<figure class="pull-quote glass-inset${o.rv}"><blockquote>${inline(body.trim())}</blockquote>${by ? `<figcaption>— ${inline(by)}</figcaption>` : ""}</figure>`;
    },

    phone(a, body, o) {
      const name = a.contact || a.arg || "Unknown";
      let prev = null;
      let n = 0;
      const rows = body
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          let m;
          if ((m = l.match(/^<\s?(.*)$/))) {
            const cont = prev === "recv";
            prev = "recv";
            return `<div class="bubble bubble--recv${cont ? " bubble--cont" : ""}" style="--i:${n++}">${inline(m[1])}</div>`;
          }
          if ((m = l.match(/^=\s?(.*)$/))) {
            prev = null;
            return `<div class="phone__note">${inline(m[1])}</div>`;
          }
          m = l.match(/^>\s?(.*)$/);
          const cont = prev === "sent";
          prev = "sent";
          return `<div class="bubble bubble--sent${cont ? " bubble--cont" : ""}" style="--i:${n++}">${inline(m ? m[1] : l)}</div>`;
        })
        .join("");
      const initial = esc(name.replace(/[^A-Za-z0-9]/g, "").charAt(0) || "?");
      return `<figure class="phone-figure glass-inset${o.rv}">
  <div class="phone"><div class="phone__screen">
    <div class="phone__head"><div class="phone__notch"></div><div class="phone__avatar">${initial}</div><div class="phone__name">${esc(name)}</div><div class="phone__app">${esc(a.app || "iFruit Messages")}</div></div>
    <div class="phone__body">${rows}<div class="phone__status">${esc(a.status || "Read")}</div></div>
  </div></div>
  ${caption(a)}
</figure>`;
    },

    badge(a, body, o) {
      const kv = {};
      body.split("\n").forEach((l) => {
        const m = l.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
        if (m) kv[m[1].toLowerCase()] = m[2].trim();
      });
      const photo = kv.photo ? `<img src="${escAttr(kv.photo)}" alt="ID photo">` : "<span>PHOTO<br>PENDING</span>";
      return `<figure class="badge-figure glass-inset${o.rv}">
  <div class="idcard">
    <div class="idcard__top"><div class="idcard__slot"></div><div class="idcard__org">${esc(kv.org || "Los Santos City Government")}</div>${kv.dept ? `<div class="idcard__dept">${esc(kv.dept)}</div>` : ""}</div>
    <div class="idcard__body">
      <div class="idcard__photo">${photo}</div>
      <div class="idcard__info">
        <div class="idcard__name">${esc(kv.name || "")}</div>
        ${kv.title ? `<span class="chip">${esc(kv.title)}</span>` : ""}
        <div class="idcard__meta">${kv.number ? `Badge <strong>#${esc(kv.number)}</strong><br>` : ""}${kv.access ? `<span>Access: ${esc(kv.access)}</span>` : ""}</div>
        <div class="idcard__barcode" aria-hidden="true"></div>
      </div>
    </div>
    <div class="idcard__foot">${esc(kv.footer || "Property of the City · If found, return to City Government Center")}</div>
  </div>
  ${caption(a)}
</figure>`;
    },

    callout(a, body, o) {
      const inner = body.trim() ? `<div class="callout__body">${render(body, { reveal: false }).html}</div>` : "";
      const title = a.title || a.arg || "";
      const head = `<span class="eyebrow">${esc(a.label || (a.post ? "Previously on Built Different" : "Heads up"))}</span>`;
      if (a.post) {
        let label = title;
        if (!label && window.Blog && window.Blog.find) {
          const p = window.Blog.find(a.post);
          if (p) label = p.title;
        }
        return `<a class="callout glass-inset${o.rv}" href="post.html?p=${encodeURIComponent(a.post)}">${head}<span class="callout__title">${inline(label || a.post)} <span class="callout__arrow">→</span></span>${inner}</a>`;
      }
      return `<aside class="callout glass-inset${o.rv}">${head}${title ? `<span class="callout__title">${inline(title)}</span>` : ""}${inner}</aside>`;
    },

    psa(a, body, o) {
      const lines = body
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map(inline)
        .join("<br>");
      return `<aside class="psa${o.rv}"><div><span class="psa__label">${esc(a.label || "Ad · unpaid")}</span><div class="psa__title">${inline(a.title || a.arg || "")}</div></div>${lines ? `<div class="psa__lines">${lines}</div>` : ""}</aside>`;
    },

    card(a, body, o) {
      return `<div class="card-block glass-inset${o.rv}">${a.title || a.arg ? `<h4 class="card-block__title">${inline(a.title || a.arg)}</h4>` : ""}${render(body, { reveal: false }).html}</div>`;
    },

    note(a, body, o) {
      return `<div class="note${o.rv}">${render(body, { reveal: false }).html}</div>`;
    },

    stats(a, body, o) {
      const tiles = body
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [num, ...rest] = l.split("|");
          return `<div class="stat stat--inline"><div class="stat__num">${esc(num.trim())}</div><div class="stat__label">${inline(rest.join("|").trim())}</div></div>`;
        })
        .join("");
      return `<div class="stats stats--inline${o.rv}">${tiles}</div>`;
    },

    image(a, body, o) {
      return figure(a.src || a.arg, a.alt || a.caption || "", a, o);
    },

    youtube(a, body, o) {
      const id = String(a.id || a.arg || "").replace(/[^\w-]/g, "");
      if (!id) return "";
      return `<figure class="video-figure${o.rv}"><div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${escAttr(a.title || "Video")}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>${caption(a)}</figure>`;
    },

    newsletter(a, body, o) {
      if (window.V && window.V.newsletter) return window.V.newsletter({ reveal: o.reveal !== false, compact: true });
      return "";
    },
  };

  function figure(src, alt, a, o) {
    if (!src) return "";
    return `<figure class="figure glass-inset${o.rv}"><img src="${escAttr(src)}" alt="${escAttr(alt || "")}" loading="lazy">${caption(a)}</figure>`;
  }

  /* ── main renderer ─────────────────────────────────────── */
  function render(md, opts) {
    opts = Object.assign({ reveal: true, lede: false }, opts || {});
    const o = { rv: opts.reveal ? " reveal" : "", reveal: opts.reveal };
    const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    const sections = [];
    const used = new Set();
    const uniq = (id) => {
      let base = id || "section";
      let n = base;
      let k = 2;
      while (used.has(n)) n = base + "-" + k++;
      used.add(n);
      return n;
    };
    let first = true;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }

      // ::: special block
      let m = line.match(/^:::\s*([a-zA-Z][\w-]*)\s*(.*)$/);
      if (m) {
        const name = m[1].toLowerCase();
        const attrs = parseAttrs(m[2]);
        const body = [];
        let depth = 0;
        i++;
        while (i < lines.length) {
          const l = lines[i];
          if (/^:::\s*$/.test(l)) {
            if (depth === 0) {
              i++;
              break;
            }
            depth--;
          } else if (/^:::\s*[a-zA-Z]/.test(l)) depth++;
          body.push(l);
          i++;
        }
        const fn = BLOCKS[name] || BLOCKS.callout;
        out.push(fn(attrs, body.join("\n"), o));
        first = false;
        continue;
      }

      // headings
      m = line.match(/^(#{1,4})\s+(.+?)\s*(?:\{#([\w-]+)\})?\s*$/);
      if (m) {
        const level = m[1].length <= 2 ? 2 : m[1].length;
        const text = m[2];
        if (level === 2) {
          const parts = text.split(/\s+\|\s+/);
          const eyebrow = parts.length > 1 ? parts[0] : "";
          const title = parts.length > 1 ? parts.slice(1).join(" | ") : parts[0];
          const id = uniq(m[3] || slugify(eyebrow || title));
          sections.push({ id, eyebrow, title });
          out.push(
            `<h2 class="section-heading" id="${id}">${eyebrow ? `<span class="chip section-heading__eyebrow">${inline(eyebrow)}</span>` : ""}<span class="section-heading__title">${inline(title)}</span></h2>`
          );
        } else {
          const id = uniq(m[3] || slugify(text));
          out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
        }
        i++;
        first = false;
        continue;
      }

      // divider
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        out.push('<hr class="divider">');
        i++;
        continue;
      }

      // image on its own line
      m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/);
      if (m) {
        out.push(figure(m[2], m[1], { caption: m[3] || "" }, o));
        i++;
        continue;
      }

      // blockquote → pull quote (a last line starting with — or -- becomes the attribution)
      if (/^>\s?/.test(line)) {
        const q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
        let by = "";
        if (q.length > 1 && /^\s*(—|--)\s*/.test(q[q.length - 1])) by = q.pop().replace(/^\s*(—|--)\s*/, "");
        out.push(BLOCKS.quote({ by }, q.join("\n"), o));
        continue;
      }

      // lists
      const ul = /^\s*[-*+]\s+/;
      const ol = /^\s*\d+[.)]\s+/;
      if (ul.test(line) || ol.test(line)) {
        const ordered = ol.test(line);
        const re = ordered ? ol : ul;
        const items = [];
        while (i < lines.length && re.test(lines[i])) {
          let item = lines[i].replace(re, "");
          i++;
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) item += "\n" + lines[i++].trim();
          items.push(`<li>${inline(item)}</li>`);
        }
        out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
        first = false;
        continue;
      }

      // paragraph
      const para = [];
      while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i]))) {
        if (!para.length && isBlockStart(lines[i])) break;
        para.push(lines[i]);
        i++;
      }
      if (!para.length) {
        // safety: unknown construct — print it as text
        para.push(lines[i]);
        i++;
      }
      out.push(`<p${first && opts.lede ? ' class="lede"' : ""}>${inline(para.join("\n"))}</p>`);
      first = false;
    }

    return { html: out.join("\n"), sections };
  }

  window.MD = { render, inline, smart, parseAttrs, BLOCKS };
})();
