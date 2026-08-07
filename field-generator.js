(function initBalloroFieldGenerator() {
  "use strict";

  const model = window.BalloroFieldGeneratorModel;
  const math = window.PuckLuckMath;
  const referenceConfiguration = window.BalloroFieldConfiguration1;
  const STORAGE_KEY = "balloro-x3000-field-generator-v1";
  const REMOTE_STORE_PATH = "api/field-generator-store";
  const bundledConfigurations = [
    window.BalloroFieldConfiguration1,
    window.BalloroFieldConfiguration2,
    window.BalloroFieldConfiguration3
  ].filter(Boolean);
  const STATE_CLASS_NAMES = ["state-empty", "state-low", "state-middle", "state-high", "state-ex-multi"];
  const STATE_MARKS = ["", "Н", "С", "В", "★"];
  const STATE_LABELS = [
    "пустая",
    "низкий множитель",
    "средний множитель",
    "высокий множитель",
    "EX MULTI со звездой"
  ];

  const els = {
    lineButtons: document.getElementById("lineButtons"),
    statePicker: document.getElementById("statePicker"),
    fieldGrid: document.getElementById("fieldGrid"),
    boardTitle: document.getElementById("boardTitle"),
    draftStatus: document.getElementById("draftStatus"),
    weightMeter: document.getElementById("weightMeter"),
    weightStatus: document.getElementById("weightStatus"),
    weightPoints: document.getElementById("weightPoints"),
    weightPercent: document.getElementById("weightPercent"),
    weightTrack: document.getElementById("weightTrack"),
    weightFill: document.getElementById("weightFill"),
    weightLegend: document.getElementById("weightLegend"),
    estimatedRtp: document.getElementById("estimatedRtp"),
    weightGeometry: document.getElementById("weightGeometry"),
    cellStats: document.getElementById("cellStats"),
    clearLineButton: document.getElementById("clearLineButton"),
    saveButton: document.getElementById("saveConfigurationButton"),
    loadButton: document.getElementById("loadConfigurationButton"),
    configurationNumber: document.getElementById("configurationNumber"),
    saveStatus: document.getElementById("saveStatus"),
    nextNumber: document.getElementById("nextNumber"),
    savedCount: document.getElementById("savedCount"),
    savedConfigurations: document.getElementById("savedConfigurations")
  };

  let storageAvailable = true;
  let store = readStore();
  let changedSinceSnapshot = false;
  let selectedCellState = 1;
  let activePaintPointerId = null;
  let paintStrokeChanged = false;
  let remoteSaveTimer = null;
  const pointFormatter = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const percentFormatter = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const geometryFormatter = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  function configurationSignature(snapshot) {
    return JSON.stringify(model.normalizeLayouts(snapshot?.layouts));
  }

  function nextFreeConfigurationId(configurations, startAt = 1) {
    const usedIds = new Set(configurations.map((snapshot) => snapshot.id));
    let id = Math.max(1, Number(startAt) || 1);
    while (usedIds.has(id)) id += 1;
    return id;
  }

  function ensureBundledConfigurations(sourceStore) {
    const normalized = model.normalizeStore(sourceStore);
    const configurations = normalized.configurations.map((snapshot) =>
      model.createSnapshot(snapshot.id, snapshot.layouts, snapshot.selectedLine, snapshot.createdAt));

    bundledConfigurations.forEach((configuration) => {
      const bundledSignature = configurationSignature(configuration);
      const exactMatch = configurations.find((snapshot) =>
        snapshot.id === configuration.id && configurationSignature(snapshot) === bundledSignature);
      if (exactMatch) return;

      const conflictingIndex = configurations.findIndex((snapshot) => snapshot.id === configuration.id);
      if (conflictingIndex >= 0) {
        const conflicting = configurations[conflictingIndex];
        const reassignedId = nextFreeConfigurationId(configurations, normalized.nextId);
        configurations[conflictingIndex] = model.createSnapshot(
          reassignedId,
          conflicting.layouts,
          conflicting.selectedLine,
          conflicting.createdAt
        );
      }
      configurations.push(model.createSnapshot(
        configuration.id,
        configuration.layouts,
        configuration.selectedLine,
        ""
      ));
    });

    configurations.sort((first, second) => first.id - second.id);
    const highestId = configurations.reduce((max, snapshot) => Math.max(max, snapshot.id), 0);
    return model.normalizeStore({
      ...normalized,
      configurations,
      nextId: Math.max(normalized.nextId, highestId + 1)
    });
  }

  function mergeConfigurationStores(remoteStore, localStore) {
    const remote = model.normalizeStore(remoteStore);
    const local = model.normalizeStore(localStore);
    const configurations = remote.configurations.map((snapshot) =>
      model.createSnapshot(snapshot.id, snapshot.layouts, snapshot.selectedLine, snapshot.createdAt));

    local.configurations.forEach((snapshot) => {
      const sameIdIndex = configurations.findIndex((candidate) => candidate.id === snapshot.id);
      if (sameIdIndex < 0) {
        configurations.push(model.createSnapshot(
          snapshot.id,
          snapshot.layouts,
          snapshot.selectedLine,
          snapshot.createdAt
        ));
        return;
      }
      if (configurationSignature(configurations[sameIdIndex]) === configurationSignature(snapshot)) return;
      const reassignedId = nextFreeConfigurationId(
        configurations,
        Math.max(remote.nextId, local.nextId)
      );
      configurations.push(model.createSnapshot(
        reassignedId,
        snapshot.layouts,
        snapshot.selectedLine,
        snapshot.createdAt
      ));
    });

    return ensureBundledConfigurations({
      ...local,
      configurations,
      nextId: Math.max(remote.nextId, local.nextId)
    });
  }

  function readStore() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return ensureBundledConfigurations(model.normalizeStore(raw ? JSON.parse(raw) : null));
    } catch (_error) {
      storageAvailable = false;
      return ensureBundledConfigurations(model.normalizeStore(null));
    }
  }

  function persistLocalStore() {
    if (!storageAvailable) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch (_error) {
      storageAvailable = false;
      return false;
    }
  }

  function canUseRemoteStore() {
    const isHttp = window.location.protocol === "http:" || window.location.protocol === "https:";
    return isHttp && !window.location.hostname.endsWith(".github.io");
  }

  async function persistRemoteStore() {
    if (!canUseRemoteStore()) return false;
    if (remoteSaveTimer !== null) {
      window.clearTimeout(remoteSaveTimer);
      remoteSaveTimer = null;
    }
    try {
      const response = await window.fetch(REMOTE_STORE_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store)
      });
      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  function scheduleRemotePersist() {
    if (!canUseRemoteStore()) return;
    if (remoteSaveTimer !== null) window.clearTimeout(remoteSaveTimer);
    remoteSaveTimer = window.setTimeout(() => {
      remoteSaveTimer = null;
      void persistRemoteStore();
    }, 250);
  }

  function persistStore() {
    const localSaved = persistLocalStore();
    scheduleRemotePersist();
    return localSaved;
  }

  async function restoreDurableStore() {
    if (!canUseRemoteStore()) return false;
    try {
      const response = await window.fetch(REMOTE_STORE_PATH, { cache: "no-store" });
      if (!response.ok) return false;
      store = mergeConfigurationStores(await response.json(), store);
      persistLocalStore();
      renderAll();
      const saved = await persistRemoteStore();
      if (saved) setStatus(`Постоянная память: ${store.configurations.length} конфигурации`);
      return saved;
    } catch (_error) {
      return false;
    }
  }

  function setStatus(message, isError = false) {
    els.saveStatus.textContent = message;
    els.saveStatus.classList.toggle("error", isError);
  }

  function markChanged() {
    changedSinceSnapshot = true;
    els.draftStatus.textContent = "ИЗМЕНЕНО";
    els.draftStatus.classList.add("changed");
  }

  function markLoaded(label = "ЧЕРНОВИК") {
    changedSinceSnapshot = false;
    els.draftStatus.textContent = label;
    els.draftStatus.classList.remove("changed");
  }

  function configuredCellCount(lines) {
    return store.layouts[lines].filter((state) => state !== 0).length;
  }

  function renderLineButtons() {
    els.lineButtons.replaceChildren();
    model.LINE_COUNTS.forEach((lines) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "line-button";
      button.dataset.lines = String(lines);
      button.textContent = String(lines);
      button.classList.toggle("active", lines === store.selectedLine);
      button.classList.toggle("has-cells", configuredCellCount(lines) > 0);
      button.setAttribute("aria-pressed", String(lines === store.selectedLine));
      button.setAttribute("aria-label", `${lines} линий`);
      els.lineButtons.append(button);
    });
  }

  function renderStatePicker() {
    els.statePicker.querySelectorAll("button[data-state]").forEach((button) => {
      const state = Number(button.dataset.state);
      const active = state === selectedCellState;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `Выбрать: ${STATE_LABELS[state]}`);
      button.title = STATE_LABELS[state];
    });
  }

  function getWeightBudget(lines = store.selectedLine) {
    const config = math.getConfiguration(
      math.riskForLines(lines),
      lines,
      1,
      math.CONFIGURATOR_LAYOUT_MODE
    );
    return model.calculateWeightBudget({
      cells: store.layouts[lines],
      referenceCells: referenceConfiguration.layouts[lines],
      lines,
      multipliers: {
        low: config.multiplier_table.outer,
        middle: config.multiplier_table.middle,
        high: config.multiplier_table.center
      },
      puckRadius: config.puck_radius,
      multiPlusProbability: config.multi_plus.probability,
      targetRtp: math.TARGET_RTP
    });
  }

  function updateCellAppearance(cell, state, index, budget = getWeightBudget()) {
    STATE_CLASS_NAMES.forEach((className) => cell.classList.remove(className));
    cell.classList.add(STATE_CLASS_NAMES[state]);
    cell.dataset.state = String(state);
    const weight = budget.weightsByState[state];
    const weightLabel = state === 0 ? "" : `, вес ${pointFormatter.format(weight)} очка`;
    cell.setAttribute("aria-label", `Ячейка ${index + 1}: ${STATE_LABELS[state]}${weightLabel}`);
    cell.title = `${STATE_LABELS[state]}${weightLabel}`;
    const mark = cell.querySelector(".cell-mark");
    if (mark) mark.textContent = STATE_MARKS[state];
  }

  function renderMergedCells() {
    els.fieldGrid.querySelectorAll(".merged-cell-overlay").forEach((overlay) => overlay.remove());
    const lines = store.selectedLine;
    const blocks = model.findMergedBlocks(store.layouts[lines], lines);
    blocks.forEach((block) => {
      const overlay = document.createElement("div");
      overlay.className = `merged-cell-overlay ${STATE_CLASS_NAMES[block.state]}`;
      overlay.dataset.state = String(block.state);
      overlay.dataset.indexes = block.indexes.join(",");
      overlay.style.gridRow = `${block.row + 1} / span 2`;
      overlay.style.gridColumn = `${block.column + 1} / span 2`;
      overlay.setAttribute("aria-hidden", "true");
      const mark = document.createElement("span");
      mark.className = "cell-mark";
      mark.textContent = STATE_MARKS[block.state];
      overlay.append(mark);
      els.fieldGrid.append(overlay);
    });
  }

  function renderGrid() {
    const lines = store.selectedLine;
    const cells = store.layouts[lines];
    const budget = getWeightBudget(lines);
    els.fieldGrid.style.setProperty("--lines", lines);
    els.fieldGrid.setAttribute("aria-rowcount", String(lines));
    els.fieldGrid.setAttribute("aria-colcount", String(lines));
    els.fieldGrid.replaceChildren();
    cells.forEach((state, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "field-cell";
      cell.dataset.index = String(index);
      cell.style.gridRow = String(Math.floor(index / lines) + 1);
      cell.style.gridColumn = String((index % lines) + 1);
      cell.setAttribute("role", "gridcell");
      const mark = document.createElement("span");
      mark.className = "cell-mark";
      mark.setAttribute("aria-hidden", "true");
      cell.append(mark);
      updateCellAppearance(cell, state, index, budget);
      els.fieldGrid.append(cell);
    });
    renderMergedCells();
    els.boardTitle.textContent = `Поле ${lines} линий`;
    renderStats();
  }

  function renderStats() {
    const counts = model.countStates(store.layouts[store.selectedLine]);
    const items = [
      ["ПУСТЫЕ", counts.empty],
      ["НИЗКИЕ", counts.low],
      ["СРЕДНИЕ", counts.middle],
      ["ВЫСОКИЕ", counts.high],
      ["EX MULTI", counts.ex_multi]
    ];
    els.cellStats.replaceChildren(...items.map(([label, value]) => {
      const item = document.createElement("span");
      item.className = "stat-item";
      item.append(`${label} `);
      const strong = document.createElement("strong");
      strong.textContent = String(value);
      item.append(strong);
      return item;
    }));
    renderWeightMeter(getWeightBudget());
  }

  function renderWeightMeter(budget) {
    const cappedPercent = Math.max(0, Math.min(100, budget.percent));
    const levelLabels = {
      green: "НИЖЕ ЦЕЛИ",
      yellow: "РАБОЧАЯ ЗОНА",
      red: "ПЕРЕБОР"
    };
    els.weightMeter.dataset.level = budget.level;
    els.weightStatus.textContent = levelLabels[budget.level];
    els.weightPoints.textContent = `${pointFormatter.format(budget.usedPoints)} / ${pointFormatter.format(budget.limitPoints)} ОЧКОВ`;
    els.weightPercent.textContent = `${percentFormatter.format(budget.percent)}%`;
    els.weightFill.style.width = `${cappedPercent}%`;
    els.weightTrack.setAttribute("aria-valuenow", String(Math.round(cappedPercent)));
    els.weightTrack.setAttribute("aria-valuetext", `${percentFormatter.format(budget.percent)} процента от лимита`);
    els.estimatedRtp.textContent = `ОЦЕНКА RTP ≈ ${percentFormatter.format(budget.estimatedRtp * 100)}%`;
    els.weightGeometry.textContent = `КЛЕТКА ${geometryFormatter.format(budget.cellSize)} · ШАР Ø${geometryFormatter.format(budget.puckDiameter)}`;

    const legendItems = [
      { state: 1, label: "НИЗКИЙ", swatch: "low" },
      { state: 2, label: "СРЕДНИЙ", swatch: "middle" },
      { state: 3, label: "ВЫСОКИЙ", swatch: "high" },
      { state: 4, label: "EX MULTI", swatch: "ex-multi" }
    ];
    els.weightLegend.replaceChildren(...legendItems.map(({ state, label, swatch }) => {
      const item = document.createElement("span");
      item.className = "weight-legend-item";
      const marker = document.createElement("i");
      marker.className = `swatch ${swatch}`;
      marker.setAttribute("aria-hidden", "true");
      if (state === 4) marker.textContent = "★";
      const text = document.createElement("span");
      text.textContent = label;
      const value = document.createElement("strong");
      value.textContent = `+${pointFormatter.format(budget.weightsByState[state])}`;
      item.append(marker, text, value);
      return item;
    }));
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function snapshotSummary(snapshot) {
    return model.LINE_COUNTS.map((lines) => `${lines}:${snapshot.layouts[lines].filter((state) => state !== 0).length}`).join("  ");
  }

  function configurationExport(snapshot) {
    return JSON.stringify({
      schema: "balloro-x3000-field-configuration",
      version: model.VERSION,
      id: snapshot.id,
      selectedLine: snapshot.selectedLine,
      layouts: snapshot.layouts
    });
  }

  async function copyConfiguration(id) {
    const snapshot = store.configurations.find((item) => item.id === id);
    if (!snapshot) {
      setStatus(`Конфигурация №${id} не найдена`, true);
      return false;
    }
    const text = configurationExport(snapshot);
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (_error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      textarea.remove();
    }
    setStatus(copied
      ? `Код конфигурации №${id} скопирован`
      : `Не удалось скопировать конфигурацию №${id}`, !copied);
    return copied;
  }

  function renderSavedConfigurations() {
    els.nextNumber.textContent = `СЛЕДУЮЩИЙ №${store.nextId}`;
    els.savedCount.textContent = String(store.configurations.length);
    els.savedConfigurations.replaceChildren();
    if (!store.configurations.length) {
      const empty = document.createElement("div");
      empty.className = "saved-empty";
      empty.textContent = "Нет сохраненных конфигураций";
      els.savedConfigurations.append(empty);
      return;
    }
    [...store.configurations].reverse().forEach((snapshot) => {
      const item = document.createElement("article");
      item.className = "saved-item";
      item.dataset.configurationId = String(snapshot.id);
      item.dataset.configuration = JSON.stringify(snapshot);
      const id = document.createElement("span");
      id.className = "saved-id";
      id.textContent = `№${snapshot.id}`;
      const meta = document.createElement("div");
      meta.className = "saved-meta";
      const title = document.createElement("strong");
      title.textContent = formatDate(snapshot.createdAt) || "Сохраненный комплект";
      const summary = document.createElement("span");
      summary.textContent = snapshotSummary(snapshot);
      meta.append(title, summary);
      const load = document.createElement("button");
      load.type = "button";
      load.className = "saved-load-button";
      load.dataset.loadId = String(snapshot.id);
      load.textContent = "ОТКРЫТЬ";
      load.setAttribute("aria-label", `Загрузить конфигурацию №${snapshot.id}`);
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "saved-copy-button";
      copy.dataset.copyId = String(snapshot.id);
      copy.textContent = "КОПИРОВАТЬ";
      copy.setAttribute("aria-label", `Скопировать код конфигурации №${snapshot.id}`);
      const actions = document.createElement("div");
      actions.className = "saved-action-buttons";
      actions.append(load, copy);
      item.append(id, meta, actions);
      els.savedConfigurations.append(item);
    });
  }

  function renderAll() {
    renderLineButtons();
    renderStatePicker();
    renderGrid();
    renderSavedConfigurations();
  }

  function applySelectedState(cell) {
    const index = Number(cell?.dataset.index);
    const cells = store.layouts[store.selectedLine];
    if (!Number.isInteger(index) || index < 0 || index >= cells.length) return false;
    if (cells[index] === selectedCellState) return false;
    cells[index] = selectedCellState;
    updateCellAppearance(cell, cells[index], index);
    renderMergedCells();
    markChanged();
    renderStats();
    return true;
  }

  function commitPaintChanges() {
    if (!paintStrokeChanged) return;
    paintStrokeChanged = false;
    persistStore();
    renderLineButtons();
  }

  function finishPaintStroke(event) {
    if (activePaintPointerId !== event.pointerId) return;
    activePaintPointerId = null;
    commitPaintChanges();
  }

  function loadConfiguration(id) {
    const snapshot = store.configurations.find((item) => item.id === id);
    if (!snapshot) {
      setStatus(`Конфигурация №${id} не найдена`, true);
      return false;
    }
    store.layouts = model.cloneLayouts(snapshot.layouts);
    store.selectedLine = snapshot.selectedLine;
    persistStore();
    markLoaded(`ЗАГРУЖЕНА №${id}`);
    els.configurationNumber.value = String(id);
    setStatus(`Конфигурация №${id} загружена`);
    renderAll();
    return true;
  }

  els.lineButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-lines]");
    if (!button) return;
    const lines = Number(button.dataset.lines);
    if (!model.LINE_COUNTS.includes(lines) || lines === store.selectedLine) return;
    store.selectedLine = lines;
    persistStore();
    renderAll();
  });

  els.statePicker.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-state]");
    if (!button) return;
    const state = Number(button.dataset.state);
    if (!Number.isInteger(state) || state < 0 || state >= model.CELL_STATES.length) return;
    selectedCellState = state;
    renderStatePicker();
  });

  els.fieldGrid.addEventListener("pointerdown", (event) => {
    if (activePaintPointerId !== null) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const cell = event.target.closest("button[data-index]");
    if (!cell) return;
    event.preventDefault();
    activePaintPointerId = event.pointerId;
    paintStrokeChanged = applySelectedState(cell);
    if (typeof els.fieldGrid.setPointerCapture === "function") {
      els.fieldGrid.setPointerCapture(event.pointerId);
    }
  });

  els.fieldGrid.addEventListener("pointermove", (event) => {
    if (activePaintPointerId !== event.pointerId) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target?.closest("button[data-index]");
    if (!cell || !els.fieldGrid.contains(cell)) return;
    paintStrokeChanged = applySelectedState(cell) || paintStrokeChanged;
  });

  els.fieldGrid.addEventListener("pointerup", finishPaintStroke);
  els.fieldGrid.addEventListener("pointercancel", finishPaintStroke);
  els.fieldGrid.addEventListener("lostpointercapture", finishPaintStroke);

  els.fieldGrid.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    const cell = event.target.closest("button[data-index]");
    if (!cell) return;
    paintStrokeChanged = applySelectedState(cell);
    commitPaintChanges();
  });

  els.clearLineButton.addEventListener("click", () => {
    store.layouts[store.selectedLine] = Array(store.selectedLine * store.selectedLine).fill(0);
    markChanged();
    persistStore();
    renderAll();
    setStatus(`Поле ${store.selectedLine} линий очищено`);
  });

  els.saveButton.addEventListener("click", async () => {
    const snapshot = model.createSnapshot(store.nextId, store.layouts, store.selectedLine);
    store.configurations.push(snapshot);
    store.nextId += 1;
    const localSaved = persistStore();
    const remoteSaved = await persistRemoteStore();
    const saved = localSaved || remoteSaved;
    els.configurationNumber.value = String(snapshot.id);
    markLoaded(`СОХРАНЕНА №${snapshot.id}`);
    setStatus(remoteSaved
      ? `Конфигурация №${snapshot.id} сохранена в постоянной памяти`
      : saved
        ? `Конфигурация №${snapshot.id} сохранена в браузере`
      : `Конфигурация №${snapshot.id} сохранена до закрытия страницы`, !saved);
    renderSavedConfigurations();
  });

  els.loadButton.addEventListener("click", () => {
    const id = Number(els.configurationNumber.value);
    if (!Number.isInteger(id) || id < 1) {
      setStatus("Введите номер конфигурации", true);
      return;
    }
    loadConfiguration(id);
  });

  els.configurationNumber.addEventListener("keydown", (event) => {
    if (event.key === "Enter") els.loadButton.click();
  });

  els.savedConfigurations.addEventListener("click", async (event) => {
    const loadButton = event.target.closest("button[data-load-id]");
    if (loadButton) {
      loadConfiguration(Number(loadButton.dataset.loadId));
      return;
    }
    const copyButton = event.target.closest("button[data-copy-id]");
    if (copyButton) await copyConfiguration(Number(copyButton.dataset.copyId));
  });

  window.BalloroFieldGenerator = Object.freeze({
    getConfiguration(id) {
      const snapshot = store.configurations.find((item) => item.id === Number(id));
      return snapshot ? model.createSnapshot(snapshot.id, snapshot.layouts, snapshot.selectedLine, snapshot.createdAt) : null;
    },
    listConfigurations() {
      return store.configurations.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        selectedLine: item.selectedLine,
        counts: Object.fromEntries(model.LINE_COUNTS.map((lines) =>
          [lines, model.countStates(item.layouts[lines])]))
      }));
    },
    exportConfiguration(id) {
      const snapshot = store.configurations.find((item) => item.id === Number(id));
      return snapshot ? configurationExport(snapshot) : null;
    },
    storageKey: STORAGE_KEY,
    remoteStorePath: REMOTE_STORE_PATH
  });

  if (!storageAvailable) setStatus("Локальное сохранение недоступно", true);
  if (!changedSinceSnapshot) markLoaded();
  renderAll();
  void restoreDurableStore();
})();
