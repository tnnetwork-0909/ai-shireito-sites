"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { marksIn, names } = require("./publication.js");

const root = path.resolve(process.env.LAUNCH_SOURCE_DIR || __dirname);
const out = path.join(root, "gumroad-pages");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const screenshot = fs.readFileSync(path.join(root, "screens", "the-apartment-calls-back-desktop.png")).toString("base64");
const pages = ["index.html", "privacy.html", "terms.html", "tokushoho.html"];
const legalSlugs = ["privacy", "terms", "tokushoho"];

function renderedPages() {
  const rendered = [];
  for (const page of pages) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  const marker = '<link rel="stylesheet" href="style.css">';
  if (!source.includes(marker)) throw new Error(`${page}: stylesheet link missing`);
  let html = source.replace(marker, `<style>\n${css}\n</style>`);
  if (page === "index.html") {
    html = html.replace('src="screens/the-apartment-calls-back-desktop.png"', `src="data:image/png;base64,${screenshot}"`);
  }
  for (const slug of legalSlugs) {
    html = html.replaceAll(`href="${slug}.html"`, `href="${slug}"`);
  }
  for (const mark of marksIn(html)) {
    if (!names.includes(mark)) throw new Error(`${page}: unsupported mark {{${mark}}}`);
  }
  rendered.push({ name: page, html });
  // Local mirrors let link audits resolve the same URLs as Gumroad's page slugs.
  // Publish the .html files as Gumroad Pages; these mirrors are for local checks.
  if (page !== "index.html") {
    rendered.push({ name: path.basename(page, ".html"), html });
  }
  }
  return rendered;
}

function build() {
  fs.mkdirSync(out, { recursive: true });
  for (const { name, html } of renderedPages()) fs.writeFileSync(path.join(out, name), html);
}

if (require.main === module) build();
module.exports = { build, renderedPages };
