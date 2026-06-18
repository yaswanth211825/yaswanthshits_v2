import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const outDir = path.join(process.cwd(), "posts", "2026-06-18");

const assets = [
  {
    file: "tsitp-romcom-takeover.webp",
    bg: ["#ffe066", "#ff7ab6", "#78dcca"],
    title: "ROM-COM TAKEOVER",
    kicker: "3 AM // NO BS DRAMA",
    lines: ["Off Campus got evicted.", "Butterflies got promoted.", "Prime said: stick to the book."],
    accent: "TEAM?",
    doodles: ["heart", "waves", "ticket"],
  },
  {
    file: "swiftie-playlist-loading.webp",
    bg: ["#a7f3d0", "#93c5fd", "#f9a8d4"],
    title: "PLAYLIST LOADING",
    kicker: "SONGS DISCOVERED AGAINST MY WILL",
    lines: ["English songs apology form pending.", "Cardi B: cool, actually.", "Swiftie arc: suspiciously active."],
    accent: "NEXT WEEK",
    doodles: ["music", "star", "cassette"],
  },
  {
    file: "leg-day-mirror-confidence.webp",
    bg: ["#d9f99d", "#ffffff", "#60a5fa"],
    title: "LEG DAY DID NOTHING,",
    kicker: "YET CONFIDENT IN MIRROR",
    lines: ["YET CONFIDENT IN MIRROR", "No collapse. No after effects.", "Badass status still active."],
    accent: "BADASS",
    doodles: ["dumbbell", "mirror", "bolt"],
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function doodleSvg(kind, x, y, rotate = 0) {
  const transform = `translate(${x} ${y}) rotate(${rotate})`;
  const common = `fill="none" stroke="#17110f" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"`;
  const filled = `fill="#fff7db" stroke="#17110f" stroke-width="10" stroke-linejoin="round"`;

  const shapes = {
    heart: `<path ${filled} d="M45 86 C-10 50 10 5 43 26 C72 -8 122 16 104 58 C94 78 71 91 45 112 C18 92 0 77 -10 58" />`,
    waves: `<path ${common} d="M-20 20 C10 -5 40 45 70 20 S130 45 160 20" /><path ${common} d="M-10 64 C20 39 50 89 80 64 S140 89 170 64" />`,
    ticket: `<path ${filled} d="M0 0 H160 V88 H0 V60 C26 56 26 32 0 28 Z" /><path ${common} d="M104 10 V78" />`,
    music: `<path ${common} d="M35 88 V10 L115 -6 V72" /><circle fill="#fff7db" stroke="#17110f" stroke-width="10" cx="22" cy="96" r="22" /><circle fill="#fff7db" stroke="#17110f" stroke-width="10" cx="102" cy="80" r="22" />`,
    star: `<path ${filled} d="M62 0 L80 43 L126 47 L91 76 L102 121 L62 97 L22 121 L33 76 L-2 47 L44 43 Z" />`,
    cassette: `<rect ${filled} x="0" y="0" width="170" height="105" rx="12" /><circle fill="#fff" stroke="#17110f" stroke-width="9" cx="48" cy="48" r="22" /><circle fill="#fff" stroke="#17110f" stroke-width="9" cx="122" cy="48" r="22" /><path ${common} d="M35 92 H135" />`,
    dumbbell: `<path ${common} d="M15 58 H155" /><rect ${filled} x="-10" y="24" width="34" height="68" rx="6" /><rect ${filled} x="146" y="24" width="34" height="68" rx="6" /><rect ${filled} x="34" y="36" width="28" height="44" rx="6" /><rect ${filled} x="108" y="36" width="28" height="44" rx="6" />`,
    mirror: `<rect ${filled} x="15" y="-8" width="120" height="150" rx="22" /><path ${common} d="M45 155 H105 M75 142 V174" /><path stroke="#60a5fa" stroke-width="8" stroke-linecap="round" d="M48 24 L98 86" />`,
    bolt: `<path ${filled} d="M60 0 L12 72 H55 L30 138 L110 48 H65 Z" />`,
    keys: `<circle fill="#fff7db" stroke="#17110f" stroke-width="10" cx="35" cy="35" r="28" /><path ${common} d="M56 56 L135 135 M100 101 L78 123 M119 120 L97 142" />`,
    guitar: `<path ${filled} d="M42 54 C6 44 -10 86 22 105 C11 142 58 160 82 129 C106 160 153 142 142 105 C174 86 158 44 122 54 C111 17 53 17 42 54 Z" /><path ${common} d="M94 64 L170 -12 M120 90 L194 16" /><circle fill="#17110f" cx="82" cy="92" r="13" />`,
    code: `<path ${common} d="M45 30 L5 70 L45 110 M125 30 L165 70 L125 110 M98 20 L72 122" />`,
  };

  return `<g transform="${transform}">${shapes[kind] || ""}</g>`;
}

function poster(asset) {
  const [a, b, c] = asset.bg;
  const lineBlocks = asset.lines
    .map((line, index) => {
      const y = 455 + index * 72;
      return `<text x="110" y="${y}" class="body">${escapeXml(line)}</text>`;
    })
    .join("");
  const doodles = asset.doodles
    .map((kind, index) => doodleSvg(kind, [820, 918, 760][index], [124, 632, 690][index], [-9, 8, -14][index]))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="0.52" stop-color="${b}"/>
      <stop offset="1" stop-color="${c}"/>
    </linearGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="#17110f" stroke-opacity=".12" stroke-width="3"/>
    </pattern>
    <style>
      .title{font-family: Impact, Arial Black, sans-serif;font-size:78px;font-weight:900;letter-spacing:0;fill:#17110f}
      .shadow{fill:#fff7db;stroke:#17110f;stroke-width:7;paint-order:stroke}
      .kicker{font-family: Arial, sans-serif;font-size:28px;font-weight:900;letter-spacing:0;fill:#17110f}
      .body{font-family: Comic Sans MS, Trebuchet MS, sans-serif;font-size:40px;font-weight:800;letter-spacing:0;fill:#17110f}
      .stamp{font-family: Impact, Arial Black, sans-serif;font-size:48px;font-weight:900;letter-spacing:0;fill:#f04438}
    </style>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <rect width="1200" height="900" fill="url(#grid)"/>
  <g opacity=".72">
    <circle cx="109" cy="112" r="74" fill="#fff7db"/>
    <circle cx="1083" cy="789" r="92" fill="#fff7db"/>
    <rect x="928" y="332" width="212" height="78" rx="12" fill="#ffcf33" stroke="#17110f" stroke-width="7" transform="rotate(7 1034 371)"/>
    <rect x="72" y="722" width="248" height="84" rx="12" fill="#ff73b5" stroke="#17110f" stroke-width="7" transform="rotate(-5 196 764)"/>
  </g>
  <rect x="55" y="47" width="1090" height="806" rx="22" fill="#fff7db" fill-opacity=".86" stroke="#17110f" stroke-width="10"/>
  <rect x="88" y="78" width="540" height="58" rx="8" fill="#ffcf33" stroke="#17110f" stroke-width="7" transform="rotate(-4 358 107)"/>
  <text x="112" y="118" class="kicker">${escapeXml(asset.kicker)}</text>
  <text x="105" y="286" class="title shadow">${escapeXml(asset.title)}</text>
  <g>
    ${lineBlocks}
  </g>
  <g transform="rotate(-5 969 478)">
    <rect x="828" y="414" width="285" height="112" rx="16" fill="#16a34a" stroke="#17110f" stroke-width="8"/>
    <text x="858" y="487" class="stamp" fill="#fff">${escapeXml(asset.accent)}</text>
  </g>
  ${doodles}
  <path d="M78 833 C258 786 437 872 622 824 S967 779 1122 831" fill="none" stroke="#17110f" stroke-width="8" stroke-linecap="round" stroke-dasharray="18 18"/>
</svg>`;
}

await fs.mkdir(outDir, { recursive: true });

for (const asset of assets) {
  const svg = Buffer.from(poster(asset));
  await sharp(svg).webp({ quality: 92 }).toFile(path.join(outDir, asset.file));
}

function teamVotePoster() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#ffe066"/>
      <stop offset=".47" stop-color="#ffd1dc"/>
      <stop offset="1" stop-color="#93c5fd"/>
    </linearGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="#17110f" stroke-opacity=".12" stroke-width="3"/>
    </pattern>
    <style>
      .hand{font-family: Comic Sans MS, Trebuchet MS, sans-serif;font-weight:900;letter-spacing:0;fill:#17110f}
      .impact{font-family: Impact, Arial Black, sans-serif;font-weight:900;letter-spacing:0;fill:#17110f}
      .small{font-family: Arial, sans-serif;font-size:29px;font-weight:900;letter-spacing:0;fill:#17110f}
      .line{font-size:50px}
      .team{font-size:46px}
      .sub{font-size:34px}
      .stamp{font-size:46px;fill:#f04438}
    </style>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <rect width="1200" height="900" fill="url(#grid)"/>
  <rect x="28" y="28" width="1144" height="844" rx="26" fill="#fff7db" fill-opacity=".88" stroke="#17110f" stroke-width="10"/>
  <path d="M64 848 C258 804 432 873 596 828 S957 798 1138 842" fill="none" stroke="#17110f" stroke-width="8" stroke-linecap="round" stroke-dasharray="18 18"/>
  <rect x="812" y="66" width="318" height="64" rx="8" fill="#ffcf33" stroke="#17110f" stroke-width="7" transform="rotate(-3 971 98)"/>
  <text x="838" y="108" class="small">3 AM // NO BS DRAMA</text>

  <text x="70" y="112" class="hand line">Off Campus got evicted.</text>
  <text x="70" y="182" class="hand line">Butterflies got promoted.</text>
  <text x="70" y="252" class="hand line">Prime said: stick to the book.</text>

  <g transform="translate(116 317)">
    <path d="M0 42 L18 74 L54 83 L22 101 L16 136 L-9 109 L-45 116 L-27 84 L-44 51 L-8 58 Z" fill="#fff" stroke="#17110f" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="176" cy="70" r="50" fill="#f9a8d4" stroke="#17110f" stroke-width="7"/>
    <path d="M132 70 H220 M176 25 V115 M142 39 C176 58 208 41 220 83 M132 83 C158 69 188 95 216 58" fill="none" stroke="#17110f" stroke-width="5"/>
    <path d="M278 22 C322 -8 367 22 356 68 C348 101 314 121 278 148 C242 121 208 101 200 68 C189 22 234 -8 278 22 Z" fill="#fff7db" stroke="#17110f" stroke-width="7"/>
  </g>

  <g transform="translate(645 312)">
    <path d="M70 190 L146 26" stroke="#17110f" stroke-width="12" stroke-linecap="round"/>
    <path d="M94 138 L28 106 C-24 152 42 224 94 186 C141 246 232 191 184 131 C239 82 164 11 118 70 C74 10 -5 65 41 125 Z" fill="#d99a4e" stroke="#17110f" stroke-width="7"/>
    <circle cx="94" cy="148" r="21" fill="#17110f"/>
    <path d="M145 28 L222 -2 M156 50 L232 20" stroke="#17110f" stroke-width="8" stroke-linecap="round"/>
    <path d="M292 44 C306 16 342 17 354 46 C385 48 398 85 373 106 C385 137 352 164 325 147 C298 166 263 139 274 107 C248 87 262 48 292 44 Z" fill="#f9a8d4" stroke="#17110f" stroke-width="7"/>
    <path d="M302 101 C318 112 332 112 348 101" fill="none" stroke="#17110f" stroke-width="6" stroke-linecap="round"/>
  </g>

  <g transform="translate(76 495)">
    <rect x="0" y="-30" width="480" height="188" rx="18" fill="#ffffff" fill-opacity=".68" stroke="#17110f" stroke-width="7" transform="rotate(-1 240 64)"/>
    <text x="42" y="26" class="impact team">TEAM JEREMIAH</text>
    <text x="42" y="83" class="hand sub">sunshine chaos.</text>
    <text x="42" y="129" class="hand sub">aux-cord confidence.</text>
  </g>

  <g transform="translate(640 495)">
    <rect x="0" y="-30" width="480" height="188" rx="18" fill="#ffffff" fill-opacity=".68" stroke="#17110f" stroke-width="7" transform="rotate(1 240 64)"/>
    <text x="42" y="26" class="impact team">TEAM CONRAD</text>
    <text x="42" y="83" class="hand sub">slow-burn specialist.</text>
    <text x="42" y="129" class="hand sub">guitar-level damage.</text>
  </g>

  <g transform="translate(506 455) rotate(-4)">
    <path d="M0 0 H188 V92 H0 V62 C27 57 27 35 0 30 Z" fill="#fff7db" stroke="#17110f" stroke-width="8"/>
    <text x="55" y="63" class="impact stamp">VS</text>
  </g>

  <g transform="translate(92 716)">
    <text x="0" y="0" class="hand sub">Cardi B apology filed.</text>
    <text x="0" y="48" class="hand sub">Swiftie era loading.</text>
  </g>
  <g transform="translate(408 708) rotate(-4)">
    <rect x="0" y="0" width="390" height="92" rx="14" fill="#16a34a" stroke="#17110f" stroke-width="8"/>
    <text x="42" y="61" class="impact stamp">CAST YOUR VERDICT</text>
  </g>
  <g transform="translate(860 720)">
    <path d="M0 0 H150 V86 H0 V58 C25 54 25 32 0 28 Z" fill="#fff7db" stroke="#17110f" stroke-width="8"/>
    <path d="M24 96 C74 66 120 118 172 82" fill="none" stroke="#17110f" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>`;
}

await sharp(Buffer.from(teamVotePoster()))
  .webp({ quality: 92 })
  .toFile(path.join(outDir, "tsitp-team-verdict.webp"));

console.log(`Generated ${assets.length + 1} day 04 assets.`);
