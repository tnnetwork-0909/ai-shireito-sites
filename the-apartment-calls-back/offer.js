"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const templates = ["index.html", "terms.html", "tokushoho.html", "sales-copy.md"];
const offer = JSON.parse(fs.readFileSync(path.join(root, "offer.json"), "utf8"));
if (offer.currency !== "USD" || !Number.isSafeInteger(offer.priceCents) || offer.priceCents <= 0) {
  throw new Error("launch/offer.json: expected USD and positive integer priceCents");
}
const amount = (offer.priceCents / 100).toFixed(2).replace(/\.00$/, "");
const price = `US$${amount}`;
const gamePrice = `$${amount}`;

function render(template) {
  if (!template.includes("[[OFFER_PRICE]]")) throw new Error("Offer price token missing from template");
  const output = template.replaceAll("[[OFFER_PRICE]]", price)
    .replaceAll('href="../style.css"', 'href="style.css"')
    .replaceAll('src="../screens/', 'src="screens/')
    .replaceAll('href="../privacy.html"', 'href="privacy.html"')
    .replaceAll('href="../terms.html"', 'href="terms.html"')
    .replaceAll('href="../tokushoho.html"', 'href="tokushoho.html"');
  if (/\[\[[^\]]+\]\]/.test(output)) throw new Error("Unrendered template token");
  return output;
}

function expectedFiles() {
  return templates.map((name) => ({
    name,
    output: path.join(root, name),
    content: render(fs.readFileSync(path.join(root, "templates", name), "utf8")),
  }));
}

function gameConfigContent() {
  const file = path.join(root, "..", "js", "config.js");
  const current = fs.readFileSync(file, "utf8");
  const priceLine = /^    price: "[^"]+",$/m;
  if (!priceLine.test(current)) throw new Error("js/config.js: price line missing");
  return { file, content: current.replace(priceLine, `    price: "${gamePrice}",`) };
}

module.exports = { offer, price, gamePrice, expectedFiles, gameConfigContent };
