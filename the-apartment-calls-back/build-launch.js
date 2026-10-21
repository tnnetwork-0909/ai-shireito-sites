"use strict";

const fs = require("node:fs");
const { price, expectedFiles, gameConfigContent } = require("./offer.js");

for (const { output, content } of expectedFiles()) fs.writeFileSync(output, content);
const config = gameConfigContent();
fs.writeFileSync(config.file, config.content);
require("./build-gumroad-pages.js").build();
console.log(`Launch pages and sales copy built for ${price}. Confirm the Gumroad product price matches before publication.`);
