/* The "One switch, two parts" illustration on the home page. Without this file it is a still picture in Dark.
   With it, the Light and Dark buttons change the illustration only (never the visitor's own appearance), at once.
   Motion happens once at most: the first time half of it is on screen, it plays Light to Dark, the lines drawing
   outward from the switch. Any choice by the visitor cancels that for good and settles the lines drawn. Reduced
   motion, checked again just before playing, means no play at all. */
(function () {
  var figure = document.getElementById('connect');
  if (!figure) return;
  var buttons = figure.querySelectorAll('[data-set]');
  var REDUCE = '(prefers-reduced-motion: reduce)';
  var pending = null, observer = null;   // pending: the cancel token of the one scheduled play, if any

  function show(mode) {
    figure.setAttribute('data-mode', mode);
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-set') === mode));
    }
  }

  function cancelPlay() {
    if (pending) { pending.cancelled = true; clearTimeout(pending.timer); pending = null; }
  }

  // Ends the one-time play for good: no timer, no observer, and a callback already queued finds nothing to do.
  function finish() {
    cancelPlay();
    if (observer) { observer.disconnect(); observer = null; }
  }

  // The visitor's choice: instant, lines settled drawn, and any playing transition dropped.
  function choose(mode) {
    finish();
    figure.classList.remove('playing');
    figure.classList.add('drawn');
    show(mode);
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (event) { choose(event.currentTarget.getAttribute('data-set')); });
  }

  figure.classList.add('is-live');
  if (matchMedia(REDUCE).matches || !('IntersectionObserver' in window)) { figure.classList.add('drawn'); return; }

  // Start in Light with the lines undrawn, then play once when at least half of it is on screen.
  show('light');
  observer = new IntersectionObserver(function (entries) {
    if (!observer) return;
    var entry = entries[entries.length - 1];
    if (entry.intersectionRatio < 0.5) { cancelPlay(); return; }
    if (pending) return;
    var token = pending = { cancelled: false, timer: 0 };
    token.timer = setTimeout(function () {
      if (token.cancelled || token !== pending) return;
      finish();
      figure.classList.add('drawn');
      if (matchMedia(REDUCE).matches) return;   // reduced motion turned on meanwhile: settle as is, no play
      figure.classList.add('playing');
      show('dark');
    }, 600);
  }, { threshold: 0.5 });
  observer.observe(figure);
})();
