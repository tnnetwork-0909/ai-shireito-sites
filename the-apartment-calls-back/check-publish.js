"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { values, names, marksIn } = require("./publication.js");
const { expectedFiles } = require("./offer.js");

require("./check-links.js");

for (const name of names) {
  if (!values[name]) throw new Error(`launch/publication.json: ${name} is empty; publication is blocked`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const root = path.join(__dirname, "..");
const files = [
  ...expectedFiles().map(({ output }) => output),
  path.join(__dirname, "style.css"),
  ...walk(path.join(__dirname, "gumroad-pages")),
  ...walk(path.join(__dirname, "free-preview")),
  ...walk(path.join(root, "dist", "preview")),
  ...walk(path.join(root, "release", "the-apartment-calls-back")),
];
for (const file of files) {
  if (!/\.(?:html|css|js|md)$/.test(file) && !path.basename(file).match(/^(?:privacy|terms|tokushoho)$/)) continue;
  const marks = marksIn(fs.readFileSync(file, "utf8"));
  if (marks.length) throw new Error(`${path.relative(root, file)}: unresolved publication mark {{${marks[0]}}}`);
}
console.log(`Publication ready: ${files.length} generated files have no publication marks.`);
