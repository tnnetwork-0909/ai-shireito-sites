"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(process.env.LAUNCH_SOURCE_DIR || __dirname);
const source = path.resolve(root, "../dist/preview");
const out = path.join(root, "free-preview");
const files = [
  "index.html", "css/style.css", "js/config.js",
  "js/story.js", "js/game.js", "js/ui.js",
];

for (const file of files) {
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(source, file), target);
}

const configPath = path.join(out, "js/config.js");
let config = fs.readFileSync(configPath, "utf8");
const replacements = [
  ['storeUrl: "https://tnnetwork.gumroad.com/l/wouyw"', 'storeUrl: ""'],
  ['tagline: "A 20-minute phone horror. Three call recordings. Find where they lie."',
   'tagline: "A short phone horror opening. One call from an empty apartment."'],
  ['previewEnd: "That was the free opening. The full story — three call recordings, three contradictions, three endings — is {price}."',
   'previewEnd: "The opening ends here. You can replay the call below."'],
  ['previewNext: "The full edition will be sold on Gumroad."',
   'previewNext: ""'],
];
for (const [before, after] of replacements) {
  if (!config.includes(before)) throw new Error(`Free preview source changed: ${before}`);
  config = config.replace(before, after);
}
if (!config.includes('storeUrl: ""')) throw new Error("Free preview has a store URL");
fs.writeFileSync(configPath, config);
