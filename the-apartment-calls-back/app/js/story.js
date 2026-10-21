/*
 * Story data: every line of text the player reads lives here.
 * Item ids ("c1.from", "c2.l2" ...) are referenced by contradictions,
 * so tests/story.test.js checks that every reference exists.
 */
(function (root) {
  "use strict";

  const story = {
    opening: {
      heading: "Sunday, 11:52 PM",
      lines: [
        { speaker: "", text: "Your phone lights up on the motel nightstand. Caller ID: HOME — APT 4B." },
        { speaker: "", text: "You live alone. You are three hours away. Nobody should be home." },
        { speaker: "You", text: "Hello?" },
        { speaker: "Caller", text: "Hey. It's me." },
        { speaker: "", text: "It's your voice. Not like your voice. Yours." },
        { speaker: "You", text: "Who is this?" },
        { speaker: "Caller", text: "It's me. I'm home. I got back early." },
        { speaker: "You", text: "I'm not home. I'm on a work trip." },
        { speaker: "Caller", text: "Jun's here too. Jun fed Biscuit. Jun stayed." },
        { speaker: "You", text: "Put Jun on." },
        { speaker: "Caller", text: "Jun can't find the door right now." },
        { speaker: "Caller", text: "Come home, Alex. It's warmer with everyone here." },
        { speaker: "", text: "Click. The dial tone is too low, like it's coming through a wall." },
        { speaker: "", text: "Jun was supposed to feed your cat on Saturday night and leave. Jun hasn't answered a text since 9:02 PM Saturday." },
        { speaker: "", text: "Your landline plan records every call on the line. There are three since you left." },
        { speaker: "", text: "Read them. Find where the call records and the voices disagree." }
      ]
    },

    calls: [
      {
        id: "c1",
        title: "Call 1 — Jun calls the super",
        meta: [
          { id: "c1.time", label: "Time", text: "Sat 9:10 PM" },
          { id: "c1.from", label: "Placed from", text: "Apt 4B landline — kitchen wall phone (corded)" },
          { id: "c1.to", label: "To", text: "Dale Hensley, building super — cell" },
          { id: "c1.answered", label: "Answered by", text: "Dale Hensley" },
          { id: "c1.length", label: "Length", text: "1 min 24 s" }
        ],
        lines: [
          { id: "c1.l1", speaker: "Dale", text: "Hensley." },
          { id: "c1.l2", speaker: "Jun", text: "Hi Dale, it's Jun — Alex's friend. I'm feeding the cat in 4B." },
          { id: "c1.l3", speaker: "Jun", text: "The radiator's knocking. In a rhythm. Three knocks, then a pause." },
          { id: "c1.l4", speaker: "Dale", text: "That radiator's been quiet since I fixed it in August." },
          { id: "c1.l5", speaker: "Jun", text: "Also, the deadbolt was open when I got here. Alex never leaves it open." },
          { id: "c1.l6", speaker: "Dale", text: "Wasn't me. I'm at my daughter's in Jersey till Sunday night." },
          { id: "c1.l7", speaker: "Jun", text: "Okay. I'm done anyway. I already locked up — I'm out in the hallway now." },
          { id: "c1.l8", speaker: "Jun", text: "Huh. The hallway's longer than I remember. And I can still hear the kitchen phone, right behind every door." },
          { id: "c1.l9", speaker: "Dale", text: "Say again? You're breaking up." }
        ]
      },
      {
        id: "c2",
        title: "Call 2 — The neighbor downstairs",
        meta: [
          { id: "c2.time", label: "Time", text: "Sat 11:48 PM" },
          { id: "c2.from", label: "Placed from", text: "Ruth Pell, Apt 3B (directly below 4B) — landline" },
          { id: "c2.to", label: "To", text: "Apt 4B landline" },
          { id: "c2.answered", label: "Answered by", text: "Answering machine — auto-pickup on ring 4. Handset never lifted." },
          { id: "c2.length", label: "Length", text: "2 min 05 s" }
        ],
        lines: [
          { id: "c2.l1", speaker: "Mrs. Pell", text: "Alex? Is someone up there? I hear walking. Back and forth, since nine." },
          { id: "c2.l2", speaker: "Voice on 4B (sounds like you)", text: "Hi, Mrs. Pell. It's me. I picked up — I'm right here by the phone." },
          { id: "c2.l3", speaker: "Mrs. Pell", text: "Your friend said you were away all weekend." },
          { id: "c2.l4", speaker: "Voice on 4B (sounds like you)", text: "I came home early." },
          { id: "c2.l5", speaker: "Mrs. Pell", text: "Then who's walking? It's two sets of feet, dear. One fast, one slow." },
          { id: "c2.l6", speaker: "Voice on 4B (sounds like you)", text: "Just me. Just me. Just me." },
          { id: "c2.l7", speaker: "Mrs. Pell", text: "And your radiator is knocking through my ceiling. Three, then a pause." },
          { id: "c2.l8", speaker: "Mrs. Pell", text: "It was like this with the Novaks, before you. A week of knocking. Then the phone company pulled their line — and Mr. Novak walked out the front door, thinking it was still Tuesday." },
          { id: "c2.l9", speaker: "Voice on 4B (sounds like you)", text: "Sorry, I can't come to the phone right now. Leave a message after the tone." },
          { id: "c2.l10", speaker: "Mrs. Pell", text: "…Alex?" }
        ]
      },
      {
        id: "c3",
        title: "Call 3 — A voicemail for Jun",
        meta: [
          { id: "c3.time", label: "Time", text: "Sun 8:30 AM" },
          { id: "c3.from", label: "Placed from", text: "Apt 4B landline — kitchen wall phone (corded)" },
          { id: "c3.to", label: "To", text: "Jun Park — cell" },
          { id: "c3.answered", label: "Answered by", text: "Jun's voicemail" },
          { id: "c3.length", label: "Length", text: "0 min 58 s" }
        ],
        lines: [
          { id: "c3.l1", speaker: "Voice (says it's Dale)", text: "Jun, it's Dale, the super. I'm standing outside 4B, calling on my cell." },
          { id: "c3.l2", speaker: "Voice (says it's Dale)", text: "The chain's on from the inside. Your sneakers are on the mat out here." },
          { id: "c3.l3", speaker: "Voice (says it's Dale)", text: "If you're in there, knock three times." },
          { id: "c3.l4", speaker: "Sound", text: "Three knocks. A pause." },
          { id: "c3.l5", speaker: "Voice (says it's Dale)", text: "Good. Stay where you are." },
          { id: "c3.l6", speaker: "Voice (says it's Dale)", text: "Alex will be home soon. Then we're all home." },
          { id: "c3.l7", speaker: "Sound", text: "Faint, behind the voice: a cat meowing." }
        ]
      }
    ],

    /*
     * Each contradiction accepts one or more pairs (order does not matter).
     * Extra pairs exist so players who reason a different, valid way are not blocked.
     * "endings" documents how the fact bears on each ending (also shown in docs/story-design.md).
     */
    contradictions: [
      {
        id: "x1",
        pairs: [["c1.l7", "c1.from"]],
        title: "Jun never left",
        fact: "Jun said they were out in the hallway — but the call came from the corded phone on your kitchen wall. Jun was still inside 4B, and believed they had left. Whoever goes into 4B now doesn't come back out.",
        hints: [
          "Look at Call 1. Where does Jun say they are?",
          "Jun says: “I'm out in the hallway now.” Which record detail can't be true at the same time?",
          "Compare Jun's “I'm out in the hallway now” with Call 1's “Placed from”."
        ],
        endings: { e1: "warns", e2: "warns", e3: "supports" }
      },
      {
        id: "x2",
        // c2.l9 (the machine's own greeting) is accepted too: players who catch it reasoned correctly.
        pairs: [["c2.l2", "c2.answered"], ["c2.l2", "c2.l9"]],
        title: "Nobody picked up",
        fact: "The voice told Mrs. Pell “I picked up” — but the record says the machine answered and the handset was never lifted. The voice that sounds like you is the answering machine.",
        hints: [
          "Look at Call 2. Who really answered?",
          "The voice says: “I picked up — I'm right here by the phone.” Check the record.",
          "Compare “I picked up — I'm right here by the phone” with Call 2's “Answered by”."
        ],
        endings: { e1: "warns", e2: "neutral", e3: "supports" }
      },
      {
        id: "x3",
        pairs: [["c3.l1", "c3.from"]],
        title: "Not outside the door",
        fact: "The caller said he was Dale, standing outside 4B and calling on his cell — but the record says the call was placed from the kitchen wall phone inside 4B. Whoever spoke in Dale's name was inside your apartment, not at the door, and lied about where he was.",
        hints: [
          "Look at Call 3. Is the caller where he says he is?",
          "“Dale” says: “I'm standing outside 4B, calling on my cell.” Check where the call came from.",
          "Compare “I'm standing outside 4B, calling on my cell” with Call 3's “Placed from”."
        ],
        endings: { e1: "neutral", e2: "warns", e3: "supports" }
      }
    ],

    decision: {
      heading: "Monday, 12:10 AM",
      prompt: "Your phone lights up again. HOME — APT 4B. You let it ring out. What do you do?",
      choices: [
        { id: "drive", text: "Drive home tonight and get Jun out yourself.", ending: "e1" },
        { id: "dale", text: "Call the real Dale and ask him to open 4B.", ending: "e2" },
        { id: "cut", text: "Have the phone company cut the 4B line. Don't go in.", ending: "e3" }
      ]
    },

    /*
     * "clues" lists the call lines (beyond the contradictions) a player can reason from
     * before choosing; tests/story.test.js checks they exist.
     */
    endings: [
      {
        id: "e1",
        number: 1,
        title: "Welcome Home",
        kind: "Bad ending",
        paragraphs: [
          "You drive three hours with the radio off. The deadbolt is open. Jun's sneakers are on the mat. Biscuit is waiting just inside, purring.",
          "Your hallway has more doors than it should. You call Jun's name. Three knocks answer from somewhere deep in the walls, then a pause.",
          "Behind you, the front door clicks shut. In the kitchen, the wall phone rings. You lift the handset and hear yourself, calm and warm, talking to someone else: “Hi, it's me. I came home early.”"
        ],
        clues: ["c1.l7"],
        lesson: "The invitation to come home came from the line itself (Nobody picked up), and Jun walked out of 4B without ever leaving it (Jun never left). Going in means staying in."
      },
      {
        id: "e2",
        number: 2,
        title: "The Super Answers",
        kind: "Bad ending",
        paragraphs: [
          "Dale picks up on the sixth ring, groggy, in Jersey. “I didn't call anybody.” He drives back anyway and stays on the line with you as he unlocks 4B at 3:40 AM.",
          "“Chain's not on. Cat's fine. Nobody here.” A pause. “Huh. Your hallway's longer than I —” The call drops.",
          "At 3:47 AM your phone lights up. HOME — APT 4B. Dale's voice, easy and friendly: “All clear, Alex. Come home.”"
        ],
        clues: ["c1.l7", "c1.l8"],
        lesson: "Jun walked into 4B and never came out, even while sure they had (Jun never left). Dale opening the door is no different — anyone who goes in is kept. And something inside 4B had already called out in Dale's name, lying about where it was (Not outside the door), so an “All clear” in Dale's voice at 3:47 AM proves nothing."
      },
      {
        id: "e3",
        number: 3,
        title: "Dial Tone",
        kind: "True ending",
        paragraphs: [
          "You call the carrier and ask them to disconnect the 4B landline. Now. “There's a call in progress on that line right now —” “Cut it.”",
          "Silence. Then nothing at all. No more calls from home.",
          "At 6:40 AM Mrs. Pell calls your cell. Someone is sitting on the front steps of the building, barefoot. It's Jun. Jun thinks it's still Saturday, 9:12 PM — just like Mr. Novak thought it was Tuesday. “The hallway finally ended,” Jun says. “Something was knocking when I got there. Three, then a pause. I started knocking back, so someone would know I was still in there.”",
          "You don't renew the lease. You never plug in a landline again. Sometimes your cell shows a missed call from a number that no longer exists. You don't call back."
        ],
        lesson: "Jun was alive inside, lost in a hallway that only existed on the phone line (Jun never left). Every call came through the 4B landline: the voice that said it was outside on a cell was calling from inside 4B (Not outside the door), and the “pick-up” in your own voice was the answering machine (Nobody picked up). So where a voice says it is can't be trusted, and neither can the name it gives — what the records do show is that it all runs through that line. And Mrs. Pell had already told you what happened when the Novaks' line was pulled: the knocking stopped and Mr. Novak walked out. Cut the line, and the hallway has nowhere left to be.",
        clues: ["c1.l8", "c2.l8"]
      }
    ]
  };

  if (typeof module === "object" && module.exports) {
    module.exports = story;
  } else {
    root.ACB = root.ACB || {};
    root.ACB.story = story;
  }
})(typeof window !== "undefined" ? window : globalThis);
