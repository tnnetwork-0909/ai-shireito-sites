"use strict";

const fs = require("node:fs");
const path = require("node:path");
const publication = require("./publication.js");

const root = __dirname;
const templates = ["index.html", "privacy.html", "terms.html", "tokushoho.html", "sales-copy.md"];
const guides = [
  "guides/index.html",
  "guides/horror-games-without-audio/index.html",
  "guides/horror-games-without-chase-sequences/index.html",
  "guides/horror-games-without-gore/index.html",
  "guides/play-html-game-offline/index.html",
  "guides/text-based-horror-games-without-jump-scares/index.html",
];
const offer = JSON.parse(fs.readFileSync(path.join(root, "offer.json"), "utf8"));
if (offer.currency !== "USD" || !Number.isSafeInteger(offer.priceCents) || offer.priceCents <= 0) {
  throw new Error("launch/offer.json: expected USD and positive integer priceCents");
}
const amount = (offer.priceCents / 100).toFixed(2).replace(/\.00$/, "");
const price = `US$${amount}`;
const gamePrice = `$${amount}`;

function render(template, name) {
  if (["index.html", "terms.html", "tokushoho.html", "sales-copy.md"].includes(name) && !template.includes("[[OFFER_PRICE]]")) {
    throw new Error(`${name}: offer price token missing from template`);
  }
  let output = template.replaceAll("[[OFFER_PRICE]]", price);
  if (!name.includes("/")) {
    output = output.replaceAll('href="../style.css"', 'href="style.css"')
      .replaceAll('src="../screens/', 'src="screens/')
      .replaceAll('href="../privacy.html"', 'href="privacy.html"')
      .replaceAll('href="../terms.html"', 'href="terms.html"')
      .replaceAll('href="../tokushoho.html"', 'href="tokushoho.html"');
  }
  if (/\[\[[^\]]+\]\]/.test(output)) throw new Error("Unrendered template token");
  return publication.render(output, `launch/templates/${name}`);
}

function expectedFiles() {
  return [...templates, ...guides].map((name) => ({
    name,
    output: path.join(root, name),
    content: render(fs.readFileSync(path.join(root, "templates", name), "utf8"), name),
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
