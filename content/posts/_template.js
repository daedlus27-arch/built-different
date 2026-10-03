/*
 * ─────────────────────────────────────────────────────────────
 *  POST TEMPLATE  (copy this file to start a post by hand)
 *
 *  1. Copy it and rename the copy, e.g. 2026-10-10-my-new-post.js
 *  2. Fill in the fields below. Only title, date and body are required.
 *  3. Add the new filename to _list.js
 *
 *  Easier: open studio.html in your browser and use Post Studio.
 *
 *  The body is written in Markdown between the two backticks ( ` ).
 *  Don't use a backtick inside the body itself.
 *  Cheat sheet: README.md → "Writing posts".
 * ─────────────────────────────────────────────────────────────
 */
Blog.post({
  slug: "my-new-post",                     // the web address: post.html?p=my-new-post
  title: "My new post: it has a title",
  accent: "it has a title",                // optional: end of the title shown in sky blue
  deck: "One or two sentences under the title.",
  date: "2026-10-10 18:00",                // YYYY-MM-DD HH:MM
  category: "Life",                        // Life, Tech, Dating or Rants (see assets/js/config.js)
  tags: ["Tag", "AnotherTag"],
  byline: "written on my phone",           // optional little note next to your name
  updatedNote: "",                         // optional, e.g. "Updated: fixed a typo"
  featured: false,                         // true = big "Latest post" card on the home page
  draft: false,                            // true = hidden from the site (Studio still sees it)

  cover: {
    eyebrow: "Friday, October 10, 2026 · Los Santos",
    pills: ["Three", "Short", "Words"],     // the white pills on the blue banner
    tagline: "A line under the pills.",
    tone: "sky",                            // sky, deep, navy or ice
    // image: "content/images/my-cover.jpg",
  },
  thumb: { word: "Hello.", tone: "sky" },   // the big word on the post's card

  // optional number tiles under the banner
  stats: [
    ["2", "things that happened"],
    ["$40", "spent on snacks"],
  ],

  // optional sticky timeline in the sidebar; "section" = a heading id (see body)
  timelineLabel: "Today, in order",
  timeline: [
    { time: "Morning", text: "Woke up. Bad idea.", section: "part-01" },
    { time: "Evening", text: "Wrote this post.", section: "part-02" },
  ],

  body: `
**First sentence in bold.** The first paragraph is shown a bit bigger, like a newspaper lede.

## Part 01 | The first section

Write normally. Leave an empty line between paragraphs.

:::quote by="Someone wise"
A line worth pulling out.
:::

## Part 02 | The second section

- A bullet point
- Another one
`,
});
