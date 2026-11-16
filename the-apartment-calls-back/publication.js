"use strict";

const fs = require("node:fs");
const path = require("node:path");

const names = [
  "PAYMENT_LINK", "APP_LINK", "HOME_LINK", "SIGNUP_FORM",
  "SELLER_NAME", "SELLER_EMAIL", "SELLER_ADDRESS", "SELLER_PHONE",
];
const values = JSON.parse(fs.readFileSync(path.join(__dirname, "publication.json"), "utf8"));
if (Object.keys(values).sort().join() !== [...names].sort().join()) {
  throw new Error("launch/publication.json: expected exactly the eight supported fields");
}
for (const name of names) {
  if (typeof values[name] !== "string" || values[name] !== values[name].trim()) {
    throw new Error(`launch/publication.json: ${name} must be a trimmed string`);
  }
  if (/\{\{|\}\}|[\r\n<>"']/.test(values[name])) {
    throw new Error(`launch/publication.json: ${name} contains unsafe characters or a publication mark`);
  }
  if (values[name] && (name.endsWith("_LINK") || name === "SIGNUP_FORM")) {
    if (!/^https:\/\/[^\s]+$/.test(values[name])) throw new Error(`${name}: use an HTTPS URL`);
  }
}
if (values.HOME_LINK && !values.HOME_LINK.endsWith("/")) {
  throw new Error("HOME_LINK: include the trailing slash for page and guide links");
}

function marksIn(content) {
  return [...content.matchAll(/\{\{([^{}]+)\}\}/g)].map((match) => match[1]);
}

function render(content, source, replacements = values) {
  return content.replace(/\{\{([^{}]+)\}\}/g, (mark, name) => {
    if (!names.includes(name)) throw new Error(`${source}: unsupported publication mark ${mark}`);
    return replacements[name] ? replacements[name].replaceAll("&", "&amp;") : mark;
  });
}

module.exports = { names, values, marksIn, render };
