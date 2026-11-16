"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { expectedFiles, gamePrice } = require("./offer.js");
const { renderedPages } = require("./build-gumroad-pages.js");
const { names, marksIn } = require("./publication.js");

const root = __dirname;
const legalSlugs = ["privacy", "terms", "tokushoho"];
let checkedLinks = 0;
let checkedMarks = 0;

for (const { name, output, content } of expectedFiles()) {
  if (fs.readFileSync(output, "utf8") !== content) throw new Error(`${name}: price or copy differs from template; run npm run build:launch`);
}
for (const { name, html } of renderedPages()) {
  if (fs.readFileSync(path.join(root, "gumroad-pages", name), "utf8") !== html) {
    throw new Error(`gumroad-pages/${name}: generated page is stale; run npm run build:launch`);
  }
}
if (require("../js/config.js").config.price !== gamePrice) {
  throw new Error("js/config.js: price differs from launch/offer.json; run npm run build:launch");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

for (const file of walk(root)) {
  if (!/\.(?:html|css|js|md)$/.test(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const mark of marksIn(content)) {
    if (!names.includes(mark)) throw new Error(`${file}: unsupported mark ${mark}`);
    checkedMarks++;
  }
  if (!file.endsWith(".html") || file.startsWith(path.join(root, "templates") + path.sep)) continue;
  for (const [, href] of content.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|data:|#|\{\{)/.test(href)) continue;
    const target = path.resolve(path.dirname(file), href.split(/[?#]/, 1)[0]);
    const linkedFile = href.endsWith("/") ? path.join(target, "index.html") : target;
    if (!fs.existsSync(linkedFile) || !fs.statSync(linkedFile).isFile()) {
      throw new Error(`${file}: missing local link ${href}`);
    }
    checkedLinks++;
  }
}

for (const slug of legalSlugs) {
  const page = fs.readFileSync(path.join(root, "gumroad-pages", `${slug}.html`), "utf8");
  const mirror = fs.readFileSync(path.join(root, "gumroad-pages", slug), "utf8");
  if (page !== mirror) throw new Error(`gumroad-pages/${slug}: local mirror is stale`);
}

console.log(`Checked ${checkedLinks} local links and ${checkedMarks} supported marks; legal mirrors match.`);
