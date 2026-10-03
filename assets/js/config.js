/*
 * ─────────────────────────────────────────────────────────────
 *  BUILT DIFFERENT · site settings
 *  Edit this file to change the blog name, menu, sidebar
 *  "Current status", the ad box, newsletter text and footer.
 *  (Posts live in content/posts/ — see README.md.)
 * ─────────────────────────────────────────────────────────────
 */
window.SITE = {
  title: "Built Different",
  // The two halves of the logo wordmark ("built" + "different")
  brand: ["built", "different"],
  logo: "BD",
  subtitle: "the blog of Tyler Barrett",
  tagline: "Wired differently. Cut from a different cloth.",
  description:
    "Life, tech, dating and bad decisions from one guy in Hawick who keeps getting back up.",
  location: "Los Santos",
  weather: "31°C, sunny (in October??)",

  author: {
    name: "Tyler Barrett",
    initials: "TB",
    role: "Junior IT Specialist with the City",
    bio:
      "Junior IT Specialist with the City, self-taught tech-bro, proud ADHD haver and hopeless romantic. Writes about whatever stupid thing happened to him that day, which lately is a lot. Views are his own and not those of his employer, who he would very much like to keep.",
  },

  // Top menu. "page" must match the data-page on each HTML file.
  nav: [
    { label: "Home", href: "index.html", page: "home" },
    { label: "Blog", href: "archive.html", page: "archive" },
    { label: "About", href: "about.html", page: "about" },
    { label: "Contact", href: "contact.html", page: "contact" },
  ],

  // Categories shown on the home page and archive filters.
  categories: [
    { name: "Life", blurb: "Stuff that happened. Usually to my face." },
    { name: "Tech", blurb: "Computers, the City network and other things I break." },
    { name: "Dating", blurb: "Hopeless romantic, field notes." },
    { name: "Rants", blurb: "Strong opinions, loosely held." },
  ],

  // "How I'm doing" widget (home, posts and about page).
  status: [
    ["Arm", "Broken (hairline)"],
    ["Eyes", "Both black"],
    ["Nose", "Points left now"],
    ["Car", "Still at the club"],
    ["Relationship", "Exclusive, no labels"],
    ["Mood", "Built different"],
  ],

  ad: {
    label: "Advertisement",
    title: "This space",
    titleAccent: "for rent.",
    body: "Your business here. Rates negotiable. Will promote for gas money.",
    note: "I just spent $1,200 on two drinks. Please.",
    cta: { label: "Get in touch", href: "contact.html#advertise" },
  },

  newsletter: {
    title: "Bad decisions, delivered.",
    body:
      "New posts whenever something stupid happens to me, which, as you can see, is apparently daily. Free. Unlike cocktails.",
    placeholder: "you@email.com",
    button: "Subscribe",
    // There is no mailing list behind this site; the form just says thanks.
    thanks: "You're on the list! (Nothing actually gets emailed. It's the thought that counts.)",
  },

  footer: {
    blurb:
      "Life, tech, dating and bad decisions from one guy in Hawick who keeps getting back up. Wired differently. Cut from a different cloth.",
    legal: "Self-published by Tyler Barrett. Opinions are my own and not my employer's.",
    joke: "This blog uses cookies. Not the good kind.",
  },

  // Where the live site lives on GitHub. After you save or download a post,
  // Post Studio shows an "Upload to GitHub" button that opens this repo's
  // content/posts folder. Set repo to "" to hide it.
  github: {
    repo: "daedlus27-arch/built-different",
    branch: "main",
  },
};
