/* The line through the home page's hero. Without this file the hero still reads: a static half-and-half.
   The native range input carries the keyboard and screen readers; pointer events only add dragging on the picture.
   One sweep on load, for a first-time look at light turning dark. It never runs with reduced motion, and never for
   a visitor already in dark mode, who should not be greeted by a mostly white page (see the head script in index.html). */
(function () {
  var root = document.documentElement;
  var dusk = document.getElementById('dusk');
  var range = document.getElementById('dusk-range');
  var panes = document.getElementById('dusk-panes');
  var knob = document.getElementById('dusk-knob');
  if (!dusk || !range || !panes || !knob) { root.classList.remove('sweep'); return; }

  var REST = 50, x = REST, width = 0, frameLeft = 0, dragging = false, sweepId = 0;

  function clamp(v) { return Math.min(100, Math.max(0, v)); }

  // Reads layout once per resize, so dragging only writes.
  function measure() {
    var box = dusk.getBoundingClientRect(), frame = panes.getBoundingClientRect();
    width = box.width;
    frameLeft = frame.left - box.left;
    // Keep the handle on the visible part of the picture when the picture runs past the fold.
    var top = frame.top - box.top, room = Math.max(window.innerHeight - frame.top - window.scrollY - 60, 120);
    dusk.style.setProperty('--ky', Math.round(top + Math.min(frame.height * 0.42, room)) + 'px');
    paint(x);
  }

  function paint(value) {
    x = value;
    dusk.style.setProperty('--x', x);
    panes.style.setProperty('--fx', Math.round(x / 100 * width - frameLeft) + 'px');
    var rounded = Math.round(x);
    if (+range.value !== rounded) range.value = rounded;
    range.setAttribute('aria-valuetext', (100 - rounded) + ' percent of the width in Dark');
  }

  function stopSweep() { if (sweepId) { cancelAnimationFrame(sweepId); sweepId = 0; } }

  function sweep(from, to, ms) {
    var start = 0;
    function step(now) {
      if (!start) start = now;
      var t = Math.min(1, (now - start) / ms);
      paint(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      sweepId = t < 1 ? requestAnimationFrame(step) : 0;
    }
    sweepId = requestAnimationFrame(step);
  }

  function fromPointer(event) {
    var box = dusk.getBoundingClientRect();
    return clamp((event.clientX - box.left) / box.width * 100);
  }

  function grab(surface) {
    surface.addEventListener('pointerdown', function (event) {
      if (event.button) return;
      stopSweep();
      dragging = true;
      surface.setPointerCapture(event.pointerId);
      // A finger on the picture may be starting a scroll, so touch waits for movement. A mouse click moves the line now.
      if (event.pointerType === 'mouse' || surface === knob) { event.preventDefault(); paint(fromPointer(event)); }
      range.focus({ preventScroll: true });
    });
    surface.addEventListener('pointermove', function (event) { if (dragging) paint(fromPointer(event)); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) {
      surface.addEventListener(name, function () { dragging = false; });
    });
  }

  range.addEventListener('input', function () { stopSweep(); paint(+range.value); });
  grab(panes);
  grab(knob);

  // "Light" and "Dark" above the picture become one-click buttons, like the switch they stand for.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  dusk.querySelectorAll('.side[data-x]').forEach(function (label) {
    var button = document.createElement('button');
    var to = +label.getAttribute('data-x');
    button.type = 'button';
    button.className = label.className;
    button.textContent = label.textContent;
    button.setAttribute('aria-label', 'Show the page in ' + label.textContent);
    button.addEventListener('click', function () {
      stopSweep();
      if (reduce) paint(to); else sweep(x, to, 700);
    });
    label.replaceWith(button);
  });

  dusk.classList.add('is-live');
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(dusk);
  else window.addEventListener('resize', measure);

  var sweeping = root.classList.contains('sweep');
  if (sweeping) x = 92;
  measure();
  root.classList.remove('sweep');
  if (!sweeping) return;

  // Wait for the two pictures so the sweep is not over an empty frame, but not for long.
  var shown = panes.querySelectorAll('img[fetchpriority="high"]'), waits = [], begun = false;
  function begin() { if (begun) return; begun = true; if (!dragging) sweep(x, REST, 1300); }
  shown.forEach(function (img) { if (img.decode) waits.push(img.decode().catch(function () {})); });
  Promise.all(waits).then(begin);
  setTimeout(begin, 700);
})();
