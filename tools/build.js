#!/usr/bin/env node
/* Builds dist/speedcubing-assistant.html: the whole app in one file, with config.json,
   css/app.css and js/*.js inlined. Use it for the Claude artifact or to open the app
   straight from disk (file://), where config.json can't be fetched.
   Usage: node tools/build.js   (no dependencies) */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

const config = JSON.parse(read("config.json"));
let html = read("index.html");

html = html
  .replace(/^.*\sdata-pwa>.*\r?\n/gm, "")                       // manifest, icons: PWA only
  .replace(/^<!-- .* -->\r?\n/gm, "")
  .replace(/<link rel="stylesheet" href="([^"]+)" data-app-css>/,
    (_, f) => `<style data-app-css>\n${read(f)}</style>`);

let first = true;
html = html.replace(/<script src="([^"]+)" data-app><\/script>/g, (_, f) => {
  const js = read(f).replace(/<\/script/gi, "<\\/script");
  const cfg = first
    ? `<script type="application/json" id="config">${JSON.stringify(config).replace(/</g, "\\u003c")}</script>\n`
    : "";
  first = false;
  return `${cfg}<script data-app>\n${js}</script>`;
});

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist", "speedcubing-assistant.html");
fs.writeFileSync(out, html);
console.log(`${path.relative(root, out)}  ${(html.length / 1024).toFixed(1)} KB`);
