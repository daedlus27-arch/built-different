/* Built Different · about / contact / 404 pages
   The words live in the HTML files; this just adds the shared header,
   footer, the "How I'm doing" widget and the latest post card. */
(function () {
  "use strict";
  const page = document.body.dataset.page || "";
  Site.init(page);

  const statusSlot = document.getElementById("status-slot");
  if (statusSlot) statusSlot.outerHTML = V.statusWidget();

  const latestSlot = document.getElementById("latest-slot");
  if (latestSlot) {
    Blog.load().then((posts) => {
      latestSlot.outerHTML = posts[0]
        ? `<div class="latest-slot"><span class="eyebrow" style="margin:0 0 12px 8px">Latest post</span>${V.postCard(posts[0])}</div>`
        : "";
      Site.reveal();
    });
  }

  Site.reveal();
  Site.scrollToHash();
})();
