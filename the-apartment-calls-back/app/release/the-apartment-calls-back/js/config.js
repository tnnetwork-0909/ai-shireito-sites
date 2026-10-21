/*
 * Settings and UI copy that are likely to change. Story text lives in story.js.
 */
(function (root) {
  "use strict";

  const config = {
    title: "The Apartment Calls Back",
    price: "$2",
    // Add the published HTTPS product page to show a purchase link in the free preview.
    storeUrl: "",
    // "full" = whole game. "preview" = stops after the free opening call.
    edition: "full",
    storageKey: "acb-progress-v1",

    text: {
      tagline: "A 20-minute phone horror. Three call recordings. Find where they lie.",
      contentNote: "Contains: suspense, a missing person. No gore.",
      startButton: "Answer the call",
      resumeButton: "Continue where you left off",
      continueButton: "Continue",
      toLogButton: "Open the call log",
      previewHeading: "End of the free opening",
      previewEnd: "That was the free opening. The full story — three call recordings, three contradictions, three endings — is {price}.",
      previewNext: "The full edition will be sold on Gumroad.",
      previewBuy: "Get the full edition — {price}",
      previewReplay: "Read the opening again",
      logHeading: "Call log — Apt 4B",
      recordedCallsLabel: "Recorded calls",
      logHelp: "Pick two items that can't both be true, then press Compare. Items can come from different calls.",
      callLabel: "Call {number}",
      callRecordHeading: "Call record",
      recordingHeading: "Recording",
      progress: "Contradictions found: {found} of {total}",
      selectedNone: "Nothing selected yet. Pick a line or a record detail.",
      selectedOne: "Selected: {a}. Pick one more.",
      selectedTwo: "Selected: {a} + {b}",
      compareButton: "Compare",
      hintButton: "Hint",
      decideButton: "Decide what to do",
      needTwo: "Pick two items first.",
      found: "Contradiction found: {title}.",
      alreadyFound: "You already found that one. Look for another.",
      // Never say "these don't conflict": some wrong pairs are odd in-story (e.g. "Just me" vs. two sets of feet).
      mismatchWarm: "Not the one the records prove — but one of those matters. Find what it really contradicts.",
      mismatchCold: "The records can't settle that one. Try a voice's claim against a call record.",
      factsHeading: "What you know",
      factsEmpty: "No contradictions yet. Each call has one.",
      endingCounter: "Ending {number} of 3 · {kind}",
      endingsSeen: "Endings seen: {seen} of 3",
      chooseAgain: "Choose again",
      restart: "Start over",
      whyHeading: "Why"
    }
  };

  /* Replaces {name} placeholders. Output is always set via textContent, never innerHTML. */
  function format(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values || {}, key) ? String(values[key]) : match;
    });
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { config: config, format: format };
  } else {
    root.ACB = root.ACB || {};
    root.ACB.config = config;
    root.ACB.format = format;
  }
})(typeof window !== "undefined" ? window : globalThis);
