/*
 * DOM rendering and event wiring. All text is inserted with textContent.
 */
(function () {
  "use strict";

  const ACB = window.ACB;
  const story = ACB.story;
  const game = ACB.game;
  const config = ACB.config;
  const T = config.text;
  const fmt = ACB.format;
  const items = game.itemIndex(story);

  const $ = function (id) { return document.getElementById(id); };
  const SCREENS = ["title", "opening", "preview", "log", "decision", "ending"];

  // The preview build ships a story.js with no calls (see scripts/build-preview.js).
  const isPreview = config.edition === "preview" || story.calls.length === 0;
  const firstCall = story.calls.length ? story.calls[0].id : null;

  let state = game.createState(load());
  let activeCall = firstCall;

  /* ---------- storage (local only, never sent anywhere) ---------- */

  function load() {
    try {
      const raw = window.localStorage.getItem(config.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null; // Private mode or blocked storage: play without saving.
    }
  }

  function save() {
    try {
      window.localStorage.setItem(config.storageKey, JSON.stringify(game.toSaved(state)));
    } catch (e) { /* ignore */ }
  }

  function clearSave() {
    try { window.localStorage.removeItem(config.storageKey); } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function show(screen) {
    state = game.goTo(state, screen);
    SCREENS.forEach(function (name) { $("screen-" + name).hidden = name !== screen; });
    render();
    const heading = $("screen-" + screen).querySelector("h1, h2");
    if (heading) heading.focus();
    window.scrollTo(0, 0);
  }

  function shortLabel(id) {
    const item = items[id];
    const callNo = callLabel(item.callId);
    // Kept short so two selections fit on one or two lines of the docked bar on a phone.
    const text = item.text.length > 28 ? item.text.slice(0, 26) + "…" : item.text;
    return item.kind === "meta" ? callNo + " · " + item.label : callNo + " · " + item.label + ": “" + text + "”";
  }

  function callLabel(callId) {
    return fmt(T.callLabel, { number: story.calls.findIndex(function (call) { return call.id === callId; }) + 1 });
  }

  // Progress saved by the full game must not open the (empty) call log in the preview.
  function canResume() {
    return !isPreview && game.hasProgress(state);
  }

  /* ---------- renderers ---------- */

  function renderTitle() {
    document.title = config.title;
    $("title-heading").textContent = config.title;
    $("title-tagline").textContent = T.tagline;
    $("title-note").textContent = T.contentNote;
    const resume = canResume();
    $("title-start").textContent = resume ? T.resumeButton : T.startButton;
    $("title-restart").textContent = T.restart;
    $("title-restart").hidden = !resume;
  }

  function renderOpening() {
    $("opening-heading").textContent = story.opening.heading;
    const list = $("opening-lines");
    // Append only new lines so the live region reads the next line, not the whole call again.
    if (list.children.length > state.openingStep) list.replaceChildren();
    const previousLength = list.children.length;
    story.opening.lines.slice(list.children.length, state.openingStep).forEach(function (line) {
      list.appendChild(transcriptLine(line.speaker, line.text));
    });
    $("opening-next").textContent = game.openingDone(story, state) ? T.toLogButton : T.continueButton;
    if (list.children.length > previousLength) $("opening-next").scrollIntoView({ block: "nearest" });
  }

  function transcriptLine(speaker, text) {
    const li = el("li", speaker ? "line" : "line narration");
    if (speaker) li.appendChild(el("span", "speaker", speaker));
    li.appendChild(el("span", "text", text));
    return li;
  }

  function renderPreview() {
    $("preview-heading").textContent = T.previewHeading;
    const storeUrl = typeof config.storeUrl === "string" && (config.storeUrl === "https://tnnetwork.gumroad.com/l/wouyw" || /^https:\/\/[^\s]+$/i.test(config.storeUrl))
      ? config.storeUrl : "";
    $("preview-text").textContent = fmt(T.previewEnd, { price: config.price })
      + (storeUrl ? "" : " " + T.previewNext);
    const buy = $("preview-buy");
    buy.hidden = !storeUrl;
    if (storeUrl) {
      buy.href = storeUrl;
      buy.textContent = fmt(T.previewBuy, { price: config.price });
    }
    $("preview-replay").textContent = T.previewReplay;
  }

  function renderLog() {
    $("log-heading").textContent = T.logHeading;
    $("log-tabs").setAttribute("aria-label", T.recordedCallsLabel);
    $("log-help").textContent = T.logHelp;
    $("log-progress").textContent = fmt(T.progress, { found: state.found.length, total: story.contradictions.length });
    renderTabs();
    renderCall();
    renderFacts();
    renderSelection();
    const done = game.allFound(story, state);
    $("log-compare").textContent = T.compareButton;
    $("log-compare").hidden = done;
    $("log-hint").textContent = T.hintButton;
    $("log-hint").hidden = done;
    $("log-decide").textContent = T.decideButton;
    $("log-decide").hidden = !done;
  }

  function renderTabs() {
    const tabs = $("log-tabs");
    tabs.replaceChildren();
    story.calls.forEach(function (call) {
      const tab = el("button", "tab", callLabel(call.id));
      tab.type = "button";
      tab.id = "tab-" + call.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "log-panel");
      const active = call.id === activeCall;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.dataset.call = call.id;
      tabs.appendChild(tab);
    });
    $("log-panel").setAttribute("aria-labelledby", "tab-" + activeCall);
  }

  function renderCall() {
    const call = story.calls.find(function (c) { return c.id === activeCall; });
    const panel = $("log-panel");
    panel.replaceChildren();
    panel.appendChild(el("h3", "", call.title));

    const columns = el("div", "call-grid");
    const record = el("section", "call-group");
    record.appendChild(el("h4", "group-label", T.callRecordHeading));
    const meta = el("ul", "items meta");
    call.meta.forEach(function (m) { meta.appendChild(itemButton(m.id, m.label, m.text)); });
    record.appendChild(meta);
    columns.appendChild(record);

    const recording = el("section", "call-group");
    recording.appendChild(el("h4", "group-label", T.recordingHeading));
    const lines = el("ul", "items transcript");
    call.lines.forEach(function (l) { lines.appendChild(itemButton(l.id, l.speaker, l.text)); });
    recording.appendChild(lines);
    columns.appendChild(recording);
    panel.appendChild(columns);
  }

  function itemButton(id, label, text) {
    const li = el("li");
    const btn = el("button", "item");
    btn.type = "button";
    btn.dataset.item = id;
    btn.setAttribute("aria-pressed", String(state.selected.includes(id)));
    btn.appendChild(el("span", "speaker", label));
    btn.appendChild(el("span", "text", text));
    li.appendChild(btn);
    return li;
  }

  function renderFacts() {
    $("facts-heading").textContent = T.factsHeading;
    const list = $("facts-list");
    list.replaceChildren();
    if (state.found.length === 0) {
      list.appendChild(el("li", "muted", T.factsEmpty));
      return;
    }
    story.contradictions.filter(function (c) { return state.found.includes(c.id); }).forEach(function (c) {
      const li = el("li");
      li.appendChild(el("strong", "", c.title));
      li.appendChild(el("span", "", " — " + c.fact));
      list.appendChild(li);
    });
  }

  function renderSelection() {
    const sel = state.selected;
    let text = T.selectedNone;
    if (sel.length === 1) text = fmt(T.selectedOne, { a: shortLabel(sel[0]) });
    if (sel.length === 2) text = fmt(T.selectedTwo, { a: shortLabel(sel[0]), b: shortLabel(sel[1]) });
    $("log-selection").textContent = text;
  }

  function feedback(text) {
    const box = $("log-feedback");
    box.textContent = text;
    box.scrollTop = 0;
  }

  function renderDecision() {
    $("decision-heading").textContent = story.decision.heading;
    $("decision-prompt").textContent = story.decision.prompt;
    const box = $("decision-choices");
    box.replaceChildren();
    story.decision.choices.forEach(function (choice) {
      const btn = el("button", "choice", choice.text);
      btn.type = "button";
      btn.dataset.choice = choice.id;
      box.appendChild(btn);
    });
  }

  function renderEnding() {
    const ending = story.endings.find(function (e) { return e.id === state.currentEnding; });
    if (!ending) return;
    $("ending-title").textContent = ending.title;
    $("ending-counter").textContent = fmt(T.endingCounter, { number: ending.number, kind: ending.kind });
    const body = $("ending-body");
    body.replaceChildren();
    ending.paragraphs.forEach(function (p) { body.appendChild(el("p", "", p)); });
    $("ending-why-heading").textContent = T.whyHeading;
    $("ending-why").textContent = ending.lesson;
    $("ending-seen").textContent = fmt(T.endingsSeen, { seen: state.endingsSeen.length });
    $("ending-again").textContent = T.chooseAgain;
    $("ending-restart").textContent = T.restart;
  }

  function render() {
    ({
      title: renderTitle,
      opening: renderOpening,
      preview: renderPreview,
      log: renderLog,
      decision: renderDecision,
      ending: renderEnding
    })[state.screen]();
  }

  /* ---------- events ---------- */

  function restart() {
    clearSave();
    state = game.createState(null);
    activeCall = firstCall;
    feedback("");
    show("title");
  }

  $("title-start").addEventListener("click", function () {
    if (canResume()) {
      show(game.allFound(story, state) ? "decision" : "log");
    } else {
      show("opening");
      state = game.advanceOpening(story, state);
      renderOpening();
    }
  });

  $("title-restart").addEventListener("click", restart);

  $("opening-next").addEventListener("click", function () {
    if (game.openingDone(story, state)) {
      show(isPreview ? "preview" : "log");
      return;
    }
    state = game.advanceOpening(story, state);
    renderOpening();
  });

  $("preview-replay").addEventListener("click", function () {
    state = Object.assign({}, state, { openingStep: 0 });
    show("opening");
    state = game.advanceOpening(story, state);
    renderOpening();
  });

  $("log-tabs").addEventListener("click", function (event) {
    const tab = event.target.closest("[data-call]");
    if (!tab) return;
    activeCall = tab.dataset.call;
    feedback("");
    renderLog();
    $("tab-" + activeCall).focus();
  });

  // Arrow keys move between tabs (standard tablist keyboard pattern).
  $("log-tabs").addEventListener("keydown", function (event) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const ids = story.calls.map(function (c) { return c.id; });
    const step = event.key === "ArrowRight" ? 1 : -1;
    activeCall = ids[(ids.indexOf(activeCall) + step + ids.length) % ids.length];
    feedback("");
    renderLog();
    $("tab-" + activeCall).focus();
    event.preventDefault();
  });

  $("log-panel").addEventListener("click", function (event) {
    const btn = event.target.closest("[data-item]");
    if (!btn) return;
    state = game.toggleSelect(state, btn.dataset.item);
    feedback("");
    renderLog();
    const again = $("log-panel").querySelector('[data-item="' + btn.dataset.item + '"]');
    if (again) again.focus();
  });

  $("log-compare").addEventListener("click", function () {
    const out = game.compareSelected(story, state);
    state = out.state;
    const r = out.result;
    const messages = {
      "need-two": T.needTwo,
      "found": r.contradiction ? fmt(T.found, { title: r.contradiction.title }) : "",
      "already": T.alreadyFound,
      "mismatch-warm": T.mismatchWarm,
      "mismatch-cold": T.mismatchCold
    };
    save();
    renderLog();
    feedback(messages[r.type]);
    if (game.allFound(story, state)) $("log-decide").focus();
  });

  $("log-hint").addEventListener("click", function () {
    const out = game.nextHint(story, state, activeCall);
    state = out.state;
    save();
    feedback(out.text);
  });

  $("log-decide").addEventListener("click", function () { show("decision"); });

  $("decision-choices").addEventListener("click", function (event) {
    const btn = event.target.closest("[data-choice]");
    if (!btn) return;
    const out = game.choose(story, state, btn.dataset.choice);
    if (!out.ending) return;
    state = out.state;
    save();
    show("ending");
  });

  $("ending-again").addEventListener("click", function () { show("decision"); });
  $("ending-restart").addEventListener("click", restart);

  document.title = config.title;
  show("title");
})();
