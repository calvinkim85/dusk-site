// Keep the share link on the domain and path the visitor actually opened.
for (const handoff of document.querySelectorAll("[data-page-handoff]")) {
  const link = handoff.querySelector("[data-page-link]");
  const button = handoff.querySelector("[data-copy-page]");
  const status = handoff.querySelector("[data-copy-status]");
  const pageUrl = location.origin + location.pathname;

  link.href = pageUrl;
  link.textContent = pageUrl;
  button.hidden = false;

  button.addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
        status.textContent = "Link copied.";
        return;
      }
    } catch {
      // Some browsers disallow clipboard writes. Select the visible link below.
    }

    link.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(link);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    status.textContent = "Copy the link with your keyboard, or touch and hold it.";
  });
}
