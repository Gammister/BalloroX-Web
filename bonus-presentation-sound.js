/* Presentation-only Web Audio cues; no files, timers or gameplay dependencies. */
(() => {
  const heardPulses = new Set();
  let lastPulseAt = -Infinity;
  function tone(audio, output, frequency, endFrequency, delay, duration, volume, type = "sine", attack = 0.045) {
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration * 0.85);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(attack, duration * 0.4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  function transition(audio, output, entering, muted) {
    if (muted || !audio || audio.state !== "running") return;
    if (entering) {
      // Short celebratory fanfare: a double pickup, octave flourish and a
      // full D-major landing, with bright coin-like sparkle above the chord.
      const fanfare = [
        [587.33, 0, 0.12, 0.06],
        [587.33, 0.13, 0.12, 0.065],
        [880, 0.26, 0.18, 0.08],
        [1174.66, 0.46, 0.58, 0.095]
      ];
      fanfare.forEach(([frequency, delay, duration, volume]) => {
        tone(audio, output, frequency, frequency, delay, duration, volume, "triangle", 0.008);
        tone(audio, output, frequency * 2, frequency * 2,
          delay, duration * 0.72, volume * 0.14, "sine", 0.006);
      });
      [293.66, 369.99, 440, 587.33].forEach(frequency => {
        tone(audio, output, frequency, frequency, 0.46, 0.78, 0.026, "triangle", 0.012);
        tone(audio, output, frequency * 2, frequency * 2, 0.47, 0.6, 0.004, "sine", 0.01);
      });
      [1760, 2349.32, 2959.96, 3520, 4698.64].forEach((frequency, index) => {
        tone(audio, output, frequency, frequency, 0.5 + index * 0.07, 0.24, 0.014, "sine", 0.005);
      });
      tone(audio, output, 146.83, 146.83, 0, 0.16, 0.034, "triangle", 0.004);
      tone(audio, output, 146.83, 146.83, 0.46, 0.3, 0.034, "triangle", 0.004);
      return;
    }
    // Keep the gentle major-sixth close: no falling pitch or loss cadence.
    const notes = [261.63, 329.63, 392, 440];
    notes.forEach((frequency, index) => {
      const delay = index * 0.035;
      tone(audio, output, frequency, frequency, delay, 1.6, 0.025, "sine", 0.18);
      tone(audio, output, frequency * 2, frequency * 2, delay + 0.025, 1.2, 0.003, "sine", 0.18);
    });
    tone(audio, output, 523.25, 523.25, 0.1, 1.65, 0.012, "sine", 0.2);
  }
  function readyPulse(audio, output, blink, now, muted) {
    if (!blink?.ready || blink.alpha !== 1 || heardPulses.has(blink.soundKey)) return;
    heardPulses.add(blink.soundKey);
    if (heardPulses.size > 64) heardPulses.delete(heardPulses.values().next().value);
    if (now - lastPulseAt < 125) return;
    lastPulseAt = now; // Prevent simultaneous balls from stacking audible pulses.
    if (muted || !audio || audio.state !== "running") return;
    tone(audio, output, 440, 415, 0, 0.075, 0.012);
  }
  window.BalloroBonusSound = { transition, readyPulse };
})();
