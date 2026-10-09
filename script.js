const avatars = Array.from({ length: 50 }, (_, index) => ({
  col: index % 10,
  row: Math.floor(index / 10)
}));

// Retain old line links, but not the retired V1 profile/switch.
let GRID_SIZE = [5, 7, 9].includes(Number(new URLSearchParams(location.search).get('comparisonLines')))
  ? Number(new URLSearchParams(location.search).get('comparisonLines')) : 5;
const BET_STEPS = [0.75, 1, 2, 5, 10, 25, 50, 100, 250, 500, 750, 1000];
const FIXED_PHYSICS_STEP = window.PuckLuckMath?.FIXED_TIMESTEP || 1 / 120;
const AUTO_PLAY_ROUND_GAP_MS = 300;
const TODAY_WINS_STORAGE_PREFIX = "puckLuckTodayWinsV1";
const LANGUAGE_STORAGE_KEY = "puckLuckLanguageV1";
const SOUND_EFFECTS_STORAGE_KEY = "puckLuckSoundEffectsV1";
const MUSIC_STORAGE_KEY = "puckLuckMusicV1";
const BACKGROUND_MUSIC_SRC = "assets/background-casino-jazz-loop.ogg";
const SECRET_ZONE_IDS = ["top", "right", "bottom", "left"];
const FIELD_POCKET_ZONE_ID = "field";
const BLUE_FIELD_POCKET_ZONE_ID = "blue-field";
const BACKGROUND_MUSIC_VOLUME = 0.023;
const GAME_MECHANICS_VARIANT = document.location.pathname.endsWith("/billiard.html")
  || new URLSearchParams(window.location.search).get("mode") === "billiard"
  ? "billiard"
  : "field-pocket";
// A rare visual variant of an already-authorized pocket result. This does not change
// the mathematical pocket probability or any payout; it only selects a faster valid path.
const EARLY_POCKET_ENTRY_VISUAL_PROBABILITY = 0.08;
// Presentation-only rollback: false restores green walls under the red flash.
const MAIN_RED_BIG_WIN_WALLS_ENABLED = true;
const PURPLE_POCKET_MULTIPLIER = 10;
const PURPLE_NEON_RENDERED_PIXEL_SOFT_LIMIT = 820000;
const PURPLE_NEON_RENDERED_PIXEL_HARD_LIMIT = 1400000;
const COLLECTIBLE_IDLE_FRAME_INTERVAL_MS = 50;
const COUNTER_PICKUP_HOLD_DURATION_MS = 500;
const COUNTER_FLY_IN_DURATION_MS = 562;
// Presentation-only experiment: false restores the original pocket-to-counter
// flight and arrival flash. Bonus activation and counter reset clocks are retained.
const POCKET_SYMBOL_FLOAT_ENABLED = false;
const RESULT_BOOST_REVEAL_DURATION_MS = 240;
const BLUE_POCKET_WAVE_TIME_SCALE_MS = 72.5;
const V2_CACTUS_POST_ACTIVATION_HOLD_MS = 350;
const CHANCE_ROOM_IDS = ["bottom-right", "bottom-left"];
const CHANCE_SPIN_DURATION_MS = 2450;
const CHANCE_SINK_DURATION_MS = 260;
const CHANCE_READY_WAVE_DURATION_MS = 500;
const CHANCE_FINAL_CUE_DURATION_MS = 280;
const CHANCE_MIN_SETTLE_AGE_SECONDS = 0.35;
const CHANCE_POCKET_CAPTURE_RADIUS_MULTIPLIER = 1.55;
const CHANCE_ROOM_GAP_PX = 10;
// In Bonus UI V2 the room wall sits immediately outside the 9 px main-field
// border instead of being painted underneath it.
const CHANCE_ROOM_V2_WALL_OFFSET_PX = 9;
const CHANCE_ROOM_CORNER_X_SHARE = 0.42;
const CHANCE_ROOM_CORNER_Y_SHARE = 0.58;
const CHANCE_ROOM_VIEWPORT_MARGIN_PX = 10;
const MULTI_PLUS_NEON_DURATION_MS = 2000;
const V4_PURPLE_FIELD_ENTER_MS = MULTI_PLUS_NEON_DURATION_MS / 2;
const V4_PURPLE_FIELD_EXIT_MS = MULTI_PLUS_NEON_DURATION_MS / 2;
const MULTI_PLUS_NEON_STEP_MS = 250;
const MULTI_PLUS_NEON_STOP_FLASH_MS = 320;
const YELLOW_FIELD_RETURN_MS = 320;
const YELLOW_FIELD_RETURN_PEAK_MS = 64;
const FIELD_POCKET_PULL_MAX_DURATION_SECONDS = 0.32;
const MULTI_PLUS_REVEAL_DURATION_MS = MULTI_PLUS_NEON_DURATION_MS + MULTI_PLUS_NEON_STOP_FLASH_MS;
const MAX_RESULT_SOUND_LEVELS = 9;
const WIN_SOUND_PITCH_RATIOS = [1, 1.12, 1.26, 1.42, 1.6, 1.81, 2.04, 2.28, 2.55];
const PURPLE_WIN_SOUND_PITCH_RATIOS = [1, 1.08, 1.16, 1.27, 1.4, 1.54, 1.7, 1.88, 2.08];
const LOCALES = { en: "en-US", ru: "ru-RU", es: "es-419", pt: "pt-BR", de: "de-DE", fr: "fr-FR" };
const TRANSLATIONS = window.BalloroPlayerCopy;
// Keep the legacy random symbol planners below intact for one-line rollback.
const FIXED_BONUS_SYMBOL_LAYOUT = false;
const POCKET_TEST_RANDOM_PHYSICS = true;
const fixedBonusTrajectoryMetrics = new Map();

const state = {
  bankroll: 100000,
  lineMaximumNotice: null,
  avatarIndex: 0,
  language: "en",
  animationsEnabled: true,
  historyExpanded: false,
  soundEffectsMuted: false,
  musicEnabled: true,
  audioContext: null,
  backgroundMusic: null,
  backgroundMusicGain: null,
  backgroundMusicSource: null,
  backgroundMusicDuckTimer: null,
  lastWallHitSoundAt: 0,
  lastMultiplierSoundAt: 0,
  resultSoundStep: 0,
  nextMultiplierSoundAt: 0,
  nextPocketReleaseIndex: 0,
  autoPlay: false,
  autoPlayTimer: null,
  roundSettledAt: 0,
  winSoundEndsAt: 0,
  running: false,
  v3LastLaunchAt: -Infinity,
  v3BallSerial: 0,
  v3ShotSerial: 0,
  v3Shots: new Map(),
  v3LastWinAmount: 0,
  v3WinLabelSerial: 0,
  v3HoldTimer: null,
  v3HoldSpeedTimer: null,
  v3HoldFast: false,
  v3CooldownTimer: null,
  v3BonusLock: null,
  v3BonusPuck: null,
  v3BonusQueue: [],
  v4HeldPurpleField: false,
  v4HeldYellowCells: null,
  yellowFieldReturn: null,
  v3PocketSymbolCycle: { diamond: false, crown: false, lemon: false, blue: false },
  v4PocketSymbolAppearance: {},
  launchPrepared: false,
  launchPreparedSlot: null,
  launchButtonPrimed: false,
  launchPrimeFrame: null,
  winPresentationUnlockTimer: null,
  activeSlot: null,
  activeBetPerPuck: 0,
  roundWinAmount: 0,
  puckCount: 1,
  riskLevel: window.PuckLuckMath?.riskForLines(GRID_SIZE) || "low",
  layoutMode: "configurator_5",
  gameplayTestRows: [],
  crownsCollected: 0,
  v2BonusProgress: { diamond: 0, crown: 0, lemon: 0, blue: 0 },
  v2BonusArrivedActive: { diamond: false, crown: false, lemon: false, blue: false },
  x10BoostActivated: false,
  crownBonusAwarded: false,
  multiPlusActive: false,
  multiPlusFinalCells: null,
  multiPlusToken: null,
  multiPlusPickupLog: null,
  multiPlusActivatedAt: 0,
  multiPlusCapturedPuck: null,
  multiPlusPhase: "idle",
  multiPlusRevealStartedAt: 0,
  multiPlusNeonCells: [],
  multiPlusNeonLastStepAt: 0,
  multiPlusNeonFlashUntil: 0,
  lastStarBoostSoundAt: 0,
  lastFrameAt: 0,
  physicsFrame: null,
  physicsFrameRoundId: null,
  roundId: 0,
  roundOutcome: null,
  fieldPocket: null,
  bluePocket: null,
  chancePocket: null,
  chanceCapturedPuck: null,
  chancePhase: "idle",
  chanceSpinStartedAt: 0,
  chanceSpinRoomIndex: -1,
  chanceSpinTotalSteps: 20,
  chanceLastSoundStep: -1,
  chanceSelectedRoomId: null,
  chanceFinalCueStartedAt: 0,
  chanceFinalCueUntil: 0,
  chanceFinalCueRoomId: null,
  chanceRoomMultipliers: {},
  chanceRoomOutcome: null,
  chanceCompletedRoomIds: new Set(),
  trajectoryPlans: [],
  trajectoryDiagnostics: [],
  recentTrajectoryIds: [],
  trajectoryUsage: {},
  debugPhysics: new URLSearchParams(window.location.search).get("debug") === "1",
  physicsAccumulator: 0,
  resultHistory: [],
  purpleLeaderboard: [
    { id: "seed-1", name: "Luna742", multiplier: 48, timestamp: 5 },
    { id: "seed-2", name: "Mateo081", multiplier: 32.5, timestamp: 4 },
    { id: "seed-3", name: "Sofi309", multiplier: 24, timestamp: 3 },
    { id: "seed-4", name: "Kiro503", multiplier: 18.5, timestamp: 2 },
    { id: "seed-5", name: "Mina202", multiplier: 12, timestamp: 1 },
    { id: "seed-6", name: "Diego417", multiplier: 10.5, timestamp: 0 },
    { id: "seed-7", name: "Zara615", multiplier: 9, timestamp: -1 },
    { id: "seed-8", name: "Noah274", multiplier: 7.5, timestamp: -2 },
    { id: "seed-9", name: "Camila93", multiplier: 6, timestamp: -3 },
    { id: "seed-10", name: "Leo188", multiplier: 5, timestamp: -4 }
  ],
  purpleLeaderboardExpanded: false,
  processedPurpleEvents: new Set(),
  latestPurpleLeaderboardId: null,
  field: {
    cx: 0,
    cy: 0,
    half: 0,
    grid: 0,
    puckRadius: 0,
    width: 0,
    height: 0,
    ratio: 1
  },
  pucks: [],
  settledCells: [],
  wonLines: [],
  bonusStars: [],
  starPickupLog: [],
  starBursts: [],
  starEffectFrame: null,
  counterFlyIns: [],
  counterFlyInFrame: null,
  collectibleIdleFrame: null,
  lastCollectibleIdleRenderAt: 0,
  resultRevealFrame: null,
  openSecretZones: new Set(),
  secretZoneOpenTimes: {},
  secretRoomLaunchAt: 0
};

const els = {
  soundButton: document.getElementById("soundButton"),
  menuButton: document.getElementById("menuButton"),
  menuDropdown: document.getElementById("menuDropdown"),
  menuAvatarButton: document.getElementById("menuAvatarButton"),
  menuAvatarPreview: document.getElementById("menuAvatarPreview"),
  menuSoundToggle: document.getElementById("menuSoundToggle"),
  menuMusicToggle: document.getElementById("menuMusicToggle"),
  menuLanguageButton: document.getElementById("menuLanguageButton"),
  menuRulesButton: document.getElementById("menuRulesButton"),
  rulesScreen: document.getElementById("rulesScreen"),
  closeRulesButton: document.getElementById("closeRulesButton"),
  languagePopup: document.getElementById("languagePopup"),
  closeLanguageButton: document.getElementById("closeLanguageButton"),
  avatarPopup: document.getElementById("avatarPopup"),
  closeAvatarButton: document.getElementById("closeAvatarButton"),
  avatarGrid: document.getElementById("avatarGrid"),
  topUpPopup: document.getElementById("topUpPopup"),
  confirmTopUpButton: document.getElementById("confirmTopUpButton"),
  cancelTopUpButton: document.getElementById("cancelTopUpButton"),
  topUpAmount: document.getElementById("topUpAmount"),
  bankedLoot: document.getElementById("bankedLoot"),
  brandTitle: document.querySelector(".brand h1"),
  rewardHistory: document.getElementById("rewardHistory"),
  historyPanel: document.getElementById("historyPanel"),
  historyToggle: document.getElementById("historyToggle"),
  canvas: document.getElementById("mineCanvas"),
  counterFlyInLayer: document.getElementById("counterFlyInLayer"),
  versionSwitcher: document.getElementById("versionSwitcher"),
  versionButtons: Array.from(document.querySelectorAll("[data-bonus-ui-version]")),
  roundWinLabel: document.getElementById("roundWinLabel"),
  currentLoot: document.getElementById("currentLoot"),
  stageMultiplier: document.getElementById("stageMultiplier"),
  autoPlayToggle: document.getElementById("autoPlayToggle"),
  rewardPopup: document.getElementById("rewardPopup"),
  betPanel: document.querySelector(".bet-panel"),
  gameScreen: document.getElementById("gameScreen"),
  betSlots: Array.from(document.querySelectorAll(".bet-slot")),
  puckCountButtons: Array.from(document.querySelectorAll(".puck-count-button")),
  crownCounter: document.getElementById("crownCounter"),
  multiPlusCounter: document.getElementById("multiPlusCounter"),
  pocketBonusCounter: document.getElementById("pocketBonusCounter"),
  chanceBonusCounter: document.getElementById("chanceBonusCounter"),
  purpleLeaderboard: document.getElementById("purpleLeaderboard"),
  purpleLeaderboardPanel: document.querySelector(".purple-leaderboard"),
  purpleLeaderboardToggle: document.getElementById("purpleLeaderboardToggle"),
  gridSizeButtons: Array.from(document.querySelectorAll("[data-grid-size]")),
  layoutModeButton: document.getElementById("layoutModeButton"),
  layoutDevPanel: document.getElementById("layoutDevPanel"),
  closeLayoutDevPanel: document.getElementById("closeLayoutDevPanel"),
  lockTestLines: document.getElementById("lockTestLines"),
  lockTestPucks: document.getElementById("lockTestPucks"),
  runLayoutTest100: document.getElementById("runLayoutTest100"),
  runLayoutTest1000: document.getElementById("runLayoutTest1000"),
  exportLayoutTest: document.getElementById("exportLayoutTest"),
  layoutTestStatus: document.getElementById("layoutTestStatus")
};
els.physicsDebug = document.getElementById("physicsDebug");
els.warningBanner = document.getElementById("warningBanner");

const ctx = els.canvas.getContext("2d");
const uiRng = window.PuckLuckMath.createRng(0x504c5543);

function t(key) {
  return TRANSLATIONS[state.language]?.[key] || TRANSLATIONS.en[key] || key;
}

function applyLocalization(language, persist = true) {
  state.language = TRANSLATIONS[language] ? language : "en";
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  if (typeof localizePlayerPanels === 'function') localizePlayerPanels();
  document.querySelectorAll(".language-options button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.language);
  });
  document.querySelector(".bank")?.setAttribute("aria-label", t("balance"));
  els.avatarGrid?.setAttribute("aria-label", t("changeAvatar"));
  if (persist) window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  updateBetButtons();
  updateRoundWinLabel();
  updatePurpleLeaderboardExpansion();
  renderAvatars();
  updateBank();
  fitBrandTitle();
  fitLocalizedUiText();
}


function randomBetween(min, max) {
  return min + uiRng.next() * (max - min);
}

function getMathConfiguration() {
  return window.PuckLuckMath?.getConfiguration(state.riskLevel, GRID_SIZE, state.puckCount, state.layoutMode) || null;
}

function getSecretRoomMultiplier() {
  return getMathConfiguration()?.secret_room?.multiplier || 50;
}

function getSecretRoomBaseMultiplier() {
  const secretRoom = getMathConfiguration()?.secret_room;
  return secretRoom?.base_multiplier || (secretRoom?.multiplier ? secretRoom.multiplier / 10 : 50);
}

function isMultiPlusVisualActive() {
  return Boolean(state.multiPlusActive || getCarriedYellowCells().length);
}

function getCarriedYellowCells() {
  if (!window.BalloroMvpMath?.enabled()) return [];
  const candidates = [state.v3BonusPuck, ...state.pucks, ...(playControls?.pause.winners || [])];
  const owner = candidates.find(puck => puck?.v3YellowCells?.length
    && (!puck.stopped || playControls?.pause.winners.has(puck)
      || (puck.result && hasUnfinishedV3YellowReward(puck))));
  return owner?.v3YellowCells || [];
}

function updateYellowFieldReturn(now) {
  if (!window.BalloroBonusUI?.isV4) return false;
  const cells = state.multiPlusActive ? state.multiPlusFinalCells : getCarriedYellowCells();
  if (cells?.length) {
    // Keep a presentation snapshot, separate from each ball's payout mask.
    state.yellowFieldReturn = { cells: cells.map(cell => ({ ...cell })), startedAt: null };
    return false;
  }
  const restoring = state.yellowFieldReturn;
  if (!restoring) return false;
  if (state.multiPlusActive) return false;
  if (restoring.startedAt === null) restoring.startedAt = now;
  if (now - restoring.startedAt < YELLOW_FIELD_RETURN_MS) return true;
  state.yellowFieldReturn = null;
  updateBetButtons();
  return false;
}

function isYellowCellReturning(col, row) {
  const restoring = state.yellowFieldReturn;
  if (!restoring || restoring.startedAt === null) return false;
  const now = window.BalloroGameLifecycle?.now() ?? performance.now();
  return now - restoring.startedAt < YELLOW_FIELD_RETURN_PEAK_MS
    && restoring.cells.some(cell => cell.col === col && cell.row === row);
}

function drawYellowFieldReturn(now) {
  const restoring = state.yellowFieldReturn;
  if (!restoring || restoring.startedAt === null) return;
  const age = clamp(now - restoring.startedAt, 0, YELLOW_FIELD_RETURN_MS);
  // Fast attack and a short, sharp release: switch the label at the green peak.
  const pulse = age < YELLOW_FIELD_RETURN_PEAK_MS
    ? age / YELLOW_FIELD_RETURN_PEAK_MS
    : Math.pow(1 - (age - YELLOW_FIELD_RETURN_PEAK_MS)
      / (YELLOW_FIELD_RETURN_MS - YELLOW_FIELD_RETURN_PEAK_MS), 2);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = pulse;
  for (const cell of restoring.cells) {
    drawCell(cell.col, cell.row, 'rgba(66, 238, 133, 0.34)',
      'rgba(66, 238, 133, 0.98)', 4);
  }
  ctx.restore();
}

function isX10BoostActive() {
  if (window.BalloroBonusUI?.isV2) return Boolean(state.x10BoostActivated);
  return Boolean(state.x10BoostActivated)
    || (Boolean(state.roundOutcome?.bonus_triggered) && state.crownsCollected >= getRequiredStars());
}

let v3FieldTransition = null;
let v3LastFieldVisualState = null;
let v3FieldTransitionFrame = null;
const V3_FIELD_SWEEP_MS = 190;

function isX10VisualActive() {
  // A photo hold is visual only. Logical bonus completion keeps running.
  if (playControls?.pause.active && [...playControls.pause.winners].some(puck => puck.result?.x10Boosted)) return true;
  if (window.BalloroBonusUI?.isV4 && state.v4HeldPurpleField) return true;
  if (window.BalloroBonusUI?.isV2) return Boolean(state.x10BoostActivated);
  return isX10BoostActive()
    || (Boolean(state.roundOutcome?.bonus_triggered) && state.crownsCollected >= getRequiredStars());
}

function createRoundSeed() {
  const testSeed = state.debugPhysics
    ? Number(new URLSearchParams(window.location.search).get("testSeed"))
    : NaN;
  if (Number.isInteger(testSeed) && testSeed >= 0 && testSeed <= 0xffffffff) {
    return testSeed >>> 0;
  }
  if (window.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0];
  }
  return (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
}

function getAudioContext() {
  if (window.BalloroGameLifecycle?.suspended) return null;
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    state.audioContext = new AudioContextClass();
  }
  return state.audioContext;
}

// One output control preserves the existing music / SFX balance on mobile too.
function getAudioOutput(audio) {
  if (!state.masterAudioGain) {
    state.masterAudioGain = audio.createGain();
    state.masterAudioGain.gain.value = state.masterVolume ?? 1;
    state.masterAudioGain.connect(audio.destination);
  }
  return state.masterAudioGain;
}

function createBackgroundMusicElement() {
  if (state.backgroundMusic) return state.backgroundMusic;
  const audio = getAudioContext();
  if (!audio) return null;
  const music = new Audio(BACKGROUND_MUSIC_SRC);
  music.loop = true;
  music.preload = "auto";
  music.volume = 1;
  music.playsInline = true;
  // iOS can ignore HTMLMediaElement.volume. Attenuate the actual signal instead.
  const gain = audio.createGain();
  gain.gain.value = BACKGROUND_MUSIC_VOLUME;
  const source = audio.createMediaElementSource(music);
  source.connect(gain);
  gain.connect(getAudioOutput(audio));
  state.backgroundMusicGain = gain;
  state.backgroundMusicSource = source;
  state.backgroundMusic = music;
  return music;
}

function stopBackgroundMusic() {
  const music = state.backgroundMusic;
  if (!music) return;
  music.pause();
}

function startBackgroundMusic() {
  if (!state.musicEnabled || window.BalloroGameEntry?.blocked || window.BalloroGameLifecycle?.suspended) return;
  const music = createBackgroundMusicElement();
  if (!music) return;
  const audio = getAudioContext();
  if (audio.state === "suspended") audio.resume().catch(() => {});
  music.muted = false;
  music.loop = true;
  if (state.backgroundMusicDuckTimer === null) setBackgroundMusicLevel(BACKGROUND_MUSIC_VOLUME);
  const playback = music.play();
  if (playback?.catch) {
    playback.catch(() => {
      // Browsers may require a user gesture before starting background music.
    });
  }
}

function setBackgroundMusicLevel(level) {
  const gain = state.backgroundMusicGain?.gain;
  const audio = state.audioContext;
  if (!gain || !audio) return;
  gain.cancelScheduledValues(audio.currentTime);
  gain.setTargetAtTime(level, audio.currentTime, 0.035);
}

function duckBackgroundMusic(durationMs = 600) {
  const music = state.backgroundMusic;
  if (!music || music.paused || !state.musicEnabled) return;
  if (state.backgroundMusicDuckTimer !== null) {
    window.clearTimeout(state.backgroundMusicDuckTimer);
  }
  setBackgroundMusicLevel(BACKGROUND_MUSIC_VOLUME * 0.15);
  state.backgroundMusicDuckTimer = window.setTimeout(() => {
    state.backgroundMusicDuckTimer = null;
    if (state.musicEnabled && state.backgroundMusic) {
      setBackgroundMusicLevel(BACKGROUND_MUSIC_VOLUME);
    }
  }, durationMs);
}

function setMusicEnabled(enabled, persist = true, allowStart = true) {
  state.musicEnabled = Boolean(enabled);
  if (els.menuMusicToggle) els.menuMusicToggle.checked = state.musicEnabled;
  if (persist) window.localStorage.setItem(MUSIC_STORAGE_KEY, state.musicEnabled ? "1" : "0");
  if (!state.musicEnabled) {
    stopBackgroundMusic();
  } else if (allowStart) {
    startBackgroundMusic();
  }
  updateMasterSoundButton();
}

function ensureBackgroundMusicAfterGesture() {
  if (state.musicEnabled) {
    startBackgroundMusic();
  }
}

function isAnyAudioEnabled() {
  return !state.soundEffectsMuted || state.musicEnabled;
}

function updateMasterSoundButton() {
  if (!els.soundButton) return;
  const enabled = isAnyAudioEnabled();
  els.soundButton.classList.toggle("is-muted", !enabled);
  els.soundButton.setAttribute("aria-label", enabled ? "Mute game audio" : "Enable game audio");
}

function setSoundEffectsEnabled(enabled, persist = true) {
  state.soundEffectsMuted = !Boolean(enabled);
  if (els.menuSoundToggle) els.menuSoundToggle.checked = !state.soundEffectsMuted;
  if (persist) window.localStorage.setItem(SOUND_EFFECTS_STORAGE_KEY, state.soundEffectsMuted ? "0" : "1");
  updateMasterSoundButton();
}

function setAllAudioEnabled(enabled) {
  setSoundEffectsEnabled(enabled);
  setMusicEnabled(enabled);
}


function playWallHitSound(speed = 0) {

  if (state.soundEffectsMuted) {
    return;
  }

  const nowMs = (window.BalloroGameLifecycle?.now() ?? performance.now());
  if (nowMs - state.lastWallHitSoundAt < 55) {
    return;
  }
  state.lastWallHitSoundAt = nowMs;

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const now = audio.currentTime;
  const volume = Math.min(0.2, Math.max(0.055, speed / 7200));
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(210, now);
  oscillator.frequency.exponentialRampToValueAtTime(92, now + 0.055);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(920, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(getAudioOutput(audio));
  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

function playPocketQueueAdvanceSound() {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  // A warm ascending two-note handoff, without the low descending impact
  // of the pocket-entry cue. Only plays as a queued ball takes its turn.
  [440, 660].forEach((frequency, index) => {
    const start = now + index * .065;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.07, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .13);
    oscillator.connect(gain);
    gain.connect(getAudioOutput(audio));
    oscillator.start(start);
    oscillator.stop(start + .14);
  });
}

function playPocketCaptureSound(puck) {
  if (puck.v3PocketQueueAdvancing) {
    puck.v3PocketQueueAdvancing = false;
    playPocketQueueAdvanceSound();
  } else playPocketDropSound();
}

function playPocketDropSound() {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();

  const now = audio.currentTime;
  const master = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1450, now);
  filter.frequency.exponentialRampToValueAtTime(360, now + 0.34);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.42, now + 0.006);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  master.connect(filter);
  filter.connect(getAudioOutput(audio));

  const impact = audio.createOscillator();
  const impactGain = audio.createGain();
  impact.type = "triangle";
  impact.frequency.setValueAtTime(185, now);
  impact.frequency.exponentialRampToValueAtTime(52, now + 0.15);
  impactGain.gain.setValueAtTime(0.0001, now);
  impactGain.gain.exponentialRampToValueAtTime(0.62, now + 0.004);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  impact.connect(impactGain);
  impactGain.connect(master);
  impact.start(now);
  impact.stop(now + 0.22);

  const hollow = audio.createOscillator();
  const hollowGain = audio.createGain();
  hollow.type = "sine";
  hollow.frequency.setValueAtTime(96, now + 0.025);
  hollow.frequency.exponentialRampToValueAtTime(38, now + 0.32);
  hollowGain.gain.setValueAtTime(0.0001, now + 0.025);
  hollowGain.gain.exponentialRampToValueAtTime(0.42, now + 0.045);
  hollowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  hollow.connect(hollowGain);
  hollowGain.connect(master);
  hollow.start(now + 0.025);
  hollow.stop(now + 0.4);

  const rim = audio.createOscillator();
  const rimGain = audio.createGain();
  rim.type = "square";
  rim.frequency.setValueAtTime(520, now);
  rim.frequency.exponentialRampToValueAtTime(130, now + 0.055);
  rimGain.gain.setValueAtTime(0.0001, now);
  rimGain.gain.exponentialRampToValueAtTime(0.2, now + 0.002);
  rimGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  rim.connect(rimGain);
  rimGain.connect(master);
  rim.start(now);
  rim.stop(now + 0.08);
}

function playChanceSpinTick(step, finalTick = false) {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();

  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(finalTick ? 1046.5 : 470 + (step % 4) * 54, now);
  oscillator.frequency.exponentialRampToValueAtTime(finalTick ? 1318.5 : 390 + (step % 4) * 42, now + 0.045);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(finalTick ? 1500 : 980, now);
  filter.Q.setValueAtTime(3.2, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(finalTick ? 0.12 : 0.075, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (finalTick ? 0.1 : 0.065));
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(getAudioOutput(audio));
  oscillator.start(now);
  oscillator.stop(now + (finalTick ? 0.11 : 0.075));
}

function playWinSound(intensity = 1, pitchStep = 0, startDelay = 0) {
  if (state.soundEffectsMuted) {
    return;
  }

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const now = audio.currentTime + startDelay;
  const soundLevel = clamp(Math.round(pitchStep), 0, MAX_RESULT_SOUND_LEVELS - 1);
  const pitchRatio = WIN_SOUND_PITCH_RATIOS[soundLevel] || 1;
  const levelProgress = soundLevel / (MAX_RESULT_SOUND_LEVELS - 1);
  const master = audio.createGain();
  const toneFilter = audio.createBiquadFilter();
  const volume = Math.min(0.35, 0.18 + Math.log10(Math.max(1, intensity)) * 0.044 + levelProgress * 0.04);
  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(2450 * pitchRatio, now);
  toneFilter.frequency.exponentialRampToValueAtTime(3400 * pitchRatio, now + 0.34);
  toneFilter.Q.setValueAtTime(0.46, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.018);
  master.gain.setValueAtTime(volume * 0.46, now + 0.32);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
  master.connect(toneFilter);
  toneFilter.connect(getAudioOutput(audio));

  [261.63].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * 0.018;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.006, start + 0.26);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.045, start + 0.022);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.48);
  });

  [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * 0.058;
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.022, start + 0.18);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16 - index * 0.018, start + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.44);
  });

  [1046.5, 1318.51].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.24 + index * 0.052;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.018, start + 0.16);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.052 - index * 0.014, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.38);
  });
}

function playPurpleMultiplierWinSound(multiplier, pitchStep = 0, startDelay = 0) {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime + startDelay;
  const soundLevel = clamp(Math.round(pitchStep), 0, MAX_RESULT_SOUND_LEVELS - 1);
  const pitchRatio = PURPLE_WIN_SOUND_PITCH_RATIOS[soundLevel] || 1;
  const levelProgress = soundLevel / (MAX_RESULT_SOUND_LEVELS - 1);
  const master = audio.createGain();
  const compressor = audio.createDynamicsCompressor();
  const filter = audio.createBiquadFilter();
  const volume = Math.min(0.47, 0.3 + Math.log10(Math.max(1, multiplier)) * 0.035 + levelProgress * 0.045);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, now);
  filter.frequency.exponentialRampToValueAtTime(7200, now + 0.72);
  compressor.threshold.setValueAtTime(-12, now);
  compressor.knee.setValueAtTime(12, now);
  compressor.ratio.setValueAtTime(5, now);
  compressor.attack.setValueAtTime(0.004, now);
  compressor.release.setValueAtTime(0.18, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.012);
  master.gain.setValueAtTime(volume * 0.82, now + 0.62);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.48);
  master.connect(filter);
  filter.connect(compressor);
  compressor.connect(getAudioOutput(audio));

  // The purple win shares the regular C-major win motif, then climbs an
  // octave higher with a weighty impact so it is unmistakable on autoplay.
  const impact = audio.createOscillator();
  const impactGain = audio.createGain();
  impact.type = "triangle";
  impact.frequency.setValueAtTime(138 * pitchRatio, now);
  impact.frequency.exponentialRampToValueAtTime(48 * pitchRatio, now + 0.36);
  impactGain.gain.setValueAtTime(0.0001, now);
  impactGain.gain.exponentialRampToValueAtTime(0.4, now + 0.008);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  impact.connect(impactGain);
  impactGain.connect(master);
  impact.start(now);
  impact.stop(now + 0.58);

  [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.035 + index * 0.068;
    oscillator.type = index < 3 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.055, start + 0.2);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.21 - index * 0.014, start + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55 + index * 0.025);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.72);
  });

  [1046.5, 1318.51, 1567.98, 2093].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.5 + index * 0.055;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * pitchRatio, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * pitchRatio * 1.04, start + 0.32);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14 - index * 0.014, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.76);
  });

  const shimmer = audio.createOscillator();
  const shimmerGain = audio.createGain();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(2093 * pitchRatio, now + 0.7);
  shimmer.frequency.exponentialRampToValueAtTime(4186.01 * pitchRatio, now + 1.08);
  shimmerGain.gain.setValueAtTime(0.0001, now + 0.7);
  shimmerGain.gain.exponentialRampToValueAtTime(0.09, now + 0.76);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.34);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(master);
  shimmer.start(now + 0.7);
  shimmer.stop(now + 1.38);
}

function playV3SoftMultiplierWinSound(multiplier, startDelay = 0, colorTier = null) {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();

  const maximum = getMainFieldMaximumMultiplier();
  const tier = colorTier === null
    ? multiplier < 1 ? 0 : multiplier < maximum * 0.15 ? 1 : 2
    : colorTier;
  const frequency = [392, 493.88, 523.25][tier];
  const now = audio.currentTime + startDelay;
  const duration = [0.21, 0.27, 0.28][tier];
  const envelope = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime([1150, 1850, 2050][tier], now);
  filter.Q.setValueAtTime(0.4, now);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime([0.09, 0.18, 0.2][tier], now + 0.014);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  envelope.connect(filter);
  filter.connect(getAudioOutput(audio));

  [[1, [0.36, 0.43, 0.46][tier]], [2, [0.045, 0.09, 0.105][tier]]].forEach(([partial, volume]) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency * partial * 1.018, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * partial, now + 0.09);
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(envelope);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.015);
  });
}

function playMultiplierResultSound(multiplier, bonusActive = false, premium = false, v3ColorTier = null) {
  if (multiplier <= 0) return;
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  const soundCount = Math.max(1, Math.min(
    MAX_RESULT_SOUND_LEVELS,
    state.roundOutcome?.puck_results?.length || state.puckCount || 1
  ));
  const firstPitchStep = Math.max(0, 3 - soundCount);
  const pitchStep = Math.min(MAX_RESULT_SOUND_LEVELS - 1, firstPitchStep + state.resultSoundStep);
  state.resultSoundStep += 1;
  const delayMs = Math.max(0, state.nextMultiplierSoundAt - now);
  state.nextMultiplierSoundAt = now + delayMs + 105;
  state.lastMultiplierSoundAt = now + delayMs;
  const displayedMultiplier = multiplier * (bonusActive ? 10 : 1);
  if (window.BalloroBonusUI?.isV3 && !bonusActive && displayedMultiplier < 10) {
    // Small ordinary wins stay soft. Purple retains its special cue below
    // 10x too; the separate big-win controller still enforces the 10x gate.
    if (!state.soundEffectsMuted) {
      state.winSoundEndsAt = Math.max(state.winSoundEndsAt, now + delayMs + 300);
    }
    playV3SoftMultiplierWinSound(displayedMultiplier, delayMs / 1000, displayedMultiplier > 1 ? 1 : 0);
    return;
  }
  if (!state.soundEffectsMuted) duckBackgroundMusic(bonusActive ? 1500 : 800);
  if (!state.soundEffectsMuted) {
    state.winSoundEndsAt = Math.max(state.winSoundEndsAt, now + delayMs + (bonusActive ? 1380 : 680));
  }
  if (bonusActive) playPurpleMultiplierWinSound(multiplier * 10, pitchStep, delayMs / 1000);
  else playWinSound(multiplier, pitchStep, delayMs / 1000);
}

function playBonusStarSound(starStep = 1) {
  if (state.soundEffectsMuted) {
    return;
  }

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const step = Math.max(1, Math.min(3, starStep));
  const now = audio.currentTime;
  const progress = (step - 1) / 2;
  const chords = {
    1: [523.25, 659.25, 880],
    2: [659.25, 880, 1174.66],
    3: [783.99, 1046.5, 1567.98]
  };
  const master = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3600 + progress * 1200, now);
  filter.Q.setValueAtTime(0.5, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.15 + progress * 0.06, now + 0.018);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.62 + progress * 0.18);
  master.connect(filter);
  filter.connect(getAudioOutput(audio));

  chords[step].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * (0.064 + progress * 0.012);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (1.035 + progress * 0.02), start + 0.18);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.13 + progress * 0.05, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36 + progress * 0.12);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.42 + progress * 0.12);
  });

  const sparkle = audio.createOscillator();
  const sparkleGain = audio.createGain();
  sparkle.type = "sine";
  sparkle.frequency.setValueAtTime(1396.91 + progress * 520, now + 0.11);
  sparkle.frequency.exponentialRampToValueAtTime(2093 + progress * 850, now + 0.3 + progress * 0.05);
  sparkleGain.gain.setValueAtTime(0.0001, now + 0.11);
  sparkleGain.gain.exponentialRampToValueAtTime(0.032 + progress * 0.04, now + 0.145);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44 + progress * 0.14);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(master);
  sparkle.start(now + 0.11);
  sparkle.stop(now + 0.48 + progress * 0.16);
}

function playBonusCompleteSound() {
  state.lastStarBoostSoundAt = (window.BalloroGameLifecycle?.now() ?? performance.now());
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const master = audio.createGain();
  const compressor = audio.createDynamicsCompressor();
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(4600, now + 0.72);
  filter.Q.setValueAtTime(0.55, now);
  compressor.threshold.setValueAtTime(-14, now);
  compressor.knee.setValueAtTime(10, now);
  compressor.ratio.setValueAtTime(4, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.22, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.3, now + 0.025);
  master.gain.setValueAtTime(0.22, now + 0.68);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.34);
  master.connect(filter);
  filter.connect(compressor);
  compressor.connect(getAudioOutput(audio));

  // Bonus activation is a celebratory unlock stinger, deliberately without
  // the bass impact and cashout resolution used by multiplier win sounds.
  const lift = audio.createOscillator();
  const liftGain = audio.createGain();
  lift.type = "triangle";
  lift.frequency.setValueAtTime(220, now);
  lift.frequency.exponentialRampToValueAtTime(880, now + 0.54);
  liftGain.gain.setValueAtTime(0.0001, now);
  liftGain.gain.exponentialRampToValueAtTime(0.11, now + 0.05);
  liftGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
  lift.connect(liftGain);
  liftGain.connect(master);
  lift.start(now);
  lift.stop(now + 0.65);

  [349.23, 523.25, 698.46, 880, 1046.5].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.08 + index * 0.085;
    oscillator.type = index < 2 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.075, start + 0.24);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.15 - index * 0.013, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.46);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.5);
  });

  [698.46, 880, 1046.5].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + 0.62;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.025, start + 0.44);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.095 - index * 0.012, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.58);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.62);
  });
}

function playMultiPlusSound() {
  if ((window.BalloroGameLifecycle?.now() ?? performance.now()) - state.lastStarBoostSoundAt < 700 || state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  duckBackgroundMusic(760);
  const now = audio.currentTime;
  const master = audio.createGain();
  const filter = audio.createBiquadFilter();
  const compressor = audio.createDynamicsCompressor();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, now);
  filter.frequency.exponentialRampToValueAtTime(5600, now + 0.34);
  compressor.threshold.setValueAtTime(-16, now);
  compressor.knee.setValueAtTime(8, now);
  compressor.ratio.setValueAtTime(3, now);
  compressor.attack.setValueAtTime(0.006, now);
  compressor.release.setValueAtTime(0.14, now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
  master.gain.setValueAtTime(0.13, now + 0.3);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.64);
  master.connect(filter);
  filter.connect(compressor);
  compressor.connect(getAudioOutput(audio));

  [392, 523.25, 783.99, 1046.5].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * 0.055;
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + 0.25);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14 - index * 0.018, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.44);
  });

  const ping = audio.createOscillator();
  const pingGain = audio.createGain();
  ping.type = "sine";
  ping.frequency.setValueAtTime(1567.98, now + 0.18);
  ping.frequency.exponentialRampToValueAtTime(2093, now + 0.38);
  pingGain.gain.setValueAtTime(0.0001, now + 0.18);
  pingGain.gain.exponentialRampToValueAtTime(0.07, now + 0.2);
  pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.56);
  ping.connect(pingGain);
  pingGain.connect(master);
  ping.start(now + 0.18);
  ping.stop(now + 0.58);
}

function playMultiPlusNeonCue(kind = "step") {
  if (state.soundEffectsMuted) return;
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = kind === "stop" ? "sine" : kind === "start" ? "triangle" : "square";
  const frequency = kind === "stop" ? 1046.5 : kind === "start" ? 330 : 520 + (Date.now() % 5) * 55;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (kind === "stop") oscillator.frequency.exponentialRampToValueAtTime(1567.98, now + 0.22);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(kind === "step" ? 0.025 : 0.09, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "step" ? 0.055 : 0.32));
  oscillator.connect(gain);
  gain.connect(getAudioOutput(audio));
  oscillator.start(now);
  oscillator.stop(now + (kind === "step" ? 0.065 : 0.36));
}

// Semantic recording hook. The live game already draws this effect directly;
// the offline tape recorder replaces this no-op so playback can recreate it.
function recordDiamondPickupEffect() {}

function playLaunchSound() {
  if (state.soundEffectsMuted) {
    return;
  }

  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  if (audio.state === "suspended") {
    audio.resume();
  }

  const now = audio.currentTime;
  const master = audio.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  master.connect(getAudioOutput(audio));

  const tone = audio.createOscillator();
  const toneGain = audio.createGain();
  const toneFilter = audio.createBiquadFilter();
  tone.type = "sine";
  tone.frequency.setValueAtTime(145, now);
  tone.frequency.exponentialRampToValueAtTime(330, now + 0.12);
  toneFilter.type = "lowpass";
  toneFilter.frequency.setValueAtTime(1200, now);
  toneGain.gain.setValueAtTime(0.0001, now);
  toneGain.gain.exponentialRampToValueAtTime(0.32, now + 0.01);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  tone.connect(toneFilter);
  toneFilter.connect(toneGain);
  toneGain.connect(master);
  tone.start(now);
  tone.stop(now + 0.24);

  const click = audio.createOscillator();
  const clickGain = audio.createGain();
  click.type = "triangle";
  click.frequency.setValueAtTime(560, now);
  click.frequency.exponentialRampToValueAtTime(260, now + 0.045);
  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.exponentialRampToValueAtTime(0.18, now + 0.004);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  click.connect(clickGain);
  clickGain.connect(master);
  click.start(now);
  click.stop(now + 0.08);
}

function formatMoney(value) {
  return `${value.toLocaleString(LOCALES[state.language] || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

function formatMultiplierValue(value, maximumFractionDigits = 2, locale = null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";
  if (locale) {
    return numericValue.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits
    });
  }
  const fixedValue = numericValue.toFixed(maximumFractionDigits);
  return fixedValue.includes(".")
    ? fixedValue.replace(/0+$/, "").replace(/\.$/, "")
    : fixedValue;
}

function parseBet(slot) {
  const input = slot.querySelector(".bet-value");
  const value = Number.parseFloat(input.value.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.max(BET_STEPS[0], Math.min(BET_STEPS.at(-1), value)) : 0;
}

function formatStake(value) {
  return value >= 10 ? value.toFixed(0) : value.toFixed(2);
}

function getStepValue(current, direction) {
  const normalized = Math.max(BET_STEPS[0], Math.min(BET_STEPS[BET_STEPS.length - 1], current));
  if (direction > 0) {
    return BET_STEPS.find((step) => step > normalized + 0.0001) || BET_STEPS[BET_STEPS.length - 1];
  }
  return [...BET_STEPS].reverse().find((step) => step < normalized - 0.0001) || BET_STEPS[0];
}

function getWinningLines(cell) {
  const lines = [];
  if (cell.row === 0) lines.push("top");
  if (cell.col === GRID_SIZE - 1) lines.push("right");
  if (cell.row === GRID_SIZE - 1) lines.push("bottom");
  if (cell.col === 0) lines.push("left");
  return lines;
}

function formatPurpleMultiplier(value) {
  return `${formatMultiplierValue(value, 2, LOCALES[state.language] || "en-US")}x`;
}

function getTodayWinsStorageKey() {
  const now = new Date();
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  return `${TODAY_WINS_STORAGE_PREFIX}:${date}`;
}

function loadTodayWins() {
  // Extend the existing local sample ranking, without touching gameplay RNG.
  const samples=Array.from({length:90},(_,i)=>({
    id:'seed-extra-'+i,name:'Player'+(1000+i*817),multiplier:Number((5.9-i*.06).toFixed(2)),timestamp:0
  }));
  const defaults=[...state.purpleLeaderboard,...samples].sort((a,b)=>b.multiplier-a.multiplier);
  state.purpleLeaderboard=defaults.slice(0,100);
  try {
    // Forget legacy saved results, but preserve profile and sound preferences.
    const storage=window.localStorage;
    for(let index=storage.length-1;index>=0;index--){
      const key=storage.key(index);
      if(key && key.startsWith(TODAY_WINS_STORAGE_PREFIX+':'))storage.removeItem(key);
    }
  } catch {
    // The daily board remains available in memory when storage is unavailable.
  }
}

function saveTodayWins() {
  // Ranking is session-only: a reload starts a fresh game.
}

function renderPurpleLeaderboard() {
  if (!els.purpleLeaderboard) return;
  els.purpleLeaderboard.innerHTML = "";
  state.purpleLeaderboard.forEach((entry, index) => {
    const item = document.createElement("li");
    item.classList.toggle("is-real", entry.isReal === true);
    item.classList.toggle("is-new", entry.id === state.latestPurpleLeaderboardId);

    const rank = document.createElement("span");
    rank.className = "purple-rank";
    rank.textContent = String(index + 1);
    const name = document.createElement("span");
    name.className = "purple-player-name";
    name.textContent = entry.isReal && typeof getPlayerNickname==='function' ? getPlayerNickname() + ' (YOU)' : entry.name;
    const value = document.createElement("strong");
    value.className = "purple-player-value";
    value.textContent = formatPurpleMultiplier(entry.multiplier);
    const avatar=document.createElement("span");
    avatar.className="leaderboard-avatar";
    avatar.setAttribute("aria-hidden","true");
    // Stable presentation-only assignment: sorting never changes a player's face.
    const avatarSeed=[...entry.name].reduce((hash,char)=>(hash*31+char.codePointAt(0))>>>0,0);
    setAvatarVars(avatar,avatars[entry.isReal ? state.avatarIndex : avatarSeed%avatars.length]);
    item.append(rank, avatar, name, value);
    els.purpleLeaderboard.append(item);
  });
}

function updatePurpleLeaderboardExpansion() {
  if (!els.purpleLeaderboardPanel || !els.purpleLeaderboardToggle) return;
  els.purpleLeaderboardPanel.classList.toggle("is-expanded", state.purpleLeaderboardExpanded);
  els.purpleLeaderboardPanel.setAttribute("aria-expanded", String(state.purpleLeaderboardExpanded));
  els.purpleLeaderboardToggle.setAttribute("aria-expanded", String(state.purpleLeaderboardExpanded));
  els.purpleLeaderboardToggle.setAttribute("aria-label",
    state.purpleLeaderboardExpanded ? t("showTopWinner") : t("showFullWinners"));
}

function addPurpleLeaderboardEntry(entry) {
  const multiplier = Number(entry.multiplier);
  if (!entry.id || !Number.isFinite(multiplier) || multiplier <= 0 || state.processedPurpleEvents.has(entry.id)) return;
  state.processedPurpleEvents.add(entry.id);
  if (state.processedPurpleEvents.size > 500) {
    state.processedPurpleEvents.delete(state.processedPurpleEvents.values().next().value);
  }

  const candidate = { ...entry, multiplier, timestamp: entry.timestamp ?? Date.now() };
  const oldPlace=state.purpleLeaderboard.findIndex(item=>item.isReal);
  const previousEntry = state.purpleLeaderboard.find((item) => item.name === candidate.name);
  if (previousEntry && previousEntry.multiplier >= candidate.multiplier) return;
  const ranked = [...state.purpleLeaderboard.filter((item) => item.name !== candidate.name), candidate]
    .sort((a, b) => b.multiplier - a.multiplier || a.timestamp - b.timestamp)
    .slice(0, 100);
  if (!ranked.some((item) => item.id === candidate.id)) return;
  state.purpleLeaderboard = ranked;
  const newPlace=ranked.findIndex(item=>item.isReal);
  if(candidate.isReal && newPlace>=0 && (oldPlace<0 || newPlace<oldPlace))
    showRankPromotion(newPlace+1);
  state.latestPurpleLeaderboardId = candidate.id;
  saveTodayWins();
  renderPurpleLeaderboard();
}

let rankPromotionTimer;
function showRankPromotion(place) {
  let notice=document.getElementById('rankPromotion');
  if(!notice){
    notice=document.createElement('div');notice.id='rankPromotion';
    notice.setAttribute('role','button');notice.setAttribute('aria-live','polite');notice.tabIndex=0;
    const openTop=()=>{
      if(typeof desktopUi==='undefined' || isBalloroDesktopLayout())return;
      clearTimeout(rankPromotionTimer);notice.hidden=true;
      desktopUi.openTop?.();
    };
    notice.addEventListener('click',openTop);
    notice.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();openTop();}
    });
    document.querySelector('.mine-stage').append(notice);
  }
  notice.textContent='Вы заняли '+place+' место в топ-100!';
  notice.setAttribute('aria-label',notice.textContent+' Открыть таблицу топ-100');
  notice.hidden=false;clearTimeout(rankPromotionTimer);
  rankPromotionTimer=setTimeout(()=>{notice.hidden=true;},4500);
}

function setAvatarVars(element, avatar) {
  element.style.setProperty("--avatar-image", 'url("assets/igaming-avatars-50-v2.webp")');
  element.style.setProperty("--avatar-x", `${(avatar.col / 9) * 100}%`);
  element.style.setProperty("--avatar-y", `${(avatar.row / 4) * 100}%`);
  element.textContent = "";
}

function renderAvatars() {
  els.avatarGrid.innerHTML = "";
  avatars.forEach((avatar, index) => {
    const button = document.createElement("button");
    button.className = `avatar-option${index === state.avatarIndex ? " active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", `${t("avatar")} ${index + 1}`);
    setAvatarVars(button, avatar);
    button.addEventListener("click", () => {
      state.avatarIndex = index;
      syncAvatar();
      renderAvatars();
      closePopup(els.avatarPopup);
    });
    els.avatarGrid.append(button);
  });
}

function syncAvatar() {
  setAvatarVars(els.menuAvatarPreview, avatars[state.avatarIndex]);
  renderPurpleLeaderboard();
}

function renderHistory() {
  els.rewardHistory.innerHTML = "";
  state.resultHistory.slice(0, 40).forEach((item) => {
    const span = document.createElement("span");
    const isBonus = typeof item === "object" && item?.bonus === true;
    const value = typeof item === "number" ? item : Number.parseFloat(item?.value ?? item);
    const puckCount = clamp(Number.parseInt(item?.puckCount ?? 1, 10) || 1, 1, 3);
    const color = isBonus ? getBonusMultiplierColor(item.baseValue ?? value / 10) : getMultiplierColor(value);
    span.className = "history-chip multiplier-chip";
    span.classList.toggle("bonus-win", isBonus);
    span.style.color = color;
    span.style.borderColor = withColorAlpha(color, 0.34);
    span.style.boxShadow = `0 0 ${isBonus ? 20 : 14}px ${withColorAlpha(color, isBonus ? 0.28 : 0.14)}`;
    const multiplierLabel = document.createElement("span");
    multiplierLabel.className = "history-multiplier-value";
    multiplierLabel.textContent = getMultiplierText(value);
    const puckDots = document.createElement("span");
    puckDots.className = "history-puck-dots";
    puckDots.setAttribute("aria-label", `${puckCount} puck${puckCount === 1 ? "" : "s"}`);
    for (let index = 0; index < puckCount; index += 1) {
      puckDots.append(document.createElement("i"));
    }
    span.append(multiplierLabel, puckDots);
    els.rewardHistory.append(span);
  });
}

function updateCrownCounter() {
  if (!els.crownCounter) {
    return;
  }

  const requiredStars = getRequiredStars();
  const pendingDiamonds = window.BalloroBonusUI?.isV2 ? 0 : getPendingCounterFlyInCount("diamond");
  const stored = window.BalloroBonusUI?.isV2 ? state.v2BonusProgress.diamond : state.crownsCollected;
  const visualCrownsCollected = window.BalloroBonusUI?.isV2
    && state.v2BonusArrivedActive.diamond
    ? requiredStars : clamp(stored - pendingDiamonds, 0, requiredStars);
  Array.from(els.crownCounter.children).forEach((item, index) => {
    item.classList.toggle("is-unused", index >= requiredStars);
    item.classList.toggle("filled", index < visualCrownsCollected);
  });
  const bonusCounter = els.crownCounter.closest(".crown-bonus-counter");
  const isActive = window.BalloroBonusUI?.isV2
    ? state.v2BonusArrivedActive.diamond
    : visualCrownsCollected >= requiredStars;
  const wasActive = bonusCounter?.classList.contains("is-active");
  bonusCounter?.classList.toggle("is-active", isActive);
  if (isActive && !wasActive) bubbleBonusCounter();
  if (!isActive) {
    bonusCounter?.classList.remove("bonus-bubble");
  }
}

function updateMultiPlusCounter() {
  if (!els.multiPlusCounter) return;
  const wasActive = els.multiPlusCounter.classList.contains("is-active");
  const visualMultiPlusActive = window.BalloroBonusUI?.isV2
    ? Boolean(state.v2BonusArrivedActive.lemon)
    : Boolean(state.multiPlusToken?.consumed)
      || (state.multiPlusActive && getPendingCounterFlyInCount("multiPlus") === 0);
  if (window.BalloroBonusUI?.isV2) {
    const visible = visualMultiPlusActive ? V2_BONUS_THRESHOLDS.lemon : state.v2BonusProgress.lemon;
    els.multiPlusCounter.querySelectorAll(".v2-lemon-slots .v2-lemon")
      .forEach((icon, index) => icon.classList.toggle("filled", index < visible));
  }
  els.multiPlusCounter.classList.toggle("is-active", visualMultiPlusActive);
  if (visualMultiPlusActive && !wasActive) bubbleMultiPlusCounter();
  if (!visualMultiPlusActive) els.multiPlusCounter.classList.remove("multi-plus-bubble");
}

function isFieldPocketBonusActive() {
  if (window.BalloroBonusUI?.isV2) return Boolean(state.v2BonusArrivedActive.blue);
  const pocket = window.BalloroBonusUI?.isV2 ? state.bluePocket : state.fieldPocket;
  const zoneId = window.BalloroBonusUI?.isV2
    ? BLUE_FIELD_POCKET_ZONE_ID : FIELD_POCKET_ZONE_ID;
  if (!usesFieldPocketMechanics() || !pocket) return false;
  if (pocket.consumed) return !window.BalloroBonusUI?.isV2
    || Boolean(state.v2BonusArrivedActive.blue);
  return !window.BalloroBonusUI?.isV2 && state.pucks.some((puck) => puck.secretRoom?.zoneId === zoneId
    && ["capturing", "pocket_wait"].includes(puck.secretRoom.phase));
}

function updatePocketBonusCounter() {
  const counter = els.pocketBonusCounter;
  if (!counter) return;
  const isVisible = usesFieldPocketMechanics();
  const isActive = isVisible && isFieldPocketBonusActive();
  const wasActive = counter.classList.contains("is-active");
  counter.classList.toggle("hidden", !isVisible);
  counter.classList.toggle("is-active", isActive);
  if (window.BalloroBonusUI?.isV2) {
    counter.querySelector(".v2-blue-symbol")?.classList.toggle("filled", isActive);
  }
  if (isActive && !wasActive) {
    if (state.animationsEnabled) {
      counter.classList.remove("bonus-bubble");
      void counter.offsetWidth;
      counter.classList.add("bonus-bubble");
      counter.addEventListener("animationend", () => counter.classList.remove("bonus-bubble"), { once: true });
    }
  } else if (!isActive) {
    counter.classList.remove("bonus-bubble");
  }
}

function updateChanceBonusCounter() {
  if (!els.chanceBonusCounter) return;
  const wasActive = els.chanceBonusCounter.classList.contains("is-active");
  const active = window.BalloroBonusUI?.isV2
    ? Boolean(state.v2BonusArrivedActive.crown)
    : Boolean(state.chancePocket?.consumed)
      || ["capturing", "captured", "spinning", "sinking"].includes(state.chancePhase);
  els.chanceBonusCounter.classList.toggle("is-active", active);
  if (window.BalloroBonusUI?.isV2) {
    const visible = active ? V2_BONUS_THRESHOLDS.crown : state.v2BonusProgress.crown;
    els.chanceBonusCounter.querySelectorAll(".v2-crown-slots .v2-crown")
      .forEach((icon, index) => icon.classList.toggle("filled", index < visible));
  }
  if (active && !wasActive && state.animationsEnabled) {
    els.chanceBonusCounter.classList.remove("bonus-bubble");
    void els.chanceBonusCounter.offsetWidth;
    els.chanceBonusCounter.classList.add("bonus-bubble");
    els.chanceBonusCounter.addEventListener("animationend", () =>
      els.chanceBonusCounter.classList.remove("bonus-bubble"), { once: true });
  }
}

function bubbleMultiPlusCounter() {
  if (!els.multiPlusCounter || !state.animationsEnabled) return;
  els.multiPlusCounter.classList.remove("multi-plus-bubble");
  void els.multiPlusCounter.offsetWidth;
  els.multiPlusCounter.classList.add("multi-plus-bubble");
  els.multiPlusCounter.addEventListener("animationend", () => {
    els.multiPlusCounter.classList.remove("multi-plus-bubble");
  }, { once: true });
}

function getRequiredStars() {
  return window.BalloroBonusUI?.isV2 ? V2_BONUS_THRESHOLDS.diamond : 3;
}

const V2_BONUS_PROGRESS_KEY = window.BalloroBonusUI?.isV3
  ? (window.BalloroBonusUI?.isV4 ? "balloro-x-test-v4-live-progress-1" : "balloro-x-test-v3-live-progress-1")
  : window.BalloroPocketExperiment
    ? "balloro-x-test-v2-pocket-experiment-progress-1" : "balloro-x-test-v2-bonus-progress-1";
const V2_BONUS_THRESHOLDS = Object.freeze({ diamond: 1, crown: 1, lemon: 1, blue: 1 });

function loadV2BonusProgress() {
  if (!window.BalloroBonusUI?.isV2) return;
  try {
    const saved = JSON.parse(window.localStorage.getItem(V2_BONUS_PROGRESS_KEY) || "{}");
    for (const [kind, threshold] of Object.entries(V2_BONUS_THRESHOLDS)) {
      const value = Number(saved[kind]);
      state.v2BonusProgress[kind] = Number.isInteger(value) && value >= 0 && value < threshold ? value : 0;
    }
  } catch (_) { /* Private browsing can deny storage; the current session still works. */ }
}

function saveV2BonusProgress() {
  if (!window.BalloroBonusUI?.isV2) return;
  try { window.localStorage.setItem(V2_BONUS_PROGRESS_KEY, JSON.stringify(state.v2BonusProgress)); }
  catch (_) { /* Keep session progress if storage is unavailable. */ }
}

function resetV2BonusProgressForLineChange() {
  if (!window.BalloroBonusUI?.isV2) return;
  clearCounterFlyIns();
  state.v2BonusProgress = { diamond: 0, crown: 0, lemon: 0, blue: 0 };
  state.v2BonusArrivedActive = { diamond: false, crown: false, lemon: false, blue: false };
  state.crownsCollected = 0;
  saveV2BonusProgress();
  updateCrownCounter();
  updateChanceBonusCounter();
  updateMultiPlusCounter();
  updatePocketBonusCounter();
}

function claimV2BonusSymbol(kind) {
  if (!window.BalloroBonusUI?.isV2) return true;
  const threshold = V2_BONUS_THRESHOLDS[kind];
  if (!threshold) return false;
  const next = (state.v2BonusProgress[kind] || 0) + 1;
  const activated = next >= threshold;
  state.v2BonusProgress[kind] = activated ? 0 : next;
  if (activated) state.v2BonusArrivedActive[kind] = true;
  if (kind === "diamond") state.crownsCollected = state.v2BonusProgress.diamond;
  saveV2BonusProgress();
  updateCrownCounter();
  updateChanceBonusCounter();
  updateMultiPlusCounter();
  updatePocketBonusCounter();
  if (window.BalloroBonusUI?.isV3) updateBetButtons();
  return activated;
}

function resetDiamondBoostAfterPuckCountChange() {
  if (state.running) return;
  if (window.BalloroBonusUI?.isV2) return;
  state.bonusStars = [];
  clearCounterFlyIns("diamond");
  state.crownsCollected = 0;
  state.x10BoostActivated = false;
  state.crownBonusAwarded = false;
  state.starPickupLog = [];
  updateCrownCounter();
}

function bubbleBonusCounter() {
  const bonusCounter = els.crownCounter?.closest(".crown-bonus-counter");
  if (!bonusCounter || !state.animationsEnabled) {
    return;
  }
  bonusCounter.classList.remove("bonus-bubble");
  void bonusCounter.offsetWidth;
  bonusCounter.classList.add("bonus-bubble");
  bonusCounter.addEventListener("animationend", () => bonusCounter.classList.remove("bonus-bubble"), { once: true });
}

function setupCanvas() {
  const previousField = { ...state.field };
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = els.canvas.getBoundingClientRect();
  const pixelWidth = Math.max(1, Math.round(width * ratio));
  const pixelHeight = Math.max(1, Math.round(height * ratio));

  if (els.canvas.width !== pixelWidth) {
    els.canvas.width = pixelWidth;
  }
  if (els.canvas.height !== pixelHeight) {
    els.canvas.height = pixelHeight;
  }

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const winLabelStyle = window.getComputedStyle(els.roundWinLabel);
  const winLabelBottom = Number.parseFloat(winLabelStyle.bottom) || 18;
  const winLabelHeight = Number.parseFloat(winLabelStyle.fontSize) || 25;
  const topFieldReserve = clamp(height * 0.12, 62, 108);
  const bottomFieldReserve = winLabelBottom + winLabelHeight + clamp(height * 0.052, 30, 58);
  const verticalFieldLimit = Math.max(1, height - topFieldReserve - bottomFieldReserve);
  const maxDiamondSize = Math.min(width * 0.92, verticalFieldLimit);
  const diamondBottomAnchor = height - bottomFieldReserve;
  state.field.width = width;
  state.field.height = height;
  state.field.ratio = ratio;
  state.field.half = maxDiamondSize / (2 * Math.SQRT2);
  state.field.cx = width / 2;
  state.field.grid = (state.field.half * 2) / GRID_SIZE;
  state.field.cy = diamondBottomAnchor - maxDiamondSize / 2;
  const mathConfig = getMathConfiguration();
  state.field.puckRadius = mathConfig ? state.field.half * mathConfig.puck_radius : state.field.grid / 4;
  // Move the whole board assembly up enough to fit the launch ball's largest
  // wave and its glow below either lower room, without shrinking the diamonds.
  const mainRadius = maxDiamondSize / 2;
  const roomRadius = mainRadius * 0.4;
  const roomOffsetY = (mainRadius + roomRadius + CHANCE_ROOM_GAP_PX) * CHANCE_ROOM_CORNER_Y_SHARE;
  const launchWaveClearance = state.field.puckRadius * 2.5 + CHANCE_ROOM_VIEWPORT_MARGIN_PX;
  state.field.cy = Math.min(state.field.cy, height - roomOffsetY - roomRadius - launchWaveClearance);
  if (document.body.classList.contains('slot-ui')) {
    const footer = document.querySelector('.bet-panel').getBoundingClientRect();
    const canvasRect = els.canvas.getBoundingClientRect();
    const desktop = isBalloroDesktopLayout();
    const radiusRatio = mathConfig ? mathConfig.puck_radius : 1 / (2 * GRID_SIZE);
    const stage = els.canvas.closest('.mine-stage');
    const dockStyle = getComputedStyle(stage, '::before');
    const dockBottom = Math.max(
      stage.getBoundingClientRect().top - canvasRect.top
        + (Number.parseFloat(dockStyle.top) || 0) + (Number.parseFloat(dockStyle.height) || 0),
      ...[...document.querySelectorAll('[data-bonus-help]')]
        .map(node => node.getBoundingClientRect().bottom - canvasRect.top));
    const labelHeight = Number.parseFloat(winLabelStyle.lineHeight) || winLabelHeight * 1.15;
    const statusStyle = getComputedStyle(document.getElementById('playControlStatus'));
    // Symmetric gaps are measured from the visible dock to the win text.
    // Reserve two status lines in both gaps, even while hidden: a notice must
    // not move a live board or cover the SCs on a short screen.
    const statusReserve = (Number.parseFloat(statusStyle.lineHeight) || 19) * 2 + 24;
    const bottom = footer.top - canvasRect.top - labelHeight - 4;
    let horizontalRadius = width * .49;
    if (desktop && desktopUi.enabled) {
      const leftPanel = document.getElementById('desktopRounds');
      const rightPanel = document.getElementById('desktopTop');
      // Layout positions do not change when a table is collapsed or animating.
      horizontalRadius = Math.min(horizontalRadius,
        window.innerWidth / 2 - (leftPanel.offsetLeft + leftPanel.offsetWidth) - 36,
        rightPanel.offsetLeft - window.innerWidth / 2 - 36);
    }
    const layout = fitBalloroBoardAssembly({width, horizontalRadius,
      top: dockBottom, bottom, clearance: statusReserve});
    state.field.half = layout.radius / Math.SQRT2;
    state.field.grid = state.field.half * 2 / GRID_SIZE;
    state.field.puckRadius = state.field.half * radiusRatio;
    state.field.cy = layout.cy;
    els.roundWinLabel.style.top = 'auto';
    els.roundWinLabel.style.bottom = String(height - (footer.top - canvasRect.top) + 4) + 'px';
  }
  fitBonusCountersToField();
  rescaleLiveBoardGeometry(previousField);
  positionBonusUiV2Logo();
  positionPlayControlStatus();
  fitSpinContinueLabel();
  if ((window.BalloroBonusUI?.isV2 || window.BalloroBonusUI?.isV3) && els.versionSwitcher) {
    const apexY = state.field.cy - state.field.half * Math.SQRT2;
    els.versionSwitcher.style.top = `${Math.max(12, Math.round(apexY + 18))}px`;
  }
}

function rescaleLiveBoardGeometry(previousField) {
  const scale = state.field.half / previousField.half;
  if (!(previousField.half > 0) || !Number.isFinite(scale)) return;
  if (scale === 1 && previousField.cx === state.field.cx && previousField.cy === state.field.cy) return;
  const scaled = new Set();
  const scaleValues = (object, keys) => {
    if (!object || scaled.has(object)) return;
    scaled.add(object);
    for (const key of keys) if (Number.isFinite(object[key])) object[key] *= scale;
  };
  // Saved trajectory frames, chosen outcomes, clocks, visits and payouts are
  // immutable here. Only field-space positions/velocities change with its size.
  const pucks = new Set([...state.pucks, ...bigWinEffect.winners,
    ...(playControls?.pause.winners || []), ...resumedWinPresentation.keys(),
    ...state.v3BonusQueue.map(entry => entry.puck), state.v3BonusPuck,
    state.multiPlusCapturedPuck, state.chanceCapturedPuck]);
  for (const puck of pucks) {
    if (!puck) continue;
    scaleValues(puck, ['x', 'y', 'previousX', 'previousY', 'vx', 'vy', 'speed']);
    for (const capture of [puck.multiPlusCapture, puck.v3QueuePull, puck.chance?.pocketCapture])
      scaleValues(capture, ['startX', 'startY', 'targetX', 'targetY']);
    scaleValues(puck.secretRoom?.captureStart, ['x', 'y']);
    if (scale !== 1 || previousField.cx !== state.field.cx || previousField.cy !== state.field.cy)
      window.BalloroQuickTrail?.clear(puck);
  }
  for (const token of [...state.bonusStars, state.multiPlusToken]) scaleValues(token, ['x', 'y', 'radius']);
  const moveScreenPoint = point => {
    if (!point) return;
    point.x = state.field.cx + (point.x - previousField.cx) * scale;
    point.y = state.field.cy + (point.y - previousField.cy) * scale;
  };
  for (const burst of state.starBursts) moveScreenPoint(burst);
  for (const flyIn of state.counterFlyIns) {
    moveScreenPoint(flyIn.source);
    flyIn.sourceSize *= scale;
    flyIn.liftSize *= scale;
    const counter = flyIn.kind === 'diamond' ? els.crownCounter
      : flyIn.kind === 'lemon' ? els.multiPlusCounter
        : flyIn.kind === 'crown' ? els.chanceBonusCounter : els.pocketBonusCounter;
    const target = getCanvasRelativeCenter(counter);
    if (target) flyIn.target = target;
  }
  if (v3FieldTransition?.vertical) {
    const radius = state.field.half * Math.SQRT2;
    v3FieldTransition.top = state.field.cy - radius;
    v3FieldTransition.bottom = Math.max(...CHANCE_ROOM_IDS.flatMap(id =>
      getChanceRoomGeometry(id).vertices.map(point => point.y)));
  }
}

function handleGameViewportResize() {
  window.BalloroGameLifecycle?.pauseForResize();
  setupCanvas();
  fitBrandTitle();
  fitLocalizedUiText();
  // Resizing is not a new round. In particular, never clear committed shots,
  // redraw their outcome, reset bonus queues or discard unsettled winnings.
  render({ frozenSnapshot: true });
}

function positionBonusUiV2Logo() {
  const logo = document.querySelector(".desktop-logo");
  if (!logo?.style) return;
  logo.style.removeProperty("left");
  logo.style.removeProperty("top");
  logo.style.removeProperty("font-size");
}

function fitBonusCountersToField() {
  const counters = [els.crownCounter?.closest(".crown-bonus-counter"),
    els.chanceBonusCounter, els.multiPlusCounter, els.pocketBonusCounter].filter(Boolean);
  if (counters.length !== 4) return;
  const {cx, cy, half, width} = state.field;
  const gap = 8;
  const canvasRect=els.canvas.getBoundingClientRect();
  const side=width>720 ? document.getElementById?.('desktopRounds') : null;
  // Use layout coordinates so collapsing the side table cannot move the counters.
  const panelClearance=side?.offsetWidth ? side.offsetLeft+side.offsetWidth-canvasRect.left+26 : 12;
  // On desktop, place the counters visually between the side tables and the
  // diamond instead of leaving them attached to the panel edges.
  const left=Math.max(12,panelClearance+(width>720 ? 34 : 0));
  const logo=document.querySelector('.desktop-logo')?.getBoundingClientRect();
  const arrow=document.querySelector('.mobile-table-left')?.getBoundingClientRect();
  const mobile=width<=720;
  if (window.BalloroBonusUI?.isV2) {
    counters.forEach(counter => {
      counter.style.removeProperty("left");
      counter.style.removeProperty("top");
      counter.style.removeProperty("scale");
      counter.style.removeProperty("transform-origin");
    });
    return;
  }
  const top=mobile
    ? Math.max(54,(arrow?.bottom||0)-canvasRect.top+6)
    : Math.max(88,(logo?.bottom||0)-canvasRect.top+16,(arrow?.bottom||0)-canvasRect.top+12);
  const radius=half*Math.SQRT2;
  const layout=value=>{
    const legacyY=[];
    let y=top;
    counters.forEach(counter=>{
      legacyY.push(y);
      y+=counter.offsetHeight*value+gap;
    });
    // Two mobile rows should consume two rows of vertical space, not inherit
    // the third/fourth slots of the former four-item column. This keeps the
    // plaques large while leaving the logo and corner arrows unobstructed.
    const rowHeight=Math.max(...counters.map(counter=>counter.offsetHeight))*value;
    let upperY=legacyY[2];
    let lowerY=legacyY[3];
    if(mobile){
      const fieldTop=cy-radius;
      const anchoredLower=fieldTop-rowHeight-14;
      const anchoredUpper=anchoredLower-rowHeight-gap;
      // Follow the diamond down when there is room, but never enter the logo
      // and corner-arrow band on a short viewport.
      upperY=Math.max(top,anchoredUpper);
      lowerY=upperY+rowHeight+gap;
    }
    return [
      {counter:counters[0],x:left,y:upperY},
      {counter:counters[2],x:width-left-counters[2].offsetWidth*value,y:upperY},
      {counter:counters[1],x:left,y:lowerY},
      {counter:counters[3],x:width-left-counters[3].offsetWidth*value,y:lowerY}
    ];
  };
  const fits=value=>{
    return layout(value).every(({counter,x,y})=>{
      const glow=mobile ? 1.06 : 1.14;
      const counterWidth=counter.offsetWidth*value;
      const counterHeight=counter.offsetHeight*value;
      const glowX=counterWidth*(glow-1)/2+12;
      const glowY=counterHeight*(glow-1)/2+12;
      const visualRight=x+counterWidth;
      const clearRight=visualRight+glowX;
      const clearBottom=y+counterHeight+glowY;
      const clear=Math.abs(cx-clamp(cx,x-glowX,clearRight))
        +Math.abs(cy-clamp(cy,y-glowY,clearBottom))>radius;
      // Glow may fade into the viewport edge; only the interactive plaque itself
      // must fit. Counting the glow as width made right-hand mobile counters tiny.
      return clear && x>=0 && visualRight<=width;
    });
  };
  let scale=mobile ? 1.28 : 1.12;
  while(scale>.2 && !fits(scale))scale-=.01;
  scale=Math.floor(scale*1000)/1000;
  layout(scale).forEach(({counter,x,y:counterY})=>{
    counter.style.transformOrigin = "top left";
    counter.style.scale = scale.toFixed(3);
    counter.style.left = `${x}px`;
    counter.style.top = `${counterY}px`;
  });
}

function toScreen(x, y) {
  return {
    x: state.field.cx + (x - y) / Math.SQRT2,
    y: state.field.cy + (x + y) / Math.SQRT2
  };
}

function drawLine(a, b, color, width) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function getCellFromPoint(x, y) {
  const { half, grid } = state.field;
  const col = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((x + half) / grid)));
  const row = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((y + half) / grid)));
  return { col, row };
}

function drawCell(col, row, fill, stroke = null, strokeWidth = 2) {
  const { half, grid } = state.field;
  const x0 = -half + grid * col;
  const y0 = -half + grid * row;
  const points = [
    toScreen(x0, y0),
    toScreen(x0 + grid, y0),
    toScreen(x0 + grid, y0 + grid),
    toScreen(x0, y0 + grid)
  ];

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

function getSideLinePoints(key) {
  const { half } = state.field;
  const sides = {
    top: [toScreen(-half, -half), toScreen(half, -half)],
    right: [toScreen(half, -half), toScreen(half, half)],
    bottom: [toScreen(half, half), toScreen(-half, half)],
    left: [toScreen(-half, half), toScreen(-half, -half)]
  };
  return sides[key];
}

function drawSideLine(key, color, width) {
  const points = getSideLinePoints(key);
  drawLine(points[0], points[1], color, width);
}

function drawGridLines(half, grid, color, width) {
  ctx.beginPath();
  for (let i = 1; i < GRID_SIZE; i += 1) {
    const line = -half + grid * i;
    const verticalStart = toScreen(line, -half);
    const verticalEnd = toScreen(line, half);
    const horizontalStart = toScreen(-half, line);
    const horizontalEnd = toScreen(half, line);
    ctx.moveTo(verticalStart.x, verticalStart.y);
    ctx.lineTo(verticalEnd.x, verticalEnd.y);
    ctx.moveTo(horizontalStart.x, horizontalStart.y);
    ctx.lineTo(horizontalEnd.x, horizontalEnd.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawMergedMultiplierCell(group, fill, stroke = null, strokeWidth = 2) {
  const { half, grid } = state.field;
  const x0 = -half + grid * group.col;
  const y0 = -half + grid * group.row;
  const size = grid * group.size;
  const points = [
    toScreen(x0, y0),
    toScreen(x0 + size, y0),
    toScreen(x0 + size, y0 + size),
    toScreen(x0, y0 + size)
  ];

  tracePolygon(points);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

function buildMergedMultiplierCells() {
  if (window.BalloroBonusUI?.isV3) {
    return { groups: [], covered: new Set(), byKey: new Map() };
  }
  const groups = [];
  const covered = new Set();
  const byKey = new Map();
  const sameMultiplier = (first, second) => Math.abs(first - second) < 1e-9;
  const dynamicXCenterKeys = new Set(
    state.layoutMode === "dynamic_diagonal_width"
      ? (getMathConfiguration()?.sector_definitions?.center || []).map((sector) => `${sector.col}_${sector.row}`)
      : []
  );

  const mergeSizes = GRID_SIZE === 7 && state.layoutMode === "dynamic_diagonal_width" ? [3, 2] : [2];
  for (const size of mergeSizes) {
    for (let row = 0; row <= GRID_SIZE - size; row += 1) {
      for (let col = 0; col <= GRID_SIZE - size; col += 1) {
        const keys = [];
        for (let rowOffset = 0; rowOffset < size; rowOffset += 1) {
          for (let colOffset = 0; colOffset < size; colOffset += 1) {
            keys.push(`${col + colOffset}_${row + rowOffset}`);
          }
        }
        if (keys.some((key) => covered.has(key))) continue;
        if (dynamicXCenterKeys.size && keys.some((key) => !dynamicXCenterKeys.has(key))) continue;

        const multiplier = getCellMultiplier(col, row);
        const category = getCellCategory(col, row);
        if (!multiplier) continue;
        const isMergedBlock = keys.every((key) => {
          const [cellCol, cellRow] = key.split("_").map(Number);
          return sameMultiplier(getCellMultiplier(cellCol, cellRow), multiplier)
            && getCellCategory(cellCol, cellRow) === category;
        });
        if (!isMergedBlock) continue;

        const group = { col, row, size, multiplier, category, keys };
        keys.forEach((key) => {
          covered.add(key);
          byKey.set(key, group);
        });
        groups.push(group);
      }
    }
  }

  return { groups, covered, byKey };
}

function drawMultiplierCellHighlight(mergedMultiplierCells, col, row, fill, stroke) {
  const group = mergedMultiplierCells.byKey.get(`${col}_${row}`);
  if (group) {
    drawMergedMultiplierCell(group, fill, stroke);
    return;
  }
  drawCell(col, row, fill, stroke);
}

function eraseMergedMultiplierInternalLines(groups, fill) {
  const { half, grid } = state.field;
  const eraseWidth = 5;
  const insetPx = 3;
  const addInsetSegment = (x1, y1, x2, y2) => {
    const start = toScreen(-half + grid * x1, -half + grid * y1);
    const end = toScreen(-half + grid * x2, -half + grid * y2);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const inset = Math.min(insetPx, Math.max(0, length / 2 - 0.5));
    const ux = length > 0 ? dx / length : 0;
    const uy = length > 0 ? dy / length : 0;
    ctx.moveTo(start.x + ux * inset, start.y + uy * inset);
    ctx.lineTo(end.x - ux * inset, end.y - uy * inset);
  };

  ctx.save();
  ctx.beginPath();
  groups.forEach((group) => {
    for (let offset = 1; offset < group.size; offset += 1) {
      addInsetSegment(group.col + offset, group.row, group.col + offset, group.row + group.size);
      addInsetSegment(group.col, group.row + offset, group.col + group.size, group.row + offset);
    }
  });
  ctx.strokeStyle = fill;
  ctx.lineWidth = eraseWidth;
  ctx.lineCap = "butt";
  ctx.stroke();
  ctx.restore();
}

function getSecretRoomOuterWallU() {
  const cells = getMathConfiguration()?.secret_room?.multi_plus_multiplier_cells
    || getMathConfiguration()?.secret_room?.multiplier_cells
    || [];
  const outerWall = cells.reduce((value, cell) => Math.max(value, cell.u1 || 0), 0);
  return clamp(outerWall || 0.8, 0.55, 0.92);
}

// Secret-room geometry experiment. Use "legacy_outer_tip" to restore the previous
// single-cut room shape. Keep both paths until the prototype is optimized.
const SECRET_ROOM_CORNER_CUT_MODE = "experimental_side_corner_cuts";
const SECRET_ROOM_LEGACY_CORNER_CUT_MODE = "legacy_outer_tip";
const SECRET_ROOM_EXPERIMENTAL_SIDE_CORNER_GRID_STEPS = 1;

function getLegacySecretRoomLocalPolygon(outerWallU = getSecretRoomOuterWallU()) {
  const outerCut = 1 - outerWallU;
  return [
    { u: 0, v: -1 },
    { u: 0, v: 1 },
    { u: outerWallU, v: outerCut },
    { u: outerWallU, v: -outerCut }
  ];
}

function chamferSecretRoomLocalPolygon(points, cornerIndexes, requestedCut) {
  if (!points?.length) return [];
  return points.flatMap((point, index) => {
    if (!cornerIndexes.includes(index)) return [{ ...point }];
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous.u - point.u, previous.v - point.v);
    const nextLength = Math.hypot(next.u - point.u, next.v - point.v);
    const cut = Math.min(requestedCut, previousLength * 0.42, nextLength * 0.42);
    const toward = (target, length) => ({
      u: point.u + (target.u - point.u) * (cut / Math.max(1e-9, length)),
      v: point.v + (target.v - point.v) * (cut / Math.max(1e-9, length))
    });
    return [toward(previous, previousLength), toward(next, nextLength)];
  });
}

function getExperimentalSecretRoomLocalPolygon(outerWallU = getSecretRoomOuterWallU()) {
  const cellSize = 2 / GRID_SIZE;
  const sideCutU = clamp(cellSize * SECRET_ROOM_EXPERIMENTAL_SIDE_CORNER_GRID_STEPS, 0.05, outerWallU - 0.01);
  return [
    { u: sideCutU, v: -1 + sideCutU },
    { u: 0, v: -1 + sideCutU },
    { u: 0, v: 1 - sideCutU },
    { u: sideCutU, v: 1 - sideCutU },
    { u: outerWallU, v: 1 - outerWallU },
    { u: outerWallU, v: outerWallU - 1 }
  ];
}

function getSecretRoomLocalPolygon(outerWallU = getSecretRoomOuterWallU()) {
  if (SECRET_ROOM_CORNER_CUT_MODE === SECRET_ROOM_LEGACY_CORNER_CUT_MODE) {
    return getLegacySecretRoomLocalPolygon(outerWallU);
  }
  return getExperimentalSecretRoomLocalPolygon(outerWallU);
}

function bevelSecretRoomOuterCorner(vertices, outerWallU = getSecretRoomOuterWallU()) {
  if (!vertices?.length || vertices.length < 3) return vertices || [];
  const baseA = vertices[0];
  const baseB = vertices[1];
  const tip = vertices[2];
  const cut = 1 - outerWallU;
  const toward = (point) => ({
    x: tip.x + (point.x - tip.x) * cut,
    y: tip.y + (point.y - tip.y) * cut
  });
  return [baseA, baseB, toward(baseB), toward(baseA)];
}

function secretRoomLocalPointInZone(zone, u, v) {
  const { half } = state.field;
  return {
    x: zone.portal.x + zone.normal.x * u * half + zone.tangent.x * v * half,
    y: zone.portal.y + zone.normal.y * u * half + zone.tangent.y * v * half
  };
}

function usesFieldPocketMechanics() {
  return GAME_MECHANICS_VARIANT === "field-pocket";
}

function getFieldPocketNormalized(pocket = state.fieldPocket) {
  if (!pocket) return null;
  return {
    x: -1 + (pocket.col + 0.5) * 2 / GRID_SIZE,
    y: -1 + (pocket.row + 0.5) * 2 / GRID_SIZE
  };
}

function getFieldPocketGeometry(pocket = state.fieldPocket, id = FIELD_POCKET_ZONE_ID) {
  const normalized = getFieldPocketNormalized(pocket);
  if (!normalized) return null;
  const hole = {
    x: normalized.x * state.field.half,
    y: normalized.y * state.field.half
  };
  return {
    id,
    normal: { x: 0, y: -1 },
    tangent: { x: 1, y: 0 },
    portal: { ...hole },
    hole,
    vertices: [],
    localPolygon: [],
    displayVertices: [],
    screenVertices: [],
    screenHole: toScreen(hole.x, hole.y),
    screenPortal: toScreen(hole.x, hole.y)
  };
}

function getSecretZoneGeometry(id) {
  if (id === BLUE_FIELD_POCKET_ZONE_ID && state.bluePocket) {
    return getFieldPocketGeometry(state.bluePocket, BLUE_FIELD_POCKET_ZONE_ID);
  }
  if (usesFieldPocketMechanics() && state.fieldPocket) {
    return getFieldPocketGeometry();
  }
  const { half } = state.field;
  const definitions = {
    top: {
      normal: { x: 0, y: -1 },
      tangent: { x: 1, y: 0 },
      portal: { x: -half, y: -half },
      hole: { x: -half, y: -half },
      vertices: [{ x: -half, y: -half }, { x: half, y: -half }, { x: -half, y: -half * 2 }]
    },
    right: {
      normal: { x: 1, y: 0 },
      tangent: { x: 0, y: 1 },
      portal: { x: half, y: -half },
      hole: { x: half, y: -half },
      vertices: [{ x: half, y: -half }, { x: half, y: half }, { x: half * 2, y: -half }]
    },
    bottom: {
      normal: { x: 0, y: 1 },
      tangent: { x: -1, y: 0 },
      portal: { x: half, y: half },
      hole: { x: half, y: half },
      vertices: [{ x: half, y: half }, { x: -half, y: half }, { x: half, y: half * 2 }]
    },
    left: {
      normal: { x: -1, y: 0 },
      tangent: { x: 0, y: -1 },
      portal: { x: -half, y: half },
      hole: { x: -half, y: half },
      vertices: [{ x: -half, y: half }, { x: -half, y: -half }, { x: -half * 2, y: half }]
    }
  };
  const zone = definitions[id] || definitions.top;
  const outerWallU = getSecretRoomOuterWallU();
  const localPolygon = getSecretRoomLocalPolygon(outerWallU);
  const displayVertices = localPolygon.map((point) => secretRoomLocalPointInZone(zone, point.u, point.v));
  return {
    id,
    ...zone,
    outerWallU,
    localPolygon,
    displayVertices,
    screenVertices: displayVertices.map((point) => toScreen(point.x, point.y)),
    screenHole: toScreen(zone.hole.x, zone.hole.y),
    screenPortal: toScreen(zone.portal.x, zone.portal.y)
  };
}

function tracePolygon(points) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

function traceRoundedPolygon(points, radius = 0) {
  if (!radius || points.length < 3) {
    tracePolygon(points);
    return;
  }

  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y);
    const nextLength = Math.hypot(next.x - point.x, next.y - point.y);
    const offset = Math.min(radius, previousLength * 0.2, nextLength * 0.2);
    return {
      point,
      entry: {
        x: point.x + ((previous.x - point.x) / previousLength) * offset,
        y: point.y + ((previous.y - point.y) / previousLength) * offset
      },
      exit: {
        x: point.x + ((next.x - point.x) / nextLength) * offset,
        y: point.y + ((next.y - point.y) / nextLength) * offset
      }
    };
  });

  ctx.beginPath();
  ctx.moveTo(corners[0].exit.x, corners[0].exit.y);
  for (let index = 1; index <= corners.length; index += 1) {
    const corner = corners[index % corners.length];
    ctx.lineTo(corner.entry.x, corner.entry.y);
    ctx.quadraticCurveTo(
      corner.point.x,
      corner.point.y,
      corner.exit.x,
      corner.exit.y
    );
  }
  ctx.closePath();
}

function getPurpleNeonPerformanceScale() {
  const renderedPixels = state.field.width * state.field.height * Math.max(1, state.field.ratio) ** 2;
  if (renderedPixels >= PURPLE_NEON_RENDERED_PIXEL_HARD_LIMIT) return 0.48;
  if (renderedPixels >= PURPLE_NEON_RENDERED_PIXEL_SOFT_LIMIT) return 0.58;
  return 0.68;
}

function drawPurpleNeonPolygonStroke(points, baseWidth = 9, cornerRadius = 0) {
  const neonScale = getPurpleNeonPerformanceScale();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  [
    { width: baseWidth + 10, blur: 12, alpha: 0.11 },
    { width: baseWidth + 3, blur: 5, alpha: 0.22 }
  ].forEach((layer) => {
    traceRoundedPolygon(points, cornerRadius);
    ctx.strokeStyle = `rgba(204, 124, 255, ${layer.alpha * neonScale})`;
    ctx.lineWidth = layer.width;
    ctx.shadowColor = `rgba(202, 104, 255, ${0.62 * neonScale})`;
    ctx.shadowBlur = Math.max(2, layer.blur * neonScale);
    ctx.stroke();
  });
  ctx.restore();
}

function drawPurpleNeonPocketGlow(point, radius) {
  const neonScale = getPurpleNeonPerformanceScale();
  const glow = ctx.createRadialGradient(
    point.x,
    point.y,
    radius * 0.72,
    point.x,
    point.y,
    radius * 1.95
  );
  glow.addColorStop(0, `rgba(226, 172, 255, ${0.055 * neonScale})`);
  glow.addColorStop(0.42, `rgba(202, 104, 255, ${0.075 * neonScale})`);
  glow.addColorStop(0.75, `rgba(166, 72, 226, ${0.035 * neonScale})`);
  glow.addColorStop(1, "rgba(130, 46, 200, 0)");

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.restore();
}

function drawStyledMultiplierText(context, method, text, x, y) {
  if (window.BalloroMultiplierStyle) window.BalloroMultiplierStyle.draw(context, method, text, x, y);
  else context[method](text, x, y);
}

function drawPurpleNeonMultiplierText(text, x, y, color) {
  if (window.BalloroBonusUI?.isV4) {
    ctx.save();
    ctx.fillStyle = color;
    drawStyledMultiplierText(ctx, "fillText", text, x, y);
    ctx.restore();
    return;
  }
  const neonScale = getPurpleNeonPerformanceScale();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.shadowColor = `rgba(202, 104, 255, ${0.46 * neonScale})`;
  ctx.shadowBlur = Math.max(2, 7 * neonScale);
  ctx.lineWidth = 4;
  ctx.strokeStyle = `rgba(187, 91, 255, ${0.18 * neonScale})`;
  drawStyledMultiplierText(ctx, "strokeText", text, x, y);
  ctx.shadowColor = `rgba(202, 104, 255, ${0.42 * neonScale})`;
  ctx.shadowBlur = Math.max(2, 5 * neonScale);
  ctx.fillStyle = color;
  drawStyledMultiplierText(ctx, "fillText", text, x, y);
  ctx.restore();
}

function secretRoomLocalPoint(zone, u, v) {
  const { half } = state.field;
  return {
    x: zone.portal.x + zone.normal.x * u * half + zone.tangent.x * v * half,
    y: zone.portal.y + zone.normal.y * u * half + zone.tangent.y * v * half
  };
}

function createFieldBorderGradient(corners, bonusGridActive) {
  const gradient = ctx.createLinearGradient(corners[3].x, corners[3].y, corners[1].x, corners[1].y);
  const redWin = !bonusGridActive && isMainRedBigWinWallActive();
  gradient.addColorStop(0, bonusGridActive ? "#4c2a61" : redWin ? "#90232b" : "#096a3a");
  gradient.addColorStop(0.5, bonusGridActive ? "#8454ae" : redWin ? "#ff4b4b" : "#20b36c");
  gradient.addColorStop(1, bonusGridActive ? "#5d3774" : redWin ? "#a92b32" : "#0b7b44");
  return gradient;
}

function getFieldCornerRadius() {
  // Visual-only rounding; collision coordinates and trajectory targets stay unchanged.
  return Math.min(10, Math.max(4, state.field.grid * 0.16));
}

function getSecretRoomMultiplierCells(multiPlusActive = false) {
  const config = getMathConfiguration();
  if (config?.secret_room) {
    return multiPlusActive
      ? config.secret_room.multi_plus_multiplier_cells
      : config.secret_room.multiplier_cells;
  }
  return [{ u0: 0.4, u1: 0.8, v0: -0.2, v1: 0.2, u: 0.6, v: 0, key: "fallback" }];
}

function drawSecretMultiplierCell(zone, bonusGridActive) {
  const cells = getSecretRoomMultiplierCells(isMultiPlusVisualActive());
  const multiplier = getSecretRoomMultiplier();
  const baseMultiplier = getSecretRoomBaseMultiplier();
  const displayedMultiplier = multiplier;
  const multiplierColor = getBonusMultiplierColor(baseMultiplier);

  const label = getFieldMultiplierText(displayedMultiplier, "center");
  cells.forEach((cell) => {
    const center = secretRoomLocalPoint(zone, cell.u, cell.v);
    const screenCenter = toScreen(center.x, center.y);
    const fontSize = Math.max(11, Math.min(34, state.field.grid * 0.38));
    ctx.fillStyle = multiplierColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
    drawPurpleNeonMultiplierText(label, screenCenter.x, screenCenter.y, multiplierColor);
  });
}

function getSecretRoomCellAtPoint(zone, x, y) {
  const { half } = state.field;
  const dx = x - zone.portal.x;
  const dy = y - zone.portal.y;
  const u = (dx * zone.normal.x + dy * zone.normal.y) / half;
  const v = (dx * zone.tangent.x + dy * zone.tangent.y) / half;
  const size = 2 / GRID_SIZE;
  const uIndex = clamp(Math.floor(u / size), 0, Math.ceil(1 / size) - 1);
  const vIndex = clamp(Math.floor((v + 1) / size), 0, GRID_SIZE - 1);
  return {
    u0: uIndex * size,
    u1: (uIndex + 1) * size,
    v0: -1 + vIndex * size,
    v1: -1 + (vIndex + 1) * size
  };
}

function drawSecretRoomCell(zone, cell, fill, stroke) {
  const points = [
    secretRoomLocalPoint(zone, cell.u0, cell.v0),
    secretRoomLocalPoint(zone, cell.u1, cell.v0),
    secretRoomLocalPoint(zone, cell.u1, cell.v1),
    secretRoomLocalPoint(zone, cell.u0, cell.v1)
  ].map((point) => toScreen(point.x, point.y));
  tracePolygon(points);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSecretRoomPuckCells(zone) {
  state.pucks.forEach((puck) => {
    if (puck.secretRoom?.zoneId !== zone.id) return;
    const isMoving = puck.secretRoom.phase === "inside" && !puck.stopped;
    const isWinning = puck.secretRoom.phase === "settled" && (puck.result?.multiplier || 0) > 0;
    if (!isMoving && !isWinning) return;
    const cell = getSecretRoomCellAtPoint(zone, puck.x, puck.y);
    if (isWinning) {
      drawSecretRoomCell(zone, cell, "rgba(255, 213, 77, 0.74)", "rgba(255, 213, 77, 0.98)");
      drawSecretRoomCell(zone, cell, "rgba(255, 245, 166, 0.24)", "rgba(255, 245, 166, 0.92)");
    } else {
      drawSecretRoomCell(zone, cell, "rgba(117, 217, 255, 0.26)", "rgba(117, 217, 255, 0.54)");
    }
  });
}

function drawSecretRoom(zone, bonusGridActive, innerGridColor, borderGradient) {
  if (!state.openSecretZones.has(zone.id)) return;
  const openedAt = state.secretZoneOpenTimes[zone.id] || 0;
  const reveal = clamp(((window.BalloroGameLifecycle?.now() ?? performance.now()) - openedAt) / 420, 0, 1);

  ctx.save();
  ctx.globalAlpha = 0.12 + reveal * 0.88;
  tracePolygon(zone.screenVertices);
  ctx.fillStyle = bonusGridActive ? "#14091b" : "#05070c";
  ctx.fill();
  ctx.clip();

  ctx.beginPath();
  const roomCellSize = 2 / GRID_SIZE;
  for (let u = 0; u <= 1 + 1e-9; u += roomCellSize) {
    const start = secretRoomLocalPoint(zone, u, -1);
    const end = secretRoomLocalPoint(zone, u, 1);
    const screenStart = toScreen(start.x, start.y);
    const screenEnd = toScreen(end.x, end.y);
    ctx.moveTo(screenStart.x, screenStart.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
  }
  for (let v = -1; v <= 1 + 1e-9; v += roomCellSize) {
    const start = secretRoomLocalPoint(zone, 0, v);
    const end = secretRoomLocalPoint(zone, 1, v);
    const screenStart = toScreen(start.x, start.y);
    const screenEnd = toScreen(end.x, end.y);
    ctx.moveTo(screenStart.x, screenStart.y);
    ctx.lineTo(screenEnd.x, screenEnd.y);
  }
  ctx.strokeStyle = innerGridColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  drawSecretRoomPuckCells(zone);
  ctx.restore();

  if (bonusGridActive) {
    drawPurpleNeonPolygonStroke(zone.screenVertices, 10);
  }
  tracePolygon(zone.screenVertices);
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 9;
  ctx.lineJoin = "round";
  ctx.stroke();
  drawSecretMultiplierCell(zone, bonusGridActive);
}

function drawWhiteReadyWaves(point, radius, pulse) {
  const readyGlowRadius = radius * (2.35 + pulse * 0.32);
  const readyGlow = ctx.createRadialGradient(
    point.x,
    point.y,
    radius * 0.18,
    point.x,
    point.y,
    readyGlowRadius
  );
  readyGlow.addColorStop(0, `rgba(255, 255, 255, ${0.48 + pulse * 0.2})`);
  readyGlow.addColorStop(0.34, `rgba(245, 248, 255, ${0.3 + pulse * 0.18})`);
  readyGlow.addColorStop(0.7, `rgba(220, 230, 242, ${0.12 + pulse * 0.1})`);
  readyGlow.addColorStop(1, "rgba(210, 222, 238, 0)");
  ctx.beginPath();
  ctx.arc(point.x, point.y, readyGlowRadius, 0, Math.PI * 2);
  ctx.fillStyle = readyGlow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.45 + pulse * 0.18), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.48 + pulse * 0.42})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBlueReadyWaves(point, radius, pulse) {
  const readyGlowRadius = radius * (2.35 + pulse * 0.32);
  const readyGlow = ctx.createRadialGradient(
    point.x,
    point.y,
    radius * 0.18,
    point.x,
    point.y,
    readyGlowRadius
  );
  readyGlow.addColorStop(0, `rgba(190, 240, 255, ${0.48 + pulse * 0.2})`);
  readyGlow.addColorStop(0.34, `rgba(117, 217, 255, ${0.3 + pulse * 0.18})`);
  readyGlow.addColorStop(0.7, `rgba(70, 177, 230, ${0.12 + pulse * 0.1})`);
  readyGlow.addColorStop(1, "rgba(50, 150, 215, 0)");
  ctx.beginPath();
  ctx.arc(point.x, point.y, readyGlowRadius, 0, Math.PI * 2);
  ctx.fillStyle = readyGlow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.45 + pulse * 0.18), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(117, 217, 255, ${0.48 + pulse * 0.42})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawGreenReadyWaves(point, radius, pulse) {
  const outer = radius * (2.35 + pulse * .32);
  const glow = ctx.createRadialGradient(point.x, point.y, radius * .18, point.x, point.y, outer);
  glow.addColorStop(0, `rgba(197, 255, 196, ${.48 + pulse * .2})`);
  glow.addColorStop(.34, `rgba(55, 234, 78, ${.3 + pulse * .18})`);
  glow.addColorStop(.7, `rgba(25, 177, 55, ${.12 + pulse * .1})`);
  glow.addColorStop(1, "rgba(20, 150, 45, 0)");
  ctx.beginPath(); ctx.arc(point.x, point.y, outer, 0, Math.PI * 2);
  ctx.fillStyle = glow; ctx.fill();
  ctx.beginPath(); ctx.arc(point.x, point.y, radius * (1.45 + pulse * .18), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(55, 234, 78, ${.48 + pulse * .42})`;
  ctx.lineWidth = 2; ctx.stroke();
}

function drawRedReadyWaves(point, radius, pulse) {
  const readyGlowRadius = radius * (2.35 + pulse * 0.32);
  const readyGlow = ctx.createRadialGradient(
    point.x, point.y, radius * 0.18, point.x, point.y, readyGlowRadius
  );
  readyGlow.addColorStop(0, `rgba(255, 190, 194, ${0.48 + pulse * 0.2})`);
  readyGlow.addColorStop(0.34, `rgba(255, 74, 82, ${0.3 + pulse * 0.18})`);
  readyGlow.addColorStop(0.7, `rgba(230, 42, 52, ${0.12 + pulse * 0.1})`);
  readyGlow.addColorStop(1, "rgba(215, 35, 45, 0)");
  ctx.beginPath();
  ctx.arc(point.x, point.y, readyGlowRadius, 0, Math.PI * 2);
  ctx.fillStyle = readyGlow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.45 + pulse * 0.18), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 74, 82, ${0.48 + pulse * 0.42})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawYellowReadyWaves(point, radius, pulse) {
  const readyGlowRadius = radius * (2.35 + pulse * 0.32);
  const readyGlow = ctx.createRadialGradient(
    point.x, point.y, radius * 0.18, point.x, point.y, readyGlowRadius
  );
  readyGlow.addColorStop(0, `rgba(255, 248, 190, ${0.48 + pulse * 0.2})`);
  readyGlow.addColorStop(0.34, `rgba(255, 213, 61, ${0.3 + pulse * 0.18})`);
  readyGlow.addColorStop(0.7, `rgba(230, 175, 30, ${0.12 + pulse * 0.1})`);
  readyGlow.addColorStop(1, "rgba(215, 155, 20, 0)");
  ctx.beginPath();
  ctx.arc(point.x, point.y, readyGlowRadius, 0, Math.PI * 2);
  ctx.fillStyle = readyGlow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.45 + pulse * 0.18), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 213, 61, ${0.48 + pulse * 0.42})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPurpleReadyWaves(point, radius, pulse) {
  const glowRadius = radius * (2.45 + pulse * 0.42);
  const glow = ctx.createRadialGradient(point.x, point.y, radius * 0.18, point.x, point.y, glowRadius);
  glow.addColorStop(0, `rgba(239, 202, 255, ${0.5 + pulse * 0.24})`);
  glow.addColorStop(0.34, `rgba(202, 104, 255, ${0.32 + pulse * 0.2})`);
  glow.addColorStop(0.7, `rgba(136, 52, 212, ${0.14 + pulse * 0.12})`);
  glow.addColorStop(1, "rgba(120, 35, 190, 0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.52 + pulse * 0.2), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(226, 172, 255, ${0.58 + pulse * 0.34})`;
  ctx.lineWidth = Math.max(1.8, radius * 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawSecretPocketVortex(point, radius) {
  const time = (window.BalloroGameLifecycle?.now() ?? performance.now()) * 0.0012;
  const segments = 14;
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 0.86, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(point.x, point.y);
  ctx.rotate(time);
  for (let index = 0; index < segments; index += 1) {
    const start = (index / segments) * Math.PI * 2;
    const end = ((index + 1.15) / segments) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.88, start, end);
    ctx.closePath();
    ctx.fillStyle = index % 2 === 0
      ? "rgba(145, 63, 214, 0.82)"
      : "rgba(1, 2, 8, 0.96)";
    ctx.fill();
  }
  ctx.rotate(-time * 1.65);
  ctx.lineCap = "round";
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.beginPath();
    const spiralRadius = radius * (0.28 + ring * 0.18);
    ctx.arc(0, 0, spiralRadius, time + ring * 1.8, time + ring * 1.8 + Math.PI * 1.15);
    ctx.strokeStyle = `rgba(220, 160, 255, ${0.28 - ring * 0.05})`;
    ctx.lineWidth = Math.max(1.2, radius * 0.055);
    ctx.stroke();
  }
  const core = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 0.52);
  core.addColorStop(0, "rgba(0, 0, 0, 0.95)");
  core.addColorStop(0.46, "rgba(40, 10, 61, 0.62)");
  core.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPulsingFieldPocketSurface(point, radius, collectibleBubble, palette, strokeColor, outerGlowColor) {
  const hole = ctx.createRadialGradient(
    point.x - radius * 0.24, point.y - radius * 0.28, radius * 0.08,
    point.x, point.y, radius
  );
  hole.addColorStop(0, "#090b10");
  hole.addColorStop(0.48, "#010205");
  hole.addColorStop(1, "#000000");
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = hole;
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = radius * 0.45;
  ctx.fill();
  ctx.shadowBlur = 0;

  const pulse = clamp((collectibleBubble.glowAlpha - 0.9) / 0.52, 0, 1);
  const glowAlpha = (0.26 + pulse * 0.19) * 0.8;
  const glowBandInnerRadius = Math.max(0, radius * 0.98 - 8 * 1.2);
  const innerGlow = ctx.createRadialGradient(
    point.x, point.y, glowBandInnerRadius, point.x, point.y, radius * 0.98
  );
  innerGlow.addColorStop(0, palette.transparent);
  innerGlow.addColorStop(0.35, palette.alpha(glowAlpha * 0.1));
  innerGlow.addColorStop(0.65, palette.alpha(glowAlpha * 0.52));
  innerGlow.addColorStop(0.84, palette.alpha(glowAlpha * 0.78));
  innerGlow.addColorStop(1, palette.highlight(glowAlpha));
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 0.965, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 0.965, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 0.67, 0, Math.PI * 2);
  ctx.lineWidth = Math.min(8, radius * (0.4 + pulse * 0.1) * 1.2);
  ctx.strokeStyle = palette.alpha(glowAlpha * 0.7);
  ctx.shadowColor = palette.alpha((0.41 + pulse * 0.08) * 0.8);
  ctx.shadowBlur = Math.min(8, radius * (0.62 + pulse * 0.28) * 1.2);
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 4;
  ctx.shadowColor = outerGlowColor;
  ctx.shadowBlur = Math.max(4, radius * 0.34);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

const BLUE_FIELD_POCKET_PALETTE = Object.freeze({
  transparent: "rgba(117, 217, 255, 0)",
  alpha: (alpha) => `rgba(117, 217, 255, ${alpha})`,
  highlight: (alpha) => `rgba(205, 245, 255, ${alpha})`
});
const GREEN_FIELD_POCKET_PALETTE = Object.freeze({
  transparent: "rgba(41, 236, 73, 0)",
  alpha: (alpha) => `rgba(41, 236, 73, ${alpha})`,
  highlight: (alpha) => `rgba(184, 255, 186, ${alpha})`
});
const RED_FIELD_POCKET_PALETTE = Object.freeze({
  transparent: "rgba(255, 74, 82, 0)",
  alpha: (alpha) => `rgba(255, 74, 82, ${alpha})`,
  highlight: (alpha) => `rgba(255, 205, 208, ${alpha})`
});
const YELLOW_FIELD_POCKET_PALETTE = Object.freeze({
  transparent: "rgba(255, 213, 61, 0)",
  alpha: (alpha) => `rgba(255, 213, 61, ${alpha})`,
  highlight: (alpha) => `rgba(255, 246, 190, ${alpha})`
});
const PURPLE_FIELD_POCKET_PALETTE = Object.freeze({
  transparent: "rgba(202, 104, 255, 0)",
  alpha: (alpha) => `rgba(202, 104, 255, ${alpha})`,
  highlight: (alpha) => `rgba(244, 213, 255, ${alpha})`
});

function getV2PocketVisual(kind) {
  if (kind === "diamond") return { palette: PURPLE_FIELD_POCKET_PALETTE,
    stroke: "rgba(202, 104, 255, 0.98)", glow: "rgba(202, 104, 255, 0.29)",
    waves: drawPurpleReadyWaves };
  if (kind === "crown") return { palette: RED_FIELD_POCKET_PALETTE,
    stroke: "rgb(255, 74, 82)", glow: "rgba(255, 48, 58, 0.29)",
    waves: drawRedReadyWaves };
  if (kind === "lemon") return { palette: YELLOW_FIELD_POCKET_PALETTE,
    stroke: "rgb(255, 213, 61)", glow: "rgba(255, 213, 61, 0.29)",
    waves: drawYellowReadyWaves };
  return { palette: GREEN_FIELD_POCKET_PALETTE, stroke: "rgb(55, 234, 78)",
    glow: "rgba(55, 234, 78, 0.29)", waves: drawGreenReadyWaves };
}

const v2PocketSymbolImages = Object.fromEntries(Object.entries({
  lemon: "assets/duckies-star.svg?v=20261004-symmetric",
  crown: "assets/duckies-fire.png",
  blue: "assets/duckies-cactus.svg"
}).map(([kind, src]) => {
  const icon = new Image();
  icon.src = src;
  icon.addEventListener("load", () => render());
  return [kind, icon];
}));
const v2GlintCanvas = document.createElement("canvas");
v2GlintCanvas.width = 64;
v2GlintCanvas.height = 64;
const V2_POCKET_SYMBOL_GLINT_INTERVAL_MS = 3800;

function getV2PocketSymbolDrawBounds(kind, size) {
  const drawSize = kind === "crown" ? size * 1.055 : size;
  return {
    x: -drawSize + (kind === "crown" ? drawSize * 0.16 : 0),
    y: -drawSize - (kind === "crown" ? drawSize * 0.05 : 0),
    width: drawSize * 2,
    height: drawSize * 2
  };
}

function drawV2PocketSymbolGlint(kind, point, size) {
  // One shared phase makes every pocket symbol sparkle together, without
  // scanning the whole field or keeping a per-symbol animation timer.
  const sweepTime = (window.BalloroGameLifecycle?.now() ?? performance.now()) % V2_POCKET_SYMBOL_GLINT_INTERVAL_MS;
  if (sweepTime >= 650) return;
  const mask = v2GlintCanvas.getContext("2d");
  mask.clearRect(0, 0, 64, 64);
  const image = v2PocketSymbolImages[kind];
  if (image?.complete && image.naturalWidth) mask.drawImage(image, 0, 0, 64, 64);
  else if (kind === "diamond") {
    mask.fillStyle = "#fff";
    mask.beginPath();
    mask.moveTo(32 - 32 * .92, 32 - 32 * .28);
    mask.lineTo(32 - 32 * .48, 32 - 32 * .74);
    mask.lineTo(32 + 32 * .48, 32 - 32 * .74);
    mask.lineTo(32 + 32 * .92, 32 - 32 * .28);
    mask.lineTo(32, 32 + 32 * .86);
    mask.closePath(); mask.fill();
  } else return;
  // Keep only the moving light strip inside the silhouette. source-atop left
  // the opaque white diamond mask visible for the whole glint interval.
  mask.globalCompositeOperation = "source-in";
  const center = -18 + sweepTime / 650 * 100;
  const shine = mask.createLinearGradient(center - 12, 0, center + 12, 0);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(.5, "rgba(255,255,255,.82)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  mask.fillStyle = shine;
  mask.fillRect(0, 0, 64, 64);
  mask.globalCompositeOperation = "source-over";
  // Match the base icon's exact draw bounds; a smaller glint mask made the
  // symbol appear to jump and the off-centre fire appear to change size.
  const bounds = getV2PocketSymbolDrawBounds(kind, size);
  ctx.drawImage(v2GlintCanvas, point.x + bounds.x, point.y + bounds.y,
    bounds.width, bounds.height);
}

function drawV2PocketSymbol(kind, point, radius, bubble, glint = true) {
  if (!window.BalloroBonusUI?.isV2) return;
  const size = radius * 0.91 * bubble.scale;
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.shadowBlur = radius * (0.32 + bubble.glowAlpha * 0.3);
  ctx.lineJoin = "round";
  if (kind === "diamond") {
    ctx.shadowColor = "#ce79ff";
    drawDiamondPath(0, 0, size);
    ctx.fillStyle = "#d8a4ff";
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, radius * 0.1);
    ctx.strokeStyle = "#9439d0";
    ctx.stroke();
    drawDiamondFacets(0, 0, size, "rgba(255, 236, 255, .9)");
  } else {
    const image = v2PocketSymbolImages[kind];
    if (image?.complete && image.naturalWidth) {
      ctx.shadowColor = kind === "blue" ? "#27ed4b" : kind === "lemon" ? "#ffdb36" : "#ff4a39";
      // Align the fire's transparent bitmap with the other pocket symbols and
      // keep its lower tip inside the rim.
      const bounds = getV2PocketSymbolDrawBounds(kind, size);
      ctx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }
  ctx.restore();
  if (glint) drawV2PocketSymbolGlint(kind, point, size);
}

function getV4PocketSymbolReturnScale(kind, visible, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!window.BalloroBonusUI?.isV4) return visible ? 1 : 0;
  state.v4PocketSymbolAppearance ||= {};
  const item = state.v4PocketSymbolAppearance[kind] ||= { visible, appearedAt: null };
  if (visible && !item.visible) item.appearedAt = now;
  item.visible = visible;
  if (!visible) return 0;
  if (!state.animationsEnabled) return 1;
  if (item.appearedAt === null) return 1; // No entrance effect on initial load.
  const progress = clamp((now - item.appearedAt) / 170, 0, 1);
  return 1 - Math.pow(1 - progress, 3);
}

function drawV4ReturningPocketSymbol(kind, point, radius, bubble, visible) {
  const scale = getV4PocketSymbolReturnScale(kind, visible);
  if (scale > 0) drawV2PocketSymbol(kind, point, radius, { ...bubble, scale: bubble.scale * scale });
}

function getV4PocketIdleScale(kind, bubble, occupied) {
  if (!window.BalloroBonusUI?.isV4 || occupied || state.v3PocketSymbolCycle[kind]) return 1;
  return bubble?.scale ?? 1;
}

function applyV4MultiplierBounce(center, enabled) {
  if (!window.BalloroBonusUI?.isV4 || !enabled) return;
  const scale = getCollectibleIdleBubble(7.4).scale;
  ctx.translate(center.x, center.y);
  ctx.scale(scale, scale);
  ctx.translate(-center.x, -center.y);
}

function hasV4MainMultiplierTopSymbol(col, row, displayedMultiplier) {
  if (!window.BalloroBonusUI?.isV4) return false;
  const rules = window.BalloroV4Rules;
  return rules.hasMultiplierTopSymbol?.(GRID_SIZE, col, row, displayedMultiplier)
    ?? rules.hasMultiplierFire(GRID_SIZE, col, row);
}

function drawSecretPocket(zone, pocketStrokeColor, bonusGridActive = false, outerGlowColor = null,
  pulseInnerEdge = false) {
  const pocket = zone.id === BLUE_FIELD_POCKET_ZONE_ID ? state.bluePocket : state.fieldPocket;
  if (usesFieldPocketMechanics() && pocket?.finished && !window.BalloroBonusUI?.isV3) return;
  const { puckRadius } = state.field;
  const point = zone.screenHole;
  const pulseSeed = 4.8 + zone.hole.x * 0.007 + zone.hole.y * 0.011;
  const collectibleBubble = pulseInnerEdge ? getCollectibleIdleBubble(pulseSeed) : null;
  const v2Visual = window.BalloroBonusUI?.isV2 && usesFieldPocketMechanics()
    ? getV2PocketVisual(zone.id === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond") : null;
  const symbolKind = zone.id === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond";
  const isPreparing = state.pucks.some((puck) => puck.secretRoom?.zoneId === zone.id
    && ["capturing", "pocket_wait"].includes(puck.secretRoom.phase));
  const radius = Math.max(6, puckRadius);
  const pocketScale = getV4PocketIdleScale(symbolKind, collectibleBubble, isPreparing || pocket?.consumed);
  const activePocketStrokeColor = v2Visual?.stroke || (isPreparing
    ? usesFieldPocketMechanics()
      ? "rgba(117, 217, 255, 0.98)"
      : "rgba(255, 255, 255, 0.98)"
    : bonusGridActive
      ? "rgba(202, 104, 255, 0.98)"
      : pocketStrokeColor);

  ctx.save();
  if (isPreparing) {
    if (usesFieldPocketMechanics()) {
      const pulse = 0.5 + Math.sin((window.BalloroGameLifecycle?.now() ?? performance.now()) / BLUE_POCKET_WAVE_TIME_SCALE_MS) * 0.5;
      if (v2Visual) v2Visual.waves(point, radius, pulse);
      else drawBlueReadyWaves(point, radius, pulse);
    } else {
      const pulse = 0.5 + Math.sin((window.BalloroGameLifecycle?.now() ?? performance.now()) / 145) * 0.5;
      drawWhiteReadyWaves(point, radius, pulse);
    }
  } else if (bonusGridActive && !v2Visual) {
    drawPurpleNeonPocketGlow(point, radius);
  }
  if (pulseInnerEdge) {
    drawPulsingFieldPocketSurface(point, radius * pocketScale, collectibleBubble,
      v2Visual?.palette || BLUE_FIELD_POCKET_PALETTE,
      activePocketStrokeColor, v2Visual?.glow || outerGlowColor || "rgba(117, 217, 255, 0.29)");
    drawV4ReturningPocketSymbol(symbolKind, point, radius, collectibleBubble,
      !pocket?.consumed && !state.v3PocketSymbolCycle[symbolKind]
      && !state.counterFlyIns.some((flyIn) => flyIn.kind === symbolKind));
  } else {
    const hole = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    hole.addColorStop(0, "#090b10");
    hole.addColorStop(1, "#000000");
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hole;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = activePocketStrokeColor;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSecretPocketRimsOverlay() {
  if (usesFieldPocketMechanics() && state.fieldPocket?.finished && !window.BalloroBonusUI?.isV3) return;
  const bonusGridActive = isX10VisualActive();
  const radius = Math.max(6, state.field.puckRadius);
  SECRET_ZONE_IDS.map(getSecretZoneGeometry).forEach((zone) => {
    const isPreparing = state.pucks.some((puck) => puck.secretRoom?.zoneId === zone.id
      && puck.secretRoom.phase === "pocket_wait");
    ctx.save();
    ctx.beginPath();
    ctx.arc(zone.screenHole.x, zone.screenHole.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isPreparing
      ? usesFieldPocketMechanics()
        ? window.BalloroBonusUI?.isV2
          ? zone.id === BLUE_FIELD_POCKET_ZONE_ID
            ? "rgba(55, 234, 78, 0.98)" : "rgba(202, 104, 255, 0.98)"
          : "rgba(117, 217, 255, 0.98)"
        : "rgba(255, 255, 255, 0.98)"
      : bonusGridActive
        ? "rgba(202, 104, 255, 0.98)"
        : "rgba(27, 184, 102, 0.62)";
    ctx.lineWidth = 4;
    if (bonusGridActive && !isPreparing) {
      ctx.shadowColor = "rgba(202, 104, 255, 0.7)";
      ctx.shadowBlur = Math.max(3, radius * 0.35);
    }
    ctx.stroke();
    ctx.restore();
  });
}

function drawSecretRooms(bonusGridActive, innerGridColor, borderGradient) {
  const zones = SECRET_ZONE_IDS.map(getSecretZoneGeometry);
  zones.forEach((zone) => drawSecretRoom(zone, bonusGridActive, innerGridColor, borderGradient));
  return zones;
}

function getChanceRoomGridSize() {
  return Math.max(2, Math.round(GRID_SIZE * 0.4));
}

function traceChanceRoomVisibleBorder(room) {
  tracePolygon(room.vertices);
}

function drawPurpleNeonChanceRoomStroke(room, baseWidth) {
  if (!window.BalloroBonusUI?.isV2) {
    drawPurpleNeonPolygonStroke(room.vertices, baseWidth);
    return;
  }
  const neonScale = getPurpleNeonPerformanceScale();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  [
    { width: baseWidth + 10, blur: 12, alpha: 0.11 },
    { width: baseWidth + 3, blur: 5, alpha: 0.22 }
  ].forEach((layer) => {
    traceChanceRoomVisibleBorder(room);
    ctx.strokeStyle = `rgba(204, 124, 255, ${layer.alpha * neonScale})`;
    ctx.lineWidth = layer.width;
    ctx.shadowColor = `rgba(202, 104, 255, ${0.62 * neonScale})`;
    ctx.shadowBlur = Math.max(2, layer.blur * neonScale);
    ctx.stroke();
  });
  ctx.restore();
}

function getChanceRoomGeometry(id) {
  const mainRadius = state.field.half * Math.SQRT2;
  const halfDiagonal = mainRadius * 0.4;
  const sharedCornerLayout = window.BalloroBonusUI?.isV2;
  const centerDistance = mainRadius + halfDiagonal + CHANCE_ROOM_GAP_PX;
  const horizontalOffset = sharedCornerLayout ? halfDiagonal : centerDistance * CHANCE_ROOM_CORNER_X_SHARE;
  const verticalOffset = sharedCornerLayout
    ? mainRadius + CHANCE_ROOM_V2_WALL_OFFSET_PX
    : centerDistance * CHANCE_ROOM_CORNER_Y_SHARE;
  const positions = {
    "top-left": [-horizontalOffset, -verticalOffset],
    "top-right": [horizontalOffset, -verticalOffset],
    "bottom-right": [horizontalOffset, verticalOffset],
    "bottom-left": [-horizontalOffset, verticalOffset]
  };
  const [offsetX, offsetY] = positions[id] || positions["top-left"];
  const center = {
    x: clamp(state.field.cx + offsetX,
      CHANCE_ROOM_VIEWPORT_MARGIN_PX + halfDiagonal,
      state.field.width - CHANCE_ROOM_VIEWPORT_MARGIN_PX - halfDiagonal),
    y: clamp(state.field.cy + offsetY,
      CHANCE_ROOM_VIEWPORT_MARGIN_PX + halfDiagonal,
      state.field.height - CHANCE_ROOM_VIEWPORT_MARGIN_PX - halfDiagonal)
  };
  const halfSide = halfDiagonal / Math.SQRT2;
  return {
    id,
    center,
    halfDiagonal,
    halfSide,
    vertices: [
      { x: center.x, y: center.y - halfDiagonal },
      { x: center.x + halfDiagonal, y: center.y },
      { x: center.x, y: center.y + halfDiagonal },
      { x: center.x - halfDiagonal, y: center.y }
    ]
  };
}

function getChanceRoomEntryLocal(id, inset = 1) {
  if (!window.BalloroBonusUI?.isV2) return { u: inset, v: inset };
  return id === "bottom-left"
    ? { u: inset, v: -inset }
    : { u: -inset, v: inset };
}

function mapLegacyChanceFrameToV2(id, frame) {
  if (!window.BalloroBonusUI?.isV2 || !Array.isArray(frame)) return frame;
  const [u, v, vu, vv, ...rest] = frame;
  return id === "bottom-left"
    ? [u, -v, vu, -vv, ...rest]
    : [-u, v, -vu, vv, ...rest];
}

function chanceRoomLocalToScreen(room, u, v) {
  return {
    x: room.center.x + (u - v) * room.halfSide / Math.SQRT2,
    y: room.center.y + (u + v) * room.halfSide / Math.SQRT2
  };
}

function getChancePresentationFrame(puck) {
  if (window.BalloroBonusUI?.isV2 && !puck.chance.v2SharedEntryCoordinates) {
    return mapLegacyChanceFrameToV2(puck.chance.roomId,
      [puck.chance.u, puck.chance.v, puck.chance.vu || 0, puck.chance.vv || 0]);
  }
  return [puck.chance.u, puck.chance.v, puck.chance.vu || 0, puck.chance.vv || 0];
}

function getChancePuckScreenPoint(puck) {
  const room = getChanceRoomGeometry(puck.chance.roomId);
  const frame = getChancePresentationFrame(puck);
  return chanceRoomLocalToScreen(room, frame[0], frame[1]);
}

function getChanceRoomMultiplier(id) {
  if (window.BalloroBonusUI?.isV3) {
    return window.BalloroV3Rules.roomMultipliers[GRID_SIZE]?.[id] || 0;
  }
  return state.chanceRoomMultipliers[id] || getRiskBands().outer;
}

function getChancePreviewBlink(now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  // Readiness blinking belongs to the ball in the red pocket, not the SC preview.
  if (window.BalloroBonusUI?.isV4) return { alpha: 1, ready: false };
  return { alpha: getPocketReadyPuckAlpha({ pocketReadyPreview: true }, now), ready: false };
}

function drawChanceRoomPreviewPuck(point) {
  const radius = state.field.puckRadius;
  ctx.save();
  ctx.save();
  ctx.globalAlpha *= getChancePreviewBlink().alpha;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(
    point.x - radius * 0.34,
    point.y - radius * 0.38,
    radius * 0.08,
    point.x + radius * 0.12,
    point.y + radius * 0.18,
    radius * 1.08
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.3, "#fafaf6");
  gradient.addColorStop(0.68, "#dfe4de");
  gradient.addColorStop(1, "#929b94");
  ctx.fillStyle = gradient;
  ctx.shadowColor = "rgba(255, 255, 255, 0.48)";
  ctx.shadowBlur = radius * 0.55;
  ctx.fill();
  ctx.lineWidth = Math.max(2, radius * 0.13);
  ctx.strokeStyle = "rgba(22, 25, 25, 0.94)";
  ctx.stroke();
  ctx.restore();
  const waveProgress = ((window.BalloroGameLifecycle?.now() ?? performance.now()) % 700) / 700;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * (1.05 + waveProgress * 0.8), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 74, 82, ${0.85 * (1 - waveProgress)})`;
  ctx.lineWidth = Math.max(2, radius * 0.1);
  ctx.shadowColor = "rgba(255, 74, 82, 0.8)";
  ctx.shadowBlur = radius * 0.6;
  ctx.stroke();
  ctx.restore();
}

function isChanceRoomDimmed(id) {
  // Keep the winning room and its ball bright for a photo hold, without
  // retaining live bonus flags or delaying completion of the pocket queue.
  if (playControls?.pause.active
    && [...playControls.pause.winners].some(puck => puck.result?.chanceRoom && puck.chance?.roomId === id)) return false;
  const selected = state.chancePhase !== "spinning" && state.chanceSelectedRoomId === id;
  const spinning = state.chancePhase === "spinning" && CHANCE_ROOM_IDS[state.chanceSpinRoomIndex] === id;
  const won = state.chanceRoomOutcome?.roomId === id && state.chanceRoomOutcome.won;
  const completed = state.chanceCompletedRoomIds.has(id);
  const active = spinning || selected || won || completed;
  return !active;
}

function getChanceFinalCueStrength(id, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (state.chanceFinalCueRoomId !== id || now >= state.chanceFinalCueUntil) return 0;
  const elapsed = Math.max(0, now - state.chanceFinalCueStartedAt);
  if (elapsed < 150) return 1 - elapsed / 150;
  return 0;
}

function getChanceMultiplierCell(id = "bottom-left", gridSize = getChanceRoomGridSize()) {
  const index = Math.floor((gridSize - 1) / 2);
  let col = index;
  let row = index;
  if (window.BalloroBonusUI?.isV2 && gridSize % 2 === 0) {
    if (id === "bottom-left") row += 1;
    else col += 1;
  }
  return {
    col,
    row,
    u: -1 + (col + 0.5) * 2 / gridSize,
    v: -1 + (row + 0.5) * 2 / gridSize
  };
}

function isChanceMultiplierHit(u, v, id = "bottom-left", gridSize = getChanceRoomGridSize()) {
  const cell = getChanceMultiplierCell(id, gridSize);
  return Math.floor((u + 1) * gridSize / 2) === cell.col
    && Math.floor((v + 1) * gridSize / 2) === cell.row;
}

function drawChanceMultiplierCrown(roomId, center, fontSize, color, bonusGridActive) {
  if (!window.BalloroBonusUI?.isV4 && roomId !== "bottom-right") return;
  if (window.BalloroBonusUI?.isV4 && bonusGridActive) {
    const size = Math.max(18, fontSize * .7);
    drawV2PocketSymbol("diamond", { x: center.x,
      y: center.y - fontSize * .57 - size * .5 }, size / (2 * .91),
      { scale: 1, glowAlpha: 1 }, false);
    return;
  }
  if (window.BalloroBonusUI?.isV2) {
    const icon = v2PocketSymbolImages.crown;
    if (icon.complete && icon.naturalWidth) {
      const size = Math.max(18, fontSize * .7);
      const bottomY = center.y - fontSize * (window.BalloroBonusUI?.isV4 ? .49 : .57);
      ctx.save();
      ctx.shadowColor = bonusGridActive ? "#c36aff" : "#ff4b37";
      ctx.shadowBlur = size * .35;
      if (bonusGridActive) ctx.filter = "hue-rotate(240deg)";
      ctx.drawImage(icon, center.x - size * .5,
        bottomY - size, size, size);
      ctx.restore();
    }
    return;
  }
  const width = Math.max(18, fontSize * 0.72);
  const height = Math.max(11, fontSize * 0.42);
  const baseY = center.y - fontSize * 0.56;
  const topY = baseY - height;
  const traceCrown = () => {
    ctx.beginPath();
    ctx.moveTo(center.x - width * 0.5, baseY);
    ctx.lineTo(center.x - width * 0.48, topY + height * 0.12);
    ctx.lineTo(center.x - width * 0.2, topY + height * 0.58);
    ctx.lineTo(center.x, topY);
    ctx.lineTo(center.x + width * 0.2, topY + height * 0.58);
    ctx.lineTo(center.x + width * 0.48, topY + height * 0.12);
    ctx.lineTo(center.x + width * 0.5, baseY);
    ctx.closePath();
  };
  ctx.save();
  ctx.lineJoin = "round";
  traceCrown();
  if (bonusGridActive) {
    const neonScale = getPurpleNeonPerformanceScale();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = `rgba(202, 104, 255, ${0.46 * neonScale})`;
    ctx.shadowBlur = Math.max(2, 7 * neonScale);
    ctx.lineWidth = Math.max(2, fontSize * 0.085);
    ctx.strokeStyle = `rgba(187, 91, 255, ${0.22 * neonScale})`;
    ctx.stroke();
    ctx.shadowColor = `rgba(202, 104, 255, ${0.42 * neonScale})`;
    ctx.shadowBlur = Math.max(2, 5 * neonScale);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.lineWidth = Math.max(1.5, fontSize * 0.055);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.58)";
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function drawChanceRooms(sweep = null) {
  const gridSize = getChanceRoomGridSize();
  const bonusGridActive = isX10VisualActive();
  CHANCE_ROOM_IDS.forEach((id) => {
    const room = getChanceRoomGeometry(id);
    const dimmed = isChanceRoomDimmed(id);
    const active = !dimmed;
    ctx.save();
    tracePolygon(room.vertices);
    ctx.fillStyle = bonusGridActive
      ? "#14091b"
      : active ? "rgba(18, 7, 9, 0.97)" : "rgba(2, 3, 5, 0.9)";
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = dimmed ? 0.2 : 1;
    ctx.beginPath();
    for (let index = 1; index < gridSize; index += 1) {
      const value = -1 + index * 2 / gridSize;
      const a1 = chanceRoomLocalToScreen(room, value, -1);
      const a2 = chanceRoomLocalToScreen(room, value, 1);
      const b1 = chanceRoomLocalToScreen(room, -1, value);
      const b2 = chanceRoomLocalToScreen(room, 1, value);
      ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y);
      ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y);
    }
    ctx.strokeStyle = bonusGridActive
      ? "rgba(190, 124, 234, 0.46)"
      : active ? "rgba(255, 84, 84, 0.38)" : "rgba(104, 39, 43, 0.28)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Presentation winners survive logical bonus completion and live-list
    // pruning. Highlight their actual cells, including concurrent room wins.
    const roomPucks = getCellPresentationPucks().filter((puck) => puck.chance?.roomId === id
      && ["inside", "settled"].includes(puck.chance.phase));
    for (const roomPuck of roomPucks) {
      const presentationFrame = getChancePresentationFrame(roomPuck);
      const cellCol = clamp(Math.floor((presentationFrame[0] + 1) * gridSize / 2), 0, gridSize - 1);
      const cellRow = clamp(Math.floor((presentationFrame[1] + 1) * gridSize / 2), 0, gridSize - 1);
      const u0 = -1 + cellCol * 2 / gridSize;
      const u1 = -1 + (cellCol + 1) * 2 / gridSize;
      const v0 = -1 + cellRow * 2 / gridSize;
      const v1 = -1 + (cellRow + 1) * 2 / gridSize;
      const puckCellCorners = [
        chanceRoomLocalToScreen(room, u0, v0), chanceRoomLocalToScreen(room, u1, v0),
        chanceRoomLocalToScreen(room, u1, v1), chanceRoomLocalToScreen(room, u0, v1)
      ];
      const winningCell = roomPuck.chance.phase === "settled"
        && (isBigWinFlashing(roomPuck) || state.chanceRoomOutcome?.won);
      if (roomPuck.chance.phase === "inside" || winningCell) {
        ctx.save();
        if (isBigWinFlashing(roomPuck)) ctx.globalAlpha = 1;
        if (winningCell) applyBigWinCellFlash(id);
        if (winningCell && bonusGridActive) {
          tracePolygon(puckCellCorners);
          ctx.fillStyle = "rgba(202, 104, 255, 0.56)";
          ctx.strokeStyle = "rgba(238, 202, 255, 0.98)";
          ctx.lineWidth = 3;
          ctx.fill();
          ctx.stroke();
          tracePolygon(puckCellCorners);
          ctx.fillStyle = "rgba(130, 46, 200, 0.24)";
          ctx.strokeStyle = "rgba(202, 104, 255, 0.86)";
          ctx.fill();
          ctx.stroke();
        }
        tracePolygon(puckCellCorners);
        ctx.fillStyle = winningCell ? "rgba(255, 213, 77, 0.74)" : "rgba(117, 217, 255, 0.26)";
        ctx.strokeStyle = winningCell ? "rgba(255, 245, 166, 0.98)" : "rgba(117, 217, 255, 0.54)";
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    const isV3Room = Boolean(window.BalloroBonusUI?.isV3);
    const roomRules = window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules;
    const cells = isV3Room
      ? Array.from({ length: gridSize * gridSize }, (_, index) => ({ col: index % gridSize, row: Math.floor(index / gridSize) }))
      : [getChanceMultiplierCell(id, gridSize)];
    for (const cell of cells) {
      const u = -1 + (cell.col + 0.5) * 2 / gridSize;
      const v = -1 + (cell.row + 0.5) * 2 / gridSize;
      const multiplierCenter = chanceRoomLocalToScreen(room, u, v);
      const cellBonusActive = sweep?.vertical
        ? getV4PointVisualActive(sweep, multiplierCenter.y) : bonusGridActive;
      if (sweep?.vertical) {
        const corners = [chanceRoomLocalToScreen(room, u - 1 / gridSize, v - 1 / gridSize),
          chanceRoomLocalToScreen(room, u + 1 / gridSize, v - 1 / gridSize),
          chanceRoomLocalToScreen(room, u + 1 / gridSize, v + 1 / gridSize),
          chanceRoomLocalToScreen(room, u - 1 / gridSize, v + 1 / gridSize)];
        tracePolygon(corners);
        ctx.fillStyle = cellBonusActive ? "#14091b" : active ? "rgba(18, 7, 9, 0.97)" : "rgba(2, 3, 5, 0.9)";
        ctx.fill();
        ctx.strokeStyle = cellBonusActive ? "rgba(190, 124, 234, 0.46)" : "rgba(104, 39, 43, 0.38)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        drawV4CellSwitchFlash(sweep, multiplierCenter.y, () => tracePolygon(corners));
      }
      const roomMultiplier = isV3Room
        ? roomRules.roomCellMultiplier(GRID_SIZE, id, cell.col, cell.row)
        : getChanceRoomMultiplier(id);
      const tier = isV3Room ? window.BalloroV3Rules.roomCellTier(GRID_SIZE, id, cell.col, cell.row) : "red";
      const multiplierText = getFieldMultiplierText(cellBonusActive ? roomMultiplier * 10 : roomMultiplier);
      const multiplierColor = cellBonusActive ? getBonusMultiplierColor(roomMultiplier)
        : getMultiplierColor(roomMultiplier);
      ctx.fillStyle = multiplierColor;
      const fontSize = Math.max(18, Math.min(78, state.field.grid * 0.41));
      ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.save();
      if (window.BalloroBonusUI?.isV4) {
        const hasPendingPuck = state.pucks.some((puck) => {
          if (puck.chance?.roomId !== id || puck.chance.phase !== "inside"
            || !puckHasPendingCellReward(puck)) return false;
          const frame = getChancePresentationFrame(puck);
          const col = clamp(Math.floor((frame[0] + 1) * gridSize / 2), 0, gridSize - 1);
          const row = clamp(Math.floor((frame[1] + 1) * gridSize / 2), 0, gridSize - 1);
          return col === cell.col && row === cell.row;
        });
        ctx.globalAlpha = hasPendingPuck ? 1 : dimmed ? 0.2 : 0.5;
      }
      applyV4MultiplierBounce(multiplierCenter,
        window.BalloroBonusUI?.isV4 && roomRules.hasMultiplierFire(GRID_SIZE, cell.col, cell.row, id));
      if (cellBonusActive) {
        drawPurpleNeonMultiplierText(multiplierText, multiplierCenter.x, multiplierCenter.y, multiplierColor);
      } else {
        drawStyledMultiplierText(ctx, "fillText", multiplierText, multiplierCenter.x, multiplierCenter.y);
      }
      if (window.BalloroBonusUI?.isV4
        ? roomRules.hasMultiplierFire(GRID_SIZE, cell.col, cell.row, id)
        : !isV3Room || tier === "red") {
        drawChanceMultiplierCrown(id, multiplierCenter, fontSize, multiplierColor, cellBonusActive);
      }
      ctx.restore();
    }
    ctx.restore();

    const finalCueStrength = getChanceFinalCueStrength(id);
    if (finalCueStrength > 0) {
      const cueFill = bonusGridActive ? "202, 104, 255" : "255, 55, 62";
      const cueStroke = bonusGridActive ? "214, 126, 255" : "255, 58, 64";
      const cueEdge = bonusGridActive ? "244, 220, 255" : "255, 255, 255";
      ctx.save();
      traceChanceRoomVisibleBorder(room);
      ctx.fillStyle = `rgba(${cueFill}, ${0.28 * finalCueStrength})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${cueStroke}, ${0.94 * finalCueStrength})`;
      ctx.lineWidth = 13;
      ctx.lineJoin = "round";
      ctx.stroke();
      traceChanceRoomVisibleBorder(room);
      ctx.strokeStyle = `rgba(${cueEdge}, ${0.98 * finalCueStrength})`;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();
    }
  });
}

function drawChanceRoomBordersOverlay() {
  const bonusGridActive = isX10VisualActive();
  CHANCE_ROOM_IDS.forEach((id) => {
    const room = getChanceRoomGeometry(id);
    const dimmed = isChanceRoomDimmed(id);
    const active = !dimmed;
    ctx.save();
    ctx.globalAlpha = dimmed ? 0.22 : 1;
    traceChanceRoomVisibleBorder(room);
    ctx.strokeStyle = bonusGridActive
      ? active ? "rgba(226, 172, 255, 0.98)" : "rgba(166, 72, 226, 0.72)"
      : active ? "#ff4b4b" : "rgba(139, 44, 49, 0.62)";
    ctx.lineWidth = active ? 7 : 5;
    ctx.shadowColor = bonusGridActive
      ? active ? "rgba(202, 104, 255, 0.72)" : "rgba(166, 72, 226, 0.16)"
      : active ? "rgba(255, 45, 45, 0.72)" : "rgba(255, 45, 45, 0.12)";
    ctx.shadowBlur = active ? 18 : 5;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
    if (bonusGridActive) {
      ctx.save();
      ctx.globalAlpha = dimmed ? 0.22 : 1;
      drawPurpleNeonChanceRoomStroke(room, active ? 7 : 5);
      ctx.restore();
    }
  });
}

function drawChanceRoomLaunchPreview() {
  let id = null;
  if (state.chancePhase === "spinning") id = CHANCE_ROOM_IDS[state.chanceSpinRoomIndex];
  else if (state.chancePhase === "final_cue") id = state.chanceSelectedRoomId;
  if (!id) return;
  const room = getChanceRoomGeometry(id);
  const entry = getChanceRoomEntryLocal(id);
  drawChanceRoomPreviewPuck(chanceRoomLocalToScreen(room, entry.u, entry.v));
}

function getChancePocketGeometry() {
  if (!state.chancePocket) return null;
  const normalized = {
    x: -1 + (state.chancePocket.col + 0.5) * 2 / GRID_SIZE,
    y: -1 + (state.chancePocket.row + 0.5) * 2 / GRID_SIZE
  };
  const point = toScreen(normalized.x * state.field.half, normalized.y * state.field.half);
  return { ...state.chancePocket, normalized, point };
}

function drawChancePocket() {
  if (state.chancePocket?.finished && !window.BalloroBonusUI?.isV3) return;
  const pocket = getChancePocketGeometry();
  if (!pocket) return;
  const collectibleBubble = getCollectibleIdleBubble(7.4);
  const radius = Math.max(6, state.field.puckRadius);
  const capturedPuck = state.chanceCapturedPuck;
  const visual = window.BalloroBonusUI?.isV2 ? getV2PocketVisual("crown") : null;
  const waveActive = Boolean(capturedPuck)
    && ["capturing", "captured", "sinking"].includes(state.chancePhase);
  const pocketScale = getV4PocketIdleScale("crown", collectibleBubble,
    waveActive || state.chancePocket?.consumed);
  ctx.save();
  if (waveActive) {
    const pulse = 0.5 + Math.sin((window.BalloroGameLifecycle?.now() ?? performance.now()) / BLUE_POCKET_WAVE_TIME_SCALE_MS) * 0.5;
    (visual?.waves || drawRedReadyWaves)(pocket.point, radius, pulse);
  }
  drawPulsingFieldPocketSurface(pocket.point, radius * pocketScale, collectibleBubble,
    visual?.palette || RED_FIELD_POCKET_PALETTE,
    visual?.stroke || "rgb(255, 74, 82)", visual?.glow || "rgba(255, 48, 58, 0.29)");
  drawV4ReturningPocketSymbol("crown", pocket.point, radius, collectibleBubble,
    !state.chancePocket?.consumed && !state.v3PocketSymbolCycle.crown
    && !state.counterFlyIns.some((flyIn) => flyIn.kind === "crown"));
  ctx.restore();
}

function puckIsUsingSecretRoom(puck) {
  if (puck === state.multiPlusCapturedPuck
    && ["capturing", "captured", "revealing"].includes(state.multiPlusPhase)) return true;
  if (puck.chance && puck.chance.phase !== "settled") return true;
  const phase = puck.secretRoom?.phase;
  return ["capturing", "pocket_wait", "pocket"].includes(phase);
}

function puckHasPendingCellReward(puck) {
  // A displayed reward or a fading ball must not brighten its old cell.
  return !(puck.result?.multiplier > 0)
    && (!puck.stopped || !puck.resultRevealStartedAt);
}

function drawMainFieldMultiplierLabels(mergedMultiplierCells, bonusGridActive, half, grid, sweep = null) {
  // Keep the base digit size even when a large multiplier extends beyond its cell.
  // Build the moving-ball cell index once, not once per label (up to 81 cells).
  // This affects opacity only; payout/collision state remains authoritative.
  const pendingCells = window.BalloroBonusUI?.isV4 ? new Set(state.pucks
    .filter(puck => !puckIsUsingSecretRoom(puck) && puckHasPendingCellReward(puck))
    .map(puck => { const cell = getCellFromPoint(puck.x, puck.y); return `${cell.col}_${cell.row}`; })) : null;
  mergedMultiplierCells.groups.forEach((group) => {
    const center = toScreen(
      -half + grid * group.col + grid * group.size / 2,
      -half + grid * group.row + grid * group.size / 2
    );
    const reveal = group.category === "multi_plus"
      ? getMultiplierRevealMotion(state.multiPlusActivatedAt, center.y, group.col, group.row)
      : { y: center.y, alpha: 1 };
    const displayedMultiplier = bonusGridActive ? group.multiplier * 10 : group.multiplier;
    const text = getFieldMultiplierText(displayedMultiplier, group.category);
    const fontSize = Math.max(18, Math.min(78, grid * group.size * 0.41));
    const multiplierColor = bonusGridActive
      ? getBonusMultiplierColor(group.multiplier)
      : getV3FieldMultiplierColor(group.col, group.row, group.multiplier);
    ctx.fillStyle = multiplierColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.save();
    const hasPuck = state.pucks.some((puck) => {
      if (puckIsUsingSecretRoom(puck)) return false;
      if (window.BalloroBonusUI?.isV4 && !puckHasPendingCellReward(puck)) return false;
      const puckCell = getCellFromPoint(puck.x, puck.y);
      return puckCell.col >= group.col
        && puckCell.col < group.col + group.size
        && puckCell.row >= group.row
        && puckCell.row < group.row + group.size;
    });
    ctx.globalAlpha = (window.BalloroBonusUI?.isV4 ? hasPuck ? 1 : 0.5
      : window.BalloroBonusUI?.isV3 ? 0.5
      : bonusGridActive || hasPuck ? 1 : 0.5) * reveal.alpha;
    const hasTopSymbol = hasV4MainMultiplierTopSymbol(group.col, group.row, displayedMultiplier);
    applyV4MultiplierBounce({ x: center.x, y: reveal.y }, hasTopSymbol);
    if (bonusGridActive) {
      drawPurpleNeonMultiplierText(text, center.x, reveal.y, multiplierColor);
    } else {
      drawStyledMultiplierText(ctx, "fillText", text, center.x, reveal.y);
    }
    if (hasTopSymbol) {
      drawChanceMultiplierCrown("main", { x: center.x, y: reveal.y }, fontSize, multiplierColor, bonusGridActive);
    }
    ctx.restore();
  });

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (window.BalloroBonusUI?.isV3 && state.multiPlusPhase === "revealing"
        && state.multiPlusNeonCells.some((cell) => cell.col === col && cell.row === row)) {
        continue;
      }
      if (mergedMultiplierCells.covered.has(`${col}_${row}`)) {
        continue;
      }
      const multiplier = getDisplayedCellMultiplier(col, row);
      if (!multiplier) {
        continue;
      }

      const center = toScreen(
        -half + grid * col + grid / 2,
        -half + grid * row + grid / 2
      );
      const category = getCellCategory(col, row);
      const reveal = category === "multi_plus"
        ? getMultiplierRevealMotion(state.multiPlusActivatedAt, center.y, col, row)
        : { y: center.y, alpha: 1 };
      const cellBonusActive = sweep ? getV3CellVisualActive(sweep, col, row) : bonusGridActive;
      const displayedMultiplier = cellBonusActive ? multiplier * 10 : multiplier;
      const text = getFieldMultiplierText(displayedMultiplier, category);
      const fontSize = Math.max(10, Math.min(42, grid * 0.42));
      const multiplierColor = cellBonusActive ? getBonusMultiplierColor(multiplier)
        : getV3FieldMultiplierColor(col, row, multiplier);
      ctx.fillStyle = multiplierColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.save();
      const hasPuck = pendingCells ? pendingCells.has(`${col}_${row}`) : state.pucks.some((puck) => {
        if (puckIsUsingSecretRoom(puck)) return false;
        if (window.BalloroBonusUI?.isV4 && !puckHasPendingCellReward(puck)) return false;
        const puckCell = getCellFromPoint(puck.x, puck.y);
        return puckCell.col === col && puckCell.row === row;
      });
      ctx.globalAlpha = (window.BalloroBonusUI?.isV4 ? hasPuck ? 1 : 0.5
        : window.BalloroBonusUI?.isV3 ? 0.5
        : bonusGridActive || hasPuck ? 1 : 0.5) * reveal.alpha;
      const hasTopSymbol = hasV4MainMultiplierTopSymbol(col, row, displayedMultiplier);
      applyV4MultiplierBounce({ x: center.x, y: reveal.y }, hasTopSymbol);
      if (cellBonusActive) {
        drawPurpleNeonMultiplierText(text, center.x, reveal.y, multiplierColor);
      } else {
        drawStyledMultiplierText(ctx, "fillText", text, center.x, reveal.y);
      }
      if (hasTopSymbol) {
        drawChanceMultiplierCrown("main", { x: center.x, y: reveal.y }, fontSize, multiplierColor, cellBonusActive);
      }
      ctx.restore();
    }
  }
}

function drawField(clearCanvas = true, sweep = null) {
  const { half, grid } = state.field;
  const bonusGridActive = isX10VisualActive();
  const innerGridColor = bonusGridActive ? "rgba(190, 124, 234, 0.46)" : "rgba(27, 184, 102, 0.28)";
  const corners = [
    toScreen(-half, -half),
    toScreen(half, -half),
    toScreen(half, half),
    toScreen(-half, half)
  ];

  if (clearCanvas) {
    ctx.clearRect(0, 0, state.field.width, state.field.height);
    ctx.fillStyle = document.body.classList.contains('slot-ui') ? "#000000" : "#010205";
    ctx.fillRect(0, 0, state.field.width, state.field.height);
  }
  drawChanceRooms(sweep);

  const borderGradient = createFieldBorderGradient(corners, bonusGridActive);
  const secretZones = usesFieldPocketMechanics()
    ? [getFieldPocketGeometry(), state.bluePocket
      ? getFieldPocketGeometry(state.bluePocket, BLUE_FIELD_POCKET_ZONE_ID) : null].filter(Boolean)
    : SECRET_ZONE_IDS.map(getSecretZoneGeometry);
  const cornerRadius = getFieldCornerRadius();

  ctx.save();
  traceRoundedPolygon(corners, cornerRadius);
  ctx.fillStyle = bonusGridActive ? "#14091b" : "#05070c";
  ctx.fill();
  ctx.clip();

  for (let i = 0; i < 18; i += 1) {
    const alpha = 0.02 + i * 0.002;
    const offset = -half + (i / 17) * half * 2;
    drawLine(toScreen(-half, offset), toScreen(half, offset), `rgba(117, 217, 255, ${alpha})`, 1);
  }

  drawGridLines(half, grid, innerGridColor, 4);
  const mergedMultiplierCells = buildMergedMultiplierCells();
  const fieldFill = bonusGridActive ? "#14091b" : "#05070c";
  eraseMergedMultiplierInternalLines(mergedMultiplierCells.groups, fieldFill);
  if (sweep) {
    const oldFill = sweep.from ? "#14091b" : "#05070c";
    const oldGrid = sweep.from ? "rgba(190, 124, 234, 0.46)" : "rgba(27, 184, 102, 0.28)";
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (sweep.vertical) {
          const y = toScreen(-half + (col + 0.5) * grid, -half + (row + 0.5) * grid).y;
          const active = getV4PointVisualActive(sweep, y);
          drawCell(col, row, active ? "#14091b" : "#05070c",
            active ? "rgba(190, 124, 234, 0.46)" : "rgba(27, 184, 102, 0.28)", 2.5);
          drawV4CellSwitchFlash(sweep, y, () => {
            tracePolygon([toScreen(-half + col * grid, -half + row * grid),
              toScreen(-half + (col + 1) * grid, -half + row * grid),
              toScreen(-half + (col + 1) * grid, -half + (row + 1) * grid),
              toScreen(-half + col * grid, -half + (row + 1) * grid)]);
          });
        } else if (getV3CellVisualActive(sweep, col, row) === sweep.from) {
          drawCell(col, row, oldFill, oldGrid, 2.5);
        }
      }
    }
  }

  state.pucks.forEach((puck) => {
    if (puck.stopped || puckIsUsingSecretRoom(puck)) {
      return;
    }
    const cell = getCellFromPoint(puck.x, puck.y);
    if (puck.purpleBoost) {
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(202, 104, 255, 0.38)",
        "rgba(226, 172, 255, 0.92)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(130, 46, 200, 0.22)",
        "rgba(202, 104, 255, 0.68)"
      );
      return;
    }
    drawMultiplierCellHighlight(
      mergedMultiplierCells,
      cell.col,
      cell.row,
      "rgba(117, 217, 255, 0.26)",
      "rgba(117, 217, 255, 0.54)"
    );
  });

  getMainWinningPresentationCells().forEach((storedCell) => {
    if (!storedCell.squareWin) return;
    const settledPuck = storedCell.presentationPuck || state.pucks[storedCell.puckIndex];
    const flashingBigWin = isBigWinFlashing(settledPuck);
    const cell = flashingBigWin ? { ...storedCell, ...getCellFromPoint(settledPuck.x, settledPuck.y) } : storedCell;
    const ordinaryV3Win = window.BalloroBonusUI?.isV3 && settledPuck
      && !cell.purpleBoost && !bigWinEffect.winners.has(settledPuck);
    const flashElapsed = ordinaryV3Win
      ? (window.BalloroGameLifecycle?.now() ?? performance.now()) - settledPuck.resultRevealStartedAt : 0;
    const winFlashDuration = window.BalloroBonusUI?.isV4 ? 325 : 650;
    const puckFade = flashingBigWin ? 1 : ordinaryV3Win
      ? Math.sin(Math.PI * clamp(flashElapsed / winFlashDuration, 0, 1))
      : window.BalloroBonusUI?.isV3
        ? (settledPuck ? getV3PuckFade(settledPuck) : 0) : 1;
    if (puckFade <= 0) return;
    ctx.save();
    ctx.globalAlpha *= puckFade;
    applyBigWinCellFlash("main");
    if (cell.purpleBoost) {
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(202, 104, 255, 0.56)",
        "rgba(238, 202, 255, 0.98)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(130, 46, 200, 0.24)",
        "rgba(202, 104, 255, 0.86)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(255, 213, 77, 0.74)",
        "rgba(255, 213, 77, 0.98)"
      );
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(255, 245, 166, 0.24)",
        "rgba(255, 245, 166, 0.92)"
      );
      if (cell.lineWin) {
        drawMultiplierCellHighlight(
          mergedMultiplierCells,
          cell.col,
          cell.row,
          "rgba(255, 213, 77, 0.42)",
          "rgba(255, 238, 122, 0.98)"
        );
      }
      ctx.restore();
      return;
    }
    drawMultiplierCellHighlight(
      mergedMultiplierCells,
      cell.col,
      cell.row,
      "rgba(255, 213, 77, 0.74)",
      "rgba(255, 213, 77, 0.98)"
    );
    drawMultiplierCellHighlight(
      mergedMultiplierCells,
      cell.col,
      cell.row,
      "rgba(255, 245, 166, 0.24)",
      "rgba(255, 245, 166, 0.92)"
    );
    if (cell.squareWin && cell.lineWin) {
      drawMultiplierCellHighlight(
        mergedMultiplierCells,
        cell.col,
        cell.row,
        "rgba(255, 213, 77, 0.42)",
        "rgba(255, 238, 122, 0.98)"
      );
    }
    ctx.restore();
  });

  ctx.restore();

  traceRoundedPolygon(corners, cornerRadius);
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 9;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  if (bonusGridActive) {
    drawPurpleNeonPolygonStroke(corners, 9, cornerRadius);
  }
  // Room borders are the final wall layer so their inner vertices cannot be
  // clipped by the thicker main-diamond stroke or its X10 neon glow.
  drawChanceRoomBordersOverlay();
  if (usesFieldPocketMechanics()) {
    secretZones.forEach((zone) => drawSecretPocket(
      zone,
      zone.id === BLUE_FIELD_POCKET_ZONE_ID
        ? window.BalloroBonusUI?.isV2 ? "rgb(55, 234, 78)" : "rgb(117, 217, 255)"
        : "rgb(202, 104, 255)",
      false,
      zone.id === BLUE_FIELD_POCKET_ZONE_ID
        ? window.BalloroBonusUI?.isV2 ? "rgba(55, 234, 78, 0.29)" : "rgba(117, 217, 255, 0.29)"
        : "rgba(202, 104, 255, 0.29)",
      true
    ));
    drawChancePocket();
  } else {
    secretZones.forEach((zone) => drawSecretPocket(zone, "rgba(27, 184, 102, 0.62)", bonusGridActive));
    drawSecretPocketRimsOverlay();
  }
}

function getRiskBands() {
  const mathConfig = getMathConfiguration();
  if (mathConfig) {
    return {
      outer: mathConfig.multiplier_table.outer,
      mid: mathConfig.multiplier_table.middle,
      center: mathConfig.multiplier_table.center
    };
  }
  const bands = {
    low: { outer: 1.1, mid: 1.5, center: 2 },
    normal: { outer: 1.5, mid: 2.7, center: 5 },
    high: { outer: 0.1, mid: 1, center: 10 }
  };
  return bands[state.riskLevel] || bands.normal;
}

function getMultiPlusFieldMultiplier() {
  const config = getMathConfiguration();
  if (!config) return 0;
  const values = [...new Set(["outer", "middle", "center"].flatMap((category) =>
    (config.sector_definitions[category] || []).map((sector) =>
      sector.multiplier ?? config.multiplier_table[category])))].filter((value) => value > 0)
    .sort((a, b) => a - b);
  // With only two visible tiers, EX MULTI uses the lower tier, never the maximum.
  return values[Math.floor((values.length - 1) / 2)] || 0;
}

function getCellMultiplier(col, row) {
  if (window.BalloroBonusUI?.isV3) {
    const rules = window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules;
    const base = rules.cellMultiplier(GRID_SIZE, col, row);
    if (base && isMultiPlusVisualActive()
      && getActiveMultiPlusCells().some((cell) => cell.col === col && cell.row === row)) {
      return Math.round(base * rules.yellowMultiplier * 10) / 10;
    }
    return base;
  }
  const config = getMathConfiguration();
  if (!config) return 0;
  if (isMultiPlusVisualActive()
    && getActiveMultiPlusCells().some((sector) => sector.col === col && sector.row === row)) {
    return getMultiPlusFieldMultiplier();
  }
  for (const category of ["center", "middle", "outer"]) {
    const sector = config.sector_definitions[category]
      .find((candidate) => candidate.col === col && candidate.row === row);
    if (sector) return sector.multiplier ?? config.multiplier_table[category];
  }
  return 0;
}

function getDisplayedCellMultiplier(col, row) {
  if (isYellowCellReturning(col, row)) {
    const rules = window.BalloroV4Rules;
    return Math.round(rules.cellMultiplier(GRID_SIZE, col, row) * rules.yellowMultiplier * 10) / 10;
  }
  const held = window.BalloroBonusUI?.isV4 && !state.multiPlusActive
    && state.v4HeldYellowCells?.some(cell => cell.col === col && cell.row === row);
  if (held) {
    const rules = window.BalloroV4Rules;
    return Math.round(rules.cellMultiplier(GRID_SIZE, col, row) * rules.yellowMultiplier * 10) / 10;
  }
  return getCellMultiplier(col, row);
}

function getFieldMultiplierText(multiplier, category = null) {
  if (window.BalloroBonusUI?.isV3) {
    return `${formatMultiplierValue(multiplier, Number.isInteger(multiplier) ? 0 : 1)}x`;
  }
  const rounded = Math.round((multiplier + Number.EPSILON) * 100) / 100;
  const digits = category === "center" ? 0
    : category === "middle" || category === "multi_plus" ? 1
      : category === "outer" ? 2
        : Number.isInteger(rounded) ? 0 : Number.isInteger(rounded * 10) ? 1 : 2;
  return `${formatMultiplierValue(rounded, digits)}x`;
}

function getMultiplierText(multiplier) {
  const numericValue = Number(multiplier);
  if (window.BalloroBonusUI?.isV3) {
    return `${Number.isFinite(numericValue) ? numericValue.toFixed(Number.isInteger(numericValue) ? 0 : 1) : "0"}x`;
  }
  return `${Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00"}x`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMultiplierProgress(multiplier) {
  return clamp((multiplier - 0.1) / (7.5 - 0.1), 0, 1);
}

function interpolateMultiplierColor(multiplier) {
  const stops = [
    { value: 0.1, hue: 132, saturation: 92, lightness: 55 },
    { value: 2.1, hue: 56, saturation: 100, lightness: 53 },
    { value: 4.2, hue: 28, saturation: 100, lightness: 54 },
    { value: 7.5, hue: 4, saturation: 100, lightness: 56 }
  ];
  const value = clamp(multiplier, stops[0].value, stops.at(-1).value);
  const upperIndex = stops.findIndex((stop) => value <= stop.value);
  const upper = stops[Math.max(upperIndex, 1)];
  const lower = stops[Math.max(upperIndex - 1, 0)];
  const segmentProgress = upper.value === lower.value
    ? 0
    : (value - lower.value) / (upper.value - lower.value);
  const mix = (start, end) => start + (end - start) * segmentProgress;
  return {
    hue: mix(lower.hue, upper.hue),
    saturation: mix(lower.saturation, upper.saturation),
    lightness: mix(lower.lightness, upper.lightness)
  };
}

function withColorAlpha(color, alpha) {
  const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((value) => value + value).join("") : hex;
    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
}

function getMultiplierColor(multiplier, yellowBoost = false) {
  if (window.BalloroBonusUI?.isV3) {
    return window.BalloroMultiplierPresentation.color(multiplier, false,
      Boolean(window.BalloroBonusUI?.isV4 && yellowBoost));
  }
  const color = interpolateMultiplierColor(multiplier);
  return `hsla(${color.hue.toFixed(1)}, ${color.saturation.toFixed(1)}%, ${color.lightness.toFixed(1)}%, 1)`;
}

function getV3FieldMultiplierColor(col, row, multiplier) {
  const yellowBoost = window.BalloroBonusUI?.isV4
    && (isYellowCellReturning(col, row)
      || (isMultiPlusVisualActive() && getActiveMultiPlusCells().some(cell => cell.col === col && cell.row === row))
      || (!state.multiPlusActive && state.v4HeldYellowCells?.some(cell => cell.col === col && cell.row === row)));
  return getMultiplierColor(multiplier, yellowBoost);
}

function getV3WinSoundTier(col, row) {
  const mid = (GRID_SIZE - 1) / 2;
  const ring = Math.max(Math.abs(col - mid), Math.abs(row - mid));
  return ring === 0 ? 2 : ring === 1 ? 1 : 0;
}

function getBonusMultiplierColor(multiplier) {
  const progress = getMultiplierProgress(multiplier);
  const hue = 276 + progress * 12;
  const saturation = 82 + progress * 18;
  const lightness = 70 + progress * 16;
  return `hsla(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%, 1)`;
}

function getBonusResultColor(multiplier) {
  const progress = getMultiplierProgress(multiplier);
  const hue = 280 + progress * 8;
  const saturation = 92 + progress * 8;
  const lightness = 58 + progress * 8;
  return `hsla(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%, 1)`;
}

function drawStarPath(x, y, outer, inner) {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? outer : inner;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    });
  }

  ctx.beginPath();
  points.forEach((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const roundness = (index % 2 === 0 ? outer : inner) * 0.16;
    const start = {
      x: point.x + (previous.x - point.x) * (roundness / Math.hypot(previous.x - point.x, previous.y - point.y)),
      y: point.y + (previous.y - point.y) * (roundness / Math.hypot(previous.x - point.x, previous.y - point.y))
    };
    const end = {
      x: point.x + (next.x - point.x) * (roundness / Math.hypot(next.x - point.x, next.y - point.y)),
      y: point.y + (next.y - point.y) * (roundness / Math.hypot(next.x - point.x, next.y - point.y))
    };
    if (index === 0) {
      ctx.moveTo(start.x, start.y);
    } else {
      ctx.lineTo(start.x, start.y);
    }
    ctx.quadraticCurveTo(point.x, point.y, end.x, end.y);
  });
  ctx.closePath();
}

function drawDiamondPath(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size * 0.92, y - size * 0.28);
  ctx.lineTo(x - size * 0.48, y - size * 0.74);
  ctx.lineTo(x + size * 0.48, y - size * 0.74);
  ctx.lineTo(x + size * 0.92, y - size * 0.28);
  ctx.lineTo(x, y + size * 0.86);
  ctx.closePath();
}

function drawDiamondFacets(x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x - size * 0.92, y - size * 0.28);
  ctx.lineTo(x + size * 0.92, y - size * 0.28);
  ctx.moveTo(x - size * 0.48, y - size * 0.74);
  ctx.lineTo(x, y - size * 0.28);
  ctx.lineTo(x + size * 0.48, y - size * 0.74);
  ctx.moveTo(x - size * 0.92, y - size * 0.28);
  ctx.lineTo(x, y + size * 0.86);
  ctx.lineTo(x + size * 0.92, y - size * 0.28);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.8, size * 0.09);
  ctx.lineJoin = "round";
  ctx.stroke();
}

function getCollectibleIdleBubble(seed = 0) {
  if (!state.animationsEnabled) {
    return { scale: 1, glowScale: 1, glowAlpha: 1 };
  }
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  const mainWave = Math.sin(now / 260 + seed);
  const beatWave = Math.sin(now / 132 + seed * 0.45 + 0.7);
  const softWave = Math.sin(now / 540 + seed * 0.73 + 1.4);
  const pop = Math.pow(0.5 + mainWave * 0.5, 1.35);
  const beat = 0.5 + beatWave * 0.5;
  return {
    scale: 0.91 + pop * 0.21 + beat * 0.025 + softWave * 0.015,
    glowScale: 1.02 + pop * 0.48 + beat * 0.08,
    glowAlpha: 0.9 + pop * 0.3 + (0.5 + softWave * 0.5) * 0.22
  };
}

function isPocketReadyPuck(puck) {
  if (!window.BalloroBonusUI?.isV4) return false;
  if (puck.chance) return puck.chance.phase === "captured";
  return Boolean(puck.pocketReadyPreview
    || puck.secretRoom?.phase === "pocket_wait"
    || (puck === state.multiPlusCapturedPuck
      && ["captured", "revealing"].includes(state.multiPlusPhase))
    || (puck.waitingForPocket && !puck.v3QueuePull));
}

function getPocketReadyPuckAlpha(puck, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  const waiting = isPocketReadyPuck(puck);
  if (!window.BalloroReadyBlink) return waiting ? (now % 200 < 100 ? 1 : 0) : 1;
  return window.BalloroReadyBlink.sample(puck.readyBlinkOwner || puck, waiting, now).alpha;
}

function drawPuck(puck, index) {
  if (["spinning", "final_cue"].includes(puck.chance?.phase)) return;
  const chanceSinkProgress = puck.chance?.phase === "sinking"
    ? clamp(((puck.pocketDepth || 0) - 0.55) / 0.45, 0, 1) : 0;
  const chanceSinkScale = puck.chance?.phase === "sinking"
    ? Math.max(0.02, 1 - chanceSinkProgress)
    : 1;
  const puckRadius = state.field.puckRadius * (1 - (puck.pocketDepth || 0) * 0.18) * chanceSinkScale;
  const point = puck.chance && ["inside", "settled"].includes(puck.chance.phase)
    ? getChancePuckScreenPoint(puck)
    : toScreen(puck.x, puck.y);
  const chanceRoomDimmed = puck.chance?.roomId && isChanceRoomDimmed(puck.chance.roomId);

  ctx.save();
  ctx.globalAlpha *= getPocketReadyPuckAlpha(puck);
  if (window.BalloroBonusUI?.isV3 && puck.stopped) {
    ctx.globalAlpha *= isBigWinHeld(puck) ? 1 : getResumedWinAlpha(puck, true) ?? getV3PuckFade(puck);
    if (ctx.globalAlpha <= 0) { ctx.restore(); return; }
  }
  if (chanceRoomDimmed) ctx.globalAlpha *= 0.2;

  ctx.beginPath();
  ctx.arc(point.x, point.y, puckRadius, 0, Math.PI * 2);
  const ballGradient = ctx.createRadialGradient(
    point.x - puckRadius * 0.34,
    point.y - puckRadius * 0.38,
    puckRadius * 0.08,
    point.x + puckRadius * 0.12,
    point.y + puckRadius * 0.18,
    puckRadius * 1.08
  );
  [0, 0.28, 0.62, 0.8, 1].forEach((stop, index) => ballGradient.addColorStop(stop,
    ["#ffffff", "#fafaf6", "#e7eae4", "#c7cdc6", "#9ca49e"][index]));
  ctx.fillStyle = ballGradient;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, puckRadius * 0.98, 0, Math.PI * 2);
  ctx.clip();
  const innerShadow = ctx.createRadialGradient(
    point.x - puckRadius * 0.36,
    point.y - puckRadius * 0.4,
    puckRadius * 0.28,
    point.x - puckRadius * 0.08,
    point.y - puckRadius * 0.12,
    puckRadius * 1.28
  );
  innerShadow.addColorStop(0, "rgba(18, 24, 22, 0)");
  innerShadow.addColorStop(0.42, "rgba(18, 24, 22, 0)");
  innerShadow.addColorStop(0.68, "rgba(18, 24, 22, 0.16)");
  innerShadow.addColorStop(0.84, "rgba(14, 20, 18, 0.32)");
  innerShadow.addColorStop(1, "rgba(8, 12, 11, 0.58)");
  ctx.fillStyle = innerShadow;
  ctx.fillRect(point.x - puckRadius, point.y - puckRadius, puckRadius * 2, puckRadius * 2);
  ctx.restore();

  ctx.lineWidth = Math.max(2.2, puckRadius * 0.16);
  ctx.strokeStyle = "rgba(16, 18, 22, 0.88)";
  ctx.shadowColor = "rgba(0, 0, 0, 0)";
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(point.x - puckRadius * 0.3, point.y - puckRadius * 0.32, puckRadius * 0.28, 0, Math.PI * 2);
  const highlight = ctx.createRadialGradient(
    point.x - puckRadius * 0.38,
    point.y - puckRadius * 0.4,
    0,
    point.x - puckRadius * 0.3,
    point.y - puckRadius * 0.32,
    puckRadius * 0.3
  );
  highlight.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = highlight;
  ctx.fill();

  if (puck.bonus) {
    drawDiamondPath(point.x, point.y + puckRadius * 0.04, puckRadius * 0.88);
    ctx.fillStyle = "rgba(202, 104, 255, 0.98)";
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(74, 20, 112, 0.88)";
    ctx.stroke();
    drawDiamondFacets(point.x, point.y + puckRadius * 0.04, puckRadius * 0.88, "rgba(237, 196, 255, 0.68)");
  }
  ctx.restore();
}

function isQuickTrailActiveForPuck(puck) {
  if (!state.animationsEnabled || !state.running || puck.stopped) return false;
  const playbackSpeed = window.BalloroRoundTapes?.enabled
    ? window.BalloroRoundTapes.playbackSpeed
    : window.BalloroQuickPlayTiming?.recordedFrameSpeed(state, state.quickPlay) || 1;
  if (playbackSpeed < 2) return false;
  if (["capturing", "captured", "pocket_wait"].includes(puck.secretRoom?.phase)) return false;
  if (["capturing", "captured", "sinking", "spinning"].includes(puck.chance?.phase)) return false;
  if (puck.multiPlusCapture || ["capturing", "captured", "revealing"].includes(state.multiPlusPhase)) return false;
  return true;
}

function drawQuickPuckTrail(puck, now) {
  if (!window.BalloroQuickTrail || ["spinning", "final_cue"].includes(puck.chance?.phase)) return;
  const chanceSinkProgress = puck.chance?.phase === "sinking"
    ? clamp(((puck.pocketDepth || 0) - 0.55) / 0.45, 0, 1)
    : 0;
  const radius = state.field.puckRadius * (1 - (puck.pocketDepth || 0) * 0.18)
    * (puck.chance?.phase === "sinking" ? Math.max(0.02, 1 - chanceSinkProgress) : 1);
  const point = puck.chance && ["inside", "settled"].includes(puck.chance.phase)
    ? getChancePuckScreenPoint(puck)
    : toScreen(puck.x, puck.y);
  const alpha = puck.chance?.roomId && isChanceRoomDimmed(puck.chance.roomId) ? 0.2 : 1;
  window.BalloroQuickTrail.draw(ctx, puck, point, radius, {
    active: isQuickTrailActiveForPuck(puck), alpha, now,
    quick: state.quickPlay,
    bonusKind: puck.trailBonusKind || null
  });
}

function drawPucks() {
  // A recorded round's first frame already contains its launch ball. While
  // holding Spin, show only the separate visual ball with ready waves; the
  // recorded ball becomes visible on release when playback actually starts.
  if (window.BalloroRoundTapes?.enabled && state.launchPrepared && !state.running) return;
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  state.pucks.forEach((puck) => drawQuickPuckTrail(puck, now));
  const visiblePucks = getPresentationPucks();
  visiblePucks.forEach((puck, index) => drawPuck(puck, index));
  if (window.BalloroBonusUI?.isV3) drawV3PocketQueueIndicators();
}

function countV3WaitingPocketPucks(kind, zoneId, point, range, capturedPuck = null) {
  return state.pucks.filter((puck) => {
    if (puck === capturedPuck) return false;
    // A released bonus ball can join another queue with its old release flags.
    // Explicit queue membership takes precedence over those flight flags.
    if (puck.waitingForPocket) return puck.waitingForPocket.kind === kind
      && (kind !== "blue" || puck.waitingForPocket.zoneId === zoneId);
    return puck.stopped && !puck.chance && !puck.secretRoom && !puck.pocketRelease
      && Math.hypot(puck.x - point.x, puck.y - point.y) <= range;
  }).length;
}

function drawV3PocketQueueIndicators() {
  const radius = state.field.puckRadius;
  const entries = [];
  for (const [zoneId, pocket] of [[FIELD_POCKET_ZONE_ID, state.fieldPocket],
    [BLUE_FIELD_POCKET_ZONE_ID, state.bluePocket]]) {
    if (!pocket?.consumed) continue;
    const normalized = getFieldPocketNormalized(pocket);
    const point = { x: normalized.x * state.field.half, y: normalized.y * state.field.half };
    const waiting = countV3WaitingPocketPucks("blue", zoneId, point, radius * 2 - 1);
    const held = state.pucks.some((puck) => !puck.waitingForPocket
      && puck.secretRoom?.zoneId === zoneId
      && ["capturing", "pocket_wait"].includes(puck.secretRoom.phase));
    if (waiting) entries.push({ point, count: waiting + Number(held) });
  }
  if (state.chancePocket?.consumed) {
    const pocket = getChancePocketGeometry();
    const point = { x: pocket.normalized.x * state.field.half,
      y: pocket.normalized.y * state.field.half };
    const waiting = countV3WaitingPocketPucks("red", null, point, radius * 2 - 1);
    const held = Boolean(state.chanceCapturedPuck
      && !state.chanceCapturedPuck.waitingForPocket
      && ["capturing", "captured", "sinking"].includes(state.chanceCapturedPuck.chance?.phase));
    if (waiting) entries.push({ point, count: waiting + Number(held), kind: "red" });
  }
  if (state.multiPlusToken?.consumed) {
    const point = state.multiPlusToken;
    const waiting = countV3WaitingPocketPucks("yellow", null, point,
      radius + point.radius - 1, state.multiPlusCapturedPuck);
    const held = Boolean(state.multiPlusCapturedPuck
      && ["capturing", "captured", "revealing"].includes(state.multiPlusPhase));
    if (waiting) entries.push({ point, count: waiting + Number(held) });
  }
  for (const { point, count, kind } of entries) {
    const screen = toScreen(point.x, point.y);
    const hasVisibleBall = state.pucks.some((puck) => !puck.chance && !puck.secretRoom
      && (!puck.stopped || getV3PuckFade(puck) > 0)
      && Math.hypot(puck.x - point.x, puck.y - point.y) <= radius * 0.65);
    if (!hasVisibleBall) {
      drawPuck({ x: point.x, y: point.y, pocketDepth: 0, stopped: false,
        pocketReadyPreview: true, waitingForPocket: kind === "red" ? { kind } : null }, -1);
    }
    if (count < 2) continue;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(17, radius * 1.45)}px Arial, sans-serif`;
    ctx.lineWidth = Math.max(3, radius * 0.21);
    ctx.strokeStyle = "rgba(5, 8, 12, 0.96)";
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = radius * 0.5;
    const labelY = screen.y - radius * 2;
    ctx.strokeText(String(count), screen.x, labelY);
    ctx.fillStyle = "#fff";
    drawStyledMultiplierText(ctx, "fillText", String(count), screen.x, labelY);
    ctx.restore();
  }
}

function getLaunchPrimePuck() {
  const { half } = state.field;
  return {
    // Visual-only launch placeholder: center it exactly on the bottom diamond tip.
    // Real pucks still launch from the standard internal start point in createPuck().
    x: half,
    y: half,
    pocketDepth: 0,
    bonus: false
  };
}

function drawLaunchPrimePreview() {
  if (!state.launchButtonPrimed || state.running) {
    return;
  }
  const launchPuckPreview = getLaunchPrimePuck();
  const point = toScreen(launchPuckPreview.x, launchPuckPreview.y);
  const pulse = 0.5 + Math.sin((window.BalloroGameLifecycle?.now() ?? performance.now()) / 145) * 0.5;
  drawWhiteReadyWaves(point, state.field.puckRadius, pulse);
  drawPuck(launchPuckPreview, 0);
}

function drawBonusStar() {
  if (!state.bonusStars.length) {
    return;
  }

  ctx.save();
  state.bonusStars.forEach((star, index) => {
    if (star.collected) {
      return;
    }

    const point = toScreen(star.x, star.y);
    const outer = star.radius;
    const bubble = getCollectibleIdleBubble((star.index ?? index) * 0.63 + index * 0.37);
    const visualOuter = outer * bubble.scale;
    const glowOuter = outer * bubble.glowScale;
    const starStrokeWidth = Math.max(3, outer * 0.28);

    ctx.save();
    const glow = ctx.createRadialGradient(point.x, point.y, glowOuter * 0.1, point.x, point.y, glowOuter * 2.15);
    glow.addColorStop(0, `rgba(232, 194, 255, ${0.34 * bubble.glowAlpha})`);
    glow.addColorStop(0.48, `rgba(202, 104, 255, ${0.16 * bubble.glowAlpha})`);
    glow.addColorStop(1, "rgba(202, 104, 255, 0)");
    ctx.beginPath();
    ctx.arc(point.x, point.y, glowOuter * 2.15, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    drawDiamondPath(point.x, point.y, visualOuter);
    ctx.lineWidth = starStrokeWidth + 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.shadowColor = "rgba(218, 142, 255, 0.72)";
    ctx.shadowBlur = glowOuter * 1.05;
    drawDiamondPath(point.x, point.y, visualOuter);
    ctx.fillStyle = "rgba(214, 171, 255, 0.96)";
    ctx.fill();
    ctx.lineWidth = starStrokeWidth;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(213, 122, 255, 0.98)";
    ctx.lineJoin = "round";
    ctx.stroke();
    drawDiamondFacets(point.x, point.y, visualOuter, "rgba(244, 213, 255, 0.72)");
    ctx.restore();
  });
  ctx.restore();
}

function drawMultiPlusToken() {
  const token = state.multiPlusToken;
  if (!token || (token.finished && !window.BalloroBonusUI?.isV3)) return;
  const point = toScreen(token.x, token.y);
  const bubble = getCollectibleIdleBubble((token.col ?? 0) * 0.79 + (token.row ?? 0) * 1.13 + 2.4);
  const radius = Math.max(6, state.field.puckRadius);
  const visual = window.BalloroBonusUI?.isV2 ? getV2PocketVisual("lemon") : null;
  const pocketScale = getV4PocketIdleScale("lemon", bubble,
    token.consumed || ["capturing", "captured", "revealing"].includes(state.multiPlusPhase));

  ctx.save();
  if (["capturing", "captured", "revealing"].includes(state.multiPlusPhase)) {
    const pulse = 0.5 + Math.sin((window.BalloroGameLifecycle?.now() ?? performance.now()) / BLUE_POCKET_WAVE_TIME_SCALE_MS) * 0.5;
    (visual?.waves || drawYellowReadyWaves)(point, radius, pulse);
  }
  drawPulsingFieldPocketSurface(point, radius * pocketScale, bubble,
    visual?.palette || YELLOW_FIELD_POCKET_PALETTE,
    visual?.stroke || "rgb(255, 213, 61)", visual?.glow || "rgba(255, 213, 61, 0.29)");
  drawV4ReturningPocketSymbol("lemon", point, radius, bubble,
    !token.consumed && !token.collected && !state.v3PocketSymbolCycle.lemon
    && !state.counterFlyIns.some((flyIn) => flyIn.kind === "lemon"));
  ctx.restore();
}

function drawStarBursts() {
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  state.starBursts.forEach((burst) => {
    const yellow = burst.theme === "yellow";
    const blue = burst.theme === "blue";
    const green = burst.theme === "green";
    const red = burst.theme === "red";
    const progress = Math.min(1, (now - burst.startedAt) / burst.duration);
    const alpha = Math.pow(1 - progress, 1.8);
    const flashRadius = 8 + progress * 24;
    const flash = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, flashRadius);
    flash.addColorStop(0, yellow ? `rgba(255, 244, 155, ${alpha * 0.92})`
      : green ? `rgba(195, 255, 192, ${alpha * 0.9})`
      : blue ? `rgba(205, 246, 255, ${alpha * 0.9})`
        : red ? `rgba(255, 205, 208, ${alpha * 0.9})` : `rgba(235, 196, 255, ${alpha * 0.9})`);
    flash.addColorStop(0.35, yellow ? `rgba(255, 211, 61, ${alpha * 0.58})`
      : green ? `rgba(55, 234, 78, ${alpha * 0.55})`
      : blue ? `rgba(106, 218, 255, ${alpha * 0.55})`
        : red ? `rgba(255, 78, 91, ${alpha * 0.55})` : `rgba(202, 104, 255, ${alpha * 0.55})`);
    flash.addColorStop(1, yellow ? "rgba(255, 190, 20, 0)" : green
      ? "rgba(55, 234, 78, 0)" : blue
      ? "rgba(106, 218, 255, 0)" : red ? "rgba(255, 78, 91, 0)" : "rgba(202, 104, 255, 0)");
    if (yellow) {
      drawStarPath(burst.x, burst.y, flashRadius, flashRadius * 0.42);
    } else {
      drawDiamondPath(burst.x, burst.y, flashRadius);
    }
    ctx.fillStyle = flash;
    ctx.fill();

    burst.particles.forEach((particle) => {
      const distance = particle.speed * progress;
      const x = burst.x + Math.cos(particle.angle) * distance;
      const y = burst.y + Math.sin(particle.angle) * distance;
      const size = particle.size * (1 - progress * 0.55);
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fillStyle = yellow ? `rgba(255, 218, 61, ${alpha})` : green
        ? `rgba(76, 241, 92, ${alpha})` : blue
        ? `rgba(123, 222, 255, ${alpha})` : red
          ? `rgba(255, 92, 100, ${alpha})` : `rgba(213, 122, 255, ${alpha})`;
      ctx.fill();
    });
  });
  ctx.restore();
}

function animateStarBursts() {
  state.starEffectFrame = null;
  if (window.BalloroGameLifecycle?.suspended) return;
  if (!state.animationsEnabled) return;
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  state.starBursts = state.starBursts.filter((burst) => now - burst.startedAt < burst.duration);
  if (!state.running) {
    render();
  }
  if (state.starBursts.length > 0) {
    state.starEffectFrame = requestAnimationFrame(animateStarBursts);
  }
}

// Counter fly-in animation experiment. Remove this block to roll back the visual
// pickup-to-counter motion without touching bonus math.
function getPendingCounterFlyInCount(kind) {
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  return state.counterFlyIns.filter((flyIn) => flyIn.kind === kind && now - flyIn.startedAt < flyIn.duration).length;
}

function getCanvasRelativeCenter(element) {
  if (!element || !els.canvas) {
    return null;
  }
  const elementRect = element.getBoundingClientRect();
  const canvasRect = els.canvas.getBoundingClientRect();
  if (!elementRect.width || !elementRect.height || !canvasRect.width || !canvasRect.height) {
    return null;
  }
  return {
    x: elementRect.left + elementRect.width / 2 - canvasRect.left,
    y: elementRect.top + elementRect.height / 2 - canvasRect.top
  };
}

function getCrownCounterTargetPoint(index) {
  const slots = Array.from(els.crownCounter?.children || []);
  if (!slots.length) {
    return null;
  }
  const requiredStars = getRequiredStars();
  const targetIndex = clamp(index, 0, Math.max(0, requiredStars - 1));
  return getCanvasRelativeCenter(slots[targetIndex]);
}

function getMultiPlusCounterTargetPoint(index = 0) {
  return getCanvasRelativeCenter(els.multiPlusCounter?.querySelectorAll(".v2-lemon-slots .v2-lemon")[index]
    || els.multiPlusCounter?.querySelector(".multi-plus-icon"));
}

function recordV2PocketPickup(kind, x, y, radius, onArrival = null) {
  if (!window.BalloroBonusUI?.isV2) return false;
  const floating = POCKET_SYMBOL_FLOAT_ENABLED && window.BalloroBonusUI?.isV4;
  const previous = state.v2BonusProgress[kind];
  const target = kind === "diamond" ? getCrownCounterTargetPoint(previous)
    : kind === "lemon" ? getMultiPlusCounterTargetPoint(previous)
      : kind === "blue" ? getCanvasRelativeCenter(els.pocketBonusCounter?.querySelector(".v2-blue-symbol"))
        : getCanvasRelativeCenter(els.chanceBonusCounter?.querySelectorAll(".v2-crown-slots .v2-crown")[previous]);
  const activated = previous + 1 >= V2_BONUS_THRESHOLDS[kind];
  const refreshCounters = () => {
    updateCrownCounter();
    updateChanceBonusCounter();
    updateMultiPlusCounter();
    updatePocketBonusCounter();
  };
  const flashCounter = () => {
    const counter = kind === "diamond" ? els.crownCounter?.closest(".crown-bonus-counter")
      : kind === "lemon" ? els.multiPlusCounter
        : kind === "crown" ? els.chanceBonusCounter : els.pocketBonusCounter;
    if (counter) {
      counter.classList.remove("v2-meter-arrival");
      void counter.offsetWidth;
      counter.classList.add("v2-meter-arrival");
      setTimeout(() => counter.classList.remove("v2-meter-arrival"), 430);
    }
  };
  let arrived = false;
  const complete = () => {
    if (arrived) return;
    arrived = true;
    const awarded = claimV2BonusSymbol(kind);
    onArrival?.(awarded);
    refreshCounters();
    if (!floating) flashCounter();
  };
  if (floating) {
    // Visual meter state only: the original activation callback still runs
    // on its existing clock, independently of this longer floating symbol.
    state.v2BonusArrivedActive[kind] = true;
    refreshCounters();
    flashCounter();
  }
  if (!spawnCounterFlyIn(kind, toScreen(x, y), target, radius, complete, { floating })) complete();
  spawnStarBurst({ x, y, radius }, kind === "lemon" ? "yellow"
    : kind === "blue" ? "green" : kind === "crown" ? "red" : "purple");
  return activated;
}

function startCounterFlyInAnimation() {
  if (state.counterFlyInFrame === null) {
    state.counterFlyInFrame = requestAnimationFrame(animateCounterFlyIns);
  }
}

function createCounterFlyInElement(kind) {
  if (!els.counterFlyInLayer) {
    return null;
  }
  const element = document.createElement("span");
  element.className = `counter-flyin-symbol ${kind === "diamond" ? "is-diamond" : kind === "lemon" ? "is-lemon" : kind === "crown" ? "is-crown" : kind === "blue" ? "is-blue" : "is-star"}`;
  element.style.width = "1px";
  element.style.height = "1px";
  element.style.opacity = "0";
  element.style.transform = "translate3d(-1000px, -1000px, 0)";
  element.innerHTML = kind === "lemon"
    ? '<img src="assets/duckies-star.svg?v=20261004-symmetric" alt="">'
    : kind === "crown"
    ? '<img src="assets/duckies-fire.png" alt="">'
    : kind === "diamond"
    ? '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="boost-diamond-outer" d="M9 35L28 9H72L91 35L50 91Z"/><path class="boost-diamond-body" d="M11 35L29 12H71L89 35L50 87Z"/><path class="boost-diamond-facets" d="M11 35H89M29 12L50 35L71 12M11 35L50 87L89 35"/></svg>'
    : kind === "blue"
    ? '<img src="assets/duckies-cactus.svg" alt="">'
    : '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="multi-plus-star-body" d="M47.6 17.58Q50 12 52.4 17.58L59.17 33.29Q60.27 35.86 63.06 36.12L80.09 37.7Q86.14 38.26 81.57 42.27L68.73 53.56Q66.62 55.4 67.24 58.13L71 74.81Q72.34 80.74 67.11 77.64L52.4 68.91Q50 67.48 47.6 68.91L32.89 77.64Q27.66 80.74 29 74.81L32.76 58.13Q33.38 55.4 31.27 53.56L18.43 42.27Q13.86 38.26 19.91 37.7L36.94 36.12Q39.73 35.86 40.83 33.29Z"/></svg>';
  els.counterFlyInLayer.append(element);
  return element;
}

function removeCounterFlyInElement(flyIn) {
  flyIn?.element?.remove();
  if (flyIn) flyIn.element = null;
}

function clearCounterFlyIns(kind = null) {
  state.counterFlyIns = state.counterFlyIns.filter((flyIn) => {
    if (kind && flyIn.kind !== kind) {
      return true;
    }
    removeCounterFlyInElement(flyIn);
    return false;
  });
}

function spawnCounterFlyIn(kind, source, target, sourceSize, onComplete = null, { floating = false } = {}) {
  if (!state.animationsEnabled || !source || (!target && !floating)) {
    return null;
  }
  const targetSize = kind === "diamond" ? 13 : 12;
  const flyIn = {
    kind,
    source,
    target: target || source,
    sourceSize,
    // The yellow pocket uses a smaller collision token. Grow its star during
    // the lift so the flight starts at the same visual size as other symbols.
    liftSize: window.BalloroBonusUI?.isV2 && kind === "lemon"
      ? Math.max(sourceSize, state.field.puckRadius) : sourceSize,
    targetSize,
    startedAt: (window.BalloroGameLifecycle?.now() ?? performance.now()),
    holdDuration: window.BalloroBonusUI?.isV2 ? 315 : COUNTER_PICKUP_HOLD_DURATION_MS,
    flightDuration: window.BalloroBonusUI?.isV2 ? 300 : COUNTER_FLY_IN_DURATION_MS,
    duration: window.BalloroBonusUI?.isV2 ? 615
      : COUNTER_PICKUP_HOLD_DURATION_MS + COUNTER_FLY_IN_DURATION_MS,
    element: createCounterFlyInElement(kind),
    onComplete
  };
  if (floating) {
    const rules = window.BalloroV3Rules;
    const greenMultiplier = window.BalloroV4Rules.rings[GRID_SIZE].at(-1);
    flyIn.floating = true;
    flyIn.completionDelay = flyIn.duration;
    // Use an ordinary green result's clock, never the winner's bonus/music hold.
    flyIn.floatResult = { stopped: true, resultRevealStartedAt: flyIn.startedAt,
      result: { multiplier: greenMultiplier } };
    flyIn.duration = rules.resultDelayMs + rules.resultFadeMs
      * (0.9 + 0.13 * Math.log2(1 + greenMultiplier));
    flyIn.element?.classList.add('is-pocket-float');
  }
  syncCounterFlyInElement(flyIn, flyIn.startedAt);
  state.counterFlyIns.push(flyIn);
  startCounterFlyInAnimation();
  return flyIn;
}

function getCounterFlyInMotion(flyIn, now) {
  if (flyIn.floating) return getPocketSymbolFloatMotion(flyIn, now);
  const source = flyIn.source;
  const elapsed = Math.max(0, now - flyIn.startedAt);
  const v2Icon = window.BalloroBonusUI?.isV2;
  const holdLift = v2Icon ? Math.max(38, state.field.puckRadius * 2.15)
    : Math.max(22, state.field.puckRadius * 1.2);
  if (elapsed < flyIn.holdDuration) {
    const holdProgress = clamp(elapsed / flyIn.holdDuration, 0, 1);
    const riseProgress = clamp(holdProgress / (v2Icon ? 0.58 : 0.3), 0, 1);
    const riseEased = 1 - Math.pow(1 - riseProgress, 3);
    const jumpOvershoot = Math.sin(riseProgress * Math.PI) * 0.12;
    const hover = holdProgress > 0.3
      ? Math.sin((holdProgress - 0.3) / 0.7 * Math.PI * 2) * 1.4
      : 0;
    const liftedSize = flyIn.liftSize * (v2Icon ? 1.35 : 2);
    return {
      x: source.x,
      y: source.y - holdLift * (riseEased + jumpOvershoot) - hover,
      size: flyIn.sourceSize + (liftedSize - flyIn.sourceSize) * riseEased,
      alpha: 1,
      rotationDegrees: flyIn.kind === "multiPlus" ? Math.sin(holdProgress * Math.PI * 2) * 6 : 0
    };
  }

  const progress = clamp((elapsed - flyIn.holdDuration) / flyIn.flightDuration, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const flightStartY = source.y - holdLift;
  const x = source.x + (flyIn.target.x - source.x) * eased;
  const y = flightStartY + (flyIn.target.y - flightStartY) * eased;
  const arcLift = Math.sin(progress * Math.PI) * Math.max(18, state.field.puckRadius * 1.1);
  const startSize = flyIn.liftSize * (v2Icon ? 1.35 : 2);
  const size = startSize + (flyIn.targetSize - startSize) * eased;
  const pop = 1 + Math.sin(progress * Math.PI) * 0.1;
  return {
    x,
    y: y - arcLift,
    size: size * pop,
    alpha: progress < 0.9 ? 1 : clamp(1 - (progress - 0.9) / 0.1, 0, 1),
    rotationDegrees: flyIn.kind === "multiPlus" ? progress * 44 : 0
  };
}

function getPocketSymbolFloatMotion(symbol, now) {
  const elapsed = Math.max(0, now - symbol.startedAt);
  const progress = clamp(elapsed / RESULT_BOOST_REVEAL_DURATION_MS, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const rise = Math.max(0, elapsed - window.BalloroV3Rules.resultDelayMs) * 0.012;
  return {
    x: symbol.source.x,
    y: symbol.source.y - 34 + (1 - eased) * 26 - rise,
    size: 18 * (state.field.width <= 720 ? 1.16 : 1),
    alpha: progress * getV3MultiplierFade(symbol.floatResult, now),
    rotationDegrees: 0
  };
}

function syncCounterFlyInElement(flyIn, now) {
  if (!flyIn.element) return;
  const motion = getCounterFlyInMotion(flyIn, now);
  const diameter = Math.max(8, motion.size * 2);
  flyIn.element.style.width = `${diameter}px`;
  flyIn.element.style.height = `${diameter}px`;
  flyIn.element.style.opacity = String(motion.alpha);
  flyIn.element.style.transform = `translate3d(${motion.x}px, ${motion.y}px, 0) translate(-50%, -50%) rotate(${motion.rotationDegrees}deg)`;
}

function drawCounterFlyInDiamond(x, y, size, alpha) {
  const strokeWidth = Math.max(2.4, size * 0.24);
  ctx.save();
  ctx.globalAlpha *= alpha;
  const glow = ctx.createRadialGradient(x, y, size * 0.18, x, y, size * 1.9);
  glow.addColorStop(0, "rgba(238, 207, 255, 0.34)");
  glow.addColorStop(0.42, "rgba(202, 104, 255, 0.18)");
  glow.addColorStop(1, "rgba(202, 104, 255, 0)");
  ctx.beginPath();
  ctx.arc(x, y, size * 1.9, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  drawDiamondPath(x, y, size);
  ctx.lineWidth = strokeWidth + 1.8;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.shadowColor = "rgba(218, 142, 255, 0.52)";
  ctx.shadowBlur = size * 0.78;
  drawDiamondPath(x, y, size);
  ctx.fillStyle = "rgba(214, 171, 255, 0.98)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "rgba(213, 122, 255, 0.98)";
  ctx.stroke();
  drawDiamondFacets(x, y, size, "rgba(244, 213, 255, 0.74)");
  ctx.restore();
}

function drawCounterFlyInStar(x, y, size, alpha, rotation) {
  const inner = size * 0.46;
  const strokeWidth = Math.max(2.4, size * 0.24);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const glow = ctx.createRadialGradient(0, 0, size * 0.12, 0, 0, size * 2.05);
  glow.addColorStop(0, "rgba(255, 244, 155, 0.42)");
  glow.addColorStop(0.46, "rgba(255, 198, 20, 0.18)");
  glow.addColorStop(1, "rgba(255, 198, 20, 0)");
  ctx.beginPath();
  ctx.arc(0, 0, size * 2.05, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  drawStarPath(0, 0, size, inner);
  ctx.lineWidth = strokeWidth + 1.8;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.shadowColor = "rgba(255, 215, 45, 0.76)";
  ctx.shadowBlur = size * 1.05;
  drawStarPath(0, 0, size, inner);
  ctx.fillStyle = "rgba(255, 235, 128, 0.98)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = "rgba(255, 198, 20, 0.98)";
  ctx.stroke();
  ctx.restore();
}

function drawCounterFlyIns() {
  if (!state.counterFlyIns.length || !state.animationsEnabled) {
    return;
  }
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  state.counterFlyIns.forEach((flyIn) => {
    const motion = getCounterFlyInMotion(flyIn, now);
    if (flyIn.kind === "diamond") {
      drawCounterFlyInDiamond(motion.x, motion.y, motion.size, motion.alpha);
    } else {
      drawCounterFlyInStar(
        motion.x,
        motion.y,
        motion.size,
        motion.alpha,
        motion.rotationDegrees * Math.PI / 180
      );
    }
  });
  ctx.restore();
}

function animateCounterFlyIns() {
  state.counterFlyInFrame = null;
  if (window.BalloroGameLifecycle?.suspended) return;
  if (!state.animationsEnabled) return;
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  const callbacks = [];
  let completedFlyIn = false;
  state.counterFlyIns.forEach((flyIn) => syncCounterFlyInElement(flyIn, now));
  state.counterFlyIns = state.counterFlyIns.filter((flyIn) => {
    const elapsed = now - flyIn.startedAt;
    const active = elapsed < flyIn.duration;
    if (elapsed >= (flyIn.completionDelay ?? flyIn.duration)
      && typeof flyIn.onComplete === "function") {
      callbacks.push(flyIn.onComplete);
      flyIn.onComplete = null;
    }
    if (!active) {
      completedFlyIn = true;
      removeCounterFlyInElement(flyIn);
    }
    return active;
  });
  if (completedFlyIn) {
    updateCrownCounter();
    updateMultiPlusCounter();
    updateChanceBonusCounter();
  }
  if (callbacks.length) {
    callbacks.forEach((callback) => callback());
  }
  if (!state.running) {
    render();
  }
  if (state.counterFlyIns.length > 0) {
    state.counterFlyInFrame = requestAnimationFrame(animateCounterFlyIns);
  }
}

function hasVisibleCollectibles() {
  return state.bonusStars.some((star) => !star.collected)
    || Boolean(state.multiPlusToken && !state.multiPlusToken.collected)
    || (usesFieldPocketMechanics() && Boolean(state.fieldPocket || state.bluePocket));
}

function animateCollectibleIdle(timestamp = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  state.collectibleIdleFrame = null;
  if (window.BalloroGameLifecycle?.suspended) return;
  timestamp = window.BalloroGameLifecycle?.now() ?? timestamp;
  if (!state.animationsEnabled || state.running || !hasVisibleCollectibles()) {
    return;
  }
  if (timestamp - state.lastCollectibleIdleRenderAt >= COLLECTIBLE_IDLE_FRAME_INTERVAL_MS) {
    state.lastCollectibleIdleRenderAt = timestamp;
    render();
  }
  if (!state.running && hasVisibleCollectibles()) {
    state.collectibleIdleFrame = requestAnimationFrame(animateCollectibleIdle);
  }
}

function startCollectibleIdleAnimation() {
  if (window.BalloroGameLifecycle?.suspended) return;
  if (!state.animationsEnabled || state.running || !hasVisibleCollectibles()) {
    return;
  }
  if (state.collectibleIdleFrame === null) {
    state.collectibleIdleFrame = requestAnimationFrame(animateCollectibleIdle);
  }
}

function animateResultReveal() {
  state.resultRevealFrame = null;
  if (window.BalloroGameLifecycle?.suspended) return;
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  if (window.BalloroBonusUI?.isV3) finishV3ChancePresentation(now);
  const revealDuration = window.BalloroBonusUI?.isV3
    ? window.BalloroV3Rules.resultDelayMs + window.BalloroV3Rules.resultFadeMs
    : RESULT_BOOST_REVEAL_DURATION_MS;
  const fieldRevealActive = state.multiPlusActive
    && state.multiPlusActivatedAt > 0
    && now - state.multiPlusActivatedAt < RESULT_BOOST_REVEAL_DURATION_MS;
  const revealActive = Boolean(playControls?.pause.active) || resumedWinPresentation.size > 0 || now - bigWinEffect.startedAt < BIG_WIN_DURATION_MS || fieldRevealActive
    || (window.BalloroBonusUI?.isV3 && state.pucks.some((puck) => puck.stopped
      && (getV3PuckFade(puck, now) > 0 || getV3MultiplierFade(puck, now) > 0)))
    || state.pucks.some((puck) => puck.result?.multiplier > 0
    && (now - (puck.resultRevealStartedAt || 0) < revealDuration
      || now - (puck.result.boostRevealStartedAt || 0) < RESULT_BOOST_REVEAL_DURATION_MS));
  if (!state.running && (!playControls?.pause.active || now - (playControls.pause.lastRenderAt || 0) >= 50)) {
    if (playControls?.pause.active) playControls.pause.lastRenderAt = now;
    render();
  }
  if (revealActive) {
    state.resultRevealFrame = requestAnimationFrame(animateResultReveal);
  }
}

function startResultRevealAnimation() {
  if (window.BalloroGameLifecycle?.suspended) return;
  if (!state.animationsEnabled) {
    render();
    return;
  }
  if (state.resultRevealFrame === null) {
    state.resultRevealFrame = requestAnimationFrame(animateResultReveal);
  }
}

function getMultiplierRevealMotion(startedAt, endY, col = -1, row = -1) {
  if (!state.animationsEnabled || !startedAt) return { y: endY, alpha: 1 };
  const elapsed = (window.BalloroGameLifecycle?.now() ?? performance.now()) - startedAt;
  if (state.multiPlusPhase === "revealing") {
    return { y: endY, alpha: 0 };
  }
  const progress = clamp(elapsed / RESULT_BOOST_REVEAL_DURATION_MS, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  return { y: endY + (1 - eased) * 26, alpha: progress };
}

function drawMultiPlusRoomsBlinkVisual(now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (state.multiPlusPhase !== "revealing" || !state.multiPlusActivatedAt) return;
  if (!state.multiPlusNeonCells.length) return;
  const { half, grid } = state.field;
  const chasing = now - state.multiPlusRevealStartedAt < MULTI_PLUS_NEON_DURATION_MS;
  const flash = now < state.multiPlusNeonFlashUntil;
  const pulse = 0.62 + Math.sin(now / 58) * 0.22;

  state.multiPlusNeonCells.forEach((cell, index) => {
    // Recorded EX MULTI chases can predate the green pocket's placement rule.
    // Never paint a yellow cell underneath a still-visible green pocket.
    if (window.BalloroBonusUI?.isV3 && getCellMultiplier(cell.col, cell.row) <= 0) return;
    if (isBluePocketCoveringCell(cell)) return;
    const center = toScreen(
      -half + grid * (cell.col + 0.5),
      -half + grid * (cell.row + 0.5)
    );
    const glowColor = flash ? "rgba(255,255,255,0.98)" : "rgba(255, 214, 52, 0.98)";

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = chasing ? clamp(pulse + (index % 3) * 0.08, 0.5, 1) : 1;
    drawCell(
      cell.col,
      cell.row,
      flash ? "rgba(255,255,255,0.34)" : "rgba(255, 193, 24, 0.12)",
      glowColor,
      flash ? 4 : 2
    );
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontSize = Math.max(11, Math.min(42, grid * 0.42));
    const purple = isX10VisualActive();
    const displayedMultiplier = cell.multiplier * (purple ? 10 : 1);
    const hasTopSymbol = hasV4MainMultiplierTopSymbol(cell.col, cell.row, displayedMultiplier);
    applyV4MultiplierBounce(center, hasTopSymbol);
    ctx.font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
    const multiplierColor = purple ? getBonusMultiplierColor(cell.multiplier) : getMultiplierColor(cell.multiplier, true);
    ctx.fillStyle = multiplierColor;
    ctx.shadowColor = multiplierColor;
    ctx.shadowBlur = flash ? 26 : 14 + pulse * 12;
    drawStyledMultiplierText(ctx, "fillText", getFieldMultiplierText(displayedMultiplier, "multi_plus"), center.x, center.y);
    if (hasTopSymbol) {
      drawChanceMultiplierCrown("main", center, fontSize, multiplierColor, purple);
    }
    ctx.restore();
  });
}

function spawnStarBurst(star, theme = "purple") {
  if (!state.animationsEnabled) return;
  const point = toScreen(star.x, star.y);
  state.starBursts.push({
    x: point.x,
    y: point.y,
    startedAt: (window.BalloroGameLifecycle?.now() ?? performance.now()),
    duration: 430,
    theme,
    particles: Array.from({ length: 10 }, (_, index) => ({
      angle: (index / 10) * Math.PI * 2 + randomBetween(-0.18, 0.18),
      speed: randomBetween(18, 34),
      size: randomBetween(1.4, 2.8)
    }))
  });
  if (state.starEffectFrame === null && !window.BalloroGameLifecycle?.suspended) {
    state.starEffectFrame = requestAnimationFrame(animateStarBursts);
  }
}

const winningTextLayers = new Map();

function drawWinningTextLayer(text, x, y, color, font, outlineColor, outlineWidth, outerOutlineColor) {
  const ratio = window.devicePixelRatio || 1;
  const key = JSON.stringify([text, color, font, outlineColor, outlineWidth, outerOutlineColor, ratio]);
  let layer = winningTextLayers.get(key);
  if (!layer) {
    ctx.save();
    ctx.font = font;
    const metrics = ctx.measureText(text);
    ctx.restore();
    const fontSize = Number.parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] || "30");
    const padding = Math.ceil(outlineWidth + 6 + 28);
    const width = Math.ceil(Math.max(metrics.width,
      2 * Math.max(metrics.actualBoundingBoxLeft || 0, metrics.actualBoundingBoxRight || 0)) + padding * 2);
    const height = Math.ceil(fontSize * 2 + padding * 2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * ratio);
    canvas.height = Math.ceil(height * ratio);
    const paint = canvas.getContext("2d");
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint.font = font;
    paint.textAlign = "center";
    paint.textBaseline = "middle";
    paint.lineJoin = "round";
    const drawText = (method) => {
      if (window.BalloroMultiplierStyle) window.BalloroMultiplierStyle.draw(paint, method, text, width / 2, height / 2);
      else paint[method](text, width / 2, height / 2);
    };
    if (outerOutlineColor) {
      paint.lineWidth = outlineWidth + 6;
      paint.strokeStyle = outerOutlineColor;
      drawText("strokeText");
    }
    paint.lineWidth = outlineWidth;
    paint.strokeStyle = outlineColor;
    drawText("strokeText");
    // Flatten opaque fill and outlines before applying the reveal/fade alpha.
    // Otherwise each translucent pass exposes the stroke inside the glyphs.
    paint.fillStyle = withColorAlpha(color, 1);
    paint.shadowColor = outerOutlineColor ? withColorAlpha(color, 0.82) : "rgba(0, 0, 0, 0)";
    paint.shadowBlur = outerOutlineColor ? 14 : 0;
    drawText("fillText");
    layer = { canvas, width, height };
    if (winningTextLayers.size >= 64) winningTextLayers.delete(winningTextLayers.keys().next().value);
    winningTextLayers.set(key, layer);
  }
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0)";
  ctx.shadowBlur = 0;
  ctx.drawImage(layer.canvas, x - layer.width / 2, y - layer.height / 2, layer.width, layer.height);
  ctx.restore();
}

function drawResultOverlay({ glows = true, text = true } = {}) {
  const bonusVisualActive = isX10VisualActive();
  if (!window.BalloroBonusUI?.isV3 && state.roundOutcome?.bonus_triggered && !bonusVisualActive) return;

  const getWinningTextMetrics = (text, font) => {
    ctx.save();
    ctx.font = font;
    const measured = ctx.measureText(text);
    const fontSize = Number.parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] || "30");
    const textWidth = (measured.actualBoundingBoxLeft || 0) + (measured.actualBoundingBoxRight || 0)
      || measured.width;
    const textHeight = (measured.actualBoundingBoxAscent || 0) + (measured.actualBoundingBoxDescent || 0)
      || fontSize * 0.82;
    const width = textWidth + 28;
    const height = fontSize * 1.35;
    ctx.restore();
    return {
      width,
      height,
      collisionWidth: textWidth,
      collisionHeight: Math.max(fontSize * 0.72, textHeight * 0.92)
    };
  };

  const drawWinningGlow = (text, x, y, color, font, bonusGlow = false) => {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const { width, height } = getWinningTextMetrics(text, font);
    const mobileGlowScale = state.field.width <= 720 ? 1.16 : 1;
    const glowRadius = Math.max(width * 0.88, height * 1.52) * mobileGlowScale;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, glowRadius);
    glow.addColorStop(0, bonusGlow ? "rgba(214, 171, 255, 0.68)" : withColorAlpha(color, 0.5));
    glow.addColorStop(0.5, bonusGlow ? "rgba(142, 63, 190, 0.3)" : withColorAlpha(color, 0.2));
    glow.addColorStop(1, bonusGlow ? "rgba(112, 42, 153, 0)" : withColorAlpha(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
    ctx.restore();
  };

  const drawWinningText = (text, x, y, color, font, outlineColor = "rgba(0, 0, 0, 0.92)", outlineWidth = 6, outerOutlineColor = null) => {
    drawWinningTextLayer(text, x, y, color, font, outlineColor, outlineWidth, outerOutlineColor);
  };

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const resultPucks = getPresentationPucks().filter((puck) => puck.result?.multiplier > 0);
  const getRevealMotion = (puck, point) => {
    if (window.BalloroBonusUI?.isV3) {
      const held = isBigWinHeld(puck);
      const releasedAt = resumedWinPresentation.get(puck);
      if (!held && releasedAt !== undefined) {
        return { y: point.y - 34 - Math.max(0, (window.BalloroGameLifecycle?.now() ?? performance.now()) - releasedAt) * 0.012, alpha: getResumedWinAlpha(puck) };
      }
      const now = held ? Math.min((window.BalloroGameLifecycle?.now() ?? performance.now()), puck.resultRevealStartedAt + RESULT_BOOST_REVEAL_DURATION_MS) : (window.BalloroGameLifecycle?.now() ?? performance.now());
      const fade = held ? 1 : getV3MultiplierFade(puck);
      const progress = !state.animationsEnabled || !puck.resultRevealStartedAt ? 1
        : clamp((now - puck.resultRevealStartedAt)
          / RESULT_BOOST_REVEAL_DURATION_MS, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const rise = held || !state.animationsEnabled || !puck.resultRevealStartedAt ? 0
        : Math.max(0, now - puck.resultRevealStartedAt - window.BalloroV3Rules.resultDelayMs)
          * 0.012;
      return {
        y: point.y - 34 + (1 - eased) * 26 - rise,
        alpha: progress * fade
      };
    }
    const endY = point.y - 34;
    if (!state.animationsEnabled || !puck.resultRevealStartedAt) return { y: endY, alpha: 1 };
    const progress = clamp(((window.BalloroGameLifecycle?.now() ?? performance.now()) - puck.resultRevealStartedAt)
      / RESULT_BOOST_REVEAL_DURATION_MS, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    return { y: endY + (1 - eased) * 26, alpha: progress };
  };
  const getBoostRevealMotion = (puck, point) => {
    if (!state.animationsEnabled || !puck.result?.boostRevealStartedAt) return null;
    const elapsed = (window.BalloroGameLifecycle?.now() ?? performance.now()) - puck.result.boostRevealStartedAt;
    const progress = clamp(elapsed / RESULT_BOOST_REVEAL_DURATION_MS, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    return {
      progress,
      oldY: point.y - 34 + eased * 26,
      newY: point.y - 8 - eased * 26
    };
  };
  const resultItems = resultPucks
    .map((puck) => {
      const point = puck.chance && ["inside", "settled"].includes(puck.chance.phase)
        ? getChancePuckScreenPoint(puck)
        : toScreen(puck.x, puck.y);
      const reveal = getRevealMotion(puck, point);
      const boostReveal = getBoostRevealMotion(puck, point);
      const canUseBonusMultiplier = (window.BalloroBonusUI?.isV3
        ? puck.result.x10Boosted : (bonusVisualActive || puck.result.x10Boosted))
        && (!puck.result.secretRoom || puck.result.chanceRoom);
      const resultMultiplier = puck.result.multiplier * (canUseBonusMultiplier ? 10 : 1);
      const classification = classifyResult(resultMultiplier, puck.result.category);
      const resultText = getMultiplierText(resultMultiplier);
      const resultColor = puck.result.chanceRoom && !canUseBonusMultiplier
        ? getMultiplierColor(puck.result.multiplier)
        : puck.result.purpleBoost
        ? getBonusResultColor(Math.max(1, puck.result.multiplier / PURPLE_POCKET_MULTIPLIER))
        : canUseBonusMultiplier
        ? getBonusResultColor(puck.result.multiplier)
        : puck.result.secretRoom
          ? getBonusResultColor(getSecretRoomBaseMultiplier())
          : window.BalloroBonusUI?.isV3
            ? getV3FieldMultiplierColor(puck.result.col, puck.result.row, puck.result.multiplier)
            : getMultiplierColor(puck.result.multiplier);
      const mobileResultScale = state.field.width <= 720 ? 1.16 : 1;
      const baseFontSize = (classification.celebrate ? 30 : 23) * mobileResultScale;
      const fontSize = window.BalloroBonusUI?.isV3
        ? 36 * mobileResultScale
        : (canUseBonusMultiplier || puck.result.secretRoom || puck.result.purpleBoost) ? baseFontSize * 1.2 : baseFontSize;
      const font = `1000 ${fontSize}px Inter, system-ui, sans-serif`;
      const metrics = getWinningTextMetrics(resultText, font);
      return {
        puck,
        x: point.x,
        y: boostReveal?.newY ?? reveal.y,
        baseY: boostReveal?.newY ?? reveal.y,
        alpha: reveal.alpha
          * (isBigWinFlashing(puck)
            && state.animationsEnabled ? 0.35 + 0.65 * getBigWinPulse() : 1),
        resultMultiplier,
        resultText,
        resultColor,
        font,
        fontSize,
        winSymbol: window.BalloroBonusUI?.isV4 && Boolean(puck.result.topSymbol),
        purpleSymbol: puck.result.topSymbol === 'diamond',
        boostReveal: boostReveal ? {
          oldText: getMultiplierText(puck.result.multiplier),
          oldColor: getMultiplierColor(puck.result.multiplier),
          oldFont: window.BalloroBonusUI?.isV3
            ? font
            : `1000 ${(classification.celebrate ? 30 : 23) * mobileResultScale}px Inter, system-ui, sans-serif`,
          oldY: boostReveal.oldY,
          alpha: 1 - boostReveal.progress
        } : null,
        width: metrics.width,
        height: metrics.height,
        collisionWidth: metrics.collisionWidth,
        collisionHeight: metrics.collisionHeight,
        appearedAt: puck.resultRevealStartedAt || 0
      };
    })
    .sort((a, b) => a.appearedAt - b.appearedAt);

  const placedBounds = [];
  const stackGap = 1;
  resultItems.forEach((item) => {
    if (window.BalloroBonusUI?.isV3) return;
    let attempts = 0;
    while (attempts < 8) {
      const bounds = {
        left: item.x - item.collisionWidth / 2,
        right: item.x + item.collisionWidth / 2,
        top: item.y - item.collisionHeight / 2,
        bottom: item.y + item.collisionHeight / 2
      };
      const collision = placedBounds.find((placed) =>
        bounds.left < placed.right
        && bounds.right > placed.left
        && bounds.top < placed.bottom + stackGap
        && bounds.bottom > placed.top - stackGap);
      if (!collision) {
        placedBounds.push(bounds);
        break;
      }
      item.y = collision.top - item.collisionHeight / 2 - stackGap;
      attempts += 1;
    }
    if (item.boostReveal) item.boostReveal.oldY += item.y - item.baseY;
  });

  // Sort paint layers only, after the unchanged chronological placement.
  // During an x10 crossfade, each visible number uses its own displayed value.
  const resultLayers = resultItems.flatMap((item) => item.boostReveal ? [{
    ...item,
    resultMultiplier: item.puck.result.multiplier,
    resultText: item.boostReveal.oldText,
    resultColor: item.boostReveal.oldColor,
    font: item.boostReveal.oldFont,
    y: item.boostReveal.oldY,
    alpha: item.boostReveal.alpha,
    winSymbol: false,
    boostOld: true
  }, item] : [item])
    .sort((a, b) => a.resultMultiplier - b.resultMultiplier
      || a.appearedAt - b.appearedAt);

  if (glows) {
    resultLayers.forEach((item) => {
      ctx.save();
      ctx.globalAlpha = item.alpha;
      drawWinningGlow(item.resultText, item.x, item.y, item.resultColor, item.font,
        bonusVisualActive && !item.boostOld);
      ctx.restore();
    });
  }
  if (text) {
    resultLayers.forEach((item) => {
      const bonusOutline = bonusVisualActive && !item.boostOld;
      const outlineColor = bonusOutline ? "rgba(238, 202, 255, 0.98)" : "rgba(0, 0, 0, 0.92)";
      const outlineWidth = bonusOutline ? 2.5 : 6;
      const outerOutlineColor = bonusOutline ? "rgba(0, 0, 0, 0.94)" : null;
      ctx.save();
      ctx.globalAlpha = item.alpha;
      drawWinningText(item.resultText, item.x, item.y, item.resultColor, item.font,
        outlineColor, outlineWidth, outerOutlineColor);
      if (item.winSymbol) {
        // Same anchor, alpha, pulse, rise and fade as the floating number;
        // reuse field fire/diamond artwork without a separate idle animation.
        drawChanceMultiplierCrown("main", { x: item.x, y: item.y },
          item.fontSize, item.resultColor, item.purpleSymbol);
      }
      ctx.restore();
    });
  }
}

function classifyResult(multiplier, category = "") {
  if (multiplier <= 0) return { key: "miss", label: "MISS", color: "rgba(170, 176, 184, 0.98)", celebrate: false };
  if (multiplier < 1) return { key: "partial", label: "DEFLECT", color: "rgba(255, 94, 48, 0.98)", celebrate: false };
  if (Math.abs(multiplier - 1) < 1e-9) return { key: "push", label: "PUSH", color: "rgba(255, 174, 48, 0.98)", celebrate: false };
  const bigWin = category === "secret" || (state.riskLevel === "high" && category === "center");
  return { key: bigWin ? "big_win" : "win", label: bigWin ? "BIG WIN" : "WIN", color: null, celebrate: true };
}

// Snapshot the actual cell decoration at settlement, not the premium tier.
// Photo holds and later board restoration must not invent/change that symbol.
function captureResultCellSymbol(puck) {
  if (!window.BalloroBonusUI?.isV4 || !puck.result) return;
  const purple = isX10VisualActive();
  let decorated = false;
  if (puck.result.chanceRoom && puck.chance?.roomId) {
    const size = getChanceRoomGridSize();
    const col = clamp(Math.floor((puck.chance.u + 1) * size / 2), 0, size - 1);
    const row = clamp(Math.floor((puck.chance.v + 1) * size / 2), 0, size - 1);
    decorated = window.BalloroV4Rules.hasMultiplierFire(GRID_SIZE, col, row, puck.chance.roomId);
  } else {
    const { col, row } = getCellFromPoint(puck.x, puck.y);
    decorated = hasV4MainMultiplierTopSymbol(col, row,
      getDisplayedCellMultiplier(col, row) * (purple ? 10 : 1));
  }
  puck.result.topSymbol = decorated ? purple ? 'diamond' : 'fire' : null;
}

const BIG_WIN_DURATION_MS = 2600;
let bigWinEffect = { roundId: null, count: 0, startedAt: -Infinity, winners: new Set(), seenWinners: new Set(), boostedWinners: new Set(), voices: [] };

function getV3ResultFadeElapsed(puck, now) {
  const rules = window.BalloroV3Rules;
  const winnerHold = bigWinEffect.winners.has(puck)
    ? Math.max(0, bigWinEffect.startedAt + BIG_WIN_DURATION_MS - puck.resultRevealStartedAt) : 0;
  return now - puck.resultRevealStartedAt - Math.max(rules.resultDelayMs, winnerHold);
}

function getV3ResultFade(puck, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!puck.stopped || !puck.resultRevealStartedAt) return 1;
  return 1 - clamp(getV3ResultFadeElapsed(puck, now) / window.BalloroV3Rules.resultFadeMs, 0, 1);
}

function getV3PuckFade(puck, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!puck.stopped || !puck.resultRevealStartedAt) return 1;
  const ordinaryFieldWin = puck.result?.multiplier > 0 && !puck.result.secretRoom
    && !puck.result.x10Boosted && !bigWinEffect.winners.has(puck);
  const duration = window.BalloroV3Rules.resultFadeMs / (ordinaryFieldWin ? 4 : 2)
    / (window.BalloroBonusUI?.isV4 ? 2 : 1);
  return 1 - clamp(getV3ResultFadeElapsed(puck, now) / duration, 0, 1);
}

function getV3MultiplierFade(puck, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!puck.stopped || !puck.resultRevealStartedAt) return 1;
  if (!(puck.result?.multiplier > 0)) return getV3ResultFade(puck, now);
  const boosted = puck.result.x10Boosted
    && (!puck.result.secretRoom || puck.result.chanceRoom);
  const displayedMultiplier = puck.result.multiplier * (boosted ? 10 : 1);
  const duration = window.BalloroV3Rules.resultFadeMs
    * (0.9 + 0.13 * Math.log2(1 + displayedMultiplier));
  return 1 - clamp(getV3ResultFadeElapsed(puck, now) / duration, 0, 1);
}

function hasUnfinishedV3FieldReward(puck, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  // Purple retains its shortened reward hold. Floating labels, ball fades
  // and victory music keep their own timing independently of field returns.
  const fieldRewardNow = window.BalloroBonusUI?.isV4 && puck.resultRevealStartedAt
    ? puck.resultRevealStartedAt + (now - puck.resultRevealStartedAt) * 2 : now;
  return puck.result.multiplier > 0
    ? getV3MultiplierFade(puck, fieldRewardNow) > 0
    : getV3PuckFade(puck, fieldRewardNow) > 0;
}

function hasUnfinishedV3YellowReward(puck, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!window.BalloroBonusUI?.isV4) return hasUnfinishedV3FieldReward(puck, now);
  // Restore as soon as the result hold/victory cue ends, without waiting for
  // the floating multiplier to fade. Photo-held winners are retained above.
  return getV3ResultFadeElapsed(puck, now) < 0;
}

function hasUnfinishedV3PurpleReward(now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  return state.pucks.some((puck) => {
    if (!puck.v3PurpleBonus) return false;
    if (!puck.stopped || puck.waitingForPocket || puck.v3QueuePull
      || puck === state.multiPlusCapturedPuck || puck === state.chanceCapturedPuck
      || (puck.secretRoom && puck.secretRoom.phase !== "settled")
      || (puck.chance && puck.chance.phase !== "settled")
      || state.v3BonusQueue.some((entry) => entry.puck === puck)) return true;
    if (!puck.result) return false;
    return hasUnfinishedV3FieldReward(puck, now);
  });
}

function finishV3PurplePresentation(now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!window.BalloroBonusUI?.isV3 || !state.x10BoostActivated
    || hasUnfinishedV3PurpleReward(now)) return;
  // V4 now restores the board with the reverse cell sequence after rewards.
  if (window.BalloroBonusUI?.isV4) state.v4HeldPurpleField = false;
  state.x10BoostActivated = false;
  state.crownBonusAwarded = false;
  if (window.BalloroBonusUI?.isV4) getV3FieldSweep(now);
  updateBetButtons();
}

function stopBigWinSound() {
  bigWinEffect.voices.forEach((voice) => { try { voice.stop(); } catch (_) { /* already ended */ } });
  bigWinEffect.voices = [];
}

function playBigWinFanfare(level) {
  stopBigWinSound();
  if (state.soundEffectsMuted) return;
  duckBackgroundMusic(BIG_WIN_DURATION_MS);
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") audio.resume();
  const pitch = Math.pow(2, (Math.min(3, level) - 1) * 3 / 12);
  const notes = [0, 4, 7, 12, 7, 12, 16, 19, 24];
  notes.forEach((note, index) => {
    const start = audio.currentTime + index * 0.19;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 261.63 * pitch * Math.pow(2, note / 12);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.11, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
    oscillator.connect(gain);
    gain.connect(getAudioOutput(audio));
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + 0.7);
    bigWinEffect.voices.push(oscillator);
  });
}

function updateBigWinEffect(now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (bigWinEffect.roundId !== state.roundId && !window.BalloroBonusUI?.isV3) {
    stopBigWinSound();
    bigWinEffect = { roundId: state.roundId, count: 0, startedAt: -Infinity, winners: new Set(), seenWinners: new Set(), boostedWinners: new Set(), voices: [] };
  }
  state.pucks.forEach((puck) => {
    const result = puck.result;
    if (!puck.stopped || !result || result.multiplier <= 0) return;
    const previousWinner=bigWinEffect.seenWinners.has(puck);
    const boostEncore=previousWinner && result.x10Boosted && !bigWinEffect.boostedWinners.has(puck);
    if(previousWinner && !boostEncore)return;
    const premium = window.BalloroBonusUI?.isV3
      ? window.BalloroMultiplierPresentation.premium(result)
      : result.chanceRoom
      || (["outer", "middle", "center"].includes(result.category)
        && result.multiplier >= getMainFieldMaximumMultiplier());
    if (!premium && (window.BalloroBonusUI?.isV3 || !boostEncore)) return;
    if (window.BalloroBonusUI?.isV3 && now - bigWinEffect.startedAt >= BIG_WIN_DURATION_MS) {
      bigWinEffect.winners.clear();
      bigWinEffect.count = 0;
    }
    bigWinEffect.winners.add(puck);
    bigWinEffect.seenWinners.add(puck);
    if(result.x10Boosted)bigWinEffect.boostedWinners.add(puck);
    bigWinEffect.count += 1;
    bigWinEffect.startedAt = now;
    playControls?.bigWin(puck, playPreferences.pauseBigWin);
    if (playControls?.pause.active) updateBetButtons();
    playBigWinFanfare(Math.min(3, bigWinEffect.count));
    startResultRevealAnimation();
  });
}

function isBigWinFlashing(puck, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!puck) return false;
  if (isBigWinHeld(puck)) return true;
  const elapsed = now - bigWinEffect.startedAt;
  return bigWinEffect.winners.has(puck) && elapsed >= 0 && elapsed < BIG_WIN_DURATION_MS;
}

function getCellPresentationPucks() {
  // A timed celebration can outlive a ball's ordinary fade and live-list
  // pruning. Retain only its cell cue, not its ball or floating label.
  return [...new Set([...getPresentationPucks(), ...[...bigWinEffect.winners].filter(puck => isBigWinFlashing(puck))])];
}

function getMainWinningPresentationCells() {
  const cells = state.settledCells.slice();
  const represented = new Set(cells.map(cell => state.pucks[cell.puckIndex]));
  for (const puck of getCellPresentationPucks()) {
    if (!isBigWinFlashing(puck) || puck.result?.chanceRoom || puck.result?.secretRoom
      || represented.has(puck)) continue;
    cells.push({ ...getCellFromPoint(puck.x, puck.y), squareWin: true,
      purpleBoost: Boolean(puck.result.x10Boosted || puck.result.purpleBoost), presentationPuck: puck });
  }
  return cells;
}

function getBigWinPulse(now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  const elapsed = now - bigWinEffect.startedAt;
  if (playControls?.pause.active) {
    if (!state.animationsEnabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return 0.7;
    return 0.5 + 0.5 * Math.cos(elapsed / 1000 * Math.PI * 5);
  }
  if (!state.animationsEnabled || elapsed < 0 || elapsed >= BIG_WIN_DURATION_MS) return 0;
  return (0.5 + 0.5 * Math.cos(elapsed / 1000 * Math.PI * 5))
    * Math.min(1, (BIG_WIN_DURATION_MS - elapsed) / 350);
}

function getBigWinWallRoomIds() {
  return new Set([...new Set([...bigWinEffect.winners, ...(playControls?.pause.winners || [])])].map((puck) =>
    puck.result.chanceRoom ? puck.chance?.roomId : "main").filter(Boolean));
}

function isMainRedBigWinWallActive() {
  if (!MAIN_RED_BIG_WIN_WALLS_ENABLED || isX10VisualActive()
    || (!state.animationsEnabled && !playControls?.pause.active)) return false;
  return [...new Set([...bigWinEffect.winners, ...(playControls?.pause.winners || [])])]
    .some(puck => isBigWinFlashing(puck) && puck.result
      && !puck.result.chanceRoom && !puck.result.secretRoom
      && !puck.result.x10Boosted && !puck.result.purpleBoost);
}

function applyBigWinCellFlash(roomId, now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  const elapsed = now - bigWinEffect.startedAt;
  if ((!playControls?.pause.active && (!state.animationsEnabled || elapsed < 0 || elapsed >= BIG_WIN_DURATION_MS))
      || !getBigWinWallRoomIds().has(roomId)) return;
  const pulse = getBigWinPulse(now);
  ctx.globalAlpha *= 0.18 + pulse * 0.82;
  ctx.shadowColor = "#ffd54d";
  ctx.shadowBlur = 4 + pulse * 24;
}

function drawBigWinWalls() {
  const pulse = getBigWinPulse();
  if (!pulse) return;
  const half = state.field.half;
  const winningRooms = getBigWinWallRoomIds();
  const outlines = [];
  const purple = isX10VisualActive();
  if (winningRooms.has("main")) {
    outlines.push({ vertices: [toScreen(-half, -half), toScreen(half, -half),
      toScreen(half, half), toScreen(-half, half)], color: purple ? "#ca68ff" : "#ff4b4b", room: null });
  }
  CHANCE_ROOM_IDS.filter((id) => winningRooms.has(id)).forEach((id) => {
    const room = getChanceRoomGeometry(id);
    outlines.push({ vertices: room.vertices, color: purple ? "#ca68ff" : "#ff4b4b", room });
  });
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = pulse;
  ctx.lineWidth = 11;
  ctx.lineJoin = "round";
  ctx.shadowBlur = 42;
  outlines.forEach(({ vertices, color, room }) => {
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    if (room) traceChanceRoomVisibleBorder(room);
    else tracePolygon(vertices);
    ctx.stroke();
    ctx.save();
    ctx.lineWidth = 5;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawV4FieldSwitchFlash(now, active) {
  if (!window.BalloroBonusUI?.isV4) return false;
  if (v3LastFieldVisualState === null) v3LastFieldVisualState = active;
  if (active !== v3LastFieldVisualState) {
    v3LastFieldVisualState = active;
    v3FieldTransition = { startedAt: now };
  }
  if (!v3FieldTransition) return false;
  const progress = (now - v3FieldTransition.startedAt) / 160;
  if (progress >= 1 || !state.animationsEnabled) {
    v3FieldTransition = null;
    return false;
  }
  const { half } = state.field;
  const corners = [toScreen(-half, -half), toScreen(half, -half),
    toScreen(half, half), toScreen(-half, half)];
  ctx.save();
  ctx.globalAlpha = Math.pow(1 - progress, 2);
  ctx.lineJoin = "round";
  ctx.lineWidth = 15;
  ctx.strokeStyle = active ? "#c76aff" : "#35ee88";
  ctx.shadowBlur = 0;
  traceRoundedPolygon(corners, Math.max(8, state.field.grid * .08));
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#fff1ff";
  ctx.stroke();
  ctx.restore();
  return true;
}

function getV3FieldSweep(now, frozenSnapshot = false) {
  if (!window.BalloroBonusUI?.isV3) return null;
  if (frozenSnapshot) {
    // Read the last transition only: a resize snapshot must not initiate a
    // transition/sound, clear a bonus or schedule another animation frame.
    if (!v3FieldTransition) return null;
    const duration = v3FieldTransition.vertical
      ? (v3FieldTransition.to ? V4_PURPLE_FIELD_ENTER_MS : V4_PURPLE_FIELD_EXIT_MS) : V3_FIELD_SWEEP_MS;
    const progress = clamp((now - v3FieldTransition.startedAt) / duration, 0, 1);
    return progress >= 1 ? null : { ...v3FieldTransition,
      progress: v3FieldTransition.vertical ? progress : progress * progress * (3 - 2 * progress) };
  }
  const active = isX10VisualActive();
  if (window.BalloroBonusUI?.isV4 && v3LastFieldVisualState !== null
    && active !== v3LastFieldVisualState) {
    const audio = state.audioContext;
    window.BalloroBonusSound?.transition(audio, audio ? getAudioOutput(audio) : null,
      active, state.soundEffectsMuted);
  }
  if (window.BalloroBonusUI?.isV4 && !state.animationsEnabled) {
    v3LastFieldVisualState = active;
    v3FieldTransition = null;
    return null;
  }
  if (v3LastFieldVisualState === null) v3LastFieldVisualState = active;
  if (active !== v3LastFieldVisualState) {
    v3FieldTransition = { from: v3LastFieldVisualState, to: active, startedAt: now };
    if (window.BalloroBonusUI?.isV4) {
      const half = state.field.half;
      const ys = [toScreen(-half, -half).y, toScreen(half, half).y,
        ...CHANCE_ROOM_IDS.flatMap(id => getChanceRoomGeometry(id).vertices.map(point => point.y))];
      Object.assign(v3FieldTransition, { vertical: true, top: Math.min(...ys), bottom: Math.max(...ys) });
    }
    v3LastFieldVisualState = active;
  }
  if (!v3FieldTransition) return null;
  const duration = v3FieldTransition.vertical
    ? (v3FieldTransition.to ? V4_PURPLE_FIELD_ENTER_MS : V4_PURPLE_FIELD_EXIT_MS)
    : V3_FIELD_SWEEP_MS;
  const raw = clamp((now - v3FieldTransition.startedAt) / duration, 0, 1);
  if (raw >= 1) {
    v3FieldTransition = null;
    if (window.BalloroBonusUI?.isV4) updateBetButtons();
    return null;
  }
  return { ...v3FieldTransition, progress: v3FieldTransition.vertical ? raw : raw * raw * (3 - 2 * raw) };
}

function getV4PointSwitchStep(sweep, y) {
  const position = clamp((y - sweep.top) / Math.max(1, sweep.bottom - sweep.top), 0, 1);
  return 0.04 + (sweep.to ? position : 1 - position) * 0.88;
}

function getV4PointVisualActive(sweep, y) {
  return sweep.progress >= getV4PointSwitchStep(sweep, y) ? sweep.to : sweep.from;
}

function drawV4CellSwitchFlash(sweep, y, trace) {
  const elapsed = sweep.progress - getV4PointSwitchStep(sweep, y);
  if (elapsed < 0 || elapsed >= 0.08) return;
  ctx.save();
  ctx.globalAlpha = (1 - elapsed / 0.08) * 0.85;
  ctx.shadowBlur = 0;
  trace();
  ctx.fillStyle = sweep.to ? "#b85cff" : "#35ee88";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f4eaff";
  ctx.stroke();
  ctx.restore();
}

function getV3CellVisualActive(sweep, col, row) {
  if (!sweep) return isX10VisualActive();
  if (sweep.vertical) {
    const { half, grid } = state.field;
    return getV4PointVisualActive(sweep,
      toScreen(-half + (col + 0.5) * grid, -half + (row + 0.5) * grid).y);
  }
  const mid = (GRID_SIZE - 1) / 2;
  const ring = Math.max(Math.abs(col - mid), Math.abs(row - mid));
  const maxRing = Math.ceil(mid);
  const step = sweep.to ? ring : maxRing - ring;
  const changed = sweep.progress >= (step + 0.5) / (maxRing + 1);
  return changed ? sweep.to : sweep.from;
}

function updateBonusReadySound(now) {
  if (!window.BalloroBonusUI?.isV4 || !window.BalloroBonusSound) return;
  const samples = state.pucks.map(puck => window.BalloroReadyBlink?.sample(puck, isPocketReadyPuck(puck), now));
  const blink = samples.find(sample => sample?.ready && sample.alpha === 1);
  const audio = state.audioContext;
  window.BalloroBonusSound.readyPulse(audio, audio ? getAudioOutput(audio) : null,
    blink, now, state.soundEffectsMuted || document.hidden);
}

function render({ frozenSnapshot = false } = {}) {
  const suspended = Boolean(window.BalloroGameLifecycle?.suspended);
  if (suspended && !frozenSnapshot) return;
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  const yellowReturning = !suspended && updateYellowFieldReturn(now);
  if (!suspended) updateBonusReadySound(now);
  const bonusGridActive = isX10VisualActive();
  document.body.classList.toggle("x10-visual-active", bonusGridActive);
  if (!suspended) {
    updateBigWinEffect();
    updatePocketBonusCounter();
    updateChanceBonusCounter();
  }
  const { half, grid } = state.field;
  const mergedMultiplierCells = buildMergedMultiplierCells();
  const sweep = getV3FieldSweep(now, suspended);
  drawField(true, sweep);
  drawYellowFieldReturn(now);
  drawMainFieldMultiplierLabels(mergedMultiplierCells, bonusGridActive, half, grid, sweep);
  const wallFlash = !window.BalloroBonusUI?.isV4 && drawV4FieldSwitchFlash(now, bonusGridActive);
  if (!suspended && (sweep || wallFlash || (yellowReturning && !state.running)) && v3FieldTransitionFrame === null) {
    v3FieldTransitionFrame = requestAnimationFrame(() => {
      v3FieldTransitionFrame = null;
      render();
    });
  }
  drawBigWinWalls();
  drawMultiPlusRoomsBlinkVisual();
  // Collectible symbols stay above field labels; moving pucks are drawn above every field layer.
  drawMultiPlusToken();
  drawBonusStar();
  drawStarBursts();
  drawLaunchPrimePreview();
  drawPucks();
  // The selected LUCKY SHOT launch ball must remain above both joined walls.
  drawChanceRoomLaunchPreview();
  // Result gradients sit above the puck surface but below their multiplier text.
  drawResultOverlay({ text: false });
  drawResultOverlay({ glows: false });
  drawPhysicsDebugOverlay();
  updatePhysicsDebug();
}

function updatePhysicsDebug() {
  if (!els.physicsDebug) return;
  els.physicsDebug.classList.toggle("hidden", !state.debugPhysics);
  if (!state.debugPhysics) return;
  const config = getMathConfiguration();
  const visualCollected = state.crownsCollected;
  const lines = [
    `config_id: ${config?.id || "-"}`,
    `risk: ${state.riskLevel}`,
    `lines: ${GRID_SIZE}`,
    `pucks: ${state.puckCount}`,
    `running: ${state.running}`,
    `active puck objects: ${state.pucks.length}`,
    `trajectory plans: ${state.trajectoryPlans.length}`,
    `puck phases: ${state.pucks.map((puck) => puck.chance?.phase || puck.secretRoom?.phase || (puck.stopped ? "stopped" : "field")).join(", ") || "none"}`,
    `chance pocket: ${state.chancePocket ? `${state.chancePocket.col}_${state.chancePocket.row}${state.chancePocket.forced ? " forced" : ""}` : "none"}`,
    `chance phase: ${state.chancePhase}`,
    `bonus expected: ${Boolean(state.roundOutcome?.bonus_triggered)}`,
    `bonus visually collected: ${visualCollected}/${getRequiredStars()}`
  ];
  state.trajectoryDiagnostics.forEach((item) => {
    lines.push(
      "",
      `puck ${item.puck_index + 1}`,
      ` trajectory_id: ${item.trajectory_id}`,
      ` target sector: ${item.target_sector.col}_${item.target_sector.row}`,
      ` actual sector: ${item.actual_sector ? `${item.actual_sector.col}_${item.actual_sector.row}` : "moving"}`,
      ` target category: ${item.target_category}`,
      ` final category: ${item.actual_category || "moving"}`,
      ` target multiplier: ${item.target_multiplier}x`,
      ` launch angle: ${item.launch_angle} deg`,
      ` launch force: ${item.launch_force}`,
      ` friction variant: ${item.friction_variant}`,
      ` duration: ${item.duration}s`,
      ` bounces: ${item.bounce_count}`,
      ` valid: ${item.valid}`,
      ` correction: ${item.final_correction_px}px`,
      ` final in cell: ${item.final_position_percent || "pending"}`,
      ` center distance: ${item.final_distance_to_center_px ?? "pending"}px`,
      ` recent usage: ${item.recent_usage_count}`
    );
  });
  (state.roundOutcome?.star_positions || []).forEach((star, index) => {
    const pickup = state.starPickupLog.find((item) => item.star_index === index);
    lines.push(
      "",
      `star ${index + 1}`,
      ` cell: ${star.col}_${star.row}`,
      ` expected collected: ${star.collected}`,
      ` actual collected: ${Boolean(pickup)}`,
      ` assigned path: ${star.assigned_result_path || "main"}`,
      ` collector path: ${pickup?.collector_result_path || "-"}`,
      ` pickup phase: ${star.pickup_phase}`,
      ` pickup time: ${pickup?.time ?? star.collect_time ?? "-"}`,
      ` pickup bounces: ${pickup?.bounce_count ?? star.pickup_bounce_count ?? "-"}`
    );
  });
  const multiPlusPosition = state.roundOutcome?.multi_plus_position;
  if (multiPlusPosition) {
    lines.push(
      "",
      "EX MULTI star",
      ` expected collected: ${multiPlusPosition.collected}`,
      ` actual collected: ${state.multiPlusActive}`,
      ` assigned path: ${multiPlusPosition.assigned_result_path || "main"}`,
      ` collector path: ${state.multiPlusPickupLog?.collector_result_path || "-"}`
    );
  }
  els.physicsDebug.textContent = lines.join("\n");
}

function drawPhysicsDebugOverlay() {
  if (!state.debugPhysics) return;
  ctx.save();
  state.trajectoryPlans.forEach((plan, index) => {
    if (!plan?.frames?.length) return;
    ctx.beginPath();
    plan.frames.forEach((frame, frameIndex) => {
      const point = toScreen(frame[1] * state.field.half, frame[2] * state.field.half);
      if (frameIndex === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = index === 0 ? "rgba(117,217,255,.7)" : index === 1 ? "rgba(255,174,48,.7)" : "rgba(213,122,255,.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    plan.bounce_points?.forEach((bounce) => {
      const point = toScreen(bounce[1] * state.field.half, bounce[2] * state.field.half);
      ctx.fillStyle = "#fff";
      ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
    });
    const target = plan.target_sector;
    drawCell(target.col, target.row, "rgba(0,0,0,0)", "rgba(255,255,255,.9)");
    const finalPoint = toScreen(plan.landing_point.x * state.field.half, plan.landing_point.y * state.field.half);
    ctx.beginPath();
    ctx.arc(finalPoint.x, finalPoint.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffeb63";
    ctx.fill();
    const { half, grid, puckRadius } = state.field;
    const margin = puckRadius + 2;
    const x0 = -half + target.col * grid + margin;
    const y0 = -half + target.row * grid + margin;
    const x1 = -half + (target.col + 1) * grid - margin;
    const y1 = -half + (target.row + 1) * grid - margin;
    const safe = [toScreen(x0, y0), toScreen(x1, y0), toScreen(x1, y1), toScreen(x0, y1)];
    ctx.beginPath();
    safe.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,235,99,.8)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  (state.roundOutcome?.star_positions || []).forEach((star, index) => {
    const point = toScreen(
      Number.isFinite(star.x) ? star.x * state.field.half : -state.field.half + state.field.grid * (star.col + 0.5),
      Number.isFinite(star.y) ? star.y * state.field.half : -state.field.half + state.field.grid * (star.row + 0.5)
    );
    ctx.fillStyle = "#e0a6ff";
    ctx.font = "700 9px ui-monospace, monospace";
    ctx.fillText(`${index + 1}:${star.pickup_phase || "none"}`, point.x + 5, point.y - 5);
  });
  ctx.restore();
}

const trajectoryPocketSafetyCache = new Map();

function trajectoryClearsInactivePockets(descriptor) {
  if (!descriptor) return false;
  if (trajectoryPocketSafetyCache.has(descriptor.id)) return trajectoryPocketSafetyCache.get(descriptor.id);
  const planner = window.PuckLuckTrajectoryPlanner;
  const trajectory = planner?.hydrateTrajectory(descriptor);
  const radius = descriptor.puck_radius || getMathConfiguration()?.puck_radius || 0.1;
  const clears = Boolean(trajectory?.frames?.length)
    && planner.trajectoryClearsPockets(trajectory.frames, radius);
  trajectoryPocketSafetyCache.set(descriptor.id, clears);
  return clears;
}

function getSafeStandardTrajectoryVariants(lines, cellId) {
  const variants = window.PuckLuckTrajectoryLibrary?.library?.[lines]?.[cellId] || [];
  if (usesFieldPocketMechanics() && state.fieldPocket) {
    const planner = window.PuckLuckTrajectoryPlanner;
    const pocket = getFieldPocketNormalized();
    const radius = getMathConfiguration()?.puck_radius || 0.1;
    return variants.filter((descriptor) => {
      const trajectory = planner?.hydrateTrajectory(descriptor);
      return Boolean(trajectory?.frames?.length)
        && planner.trajectoryClearsPockets(trajectory.frames, radius, [pocket]);
    });
  }
  return variants.filter(trajectoryClearsInactivePockets);
}

const fieldPocketCentersNormalized = Object.freeze([
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 }
]);

function getCollectibleSymbolRadiusNormalized() {
  return (getMathConfiguration()?.puck_radius || 0.1) * 0.56;
}

function collectibleSymbolClearsFieldObstaclesNormalized(x, y, radiusNorm = getCollectibleSymbolRadiusNormalized()) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (usesFieldPocketMechanics() && state.fieldPocket) {
    const col = clamp(Math.floor(((x + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1);
    const row = clamp(Math.floor(((y + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1);
    if (col === state.fieldPocket.col && row === state.fieldPocket.row) return false;
  }
  const pocketRadiusNorm = getMathConfiguration()?.puck_radius || 0.1;
  const wallClearance = radiusNorm + 0.028;
  if (Math.abs(x) > 1 - wallClearance || Math.abs(y) > 1 - wallClearance) return false;
  const pocketClearance = pocketRadiusNorm + radiusNorm + 0.03;
  const pockets = usesFieldPocketMechanics()
    ? [getFieldPocketNormalized()].filter(Boolean)
    : fieldPocketCentersNormalized;
  return pockets.every((pocket) =>
    Math.hypot(x - pocket.x, y - pocket.y) >= pocketClearance);
}

function collectibleSymbolClearsFieldObstaclesLocal(x, y, radiusPx) {
  const half = state.field.half || 1;
  return collectibleSymbolClearsFieldObstaclesNormalized(x / half, y / half, radiusPx / half);
}

function getSafeCollectibleEdgeCoordinate(lines) {
  const edgeCellCenter = 1 - 1 / lines;
  const radius = getCollectibleSymbolRadiusNormalized();
  if (usesFieldPocketMechanics()) return Math.min(edgeCellCenter, 1 - radius - 0.034);
  const pocketRadius = getMathConfiguration()?.puck_radius || 0.1;
  const safePocketEdge = 1 - pocketRadius - radius - 0.036;
  const safeWallEdge = 1 - radius - 0.034;
  return Math.min(edgeCellCenter, safePocketEdge, safeWallEdge);
}

const trajectoryComparisonCache = new Map();

function trajectoryChoiceHash(seed, id) {
  let value = (seed >>> 0) || 0x6d2b79f5;
  const text = String(id || "");
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value ^ (value >>> 16), 0x85ebca6b) >>> 0;
    value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35) >>> 0;
  }
  return (value ^ (value >>> 16)) >>> 0;
}

function shouldUseEarlyPocketEntry(result) {
  if (usesFieldPocketMechanics()) return false;
  if (!result?.secret_room || !Number.isFinite(result.visual_seed)) return false;
  const normalizedSeed = (result.visual_seed >>> 0) / 0x100000000;
  return normalizedSeed < EARLY_POCKET_ENTRY_VISUAL_PROBABILITY;
}

function hydrateTrajectoryForComparison(descriptor) {
  if (!descriptor?.id) return null;
  if (trajectoryComparisonCache.has(descriptor.id)) return trajectoryComparisonCache.get(descriptor.id);
  const trajectory = window.PuckLuckTrajectoryPlanner?.hydrateTrajectory(descriptor) || null;
  trajectoryComparisonCache.set(descriptor.id, trajectory);
  return trajectory;
}

function prepareTrajectoryForResult(descriptor, result, staggerDelay = 0) {
  const trajectory = window.PuckLuckTrajectoryPlanner?.hydrateTrajectory(descriptor);
  if (!trajectory) return null;
  trajectory.target_category = result?.category || descriptor.target_category;
  trajectory.recent_usage_count = state.trajectoryUsage[descriptor.id] || 0;
  trajectory.stagger_delay = staggerDelay;
  if (!usesFieldPocketMechanics() && result?.secret_room && trajectory.frames?.length) {
    const captureFrameIndex = Math.max(1, Math.min(
      descriptor.capture_frame_index ?? trajectory.frames.length - 1,
      trajectory.frames.length - 1
    ));
    trajectory.frames = trajectory.frames.slice(0, captureFrameIndex + 1);
    const captureFrame = trajectory.frames.at(-1);
    trajectory.duration = captureFrame[0];
    trajectory.bounce_count = captureFrame[5];
    trajectory.landing_point = { x: captureFrame[1], y: captureFrame[2] };
    trajectory.valid = true;
    trajectory.final_sector = { ...result.sector };
  }
  return trajectory;
}

function trajectoryVisualSignature(trajectory) {
  if (!trajectory?.frames?.length) return String(trajectory?.id || "");
  const frames = trajectory.frames;
  const checkpoints = [0.18, 0.32, 0.46, 0.60, 0.74, 0.88].map((progress) => {
    const index = Math.max(0, Math.min(frames.length - 1, Math.round((frames.length - 1) * progress)));
    return `${Math.round(frames[index][1] * 24)}_${Math.round(frames[index][2] * 24)}`;
  }).join("|");
  const bounces = (trajectory.bounce_points || []).slice(0, 6)
    .map((point) => `${Math.round(point[1] * 14)}_${Math.round(point[2] * 14)}`)
    .join("|");
  return [
    Math.round((trajectory.launch_angle_degrees || 0) * 3),
    trajectory.bounce_count || 0,
    checkpoints,
    bounces
  ].join(":");
}

function bouncePatternLooksDuplicated(first, second, puckRadius) {
  const firstBounces = first?.bounce_points || [];
  const secondBounces = second?.bounce_points || [];
  if (!firstBounces.length || firstBounces.length !== secondBounces.length) return false;
  const angleGap = Math.abs((first.launch_angle_degrees || 0) - (second.launch_angle_degrees || 0));
  if (angleGap > 1.15) return false;
  const threshold = Math.max(puckRadius * 0.95, 0.075);
  return firstBounces.every((bounce, index) => {
    const other = secondBounces[index];
    return other && Math.hypot(bounce[1] - other[1], bounce[2] - other[2]) <= threshold;
  });
}

function trajectoriesLookDuplicated(first, second, puckRadius = 0.1) {
  if (!first || !second) return false;
  if (first.id && first.id === second.id) return true;
  if (trajectoryVisualSignature(first) === trajectoryVisualSignature(second)) return true;
  if (bouncePatternLooksDuplicated(first, second, puckRadius)) return true;
  const firstFrames = first.frames || [];
  const secondFrames = second.frames || [];
  const sampleCount = 18;
  if (firstFrames.length < sampleCount || secondFrames.length < sampleCount) return false;
  const threshold = Math.max(puckRadius * 1.45, 0.105);
  let closeSamples = 0;
  let closeStreak = 0;
  let longestStreak = 0;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const progress = 0.14 + sample * (0.76 / (sampleCount - 1));
    const firstIndex = Math.max(1, Math.min(firstFrames.length - 1, Math.round((firstFrames.length - 1) * progress)));
    const secondIndex = Math.max(1, Math.min(secondFrames.length - 1, Math.round((secondFrames.length - 1) * progress)));
    const distance = Math.hypot(firstFrames[firstIndex][1] - secondFrames[secondIndex][1],
      firstFrames[firstIndex][2] - secondFrames[secondIndex][2]);
    if (distance <= threshold) {
      closeSamples += 1;
      closeStreak += 1;
      longestStreak = Math.max(longestStreak, closeStreak);
    } else {
      closeStreak = 0;
    }
  }
  return closeSamples / sampleCount >= 0.42 || longestStreak >= 6;
}

function descriptorsLookDuplicated(firstDescriptor, secondDescriptor, puckRadius) {
  if (!firstDescriptor || !secondDescriptor) return false;
  if (firstDescriptor.id === secondDescriptor.id) return true;
  return trajectoriesLookDuplicated(
    hydrateTrajectoryForComparison(firstDescriptor),
    hydrateTrajectoryForComparison(secondDescriptor),
    puckRadius || firstDescriptor.puck_radius || secondDescriptor.puck_radius || 0.1
  );
}

function trajectoryConflictsWithRound(candidate, existingPlans, puckRadius) {
  return existingPlans.some((plan) => plan?.valid
    && trajectoriesLookDuplicated(candidate, plan, puckRadius));
}

function selectDistinctTrajectoryDescriptor({
  variants,
  seed,
  result,
  existingPlans = [],
  staggerDelay = 0,
  recentHistorySize = 20,
  preferEarlyPocketEntry = false
}) {
  if (!variants?.length) return null;
  const orderedVariants = preferEarlyPocketEntry
    ? [...variants].sort((first, second) =>
      (first.capture_trajectory_progress ?? 1) - (second.capture_trajectory_progress ?? 1)
      || (first.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
        - (second.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
      || first.id.localeCompare(second.id))
    : variants;
  const existingIds = new Set(existingPlans.map((plan) => plan?.id).filter(Boolean));
  const recentIds = new Set(state.recentTrajectoryIds.slice(-recentHistorySize));
  let pool = orderedVariants.filter((descriptor) => !existingIds.has(descriptor.id)
    && !recentIds.has(descriptor.id));
  if (!pool.length) {
    pool = orderedVariants.filter((descriptor) => !existingIds.has(descriptor.id));
  }
  if (!pool.length) return null;
  const minimumUsage = Math.min(...pool.map((descriptor) => state.trajectoryUsage[descriptor.id] || 0));
  const preferred = pool.filter((descriptor) => (state.trajectoryUsage[descriptor.id] || 0) <= minimumUsage + 1);
  const ordered = [...preferred, ...pool.filter((descriptor) => !preferred.includes(descriptor))]
    .sort((first, second) =>
      (preferEarlyPocketEntry
        ? (first.capture_trajectory_progress ?? 1) - (second.capture_trajectory_progress ?? 1)
          || (first.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
            - (second.capture_bounce_count ?? Number.MAX_SAFE_INTEGER)
        : 0)
      || (state.trajectoryUsage[first.id] || 0) - (state.trajectoryUsage[second.id] || 0)
      || trajectoryChoiceHash(seed, first.id) - trajectoryChoiceHash(seed, second.id)
      || first.id.localeCompare(second.id));
  const puckRadius = getMathConfiguration()?.puck_radius || ordered[0]?.puck_radius || 0.1;
  for (const descriptor of ordered) {
    const trajectory = prepareTrajectoryForResult(descriptor, result, staggerDelay);
    if (!trajectory?.valid) continue;
    if (trajectoryConflictsWithRound(trajectory, existingPlans, puckRadius)) continue;
    return { descriptor, trajectory };
  }
  return null;
}

function visitRoundResultTree(results, visitor) {
  (results || []).forEach((result) => {
    visitor(result);
    if (result.secret_room) visitRoundResultTree(result.release_results, visitor);
  });
}

function roundSupportsFieldPocket(roundOutcome, pocket) {
  const previousPocket = state.fieldPocket;
  state.fieldPocket = pocket;
  try {
    const mainPlans = [];
    for (let puckIndex = 0; puckIndex < (roundOutcome.puck_results || []).length; puckIndex += 1) {
      const result = roundOutcome.puck_results[puckIndex];
      if (!result.secret_room) {
        if (!getSafeStandardTrajectoryVariants(GRID_SIZE, `${result.sector.col}_${result.sector.row}`).length) {
          return false;
        }
        continue;
      }
      const trajectory = planRuntimeFieldPocketTrajectory({
        result,
        seed: (result.visual_seed ^ Math.imul(puckIndex + 1, 0x9e3779b1)) >>> 0,
        existingPlans: mainPlans,
        releaseIndex: puckIndex
      });
      if (!trajectory) return false;
      mainPlans.push(trajectory);
    }

    let releaseIndex = 0;
    const supportsPocketResult = (pocketResult) => {
      if (!pocketResult?.secret_room) return true;
      const siblingPlans = [];
      for (const result of pocketResult.release_results || []) {
        const trajectory = planRuntimeFieldPocketTrajectory({
          result,
          seed: (result.visual_seed ^ Math.imul(releaseIndex + 1, 0x9e3779b1)) >>> 0,
          existingPlans: siblingPlans,
          startPoint: getFieldPocketNormalized(pocket),
          releaseIndex
        });
        releaseIndex += 1;
        if (!trajectory) return false;
        siblingPlans.push(trajectory);
        if (result.secret_room && !supportsPocketResult(result)) return false;
      }
      return true;
    };
    return (roundOutcome.puck_results || []).every(supportsPocketResult);
  } finally {
    state.fieldPocket = previousPocket;
  }
}

function selectRoundFieldPocket(roundOutcome) {
  if (!usesFieldPocketMechanics() || !roundOutcome) return null;
  const config = getMathConfiguration();
  if (!config) return null;
  const reserved = new Set([`${GRID_SIZE - 1}_${GRID_SIZE - 1}`]);
  visitRoundResultTree(roundOutcome.puck_results, (result) => {
    if (!result.secret_room && result.sector) {
      reserved.add(`${result.sector.col}_${result.sector.row}`);
    }
  });
  if (roundOutcome.multi_plus_triggered) {
    (config.multi_plus?.sectors || []).forEach((sector) => reserved.add(`${sector.col}_${sector.row}`));
  }
  const emptyCells = (config.sector_definitions.empty || []).filter((sector) => sector.index >= 0);
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ 0x504f434b) >>> 0);
  const shuffle = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = rng.int(index + 1);
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    return shuffled;
  };
  const isActiveMultiPlusCell = (sector) => roundOutcome.multi_plus_triggered
    && (config.multi_plus?.sectors || []).some((item) => item.col === sector.col && item.row === sector.row);
  const fallbackCandidates = emptyCells.filter((sector) => !isActiveMultiPlusCell(sector)
    && !(sector.col === GRID_SIZE - 1 && sector.row === GRID_SIZE - 1)
    && sector.index >= 0);
  const preferredCandidates = fallbackCandidates.filter((sector) => !reserved.has(`${sector.col}_${sector.row}`));
  const orderedCandidates = [
    ...shuffle(preferredCandidates),
    ...shuffle(fallbackCandidates.filter((sector) => !preferredCandidates.includes(sector)))
  ];

  for (const selected of orderedCandidates) {
    const normalized = {
      x: -1 + (selected.col + 0.5) * 2 / GRID_SIZE,
      y: -1 + (selected.row + 0.5) * 2 / GRID_SIZE
    };
    const pocket = {
      col: selected.col,
      row: selected.row,
      index: selected.index,
      x: normalized.x,
      y: normalized.y,
      candidate_count: orderedCandidates.length
    };
    const replacementPool = fallbackCandidates.filter((sector) =>
      !(sector.col === pocket.col && sector.row === pocket.row));
    const replacements = [];
    visitRoundResultTree(roundOutcome.puck_results, (result) => {
      if (result.secret_room || result.category !== "empty" || !result.sector
        || result.sector.col !== pocket.col || result.sector.row !== pocket.row
        || !replacementPool.length) return;
      const replacementRng = window.PuckLuckMath.createRng(
        ((result.visual_seed || roundOutcome.seed) ^ 0x52454d50) >>> 0
      );
      replacements.push({ result, sector: result.sector });
      result.sector = { ...replacementPool[replacementRng.int(replacementPool.length)] };
    });
    if (roundSupportsFieldPocket(roundOutcome, pocket)) {
      roundOutcome.field_pocket = { ...pocket };
      return pocket;
    }
    replacements.forEach(({ result, sector }) => {
      result.sector = sector;
    });
  }
  return null;
}

function selectPrototypeFieldPocket() {
  if (window.BalloroBonusUI?.isV3) {
    return { ...(window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules).pocketCells(GRID_SIZE).diamond };
  }
  const candidates = (getMathConfiguration()?.sector_definitions?.empty || [])
    .filter((sector) => sector.index >= 0
      && !(sector.col === GRID_SIZE - 1 && sector.row === GRID_SIZE - 1));
  const selected = candidates[Math.floor(randomPrototypeUnit() * candidates.length)];
  return selected ? { ...selected } : null;
}

function selectV2BluePocket(roundOutcome) {
  if (!window.BalloroBonusUI?.isV2 || !usesFieldPocketMechanics()) return null;
  if (window.BalloroBonusUI?.isV3) {
    return { ...(window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules).pocketCells(GRID_SIZE).blue };
  }
  const blocked = new Set([state.fieldPocket, state.chancePocket,
    roundOutcome?.multi_plus_position].filter(Boolean).map(cell => `${cell.col}_${cell.row}`));
  const candidates = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if ((col !== GRID_SIZE - 1 || row !== GRID_SIZE - 1)
        && getCellMultiplier(col, row) === 0 && !blocked.has(`${col}_${row}`)) {
        candidates.push({ col, row });
      }
    }
  }
  if (!candidates.length) return null;
  const rng = window.PuckLuckMath.createRng(((roundOutcome?.seed || 1) ^ 0x424c5545) >>> 0);
  return { ...candidates[rng.int(candidates.length)] };
}

function selectRoundChancePocket(roundOutcome, trajectories = []) {
  if (!usesFieldPocketMechanics() || !roundOutcome) return null;
  if (window.BalloroBonusUI?.isV3) {
    return { ...(window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules).pocketCells(GRID_SIZE).crown, forced: false };
  }
  const candidates = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (state.fieldPocket?.col === col && state.fieldPocket?.row === row) continue;
      if (col === GRID_SIZE - 1 && row === GRID_SIZE - 1) continue;
      if (getCellMultiplier(col, row) > 0) continue;
      candidates.push({ col, row });
    }
  }
  if (!candidates.length) return null;
  const forceChance = new URLSearchParams(window.location.search).get("forceChance") === "1";
  if (forceChance && trajectories[0]?.frames?.length) {
    const frames = trajectories[0].frames;
    const scored = candidates.map((candidate) => {
      const center = {
        x: -1 + (candidate.col + 0.5) * 2 / GRID_SIZE,
        y: -1 + (candidate.row + 0.5) * 2 / GRID_SIZE
      };
      let distance = Infinity;
      let frameIndex = 0;
      frames.forEach((frame, index) => {
        const value = Math.hypot(frame[1] - center.x, frame[2] - center.y);
        if (value < distance) { distance = value; frameIndex = index; }
      });
      return { ...candidate, distance, forceFrameIndex: frameIndex };
    }).sort((a, b) => a.distance - b.distance);
    return { ...scored[0], forced: true };
  }
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ 0x4348414e) >>> 0);
  return { ...candidates[rng.int(candidates.length)], forced: false };
}

function getMainFieldMaximumMultiplier() {
  let maximumMultiplier = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      maximumMultiplier = Math.max(maximumMultiplier, getCellMultiplier(col, row));
    }
  }
  return maximumMultiplier || getRiskBands().center;
}

function createChanceRoomMultipliers() {
  if (window.BalloroBonusUI?.isV3) {
    return { ...window.BalloroV3Rules.roomMultipliers[GRID_SIZE] };
  }
  const maximumMultiplier = getMainFieldMaximumMultiplier();
  return Object.fromEntries(CHANCE_ROOM_IDS.map((id) => [
    id,
    id === "bottom-right" ? maximumMultiplier * 10 : maximumMultiplier
  ]));
}

function planRuntimeFieldPocketTrajectory({
  result,
  seed,
  existingPlans = [],
  startPoint = null,
  releaseIndex = 0,
  avoidPockets = []
}) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const config = getMathConfiguration();
  const pocket = getFieldPocketNormalized();
  if (!planner || !config || !pocket || !result) return null;
  const targetSector = result.secret_room
    ? { col: state.fieldPocket.col, row: state.fieldPocket.row }
    : { ...result.sector };
  const puckRadius = config.puck_radius || 0.1;
  const launchForce = planner.VISUAL_PHYSICS.visual_launch_force;
  const allowAnyDirection = Boolean(startPoint);
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const attemptSeed = (seed ^ Math.imul(attempt + 1, 0x9e3779b1)) >>> 0;
    const landingPoint = result.secret_room
      ? pocket
      : planner.landingPointForVariant(GRID_SIZE, puckRadius, targetSector, attemptSeed, attempt);
    const trajectory = planner.planTrajectory({
      lines: GRID_SIZE,
      puckRadius,
      targetSector,
      seed: attemptSeed,
      launchForce,
      landingPoint,
      candidateOffset: attempt,
      startPoint,
      allowAnyDirection,
      angleCenter: allowAnyDirection ? 0 : -135,
      angleMin: allowAnyDirection ? -180 : -48,
      angleMax: allowAnyDirection ? 180 : 48
    });
    if (!trajectory.valid) continue;
    if (!result.secret_room
      && !planner.trajectoryClearsPockets(trajectory.frames, puckRadius, [pocket])) continue;
    if (avoidPockets.length
      && !planner.trajectoryClearsPockets(trajectory.frames, puckRadius, avoidPockets)) continue;
    if (trajectoryConflictsWithRound(trajectory, existingPlans, puckRadius)) continue;
    trajectory.id = `field-pocket-${releaseIndex}-${result.result_path || result.visual_seed}-${attempt}`;
    trajectory.target_category = result.category;
    trajectory.recent_usage_count = state.trajectoryUsage[trajectory.id] || 0;
    trajectory.stagger_delay = 0;
    if (result.secret_room) {
      const firstFrame = trajectory.frames[0];
      const captureRadius = puckRadius * planner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
      trajectory.secret_room = {
        zone_id: FIELD_POCKET_ZONE_ID,
        entry_id: trajectory.id,
        pocket_capture_armed: Math.hypot(firstFrame[1] - pocket.x, firstFrame[2] - pocket.y) > captureRadius
      };
      result.visual_pocket_sector = { ...targetSector };
    }
    return trajectory;
  }
  return null;
}

function randomPrototypeUnit() {
  if (window.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0] / 4294967296;
  }
  return Math.random();
}

function buildRandomPrototypeTrajectory(startPoint = null, angleCenter = -135, sourcePuck = null) {
  if (window.BalloroSavedPaths?.enabled) {
    if (window.BalloroBonusUI?.isV3) {
      return startPoint
        ? window.BalloroSavedPaths.fieldV3Release(GRID_SIZE,startPoint,randomPrototypeUnit(),sourcePuck?.v3PocketVisits)
        : window.BalloroSavedPaths.fieldV3(GRID_SIZE,randomPrototypeUnit(),randomPrototypeUnit());
    }
    return window.BalloroSavedPaths.field(GRID_SIZE, startPoint, randomPrototypeUnit());
  }
  const planner = window.PuckLuckTrajectoryPlanner;
  const config = getMathConfiguration();
  const puckRadius = config?.puck_radius || 0.1;
  const start = 1 - puckRadius * 1.8;
  const origin = startPoint || { x: start, y: start };
  let fallback = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const angleDegrees = angleCenter + (randomPrototypeUnit() - 0.5) * 76;
    const duration = 2.25 + randomPrototypeUnit() * 0.55;
    const trajectory = planner.simulateTrajectoryFromAngle({
      lines: GRID_SIZE,
      puckRadius,
      startPoint: origin,
      angleDegrees,
      launchForce: planner.VISUAL_PHYSICS.visual_launch_force,
      dampingPerStep: 0.972,
      duration
    });
    fallback ||= trajectory;
    if (trajectory.bounce_count < planner.VISUAL_PHYSICS.min_bounces
      || trajectory.bounce_count > planner.VISUAL_PHYSICS.max_bounces) continue;
    trajectory.id = `pocket-test-${Date.now()}-${attempt}-${Math.floor(randomPrototypeUnit() * 1e9)}`;
    trajectory.target_category = "physical";
    trajectory.recent_usage_count = 0;
    trajectory.stagger_delay = 0;
    return trajectory;
  }
  fallback.id = `pocket-test-fallback-${Date.now()}-${Math.floor(randomPrototypeUnit() * 1e9)}`;
  fallback.target_category = "physical";
  fallback.recent_usage_count = 0;
  fallback.stagger_delay = 0;
  return fallback;
}

function selectV3RepeatedPurpleRelease(startPoint, puck) {
  if (window.BalloroMvpMath?.enabled()) return buildRandomPrototypeTrajectory(startPoint, -135, puck);
  const previous = puck.v3LastPurpleReleaseDirection;
  let mostDifferent = null;
  let widestTurn = -1;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const trajectory = buildRandomPrototypeTrajectory(startPoint, -135);
    if (!trajectory || !Number.isFinite(previous)) return trajectory;
    const first = trajectory.frames[0];
    const direction = Math.atan2(first[4], first[3]);
    const turn = Math.abs(Math.atan2(Math.sin(direction - previous),
      Math.cos(direction - previous)));
    if (turn > widestTurn) {
      mostDifferent = trajectory;
      widestTurn = turn;
    }
    if (turn >= Math.PI / 9) return trajectory;
  }
  return mostDifferent;
}

function isV3BonusLaunchBlocked({ presentationOnly = false } = {}) {
  return Boolean(state.v3BonusLock || state.x10BoostActivated
    || (!presentationOnly && window.BalloroBonusUI?.isV4 && (state.multiPlusActive
      || getCarriedYellowCells().length || state.yellowFieldReturn))
    || (window.BalloroBonusUI?.isV4 && v3FieldTransition?.vertical && !v3FieldTransition.to));
}

function applyPocketTestPrototypePlan(roundOutcome, trajectoryResult) {
  if (!POCKET_TEST_RANDOM_PHYSICS) return;
  trajectoryResult.valid = true;
  trajectoryResult.reason = null;
  trajectoryResult.plans = roundOutcome.puck_results.map(() => buildRandomPrototypeTrajectory());
  roundOutcome.star_positions = getFixedBonusSymbolSlots(GRID_SIZE, state.puckCount).diamonds.map((slot) => ({
    index: slot.row * GRID_SIZE + slot.col,
    x: slot.x,
    y: slot.y,
    row: slot.row,
    col: slot.col,
    collected: true,
    assigned_puck: -1,
    assigned_result_path: null,
    collect_time: null,
    pickup_phase: "physical"
  }));
  roundOutcome.stars_collected = getRequiredStars();
  roundOutcome.bonus_triggered = false;
  roundOutcome.paid_bonus_triggered = false;
  roundOutcome.multi_plus_triggered = false;
}

function placePrototypeMultiPlusPosition(roundOutcome) {
  if (!POCKET_TEST_RANDOM_PHYSICS) return;
  if (window.BalloroBonusUI?.isV3) {
    const { col, row } = (window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules).pocketCells(GRID_SIZE).lemon;
    roundOutcome.multi_plus_position = {
      index: row * GRID_SIZE + col, col, row, collected: true,
      assigned_puck: -1, assigned_result_path: null, collect_time: null,
      pickup_phase: "physical"
    };
    return;
  }
  const blocked = new Set([
    state.fieldPocket && `${state.fieldPocket.col}_${state.fieldPocket.row}`,
    state.chancePocket && `${state.chancePocket.col}_${state.chancePocket.row}`,
    `${GRID_SIZE - 1}_${GRID_SIZE - 1}`,
    ...roundOutcome.star_positions.map((star) => `${star.col}_${star.row}`)
  ].filter(Boolean));
  const candidates = (getMathConfiguration()?.sector_definitions?.empty || [])
    .filter((cell) => cell.index >= 0 && !blocked.has(`${cell.col}_${cell.row}`));
  const cell = candidates[Math.floor(randomPrototypeUnit() * candidates.length)] || { col: 0, row: 0 };
  roundOutcome.multi_plus_position = {
    index: cell.row * GRID_SIZE + cell.col,
    row: cell.row,
    col: cell.col,
    collected: true,
    assigned_puck: -1,
    assigned_result_path: null,
    collect_time: null,
    pickup_phase: "physical"
  };
}

function buildTrajectoryPlans(roundOutcome) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const trajectoryLibrary = window.PuckLuckTrajectoryLibrary;
  if (!planner || !trajectoryLibrary || !roundOutcome) {
    return { valid: false, reason: "trajectory_planner_unavailable", plans: [] };
  }
  const plans = [];
  const usedThisRound = [];
  roundOutcome.puck_results.forEach((result, puckIndex) => {
    if (usesFieldPocketMechanics() && result.secret_room) {
      const trajectory = planRuntimeFieldPocketTrajectory({
        result,
        seed: (result.visual_seed ^ Math.imul(puckIndex + 1, 0x9e3779b1)) >>> 0,
        existingPlans: plans.filter((plan) => plan?.valid),
        releaseIndex: puckIndex
      });
      if (!trajectory) {
        plans.push({ valid: false, unreachable_reason: `field_pocket_trajectory_unavailable_${GRID_SIZE}_${puckIndex}` });
      } else {
        plans.push(trajectory);
      }
      return;
    }
    const secretLibrary = window.PuckLuckSecretRoomTrajectories?.library?.[GRID_SIZE];
    const cellId = `${result.sector.col}_${result.sector.row}`;
    const variants = result.secret_room
      ? secretLibrary?.entries?.[result.secret_zone_id] || []
      : getSafeStandardTrajectoryVariants(GRID_SIZE, cellId);
    if (!variants.length) {
      const missingId = result.secret_room ? `secret_${result.secret_zone_id}` : cellId;
      plans.push({ valid: false, unreachable_reason: `missing_precomputed_cell_${GRID_SIZE}_${missingId}` });
      return;
    }
    const rng = window.PuckLuckMath.createRng((result.visual_seed ^ Math.imul(puckIndex + 1, 0x9e3779b1)) >>> 0);
    const selection = selectDistinctTrajectoryDescriptor({
      variants,
      seed: rng.uint32(),
      result,
      existingPlans: plans.filter((plan) => plan?.valid),
      recentHistorySize: trajectoryLibrary.config.recent_history_size,
      preferEarlyPocketEntry: shouldUseEarlyPocketEntry(result)
    });
    if (!selection) {
      plans.push({ valid: false, unreachable_reason: `duplicate_visual_trajectory_unavailable_${GRID_SIZE}_${cellId}` });
      return;
    }
    const { descriptor, trajectory } = selection;
    if (result.secret_room) {
      const captureFrameIndex = Math.max(1, Math.min(
        descriptor.capture_frame_index ?? trajectory.frames.length - 1,
        trajectory.frames.length - 1
      ));
      trajectory.frames = trajectory.frames.slice(0, captureFrameIndex + 1);
      const captureFrame = trajectory.frames.at(-1);
      trajectory.duration = captureFrame[0];
      trajectory.bounce_count = captureFrame[5];
      trajectory.landing_point = { x: captureFrame[1], y: captureFrame[2] };
      // Even-sized grids place the pocket on the intersection of two cells;
      // either adjacent cell is valid while the physical landing point remains exact.
      trajectory.valid = true;
      trajectory.final_sector = { ...result.sector };
      const pocket = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, result.secret_zone_id);
      const captureRadius = (getMathConfiguration()?.puck_radius || 0.1)
        * window.PuckLuckTrajectoryPlanner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
      const firstFrame = trajectory.frames[0];
      trajectory.secret_room = {
        zone_id: result.secret_zone_id,
        entry_id: descriptor.id,
        pocket_capture_armed: Math.hypot(firstFrame[1] - pocket.x, firstFrame[2] - pocket.y) > captureRadius
      };
    }
    usedThisRound.push(descriptor.id);
    plans.push(trajectory);
  });
  const invalid = plans.find((plan) => !plan.valid);
  return invalid ? { valid: false, reason: invalid.unreachable_reason, plans } : { valid: true, plans };
}

function ensureUniqueRoundTrajectories(roundOutcome, trajectories) {
  if (!roundOutcome || !trajectories?.length) {
    return { valid: false, reason: "trajectory_uniqueness_unavailable" };
  }
  const puckRadius = getMathConfiguration()?.puck_radius || 0.1;
  for (let firstIndex = 0; firstIndex < trajectories.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < trajectories.length; secondIndex += 1) {
      if (trajectoriesLookDuplicated(trajectories[firstIndex], trajectories[secondIndex], puckRadius)) {
        return { valid: false, reason: `duplicate_visual_trajectory_${firstIndex + 1}_${secondIndex + 1}` };
      }
    }
  }
  return { valid: true };
}

function getFixedBonusSymbolSlots(lines, puckCount) {
  const edgeCellCenter = getSafeCollectibleEdgeCoordinate(lines);
  // The 7x7 library needs stable points on the inner borders of its central edge cells
  // so every authoritative symbol result still has a physical, multiplier-equivalent path.
  const sevenLineOffsets = lines === 7 && puckCount === 2
    ? [-1 / 7, -1 / 7, -1 / 7, -1 / 7]
    : lines === 7 && puckCount === 3
      ? [-1 / 7, -1 / 7, 1 / 7, -0.105]
      : [0, 0, 0, 0];
  const anchors = [
    { side: "top", x: sevenLineOffsets[0], y: -edgeCellCenter },
    { side: "right", x: edgeCellCenter, y: sevenLineOffsets[1] },
    { side: "bottom", x: -sevenLineOffsets[2], y: edgeCellCenter },
    { side: "left", x: -edgeCellCenter, y: -sevenLineOffsets[3] }
  ];
  const diamondSides = lines === 7 ? [0, 1, 2] : [1, 2, 3];
  const toSlot = (anchorIndex, type, index) => {
    const anchor = anchors[anchorIndex];
    return {
      ...anchor,
      anchorIndex,
      type,
      index,
      col: Math.max(0, Math.min(lines - 1, Math.floor(((anchor.x + 1) / 2) * lines))),
      row: Math.max(0, Math.min(lines - 1, Math.floor(((anchor.y + 1) / 2) * lines)))
    };
  };
  return {
    diamonds: diamondSides.map((anchorIndex, index) => toSlot(anchorIndex, "diamond", index))
  };
}

function distanceToFixedSymbolSegment(symbol, firstFrame, secondFrame) {
  const ax = firstFrame[1];
  const ay = firstFrame[2];
  const dx = secondFrame[1] - ax;
  const dy = secondFrame[2] - ay;
  const lengthSquared = dx * dx + dy * dy;
  const progress = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((symbol.x - ax) * dx + (symbol.y - ay) * dy) / lengthSquared))
    : 0;
  const x = ax + dx * progress;
  const y = ay + dy * progress;
  return { distance: Math.hypot(symbol.x - x, symbol.y - y), progress, x, y };
}

function fixedSymbolPickupPhase(frameIndex, frames, bounceCount) {
  const progress = frameIndex / Math.max(1, frames.length - 1);
  if (progress >= 0.85) return "final_slowdown";
  if (bounceCount >= 4) return "late";
  if (bounceCount >= 2) return "after_2_3_bounces";
  if (bounceCount === 1) return "after_1_bounce";
  return "before_first_bounce";
}

function getFixedTrajectoryMetrics(descriptor, symbols, hitRadius) {
  const cacheKey = `${descriptor.id}|${symbols.map((symbol) => `${symbol.x.toFixed(6)},${symbol.y.toFixed(6)}`).join("|")}`;
  const cached = fixedBonusTrajectoryMetrics.get(cacheKey);
  if (cached) return cached;
  const trajectory = window.PuckLuckTrajectoryPlanner.hydrateTrajectory(descriptor);
  const pickups = symbols.map((symbol) => {
    let best = null;
    for (let frameIndex = 1; frameIndex < trajectory.frames.length; frameIndex += 1) {
      const first = trajectory.frames[frameIndex - 1];
      const second = trajectory.frames[frameIndex];
      const candidate = distanceToFixedSymbolSegment(symbol, first, second);
      if (!best || candidate.distance < best.distance) {
        const time = first[0] + (second[0] - first[0]) * candidate.progress;
        const bounceCount = candidate.progress < 0.5 ? first[5] : second[5];
        best = {
          distance: candidate.distance,
          t: time,
          bounce_count: bounceCount,
          frame_index: frameIndex,
          phase: fixedSymbolPickupPhase(frameIndex, trajectory.frames, bounceCount)
        };
      }
    }
    return best;
  });
  const mask = pickups.reduce((value, pickup, index) => value | (pickup.distance <= hitRadius ? 1 << index : 0), 0);
  const metrics = { mask, pickups };
  fixedBonusTrajectoryMetrics.set(cacheKey, metrics);
  return metrics;
}

function fixedResultSectorPool(result, config) {
  const currentKey = `${result.sector.col}_${result.sector.row}`;
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  let sectors;
  if (result.category === "empty") {
    sectors = (config.sector_definitions.empty || []).filter((sector) => sector.index >= 0
      && sector.index !== launchIndex);
  } else {
    sectors = config.sector_definitions[result.category] || [];
  }
  return [...sectors].sort((first, second) => {
    const firstCurrent = `${first.col}_${first.row}` === currentKey ? 0 : 1;
    const secondCurrent = `${second.col}_${second.row}` === currentKey ? 0 : 1;
    return firstCurrent - secondCurrent || first.index - second.index;
  });
}

function collectFixedTrajectoryOptions(result, config, symbols, hitRadius, currentCellOnly, sectorLimit = Infinity) {
  const library = window.PuckLuckTrajectoryLibrary;
  const currentKey = `${result.sector.col}_${result.sector.row}`;
  const recentIds = new Set(state.recentTrajectoryIds.slice(-library.config.recent_history_size));
  const sectors = fixedResultSectorPool(result, config)
    .filter((sector) => !currentCellOnly || `${sector.col}_${sector.row}` === currentKey)
    .slice(0, sectorLimit);
  const optionsByMask = new Map();
  sectors.forEach((sector) => {
    const variants = getSafeStandardTrajectoryVariants(GRID_SIZE, `${sector.col}_${sector.row}`);
    variants.forEach((descriptor) => {
      const metrics = getFixedTrajectoryMetrics(descriptor, symbols, hitRadius);
      const option = {
        descriptor,
        metrics,
        mask: metrics.mask,
        sector,
        score: (`${sector.col}_${sector.row}` === currentKey ? 0 : 1000)
          + (recentIds.has(descriptor.id) ? 200 : 0)
          + (state.trajectoryUsage[descriptor.id] || 0) * 10
      };
      const bucket = optionsByMask.get(option.mask) || [];
      bucket.push(option);
      bucket.sort((first, second) => first.score - second.score || first.descriptor.id.localeCompare(second.descriptor.id));
      optionsByMask.set(option.mask, bucket.slice(0, 6));
    });
  });
  return [...optionsByMask.values()].flat();
}

function findFixedTrajectoryCombination(optionsByPuck, diamondMask, collectedDiamonds) {
  let states = new Map([[0, { unionMask: 0, choices: [], score: 0 }]]);
  optionsByPuck.forEach((options) => {
    const next = new Map();
    states.forEach((stateEntry) => {
      options.forEach((option) => {
        if (stateEntry.choices.some((choice) =>
          descriptorsLookDuplicated(choice.descriptor, option.descriptor, option.descriptor.puck_radius))) return;
        const unionMask = stateEntry.unionMask | option.mask;
        const key = unionMask;
        const candidate = {
          unionMask,
          choices: [...stateEntry.choices, option],
          score: stateEntry.score + option.score
        };
        const current = next.get(key);
        if (!current || candidate.score < current.score) next.set(key, candidate);
      });
    });
    states = next;
  });
  const popcount = (value) => {
    let count = 0;
    for (let bits = value; bits; bits >>>= 1) count += bits & 1;
    return count;
  };
  return [...states.values()]
    .filter((entry) => {
      return popcount(entry.unionMask & diamondMask) === collectedDiamonds;
    })
    .sort((first, second) => first.score - second.score)[0] || null;
}

function buildFixedBonusSymbolPlan(roundOutcome, trajectories) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const config = getMathConfiguration();
  if (!planner || !config || !roundOutcome || !trajectories?.length) {
    return { valid: false, reason: "fixed_symbol_planner_unavailable" };
  }
  const slots = getFixedBonusSymbolSlots(GRID_SIZE, state.puckCount);
  const symbols = slots.diamonds;
  const diamondMask = (1 << symbols.length) - 1;
  const hitRadius = config.puck_radius * 1.56;
  const desiredDiamonds = roundOutcome.bonus_triggered ? getRequiredStars() : roundOutcome.stars_collected;

  let optionsByPuck = roundOutcome.puck_results.map((result) =>
    collectFixedTrajectoryOptions(result, config, symbols, hitRadius, true));
  let combination = findFixedTrajectoryCombination(optionsByPuck, diamondMask, desiredDiamonds);
  if (!combination) {
    for (const sectorLimit of [6, 16, Infinity]) {
      optionsByPuck = roundOutcome.puck_results.map((result) =>
        collectFixedTrajectoryOptions(result, config, symbols, hitRadius, false, sectorLimit));
      combination = findFixedTrajectoryCombination(optionsByPuck, diamondMask, desiredDiamonds);
      if (combination) break;
    }
  }
  if (!combination) return { valid: false, reason: "fixed_symbol_trajectory_combination_unavailable" };

  combination.choices.forEach((choice, puckIndex) => {
    const result = roundOutcome.puck_results[puckIndex];
    const previous = trajectories[puckIndex];
    const replacement = planner.hydrateTrajectory(choice.descriptor);
    replacement.target_category = result.category;
    replacement.recent_usage_count = state.trajectoryUsage[choice.descriptor.id] || 0;
    replacement.stagger_delay = previous?.stagger_delay || 0;
    trajectories[puckIndex] = replacement;
    result.sector = { ...choice.descriptor.target_sector };
    result.multiplier = choice.sector.multiplier ?? config.multiplier_table[result.category];
  });

  const assignedPickup = (symbolIndex) => {
    const candidates = combination.choices.map((choice, puckIndex) => ({
      puckIndex,
      touched: Boolean(choice.mask & (1 << symbolIndex)),
      pickup: choice.metrics.pickups[symbolIndex]
    })).filter((candidate) => candidate.touched)
      .sort((first, second) => first.pickup.t - second.pickup.t);
    return candidates[0] || null;
  };
  const stars = slots.diamonds.map((slot, diamondIndex) => {
    const symbolIndex = diamondIndex;
    const assignment = assignedPickup(symbolIndex);
    return {
      index: slot.row * GRID_SIZE + slot.col,
      x: slot.x,
      y: slot.y,
      row: slot.row,
      col: slot.col,
      collected: Boolean(assignment),
      assigned_puck: assignment?.puckIndex ?? -1,
      collect_time: assignment?.pickup.t ?? null,
      pickup_bounce_count: assignment?.pickup.bounce_count ?? null,
      pickup_phase: assignment?.pickup.phase || "not_collected",
      fixed_side: slot.side
    };
  });
  roundOutcome.star_positions = stars;
  roundOutcome.stars_collected = stars.filter((star) => star.collected).length;
  roundOutcome.fixed_bonus_symbols = true;
  return { valid: true, stars, mode: "fixed" };
}

function buildVisualStarPlanLegacy(roundOutcome, trajectories) {
  const planner = window.PuckLuckTrajectoryPlanner;
  const config = getMathConfiguration();
  if (!planner || !config || !roundOutcome) {
    return { valid: false, reason: "star_planner_unavailable" };
  }
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const eligibleStarCells = config.sector_definitions.empty.filter((sector) => sector.index >= 0
    && sector.index !== launchIndex);
  const eligibleStarCellKeys = new Set(eligibleStarCells.map((sector) => `${sector.col}_${sector.row}`));
  const collectedNeeded = roundOutcome.bonus_triggered ? getRequiredStars() : roundOutcome.stars_collected;
  let candidatesByPuck;
  let touchedCells;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    candidatesByPuck = trajectories.map((trajectory) => planner.findStarCandidates(trajectory, GRID_SIZE, config.puck_radius)
      .filter((candidate) => eligibleStarCellKeys.has(`${candidate.col}_${candidate.row}`)
        && collectibleSymbolClearsFieldObstaclesNormalized(candidate.x, candidate.y, config.puck_radius * 0.56)));
    touchedCells = new Set(candidatesByPuck.flat().map((candidate) => `${candidate.col}_${candidate.row}`));
    if (touchedCells.size >= collectedNeeded) break;
    trajectories.forEach((trajectory, puckIndex) => {
      const result = roundOutcome.puck_results[puckIndex];
      if (result.secret_room) return;
      const cellId = `${result.sector.col}_${result.sector.row}`;
      const variants = getSafeStandardTrajectoryVariants(GRID_SIZE, cellId);
      const selection = selectDistinctTrajectoryDescriptor({
        variants,
        seed: (roundOutcome.seed + attempt * 7 + puckIndex * 13) >>> 0,
        result,
        existingPlans: trajectories.filter((_, index) => index !== puckIndex),
        staggerDelay: trajectory.stagger_delay,
        recentHistorySize: window.PuckLuckTrajectoryLibrary.config.recent_history_size
      });
      if (selection) trajectories[puckIndex] = selection.trajectory;
    });
  }
  if (touchedCells.size < collectedNeeded) {
    return { valid: false, reason: "insufficient_empty_star_cells_for_precomputed_paths" };
  }
  const used = new Set();
  const stars = [];
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ 0xa53c9e17) >>> 0);
  const phaseWeights = [
    ["before_first_bounce", 0.15],
    ["after_1_bounce", 0.25],
    ["after_2_3_bounces", 0.25],
    ["late", 0.25],
    ["final_slowdown", 0.10]
  ];
  function choosePhase() {
    let roll = rng.next();
    for (const [phase, weight] of phaseWeights) {
      roll -= weight;
      if (roll <= 0) return phase;
    }
    return "final_slowdown";
  }
  let previousPhase = null;
  for (let starIndex = 0; starIndex < collectedNeeded; starIndex += 1) {
    let selected = null;
    let desiredPhase = choosePhase();
    if (collectedNeeded > 1 && desiredPhase === previousPhase) {
      const phaseIndex = phaseWeights.findIndex(([phase]) => phase === desiredPhase);
      desiredPhase = phaseWeights[(phaseIndex + 1 + rng.int(phaseWeights.length - 1)) % phaseWeights.length][0];
    }
    for (let offset = 0; offset < trajectories.length && !selected; offset += 1) {
      const puckIndex = (starIndex + offset) % trajectories.length;
      const phaseCandidates = candidatesByPuck[puckIndex].filter((item) => item.phase === desiredPhase && !used.has(`${item.col}_${item.row}`));
      const fallbackCandidates = candidatesByPuck[puckIndex].filter((item) => !used.has(`${item.col}_${item.row}`));
      const source = phaseCandidates.length ? phaseCandidates : fallbackCandidates;
      const candidate = source.length ? source[rng.int(source.length)] : null;
      if (candidate) selected = { ...candidate, puckIndex };
    }
    if (!selected) return { valid: false, reason: "insufficient_collectible_star_cells" };
    const key = `${selected.col}_${selected.row}`;
    used.add(key);
    stars.push({
      index: selected.row * GRID_SIZE + selected.col,
      x: selected.x,
      y: selected.y,
      row: selected.row,
      col: selected.col,
      collected: true,
      assigned_puck: selected.puckIndex,
      collect_time: selected.t,
      pickup_bounce_count: selected.bounce_count,
      pickup_phase: selected.phase
    });
    previousPhase = selected.phase;
  }
  const fallbackCells = [];
  eligibleStarCells.forEach(({ index, row, col }) => {
    const key = `${col}_${row}`;
    if (used.has(key)) return;
    const item = { index, row, col, key };
    fallbackCells.push(item);
  });
  function takeRandomCell(pool) {
    if (!pool.length) return null;
    const offset = rng.int(pool.length);
    const [cell] = pool.splice(offset, 1);
    const duplicate = fallbackCells.findIndex((item) => item.key === cell.key);
    if (duplicate >= 0) fallbackCells.splice(duplicate, 1);
    return cell;
  }
  function findFreeStarPosition(fallbackCell) {
    const starRadius = config.puck_radius * 0.56;
    const pathMargin = config.puck_radius + starRadius + 0.018;
    const minimumStarGap = starRadius * 2.5;
    const cellSize = 2 / GRID_SIZE;
    const padding = starRadius + 0.014;
    const left = -1 + fallbackCell.col * cellSize + padding;
    const right = -1 + (fallbackCell.col + 1) * cellSize - padding;
    const top = -1 + fallbackCell.row * cellSize + padding;
    const bottom = -1 + (fallbackCell.row + 1) * cellSize - padding;
    for (let attempt = 0; attempt < 240; attempt += 1) {
      const x = left + rng.next() * Math.max(0, right - left);
      const y = top + rng.next() * Math.max(0, bottom - top);
      if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, starRadius)) continue;
      const overlapsStar = stars.some((star) => Number.isFinite(star.x) && Number.isFinite(star.y)
        && Math.hypot(x - star.x, y - star.y) < minimumStarGap);
      if (overlapsStar) continue;
      const touchesPath = trajectories.some((trajectory) => trajectory.frames.some((frame) =>
        Math.hypot(x - frame[1], y - frame[2]) < pathMargin));
      if (touchesPath) continue;
      return {
        x,
        y,
        col: fallbackCell.col,
        row: fallbackCell.row
      };
    }
    return null;
  }
  while (stars.length < getRequiredStars()) {
    let cell = null;
    let position = null;
    while (fallbackCells.length && !position) {
      cell = takeRandomCell(fallbackCells);
      position = findFreeStarPosition(cell);
    }
    if (!cell || !position) return { valid: false, reason: "insufficient_uncollected_star_cells" };
    stars.push({
      ...cell,
      ...position,
      collected: false,
      assigned_puck: -1,
      collect_time: null,
      pickup_bounce_count: null,
      pickup_phase: "not_collected"
    });
  }
  roundOutcome.star_positions = stars;
  roundOutcome.stars_collected = stars.filter((star) => star.collected).length;
  return { valid: true, stars };
}

function buildVisualMultiPlusPlanLegacy(roundOutcome, trajectories) {
  const config = getMathConfiguration();
  if (!config || !roundOutcome || !trajectories?.length) {
    return { valid: false, reason: "multi_plus_planner_unavailable" };
  }
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ 0x4d554c54) >>> 0);
  const tokenRadius = config.puck_radius * 0.56;
  const borderMargin = tokenRadius + 0.018;
  const minimumTokenGap = tokenRadius * 2.7;
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const stars = roundOutcome.star_positions || [];
  const starCellKeys = new Set(stars.map((star) => `${star.col}_${star.row}`));
  const occupiedPocketCellKeys = new Set([
    state.fieldPocket && `${state.fieldPocket.col}_${state.fieldPocket.row}`,
    state.chancePocket && `${state.chancePocket.col}_${state.chancePocket.row}`
  ].filter(Boolean));
  const multiPlusCellKeys = new Set((config.multi_plus?.sectors || []).map((sector) => `${sector.col}_${sector.row}`));
  const emptyCells = config.sector_definitions.empty.filter((sector) => sector.index >= 0
    && sector.index !== launchIndex
    && !starCellKeys.has(`${sector.col}_${sector.row}`)
    && !occupiedPocketCellKeys.has(`${sector.col}_${sector.row}`)
    && (!roundOutcome.multi_plus_triggered || !multiPlusCellKeys.has(`${sector.col}_${sector.row}`)));
  if (!emptyCells.length) {
    return { valid: false, reason: "no_empty_cells_for_multi_plus_token" };
  }
  const emptyCellKeys = new Set(emptyCells.map((sector) => `${sector.col}_${sector.row}`));
  const clearsStars = (x, y) => stars.every((star) => !Number.isFinite(star.x) || !Number.isFinite(star.y)
    || Math.hypot(x - star.x, y - star.y) >= minimumTokenGap);

  if (roundOutcome.multi_plus_triggered) {
    const candidates = [];
    const preferredPuck = Math.max(0, roundOutcome.puck_results.findIndex((result) => result.multi_plus));
    const puckOrder = [preferredPuck, ...trajectories.map((_, index) => index).filter((index) => index !== preferredPuck)];
    puckOrder.forEach((puckIndex, orderIndex) => {
      const trajectory = trajectories[puckIndex];
      const frames = trajectory?.frames || [];
      for (let index = 1; index < frames.length - 1; index += 3) {
        const frame = frames[index];
        const progress = index / (frames.length - 1);
        const pathX = frame[1];
        const pathY = frame[2];
        const cell = {
          col: clamp(Math.floor(((pathX + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1),
          row: clamp(Math.floor(((pathY + 1) / 2) * GRID_SIZE), 0, GRID_SIZE - 1)
        };
        const x = -1 + (cell.col + 0.5) * 2 / GRID_SIZE;
        const y = -1 + (cell.row + 0.5) * 2 / GRID_SIZE;
        if (progress < 0.08 || progress > 0.72) continue;
        if (Math.abs(x) > 1 - borderMargin || Math.abs(y) > 1 - borderMargin) continue;
        if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, tokenRadius)) continue;
        if (!emptyCellKeys.has(`${cell.col}_${cell.row}`)) continue;
        if (!clearsStars(x, y)) continue;
        candidates.push({ frame, index, progress, puckIndex, orderIndex, x, y, cell });
      }
    });
    if (!candidates.length) {
      return { valid: false, reason: "no_collectible_multi_plus_position" };
    }
    candidates.sort((first, second) => first.orderIndex - second.orderIndex
      || Math.abs(first.progress - 0.32) - Math.abs(second.progress - 0.32));
    const bestOrder = candidates[0].orderIndex;
    const preferredCandidates = candidates.filter((candidate) => candidate.orderIndex === bestOrder);
    const selected = preferredCandidates[rng.int(preferredCandidates.length)];
    const frame = selected.frame;
    roundOutcome.multi_plus_assigned_puck = selected.puckIndex;
    roundOutcome.puck_results.forEach((result, index) => {
      result.multi_plus = index === selected.puckIndex;
    });
    roundOutcome.multi_plus_position = {
      x: selected.x,
      y: selected.y,
      col: selected.cell.col,
      row: selected.cell.row,
      collected: true,
      assigned_puck: selected.puckIndex,
      collect_time: frame[0],
      pickup_bounce_count: frame[5]
    };
    return { valid: true, token: roundOutcome.multi_plus_position };
  }

  const pathMargin = config.puck_radius + tokenRadius + 0.034;
  const secretPocketPoints = {
    top: [0, -1],
    right: [1, 0],
    bottom: [0, 1],
    left: [-1, 0]
  };
  const pointToSegmentDistance = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0
      ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSquared, 0, 1)
      : 0;
    const closestX = ax + dx * t;
    const closestY = ay + dy * t;
    return Math.hypot(x - closestX, y - closestY);
  };
  const pathSegments = trajectories.flatMap((trajectory) => {
    const frames = trajectory.frames || [];
    const segments = [];
    for (let index = 1; index < frames.length; index += 1) {
      segments.push([frames[index - 1][1], frames[index - 1][2], frames[index][1], frames[index][2]]);
    }
    const pocketPoint = trajectory.secret_room?.zone_id === FIELD_POCKET_ZONE_ID
      ? (() => {
        const point = getFieldPocketNormalized();
        return point ? [point.x, point.y] : null;
      })()
      : secretPocketPoints[trajectory.secret_room?.zone_id];
    if (pocketPoint && frames.length) {
      const lastFrame = frames.at(-1);
      segments.push([lastFrame[1], lastFrame[2], pocketPoint[0], pocketPoint[1]]);
    }
    return segments;
  });
  const touchesAnyPuckPath = (x, y) => pathSegments.some(([ax, ay, bx, by]) =>
    pointToSegmentDistance(x, y, ax, ay, bx, by) < pathMargin);
  const cellSize = 2 / GRID_SIZE;
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const cell = emptyCells[rng.int(emptyCells.length)];
    const x = -1 + (cell.col + 0.5) * cellSize;
    const y = -1 + (cell.row + 0.5) * cellSize;
    if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, tokenRadius)) continue;
    if (!clearsStars(x, y)) continue;
    if (touchesAnyPuckPath(x, y)) continue;
    roundOutcome.multi_plus_position = {
      x,
      y,
      col: cell.col,
      row: cell.row,
      collected: false,
      assigned_puck: -1,
      collect_time: null,
      pickup_bounce_count: null
    };
    return { valid: true, token: roundOutcome.multi_plus_position };
  }
  const fallback = findSafeUncollectedSymbolPosition({
    roundOutcome,
    config,
    trajectories,
    radius: tokenRadius,
    occupied: stars.filter((star) => Number.isFinite(star.x) && Number.isFinite(star.y))
      .map((star) => ({ x: star.x, y: star.y, radius: tokenRadius })),
    forbiddenCellKeys: new Set(),
    salt: 0x4d554c54
  });
  if (fallback) {
    roundOutcome.multi_plus_position = {
      ...fallback,
      collected: false,
      assigned_puck: -1,
      collect_time: null,
      pickup_bounce_count: null
    };
    return { valid: true, token: roundOutcome.multi_plus_position };
  }
  return { valid: false, reason: "no_safe_multi_plus_position" };
}

function normalizedDistanceToTrajectory(x, y, trajectory) {
  const frames = trajectory?.frames || [];
  let minimum = Infinity;
  for (let index = 1; index < frames.length; index += 1) {
    minimum = Math.min(minimum,
      distanceToFixedSymbolSegment({ x, y }, frames[index - 1], frames[index]).distance);
  }
  return minimum;
}

function findSafeUncollectedSymbolPosition({
  roundOutcome,
  config,
  trajectories,
  radius,
  occupied,
  forbiddenCellKeys,
  salt
}) {
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const primaryCells = config.sector_definitions.empty.filter((sector) => sector.index >= 0
    && sector.index !== launchIndex
    && !forbiddenCellKeys.has(`${sector.col}_${sector.row}`));
  const primaryKeys = new Set(primaryCells.map((sector) => `${sector.col}_${sector.row}`));
  const fallbackCells = [];
  for (let row = 0; row < GRID_SIZE; row += 1) for (let col = 0; col < GRID_SIZE; col += 1) {
    const index = row * GRID_SIZE + col;
    const key = `${col}_${row}`;
    if (index === launchIndex || primaryKeys.has(key) || forbiddenCellKeys.has(key)) continue;
    fallbackCells.push({ index, col, row });
  }
  const cellPools = [primaryCells, fallbackCells].filter((pool) => pool.length);
  if (!cellPools.length) return null;
  const rng = window.PuckLuckMath.createRng((roundOutcome.seed ^ salt) >>> 0);
  const cellSize = 2 / GRID_SIZE;
  const padding = radius + 0.014;
  const pathClearance = config.puck_radius + radius + 0.018;
  for (const cells of cellPools) {
    for (let attempt = 0; attempt < 2400; attempt += 1) {
      const cell = cells[rng.int(cells.length)];
      const left = -1 + cell.col * cellSize + padding;
      const right = -1 + (cell.col + 1) * cellSize - padding;
      const top = -1 + cell.row * cellSize + padding;
      const bottom = -1 + (cell.row + 1) * cellSize - padding;
      const x = left + rng.next() * Math.max(0, right - left);
      const y = top + rng.next() * Math.max(0, bottom - top);
      if (!collectibleSymbolClearsFieldObstaclesNormalized(x, y, radius)) continue;
      if (occupied.some((symbol) => Math.hypot(x - symbol.x, y - symbol.y)
        < radius + symbol.radius + 0.02)) continue;
      if (trajectories.some((trajectory) =>
        normalizedDistanceToTrajectory(x, y, trajectory) <= pathClearance)) continue;
      return { x, y, col: cell.col, row: cell.row, index: cell.index };
    }
  }
  return null;
}

function reconcileUncollectedSymbols(roundOutcome, config, trajectories) {
  const stars = roundOutcome.star_positions || [];
  const token = roundOutcome.multi_plus_position;
  const symbolRadius = config.puck_radius * 0.56;
  const pathClearance = config.puck_radius + symbolRadius + 0.018;
  const forbiddenCellKeys = new Set(roundOutcome.multi_plus_triggered
    ? (config.multi_plus?.sectors || []).map((sector) => `${sector.col}_${sector.row}`)
    : []);
  const occupied = [];
  const relocateIfNeeded = (symbol, salt, reason) => {
    if (!symbol || symbol.collected) {
      if (symbol && Number.isFinite(symbol.x) && Number.isFinite(symbol.y)) {
        occupied.push({ x: symbol.x, y: symbol.y, radius: symbolRadius });
      }
      return { valid: true };
    }
    const crossesPath = trajectories.some((trajectory) =>
      normalizedDistanceToTrajectory(symbol.x, symbol.y, trajectory) <= pathClearance);
    const overlapsSymbol = occupied.some((item) =>
      Math.hypot(symbol.x - item.x, symbol.y - item.y) < symbolRadius + item.radius + 0.02);
    if (crossesPath || overlapsSymbol) {
      const replacement = findSafeUncollectedSymbolPosition({
        roundOutcome,
        config,
        trajectories,
        radius: symbolRadius,
        occupied,
        forbiddenCellKeys,
        salt
      });
      if (!replacement) return { valid: false, reason };
      Object.assign(symbol, replacement);
    }
    occupied.push({ x: symbol.x, y: symbol.y, radius: symbolRadius });
    return { valid: true };
  };

  for (let index = 0; index < stars.length; index += 1) {
    const result = relocateIfNeeded(stars[index], 0x53544152 ^ Math.imul(index + 1, 0x9e3779b1),
      `no_safe_uncollected_diamond_${index}`);
    if (!result.valid) return result;
  }
  return relocateIfNeeded(token, 0x4d554c54, "no_safe_uncollected_multi_plus");
}

function assignPlannedSymbolsToPocketRelease(roundOutcome, pocketReleasePlan, mainTrajectories = []) {
  const config = getMathConfiguration();
  const planner = window.PuckLuckTrajectoryPlanner;
  const plans = pocketReleasePlan?.plans || [];
  if (!config || !planner) return { valid: false, reason: "pocket_symbol_dependencies_unavailable" };
  const allTrajectories = [...mainTrajectories, ...plans.map((plan) => plan.trajectory)].filter(Boolean);
  const emptyKeys = new Set((config.sector_definitions.empty || [])
    .filter((sector) => sector.index >= 0)
    .map((sector) => `${sector.col}_${sector.row}`));
  const symbolRadius = config.puck_radius * 0.56;
  const stars = roundOutcome.star_positions || [];
  const candidates = [];
  plans.forEach(({ result, trajectory }, planIndex) => {
    planner.findStarCandidates(trajectory, GRID_SIZE, config.puck_radius).forEach((candidate) => {
      if (!emptyKeys.has(`${candidate.col}_${candidate.row}`)) return;
      if (!collectibleSymbolClearsFieldObstaclesNormalized(candidate.x, candidate.y, symbolRadius)) return;
      const mainPathClearance = config.puck_radius + symbolRadius + 0.018;
      if (mainTrajectories.some((mainTrajectory) =>
        normalizedDistanceToTrajectory(candidate.x, candidate.y, mainTrajectory) <= mainPathClearance)) return;
      candidates.push({ ...candidate, result, trajectory, planIndex });
    });
  });
  candidates.sort((first, second) => first.planIndex - second.planIndex
    || Math.abs(first.t / Math.max(0.001, first.trajectory.duration) - 0.36)
      - Math.abs(second.t / Math.max(0.001, second.trajectory.duration) - 0.36));

  const assignedCandidates = [];
  const usedResultPaths = new Set();
  stars.filter((star) => star.collected).forEach((collectedStar) => {
    const clearsAssigned = (candidate) => assignedCandidates.every((assigned) =>
      Math.hypot(candidate.x - assigned.x, candidate.y - assigned.y) >= symbolRadius * 2.5);
    const starCandidate = candidates.find((candidate) =>
      !usedResultPaths.has(candidate.result.result_path) && clearsAssigned(candidate))
      || candidates.find(clearsAssigned);
    if (!starCandidate) return;
    Object.assign(collectedStar, {
      index: starCandidate.row * GRID_SIZE + starCandidate.col,
      x: starCandidate.x,
      y: starCandidate.y,
      row: starCandidate.row,
      col: starCandidate.col,
      assigned_puck: -1,
      assigned_result_path: starCandidate.result.result_path,
      collect_time: starCandidate.t,
      pickup_bounce_count: starCandidate.bounce_count,
      pickup_phase: starCandidate.phase,
      collected_by_bonus_ball: true
    });
    assignedCandidates.push(starCandidate);
    usedResultPaths.add(starCandidate.result.result_path);
  });

  if (roundOutcome.multi_plus_triggered && roundOutcome.multi_plus_position) {
    const tokenCandidate = candidates.find((candidate) => stars.every((star) =>
      !Number.isFinite(star.x) || !Number.isFinite(star.y)
      || Math.hypot(candidate.x - star.x, candidate.y - star.y) >= symbolRadius * 2.7));
    if (tokenCandidate) {
      roundOutcome.multi_plus_assigned_puck = -1;
      roundOutcome.puck_results.forEach((result) => { result.multi_plus = false; });
      roundOutcome.multi_plus_position = {
        x: tokenCandidate.x,
        y: tokenCandidate.y,
        col: tokenCandidate.col,
        row: tokenCandidate.row,
        collected: true,
        assigned_puck: -1,
        assigned_result_path: tokenCandidate.result.result_path,
        collect_time: tokenCandidate.t,
        pickup_bounce_count: tokenCandidate.bounce_count,
        collected_by_bonus_ball: true
      };
    }
  }
  return reconcileUncollectedSymbols(roundOutcome, config, allTrajectories);
}

function normalizeAuthoritativeResult(outcomePlan) {
  if (!outcomePlan) return null;
  const target = outcomePlan.sector || { col: GRID_SIZE - 1, row: GRID_SIZE - 1 };
  return {
    ...outcomePlan,
    col: target.col,
    row: target.row,
    category: outcomePlan.category,
    multiplier: outcomePlan.multiplier,
    secretRoom: Boolean(outcomePlan.secret_room),
    secretZoneId: outcomePlan.secret_zone_id || null,
    pocketRelease: Boolean(outcomePlan.pocket_release)
  };
}

function createPuck(index, count, outcomePlan = null, trajectory = null) {
  const { half, puckRadius } = state.field;
  const start = half - puckRadius * 1.8;
  const spread = count === 1 ? 0 : (index - (count - 1) / 2) * 2.5;
  const angleOffset = (outcomePlan?.launch_angle_degrees || 0) + spread;
  const angle = (-135 + angleOffset) * Math.PI / 180;
  const speed = outcomePlan?.launch_force || getMathConfiguration()?.fixed_launch_force || 1250;
  const target = outcomePlan?.sector || { col: GRID_SIZE - 1, row: GRID_SIZE - 1 };
  const firstFrame = trajectory?.frames?.[0];

  const puck = {
    x: firstFrame ? firstFrame[1] * half : start,
    y: firstFrame ? firstFrame[2] * half : start,
    vx: firstFrame ? firstFrame[3] * half : Math.cos(angle) * speed,
    vy: firstFrame ? firstFrame[4] * half : Math.sin(angle) * speed,
    speed,
    age: 0,
    bounceCount: 0,
    requiredBounces: outcomePlan?.required_bounces || 3,
    visualRngState: (outcomePlan?.visual_seed || (index + 1) * 2654435761) >>> 0,
    authoritativeResult: normalizeAuthoritativeResult(outcomePlan),
    replayTrajectory: trajectory,
    replayFrame: 0,
    replayCursor: 0,
    replayDelayFrames: Math.round((trajectory?.stagger_delay || 0) / FIXED_PHYSICS_STEP),
    pocketDepth: 0,
    purpleBoost: false,
    pocketRelease: false,
    purpleReturnTargetSector: outcomePlan?.secret_room ? choosePurpleReturnSector(outcomePlan) : null,
    secretRoom: trajectory?.secret_room ? {
      zoneId: trajectory.secret_room.zone_id,
      phase: "entry",
      pocketCaptureArmed: Boolean(trajectory.secret_room.pocket_capture_armed),
      roomCursor: 0,
      roomFrame: 0
    } : null,
    stopped: false,
    result: null
  };
  return puck;
}

function keepBonusStarsOutsidePocketCells(stars) {
  const { half, grid } = state.field;
  // The yellow token is created after the stars; use its planned cell here.
  const pockets = [state.fieldPocket, state.chancePocket, state.roundOutcome?.multi_plus_position];
  const blocked = new Set(pockets.filter(Boolean).map((cell) => `${cell.col}_${cell.row}`));
  const candidates = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const key = `${col}_${row}`;
      // Multiplier cells are eligible too; only pockets and the launch cell are excluded.
      if (!blocked.has(key)
          && !(col === GRID_SIZE - 1 && row === GRID_SIZE - 1)) candidates.push({ col, row });
    }
  }
  const rng = window.PuckLuckMath.createRng((state.roundOutcome?.seed || 1) ^ 0x4449414d);
  stars.forEach((star, index) => {
    const cell = candidates.splice(rng.int(candidates.length), 1)[0];
    // Equal local offsets project vertically: upper/lower diamond corners.
    // Inset the symbol slightly so it stays inside its cell and clear of the walls.
    const inset = Math.min(grid * 0.24, Math.max(grid * 0.17, star.radius + 3));
    const offset = rng.int(2) === 0 ? inset : grid - inset;
    star.x = -half + grid * cell.col + offset;
    star.y = -half + grid * cell.row + offset;
    star.col = cell.col;
    star.row = cell.row;
    const planned = state.roundOutcome?.star_positions?.[index];
    if (planned) Object.assign(planned, {
      col: cell.col, row: cell.row, index: cell.row * GRID_SIZE + cell.col,
      x: star.x / half, y: star.y / half
    });
  });
  return stars;
}

function createBonusStars() {
  if (window.BalloroBonusUI?.isV2) return [];
  const { half, grid, puckRadius } = state.field;
  const starRadius = puckRadius * 0.56;
  if (state.roundOutcome?.star_positions) {
    return keepBonusStarsOutsidePocketCells(state.roundOutcome.star_positions.map((star, index) => ({
      x: Number.isFinite(star.x) ? star.x * half : -half + grid * (star.col + 0.5),
      y: Number.isFinite(star.y) ? star.y * half : -half + grid * (star.row + 0.5),
      col: star.col,
      row: star.row,
      radius: starRadius,
      shouldCollect: star.collected,
      assignedPuck: star.assigned_puck ?? index % state.puckCount,
      assignedResultPath: star.assigned_result_path || null,
      collectAfter: star.collect_time ?? 1.25 + index * 0.55,
      pickupBounceCount: star.pickup_bounce_count ?? null,
      pickupPhase: star.pickup_phase || (star.collected ? "unspecified" : "not_collected"),
      collected: false
    })));
  }
  const cells = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const isLaunchCorner = col === GRID_SIZE - 1 && row === GRID_SIZE - 1;
      if (!isLaunchCorner) {
        cells.push({ col, row });
      }
    }
  }

  const stars = [];
  const fallbackRng = window.PuckLuckMath.createRng((state.roundOutcome?.seed || 1) ^ 0x53544152);
  const borderMargin = starRadius + 4;
  while (stars.length < getRequiredStars() && cells.length > 0) {
    const index = fallbackRng.int(cells.length);
    const [cell] = cells.splice(index, 1);
    let x;
    let y;
    let placed = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      x = -half + borderMargin + fallbackRng.next() * (half * 2 - borderMargin * 2);
      y = -half + borderMargin + fallbackRng.next() * (half * 2 - borderMargin * 2);
      if (!collectibleSymbolClearsFieldObstaclesLocal(x, y, starRadius)) continue;
      if (stars.every((star) => Math.hypot(x - star.x, y - star.y) >= starRadius * 2.5)) {
        placed = true;
        break;
      }
    }
    if (!placed) continue;
    stars.push({
      x,
      y,
      col: cell.col,
      row: cell.row,
      radius: starRadius,
      shouldCollect: true,
      collected: false
    });
  }
  return keepBonusStarsOutsidePocketCells(stars);
}

function createMultiPlusToken() {
  const token = state.roundOutcome?.multi_plus_position;
  if (!token) return null;
  const { half, grid } = state.field;
  return {
    x: -half + grid * (token.col + 0.5),
    y: -half + grid * (token.row + 0.5),
    col: token.col,
    row: token.row,
    radius: state.field.puckRadius * 0.56,
    shouldCollect: token.collected,
    assignedPuck: token.assigned_puck,
    assignedResultPath: token.assigned_result_path || null,
    collectAfter: token.collect_time,
    pickupBounceCount: token.pickup_bounce_count,
    collected: false,
    plannedCaptureConsumed: false
  };
}

function launchBonusPuck() {
  if (!state.running) {
    return;
  }

  const puck = createPuck(0, 1);
  puck.bonus = true;
  state.pucks.push(puck);
  playLaunchSound();
}

function collectBonusStarByTouch(puck) {
  for (let index = state.bonusStars.length - 1; index >= 0; index -= 1) {
    const star = state.bonusStars[index];
    if (star.collected) {
      continue;
    }

    const hitRadius = state.field.puckRadius + star.radius + 2;
    if (distanceToPuckSegment(puck, star) > hitRadius) {
      continue;
    }

    collectBonusStar(index, puck);
  }
}

function markSettledCellAsBoosted(puck) {
  const puckIndex = state.pucks.indexOf(puck);
  state.settledCells.forEach((cell) => {
    if (cell.puckIndex === puckIndex) cell.purpleBoost = true;
  });
}

function upgradeSettledResultToX10(puck, { animate = true, playSound = true } = {}) {
  const result = puck?.result;
  if (!result || result.multiplier <= 0 || (result.secretRoom && !result.chanceRoom) || result.x10Boosted) {
    return false;
  }
  const basePayout = Number.isFinite(result.basePayout)
    ? result.basePayout
    : Number.isFinite(result.payout)
      ? result.payout
      : state.activeBetPerPuck * result.multiplier;
  const boostedPayout = basePayout * 10;
  result.basePayout = basePayout;
  result.x10Boosted = true;
  result.boostFromMultiplier = result.multiplier;
  result.boostRevealStartedAt = animate && state.animationsEnabled ? (window.BalloroGameLifecycle?.now() ?? performance.now()) : 0;
  result.payout = boostedPayout;
  captureResultCellSymbol(puck);
  const payoutDelta = boostedPayout - basePayout;
  if (payoutDelta > 0) {
    state.bankroll += payoutDelta;
    state.roundWinAmount += payoutDelta;
    updateBank();
  }
  markSettledCellAsBoosted(puck);
  if (playSound) playMultiplierResultSound(result.multiplier, true);
  return true;
}

function activateX10Boost() {
  if (state.x10BoostActivated) return;
  state.x10BoostActivated = true;
  state.crownBonusAwarded = true;
  if (window.BalloroBonusUI?.isV3) return;
  const upgradedResults = state.pucks.filter((puck) => upgradeSettledResultToX10(puck));
  if (upgradedResults.length) {
    updateBank();
    updateRoundWinLabel();
    startResultRevealAnimation();
  }
}

function collectBonusStar(index, collector = null) {
  const star = state.bonusStars[index];
  if (!star || star.collected) {
    return;
  }
  star.collected = true;
  const pickupPuck = collector || state.pucks[star.assignedPuck];
  state.starPickupLog.push({
    star_index: state.roundOutcome?.star_positions?.findIndex((item) => item.col === star.col && item.row === star.row) ?? index,
    time: Number((pickupPuck?.age || 0).toFixed(4)),
    bounce_count: pickupPuck?.bounceCount || pickupPuck?.secretBounceCount || 0,
    phase: star.pickupPhase,
    collector_result_path: pickupPuck?.authoritativeResult?.result_path || "main"
  });
  const counterFlyIn = spawnCounterFlyIn(
    "diamond",
    toScreen(star.x, star.y),
    getCrownCounterTargetPoint(state.crownsCollected),
    star.radius
  );
  spawnStarBurst(star, "purple");
  recordDiamondPickupEffect({ x: star.x, y: star.y, radius: star.radius }, state.crownsCollected);
  state.bonusStars.splice(index, 1);
  state.crownsCollected = Math.min(getRequiredStars(), state.crownsCollected + 1);
  updateCrownCounter();
  if (state.crownsCollected >= getRequiredStars()) {
    if (state.roundOutcome?.bonus_triggered || POCKET_TEST_RANDOM_PHYSICS) activateX10Boost();
    playBonusCompleteSound();
  } else {
    playBonusStarSound(state.crownsCollected);
  }
}

function distanceToPuckSegment(puck, target) {
  const startX = Number.isFinite(puck.previousX) ? puck.previousX : puck.x;
  const startY = Number.isFinite(puck.previousY) ? puck.previousY : puck.y;
  const segmentX = puck.x - startX;
  const segmentY = puck.y - startY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection = segmentLengthSquared > 0
    ? clamp(((target.x - startX) * segmentX + (target.y - startY) * segmentY) / segmentLengthSquared, 0, 1)
    : 0;
  const closestX = startX + segmentX * projection;
  const closestY = startY + segmentY * projection;
  return Math.hypot(target.x - closestX, target.y - closestY);
}

function collectPocketReleaseSymbolsByTouch(puck) {
  collectBonusStarByTouch(puck);
  collectMultiPlusByTouch(puck, 1);
}

function collectPlannedStars() {
  for (let index = state.bonusStars.length - 1; index >= 0; index -= 1) {
    const star = state.bonusStars[index];
    const puck = state.pucks[star.assignedPuck];
    if (!star.shouldCollect || !puck || puck.purpleBoost || puck.pocketRelease || puck.age < star.collectAfter) {
      continue;
    }
    collectBonusStar(index);
  }
}

function collectMultiPlusByTouch(puck, captureChance = 1, allowUnplanned = false, atRest = false) {
  if (window.BalloroBonusUI?.isV2 && !atRest) return;
  const token = state.multiPlusToken;
  if (!token || token.collected || token.consumed) return;
  const hitRadius = state.field.puckRadius + token.radius + 2;
  if (puck.multiPlusExitRequired) {
    if (Math.hypot(puck.x - token.x, puck.y - token.y) <= hitRadius) return;
    puck.multiPlusExitRequired = false;
    return;
  }
  const startX = Number.isFinite(puck.previousX) ? puck.previousX : puck.x;
  const startY = Number.isFinite(puck.previousY) ? puck.previousY : puck.y;
  const segmentX = puck.x - startX;
  const segmentY = puck.y - startY;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
  const projection = segmentLengthSquared > 0
    ? clamp(((token.x - startX) * segmentX + (token.y - startY) * segmentY) / segmentLengthSquared, 0, 1)
    : 0;
  const closestX = startX + segmentX * projection;
  const closestY = startY + segmentY * projection;
  const settledHitRadius = Math.max(0, state.field.puckRadius + token.radius - 1);
  const inRange = window.BalloroBonusUI?.isV2
    ? (Math.hypot(puck.x - token.x, puck.y - token.y) <= settledHitRadius
      || (window.BalloroBonusUI?.isV4 && atRest
        && getCellFromPoint(puck.x, puck.y).col === token.col
        && getCellFromPoint(puck.x, puck.y).row === token.row))
    : (closestX - token.x) ** 2 + (closestY - token.y) ** 2 <= hitRadius ** 2;
  if (inRange
    && (captureChance >= 1 || nextPuckRandom(puck) <= captureChance)) {
    collectMultiPlus(puck, true);
  }
}

function upgradeSettledResultToMultiPlus(puck) {
  const result = puck?.result;
  // EX MULTI can stop on any previously empty cell, including one occupied by
  // an ordinary settled ball. Upgrade every settled zero-result puck there.
  if (!result || result.secretRoom || result.multiplier > 0) {
    return false;
  }
  const multiplier = getCellMultiplier(result.col, result.row);
  if (multiplier <= 0 || getCellCategory(result.col, result.row) !== "multi_plus") {
    return false;
  }
  const basePayout = state.activeBetPerPuck * multiplier;
  const x10Boosted = window.BalloroBonusUI?.isV3
    ? Boolean(puck.v3PurpleBonus) : isX10BoostActive();
  const payout = basePayout * (x10Boosted ? 10 : 1);
  result.category = "multi_plus";
  result.multiplier = multiplier;
  result.basePayout = basePayout;
  result.payout = payout;
  result.multiPlusBoosted = true;
  result.x10Boosted = x10Boosted;
  captureResultCellSymbol(puck);
  puck.resultRevealStartedAt = (window.BalloroGameLifecycle?.now() ?? performance.now());
  state.bankroll += payout;
  state.roundWinAmount += payout;

  const puckIndex = state.pucks.indexOf(puck);
  let settledCell = state.settledCells.find((cell) => cell.puckIndex === puckIndex);
  if (!settledCell) {
    settledCell = {
      col: result.col,
      row: result.row,
      puckIndex,
      squareWin: true,
      lineWin: false
    };
    state.settledCells.push(settledCell);
  }
  settledCell.squareWin = true;
  settledCell.purpleBoost = x10Boosted;
  playMultiplierResultSound(multiplier, x10Boosted, window.BalloroBonusUI?.isV3);
  updateBank();
  updateRoundWinLabel();
  startResultRevealAnimation();
  return true;
}

function collectMultiPlus(puck = null, allowUnplanned = false) {
  const token = state.multiPlusToken;
  if (!token || token.consumed || token.collected || (!token.shouldCollect && !allowUnplanned)) return;
  if (!puck || state.multiPlusCapturedPuck) return;
  if (!registerMvpPocketVisit(puck, "lemon")) return;
  const firstV3Symbol = window.BalloroBonusUI?.isV3
    ? claimV3ExclusiveBonus("lemon", puck) : false;
  token.consumed = true;
  token.captured = true;
  token.v2SymbolPending = Boolean(window.BalloroBonusUI?.isV2)
    && (!window.BalloroBonusUI?.isV3 || firstV3Symbol);
  token.v2Activated = window.BalloroBonusUI?.isV3 && !firstV3Symbol;
  puck.multiPlusCapture = createFieldPocketPullCapture(puck, token.x, token.y);
  state.multiPlusCapturedPuck = puck;
  state.multiPlusPhase = "capturing";
  state.multiPlusPickupLog = {
    time: Number((puck?.age ?? token.collectAfter ?? 0).toFixed(4)),
    bounce_count: puck?.bounceCount ?? token.pickupBounceCount ?? 0,
    collector_result_path: puck?.authoritativeResult?.result_path || "main"
  };
  if (window.BalloroBonusUI?.isV3 && firstV3Symbol) startMultiPlusPocketSymbolPickup();
  updateMultiPlusCounter();
}

function startMultiPlusPocketSymbolPickup() {
  const token = state.multiPlusToken;
  if (!token?.v2SymbolPending) return;
  token.v2Activated = recordV2PocketPickup("lemon", token.x, token.y, token.radius,
    (activated) => {
      token.v2Activated = activated;
      token.v2SymbolPending = false;
    });
}

function createFieldPocketPullCapture(puck, targetX, targetY) {
  const captureDistance = Math.hypot(targetX - puck.x, targetY - puck.y);
  const entrySpeed = Math.max(0.001, puck.speed);
  return {
    elapsed: 0,
    duration: Math.min(FIELD_POCKET_PULL_MAX_DURATION_SECONDS,
      Math.max(FIXED_PHYSICS_STEP, captureDistance / entrySpeed)),
    startX: puck.x,
    startY: puck.y,
    targetX,
    targetY
  };
}

function canCaptureMvpPocket(puck, kind) {
  return !window.BalloroBonusUI?.isV4 || !window.BalloroMvpMath?.enabled()
    || puck.v3ReservedPocketVisit === kind
    || window.BalloroMvpMath.canEnterPocket(puck.v3PocketVisits, kind);
}

function registerMvpPocketVisit(puck, kind, queued = false) {
  if (!window.BalloroBonusUI?.isV4 || !window.BalloroMvpMath?.enabled()) return true;
  // A queued arrival is already one entry; transfer into the ready pocket
  // must not count it again. Immutable updates keep sibling histories separate.
  if (puck.v3ReservedPocketVisit === kind) {
    if (!queued) puck.v3ReservedPocketVisit = null;
    return true;
  }
  if (!canCaptureMvpPocket(puck, kind)) return false;
  puck.v3PocketVisits = window.BalloroMvpMath.enterPocket(puck.v3PocketVisits, kind);
  puck.v3ReservedPocketVisit = queued ? kind : null;
  return true;
}

function queueV3PocketPuck(puck, kind, point, zoneId = null) {
  playControls?.bonus(puck.v3ShotId);
  if (!window.BalloroBonusUI?.isV3 || puck.waitingForPocket || puck.v3QueuePull) return false;
  const mathKind = kind === "blue" ? zoneId === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond"
    : kind === "yellow" ? "lemon" : "crown";
  if (!registerMvpPocketVisit(puck, mathKind, true)) return false;
  puck.authoritativeResult = null;
  puck.v3PocketQueueAdvancing = false;
  puck.waitingForPocket = { kind, zoneId, enteredAt: (window.BalloroGameLifecycle?.now() ?? performance.now()) };
  puck.v3QueuePull = createFieldPocketPullCapture(puck, point.x, point.y);
  claimV3ExclusiveBonus(kind === "blue"
    ? zoneId === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond"
    : kind === "yellow" ? "lemon" : "crown", puck);
  return true;
}

function stepFieldPocketPullCapture(puck, capture) {
  const captureStep = getLiveBonusPreparationStep();
  capture.elapsed += captureStep;
  const progress = clamp(capture.elapsed / capture.duration, 0, 1);
  puck.previousX = puck.x;
  puck.previousY = puck.y;
  puck.x = capture.startX + (capture.targetX - capture.startX) * progress;
  puck.y = capture.startY + (capture.targetY - capture.startY) * progress;
  puck.vx = (puck.x - puck.previousX) / captureStep;
  puck.vy = (puck.y - puck.previousY) / captureStep;
  puck.speed = Math.hypot(puck.vx, puck.vy);
  puck.pocketDepth = progress * 0.55;
  collectBonusStarByTouch(puck);
  if (progress < 1) return false;
  puck.x = capture.targetX;
  puck.y = capture.targetY;
  puck.vx = 0;
  puck.vy = 0;
  puck.speed = 0;
  playPocketCaptureSound(puck);
  return true;
}

function stepMultiPlusPocketCapture(puck) {
  if (state.multiPlusPhase !== "capturing" || !puck.multiPlusCapture) return false;
  if (stepFieldPocketPullCapture(puck, puck.multiPlusCapture)) {
    puck.multiPlusCapture = null;
    state.multiPlusPhase = "captured";
    if (window.BalloroBonusUI?.isV2 && !window.BalloroBonusUI?.isV3) {
      startMultiPlusPocketSymbolPickup();
    }
  }
  return true;
}

function collectPlannedMultiPlus() {
  const token = state.multiPlusToken;
  if (!token || token.collected || !token.shouldCollect || token.plannedCaptureConsumed) return;
  const puck = state.pucks[token.assignedPuck];
  if (puck && !puck.purpleBoost && !puck.pocketRelease && !puck.chance && !puck.secretRoom
    && puck.age >= token.collectAfter) {
    token.plannedCaptureConsumed = true;
    collectMultiPlus(puck);
  }
}

function getMultiPlusNeonCandidateCells() {
  if (window.BalloroBonusUI?.isV3) {
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) for (let col = 0; col < GRID_SIZE; col++) {
      if (!window.BalloroV3Rules.pocketKindAt(GRID_SIZE, col, row)) {
        cells.push({ col, row });
      }
    }
    return cells;
  }
  const config = getMathConfiguration();
  const launchKey = `${GRID_SIZE - 1}_${GRID_SIZE - 1}`;
  const blockedKeys = new Set([
    state.fieldPocket && `${state.fieldPocket.col}_${state.fieldPocket.row}`,
    state.bluePocket && `${state.bluePocket.col}_${state.bluePocket.row}`,
    state.chancePocket && `${state.chancePocket.col}_${state.chancePocket.row}`,
    state.multiPlusToken && `${state.multiPlusToken.col}_${state.multiPlusToken.row}`,
    launchKey
  ].filter(Boolean));
  return (config?.sector_definitions?.empty || [])
    .filter((cell) => cell.index >= 0 && !blockedKeys.has(`${cell.col}_${cell.row}`))
    .map((cell) => ({ col: cell.col, row: cell.row }));
}

function getActiveMultiPlusCells() {
  // The chase is presentation only: no extra cell pays until its position is locked.
  const cells = !state.multiPlusActive && getCarriedYellowCells().length ? getCarriedYellowCells()
    : state.multiPlusFinalCells !== null ? state.multiPlusFinalCells
    : POCKET_TEST_RANDOM_PHYSICS ? [] : getMathConfiguration()?.multi_plus?.sectors ?? [];
  return cells.filter((cell) => !isBluePocketCoveringCell(cell));
}

function isBluePocketCoveringCell(cell) {
  const pocket = state.bluePocket;
  return Boolean(window.BalloroBonusUI?.isV2 && pocket && !pocket.finished
    && cell.col === pocket.col && cell.row === pocket.row);
}

function moveMultiPlusNeonCells(now, final = false) {
  const finalSectors = getMathConfiguration()?.multi_plus?.sectors || [];
  if (final) {
    state.multiPlusFinalCells = (state.multiPlusMvpPlan?.cells || state.multiPlusNeonCells)
      .map((cell) => ({ ...cell }));
    if (window.BalloroBonusUI?.isV4) {
      state.yellowFieldReturn = { cells: state.multiPlusFinalCells.map(cell => ({ ...cell })), startedAt: null };
    }
    if (state.multiPlusMvpPlan) state.multiPlusNeonCells = state.multiPlusFinalCells.map(cell => ({ ...cell }));
    return;
  }
  const candidates = getMultiPlusNeonCandidateCells();
  const count = Math.min(window.BalloroBonusUI?.isV3 ? GRID_SIZE : finalSectors.length, candidates.length);
  const step = Math.floor((now - state.multiPlusRevealStartedAt) / MULTI_PLUS_NEON_STEP_MS);
  const rng = window.PuckLuckMath.createRng(
    ((state.roundOutcome?.seed || 1) ^ Math.imul(step + 1, 0x9e3779b1)) >>> 0
  );
  const selected = [];
  if (!state.multiPlusNeonCells.length) {
    while (selected.length < count && candidates.length) {
      selected.push(candidates.splice(rng.int(candidates.length), 1)[0]);
    }
  } else {
    const candidateByKey = new Map(candidates.map((cell) => [`${cell.col}_${cell.row}`, cell]));
    const occupied = new Set();
    const previous = new Set(state.multiPlusNeonCells.map((cell) => `${cell.col}_${cell.row}`));
    state.multiPlusNeonCells.slice(0, count).forEach((current) => {
      const neighbors = [
        [current.col + 1, current.row],
        [current.col - 1, current.row],
        [current.col, current.row + 1],
        [current.col, current.row - 1]
      ].map(([col, row]) => candidateByKey.get(`${col}_${row}`))
        .filter((cell) => cell && !occupied.has(`${cell.col}_${cell.row}`));
      const free = candidates.filter((cell) => !occupied.has(`${cell.col}_${cell.row}`));
      // Empty cells can be isolated by base multipliers/pockets. Jump to another
      // free cell instead of freezing, and avoid merely swapping lit cells.
      const freshNeighbors = neighbors.filter((cell) => !previous.has(`${cell.col}_${cell.row}`));
      const fresh = free.filter((cell) => !previous.has(`${cell.col}_${cell.row}`));
      const moving = free.filter((cell) => cell.col !== current.col || cell.row !== current.row);
      const choices = freshNeighbors.length ? freshNeighbors : fresh.length ? fresh
        : neighbors.length ? neighbors : moving.length ? moving : free;
      const next = choices[rng.int(choices.length)];
      occupied.add(`${next.col}_${next.row}`);
      selected.push(next);
    });
  }
  state.multiPlusNeonCells = selected.map((cell, index) => {
    return {
      ...cell,
      multiplier: window.BalloroBonusUI?.isV3
        ? Math.round((window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules)
          .cellMultiplier(GRID_SIZE, cell.col, cell.row)
          * (window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules).yellowMultiplier * 10) / 10
        : getMultiPlusFieldMultiplier()
    };
  });
}

function maybeAdvanceMultiPlus(now) {
  const puck = state.multiPlusCapturedPuck;
  if (!puck) return;
  if (window.BalloroBonusUI?.isV3 && (state.v3BonusLock !== "lemon"
    || state.v3BonusPuck !== puck)) return;
  if (state.multiPlusPhase === "captured") {
    if (window.BalloroBonusUI?.isV2 && state.multiPlusToken?.v2SymbolPending) return;
    const visualStopSpeed = state.field.half * 0.075;
    const otherActivity = state.pucks.some((item) => item !== puck && !item.stopped
      && item.speed > visualStopSpeed
      && item.secretRoom?.phase !== "pocket_wait"
      && (window.BalloroBonusUI?.isV3 || item !== state.chanceCapturedPuck));
    if (otherActivity) return;
    if (window.BalloroBonusUI?.isV2 && !state.multiPlusToken?.v2Activated) {
      releaseMultiPlusCapturedPuck(puck);
      return;
    }
    state.multiPlusPhase = "revealing";
    state.multiPlusRevealStartedAt = now;
    state.multiPlusNeonCells = [];
    state.multiPlusNeonLastStepAt = 0;
    state.multiPlusNeonFlashUntil = 0;
    state.multiPlusActive = true;
    state.multiPlusActivatedAt = now;
    state.multiPlusMvpPlan = window.BalloroMvpMath?.enabled()
      ? window.BalloroSavedPaths.yellowV2Plan(GRID_SIZE,
        { x: state.multiPlusToken.x / state.field.half, y: state.multiPlusToken.y / state.field.half },
        randomPrototypeUnit, puck.v3PocketVisits) : null;
    moveMultiPlusNeonCells(now);
    updateMultiPlusCounter();
    playMultiPlusSound();
    playMultiPlusNeonCue("start");
    startResultRevealAnimation();
    return;
  }
  if (state.multiPlusPhase !== "revealing") return;
  const revealElapsed = now - state.multiPlusRevealStartedAt;
  if (revealElapsed >= MULTI_PLUS_NEON_DURATION_MS && state.multiPlusNeonFlashUntil === 0) {
    moveMultiPlusNeonCells(now, true);
    // A locked EX MULTI cell pays every ball already resting in that formerly
    // empty cell, not only balls that were released from the EX MULTI pocket.
    if (!window.BalloroBonusUI?.isV3) {
      state.pucks.filter((item) => item.result).forEach(upgradeSettledResultToMultiPlus);
    }
    state.multiPlusNeonFlashUntil = now + MULTI_PLUS_NEON_STOP_FLASH_MS;
    playMultiPlusNeonCue("stop");
  } else if (revealElapsed < MULTI_PLUS_NEON_DURATION_MS
    && now - state.multiPlusNeonLastStepAt >= MULTI_PLUS_NEON_STEP_MS) {
    state.multiPlusNeonLastStepAt = now;
    moveMultiPlusNeonCells(now);
    playMultiPlusNeonCue("step");
  }
  if (!state.multiPlusNeonFlashUntil || now < state.multiPlusNeonFlashUntil) return;
  releaseMultiPlusCapturedPuck(puck);
}

function releaseMultiPlusCapturedPuck(puck) {
  const activatedBonus = Boolean(window.BalloroBonusUI?.isV2 && state.multiPlusToken?.v2Activated && state.multiPlusActive);
  const releaseIndex = state.nextPocketReleaseIndex;
  state.nextPocketReleaseIndex += 1;
  const releaseStartPoint = {
    x: state.multiPlusToken.x / state.field.half,
    y: state.multiPlusToken.y / state.field.half
  };
  const releaseTrajectory = state.multiPlusMvpPlan?.trajectory || (POCKET_TEST_RANDOM_PHYSICS
    ? buildRandomPrototypeTrajectory(releaseStartPoint, -135, puck)
    : planRuntimeFieldPocketTrajectory({
      result: puck.authoritativeResult,
      seed: ((puck.authoritativeResult?.visual_seed || state.roundOutcome?.seed || 1)
        ^ 0x59454c4c ^ Math.imul(releaseIndex + 1, 0x9e3779b1)) >>> 0,
      existingPlans: [],
      startPoint: releaseStartPoint,
      releaseIndex,
      avoidPockets: [releaseStartPoint]
    }));
  if (window.BalloroMvpMath?.enabled()) {
    // The selected cells belong to this branch, including its green children.
    // A later yellow entry replaces the mask; it never stacks another x10.
    puck.v3YellowCells = (state.multiPlusMvpPlan?.cells || state.multiPlusFinalCells || [])
      .map(cell => ({ ...cell }));
  }
  state.multiPlusMvpPlan = null;
  if (!releaseTrajectory) {
    throw new Error("EX MULTI single-ball release trajectory is unavailable");
  }
  state.multiPlusPhase = "idle";
  state.multiPlusNeonCells = [];
  state.multiPlusToken.finished = true;
  state.multiPlusToken.collected = false;
  state.multiPlusToken.captured = false;
  preparePocketReleasePuck(
    puck,
    { id: FIELD_POCKET_ZONE_ID },
    releaseIndex,
    puck.authoritativeResult,
    releaseTrajectory
  );
  puck.trailBonusKind = activatedBonus ? "lemon" : null;
  if (window.BalloroBonusUI?.isV3) puck.pocketBallKind = "lemon";
  if (POCKET_TEST_RANDOM_PHYSICS) puck.authoritativeResult = null;
  puck.multiPlusExitRequired = true;
  state.multiPlusCapturedPuck = null;
  updateMultiPlusCounter();
  playLaunchSound();
}

function resetPucks({ force = false } = {}) {
  if (window.BalloroRoundTapes?.busy && !force) return;
  state.v4HeldPurpleField = false;
  state.v4HeldYellowCells = null;
  state.yellowFieldReturn = null;
  stopHeldPaidLaunches();
  state.v3BonusLock = null;
  state.v3BonusPuck = null;
  state.v3BonusQueue = [];
  state.v3PocketSymbolCycle = { diamond: false, crown: false, lemon: false, blue: false };
  state.v4PocketSymbolAppearance = {};
  state.v3Shots.clear();
  state.v3LastWinAmount = 0;
  if (state.winPresentationUnlockTimer !== null) {
    window.clearTimeout(state.winPresentationUnlockTimer);
    state.winPresentationUnlockTimer = null;
  }
  if (state.resultRevealFrame !== null) {
    cancelAnimationFrame(state.resultRevealFrame);
    state.resultRevealFrame = null;
  }
  if (state.collectibleIdleFrame !== null) {
    cancelAnimationFrame(state.collectibleIdleFrame);
    state.collectibleIdleFrame = null;
  }
  if (state.counterFlyInFrame !== null) {
    cancelAnimationFrame(state.counterFlyInFrame);
    state.counterFlyInFrame = null;
  }
  state.lastCollectibleIdleRenderAt = 0;
  state.pucks = [];
  state.settledCells = [];
  state.wonLines = [];
  state.bonusStars = [];
  state.multiPlusToken = null;
  state.multiPlusActive = false;
  state.multiPlusFinalCells = null;
  state.multiPlusMvpPlan = null;
  state.multiPlusPickupLog = null;
  state.multiPlusActivatedAt = 0;
  state.multiPlusCapturedPuck = null;
  state.multiPlusPhase = "idle";
  state.multiPlusRevealStartedAt = 0;
  state.multiPlusNeonCells = [];
  state.multiPlusNeonLastStepAt = 0;
  state.multiPlusNeonFlashUntil = 0;
  state.starPickupLog = [];
  state.starBursts = [];
  clearCounterFlyIns();
  state.openSecretZones.clear();
  state.secretZoneOpenTimes = {};
  state.secretRoomLaunchAt = 0;
  state.crownsCollected = 0;
  state.v2BonusArrivedActive = { diamond: false, crown: false, lemon: false, blue: false };
  state.x10BoostActivated = false;
  state.crownBonusAwarded = false;
  state.running = false;
  state.launchPrepared = false;
  state.launchPreparedSlot = null;
  state.launchButtonPrimed = false;
  state.roundOutcome = null;
  state.fieldPocket = null;
  state.bluePocket = null;
  state.chancePocket = null;
  state.chanceCapturedPuck = null;
  state.chancePhase = "idle";
  state.chanceSpinStartedAt = 0;
  state.chanceSpinRoomIndex = -1;
  state.chanceSpinTotalSteps = 20;
  state.chanceLastSoundStep = -1;
  state.chanceSelectedRoomId = null;
  state.chanceFinalCueStartedAt = 0;
  state.chanceFinalCueUntil = 0;
  state.chanceFinalCueRoomId = null;
  state.chanceRoomMultipliers = {};
  state.chanceRoomOutcome = null;
  state.chanceCompletedRoomIds.clear();
  state.trajectoryPlans = [];
  state.trajectoryDiagnostics = [];
  state.physicsAccumulator = 0;
  state.activeSlot = null;
  state.activeBetPerPuck = 0;
  state.roundWinAmount = 0;
  state.resultSoundStep = 0;
  state.nextMultiplierSoundAt = 0;
  state.nextPocketReleaseIndex = 0;
  updateCrownCounter();
  updateMultiPlusCounter();
  updateChanceBonusCounter();
  updateRoundWinLabel();
}

function prepareLaunchRound(slot, { debit = true } = {}) {
  if (!window.BalloroBonusUI?.isV3 && window.BalloroRoundTapes?.enabled) return false;
  if (!window.BalloroBonusUI?.isV3 && window.BalloroSavedPaths?.enabled
    && !window.BalloroSavedPaths.has(GRID_SIZE)) return false;
  if (state.running) {
    return false;
  }
  if (state.launchPrepared) {
    return state.launchPreparedSlot === slot;
  }

  setupCanvas();
  const bet = parseBet(slot);
  const count = state.puckCount;
  const totalBet = bet * count;
  if (bet <= 0) {
    return false;
  }

  // Free static-field preparation (line changes/resize) is not a wager.
  // Keep the full board and all pockets visible regardless of the balance;
  // actual paid launches retain their balance check before any debit.
  if (debit && state.bankroll < totalBet) {
    openPopup(els.topUpPopup);
    return false;
  }
  // Retained bonus boards are presentation only; a new paid shot is normal.
  state.v4HeldPurpleField = false;
  state.v4HeldYellowCells = null;
  state.yellowFieldReturn = null;

  const roundSeed = createRoundSeed();
  const roundOutcome = window.PuckLuckMath?.createRound({
    layoutMode: state.layoutMode,
    risk: state.riskLevel,
    lines: GRID_SIZE,
    pucks: count,
    betPerPuck: bet,
    seed: roundSeed
  }) || null;
  state.fieldPocket = usesFieldPocketMechanics()
    ? POCKET_TEST_RANDOM_PHYSICS ? selectPrototypeFieldPocket() : selectRoundFieldPocket(roundOutcome)
    : null;
  const trajectoryResult = usesFieldPocketMechanics() && !state.fieldPocket
    ? { valid: false, reason: "field_pocket_cell_unavailable", plans: [] }
    : POCKET_TEST_RANDOM_PHYSICS ? { valid: true, plans: [] } : buildTrajectoryPlans(roundOutcome);
  applyPocketTestPrototypePlan(roundOutcome, trajectoryResult);
  state.chancePocket = trajectoryResult.valid
    ? selectRoundChancePocket(roundOutcome, trajectoryResult.plans)
    : null;
  placePrototypeMultiPlusPosition(roundOutcome);
  state.bluePocket = selectV2BluePocket(roundOutcome);
  if (window.BalloroBonusUI?.isV2 && !state.bluePocket) {
    console.error("V2 blue pocket has no free field cell");
    return false;
  }
  let pocketReleasePlan = POCKET_TEST_RANDOM_PHYSICS
    ? { valid: true, plans: [] }
    : { valid: false, reason: "pocket_release_dependencies_unavailable", plans: [] };
  if (!POCKET_TEST_RANDOM_PHYSICS && roundOutcome && trajectoryResult.valid) {
    try {
      pocketReleasePlan = buildPocketReleaseTrajectoryPlans(roundOutcome);
    } catch (error) {
      pocketReleasePlan = { valid: false, reason: error.message, plans: [] };
    }
  }
  const fixedSymbolPlan = !POCKET_TEST_RANDOM_PHYSICS && FIXED_BONUS_SYMBOL_LAYOUT && trajectoryResult.valid
    ? buildFixedBonusSymbolPlan(roundOutcome, trajectoryResult.plans)
    : null;
  if (fixedSymbolPlan && !fixedSymbolPlan.valid) {
    roundOutcome.fixed_bonus_fallback_reason = fixedSymbolPlan.reason;
  }
  const starPlan = POCKET_TEST_RANDOM_PHYSICS
    ? { valid: true, stars: roundOutcome.star_positions, mode: "physical" }
    : fixedSymbolPlan?.valid
    ? fixedSymbolPlan
    : trajectoryResult.valid
      ? buildVisualStarPlanLegacy(roundOutcome, trajectoryResult.plans)
      : { valid: false, reason: trajectoryResult.reason };
  const uniqueTrajectoryPlan = POCKET_TEST_RANDOM_PHYSICS
    ? { valid: true }
    : roundOutcome && trajectoryResult.valid && starPlan.valid
    ? ensureUniqueRoundTrajectories(roundOutcome, trajectoryResult.plans)
    : { valid: false, reason: "trajectory_uniqueness_dependencies_unavailable" };
  const multiPlusPlan = POCKET_TEST_RANDOM_PHYSICS
    ? { valid: true, token: roundOutcome.multi_plus_position }
    : roundOutcome && trajectoryResult.valid && starPlan.valid && uniqueTrajectoryPlan.valid
    ? buildVisualMultiPlusPlanLegacy(roundOutcome, trajectoryResult.plans)
    : { valid: false, reason: "multi_plus_dependencies_unavailable" };
  let pocketSymbolPlan = POCKET_TEST_RANDOM_PHYSICS
    ? { valid: true }
    : { valid: false, reason: "pocket_symbol_dependencies_unavailable" };
  if (!POCKET_TEST_RANDOM_PHYSICS && roundOutcome && pocketReleasePlan.valid && starPlan.valid && multiPlusPlan.valid) {
    pocketSymbolPlan = assignPlannedSymbolsToPocketRelease(
      roundOutcome,
      pocketReleasePlan,
      trajectoryResult.plans
    );
  }
  if (!roundOutcome || !trajectoryResult.valid || !pocketReleasePlan.valid || !starPlan.valid || !uniqueTrajectoryPlan.valid
    || !pocketSymbolPlan.valid || (roundOutcome?.multi_plus_triggered && !multiPlusPlan.valid)) {
    const reason = trajectoryResult.reason || pocketReleasePlan.reason || starPlan.reason || uniqueTrajectoryPlan.reason
      || multiPlusPlan.reason || pocketSymbolPlan.reason || "authoritative_outcome_unavailable";
    console.error("BalloroX unreachable outcome", {
      reason,
      roundOutcome,
      trajectoryResult,
      starPlan,
      multiPlusPlan,
      pocketSymbolPlan
    });
    els.warningBanner.textContent = `VISUAL PLAN UNAVAILABLE: ${reason}`;
    els.warningBanner.classList.remove("hidden");
    return false;
  }
  els.warningBanner.classList.add("hidden");

  if (state.resultRevealFrame !== null) {
    cancelAnimationFrame(state.resultRevealFrame);
    state.resultRevealFrame = null;
  }
  if (state.collectibleIdleFrame !== null) {
    cancelAnimationFrame(state.collectibleIdleFrame);
    state.collectibleIdleFrame = null;
  }
  if (state.counterFlyInFrame !== null) {
    cancelAnimationFrame(state.counterFlyInFrame);
    state.counterFlyInFrame = null;
  }
  state.lastCollectibleIdleRenderAt = 0;

  if (debit) state.bankroll -= totalBet;
  state.activeSlot = slot;
  state.activeBetPerPuck = bet;
  state.launchPrepared = true;
  state.launchPreparedSlot = slot;
  state.roundOutcome = roundOutcome;
  state.chanceRoomMultipliers = createChanceRoomMultipliers(roundOutcome);
  state.trajectoryPlans = trajectoryResult.plans;
  state.trajectoryPlans.forEach((plan) => {
    state.recentTrajectoryIds.push(plan.id);
    state.trajectoryUsage[plan.id] = (state.trajectoryUsage[plan.id] || 0) + 1;
  });
  state.recentTrajectoryIds = state.recentTrajectoryIds.slice(-20);
  state.trajectoryDiagnostics = trajectoryResult.plans.map((plan, index) => ({
    puck_index: index,
    target_sector: roundOutcome.puck_results[index].sector,
    target_category: roundOutcome.puck_results[index].category,
    target_multiplier: roundOutcome.puck_results[index].multiplier,
    launch_angle: plan.launch_angle_degrees,
    launch_force: plan.launch_force,
    bounce_count: plan.bounce_count,
    valid: plan.valid,
    final_correction_px: plan.final_correction_px,
    trajectory_id: plan.id,
    duration: plan.duration,
    friction_variant: plan.damping_per_step,
    final_position: plan.landing_point,
    recent_usage_count: plan.recent_usage_count,
    actual_sector: null
  }));
  state.roundWinAmount = 0;
  state.resultSoundStep = 0;
  state.nextMultiplierSoundAt = 0;
  state.nextPocketReleaseIndex = 0;
  state.physicsAccumulator = 0;
  state.pucks = [];
  state.settledCells = [];
  state.wonLines = [];
  state.crownsCollected = 0;
  state.v2BonusArrivedActive = { diamond: false, crown: false, lemon: false, blue: false };
  state.x10BoostActivated = false;
  state.crownBonusAwarded = false;
  state.multiPlusActive = false;
  state.multiPlusFinalCells = null;
  state.multiPlusMvpPlan = null;
  state.multiPlusPickupLog = null;
  state.multiPlusActivatedAt = 0;
  state.multiPlusCapturedPuck = null;
  state.multiPlusPhase = "idle";
  state.multiPlusRevealStartedAt = 0;
  state.multiPlusNeonCells = [];
  state.multiPlusNeonLastStepAt = 0;
  state.multiPlusNeonFlashUntil = 0;
  state.starPickupLog = [];
  state.starBursts = [];
  clearCounterFlyIns();
  state.openSecretZones.clear();
  state.secretZoneOpenTimes = {};
  state.secretRoomLaunchAt = 0;
  state.chanceCapturedPuck = null;
  state.chancePhase = "idle";
  state.chanceSpinStartedAt = 0;
  state.chanceSpinRoomIndex = -1;
  state.chanceSpinTotalSteps = 20;
  state.chanceLastSoundStep = -1;
  state.chanceSelectedRoomId = null;
  state.chanceFinalCueStartedAt = 0;
  state.chanceFinalCueUntil = 0;
  state.chanceFinalCueRoomId = null;
  state.chanceRoomOutcome = null;
  state.chanceCompletedRoomIds.clear();
  updateRoundWinLabel();
  state.bonusStars = createBonusStars();
  state.multiPlusToken = multiPlusPlan.valid ? createMultiPlusToken() : null;
  updateCrownCounter();
  updateMultiPlusCounter();
  updateChanceBonusCounter();
  updateBank();
  updateBetButtons();
  render();
  return true;
}

function prepareV3StaticField() {
  if (!window.BalloroBonusUI?.isV3 || state.roundOutcome) return;
  if (window.BalloroSavedPaths?.enabled && !window.BalloroSavedPaths.has(GRID_SIZE)) {
    if (state.v3StaticFieldLoading) return;
    state.v3StaticFieldLoading = true;
    window.BalloroSavedPaths.load(GRID_SIZE).then(() => {
      state.v3StaticFieldLoading = false;
      prepareV3StaticField();
    }).catch((error) => {
      state.v3StaticFieldLoading = false;
      console.error('V3 saved paths unavailable', error);
    });
    return;
  }
  const slot = els.betSlots[0];
  if (!slot || !prepareLaunchRound(slot, { debit: false })) return;
  state.launchPrepared = false;
  state.launchPreparedSlot = null;
  state.activeSlot = null;
  updateBetButtons();
}

function launchPuck(slot) {
  if (window.BalloroGameEntry?.blocked) return false;
  if (window.BalloroBonusUI?.isV3) return launchV3Pucks(slot);
  if (window.BalloroRoundTapes?.enabled) return window.BalloroRoundTapes.launch(slot);
  if (window.BalloroSavedPaths?.enabled && !window.BalloroSavedPaths.has(GRID_SIZE)) {
    if (state.savedPathsLoading) return;
    state.savedPathsLoading = true;
    window.BalloroSavedPaths.load(GRID_SIZE).then(() => {
      state.savedPathsLoading = false;
      launchPuck(slot);
    }).catch(error => {
      state.savedPathsLoading = false;
      console.error(error);
      alert('Не удалось загрузить библиотеку путей. Повторите запуск.');
    });
    return;
  }
  stopLaunchPrimeAnimation({ rerender: false });
  if (state.running) {
    updateBetButtons();
    return;
  }

  if (!prepareLaunchRound(slot)) {
    return;
  }

  const count = state.roundOutcome?.puck_results?.length || state.puckCount;
  state.running = true;
  state.launchPrepared = false;
  state.launchPreparedSlot = null;
  state.roundId += 1;
  const roundId = state.roundId;
  state.lastFrameAt = (window.BalloroGameLifecycle?.now() ?? performance.now());
  state.physicsAccumulator = 0;
  if (state.autoPlay && Number.isFinite(state.autoRoundsRemaining)) {
    state.autoRoundsRemaining = Math.max(0, state.autoRoundsRemaining - 1);
  }
  state.pucks = Array.from({ length: count }, (_, index) => createPuck(
    index,
    count,
    POCKET_TEST_RANDOM_PHYSICS ? null : state.roundOutcome.puck_results[index],
    state.trajectoryPlans[index]
  ));
  playLaunchSound();

  updateBetButtons();
  render();
  scheduleGameTick(roundId);
}

function launchV3Pucks(slot) {
  if (window.BalloroGameEntry?.blocked || window.BalloroGameLifecycle?.suspended) return false;
  const now = (window.BalloroGameLifecycle?.now() ?? performance.now());
  const interval = getV3LaunchIntervalMs();
  if (!slot || playControls?.pause.active || isV3BonusLaunchBlocked()
    || (state.v3LastLaunchAt > 0 && now - state.v3LastLaunchAt < interval)) return false;
  const bet = parseBet(slot);
  // V3 offers one paid ball per launch, including autoplay and held spin.
  state.puckCount = 1;
  const count = 1;
  const totalBet = bet * count;
  if (!(bet > 0)) return false;
  if (state.autoPlay && !playControls?.canLaunch(totalBet)) return false;
  let permitted = false;
  try { permitted = BalloroPlayControls.policy.canPlaceBet({ stake: totalBet, autoplay: state.autoPlay }) === true; } catch (_) { /* fail closed */ }
  if (!permitted) { if (state.autoPlay) stopControlledAuto('policy'); return false; }
  if (!requirePaidLaunchBalance(totalBet)) return false;
  state.v4HeldPurpleField = false;
  state.v4HeldYellowCells = null;
  // Prepare the field only once. A subsequent launch is another paid bet on
  // the same live board; it must not clear moving balls or bonus pockets.
  if (!state.roundOutcome) {
    prepareV3StaticField();
    if (!state.roundOutcome) return false;
    state.bankroll -= totalBet;
    updateBank();
  } else {
    state.bankroll -= totalBet;
    updateBank();
  }
  const wasRunning = state.running;
  state.lineMaximumNotice = null;
  if (!state.autoPlay) playControls?.acknowledge();
  state.activeSlot = slot;
  state.activeBetPerPuck = bet;
  state.v3LastWinAmount = 0;
  updateRoundWinLabel();
  state.launchPrepared = false;
  state.launchPreparedSlot = null;
  state.v3LastLaunchAt = now;
  if (state.v3CooldownTimer) window.clearTimeout(state.v3CooldownTimer);
  state.v3CooldownTimer = window.setTimeout(() => {
    state.v3CooldownTimer = null;
    updateBetButtons();
  }, interval);
  const retained = state.pucks.filter((puck) => !puck.stopped
    || getV3PuckFade(puck, now) > 0 || getV3MultiplierFade(puck, now) > 0
    || state.v3BonusPuck === puck);
  const oldIndices = new Map(retained.map((puck, index) => [puck, index]));
  state.settledCells = state.settledCells.flatMap((cell) => {
    const puck = state.pucks[cell.puckIndex];
    const index = oldIndices.get(puck);
    return index === undefined ? [] : [{ ...cell, puckIndex: index }];
  });
  state.pucks = retained;
  const fresh = Array.from({ length: count }, (_, index) => {
    const puck = createPuck(state.v3BallSerial++, count, null,
      buildRandomPrototypeTrajectory());
    puck.v3BetPerPuck = bet;
    puck.v3ShotAt = now;
    puck.v3ShotId = state.v3ShotSerial + 1;
    return puck;
  });
  const shotId = ++state.v3ShotSerial;
  state.v3Shots.set(shotId, { stake: totalBet, count, launchedAt: Date.now() });
  state.pucks.push(...fresh);
  if (state.autoPlay && Number.isFinite(state.autoRoundsRemaining)) {
    state.autoRoundsRemaining = Math.max(0, state.autoRoundsRemaining - 1);
  }
  if (state.autoPlay) playControls.launched(shotId, totalBet);
  playLaunchSound();
  if (!wasRunning) {
    state.running = true;
    state.roundId += 1;
    state.lastFrameAt = now;
    state.physicsAccumulator = 0;
    scheduleGameTick(state.roundId);
  }
  updateBetButtons();
  render();
  return true;
}

function getV3LaunchIntervalMs() {
  const interval = state.quickPlay
    ? window.BalloroV3Rules.quickLaunchIntervalMs
    : window.BalloroV3Rules.launchIntervalMs;
  return Math.max(interval, BalloroPlayControls.policy.minLaunchIntervalMs);
}

function nudgeVelocity(puck) {
  const jitter = puckRandomBetween(puck, -0.22, 0.22);
  const cos = Math.cos(jitter);
  const sin = Math.sin(jitter);
  const { vx, vy } = puck;
  puck.vx = vx * cos - vy * sin;
  puck.vy = vx * sin + vy * cos;
}

function nextPuckRandom(puck) {
  let value = puck.visualRngState >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  puck.visualRngState = value >>> 0;
  return puck.visualRngState / 4294967296;
}

function puckRandomBetween(puck, min, max) {
  return min + nextPuckRandom(puck) * (max - min);
}

function choosePurpleReturnSector(outcomePlan) {
  const config = getMathConfiguration();
  const seed = (outcomePlan?.visual_seed || state.roundOutcome?.seed || 1) ^ 0x7a4d52b9;
  const rng = window.PuckLuckMath.createRng(seed >>> 0);
  if (outcomePlan?.secret_room_win) {
    const pools = ["center", "middle", "outer"]
      .map((category) => (config?.sector_definitions?.[category] || [])
        .map((sector) => ({ ...sector, category })))
      .find((pool) => pool.length);
    return pools?.[rng.int(pools.length)] || { col: Math.floor(GRID_SIZE / 2), row: Math.floor(GRID_SIZE / 2), category: "center" };
  }
  const launchIndex = GRID_SIZE * GRID_SIZE - 1;
  const empty = (config?.sector_definitions?.empty || [])
    .filter((sector) => sector.index >= 0 && sector.index !== launchIndex);
  return empty.length
    ? { ...empty[rng.int(empty.length)], category: "empty" }
    : { col: 0, row: GRID_SIZE - 1, category: "empty" };
}

function getSectorPoint(sector, rng, marginPx = state.field.puckRadius * 1.35) {
  const { half, grid } = state.field;
  const x0 = -half + sector.col * grid + marginPx;
  const x1 = -half + (sector.col + 1) * grid - marginPx;
  const y0 = -half + sector.row * grid + marginPx;
  const y1 = -half + (sector.row + 1) * grid - marginPx;
  return {
    x: x0 + rng.next() * Math.max(0, x1 - x0),
    y: y0 + rng.next() * Math.max(0, y1 - y0)
  };
}

function randomWallPoint(side, rng, inset) {
  const { half } = state.field;
  const span = half * 2 - inset * 2;
  const value = -half + inset + rng.next() * Math.max(0, span);
  if (side === "top") return { x: value, y: -half + inset };
  if (side === "right") return { x: half - inset, y: value };
  if (side === "bottom") return { x: value, y: half - inset };
  return { x: -half + inset, y: value };
}

const POCKET_RELEASE_TRANSFORMS = Object.freeze({
  top: { sx: -1, sy: -1 },
  right: { sx: 1, sy: -1 },
  bottom: { sx: 1, sy: 1 },
  left: { sx: -1, sy: 1 }
});

function transformReleaseSector(sector, transform) {
  return {
    col: transform.sx < 0 ? GRID_SIZE - 1 - sector.col : sector.col,
    row: transform.sy < 0 ? GRID_SIZE - 1 - sector.row : sector.row
  };
}

function transformReleaseZone(zoneId, transform) {
  const pocket = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, zoneId);
  const transformedX = pocket.x * transform.sx;
  const transformedY = pocket.y * transform.sy;
  return SECRET_ZONE_IDS.find((candidateId) => {
    const candidate = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, candidateId);
    return candidate.x === transformedX && candidate.y === transformedY;
  }) || zoneId;
}

function transformReleaseTrajectory(trajectory, transform, result, sourceZoneId) {
  const frames = trajectory.frames.map((frame) => [
    frame[0], frame[1] * transform.sx, frame[2] * transform.sy,
    frame[3] * transform.sx, frame[4] * transform.sy, frame[5]
  ]);
  const bouncePoints = (trajectory.bounce_points || []).map((point) => [
    point[0], point[1] * transform.sx, point[2] * transform.sy, point[3]
  ]);
  const landing = frames.at(-1);
  return {
    ...trajectory,
    id: `release-${sourceZoneId}-${result.result_path || result.visual_seed}-${trajectory.id}`,
    source_descriptor_id: trajectory.id,
    target_sector: { col: result.sector.col, row: result.sector.row },
    target_category: result.category,
    final_sector: { col: result.sector.col, row: result.sector.row },
    landing_point: { x: landing[1], y: landing[2] },
    frames,
    bounce_points: bouncePoints,
    valid: true
  };
}

function selectPocketReleaseTrajectory(result, sourceZoneId, releaseIndex, existingPlans = null) {
  const planner = window.PuckLuckTrajectoryPlanner;
  if (usesFieldPocketMechanics()) {
    const selected = planRuntimeFieldPocketTrajectory({
      result,
      seed: (result.visual_seed ^ Math.imul(releaseIndex + 1, 0x9e3779b1)) >>> 0,
      existingPlans: existingPlans
        || state.pucks.map((puck) => puck.replayTrajectory).filter((plan) => plan?.valid),
      startPoint: getFieldPocketNormalized(),
      releaseIndex
    });
    if (!selected) throw new Error(`Field pocket release trajectory is unavailable for ${result.result_path}`);
    state.recentTrajectoryIds.push(selected.id);
    state.recentTrajectoryIds = state.recentTrajectoryIds.slice(-20);
    state.trajectoryUsage[selected.id] = (state.trajectoryUsage[selected.id] || 0) + 1;
    return selected;
  }
  const transform = POCKET_RELEASE_TRANSFORMS[sourceZoneId] || POCKET_RELEASE_TRANSFORMS.bottom;
  let variants;
  if (result.secret_room) {
    const transformedZoneId = transformReleaseZone(result.secret_zone_id, transform);
    variants = window.PuckLuckSecretRoomTrajectories?.library?.[GRID_SIZE]?.entries?.[transformedZoneId] || [];
  } else {
    const transformedSector = transformReleaseSector(result.sector, transform);
    variants = getSafeStandardTrajectoryVariants(GRID_SIZE, `${transformedSector.col}_${transformedSector.row}`);
  }
  if (!variants.length) throw new Error(`Pocket release trajectory is unavailable for ${result.result_path}`);
  const seed = (result.visual_seed ^ Math.imul(releaseIndex + 1, 0x9e3779b1)) >>> 0;
  const ordered = [...variants].sort((first, second) =>
    trajectoryChoiceHash(seed, first.id) - trajectoryChoiceHash(seed, second.id)
    || first.id.localeCompare(second.id));
  const conflictPlans = existingPlans
    || state.pucks.map((puck) => puck.replayTrajectory).filter((plan) => plan?.valid);
  let fallback = null;
  for (const descriptor of ordered) {
    let trajectory = planner.hydrateTrajectory(descriptor);
    if (result.secret_room) {
      const captureFrameIndex = Math.max(1, Math.min(
        descriptor.capture_frame_index ?? trajectory.frames.length - 1,
        trajectory.frames.length - 1
      ));
      trajectory.frames = trajectory.frames.slice(0, captureFrameIndex + 1);
      trajectory.bounce_points = trajectory.bounce_points.filter((point) => point[0] <= trajectory.frames.at(-1)[0]);
      trajectory.duration = trajectory.frames.at(-1)[0];
      trajectory.bounce_count = trajectory.frames.at(-1)[5];
    }
    const transformed = transformReleaseTrajectory(trajectory, transform, result, sourceZoneId);
    if (!fallback) fallback = transformed;
    if (!trajectoryConflictsWithRound(transformed, conflictPlans, getMathConfiguration()?.puck_radius || 0.1)) {
      fallback = transformed;
      break;
    }
  }
  const selected = fallback;
  if (result.secret_room) {
    const pocket = window.PuckLuckMath.secretRoomPocket(GRID_SIZE, result.secret_zone_id);
    const captureRadius = (getMathConfiguration()?.puck_radius || 0.1)
      * planner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
    const firstFrame = selected.frames[0];
    selected.secret_room = {
      zone_id: result.secret_zone_id,
      entry_id: selected.source_descriptor_id,
      pocket_capture_armed: Math.hypot(firstFrame[1] - pocket.x, firstFrame[2] - pocket.y) > captureRadius
    };
  }
  state.recentTrajectoryIds.push(selected.id);
  state.recentTrajectoryIds = state.recentTrajectoryIds.slice(-20);
  state.trajectoryUsage[selected.id] = (state.trajectoryUsage[selected.id] || 0) + 1;
  return selected;
}

function buildPocketReleaseTrajectoryPlans(roundOutcome) {
  let releaseIndex = 0;
  const allPlans = [];
  const planPocket = (pocketResult) => {
    if (!pocketResult?.secret_room) return;
    const siblingPlans = [];
    (pocketResult.release_results || []).forEach((result) => {
      const trajectory = selectPocketReleaseTrajectory(
        result,
        pocketResult.secret_zone_id,
        releaseIndex,
        siblingPlans
      );
      releaseIndex += 1;
      result.release_trajectory = trajectory;
      siblingPlans.push(trajectory);
      allPlans.push({ result, trajectory, sourceZoneId: pocketResult.secret_zone_id });
      if (result.secret_room) planPocket(result);
    });
  };
  (roundOutcome?.puck_results || []).forEach(planPocket);
  return { valid: true, plans: allPlans };
}

function createPocketReleasePuck(source, zone, releaseIndex, outcomePlan) {
  const releasePuck = {
    ...source,
    v3PocketVisits: { ...source.v3PocketVisits },
    v3YellowCells: source.v3YellowCells?.map(cell => ({ ...cell })),
    v3ReservedPocketVisit: null,
    visualRngState: (outcomePlan?.visual_seed || (source.visualRngState ^ Math.imul(releaseIndex, 0x9e3779b1))) >>> 0,
    authoritativeResult: normalizeAuthoritativeResult(outcomePlan),
    replayFrame: 0,
    replayCursor: 0,
    replayDelayFrames: 0,
    pocketDepth: 0,
    purpleBoost: false,
    pocketRelease: true,
    stopped: false,
    result: null,
    secretRoom: null
  };
  return releasePuck;
}

function preparePocketReleasePuck(puck, zone, releaseIndex = 0, outcomePlan = null, trajectoryOverride = null) {
  window.BalloroQuickTrail?.clear(puck);
  puck.trailBonusKind = null;
  puck.releaseIndex = releaseIndex;
  puck.authoritativeResult = normalizeAuthoritativeResult(outcomePlan || puck.authoritativeResult);
  const trajectory = trajectoryOverride || puck.authoritativeResult.release_trajectory
    || selectPocketReleaseTrajectory(puck.authoritativeResult, zone.id, releaseIndex);
  puck.replayTrajectory = trajectory;
  puck.replayFrame = 0;
  puck.replayCursor = 0;
  puck.replayDelayFrames = 0;
  puck.pocketRelease = true;
  puck.purpleBoost = false;
  puck.pocketDepth = 0;
  puck.bounceCount = 0;
  puck.secretBounceCount = 0;
  puck.secretRoom = trajectory.secret_room ? {
    zoneId: trajectory.secret_room.zone_id,
    phase: "entry",
    pocketCaptureArmed: Boolean(trajectory.secret_room.pocket_capture_armed),
    roomCursor: 0,
    roomFrame: 0
  } : null;
  const firstFrame = trajectory.frames[0];
  puck.x = firstFrame[1] * state.field.half;
  puck.y = firstFrame[2] * state.field.half;
  puck.vx = firstFrame[3] * state.field.half;
  puck.vy = firstFrame[4] * state.field.half;
  puck.speed = Math.hypot(puck.vx, puck.vy);
  puck.stopped = false;
  puck.result = null;
}

function setSecretRoomPosition(puck, zone, u, v) {
  const point = secretRoomLocalPoint(zone, u, v);
  puck.x = point.x;
  puck.y = point.y;
}

function parkSecretRoomPuck(puck) {
  const visit = puck.secretRoom;
  if (!visit || visit.phase !== "entry") return;
  if (usesFieldPocketMechanics()) {
    const pocket = visit.zoneId === BLUE_FIELD_POCKET_ZONE_ID
      ? state.bluePocket : state.fieldPocket;
    if (pocket?.consumed) { puck.secretRoom = null; return; }
    if (pocket) pocket.consumed = true;
    if (window.BalloroBonusUI?.isV2 && !window.BalloroBonusUI?.isV3) visit.bonusSymbolPending = true;
  }
  if (!registerMvpPocketVisit(puck, visit.zoneId === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond")) {
    throw new Error("Selected trajectory exceeded its inherited pocket entry limit");
  }
  if (window.BalloroBonusUI?.isV3) {
    visit.bonusSymbolPending = claimV3ExclusiveBonus(
      visit.zoneId === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond", puck);
    visit.v2BonusActivated = !visit.bonusSymbolPending;
  }
  visit.phase = "capturing";
  visit.captureElapsed = 0;
  visit.captureStart = { x: puck.x, y: puck.y };
  visit.preserveEntrySpeed = usesFieldPocketMechanics();
  if (visit.preserveEntrySpeed) {
    const zone = getSecretZoneGeometry(visit.zoneId);
    const captureDistance = Math.hypot(zone.hole.x - puck.x, zone.hole.y - puck.y);
    const entrySpeed = Math.max(0.001, puck.speed);
    visit.captureDuration = Math.min(FIELD_POCKET_PULL_MAX_DURATION_SECONDS,
      Math.max(FIXED_PHYSICS_STEP, captureDistance / entrySpeed));
  } else {
    visit.captureDuration = 0.24;
  }
  if (window.BalloroBonusUI?.isV3 && visit.bonusSymbolPending) {
    startSecretRoomPocketSymbolPickup(visit, getSecretZoneGeometry(visit.zoneId));
  }
  if (state.secretRoomLaunchAt < 0) state.secretRoomLaunchAt = 0;
}

function startSecretRoomPocketSymbolPickup(visit, zone) {
  if (!visit.bonusSymbolPending) return;
  if (visit.zoneId === BLUE_FIELD_POCKET_ZONE_ID) {
    recordV2PocketPickup("blue", zone.hole.x, zone.hole.y, state.field.puckRadius, (activated) => {
      visit.bonusSymbolPending = false;
      visit.v2BonusActivated = activated;
      if (state.bluePocket) state.bluePocket.symbolArrived = true;
      if (activated) visit.blueLaunchReadyAt = (window.BalloroGameLifecycle?.now() ?? performance.now()) + V2_CACTUS_POST_ACTIVATION_HOLD_MS;
    });
  } else {
    recordV2PocketPickup("diamond", zone.hole.x, zone.hole.y, state.field.puckRadius,
      (activated) => {
        visit.bonusSymbolPending = false;
        visit.v2BonusActivated = activated;
        if (activated) {
          if (!window.BalloroBonusUI?.isV3) activateX10Boost();
          playBonusCompleteSound();
        } else playBonusStarSound(state.v2BonusProgress.diamond);
      });
  }
}

function beginSecretRoomVisit(puck) {
  const visit = puck.secretRoom;
  if (!visit || visit.phase !== "pocket_wait" || visit.bonusSymbolPending) return;
  const repeatedPurpleVisit = Boolean(window.BalloroBonusUI?.isV3
    && visit.zoneId !== BLUE_FIELD_POCKET_ZONE_ID && puck.v3PurpleBonus);
  if (window.BalloroBonusUI?.isV3 && visit.zoneId !== BLUE_FIELD_POCKET_ZONE_ID
    && visit.v2BonusActivated) {
    activateX10Boost();
    puck.v3PurpleBonus = true;
  }
  const zone = getSecretZoneGeometry(visit.zoneId);
  if (usesFieldPocketMechanics()) {
    const pocket = visit.zoneId === BLUE_FIELD_POCKET_ZONE_ID
      ? state.bluePocket : state.fieldPocket;
    if (pocket) pocket.finished = true;
  }
  if (window.BalloroBonusUI?.isV2 && visit.zoneId !== BLUE_FIELD_POCKET_ZONE_ID) {
    const releaseStartIndex = state.nextPocketReleaseIndex++;
    const releaseResult = puck.authoritativeResult?.release_results?.[0] || null;
    if (POCKET_TEST_RANDOM_PHYSICS) {
      const startPoint = { x: zone.hole.x / state.field.half, y: zone.hole.y / state.field.half };
      const trajectory = repeatedPurpleVisit
        ? selectV3RepeatedPurpleRelease(startPoint, puck)
        : buildRandomPrototypeTrajectory(startPoint, -135, puck);
      if (window.BalloroBonusUI?.isV3) {
        const first = trajectory.frames[0];
        puck.v3LastPurpleReleaseDirection = Math.atan2(first[4], first[3]);
      }
      preparePocketReleasePuck(puck, zone, releaseStartIndex, null, trajectory);
      puck.authoritativeResult = null;
    } else {
      if (!releaseResult) throw new Error("Purple pocket release path is missing");
      preparePocketReleasePuck(puck, zone, releaseStartIndex, releaseResult);
    }
    puck.trailBonusKind = visit.v2BonusActivated ? "diamond" : null;
    if (window.BalloroBonusUI?.isV3) puck.pocketBallKind = "diamond";
    if (window.BalloroBonusUI?.isV3) puck.purplePocketExitRequired = true;
    state.openSecretZones.add(visit.zoneId);
    state.secretZoneOpenTimes[visit.zoneId] ||= (window.BalloroGameLifecycle?.now() ?? performance.now());
    playLaunchSound();
    return;
  }
  if (POCKET_TEST_RANDOM_PHYSICS) {
    const releaseStartIndex = state.nextPocketReleaseIndex;
    state.nextPocketReleaseIndex += 3;
    const startPoint = { x: zone.hole.x / state.field.half, y: zone.hole.y / state.field.half };
    const released = [puck, ...[1, 2].map((offset) =>
      createPocketReleasePuck(puck, zone, releaseStartIndex + offset, null))];
    released.forEach((releasePuck, offset) => {
      const trajectory = buildRandomPrototypeTrajectory(startPoint, -135, releasePuck);
      preparePocketReleasePuck(releasePuck, zone, releaseStartIndex + offset, null, trajectory);
      releasePuck.authoritativeResult = null;
      releasePuck.bluePocketExitRequired = true;
      releasePuck.trailBonusKind = visit.v2BonusActivated ? "blue" : null;
      if (window.BalloroBonusUI?.isV3) releasePuck.pocketBallKind = "blue";
    });
    state.pucks.push(...released.slice(1));
    if (window.BalloroBonusUI?.isV3) released.forEach((releasePuck) => {
      releasePuck.pocketBallKind = "blue";
    });
    // V3 leaves the green pocket occupied until all three released balls finish.
    state.openSecretZones.add(visit.zoneId);
    state.secretZoneOpenTimes[visit.zoneId] ||= (window.BalloroGameLifecycle?.now() ?? performance.now());
    playLaunchSound();
    return;
  }
  const releaseResults = puck.authoritativeResult?.release_results || [];
  if (releaseResults.length !== 3) {
    throw new Error(`Pocket ${puck.authoritativeResult?.result_path || "unknown"} must release exactly three balls`);
  }
  const releaseStartIndex = state.nextPocketReleaseIndex;
  state.nextPocketReleaseIndex += 3;
  const extraPucks = [1, 2].map((releaseOffset) => {
    const releaseIndex = releaseStartIndex + releaseOffset;
    const releasePuck = createPocketReleasePuck(puck, zone, releaseIndex, releaseResults[releaseOffset]);
    preparePocketReleasePuck(releasePuck, zone, releaseIndex, releaseResults[releaseOffset]);
    releasePuck.trailBonusKind = visit.v2BonusActivated ? "blue" : null;
    return releasePuck;
  });
  preparePocketReleasePuck(puck, zone, releaseStartIndex, releaseResults[0]);
  puck.trailBonusKind = visit.v2BonusActivated ? "blue" : null;
  if (window.BalloroBonusUI?.isV3) puck.pocketBallKind = "blue";
  state.pucks.push(...extraPucks);
  state.openSecretZones.add(visit.zoneId);
  state.secretZoneOpenTimes[visit.zoneId] ||= (window.BalloroGameLifecycle?.now() ?? performance.now());
  playLaunchSound();
}

function stepSecretRoomPuck(puck) {
  const visit = puck.secretRoom;
  if (!visit) return false;
  if (visit.phase === "capturing") {
    const zone = getSecretZoneGeometry(visit.zoneId);
    const captureStep = getLiveBonusPreparationStep();
    visit.captureElapsed += captureStep;
    const progress = clamp(visit.captureElapsed / visit.captureDuration, 0, 1);
    const eased = visit.preserveEntrySpeed ? progress : progress * progress;
    puck.previousX = puck.x;
    puck.previousY = puck.y;
    puck.x = visit.captureStart.x + (zone.hole.x - visit.captureStart.x) * eased;
    puck.y = visit.captureStart.y + (zone.hole.y - visit.captureStart.y) * eased;
    puck.vx = (puck.x - puck.previousX) / captureStep;
    puck.vy = (puck.y - puck.previousY) / captureStep;
    puck.speed = Math.hypot(puck.vx, puck.vy);
    puck.pocketDepth = progress * 0.55;
    collectBonusStarByTouch(puck);
    if (progress >= 1) {
      visit.phase = "pocket_wait";
      puck.x = zone.hole.x;
      puck.y = zone.hole.y;
      puck.vx = 0;
      puck.vy = 0;
      puck.speed = 0;
      playPocketCaptureSound(puck);
      if (window.BalloroBonusUI?.isV2 && !window.BalloroBonusUI?.isV3) {
        startSecretRoomPocketSymbolPickup(visit, zone);
      }
    }
    return true;
  }
  if (visit.phase === "pocket_wait") return true;
  return false;
}

function captureFieldPocketPuckByTouch(puck, atRest = false) {
  if (!POCKET_TEST_RANDOM_PHYSICS || puck.secretRoom || puck.chance) return false;
  if (window.BalloroBonusUI?.isV2 && !atRest) return false;
  const captureRadius = atRest
    ? Math.max(0, 2 * state.field.puckRadius - 1) / state.field.half
    : (state.field.puckRadius / state.field.half)
      * window.PuckLuckTrajectoryPlanner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
  const current = { x: puck.x / state.field.half, y: puck.y / state.field.half };
  const previous = {
    x: (puck.previousX ?? puck.x) / state.field.half,
    y: (puck.previousY ?? puck.y) / state.field.half
  };
  const pockets = [[FIELD_POCKET_ZONE_ID, state.fieldPocket],
    [BLUE_FIELD_POCKET_ZONE_ID, state.bluePocket]];
  for (const [zoneId, pocketState] of pockets) {
    if (!pocketState || pocketState.consumed) continue;
    if (!canCaptureMvpPocket(puck, zoneId === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond")) continue;
    const pocket = getFieldPocketNormalized(pocketState);
    // A ball expelled by the green pocket must leave that pocket before it can
    // re-enter it. This guard must not suppress capture by the purple pocket.
    if (puck.bluePocketExitRequired && zoneId === BLUE_FIELD_POCKET_ZONE_ID) {
      if (Math.hypot(current.x - pocket.x, current.y - pocket.y) <= captureRadius) continue;
      puck.bluePocketExitRequired = false;
    }
    if (puck.purplePocketExitRequired && zoneId === FIELD_POCKET_ZONE_ID) {
      if (Math.hypot(current.x - pocket.x, current.y - pocket.y) <= captureRadius) continue;
      puck.purplePocketExitRequired = false;
    }
    const v4PocketCell = window.BalloroBonusUI?.isV4 && atRest
      && (() => { const cell = getCellFromPoint(puck.x, puck.y);
        return cell.col === pocketState.col && cell.row === pocketState.row; })();
    const captureProgress = atRest
      ? (v4PocketCell || Math.hypot(current.x - pocket.x, current.y - pocket.y) <= captureRadius ? 1 : null)
      : window.PuckLuckTrajectoryPlanner.segmentCircleFirstIntersection(
        [0, previous.x, previous.y], [0, current.x, current.y], pocket, captureRadius);
    if (captureProgress === null) continue;
    const occupied = state.pucks.some((item) => item !== puck
      && item.secretRoom?.zoneId === zoneId
      && ["capturing", "pocket_wait"].includes(item.secretRoom.phase));
    if (occupied) {
      if (window.BalloroBonusUI?.isV3) return queueV3PocketPuck(puck, "blue", {
        x: pocket.x * state.field.half, y: pocket.y * state.field.half
      }, zoneId);
      puck.waitingForPocket = { kind: "blue", zoneId };
      return false;
    }
    puck.x = (previous.x + (current.x - previous.x) * captureProgress) * state.field.half;
    puck.y = (previous.y + (current.y - previous.y) * captureProgress) * state.field.half;
    puck.authoritativeResult = null;
    puck.secretRoom = {
      zoneId, phase: "entry", pocketCaptureArmed: true, roomCursor: 0, roomFrame: 0
    };
    parkSecretRoomPuck(puck);
    return true;
  }
  return false;
}

function captureChancePuck(puck, allowStationaryOverlap = false, slowApproach = false) {
  if (window.BalloroBonusUI?.isV2 && !allowStationaryOverlap) return false;
  if (!state.chancePocket || state.chancePocket.consumed || state.chanceCapturedPuck
    || ["capturing", "pocket_wait"].includes(puck.secretRoom?.phase)) return false;
  const pocket = getChancePocketGeometry();
  const normalizedX = puck.x / state.field.half;
  const normalizedY = puck.y / state.field.half;
  const previousX = (puck.previousX ?? puck.x) / state.field.half;
  const previousY = (puck.previousY ?? puck.y) / state.field.half;
  const captureRadius = (window.BalloroBonusUI?.isV2
    ? Math.max(0, 2 * state.field.puckRadius - 1) / state.field.half
    : (state.field.puckRadius / state.field.half) * CHANCE_POCKET_CAPTURE_RADIUS_MULTIPLIER);
  let captured = window.BalloroBonusUI?.isV2 ? false
    : window.PuckLuckTrajectoryPlanner.segmentCircleFirstIntersection(
      [0, previousX, previousY],
      [0, normalizedX, normalizedY],
      pocket.normalized,
      captureRadius
    ) !== null;
  if (!captured && allowStationaryOverlap) {
    const cell = window.BalloroBonusUI?.isV4 ? getCellFromPoint(puck.x, puck.y) : null;
    captured = slowApproach || Math.hypot(normalizedX - pocket.normalized.x, normalizedY - pocket.normalized.y) <= captureRadius
      || (window.BalloroBonusUI?.isV4 && cell.col === state.chancePocket.col && cell.row === state.chancePocket.row);
  }
  if (!window.BalloroBonusUI?.isV2 && !captured && state.chancePocket.forced && state.pucks.indexOf(puck) === 0
    && puck.replayFrame >= state.chancePocket.forceFrameIndex) captured = true;
  if (!captured) return false;
  if (!registerMvpPocketVisit(puck, "crown")) return false;

  state.chancePocket.consumed = true;
  const firstV3Symbol = window.BalloroBonusUI?.isV3
    ? claimV3ExclusiveBonus("crown", puck) : false;
  puck.v2SymbolPending = Boolean(window.BalloroBonusUI?.isV2)
    && (!window.BalloroBonusUI?.isV3 || firstV3Symbol);
  puck.v2ChanceActivated = !window.BalloroBonusUI?.isV2
    || (window.BalloroBonusUI?.isV3 && !firstV3Symbol);

  const targetX = pocket.normalized.x * state.field.half;
  const targetY = pocket.normalized.y * state.field.half;
  puck.chance = {
    phase: "capturing",
    capturedAt: (window.BalloroGameLifecycle?.now() ?? performance.now()),
    waveStartedAt: 0,
    roomId: null,
    pocketCapture: createFieldPocketPullCapture(puck, targetX, targetY)
  };
  puck.authoritativeResult = null;
  state.chanceCapturedPuck = puck;
  state.chancePhase = "capturing";
  if (window.BalloroBonusUI?.isV3) {
    if (firstV3Symbol) startChancePocketSymbolPickup(puck);
  }
  updateChanceBonusCounter();
  return true;
}

function startChancePocketSymbolPickup(puck) {
  if (!puck.v2SymbolPending) return;
  const pocket = getChancePocketGeometry();
  puck.v2ChanceActivated = recordV2PocketPickup("crown",
    pocket.normalized.x * state.field.half,
    pocket.normalized.y * state.field.half, state.field.puckRadius,
    (activated) => {
      puck.v2ChanceActivated = activated;
      puck.v2SymbolPending = false;
    });
}

function stepChanceRoomPuck(puck) {
  const chance = puck.chance;
  if (!chance || chance.phase === "settled") return false;
  if (chance.phase === "capturing") {
    if (stepFieldPocketPullCapture(puck, chance.pocketCapture)) {
      chance.pocketCapture = null;
      chance.phase = "captured";
      state.chancePhase = "captured";
      if (window.BalloroBonusUI?.isV2 && !window.BalloroBonusUI?.isV3) {
        startChancePocketSymbolPickup(puck);
      }
    }
    return true;
  }
  if (["captured", "spinning", "final_cue"].includes(chance.phase)) return true;
  if (chance.phase === "sinking") {
    const progress = clamp(((window.BalloroGameLifecycle?.now() ?? performance.now()) - chance.sinkStartedAt) / CHANCE_SINK_DURATION_MS, 0, 1);
    puck.pocketDepth = 0.55 + progress * 0.45;
    if (progress >= 1) {
      if (state.chancePocket) state.chancePocket.finished = true;
      if (window.BalloroBonusUI?.isV2 && !puck.v2ChanceActivated) {
        const point = getChancePocketGeometry();
        const start = point?.normalized || { x: puck.x / state.field.half, y: puck.y / state.field.half };
        const trajectory = buildRandomPrototypeTrajectory(start, -135);
        if (!trajectory) throw new Error("Uncharged red-pocket release path is unavailable");
        puck.chance = null;
        state.chanceCapturedPuck = null;
        state.chancePhase = "idle";
        preparePocketReleasePuck(puck, { id: FIELD_POCKET_ZONE_ID },
          state.nextPocketReleaseIndex++, null, trajectory);
        puck.authoritativeResult = null;
        updateChanceBonusCounter();
        playLaunchSound();
      } else {
        startChanceRoomSpin(puck, (window.BalloroGameLifecycle?.now() ?? performance.now()));
      }
    }
    return true;
  }
  if (chance.phase !== "inside") return true;

  chance.age += FIXED_PHYSICS_STEP;
  if (chance.savedFrames) {
    const frame = chance.savedFrames[Math.min(chance.savedFrame++, chance.savedFrames.length - 1)];
    [chance.u, chance.v, chance.vu, chance.vv] = frame;
    if (frame[4]) playWallHitSound(Math.hypot(chance.vu, chance.vv) * state.field.half);
  } else {
  chance.u += chance.vu * FIXED_PHYSICS_STEP;
  chance.v += chance.vv * FIXED_PHYSICS_STEP;
  const room = getChanceRoomGeometry(chance.roomId);
  const puckMargin = clamp(state.field.puckRadius / Math.max(1, room.halfSide), 0.08, 0.22);
  const boundary = 1 - puckMargin;
  if (chance.u < -boundary || chance.u > boundary) {
    chance.u = clamp(chance.u, -boundary, boundary);
    chance.vu *= -0.88;
    playWallHitSound(Math.abs(chance.vu) * state.field.half);
  }
  if (chance.v < -boundary || chance.v > boundary) {
    chance.v = clamp(chance.v, -boundary, boundary);
    chance.vv *= -0.88;
    playWallHitSound(Math.abs(chance.vv) * state.field.half);
  }
  chance.vu *= chance.dampingPerStep;
  chance.vv *= chance.dampingPerStep;
  }
  puck.speed = Math.hypot(chance.vu, chance.vv) * state.field.half;
  if (chance.age < CHANCE_MIN_SETTLE_AGE_SECONDS
    || Math.hypot(chance.vu, chance.vv) > 0.1) return true;

  const gridSize = getChanceRoomGridSize();
  const roomCol = clamp(Math.floor((chance.u + 1) * gridSize / 2), 0, gridSize - 1);
  const roomRow = clamp(Math.floor((chance.v + 1) * gridSize / 2), 0, gridSize - 1);
  const chanceRoomTier = window.BalloroBonusUI?.isV3
    ? window.BalloroV3Rules.roomCellTier(GRID_SIZE, chance.roomId, roomCol, roomRow) : null;
  const won = window.BalloroBonusUI?.isV3
    ? Boolean(chanceRoomTier) : isChanceMultiplierHit(chance.u, chance.v, chance.roomId, gridSize);
  const multiplier = window.BalloroBonusUI?.isV3
    ? (won ? (window.BalloroBonusUI?.isV4 ? window.BalloroV4Rules : window.BalloroV3Rules)
      .roomCellMultiplier(GRID_SIZE, chance.roomId, roomCol, roomRow) : 0)
    : won ? getChanceRoomMultiplier(chance.roomId) : 0;
  const x10Boosted = won && (window.BalloroBonusUI?.isV3
    ? Boolean(puck.v3PurpleBonus) : isX10BoostActive());
  const basePayout = (puck.v3BetPerPuck || state.activeBetPerPuck) * multiplier;
  const payout = basePayout * (x10Boosted ? 10 : 1);
  state.bankroll += payout;
  state.roundWinAmount += payout;
  puck.stopped = true;
  updateBank();
  puck.speed = 0;
  puck.resultRevealStartedAt = (window.BalloroGameLifecycle?.now() ?? performance.now());
  puck.result = {
    category: won ? "chance" : "empty",
    multiplier,
    payout,
    basePayout,
    x10Boosted,
    secretRoom: true,
    chanceRoom: true,
    chanceRoomTier
  };
  chance.phase = "settled";
  captureResultCellSymbol(puck);
  state.chanceRoomOutcome = { roomId: chance.roomId, won, multiplier, chanceRoomTier };
  state.chanceCompletedRoomIds.add(chance.roomId);
  if (state.chanceCapturedPuck === puck) {
    state.chanceCapturedPuck = null;
    state.chancePhase = "idle";
  }
  // V3 clears chanceCapturedPuck when the room shot launches, before it settles.
  // Release the red pocket here so the next shot can activate it again.
  updateChanceBonusCounter();
  if (won) playMultiplierResultSound(multiplier, x10Boosted,
    !window.BalloroBonusUI?.isV3 || chanceRoomTier === "red",
    chanceRoomTier === "red" ? 2 : chanceRoomTier === "yellow" ? 1 : 0);
  startResultRevealAnimation();
  return true;
}

function maybeAdvanceChance(now) {
  const puck = state.chanceCapturedPuck;
  if (!puck) return;
  if (window.BalloroBonusUI?.isV3 && (state.v3BonusLock !== "crown"
    || state.v3BonusPuck !== puck)) return;
  if (state.chancePhase === "captured") {
    if (window.BalloroBonusUI?.isV2 && puck.v2SymbolPending) return;
    const otherActivity = state.pucks.some((item) => item !== puck && !item.stopped);
    if (otherActivity && !window.BalloroBonusUI?.isV3) return;
    if (!puck.chance.waveStartedAt) {
      puck.chance.waveStartedAt = now;
      return;
    }
    if (now - puck.chance.waveStartedAt < CHANCE_READY_WAVE_DURATION_MS) return;
    state.chancePhase = "sinking";
    puck.chance.phase = "sinking";
    puck.chance.sinkStartedAt = now;
    return;
  }
  if (state.chancePhase === "final_cue") {
    if (now < state.chanceFinalCueUntil) return;
    state.chanceFinalCueUntil = 0;
    launchChanceRoomPuck(puck);
    return;
  }
  if (state.chancePhase !== "spinning") return;
  // A completed older SC presentation may clear shared UI state while a
  // queued ball prepares. Its already chosen destination belongs to the ball.
  state.chanceSelectedRoomId = puck.chance.selectedRoomId ?? state.chanceSelectedRoomId;
  const progress = clamp((now - state.chanceSpinStartedAt) / CHANCE_SPIN_DURATION_MS, 0, 1);
  if (progress >= 1) {
    state.chanceSpinRoomIndex = CHANCE_ROOM_IDS.indexOf(state.chanceSelectedRoomId);
    state.chancePhase = "final_cue";
    puck.chance.phase = "final_cue";
    state.chanceFinalCueStartedAt = now;
    state.chanceFinalCueUntil = now + CHANCE_FINAL_CUE_DURATION_MS;
    state.chanceFinalCueRoomId = state.chanceSelectedRoomId;
    playChanceSpinTick(Math.floor(state.chanceSpinTotalSteps), true);
    return;
  }
  const step = Math.floor((1 - Math.pow(1 - progress, 3)) * state.chanceSpinTotalSteps);
  state.chanceSpinRoomIndex = step % CHANCE_ROOM_IDS.length;
  if (step !== state.chanceLastSoundStep) {
    playChanceSpinTick(step, progress >= 1);
    state.chanceLastSoundStep = step;
  }
}

function startChanceRoomSpin(puck, now) {
  state.chancePhase = "spinning";
  puck.chance.phase = "spinning";
  state.chanceSpinStartedAt = now;
  const rng = window.PuckLuckMath.createRng(((state.roundOutcome?.seed || 1) ^ 0x57484545) >>> 0);
  state.chanceSelectedRoomId = window.BalloroMvpMath?.enabled()
    ? CHANCE_ROOM_IDS[Math.floor(randomPrototypeUnit() * CHANCE_ROOM_IDS.length)]
    : CHANCE_ROOM_IDS[rng.int(CHANCE_ROOM_IDS.length)];
  puck.chance.selectedRoomId = state.chanceSelectedRoomId;
  // Fractional travel reaches the final room before the bell; integer travel
  // keeps the final jump until the bell. Vary presentation, not the chosen payout.
  const holdFinalRoom = Math.random() < 0.5;
  const extraCycles = Math.floor(Math.random() * 3);
  state.chanceSpinTotalSteps = 20 + extraCycles * CHANCE_ROOM_IDS.length
    + CHANCE_ROOM_IDS.indexOf(state.chanceSelectedRoomId) + (holdFinalRoom ? 0.45 : 0);
  state.chanceSpinRoomIndex = 0;
  state.chanceLastSoundStep = -1;
  state.chanceFinalCueStartedAt = 0;
  state.chanceFinalCueUntil = 0;
  state.chanceFinalCueRoomId = null;
}

function launchChanceRoomPuck(puck) {
  window.BalloroQuickTrail?.clear(puck);
  puck.trailBonusKind = window.BalloroBonusUI?.isV2 && puck.v2ChanceActivated ? "crown" : null;
  if (window.BalloroBonusUI?.isV3) puck.pocketBallKind = "crown";
  const chance = puck.chance;
  chance.phase = "inside";
  state.chanceCapturedPuck = null;
  state.chancePhase = "idle";
  state.chanceFinalCueUntil = 0;
  updateChanceBonusCounter();
  chance.roomId = chance.selectedRoomId ?? state.chanceSelectedRoomId;
  state.chanceSelectedRoomId = chance.roomId;
  const sharedEntry = window.BalloroBonusUI?.isV2;
  const entry = getChanceRoomEntryLocal(chance.roomId, 0.82);
  chance.u = entry.u;
  chance.v = entry.v;
  chance.v2SharedEntryCoordinates = sharedEntry;
  chance.age = 0;
  const rng = window.PuckLuckMath.createRng(((state.roundOutcome?.seed || 1) ^ 0x53484f54) >>> 0);
  const angleJitter = (rng.next() - 0.5) * 0.56;
  const launchForce = window.PuckLuckTrajectoryPlanner.VISUAL_PHYSICS.visual_launch_force;
  const normalizedForce = launchForce / window.PuckLuckTrajectoryPlanner.REFERENCE_HALF_PX;
  const launchAngle = Math.PI * 0.25 + angleJitter;
  chance.launchForce = launchForce;
  const velocityU = Math.cos(launchAngle) * normalizedForce;
  const velocityV = Math.sin(launchAngle) * normalizedForce;
  chance.vu = sharedEntry && chance.roomId === "bottom-right" ? velocityU : -velocityU;
  chance.vv = sharedEntry && chance.roomId === "bottom-left" ? velocityV : -velocityV;
  chance.dampingPerStep = puck.replayTrajectory?.damping_per_step || 0.972;
  if (window.BalloroSavedPaths?.enabled) {
    const savedFrames = window.BalloroBonusUI?.isV3
      ? window.BalloroSavedPaths.roomV3(GRID_SIZE,chance.roomId,
        window.BalloroMvpMath?.enabled() ? randomPrototypeUnit() : rng.next())
      : window.BalloroSavedPaths.room(GRID_SIZE,rng.next());
    chance.savedFrames = sharedEntry
      ? savedFrames.map((frame) => mapLegacyChanceFrameToV2(chance.roomId, frame))
      : savedFrames;
    chance.savedFrame = 0;
  }
  puck.pocketDepth = 0;
  playLaunchSound();
}

function getSectorCenter(sector) {
  const { half, grid } = state.field;
  return {
    x: -half + grid * (sector.col + 0.5),
    y: -half + grid * (sector.row + 0.5)
  };
}

function captureStoppedV2Pocket(puck) {
  if (!window.BalloroBonusUI?.isV2 || !POCKET_TEST_RANDOM_PHYSICS) return false;
  collectMultiPlusByTouch(puck, 1, false, true);
  if (puck === state.multiPlusCapturedPuck) return true;
  if (captureFieldPocketPuckByTouch(puck, true)) return true;
  if (captureChancePuck(puck, true)) return true;
  if (window.BalloroBonusUI?.isV3 && state.chancePocket?.consumed) {
    const pocket = getChancePocketGeometry();
    const distance = Math.hypot(puck.x - pocket.normalized.x * state.field.half,
      puck.y - pocket.normalized.y * state.field.half);
    const cell = window.BalloroBonusUI?.isV4 ? getCellFromPoint(puck.x, puck.y) : null;
    if (distance <= Math.max(0, 2 * state.field.puckRadius - 1)
      || (window.BalloroBonusUI?.isV4 && cell.col === state.chancePocket.col && cell.row === state.chancePocket.row)) {
      return queueV3PocketPuck(puck, "red", {
        x: pocket.normalized.x * state.field.half,
        y: pocket.normalized.y * state.field.half
      });
    }
  }
  if (window.BalloroBonusUI?.isV3) {
    for (const [zoneId, pocket] of [[FIELD_POCKET_ZONE_ID, state.fieldPocket],
      [BLUE_FIELD_POCKET_ZONE_ID, state.bluePocket]]) {
      if (!pocket?.consumed || (zoneId === FIELD_POCKET_ZONE_ID && puck.purplePocketExitRequired)
        || (zoneId === BLUE_FIELD_POCKET_ZONE_ID && puck.bluePocketExitRequired)) continue;
      const normalized = getFieldPocketNormalized(pocket);
      const point = { x: normalized.x * state.field.half,
        y: normalized.y * state.field.half };
      const cell = window.BalloroBonusUI?.isV4 ? getCellFromPoint(puck.x, puck.y) : null;
      if (Math.hypot(puck.x - point.x, puck.y - point.y) <= state.field.puckRadius * 2 - 1
        || (window.BalloroBonusUI?.isV4 && cell.col === pocket.col && cell.row === pocket.row)) {
        return queueV3PocketPuck(puck, "blue", point, zoneId);
      }
    }
    const token = state.multiPlusToken;
    if (token?.consumed && !puck.multiPlusExitRequired
      && (Math.hypot(puck.x - token.x, puck.y - token.y)
        <= state.field.puckRadius + token.radius - 1
        || (window.BalloroBonusUI?.isV4 && getCellFromPoint(puck.x, puck.y).col === token.col
          && getCellFromPoint(puck.x, puck.y).row === token.row))) {
      return queueV3PocketPuck(puck, "yellow", token);
    }
  }
  return false;
}

function pullSlowV3PuckIntoPocket(puck, frames) {
  if (!window.BalloroBonusUI?.isV3 || puck.secretRoom
    || puck.chance || puck === state.multiPlusCapturedPuck) return false;
  const progress = puck.replayCursor / Math.max(1, frames.length - 1);
  if (progress < 0.78 || puck.speed > state.field.half * 0.1) return false;
  const last = frames[frames.length - 1];
  const end = { x: last[1] * state.field.half, y: last[2] * state.field.half };
  const radius = state.field.puckRadius;
  const near = (point, captureRadius) => {
    if (window.BalloroBonusUI?.isV4) {
      const currentCell = getCellFromPoint(puck.x, puck.y);
      const endCell = getCellFromPoint(end.x, end.y);
      const pocketCell = getCellFromPoint(point.x, point.y);
      if (currentCell.col === pocketCell.col && currentCell.row === pocketCell.row
        && endCell.col === pocketCell.col && endCell.row === pocketCell.row) return true;
    }
    return Math.hypot(end.x - point.x, end.y - point.y) <= captureRadius
      && Math.hypot(puck.x - point.x, puck.y - point.y) <= radius * 2.6;
  };

  for (const [zoneId, pocket] of [[FIELD_POCKET_ZONE_ID, state.fieldPocket],
    [BLUE_FIELD_POCKET_ZONE_ID, state.bluePocket]]) {
    if (!pocket
      || (zoneId === FIELD_POCKET_ZONE_ID && puck.purplePocketExitRequired)
      || (zoneId === BLUE_FIELD_POCKET_ZONE_ID && puck.bluePocketExitRequired)) continue;
    const normalized = getFieldPocketNormalized(pocket);
    const point = { x: normalized.x * state.field.half, y: normalized.y * state.field.half };
    if (!near(point, Math.max(0, radius * 2 - 1))) continue;
    if (pocket.consumed || pocket.finished) {
      return queueV3PocketPuck(puck, "blue", point, zoneId);
    }
    puck.authoritativeResult = null;
    puck.secretRoom = { zoneId, phase: "entry", pocketCaptureArmed: true, roomCursor: 0, roomFrame: 0 };
    parkSecretRoomPuck(puck);
    return true;
  }

  const token = state.multiPlusToken;
  if (token && !puck.multiPlusExitRequired && near(token, radius + token.radius - 1)) {
    if (token.consumed || token.collected) return queueV3PocketPuck(puck, "yellow", token);
    collectMultiPlus(puck, true);
    return puck === state.multiPlusCapturedPuck;
  }

  if (state.chancePocket) {
    const pocket = getChancePocketGeometry();
    const point = { x: pocket.normalized.x * state.field.half,
      y: pocket.normalized.y * state.field.half };
    if (near(point, Math.max(0, radius * 2 - 1))) {
      if (state.chancePocket.consumed || state.chanceCapturedPuck) {
        return queueV3PocketPuck(puck, "red", point);
      }
      return captureChancePuck(puck, true, true);
    }
  }
  return false;
}

function stepReplayPuck(puck) {
  if (puck.stopped) {
    return;
  }
  if (puck.v3QueuePull) {
    if (stepFieldPocketPullCapture(puck, puck.v3QueuePull)) {
      puck.v3QueuePull = null;
      puck.stopped = true;
      puck.pocketDepth = 0;
      puck.vx = 0;
      puck.vy = 0;
      puck.speed = 0;
    }
    return;
  }
  if (puck === state.multiPlusCapturedPuck) {
    if (stepMultiPlusPocketCapture(puck)) return;
    if (["captured", "revealing"].includes(state.multiPlusPhase)) return;
  }
  const frames = puck.replayTrajectory?.frames;
  if (!frames?.length) throw new Error("Puck replay trajectory is missing");
  if (puck.replayDelayFrames > 0) {
    puck.replayDelayFrames -= 1;
    return;
  }
  if (stepSecretRoomPuck(puck)) return;
  const previousBounces = puck.bounceCount;
  const replayProgress = puck.replayCursor / Math.max(1, frames.length - 1);
  const finishBlend = clamp((replayProgress - 0.75) / 0.25, 0, 1);
  const smoothFinishBlend = finishBlend * finishBlend * (3 - 2 * finishBlend);
  const playbackRate = 0.64 + (0.82 - 0.64) * smoothFinishBlend;
  puck.replayCursor = Math.min(puck.replayCursor + playbackRate, frames.length - 1);
  puck.replayFrame = Math.floor(puck.replayCursor);
  const frame = frames[puck.replayFrame];
  const half = state.field.half;
  puck.previousX = puck.x;
  puck.previousY = puck.y;
  puck.age = frame[0];
  puck.x = frame[1] * half;
  puck.y = frame[2] * half;
  puck.vx = frame[3] * half * playbackRate;
  puck.vy = frame[4] * half * playbackRate;
  puck.bounceCount = frame[5];
  puck.speed = Math.hypot(puck.vx, puck.vy);
  if (window.BalloroMvpMath?.enabled()) {
    // Re-arm source-pocket guards while the saved flight actually leaves the
    // pocket. A guard inherited through a bonus chain must not suppress a later
    // legitimate return. V1 retains its original rest-only guards.
    const exitRadius = Math.max(0, 2 * state.field.puckRadius - 1);
    for (const [flag, pocket] of [["bluePocketExitRequired", state.bluePocket],
      ["purplePocketExitRequired", state.fieldPocket]]) {
      if (!puck[flag] || !pocket) continue;
      const point = getFieldPocketNormalized(pocket);
      if (Math.hypot(puck.x - point.x * half, puck.y - point.y * half) > exitRadius) puck[flag] = false;
    }
    if (puck.multiPlusExitRequired && state.multiPlusToken
      && Math.hypot(puck.x - state.multiPlusToken.x, puck.y - state.multiPlusToken.y)
        > state.field.puckRadius + state.multiPlusToken.radius + 2) puck.multiPlusExitRequired = false;
  }
  if (puck.bounceCount > previousBounces) playWallHitSound(puck.speed);
  collectBonusStarByTouch(puck);
  if (puck.pocketRelease) collectPocketReleaseSymbolsByTouch(puck);
  else {
    collectMultiPlusByTouch(puck);
    if (puck === state.multiPlusCapturedPuck) return;
  }
  if (pullSlowV3PuckIntoPocket(puck, frames)) return;
  if (captureChancePuck(puck)) return;
  if (captureFieldPocketPuckByTouch(puck)) return;
  if (puck.secretRoom?.phase === "entry") {
    const pocket = getSecretZoneGeometry(puck.secretRoom.zoneId).hole;
    const captureRadius = state.field.puckRadius
      * window.PuckLuckTrajectoryPlanner.POCKET_CAPTURE_RADIUS_MULTIPLIER;
    if (!puck.secretRoom.pocketCaptureArmed) {
      if (Math.hypot(puck.x - pocket.x, puck.y - pocket.y) > captureRadius) {
        puck.secretRoom.pocketCaptureArmed = true;
      }
    } else {
      const captureProgress = window.PuckLuckTrajectoryPlanner.segmentCircleFirstIntersection(
        [0, puck.previousX, puck.previousY],
        [0, puck.x, puck.y],
        pocket,
        captureRadius
      );
      if (captureProgress !== null) {
        const occupied = state.pucks.some((item) => item !== puck
          && item.secretRoom?.zoneId === puck.secretRoom.zoneId
          && ["capturing", "pocket_wait"].includes(item.secretRoom.phase));
        if (occupied) {
          const zoneId = puck.secretRoom.zoneId;
          puck.secretRoom = null;
          if (window.BalloroBonusUI?.isV3) {
            queueV3PocketPuck(puck, "blue", pocket, zoneId);
          } else {
            puck.waitingForPocket = { kind: "blue", zoneId };
          }
          return;
        }
        puck.x = puck.previousX + (puck.x - puck.previousX) * captureProgress;
        puck.y = puck.previousY + (puck.y - puck.previousY) * captureProgress;
        parkSecretRoomPuck(puck);
        return;
      }
    }
  }
  const finalFrame = frames[frames.length - 1];
  const remainingDistance = Math.hypot(puck.x - finalFrame[1] * half, puck.y - finalFrame[2] * half);
  const actualCell = getCellFromPoint(puck.x, puck.y);
  const target = puck.authoritativeResult;
  const targetCell = target || getCellFromPoint(finalFrame[1] * half, finalFrame[2] * half);
  const insideTarget = actualCell.col === targetCell.col && actualCell.row === targetCell.row;
  const completedBounces = puck.bounceCount >= puck.replayTrajectory.bounce_count;
  const invisibleTail = remainingDistance <= Math.max(2, state.field.puckRadius * 0.12);
  if ((insideTarget && completedBounces && invisibleTail) || puck.replayFrame === frames.length - 1) {
    if (puck.secretRoom?.phase === "entry") parkSecretRoomPuck(puck);
    else if (!captureStoppedV2Pocket(puck)) settlePuck(puck);
  }
}

function getResultCell(puck) {
  const actual = getCellFromPoint(puck.x, puck.y);
  const actualCategory = getCellCategory(actual.col, actual.row);
  const actualMultiplier = getPuckCellMultiplier(puck, actual.col, actual.row);
  if (puck.authoritativeResult && !POCKET_TEST_RANDOM_PHYSICS) {
    return { ...puck.authoritativeResult };
  }
  const category = window.BalloroMvpMath?.enabled() ? getPuckCellCategory(puck, actual.col, actual.row) : actualCategory;
  return { col: actual.col, row: actual.row, category, multiplier: actualMultiplier };
}

function getPuckCellMultiplier(puck, col, row) {
  if (!window.BalloroMvpMath?.enabled()) return getCellMultiplier(col, row);
  const rules = window.BalloroV4Rules;
  const boosted = puck.v3YellowCells?.some(cell => cell.col === col && cell.row === row);
  return Math.round(rules.cellMultiplier(GRID_SIZE, col, row) * (boosted ? rules.yellowMultiplier : 1) * 10) / 10;
}

function getPuckCellCategory(puck, col, row) {
  if (window.BalloroV4Rules.pocketKindAt(GRID_SIZE, col, row)) return "empty";
  if (puck.v3YellowCells?.some(cell => cell.col === col && cell.row === row)) return "multi_plus";
  const mid = (GRID_SIZE - 1) / 2, ring = Math.max(Math.abs(col - mid), Math.abs(row - mid));
  return ring === 0 ? "center" : ring === 1 ? "middle" : "outer";
}

function getCellCategory(col, row) {
  if (window.BalloroBonusUI?.isV3) {
    if (window.BalloroV3Rules.pocketKindAt(GRID_SIZE, col, row)) return "empty";
    if (isMultiPlusVisualActive()
      && getActiveMultiPlusCells().some((cell) => cell.col === col && cell.row === row)) return "multi_plus";
    const mid = (GRID_SIZE - 1) / 2;
    const ring = Math.max(Math.abs(col - mid), Math.abs(row - mid));
    return ring === 0 ? "center" : ring === 1 ? "middle" : "outer";
  }
  const config = getMathConfiguration();
  if (isMultiPlusVisualActive()
    && getActiveMultiPlusCells().some((sector) => sector.col === col && sector.row === row)) {
    return "multi_plus";
  }
  for (const [category, sectors] of Object.entries(config?.sector_definitions || {})) {
    if (sectors.some((sector) => sector.col === col && sector.row === row)) return category;
  }
  return "unknown";
}

function settleSecretPuck(puck) {
  const actual = getCellFromPoint(puck.x, puck.y);
  const actualCategory = getCellCategory(actual.col, actual.row);
  const multiplier = getPuckCellMultiplier(puck, actual.col, actual.row);
  const diagnostic = state.trajectoryDiagnostics[state.pucks.indexOf(puck)];
  if (diagnostic) {
    diagnostic.actual_sector = actual;
    diagnostic.actual_category = actualCategory;
    diagnostic.visual_matches_target = true;
    const cellLeft = -state.field.half + actual.col * state.field.grid;
    const cellTop = -state.field.half + actual.row * state.field.grid;
    diagnostic.final_position_percent = `${(((puck.x - cellLeft) / state.field.grid) * 100).toFixed(1)}%, ${(((puck.y - cellTop) / state.field.grid) * 100).toFixed(1)}%`;
    const center = getSectorCenter(actual);
    diagnostic.final_distance_to_center_px = Number(Math.hypot(puck.x - center.x, puck.y - center.y).toFixed(2));
  }
  const bonusActive = window.BalloroBonusUI?.isV3 ? Boolean(puck.v3PurpleBonus) : isX10BoostActive();
  const x10Boosted = bonusActive && multiplier > 0;
  const basePayout = (puck.v3BetPerPuck || state.activeBetPerPuck) * multiplier;
  const payout = basePayout * (x10Boosted ? 10 : 1);
  state.bankroll += payout;
  state.roundWinAmount += payout;
  puck.stopped = true;
  updateBank();
  puck.vx = 0;
  puck.vy = 0;
  puck.speed = 0;
  puck.secretRoom.phase = "settled";
  puck.pocketRelease = true;
  puck.resultRevealStartedAt = (window.BalloroGameLifecycle?.now() ?? performance.now());
  puck.result = {
    col: actual.col,
    row: actual.row,
    category: actualCategory,
    multiplier,
    payout,
    basePayout,
    x10Boosted,
    secretRoom: false,
    pocketRelease: true,
    secretZoneId: puck.secretRoom.zoneId
  };
  captureResultCellSymbol(puck);
  if (multiplier > 0) {
    state.settledCells.push({
      col: actual.col,
      row: actual.row,
      puckIndex: state.pucks.indexOf(puck),
      purpleBoost: x10Boosted,
      squareWin: true,
      lineWin: false
    });
  }
  playMultiplierResultSound(multiplier, x10Boosted);
  if (window.BalloroBonusUI?.isV3 || state.pucks.every((item) => item.stopped)) startResultRevealAnimation();
}

function settlePuck(puck) {
  const result = getResultCell(puck);
  const actual = getCellFromPoint(puck.x, puck.y);
  const diagnostic = state.trajectoryDiagnostics[state.pucks.indexOf(puck)];
  if (diagnostic) {
    diagnostic.actual_sector = actual;
    diagnostic.actual_category = getCellCategory(actual.col, actual.row);
    diagnostic.visual_matches_target = actual.col === result.col && actual.row === result.row;
    const cellLeft = -state.field.half + actual.col * state.field.grid;
    const cellTop = -state.field.half + actual.row * state.field.grid;
    diagnostic.final_position_percent = `${(((puck.x - cellLeft) / state.field.grid) * 100).toFixed(1)}%, ${(((puck.y - cellTop) / state.field.grid) * 100).toFixed(1)}%`;
    const center = getSectorCenter(actual);
    diagnostic.final_distance_to_center_px = Number(Math.hypot(puck.x - center.x, puck.y - center.y).toFixed(2));
  }
  if (actual.col !== result.col || actual.row !== result.row) {
    console.error("BalloroX replay landed in the wrong sector", { expected: result, actual, puck });
  }
  const multiplier = result.multiplier;
  const bonusActive = window.BalloroBonusUI?.isV3 ? Boolean(puck.v3PurpleBonus) : isX10BoostActive();
  const x10Boosted = bonusActive && !result.secretRoom && multiplier > 0;
  const multiPlusBoosted = Boolean(window.BalloroBonusUI?.isV3
    && result.category === "multi_plus" && multiplier > 0);
  const basePayout = (puck.v3BetPerPuck || state.activeBetPerPuck) * multiplier;
  const payout = basePayout * (x10Boosted ? 10 : 1);
  state.bankroll += payout;
  state.roundWinAmount += payout;
  puck.stopped = true;
  updateBank();
  puck.vx = 0;
  puck.vy = 0;
  puck.speed = 0;
  puck.resultRevealStartedAt = (window.BalloroGameLifecycle?.now() ?? performance.now());
  puck.result = { ...result, multiplier, payout, basePayout, x10Boosted, multiPlusBoosted };
  captureResultCellSymbol(puck);
  const v3SoundTier = window.BalloroBonusUI?.isV3
    ? getV3WinSoundTier(result.col, result.row) : null;
  playMultiplierResultSound(multiplier, x10Boosted,
    multiPlusBoosted || v3SoundTier === 2, v3SoundTier);
  state.settledCells.push({
    col: result.col,
    row: result.row,
    puckIndex: state.pucks.indexOf(puck),
    purpleBoost: x10Boosted,
    squareWin: multiplier > 0,
    lineWin: false
  });
  if (window.BalloroBonusUI?.isV3 || state.pucks.every((item) => item.stopped)) startResultRevealAnimation();
}

function getRoundLeaderboardMultiplier(pucks = []) {
  return pucks.reduce((total, puck) => total
    + (Number(puck.result?.multiplier) || 0) * (puck.result?.x10Boosted ? 10 : 1), 0);
}

function settleRound() {
  const requiredStars = getRequiredStars();
  const authoritativeBonus = window.BalloroBonusUI?.isV2
    ? state.x10BoostActivated
    : state.roundOutcome?.bonus_triggered ?? state.crownsCollected >= requiredStars;
  if (authoritativeBonus && state.roundWinAmount > 0 && !state.crownBonusAwarded) {
    state.x10BoostActivated = true;
    state.pucks.forEach((puck) => upgradeSettledResultToX10(puck, { animate: false, playSound: false }));
    state.crownBonusAwarded = true;
  }
  const roundMultiplier = getRoundLeaderboardMultiplier(state.pucks);
  const totalStake = state.activeBetPerPuck * state.puckCount;
  // The daily board ranks the complete round: add every ball's effective
  // multiplier instead of averaging the result by the number of purchased balls.
  const leaderboardMultiplier = roundMultiplier;
  state.wonLines = [];
  if (roundMultiplier > 0) {
    state.resultHistory.unshift({
      value: roundMultiplier,
      baseValue: state.crownBonusAwarded ? roundMultiplier / 10 : roundMultiplier,
      bonus: state.crownBonusAwarded,
      puckCount: state.puckCount
    });
    state.resultHistory = state.resultHistory.slice(0, 60);
  }
  if (roundMultiplier > 0) {
    addPurpleLeaderboardEntry({
      id: `real-${state.roundId}`,
      name: "YOU",
      multiplier: leaderboardMultiplier,
      stake: totalStake,
      balls: state.puckCount,
      payout: state.roundWinAmount,
      timestamp: Date.now(),
      isReal: true
    });
  }
  if (typeof desktopRoundRecord === 'function') desktopRoundRecord({
    id:state.roundId,timestamp:Date.now(),balls:state.puckCount,
    stake:state.activeBetPerPuck*state.puckCount,payout:state.roundWinAmount
  });
  state.running = false;
  if (window.BalloroBonusUI?.isV2) {
    // The earned symbols remain visibly full through the bonus shots. Clear
    // only after every ball in the round has come to rest.
    state.v2BonusArrivedActive = { diamond: false, crown: false, lemon: false, blue: false };
    updateCrownCounter();
    updateChanceBonusCounter();
    updateMultiPlusCounter();
    updatePocketBonusCounter();
  }
  state.activeSlot = null;
  state.activeBetPerPuck = 0;
  state.roundSettledAt = (window.BalloroGameLifecycle?.now() ?? performance.now());
  updateBank();
  updateBetButtons();
  updateRoundWinLabel();
  renderHistory();
  render();
  startCollectibleIdleAnimation();
  if (state.winPresentationUnlockTimer !== null) {
    window.clearTimeout(state.winPresentationUnlockTimer);
    state.winPresentationUnlockTimer = null;
  }
  const unlockDelay = Math.max(0,
    getAutoPlayReadyAt() - AUTO_PLAY_ROUND_GAP_MS - (window.BalloroGameLifecycle?.now() ?? performance.now()));
  if (unlockDelay > 0) {
    state.winPresentationUnlockTimer = window.setTimeout(() => {
      state.winPresentationUnlockTimer = null;
      if (!state.running) updateBetButtons();
    }, unlockDelay + 24);
  }
  scheduleNextAutoPlayRound();
}

function maybeLaunchParkedSecretRooms(now) {
  const parked = state.pucks.filter((puck) => puck.secretRoom?.phase === "pocket_wait"
    && (!window.BalloroBonusUI?.isV3 || (state.v3BonusLock === "blue"
      ? puck.secretRoom.zoneId === BLUE_FIELD_POCKET_ZONE_ID && puck === state.v3BonusPuck
      : state.v3BonusLock === "diamond" && puck === state.v3BonusPuck)));
  if (!parked.length) return;
  const v3GreenWaiting = window.BalloroBonusUI?.isV3
    ? parked.filter((puck) => puck.secretRoom.zoneId === BLUE_FIELD_POCKET_ZONE_ID) : [];
  if (window.BalloroBonusUI?.isV3
    && !["blue", "diamond"].includes(state.v3BonusLock)) return;
  const mainFieldStillMoving = state.pucks.some((puck) => !puck.stopped
    && puck.secretRoom?.phase !== "pocket_wait"
    && !(window.BalloroBonusUI?.isV3 && state.v3BonusLock === "diamond"
      && puck === state.multiPlusCapturedPuck)
    && (window.BalloroBonusUI?.isV3 || puck !== state.chanceCapturedPuck));
  if (mainFieldStillMoving && !v3GreenWaiting.length && !window.BalloroBonusUI?.isV3) return;
  if (state.secretRoomLaunchAt === 0) {
    state.secretRoomLaunchAt = now + (window.BalloroBonusUI?.isV3
      && state.v3BonusLock === "diamond" ? 240 : 1000);
    return;
  }
  if (state.secretRoomLaunchAt > 0 && now >= state.secretRoomLaunchAt) {
    if (parked.some((puck) => puck.secretRoom?.bonusSymbolPending
      || (puck.secretRoom?.blueLaunchReadyAt || 0) > now)) return;
    const ready = v3GreenWaiting.length ? v3GreenWaiting : parked;
    if (window.BalloroBonusUI?.isV4 && state.v3BonusLock === "diamond"
      && ready[0].secretRoom.v2BonusActivated) {
      const visit = ready[0].secretRoom;
      if (!visit.purpleFieldReadyAt) {
        activateX10Boost();
        ready[0].v3PurpleBonus = true;
        visit.purpleFieldReadyAt = now + (state.animationsEnabled ? V4_PURPLE_FIELD_ENTER_MS : 0);
        return;
      }
      if (now < visit.purpleFieldReadyAt) return;
    }
    if (window.BalloroBonusUI?.isV3) {
      beginSecretRoomVisit(ready[0]);
      state.secretRoomLaunchAt = 0;
    } else {
      ready.forEach(beginSecretRoomVisit);
      state.secretRoomLaunchAt = -1;
    }
  }
}

function reopenSettledPuckForPocketCapture(puck) {
  const puckIndex = state.pucks.indexOf(puck);
  const payout = Number(puck.result?.payout) || 0;
  if (payout > 0) {
    state.bankroll -= payout;
    state.roundWinAmount -= payout;
    updateBank();
    updateRoundWinLabel();
  }
  state.settledCells = state.settledCells.filter((cell) => cell.puckIndex !== puckIndex);
  puck.stopped = false;
  puck.result = null;
  puck.resultRevealStartedAt = 0;
  puck.vx = 0;
  puck.vy = 0;
  puck.speed = 0;
}

function findStoppedPuckInPocketRange(point, radius, predicate = () => true) {
  return state.pucks
    .filter((puck) => puck.stopped && !puck.chance && !puck.secretRoom && predicate(puck))
    .map((puck) => ({ puck, distance: Math.hypot(puck.x - point.x, puck.y - point.y) }))
    .filter((item) => item.distance <= radius)
    .sort((first, second) => first.distance - second.distance)[0]?.puck || null;
}

function captureWaitingPucksForAvailablePockets() {
  if (window.BalloroBonusUI?.isV3) {
    for (const [zoneId, pocketState] of [[FIELD_POCKET_ZONE_ID, state.fieldPocket],
      [BLUE_FIELD_POCKET_ZONE_ID, state.bluePocket]]) {
      const selectedKind = zoneId === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond";
      if (state.v3BonusLock && state.v3BonusLock !== selectedKind) continue;
      if (!pocketState || pocketState.consumed || pocketState.finished) continue;
      const point = getFieldPocketNormalized(pocketState);
      const queued = state.pucks.filter((puck) => puck.stopped
        && puck.waitingForPocket?.kind === "blue"
        && puck.waitingForPocket.zoneId === zoneId
        && (!state.v3BonusLock || puck === state.v3BonusPuck))
        .sort((a, b) => a.waitingForPocket.enteredAt - b.waitingForPocket.enteredAt)[0];
      const waiting = queued || findStoppedPuckInPocketRange(
        { x: point.x * state.field.half, y: point.y * state.field.half },
        Math.max(0, 2 * state.field.puckRadius - 1),
        (puck) => !puck.pocketRelease && !puck.purplePocketExitRequired
          && !puck.bluePocketExitRequired
      );
      if (waiting) {
        reopenSettledPuckForPocketCapture(waiting);
        waiting.v3PocketQueueAdvancing = Boolean(queued);
        waiting.waitingForPocket = null;
        waiting.pocketDepth = 0;
        captureFieldPocketPuckByTouch(waiting, true);
        return;
      }
    }
  }
  const token = state.multiPlusToken;
  if (token && !token.consumed && !token.collected && !state.multiPlusCapturedPuck
    && (!window.BalloroBonusUI?.isV3 || !state.v3BonusLock || state.v3BonusLock === "lemon")) {
    const queuedYellow = window.BalloroBonusUI?.isV3
      ? state.pucks.filter((puck) => puck.stopped
        && puck.waitingForPocket?.kind === "yellow"
        && (!state.v3BonusLock || puck === state.v3BonusPuck))
        .sort((a, b) => a.waitingForPocket.enteredAt - b.waitingForPocket.enteredAt)[0] : null;
    const yellowPuck = queuedYellow || findStoppedPuckInPocketRange(
      token,
      window.BalloroBonusUI?.isV2
        ? Math.max(0, state.field.puckRadius + token.radius - 1)
        : state.field.puckRadius + token.radius + 2,
      (puck) => !puck.multiPlusExitRequired
    );
    if (yellowPuck) {
      reopenSettledPuckForPocketCapture(yellowPuck);
      yellowPuck.v3PocketQueueAdvancing = Boolean(queuedYellow);
      yellowPuck.waitingForPocket = null;
      yellowPuck.pocketDepth = 0;
      collectMultiPlus(yellowPuck, true);
      return;
    }
  }

  if (state.chancePocket && !state.chancePocket.consumed && !state.chanceCapturedPuck
    && (!window.BalloroBonusUI?.isV3 || !state.v3BonusLock || state.v3BonusLock === "crown")) {
    const pocket = getChancePocketGeometry();
    const queuedRedPuck = state.pucks.filter((puck) => puck.stopped
      && puck.waitingForPocket?.kind === "red"
      && (!state.v3BonusLock || puck === state.v3BonusPuck))
      .sort((first, second) => first.waitingForPocket.enteredAt
        - second.waitingForPocket.enteredAt)[0];
    const redPuck = queuedRedPuck || findStoppedPuckInPocketRange(
      { x: pocket.normalized.x * state.field.half, y: pocket.normalized.y * state.field.half },
      window.BalloroBonusUI?.isV2
        ? Math.max(0, 2 * state.field.puckRadius - 1)
        : state.field.puckRadius * CHANCE_POCKET_CAPTURE_RADIUS_MULTIPLIER,
      (puck) => !puck.pocketRelease
        && (!puck.waitingForPocket || puck.waitingForPocket.kind === "red")
    );
    if (redPuck) {
      reopenSettledPuckForPocketCapture(redPuck);
      redPuck.v3PocketQueueAdvancing = Boolean(queuedRedPuck);
      redPuck.waitingForPocket = null;
      redPuck.pocketDepth = 0;
      captureChancePuck(redPuck, true);
    }
  }
}

function finalizeVisuallyStoppedReplayPucks(now) {
  const visualStopSpeed = state.field.half * 0.075;
  state.pucks.forEach((puck) => {
    const controlledByPocket = puck === state.multiPlusCapturedPuck
      || puck === state.chanceCapturedPuck
      || ["capturing", "pocket_wait", "inside"].includes(puck.secretRoom?.phase);
    const frames = puck.replayTrajectory?.frames;
    if (puck.stopped || controlledByPocket || !frames?.length) {
      puck.visualStopStartedAt = 0;
      return;
    }

    const replayProgress = puck.replayCursor / Math.max(1, frames.length - 1);
    if (replayProgress < 0.82 || puck.speed > visualStopSpeed) {
      puck.visualStopStartedAt = 0;
      return;
    }

    if (!puck.visualStopStartedAt) {
      puck.visualStopStartedAt = now;
      return;
    }
    if (now - puck.visualStopStartedAt < 180) return;

    puck.visualStopStartedAt = 0;
    if (puck.secretRoom?.phase === "entry") {
      parkSecretRoomPuck(puck);
      return;
    }

    const finalFrame = frames[frames.length - 1];
    puck.x = finalFrame[1] * state.field.half;
    puck.y = finalFrame[2] * state.field.half;
    puck.replayCursor = frames.length - 1;
    puck.replayFrame = frames.length - 1;
    if (!captureStoppedV2Pocket(puck)) settlePuck(puck);
  });
}

function getLiveBallPlaybackSpeed() {
  return state.quickPlay ? 3 : window.BalloroBonusUI?.isV4 ? 1.3 : 1;
}

function getLiveBonusPreparationStep() {
  // Preparation stays real-time while saved moving paths play faster.
  return FIXED_PHYSICS_STEP / getLiveBallPlaybackSpeed();
}

function scheduleGameTick(roundId) {
  if (window.BalloroGameLifecycle?.suspended || !state.running || roundId !== state.roundId) return;
  if (state.physicsFrame !== null) {
    if (state.physicsFrameRoundId === roundId) return;
    cancelAnimationFrame(state.physicsFrame);
  }
  state.physicsFrameRoundId = roundId;
  state.physicsFrame = requestAnimationFrame((time) => {
    state.physicsFrame = null;
    tick(time, roundId);
  });
}

function tick(now, roundId) {
  if (window.BalloroGameLifecycle?.suspended) return;
  now = window.BalloroGameLifecycle?.now() ?? now;
  if (!state.running || roundId !== state.roundId) {
    return;
  }

  const frameTime = Math.min(0.1, Math.max(0, (now - state.lastFrameAt) / 1000));
  state.lastFrameAt = now;
  state.physicsAccumulator += frameTime * getLiveBallPlaybackSpeed();
  while (state.physicsAccumulator >= FIXED_PHYSICS_STEP) {
    state.pucks.forEach((puck) => {
      if (!stepChanceRoomPuck(puck)) stepReplayPuck(puck);
    });
    collectPlannedStars();
    collectPlannedMultiPlus();
    state.physicsAccumulator -= FIXED_PHYSICS_STEP;
  }
  if (window.BalloroBonusUI?.isV3) advanceV3BonusQueue();
  maybeAdvanceMultiPlus(now);
  maybeLaunchParkedSecretRooms(now);
  maybeAdvanceChance(now);
  captureWaitingPucksForAvailablePockets();
  finalizeVisuallyStoppedReplayPucks(now);
  if (window.BalloroBonusUI?.isV3) {
    finishV3ExclusiveBonus(now);
    finishV3PurplePresentation(now);
    finalizeV3Shots();
    finishV3ChancePresentation(now);
  }
  render();

  if (state.pucks.every((puck) => puck.stopped)) {
    if (window.BalloroBonusUI?.isV3) {
      if (state.v3BonusLock || state.x10BoostActivated
        || state.chanceSelectedRoomId || state.chanceCapturedPuck) {
        scheduleGameTick(roundId);
        return;
      }
      state.running = false;
      state.roundSettledAt = now;
      updateBetButtons();
      startResultRevealAnimation();
      startCollectibleIdleAnimation();
      scheduleNextAutoPlayRound();
      return;
    }
    settleRound();
    return;
  }

  scheduleGameTick(roundId);
}

function finishV3ExclusiveBonus(now) {
  if (!state.v3BonusLock || state.v3BonusLock === "pending" || !state.v3BonusPuck) return;
  const waitingKind = state.v3BonusPuck.waitingForPocket && (state.v3BonusPuck.waitingForPocket.kind === "yellow"
    ? "lemon" : state.v3BonusPuck.waitingForPocket.kind === "red" ? "crown"
      : state.v3BonusPuck.waitingForPocket.zoneId === BLUE_FIELD_POCKET_ZONE_ID ? "blue" : "diamond");
  if (waitingKind === state.v3BonusLock) return;
  const transferred = (waitingKind && waitingKind !== state.v3BonusLock)
    || state.v3BonusQueue.some((entry) => entry.puck === state.v3BonusPuck
      && entry.kind !== state.v3BonusLock);
  if (state.v3BonusLock === "blue") {
    if (window.BalloroMvpMath?.enabled()
      && state.v3BonusPuck.secretRoom?.zoneId === BLUE_FIELD_POCKET_ZONE_ID
      && ["capturing", "pocket_wait"].includes(state.v3BonusPuck.secretRoom?.phase)) return;
    const released = state.pucks.filter((puck) => puck.v3ShotId === state.v3BonusPuck.v3ShotId
      && puck.pocketBallKind === "blue");
    if (!released.length || released.some((puck) => !puck.stopped
      && !puck.waitingForPocket && !puck.chance
      && !["capturing", "pocket_wait"].includes(puck.secretRoom?.phase)
      && puck !== state.multiPlusCapturedPuck)) return;
    if (released.some((puck) => puck.stopped && puck.result
      && getV3ResultFadeElapsed(puck, now) < 0)) return;
  } else if (!state.v3BonusPuck.stopped && !transferred) {
    return;
  }
  // Yellow releases this pocket lock as the result starts fading; the paid
  // launch gate still waits for its field-return flash. Purple
  // holds through the victory cue and the ball's fade, but not the much longer
  // floating multiplier tail.
  if (state.v3BonusLock !== "blue" && !transferred) {
    const fadeElapsed = getV3ResultFadeElapsed(state.v3BonusPuck, now);
    if (fadeElapsed < (state.v3BonusLock === "diamond"
      ? window.BalloroV3Rules.resultFadeMs / 2 : 0)) return;
  }
  if (state.v3BonusLock === "diamond") {
    if (state.fieldPocket) {
      state.fieldPocket.consumed = false;
      state.fieldPocket.finished = false;
    }
  } else if (state.v3BonusLock === "lemon") {
    // The common return flash replaces the old manual-only indefinite hold.
    state.multiPlusActive = false;
    state.multiPlusFinalCells = null;
    if (state.multiPlusToken) {
      state.multiPlusToken.consumed = false;
      state.multiPlusToken.finished = false;
    }
  } else if (state.v3BonusLock === "blue") {
    if (state.bluePocket) {
      state.bluePocket.consumed = false;
      state.bluePocket.finished = false;
    }
  } else if (state.v3BonusLock === "crown") {
    state.chanceSelectedRoomId = null;
    state.chanceRoomOutcome = null;
    state.chanceCompletedRoomIds.clear();
    if (state.chancePocket) {
      state.chancePocket.consumed = false;
      state.chancePocket.finished = false;
    }
  }
  const finishedKind = state.v3BonusLock;
  const moreOfThisPocket = state.v3BonusQueue.some((entry) => entry.kind === finishedKind);
  if (!moreOfThisPocket) {
    state.v3PocketSymbolCycle[finishedKind] = false;
    state.v2BonusArrivedActive[finishedKind] = false;
  }
  state.v3BonusLock = state.v3BonusQueue.length ? "pending" : null;
  state.v3BonusPuck = null;
  updateCrownCounter();
  updateMultiPlusCounter();
  updateChanceBonusCounter();
  updatePocketBonusCounter();
  updateBetButtons();
  captureWaitingPucksForAvailablePockets();
}

function finishV3ChancePresentation(now) {
  if (state.chanceCapturedPuck || !state.chanceSelectedRoomId) return;
  if (state.pucks.some((puck) => puck.chance && puck.chance.phase !== "settled")) return;
  const latest = [...state.pucks].reverse().find((puck) => puck.chance?.roomId
    && puck.chance.phase === "settled");
  if (!latest || getV3ResultFadeElapsed(latest, now) < 0) return;
  state.chanceSelectedRoomId = null;
  state.chanceRoomOutcome = null;
  state.chanceCompletedRoomIds.clear();
  if (!state.v3PocketSymbolCycle.crown) state.v2BonusArrivedActive.crown = false;
  if (state.chancePocket) {
    state.chancePocket.consumed = false;
    state.chancePocket.finished = false;
  }
  updateChanceBonusCounter();
}

function finalizeV3Shots() {
  for (const [shotId, shot] of state.v3Shots) {
    const pucks = state.pucks.filter((puck) => puck.v3ShotId === shotId);
    if (!pucks.length || pucks.some((puck) => !puck.stopped || puck.waitingForPocket)) continue;
    const payout = pucks.reduce((sum, puck) => sum + (puck.result?.payout || 0), 0);
    const multiplier = getRoundLeaderboardMultiplier(pucks);
    state.v3LastWinAmount = payout;
    if (payout > 0) state.v3WinLabelSerial += 1;
    updateRoundWinLabel();
    if (multiplier > 0) {
      state.resultHistory.unshift({
        value: multiplier,
        baseValue: multiplier,
        bonus: pucks.some((puck) => puck.result?.x10Boosted),
        puckCount: shot.count
      });
      state.resultHistory = state.resultHistory.slice(0, 60);
      addPurpleLeaderboardEntry({
        id: `v3-${shotId}`, name: "YOU", multiplier, stake: shot.stake,
        balls: shot.count, payout, timestamp: shot.launchedAt, isReal: true
      });
    }
    if (typeof desktopRoundRecord === "function") {
      desktopRoundRecord({ id: `v3-${shotId}`, timestamp: shot.launchedAt,
        balls: shot.count, stake: shot.stake, payout });
    }
    state.v3Shots.delete(shotId);
    playControls?.settled(shotId, payout);
    if (playControls?.pause.active) updateBetButtons();
    renderHistory();
  }
}

function claimV3ExclusiveBonus(kind, puck) {
  playControls?.bonus(puck.v3ShotId);
  // A released ball can enter the same pocket again: that is a new visit,
  // even though the previous visit is still the active bonus for this puck.
  if ((state.v3BonusPuck === puck && state.v3BonusLock === kind && !puck.waitingForPocket)
    || state.v3BonusQueue.some((entry) => entry.puck === puck && entry.kind === kind)) return false;
  const firstSymbol = !state.v3PocketSymbolCycle[kind];
  state.v3PocketSymbolCycle[kind] = true;
  state.v3BonusQueue.push({ kind, puck, enteredAt: (window.BalloroGameLifecycle?.now() ?? performance.now()) });
  if (!state.v3BonusLock) state.v3BonusLock = "pending";
  updateBetButtons();
  return firstSymbol;
}

function advanceV3BonusQueue() {
  if (state.v3BonusLock !== "pending" || !state.v3BonusQueue.length) return;
  const otherBallMoving = state.pucks.some((puck) => !puck.stopped
    && puck !== state.multiPlusCapturedPuck && puck !== state.chanceCapturedPuck
    && !["capturing", "pocket_wait"].includes(puck.secretRoom?.phase));
  if (otherBallMoving) return;
  const priority = { blue: 0, lemon: 1, crown: 2, diamond: 3 };
  const ready = (entry) => entry.kind === "lemon" ? entry.puck === state.multiPlusCapturedPuck
    : entry.kind === "crown" ? entry.puck === state.chanceCapturedPuck
      : ["capturing", "pocket_wait"].includes(entry.puck.secretRoom?.phase)
        && entry.puck.secretRoom.zoneId === (entry.kind === "blue" ? BLUE_FIELD_POCKET_ZONE_ID : FIELD_POCKET_ZONE_ID);
  // A ball already occupying a pocket must be served before parked arrivals
  // for that same pocket. Otherwise its live preparation could be cleared by
  // completing the lock of a still-queued ball.
  state.v3BonusQueue.sort((a, b) => priority[a.kind] - priority[b.kind]
    || Number(ready(b)) - Number(ready(a))
    || a.enteredAt - b.enteredAt);
  const next = state.v3BonusQueue.shift();
  state.v3BonusLock = next.kind;
  state.v3BonusPuck = next.puck;
  state.secretRoomLaunchAt = 0;
  updateBetButtons();
}

function openPopup(popup) {
  const focus = document.activeElement;
  if (typeof closeSlotDialogs === "function") closeSlotDialogs();
  [els.rulesScreen, els.languagePopup, els.avatarPopup, els.topUpPopup].forEach(node => {
    if (node !== popup) node.classList.add('hidden');
  });
  popup.classList.remove("hidden");
  els.menuDropdown.classList.add("hidden");
  playerPopupOpened(popup, focus);
}

function closePopup(popup) {
  popup.classList.add("hidden");
  playerPanels.focus?.focus();
}

function updateBank() {
  els.bankedLoot.textContent = formatMoney(state.bankroll);
}

function guardFundingOpeningRelease() {
  const cleanup = () => {
    document.removeEventListener('click', ignoreRelease, true);
    document.removeEventListener('pointerdown', cleanup, true);
    document.removeEventListener('pointercancel', cleanup, true);
    document.removeEventListener('keydown', cleanup, true);
    window.removeEventListener('blur', cleanup);
  };
  const ignoreRelease = (event) => {
    cleanup();
    if (event.detail > 0) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  // Exhaustion can open the modal while the old Spin contact is still down.
  // Swallow only that release click, never the next deliberate interaction.
  document.addEventListener('click', ignoreRelease, true);
  document.addEventListener('pointerdown', cleanup, true);
  document.addEventListener('pointercancel', cleanup, true);
  document.addEventListener('keydown', cleanup, true);
  window.addEventListener('blur', cleanup);
}

// Funding is an action, not a disabled Spin dead end. Already paid balls and
// bonus chains remain untouched; top-up never restarts paid play by itself.
function requirePaidLaunchBalance(stake) {
  if (window.BalloroGameLifecycle?.suspended) return false;
  if (!(stake > 0)) return false;
  if (state.bankroll >= stake && state.bankroll >= BET_STEPS[0]) return true;
  if (state.v3HoldTimer && els.topUpPopup.classList.contains('hidden')) guardFundingOpeningRelease();
  stopHeldPaidLaunches();
  playControls?.release();
  if (state.autoPlay) stopControlledAuto('balance');
  if (els.topUpPopup.classList.contains('hidden')) openPopup(els.topUpPopup);
  updateBetButtons();
  return false;
}

function updateRoundWinLabel() {
  const v3 = Boolean(window.BalloroBonusUI?.isV3);
  const amount = v3 ? state.v3LastWinAmount : state.roundWinAmount;
  if (amount > 0) {
    const nextText = `${t("win")} ${amount.toFixed(2)} USD`;
    const serial = String(state.v3WinLabelSerial);
    if (v3 && (els.roundWinLabel.textContent !== nextText
      || els.roundWinLabel.dataset.winSerial !== serial)) {
      els.roundWinLabel.classList.remove("win-pop");
      els.roundWinLabel.textContent = nextText;
      els.roundWinLabel.dataset.winSerial = serial;
      void els.roundWinLabel.offsetWidth;
      els.roundWinLabel.classList.add("win-pop");
    } else {
      els.roundWinLabel.textContent = nextText;
    }
    els.roundWinLabel.classList.remove("hidden");
  } else if (!v3 || !els.roundWinLabel.textContent) {
    els.roundWinLabel.textContent = "";
    els.roundWinLabel.classList.add("hidden");
  }
}

function getAutoPlayReadyAt() {
  if (!state.roundSettledAt) return 0;
  let endsAt = Math.max(state.roundSettledAt, state.winSoundEndsAt);
  if (bigWinEffect.roundId === state.roundId && bigWinEffect.winners.size) {
    endsAt = Math.max(endsAt, bigWinEffect.startedAt + BIG_WIN_DURATION_MS);
  }
  for (const puck of state.pucks) {
    if (!(puck.result?.multiplier > 0)) continue;
    endsAt = Math.max(endsAt,
      (puck.resultRevealStartedAt || 0) + RESULT_BOOST_REVEAL_DURATION_MS,
      (puck.result.boostRevealStartedAt || 0) + RESULT_BOOST_REVEAL_DURATION_MS);
  }
  if (state.multiPlusActive) {
    endsAt = Math.max(endsAt, state.multiPlusActivatedAt + RESULT_BOOST_REVEAL_DURATION_MS);
  }
  return endsAt + AUTO_PLAY_ROUND_GAP_MS;
}

function isWinPresentationActive(now = (window.BalloroGameLifecycle?.now() ?? performance.now())) {
  if (!(state.roundWinAmount > 0)) return false;
  return now < getAutoPlayReadyAt() - AUTO_PLAY_ROUND_GAP_MS;
}

function runAutoPlayTick() {
  if (window.BalloroGameLifecycle?.suspended) return;
  if (window.BalloroBonusUI?.isV3) {
    if (!state.autoPlay) return;
    if (playControls?.pause.active || playControls?.check()) return;
    if (state.autoRoundsRemaining === 0) {
      stopControlledAuto('count');
      updateSlotUi();
      return;
    }
    const slot = els.betSlots[0];
    if (!slot || !(parseBet(slot) > 0)) {
      stopControlledAuto('balance');
      return;
    }
    if (!isV3BonusLaunchBlocked()) {
      if (!requirePaidLaunchBalance(parseBet(slot))) return;
      launchV3Pucks(slot);
    }
    scheduleNextAutoPlayRound();
    return;
  }
  if (!state.autoPlay || state.running || state.launchPrepared) {
    return;
  }
  if (state.autoRoundsRemaining === 0) {
    setAutoPlay(false);
    updateSlotUi();
    return;
  }
  // Recheck after the timer: another winner can restart the celebration.
  if ((window.BalloroGameLifecycle?.now() ?? performance.now()) < getAutoPlayReadyAt()) {
    scheduleNextAutoPlayRound();
    return;
  }

  const slot = els.betSlots[0];
  if (!slot || parseBet(slot) <= 0) {
    setAutoPlay(false);
    return;
  }

  const totalBet = parseBet(slot) * state.puckCount;
  if (state.bankroll < totalBet) {
    setAutoPlay(false);
    openPopup(els.topUpPopup);
    return;
  }

  launchPuck(slot);
  if (state.autoPlay && !state.running) scheduleNextAutoPlayRound();
}

function scheduleNextAutoPlayRound() {
  if (window.BalloroGameLifecycle?.suspended) return;
  if (window.BalloroBonusUI?.isV3) {
    if (!state.autoPlay || playControls?.pause.active) return;
    if (state.autoPlayTimer) window.clearTimeout(state.autoPlayTimer);
    const wait = isV3BonusLaunchBlocked() ? 50
      : Math.max(0, state.v3LastLaunchAt + getV3LaunchIntervalMs() - (window.BalloroGameLifecycle?.now() ?? performance.now()));
    state.autoPlayTimer = window.setTimeout(() => {
      state.autoPlayTimer = null;
      runAutoPlayTick();
    }, wait);
    return;
  }
  if (!state.autoPlay || state.running || state.launchPrepared) return;
  if (state.autoPlayTimer) window.clearTimeout(state.autoPlayTimer);
  state.autoPlayTimer = window.setTimeout(() => {
    state.autoPlayTimer = null;
    runAutoPlayTick();
  }, Math.max(AUTO_PLAY_ROUND_GAP_MS, getAutoPlayReadyAt() - (window.BalloroGameLifecycle?.now() ?? performance.now())));
}

function setAutoPlay(enabled) {
  if (enabled && window.BalloroGameEntry?.blocked) return;
  if (enabled && window.BalloroGameLifecycle?.suspended) return;
  if (enabled && !BalloroPlayControls.policy.autoplay) return;
  if (enabled && BalloroPlayControls.policy.requireLossLimit
    && (!playControls?.session?.active || !playControls.session.limits.loss)) return;
  if (enabled && playControls && !playControls.session?.active) {
    const requested = state.autoRoundsRemaining > 0 ? state.autoRoundsRemaining : selectedAutoRounds;
    const count = requested === Infinity && BalloroPlayControls.policy.infiniteAutoplay
      ? Infinity : Math.min(BalloroPlayControls.policy.maxAutoCount, requested);
    playControls.start(count);
    state.autoRoundsRemaining = count;
  }
  state.autoPlay = enabled;
  els.autoPlayToggle.classList.toggle("active", enabled);
  els.autoPlayToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  if (window.BalloroBonusUI?.isV3) updateBetButtons();

  if (state.autoPlayTimer) {
    window.clearTimeout(state.autoPlayTimer);
    state.autoPlayTimer = null;
  }

  if (enabled) {
    if (window.BalloroBonusUI?.isV3) {
      runAutoPlayTick();
      return;
    }
    if (state.running || state.launchPrepared) return;
    runAutoPlayTick();
  }
}

function fitBrandTitle() {
  if (!els.brandTitle) {
    return;
  }

  const brand = els.brandTitle.closest(".brand");
  const available = brand?.clientWidth || 0;
  if (!available) {
    return;
  }

  const brandBaseSize = 48;
  const brandMaxSize = window.innerWidth <= 390 || window.innerHeight <= 660
    ? 30
    : window.innerWidth <= 720
      ? 34
      : 48;
  els.brandTitle.style.setProperty("--brand-font-size", `${brandBaseSize}px`);
  els.brandTitle.style.width = "max-content";
  const baseWidth = els.brandTitle.scrollWidth;
  const nextSize = Math.max(14, Math.min(brandMaxSize, Math.floor((available / baseWidth) * brandBaseSize)));
  els.brandTitle.style.setProperty("--brand-font-size", `${nextSize}px`);
  els.brandTitle.style.width = "auto";
}

const LOCALIZED_FIT_SELECTOR = [
  ".context-menu [data-i18n]",
  ".purple-leaderboard-title [data-i18n]",
  ".field-options [data-i18n]",
  ".bet-panel [data-i18n]",
  ".live-board-title [data-i18n]",
  ".live-board-head [data-i18n]"
].join(",");

function fitLocalizedUiText() {
  document.querySelectorAll(LOCALIZED_FIT_SELECTOR).forEach((element) => {
    element.classList.add("fit-i18n-text");
    element.style.removeProperty("font-size");
    const available = element.clientWidth;
    if (!available || element.scrollWidth <= available) return;
    const baseSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
    const ratio = Math.max(0.7, (available - 2) / element.scrollWidth);
    element.style.fontSize = `${Math.max(7, baseSize * ratio).toFixed(2)}px`;
  });
}

function updateBetButtons() {
  if (typeof updateSlotUi === "function") updateSlotUi();
  const winPresentationActive = isWinPresentationActive();
  const v3 = Boolean(window.BalloroBonusUI?.isV3);
  const photoPaused = Boolean(playControls?.pause.active);
  const controlsLocked = photoPaused || state.running || state.launchPrepared || (v3 ? isV3BonusLaunchBlocked() : winPresentationActive);
  els.autoPlayToggle.classList.toggle("active", state.autoPlay);
  els.autoPlayToggle.setAttribute("aria-pressed", state.autoPlay ? "true" : "false");

  els.betSlots.forEach((slot) => {
    const value = parseBet(slot);
    const action = slot.querySelector(".bet-action");
    const input = slot.querySelector(".bet-value");
    const betStepButtons = slot.querySelectorAll(".bet-round-button");
    action.disabled = v3 ? window.BalloroGameLifecycle?.suspended || isV3BonusLaunchBlocked({ presentationOnly: photoPaused }) || (photoPaused ? state.v3Shots.size > 0 || playControls.pause.mustRelease : !(value > 0))
      : state.running || winPresentationActive;
    const autoHeld = v3 && state.autoPlay && !photoPaused;
    const resumeLabel = t(state.autoPlay ? 'resumeAutoplay' : 'resumePlay');
    action.setAttribute("aria-label", t(photoPaused ? (state.autoPlay ? 'resumeAutoplay' : 'resumePlay') : autoHeld ? 'autoPlaying' : 'launchBall').replace(/\n/g, ' '));
    action.setAttribute('aria-disabled', String(action.disabled || autoHeld));
    action.tabIndex = autoHeld ? -1 : 0;
    action.classList.toggle('is-win-paused', photoPaused);
    action.classList.toggle('is-auto-held', autoHeld);
    action.classList.toggle("is-auto-firing", v3 && !photoPaused && (state.autoPlay || Boolean(state.v3HoldTimer)));
    action.classList.toggle("is-held", v3 && Boolean(state.v3HoldTimer));
    action.classList.toggle("is-cooling-down", v3 && !state.autoPlay && !state.v3HoldTimer
      && (window.BalloroGameLifecycle?.now() ?? performance.now()) - state.v3LastLaunchAt < getV3LaunchIntervalMs());
    action.classList.remove("waiting", "cashout", "mining");
    slot.querySelector(".bet-box").classList.toggle("is-locked", controlsLocked);
    input.disabled = controlsLocked;
    betStepButtons.forEach((button) => {
      button.disabled = controlsLocked;
    });

    if (state.running && !v3) {
      action.classList.add("waiting");
      action.querySelector("span").textContent = t("wait");
      action.querySelector("small").textContent = t("round");
      return;
    }

    action.querySelector("span").textContent = t("bet");
    action.querySelector("small").textContent = photoPaused ? resumeLabel : `${formatStake(value * state.puckCount)} USD`;
  });

  els.puckCountButtons.forEach((button) => {
    const unavailableInV2 = window.BalloroBonusUI?.isV2
      && (window.BalloroBonusUI?.isV3 || !window.BalloroPocketExperiment)
      && Number.parseInt(button.dataset.puckCount, 10) !== 1;
    button.disabled = controlsLocked || unavailableInV2;
    button.classList.toggle("is-locked", controlsLocked || unavailableInV2);
  });

  els.gridSizeButtons.forEach((button) => {
    button.disabled = controlsLocked;
    button.classList.toggle("active", Number.parseInt(button.dataset.gridSize, 10) === GRID_SIZE);
  });
  if (els.layoutModeButton) els.layoutModeButton.disabled = controlsLocked;
  const versionLocked = controlsLocked || state.autoPlay || state.v3BonusQueue.length > 0;
  els.versionButtons.forEach((button) => {
    button.disabled = versionLocked;
    button.setAttribute("aria-pressed", String(button.dataset.bonusUiVersion === window.BalloroBonusUI?.version));
  });
  if (!photoPaused) {
    resumeSpinArrowPosition();
    if (v3) syncSpinArrowSpeed();
  }
  updatePlayControlsUi();
}

const LAYOUT_BUTTON_LABELS = {
  current: "CUR",
  dynamic_diagonal_width: "DIA",
  plinko_zone_style: "PLK",
  configurator_1: "CFG1",
  configurator_2: "CFG2",
  configurator_3: "CFG3",
  configurator_4: "CFG4",
  configurator_5: "CFG5"
};

function updateLayoutModeButton() {
  const label = window.PuckLuckMath?.LAYOUT_LABELS?.[state.layoutMode] || state.layoutMode;
  if (els.layoutModeButton) {
    els.layoutModeButton.querySelector("span").textContent = LAYOUT_BUTTON_LABELS[state.layoutMode] || "CUR";
    els.layoutModeButton.title = `Layout: ${label}`;
    els.layoutModeButton.setAttribute("aria-label", `Layout: ${label}. Switch multiplier layout`);
  }
}

function cycleLayoutMode() {
  if (state.running || state.launchPrepared || !state.debugPhysics) return;
  const modes = window.PuckLuckMath?.LAYOUT_MODES || ["current"];
  const index = Math.max(0, modes.indexOf(state.layoutMode));
  state.layoutMode = modes[(index + 1) % modes.length];
  resetPucks();
  setupCanvas();
  updateLayoutModeButton();
  updateBetButtons();
  render();
}

function runLockedGameplayTests(rounds) {
  const tester = window.PuckLuckGameplayTest;
  const math = window.PuckLuckMath;
  if (!tester || !math) return [];
  const lineCounts = els.lockTestLines.checked ? [GRID_SIZE] : math.LINE_COUNTS;
  const puckCounts = els.lockTestPucks.checked ? [state.puckCount] : math.PUCK_COUNTS;
  const rows = [];
  for (const lines of lineCounts) for (const pucks of puckCounts) {
    const risk = math.riskForLines(lines);
    rows.push(tester.runGameplayTest({
      math,
      trajectoryLibrary: window.PuckLuckTrajectoryLibrary,
      layoutMode: state.layoutMode,
      risk, lines, pucks, rounds,
      seed: math.hashString(`${state.layoutMode}:${risk}:${lines}:${pucks}:${rounds}`)
    }));
  }
  state.gameplayTestRows = rows;
  const averageHit = rows.reduce((sum, row) => sum + row.hit_frequency, 0) / rows.length;
  els.layoutTestStatus.textContent = `${rows.length} config${rows.length === 1 ? "" : "s"} · ${rounds} rounds · hit ${(averageHit * 100).toFixed(1)}%`;
  return rows;
}

function exportGameplayTestCsv() {
  if (!state.gameplayTestRows.length) runLockedGameplayTests(100);
  const csv = window.PuckLuckGameplayTest.toCsv(state.gameplayTestRows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `puck_luck_gameplay_${state.layoutMode}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function canPrimeLaunch(slot) {
  if (window.BalloroGameEntry?.blocked || window.BalloroGameLifecycle?.suspended) return false;
  if (window.BalloroBonusUI?.isV3) {
    return Boolean(slot && !isV3BonusLaunchBlocked() && parseBet(slot) > 0
      && state.bankroll >= parseBet(slot) * state.puckCount);
  }
  if (state.running || isWinPresentationActive() || !slot) return false;
  if (state.launchPrepared) return state.launchPreparedSlot === slot;
  const bet = parseBet(slot);
  return bet > 0 && state.bankroll >= bet * state.puckCount;
}

function stopLaunchPrimeAnimation({ rerender = true } = {}) {
  state.launchButtonPrimed = false;
  document.querySelectorAll(".bet-action.is-pressed").forEach((button) => button.classList.remove("is-pressed"));
  if (state.launchPrimeFrame !== null) {
    cancelAnimationFrame(state.launchPrimeFrame);
    state.launchPrimeFrame = null;
  }
  if (rerender && !state.running) {
    render();
  }
}

function animateLaunchPrime() {
  state.launchPrimeFrame = null;
  if (window.BalloroGameLifecycle?.suspended) return;
  if (!state.launchButtonPrimed || state.running) {
    return;
  }
  render();
  state.launchPrimeFrame = requestAnimationFrame(animateLaunchPrime);
}

function startLaunchPrimeAnimation() {
  if (window.BalloroGameLifecycle?.suspended) return;
  if (state.launchPrimeFrame === null) {
    state.launchPrimeFrame = requestAnimationFrame(animateLaunchPrime);
  }
}

function setupBetControls() {
  els.betSlots.forEach((slot) => {
    const input = slot.querySelector(".bet-value");
    const decrease = slot.querySelector(".decrease-bet");
    const increase = slot.querySelector(".increase-bet");
    const action = slot.querySelector(".bet-action");
    let previousExperimentBet = parseBet(slot);
    let fundingContact = false;

    function resetProgressIfExperimentBetChanged() {
      if (!window.BalloroPocketExperiment) return;
      const currentBet = parseBet(slot);
      if (currentBet !== previousExperimentBet) {
        previousExperimentBet = currentBet;
        resetV2BonusProgressForLineChange();
      }
    }

    function change(delta) {
      if (state.running || state.launchPrepared) {
        return;
      }
      const current = parseBet(slot);
      input.value = formatStake(getStepValue(current, delta));
      resetProgressIfExperimentBetChanged();
      updateBetButtons();
    }

    decrease.addEventListener("click", () => change(-1));
    increase.addEventListener("click", () => change(1));
    input.addEventListener("input", () => {
      if (!state.running && !state.launchPrepared) {
        resetProgressIfExperimentBetChanged();
        updateBetButtons();
      }
    });
    input.addEventListener("blur", () => {
      const value = parseBet(slot);
      input.value = value > 0 ? formatStake(value) : "";
      resetProgressIfExperimentBetChanged();
      updateBetButtons();
    });
    action.addEventListener("pointerdown", async (event) => {
      if (window.BalloroBonusUI?.isV3) {
        if (event.button !== undefined && event.button !== 0) return;
        fundingContact = false;
        if (playControls?.pause.active) {
          // Manual confirmation does not bet. Autoplay resumes its next shot
          // now, and must not become a manual hold if that shot ends autoplay.
          const resumingAutoplay = state.autoPlay;
          if (tryResumeBigWin() && BalloroPlayControls.policy.heldSpin && !resumingAutoplay) {
            try { action.setPointerCapture?.(event.pointerId); } catch (_) { /* ignore */ }
            startV3HeldLaunch(slot, { afterResume: true });
          }
          return;
        }
        if (state.autoPlay) return;
        // Open funding on the completed click, not down: the modal must not
        // put its confirmation/cancel buttons underneath an unfinished tap.
        if (!isV3BonusLaunchBlocked() && parseBet(slot) > 0 && state.bankroll < parseBet(slot)) {
          fundingContact = true;
          return;
        }
        if (!canPrimeLaunch(slot)) return;
        playControls?.press();
        try { action.setPointerCapture?.(event.pointerId); } catch (_) { /* ignore */ }
        const wasAutoplay = state.autoPlay;
        launchV3Pucks(slot);
        if (!playControls?.pause.active && !(wasAutoplay && !state.autoPlay)
          && BalloroPlayControls.policy.heldSpin) startV3HeldLaunch(slot);
        updateBetButtons();
        return;
      }
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      if (!canPrimeLaunch(slot)) {
        return;
      }
      const prepared = window.BalloroRoundTapes?.enabled
        ? await window.BalloroRoundTapes.prepare(slot)
        : prepareLaunchRound(slot);
      if (!prepared || !canPrimeLaunch(slot)) {
        return;
      }
      try { action.setPointerCapture?.(event.pointerId); } catch (_) { /* pointer may already be released */ }
      state.launchButtonPrimed = true;
      action.classList.add("is-pressed");
      render();
      startLaunchPrimeAnimation();
    });
    const endV3Hold = () => {
      stopHeldPaidLaunches();
      playControls?.release();
      updateBetButtons();
    };
    action.addEventListener("pointerup", () => {
      if (window.BalloroBonusUI?.isV3) return endV3Hold();
      launchPuck(slot);
    });
    action.addEventListener("pointercancel", () => {
      if (window.BalloroBonusUI?.isV3) { fundingContact = false; return endV3Hold(); }
      launchPuck(slot);
    });
    action.addEventListener("lostpointercapture", () => {
      if (window.BalloroBonusUI?.isV3) endV3Hold();
      else stopLaunchPrimeAnimation({ rerender: false });
    });
    action.addEventListener("click", (event) => {
      if (window.BalloroBonusUI?.isV3) {
        if (event.detail !== 0) {
          if (fundingContact && !state.autoPlay && !playControls?.pause.active && !isV3BonusLaunchBlocked()) {
            requirePaidLaunchBalance(parseBet(slot));
          }
          fundingContact = false;
          return;
        }
        if (playControls?.pause.active) { tryResumeBigWin(); return; }
        if (state.autoPlay) return;
        if (!isV3BonusLaunchBlocked() && !requirePaidLaunchBalance(parseBet(slot))) return;
        launchV3Pucks(slot);
        return;
      }
      launchPuck(slot);
    });
  });

  els.puckCountButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.running || state.launchPrepared) {
        return;
      }
      const nextPuckCount = Number.parseInt(button.dataset.puckCount, 10);
      if (window.BalloroBonusUI?.isV3 && nextPuckCount !== 1) return;
      if (window.BalloroBonusUI?.isV2 && !window.BalloroPocketExperiment && nextPuckCount !== 1) return;
      const puckCountChanged = nextPuckCount !== state.puckCount;
      state.puckCount = nextPuckCount;
      els.puckCountButtons.forEach((item) => item.classList.toggle("active", item === button));
      if (puckCountChanged) {
        if (window.BalloroPocketExperiment) resetV2BonusProgressForLineChange();
        else resetDiamondBoostAfterPuckCountChange();
      } else {
        updateCrownCounter();
      }
      updateBetButtons();
      render();
    });
  });

  els.autoPlayToggle.addEventListener("click", () => {
    if (state.autoPlay) { stopControlledAuto('user'); updateSlotUi(); }
    else showSlotDialog("autoDialog");
  });

  els.gridSizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.running || state.launchPrepared) {
        return;
      }
      const nextGridSize = Number.parseInt(button.dataset.gridSize, 10);
      if (nextGridSize !== GRID_SIZE) {
        resetV2BonusProgressForLineChange();
        state.lineMaximumNotice = nextGridSize;
      }
      GRID_SIZE = nextGridSize;
      state.riskLevel = window.PuckLuckMath?.riskForLines(GRID_SIZE) || "normal";
      setupCanvas();
      resetPucks();
      prepareV3StaticField();
      updateBetButtons();
      render();
    });
  });

}

function setupInteractions() {
  els.layoutModeButton?.addEventListener("click", cycleLayoutMode);
  els.versionButtons.forEach((button) => button.addEventListener("click", () => {
    if (button.disabled || state.running || state.autoPlay) return;
    const version = button.dataset.bonusUiVersion;
    if (!["v2", "v3", "v4"].includes(version) || version === window.BalloroBonusUI?.version) return;
    const url = new URL(window.location.href);
    url.searchParams.set("bonusUI", version);
    if (version === "v4") {
      url.searchParams.set("pocketExperiment", "1");
      url.searchParams.delete("recordedRounds");
    }
    window.location.assign(url.toString());
  }));
  const toggleTodayWinners = () => {
    state.purpleLeaderboardExpanded = !state.purpleLeaderboardExpanded;
    updatePurpleLeaderboardExpansion();
  };
  els.purpleLeaderboardPanel?.addEventListener("click", toggleTodayWinners);
  els.purpleLeaderboardPanel?.addEventListener("keydown", (event) => {
    if (event.target !== els.purpleLeaderboardPanel || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    toggleTodayWinners();
  });
  els.closeLayoutDevPanel?.addEventListener("click", () => els.layoutDevPanel.classList.add("hidden"));
  els.runLayoutTest100?.addEventListener("click", () => runLockedGameplayTests(100));
  els.runLayoutTest1000?.addEventListener("click", () => runLockedGameplayTests(1000));
  els.exportLayoutTest?.addEventListener("click", exportGameplayTestCsv);

  document.addEventListener("keydown", (event) => {
    if (window.BalloroGameEntry?.blocked) return;
    if (event.altKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      cycleLayoutMode();
    }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      els.layoutDevPanel?.classList.toggle("hidden");
    }
  });

  els.menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showSlotDialog("settingsDialog");
  });

  els.soundButton.addEventListener("click", () => {
    setAllAudioEnabled(!isAnyAudioEnabled());
  });

  els.menuSoundToggle.addEventListener("change", () => {
    setSoundEffectsEnabled(els.menuSoundToggle.checked);
  });

  els.menuMusicToggle.addEventListener("change", () => {
    setMusicEnabled(els.menuMusicToggle.checked);
  });



  els.menuAvatarButton.addEventListener("click", () => openPopup(els.avatarPopup));
  els.menuLanguageButton.addEventListener("click", () => openPopup(els.languagePopup));
  els.menuRulesButton.addEventListener("click", () => openPopup(els.rulesScreen));
  document.addEventListener("pointerdown", ensureBackgroundMusicAfterGesture, { once: true, passive: true });
  els.closeRulesButton.addEventListener("click", () => closePopup(els.rulesScreen));
  els.closeLanguageButton.addEventListener("click", () => closePopup(els.languagePopup));
  els.closeAvatarButton.addEventListener("click", () => closePopup(els.avatarPopup));
  els.confirmTopUpButton.addEventListener("click", () => {
    const amount = Number.parseFloat(els.topUpAmount.value);
    if (Number.isFinite(amount) && amount > 0) {
      state.bankroll += amount;
      updateBank();
      updateBetButtons();
    }
    closePopup(els.topUpPopup);
  });
  els.cancelTopUpButton.addEventListener("click", () => closePopup(els.topUpPopup));

  document.querySelectorAll(".language-options button").forEach((button) => {
    button.addEventListener("click", () => {
      applyLocalization(button.dataset.lang);
      closePopup(els.languagePopup);
    });
  });

  els.historyToggle.addEventListener("click", () => {
    state.historyExpanded = !state.historyExpanded;
    els.historyPanel.classList.toggle("expanded", state.historyExpanded);
    els.historyToggle.setAttribute("aria-expanded", String(state.historyExpanded));
  });

  window.addEventListener("resize", handleGameViewportResize);
}

function renderInitialFrame() {
  fitBrandTitle();
  fitLocalizedUiText();
  setupCanvas();
  render();
  document.fonts?.ready.then(() => {
    fitBrandTitle();
    fitLocalizedUiText();
  });
  requestAnimationFrame(() => {
    fitBrandTitle();
    fitLocalizedUiText();
    setupCanvas();
    render();
  });
}

function init() {
  loadV2BonusProgress();
  setupSlotUi();
  if (typeof setupDesktopUi === 'function') setupDesktopUi();
  setupPlayerPanels();
  setupPlayControls();
  setupCanvas();
  resetPucks();
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const browserLanguage = (navigator.language || "en").slice(0, 2).toLowerCase();
  const initialLanguage = TRANSLATIONS[storedLanguage] ? storedLanguage : TRANSLATIONS[browserLanguage] ? browserLanguage : "en";
  const soundEffectsEnabled = window.localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY) !== "0";
  const musicEnabled = window.localStorage.getItem(MUSIC_STORAGE_KEY) !== "0";
  setSoundEffectsEnabled(soundEffectsEnabled, false);
  document.body.classList.remove("effects-disabled");
  startCollectibleIdleAnimation();
  setMusicEnabled(musicEnabled, false, false);
  applyLocalization(initialLanguage, false);
  renderAvatars();
  syncAvatar();
  renderHistory();
  loadTodayWins();
  renderPurpleLeaderboard();
  updatePurpleLeaderboardExpansion();
  setupBetControls();
  setupInteractions();
  prepareV3StaticField();
  updateBetButtons();
  updateLayoutModeButton();
  renderInitialFrame();
  window.BalloroGameEntry.onPlay(() => {
    renderInitialFrame();
    startCollectibleIdleAnimation();
    ensureBackgroundMusicAfterGesture();
  });
  const loadingTasks = [
    document.fonts?.ready || Promise.resolve(),
    document.readyState === "complete" ? Promise.resolve() : new Promise(resolve => window.addEventListener("load", resolve, { once: true })),
    window.BalloroSavedPaths?.enabled ? window.BalloroSavedPaths.load(GRID_SIZE) : Promise.resolve()
  ];
  let loadedTasks = 0;
  Promise.all(loadingTasks.map(task => task.then(() => {
    window.BalloroGameEntry.progress(++loadedTasks / loadingTasks.length);
  }))).then(() => {
    prepareV3StaticField();
    if (window.BalloroBonusUI?.isV3 && !state.roundOutcome) throw new Error('Initial field is unavailable');
    renderInitialFrame();
    window.BalloroGameEntry.ready();
  }).catch(error => {
    console.error('Game loading failed', error);
    window.BalloroGameEntry.fail();
  });
}

init();
