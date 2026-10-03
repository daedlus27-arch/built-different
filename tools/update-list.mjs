#!/usr/bin/env node
/*
 * Rebuilds content/posts/_list.js from whatever post files are in that folder.
 * Use it after copying post files in by hand:   node tools/update-list.mjs
 * (Post Studio's "Save to posts folder" button already does this for you.)
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "content", "posts");

export function listText(files) {
  return (
    "/*\n * POST LIST\n * Every post file in this folder has to be listed here, or the\n * site won't load it. Order doesn't matter (posts sort by date).\n *\n" +
    " * Post Studio's \"Save to posts folder\" button rewrites this file\n * for you. If you add a post by hand, add its filename below.\n * (Files starting with _ are ignored.)\n */\n" +
    "window.POST_FILES = [\n" +
    files.map((f) => `  ${JSON.stringify(f)},`).join("\n") +
    "\n];\n"
  );
}

export function updateList() {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".js") && !f.startsWith("_"))
    .sort()
    .reverse();
  writeFileSync(join(dir, "_list.js"), listText(files));
  return files;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const files = updateList();
  console.log(`Listed ${files.length} post${files.length === 1 ? "" : "s"} in content/posts/_list.js`);
  files.forEach((f) => console.log("  • " + f));
}
