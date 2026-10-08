/* Launch/session controls only. Never consult or modify RNG, paths or payouts. */
(function (root) {
  'use strict';
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
  function create({ now = () => performance.now(), onChange = () => {}, onPause = () => {}, onStop = () => {} } = {}) {
    const pause = { active: false, winners: new Set(), mustRelease: false };
    let held = false, session = null, serial = 0;
    function stop(reason) {
      if (!session?.active) return false;
      session.active = false;
      session.reason = reason;
      onStop(reason);
      onChange();
      return true;
    }
    function totals() {
      let stake = session?.completedStake || 0, payout = session?.completedPayout || 0, pending = 0;
      for (const shot of session?.shots.values() || []) {
        if (shot.settled) { stake += shot.stake; payout += shot.payout; }
        else pending += shot.stake;
      }
      return { stake: stake + pending, payout, pending, net: payout - stake - pending };
    }
    function check(nextStake = 0) {
      if (!session?.active) return false;
      const total = totals(), limits = session.limits;
      if (limits.minutes && now() - session.startedAt >= limits.minutes * 60000) return stop('time');
      if (limits.profit && total.net >= limits.profit - 1e-8) return stop('profit');
      // Reserve ALL already paid, unfinished chains at their worst-case return.
      if (limits.loss && -total.net + nextStake > limits.loss + 1e-8) return stop('loss');
      if (limits.loss && -total.net >= limits.loss - 1e-8 && !nextStake) return stop('loss');
      return false;
    }
    return {
      pause,
      get session() { return session; },
      totals, stop, check,
      acknowledge() { if (session && !session.active) { session.reason = null; onChange(); } },
      start(count, limits = {}) {
        if (count === Infinity ? !policy.infiniteAutoplay
          : !Number.isInteger(count) || count < 1 || count > policy.maxAutoCount) throw new Error('Autoplay count is not permitted');
        if (session?.active) stop('user');
        session = { id: ++serial, active: true, startedAt: now(), remaining: count, shots: new Map(), reason: null,
          completedStake: 0, completedPayout: 0,
          limits: { loss: positive(limits.loss), profit: positive(limits.profit), win: positive(limits.win),
            minutes: positive(limits.minutes), bonus: Boolean(limits.bonus) } };
        onChange();
        return session;
      },
      canLaunch(stake) {
        if (pause.active || !session?.active || check(stake)) return false;
        if (session.remaining <= 0) { stop('count'); return false; }
        return true;
      },
      launched(id, stake) {
        if (!session?.active) return;
        session.shots.set(id, { stake, payout: 0, settled: false });
        if (Number.isFinite(session.remaining)) session.remaining--;
        if (!session.remaining) stop('count');
        onChange();
      },
      settled(id, payout) {
        const shot = session?.shots.get(id);
        if (!shot || shot.settled) return;
        shot.payout = payout;
        shot.settled = true;
        // Endless sessions retain totals, not an ever-growing history of shots.
        if (session.remaining === Infinity) {
          session.completedStake += shot.stake;
          session.completedPayout += payout;
          session.shots.delete(id);
        }
        if (session.active && session.limits.win && payout / shot.stake >= session.limits.win - 1e-8) stop('win');
        check();
        onChange();
      },
      bonus(id) {
        if (session?.active && session.limits.bonus && session.shots.has(id)) stop('bonus');
      },
      press() { held = true; },
      release() { held = false; pause.mustRelease = false; onChange(); },
      bigWin(puck, enabled) {
        if (!enabled) return;
        pause.winners.add(puck);
        if (!pause.active) {
          pause.active = true;
          pause.mustRelease = held;
          onPause();
        }
        onChange();
      },
      resume() {
        if (!pause.active || pause.mustRelease) return false;
        pause.active = false;
        pause.winners.clear();
        onChange();
        return true;
      }
    };
  }
  // Supplied by the operator BEFORE boot, never by a player-facing toggle or URL.
  // This client hook is a demo integration boundary, NOT server-side enforcement.
  const supplied = root.BalloroOperatorPlayPolicy || {};
  const policy = Object.freeze({
    autoplay: supplied.autoplay !== false,
    heldSpin: supplied.heldSpin !== false,
    quickPlay: supplied.quickPlay !== false,
    requireLossLimit: supplied.requireLossLimit === true,
    infiniteAutoplay: supplied.autoplay !== false && supplied.infiniteAutoplay !== false
      && supplied.maxAutoCount === undefined,
    maxAutoCount: Math.floor(Math.min(1000, Math.max(1, positive(supplied.maxAutoCount) || 1000))),
    minLaunchIntervalMs: Math.max(0, positive(supplied.minLaunchIntervalMs) || 0),
    canPlaceBet: typeof supplied.canPlaceBet === 'function' ? supplied.canPlaceBet : () => true
  });
  root.BalloroPlayControls = Object.freeze({ create, policy });
})(typeof window === 'undefined' ? globalThis : window);
