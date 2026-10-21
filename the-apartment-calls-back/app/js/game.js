/*
 * Game rules with no DOM access. Every function returns a new state object
 * so ui.js can re-render from state and tests can run in Node.
 */
(function (root) {
  "use strict";

  const story = typeof module === "object" && module.exports ? require("./story.js") : root.ACB.story;

  function createState(saved) {
    const s = saved || {};
    const currentIds = new Set(story.contradictions.map(function (c) { return c.id; }));
    return {
      screen: "title",
      openingStep: 0,
      selected: [],
      found: Array.isArray(s.found) ? Array.from(new Set(s.found.filter(function (id) { return currentIds.has(id); }))) : [],
      hintLevels: s.hintLevels && typeof s.hintLevels === "object" ? Object.assign({}, s.hintLevels) : {},
      endingsSeen: Array.isArray(s.endingsSeen) ? s.endingsSeen.slice() : [],
      currentEnding: null
    };
  }

  /* Only progress worth keeping between sessions; selection and screen are transient. */
  function toSaved(state) {
    return { found: state.found, hintLevels: state.hintLevels, endingsSeen: state.endingsSeen };
  }

  function hasProgress(state) {
    return state.found.length > 0 || state.endingsSeen.length > 0;
  }

  function goTo(state, screen) {
    return Object.assign({}, state, { screen: screen, selected: [] });
  }

  function advanceOpening(story, state) {
    const last = story.opening.lines.length;
    return Object.assign({}, state, { openingStep: Math.min(state.openingStep + 1, last) });
  }

  function openingDone(story, state) {
    return state.openingStep >= story.opening.lines.length;
  }

  /* Map of every selectable item id -> item with its call, for labels and validation. */
  function itemIndex(story) {
    const index = {};
    story.calls.forEach(function (call) {
      call.meta.forEach(function (m) { index[m.id] = { id: m.id, callId: call.id, kind: "meta", label: m.label, text: m.text }; });
      call.lines.forEach(function (l) { index[l.id] = { id: l.id, callId: call.id, kind: "line", label: l.speaker, text: l.text }; });
    });
    return index;
  }

  /* Keeps at most two selections; picking a third drops the oldest. */
  function toggleSelect(state, itemId) {
    let selected = state.selected.slice();
    if (selected.includes(itemId)) {
      selected = selected.filter(function (id) { return id !== itemId; });
    } else {
      selected.push(itemId);
      if (selected.length > 2) selected.shift();
    }
    return Object.assign({}, state, { selected: selected });
  }

  function samePair(pair, a, b) {
    return (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a);
  }

  function findContradiction(story, a, b) {
    return story.contradictions.find(function (c) {
      return c.pairs.some(function (pair) { return samePair(pair, a, b); });
    }) || null;
  }

  /* Result types: need-two | found | already | mismatch-warm | mismatch-cold */
  function compareSelected(story, state) {
    if (state.selected.length !== 2) return { state: state, result: { type: "need-two" } };
    const a = state.selected[0];
    const b = state.selected[1];
    const match = findContradiction(story, a, b);
    if (match && state.found.includes(match.id)) {
      return { state: Object.assign({}, state, { selected: [] }), result: { type: "already", contradiction: match } };
    }
    if (match) {
      const next = Object.assign({}, state, { selected: [], found: state.found.concat(match.id) });
      return { state: next, result: { type: "found", contradiction: match } };
    }
    // "Warm" feedback when a selected item belongs to an unsolved contradiction keeps players from stalling.
    const warm = unfound(story, state).some(function (c) {
      return c.pairs.some(function (pair) { return pair.includes(a) || pair.includes(b); });
    });
    return { state: state, result: { type: warm ? "mismatch-warm" : "mismatch-cold" } };
  }

  function unfound(story, state) {
    return story.contradictions.filter(function (c) { return !state.found.includes(c.id); });
  }

  function allFound(story, state) {
    return unfound(story, state).length === 0;
  }

  /*
   * Hints escalate per contradiction: call -> line -> exact pair.
   * The last level stays available, so nobody can get permanently stuck.
   * activeCallId (optional) makes the hint follow the call the player is reading.
   */
  function nextHint(story, state, activeCallId) {
    const open = unfound(story, state);
    const inCall = open.find(function (c) { return c.pairs[0][0].split(".")[0] === activeCallId; });
    const target = inCall || open[0];
    if (!target) return { state: state, text: "" };
    const level = state.hintLevels[target.id] || 0;
    const shown = Math.min(level, target.hints.length - 1);
    const hintLevels = Object.assign({}, state.hintLevels);
    hintLevels[target.id] = Math.min(level + 1, target.hints.length);
    return { state: Object.assign({}, state, { hintLevels: hintLevels }), text: target.hints[shown] };
  }

  function choose(story, state, choiceId) {
    if (!allFound(story, state)) return { state: state, ending: null };
    const choice = story.decision.choices.find(function (c) { return c.id === choiceId; });
    if (!choice) return { state: state, ending: null };
    const ending = story.endings.find(function (e) { return e.id === choice.ending; });
    const endingsSeen = state.endingsSeen.includes(ending.id) ? state.endingsSeen : state.endingsSeen.concat(ending.id);
    return {
      state: Object.assign({}, state, { screen: "ending", currentEnding: ending.id, endingsSeen: endingsSeen }),
      ending: ending
    };
  }

  const api = {
    createState: createState,
    toSaved: toSaved,
    hasProgress: hasProgress,
    goTo: goTo,
    advanceOpening: advanceOpening,
    openingDone: openingDone,
    itemIndex: itemIndex,
    toggleSelect: toggleSelect,
    findContradiction: findContradiction,
    compareSelected: compareSelected,
    allFound: allFound,
    nextHint: nextHint,
    choose: choose
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ACB = root.ACB || {};
    root.ACB.game = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
