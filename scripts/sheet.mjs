// Contact sheet of screenshots. Usage: node scripts/sheet.mjs <out.png> <columns> <img...>
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve, basename } from "node:path";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
const [out, cols, ...files] = process.argv.slice(2);
const html = `<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;background:#333;color:#fff;font:13px sans-serif">${files
  .map((f) => `<div><img src="${pathToFileURL(resolve(f)).href}" style="width:100%">${basename(f)}</div>`)
  .join("")}</body>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1800, height: 900 } });
const file = resolve(tmpdir(), "viercys-sheet.html");
writeFileSync(file, html);
await p.goto(pathToFileURL(file).href);
await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: true });
await b.close();
