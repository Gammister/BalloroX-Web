'use strict';
// V4-only entry point. Previous selectable builds are in work/version-archives.
const BONUS_UI_VERSION = 'v4';
const BONUS_UI_LABELS = Object.freeze({ exMulti: 'EX MULTI' });

window.BalloroBonusUI = (() => {
  const version = BONUS_UI_VERSION;
  document.body.classList.add(`bonus-ui-${version}`);
  if (version === 'v3' || version === 'v4') document.body.classList.add('bonus-ui-v2');
  if (version === 'v4') document.body.classList.add('bonus-ui-v3');
  document.body.dataset.bonusUi = version;
  if ((version === 'v2' || version === 'v3' || version === 'v4') && window.BalloroPocketExperiment) {
    document.title = 'Balloro X · MVP';
    document.body.classList.add('pocket-experiment');
  }

  if (version === 'v2' || version === 'v3' || version === 'v4') {
    const words = BONUS_UI_LABELS.exMulti.trim().split(/\s+/);
    const label = document.querySelector('#multiPlusCounter strong');
    if (label) label.replaceChildren(...words.map(word => {
      const span = document.createElement('span');
      span.textContent = word;
      return span;
    }));
  }

  return Object.freeze({ version, labels: BONUS_UI_LABELS,
    isV2: version === 'v2' || version === 'v3' || version === 'v4',
    isV3: version === 'v3' || version === 'v4', isV4: version === 'v4' });
})();
