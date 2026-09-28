'use strict';
// One-line rollback switch. The URL parameter takes precedence when present.
const BONUS_UI_VERSION = 'v2';
const BONUS_UI_LABELS = Object.freeze({ exMulti: 'EX MULTI' });

window.BalloroBonusUI = (() => {
  const requested = new URLSearchParams(location.search).get('bonusUI');
  const version = requested === 'legacy' || requested === 'v2' ? requested : BONUS_UI_VERSION;
  document.body.classList.add(`bonus-ui-${version}`);
  document.body.dataset.bonusUi = version;
  if (version === 'v2' && window.BalloroPocketExperiment) {
    document.title = 'Balloro X · эксперимент · RTP не рассчитан';
    document.body.classList.add('pocket-experiment');
    const dock = document.querySelector('.puck-count-buttons');
    for (let count = 4; count <= 5; count += 1) {
      const button = document.createElement('button');
      button.className = 'puck-count-button';
      button.type = 'button';
      button.dataset.puckCount = String(count);
      button.textContent = String(count);
      dock?.append(button);
    }
    document.querySelectorAll('#crownCounter > span:nth-child(n + 4), .v2-crown-slots .v2-crown:nth-child(n + 3), .v2-lemon-slots .v2-lemon:nth-child(n + 2)')
      .forEach(node => node.remove());
  }

  if (version === 'v2') {
    const words = BONUS_UI_LABELS.exMulti.trim().split(/\s+/);
    const label = document.querySelector('#multiPlusCounter strong');
    if (label) label.replaceChildren(...words.map(word => {
      const span = document.createElement('span');
      span.textContent = word;
      return span;
    }));
  }

  return Object.freeze({ version, labels: BONUS_UI_LABELS, isV2: version === 'v2' });
})();
