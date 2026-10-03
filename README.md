# Built Different — the blog of Tyler Barrett

A white-and-sky-blue blog with real glass: a WebGL shader bends and frosts the sky behind every card as you scroll, and the floating menu bar warps whatever passes under it.

No install, no server, no accounts. **Double-click `index.html` and it runs.**

**Live at https://daedlus27-arch.github.io/built-different/** (published from the GitHub repo [daedlus27-arch/built-different](https://github.com/daedlus27-arch/built-different). See [It's online](#its-online-github-pages) for how to update it).

---

## Opening the site

- **Double-click `index.html`.** Everything works straight from your computer (the fonts need internet; everything else is offline).
- **Best in Chrome or Edge.** They get the full liquid-glass menu bar. Firefox and Safari still get the WebGL glass on every card, with a frosted menu bar instead.
- Add `?noglass` to any address to see the plain version without the shader (e.g. `index.html?noglass`).

## What's in the folder

```
built-different/
├── index.html          Home: intro, latest post, more stories, categories, subscribe box
├── post.html           Every post is shown by this page:  post.html?p=the-post-slug
├── archive.html        All posts: search, category filters, your saved posts
├── about.html          About Tyler (edit the words right in this file)
├── contact.html        Advertise / tips / corrections / where to find me
├── 404.html            "This page ran a stop sign."
├── studio.html         POST STUDIO: write and publish new posts (just for you)
│
├── content/
│   ├── posts/          ← one .js file per post
│   │   ├── _list.js    ← the list of post files the site loads
│   │   └── _template.js← a copy-me example with every option explained
│   └── images/         ← put screenshots and photos here
│
├── assets/
│   ├── css/            base (colours, fonts), glass, components, pages, studio
│   ├── js/
│   │   ├── config.js        ← blog name, menu, "How I'm doing", ad box, footer
│   │   ├── glass-shader.js  ← the WebGL glass
│   │   ├── liquid-glass.js  ← the warping menu bar / back-to-top button
│   │   ├── markdown.js      ← turns your writing into the page
│   │   ├── views.js         ← builds cards, timeline, sidebar, etc.
│   │   ├── core.js          ← loads posts, header, footer, share/save buttons
│   │   └── pages/           ← one small script per page
│   └── img/favicon.svg
│
└── tools/              optional helpers if you have Node.js installed
```

---

## Writing a new post (easy way: Post Studio)

1. Open **`studio.html`** in your browser.
2. Fill in the title and subtitle, then write the story. The preview on the right updates as you type.
3. Use the buttons above the story box to drop in quotes, phone text threads, ID badges, banner ads, number tiles, images and more.
4. Optional: the **Details** tab has the date, category, tags and draft switch. **Banner & extras** has the blue banner pills, the card colour, the number tiles and the sticky timeline.
5. Publish:
   - **Chrome / Edge:** click **Save to posts folder**. The first time, pick the `content/posts` folder inside this site. Studio saves the post *and* updates `_list.js`. Reload the blog. Done.
   - **Other browsers:** click **Download**, move the file into `content/posts`, then click **Download updated _list.js** and replace the old `_list.js` with it.

Studio autosaves your draft in the browser, so closing the tab won't lose anything.

**Editing an old post:** pick it from *Edit an existing post…* at the top of Studio, change it, save again.

**Deleting a post:** delete its file from `content/posts` and remove its line from `_list.js`.

## Writing a post by hand

1. Copy `content/posts/_template.js` and rename the copy, e.g. `2026-10-10-my-new-post.js`.
2. Fill it in. Only `title`, `date` and `body` are required.
3. Add the filename to `content/posts/_list.js`.

The story goes between the two backticks in `body`. Don't use a backtick ( ` ) inside the story itself.

---

## Formatting cheat sheet

```
**bold**    *italic*    [a link](https://example.com)    [another post](post:its-slug)

## Round 01 | The beatdown        ← sky-blue chip + big section heading
### A smaller heading

- bullet point
1. numbered point
---                               ← divider line

![What the picture shows](content/images/photo.jpg "Caption under it")
```

The **first paragraph** of a post is shown slightly bigger, like a newspaper lede.

Section headings get an address automatically (`## Round 01 | …` → `#round-01`). That's what the sidebar timeline links to.

### Special blocks

Start with `:::name`, end with `:::` on its own line.

```
:::quote by="Who said it"
The line worth pulling out.
:::

:::phone contact="R." caption="What the screenshot shows." credit="Screenshot: my phone"
> a text I sent
< a text I got back
= a little note in the middle, like "Read 7:24 PM"
:::

:::badge caption="Caption under the badge." credit="Photograph: me"
org: Los Santos City Government
dept: Department of IT
name: T. Barrett
title: Junior IT Specialist
number: 225422
access: City buildings & IT areas
photo: content/images/badge-photo.jpg      (optional; otherwise "PHOTO PENDING")
:::

:::callout post="slug-of-another-post"
A note under the link. (Leave out post="…" for a plain heads-up box.)
:::

:::psa title="Wear a helmet." label="Ad · unpaid"
Each line here
becomes a line on the right.
:::

:::card title="What I learned"
1. Markdown works inside cards.
2. So do lists.
:::

:::note
P.S. A dashed little aside.
:::

:::stats
2 | black eyes
$1,200 | on two drinks
:::

:::youtube id="VIDEO_ID" caption="What the clip shows."
:::

:::newsletter
:::
```

### Post settings (the top of each post file)

| Setting | What it does |
| --- | --- |
| `slug` | The address: `post.html?p=slug`. Made from the title if left out. |
| `title`, `accent` | The headline. `accent` is the end of the title shown in sky blue. |
| `deck` | The subtitle under the headline. |
| `date` | `"YYYY-MM-DD HH:MM"`. Posts are sorted by this. |
| `category` | One of the categories in `config.js` (Life, Tech, Dating, Rants). |
| `tags` | `["LikeThis", "AndThis"]` — clickable at the bottom of the post. |
| `byline`, `updatedNote` | Little notes next to your name and the date. |
| `featured` | `true` = the big "Latest post" card on the home page. |
| `draft` | `true` = hidden from the blog (Studio still shows it). |
| `views` | Optional number. Higher = higher in "Most read". |
| `cover` | The blue banner: `eyebrow`, `pills`, `tagline`, `tone` (`sky`, `deep`, `navy`, `ice`), `image`. |
| `thumb` | The post's card: `word` and `tone`. |
| `stats` | Number tiles under the banner: `[["2", "black eyes"], …]`. |
| `timeline`, `timelineLabel` | The sticky sidebar timeline: `{ time, text, section }` — `section` is a heading address like `round-01`. |

---

## Changing the site itself

- **Blog name, menu, "How I'm doing", the ad box, newsletter text, footer:** `assets/js/config.js`.
- **About and Contact pages:** edit the words right inside `about.html` and `contact.html`.
- **Colours and fonts:** the variables at the top of `assets/css/base.css`.
- **Glass strength:** in `assets/js/glass-shader.js`, the `0.6` in `vec2 off = -n * k * bevel * 0.6` is how hard the edges bend (keep it under 1.0) and the `2.6` in `vec2 ca = -n * k * 2.6` is the colour fringe. The menu bar's warp is `data-liquid-strength` (default 34) in `assets/js/liquid-glass.js` / `core.js`.

## It's online (GitHub Pages)

The live blog is **https://daedlus27-arch.github.io/built-different/**. GitHub Pages publishes whatever is in the `main` branch of the repo **[daedlus27-arch/built-different](https://github.com/daedlus27-arch/built-different)**, and any change you commit there goes live a minute or two later.

**Publishing a new post**

1. Write it in Post Studio: `studio.html` on your computer, or https://daedlus27-arch.github.io/built-different/studio.html (it isn't linked anywhere on the blog).
2. Click **Save to posts folder** or **Download**. A box pops up with an **Upload to GitHub** button.
3. Click it, drag in the post file and `_list.js`, then press **Commit changes**.

**Changing anything else** (`config.js`, the About page, colours): open the file on GitHub, click the pencil icon, edit, then **Commit changes**. Or upload a changed file into the same folder; it replaces the old one.

**Adding pictures:** upload them into `content/images` on GitHub, then use `content/images/your-picture.jpg` in your post.

**Keep in mind**

- Keep the `.nojekyll` file. Without it GitHub Pages hides files that start with `_`, like `_list.js`, and no posts show up.
- If you rename the repo, the address changes too. Update `github.repo` in `config.js` and the `/built-different/` in `404.html`.
- To take the site down: on GitHub, repo **Settings → Pages**, then unpublish (or delete the repo).
- Studio only edits files on *your* computer, so it's harmless online. Visitors could open it, but they can't change your blog.
- Prefer another host? It's a plain static site, so Netlify Drop works too: drag the folder onto app.netlify.com/drop.

## Optional tools (need Node.js)

```
node tools/update-list.mjs                 rebuild _list.js from the files in content/posts
node tools/new-post.mjs "My title" --category Tech     make a new post file and list it
node tools/serve.mjs                       preview at http://localhost:8080
```

On Windows you can double-click `tools/update-list.bat` or `tools/serve.bat` instead.

## Good to know

- No logins, no comments, no tracking. The subscribe box is just for show.
- "Save" on a post bookmarks it in your browser (see **Saved** in the archive).
- Posts are `.js` files rather than plain text because browsers won't let a page read text files off your disk, but they *will* load scripts. That's what lets the site run by double-clicking.
