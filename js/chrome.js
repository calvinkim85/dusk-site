const comparison = document.querySelector('#chrome-compare');
const range = document.querySelector('#chrome-range');
const controls = document.querySelector('#chrome-controls');
const light = document.querySelector('#chrome-light');
const dark = document.querySelector('#chrome-dark');

function showComparison() {
  const lightShare = Number(range.value);
  const allLight = lightShare === 100;
  const allDark = lightShare === 0;
  const description = allLight ? 'All light' : allDark ? 'All dark' : `${lightShare}% light, ${100 - lightShare}% dark`;

  comparison.style.setProperty('--light', `${lightShare}%`);
  range.setAttribute('aria-valuetext', description);
  light.setAttribute('aria-pressed', allLight);
  dark.setAttribute('aria-pressed', allDark);
}

range.addEventListener('input', showComparison);
light.addEventListener('click', () => {
  range.value = '100';
  showComparison();
});
dark.addEventListener('click', () => {
  range.value = '0';
  showComparison();
});

showComparison();
range.hidden = false;
controls.hidden = false;
