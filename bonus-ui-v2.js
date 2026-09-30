'use strict';
// One-line rollback switch. The URL parameter takes precedence when present.
const BONUS_UI_VERSION = 'v2';
const BONUS_UI_LABELS = Object.freeze({ exMulti: 'EX MULTI' });

window.BalloroBonusUI = (() => {
  const requested = new URLSearchParams(location.search).get('bonusUI');
  const version = requested === 'legacy' || requested === 'v2' || requested === 'v3' ? requested : BONUS_UI_VERSION;
  document.body.classList.add(`bonus-ui-${version}`);
  if (version === 'v3') document.body.classList.add('bonus-ui-v2');
  document.body.dataset.bonusUi = version;
  if ((version === 'v2' || version === 'v3') && window.BalloroPocketExperiment) {
    document.title = 'Balloro X · эксперимент · RTP не рассчитан';
    document.body.classList.add('pocket-experiment');
  }

  if (version === 'v2' || version === 'v3') {
    const words = BONUS_UI_LABELS.exMulti.trim().split(/\s+/);
    const label = document.querySelector('#multiPlusCounter strong');
    if (label) label.replaceChildren(...words.map(word => {
      const span = document.createElement('span');
      span.textContent = word;
      return span;
    }));
  }

  return Object.freeze({ version, labels: BONUS_UI_LABELS, isV2: version === 'v2' || version === 'v3', isV3: version === 'v3' });
})();
