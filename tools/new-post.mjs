#!/usr/bin/env node
/*
 * Creates a new post file and adds it to the list.
 *
 *   node tools/new-post.mjs "My new post title"
 *   node tools/new-post.mjs "My new post title" --category Tech --date 2026-10-10
 *
 * Then open the new file in content/posts and write the body.
 * (Or skip all this and use studio.html.)
 */
import { existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { updateList } from "./update-list.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? args.splice(i, 2)[1] : fallback;
};
const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const category = flag("category", "Life");
const day = flag("date", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
const title = args.join(" ").trim();

if (!title) {
  console.log('Usage: node tools/new-post.mjs "Your post title" [--category Life] [--date YYYY-MM-DD]');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, " and ")
  .replace(/['"‘’“”]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = `${day}-${slug}.js`;
const path = join(root, "content", "posts", file);

if (existsSync(path)) {
  console.error("A post file called " + file + " already exists.");
  process.exit(1);
}

const text = `/*
 * ${title.replace(/\*\//g, "* /")}
 */
Blog.post({
  slug: ${JSON.stringify(slug)},
  title: ${JSON.stringify(title)},
  deck: "One or two sentences under the title.",
  date: "${day} ${pad(now.getHours())}:${pad(now.getMinutes())}",
  category: ${JSON.stringify(category)},
  tags: [],
  cover: {
    pills: ["Three", "Short", "Words"],
    tagline: "A line under the pills.",
  },
  body: \`
**Start strong.** This first paragraph shows up a little bigger.

## Part 01 | Your first section

Write normally. Leave an empty line between paragraphs.
\`,
});
`;

writeFileSync(path, text);
updateList();
console.log("Created content/posts/" + file);
console.log("It's already listed in _list.js. Open it, write the body, then reload the blog.");
