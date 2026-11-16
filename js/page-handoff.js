/* Phone to computer. Nothing on this site installs on a phone, so a phone visitor gets one job: send the page to a
   computer. The share sheet comes first (AirDrop, Messages, mail to yourself), then the clipboard, then selecting the
   visible link. Without this file the link is still there to read, select and copy.
   The link always shows the address the visitor actually opened, without the #fragment. */
(function () {
  var pageUrl = location.origin + location.pathname;
  var canShare = typeof navigator.share === 'function';

  // Clear first and write a moment later, so the same message is announced again on a second press.
  function say(status, text) {
    if (!status) return;
    status.textContent = '';
    if (text) setTimeout(function () { status.textContent = text; }, 60);
  }

  function selectLink(link) {
    link.focus();
    var selection = window.getSelection();
    if (!selection) return;
    var range = document.createRange();
    range.selectNodeContents(link);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Resolves to 'shared', 'closed' (the visitor dismissed the sheet) or 'failed'.
  function share() {
    if (!canShare) return Promise.resolve('failed');
    return navigator.share({ title: document.title, url: pageUrl }).then(
      function () { return 'shared'; },
      function (error) { return error && error.name === 'AbortError' ? 'closed' : 'failed'; }
    );
  }

  function copy() {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return Promise.resolve(false);
    return navigator.clipboard.writeText(pageUrl).then(function () { return true; }, function () { return false; });
  }

  document.querySelectorAll('[data-page-handoff]').forEach(function (handoff) {
    var link = handoff.querySelector('[data-page-link]');
    var button = handoff.querySelector('[data-copy-page]');
    var status = handoff.querySelector('[data-copy-status]');
    if (!link || !button) return;

    link.href = pageUrl;
    link.textContent = pageUrl;
    if (canShare) button.textContent = 'Share this page';
    button.hidden = false;

    button.addEventListener('click', function () {
      say(status, '');
      share().then(function (result) {
        if (result !== 'failed') return;
        return copy().then(function (copied) {
          if (copied) { say(status, 'Link copied.'); return; }
          selectLink(link);
          say(status, 'Copy the link with your keyboard, or touch and hold it.');
        });
      });
    });
  });

  // The small "On a phone?" links: open the share sheet where there is one, otherwise jump to the box as plain links do.
  document.querySelectorAll('a[data-share-page]').forEach(function (anchor) {
    if (!canShare) return;
    anchor.addEventListener('click', function (event) {
      event.preventDefault();
      share().then(function (result) { if (result === 'failed') location.hash = anchor.hash; });
    });
  });
})();
