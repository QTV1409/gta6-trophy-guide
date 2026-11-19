// Leonida Trophy Guide — the program that hands the guide in (Node 22, stdlib only).
//
// The guide itself is app/: plain static files (index.html, app.js, style.css and
// app/data/*.json) that open in desktop Chrome and work with the network off.
// This program copies app/ and screenshots/ from beside this file into /output
// (or MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with buildDossier from the vendored make.fun library, exactly as the kit asks.
// vendor/makefun-frontend.ts is the kit's copy and must not be changed: the
// scorer rebuilds the dossier with its own copy and compares the two byte for byte.
//
// Run it locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, from the kit's gate: the dossier text is capped at 160 KiB
// (text_max_bytes shapes the bytes); the other limits refuse an entry the scorer
// would refuse anyway (at most 4 screenshots, each at most 256 KiB; app/ at most
// 993 files and directories and 48 MiB, since app/ shares /output's own
// 1,000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
