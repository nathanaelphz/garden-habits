/* Garden plant art: one parametric illustration system shared by the app UI
   and the landing page.

   plantSVG(species, stage, wilt, opts) -> SVG markup string
     species: sunflower | tulip | lavender | fern | monstera | cactus | moonflower
     stage:   0 seed, 1 sprout, 2 seedling, 3 bud, 4 bloom, 5 mature
     wilt:    0 healthy .. 1 fully dry (1 missed day ≈ 0.55, 2+ days ≈ 1)
   All art lives in a 120 x 160 box, soil line at y = 148. */
(function (root) {
  "use strict";

  const C = {
    leafLight: "#6FA866", leaf: "#4C8A50", leafDark: "#2F5E3A", stem: "#4F8A4F",
    vein: "#2A5233", straw: "#A8975C", brown: "#7A5A36",
    soil: "#3A2A20", soilLight: "#55402F", seed: "#8A6A44",
  };
  const SPECIES = {
    sunflower: { label: "Sunflower", petal: "#F3B53A", petalDark: "#D9902A", heart: "#5B3A1F", seed: "#4E3826" },
    tulip:     { label: "Tulip",     petal: "#EC6A52", petalDark: "#C9473A", heart: "#F4C5A0", seed: "#7B5235" },
    lavender:  { label: "Lavender",  petal: "#9A86D0", petalDark: "#7461B0", heart: "#C7B9EC", seed: "#5E5070" },
    fern:      { label: "Fern",      petal: "#6FA866", petalDark: "#4C8A50", heart: "#9CCB86", seed: "#6A5A3E" },
    monstera:  { label: "Monstera",  petal: "#3F8A5A", petalDark: "#2B6B45", heart: "#5FAA74", seed: "#6A5A3E" },
    cactus:    { label: "Cactus",    petal: "#EE77A6", petalDark: "#CC5286", heart: "#FFD6E6", seed: "#7A6A48" },
    moonflower:{ label: "Moonflower",petal: "#F3F1FF", petalDark: "#C9C3EE", heart: "#FFF2B8", seed: "#5E5472" },
  };
  const STAGES = ["Seed", "Sprout", "Seedling", "Bud", "Bloom", "Mature"];

  // ---------- helpers ----------
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };
  const f = (n) => Math.round(n * 100) / 100;
  const quad = (p0, p1, p2, t) => {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  };

  function leaf(x, y, angle, len, fill, vein) {
    const L = len;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})">` +
      `<path d="M0 0 C${f(L * .28)} ${f(-L * .34)} ${f(L * .78)} ${f(-L * .3)} ${f(L)} 0 C${f(L * .74)} ${f(L * .24)} ${f(L * .3)} ${f(L * .26)} 0 0Z" fill="${fill}"/>` +
      `<path d="M${f(L * .08)} 0 Q${f(L * .5)} ${f(-L * .04)} ${f(L * .9)} 0" stroke="${vein}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
  }

  function soil(sp) {
    return `<ellipse cx="60" cy="149" rx="30" ry="6.5" fill="${C.soil}"/>` +
      `<path d="M33 148 Q60 139 87 148Z" fill="${C.soilLight}"/>`;
  }

  // ---------- flower heads (drawn facing up, centred on 0,0) ----------
  function head(species, stage, w, s) {
    const petal = mix(s.petal, C.brown, w * 0.5), petalDark = mix(s.petalDark, C.brown, w * 0.55);
    const green = mix(C.leaf, C.straw, w * 0.6);
    if (stage === 3) { // bud
      if (species === "sunflower")
        return `<ellipse cx="0" cy="-6" rx="8" ry="9" fill="${green}"/><path d="M-6 -10 L0 -17 L6 -10Z" fill="${petal}"/>`;
      if (species === "tulip")
        return `<path d="M-6 0 C-8 -10 -4 -18 0 -20 C4 -18 8 -10 6 0Z" fill="${petalDark}"/><path d="M-2 0 C-3 -9 -1 -16 0 -19 C2 -12 3 -6 2 0Z" fill="${petal}"/>`;
      if (species === "lavender")
        return spike(0, 0, 14, mix("#8FA076", petalDark, .5), petal, 0.7);
      if (species === "moonflower")
        return `<path d="M-4 0 C-6 -8 -2 -18 2 -22 C3 -14 6 -6 4 0Z" fill="${petalDark}"/><path d="M-1 -4 Q2 -12 1 -20" stroke="${petal}" stroke-width="2" fill="none"/>`;
    }
    const big = stage === 5 ? 1.22 : 1;
    if (species === "sunflower") {
      const r = 15 * big, n = 16; let p = "";
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i;
        p += `<ellipse cx="0" cy="${f(-r * 0.92)}" rx="${f(3.6 * big)}" ry="${f(8 * big)}" transform="rotate(${a})" fill="${i % 2 ? petal : petalDark}"/>`;
      }
      let dots = "";
      for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = Math.sqrt(i) * 2.2 * big;
        dots += `<circle cx="${f(Math.cos(a) * rr)}" cy="${f(Math.sin(a) * rr)}" r="1" fill="${mix(s.heart, "#2C1C10", .5)}"/>`; }
      return `<g transform="translate(0 -4)">${p}<circle r="${f(r * 0.62)}" fill="${mix(s.heart, C.brown, w * .3)}"/>${dots}</g>`;
    }
    if (species === "tulip") {
      const k = big;
      return `<g transform="scale(${k})"><path d="M-11 -4 C-14 -16 -8 -26 -3 -27 C-4 -18 -3 -10 0 -2Z" fill="${petalDark}"/>` +
        `<path d="M11 -4 C14 -16 8 -26 3 -27 C4 -18 3 -10 0 -2Z" fill="${petalDark}"/>` +
        `<path d="M-8 0 C-10 -12 -5 -24 0 -28 C5 -24 10 -12 8 0 C4 3 -4 3 -8 0Z" fill="${petal}"/>` +
        `<path d="M-2 -6 Q0 -18 1 -24" stroke="${s.heart}" stroke-width="1.2" fill="none" opacity=".6"/></g>`;
    }
    if (species === "lavender") {
      return spike(0, 0, 24 * big, petalDark, petal, 1) +
        (stage === 5 ? spike(-9, 8, 18, petalDark, petal, 1, -18) + spike(9, 8, 18, petalDark, petal, 1, 18) : "");
    }
    if (species === "moonflower") {
      const r = 13 * big; let lobes = "", star = "";
      for (let i = 0; i < 5; i++) {
        lobes += `<circle cx="0" cy="${f(-r * .52)}" r="${f(r * .62)}" transform="rotate(${i * 72})" fill="${petal}"/>`;
        star += `<path d="M0 0 L0 ${f(-r * 1.05)}" transform="rotate(${i * 72 + 36})" stroke="${petalDark}" stroke-width="1" stroke-linecap="round"/>`;
      }
      return `<g transform="translate(0 -10)">${lobes}${star}<circle r="${f(r * .26)}" fill="${s.heart}"/></g>`;
    }
    return "";
  }

  function spike(x, y, len, dark, light, o, rot = 0) {
    let s = `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 L0 ${-len}" stroke="${mix(C.stem, dark, .3)}" stroke-width="1.4"/>`;
    for (let i = 0; i < 7; i++) {
      const yy = -len + i * (len / 7.5), wv = 2.6 + i * 0.25;
      s += `<ellipse cx="-2" cy="${f(yy)}" rx="${f(wv)}" ry="2.4" fill="${i % 2 ? light : dark}" opacity="${o}"/>` +
        `<ellipse cx="2" cy="${f(yy + 1.4)}" rx="${f(wv)}" ry="2.4" fill="${i % 2 ? dark : light}" opacity="${o}"/>`;
    }
    return s + "</g>";
  }

  // ---------- body types ----------
  function stemmed(species, stage, w, s) {
    const H = [0, 18, 40, 66, 88, 100][stage];
    const leafC = mix(C.leaf, C.straw, w * .62), leafL = mix(C.leafLight, C.straw, w * .62);
    const stemC = mix(C.stem, C.straw, w * .6), vein = mix(C.vein, C.brown, w * .5);
    const top = [60 + 18 * w, 148 - H * (1 - 0.2 * w)];
    const ctrl = [60 + 4 + 6 * w, 148 - H * 0.62];
    const base = [60, 148];
    let out = `<path d="M60 148 Q${f(ctrl[0])} ${f(ctrl[1])} ${f(top[0])} ${f(top[1])}" stroke="${stemC}" stroke-width="${stage >= 4 ? 3.6 : 2.8}" fill="none" stroke-linecap="round"/>`;

    if (stage === 1) { // cotyledons
      return out + leaf(top[0], top[1], -30 + 55 * w, 13, leafL, vein) + leaf(top[0], top[1], -150 - 55 * w, 13, leafC, vein);
    }
    const pairs = { 2: 2, 3: 3, 4: 3, 5: 4 }[stage];
    const leafLen = species === "tulip" ? 26 : species === "lavender" ? 15 : species === "moonflower" ? 17 : 20;
    for (let i = 0; i < pairs; i++) {
      const t = 0.22 + (i / pairs) * 0.62;
      const [x, y] = quad(base, ctrl, top, t);
      const L = leafLen * (1.05 - i * 0.12) * (species === "tulip" && i > 0 ? .7 : 1);
      if (species === "tulip" && i === 0) { // strap leaves from the base
        out += leaf(60, 146, -70 + 40 * w, 34, leafC, vein) + leaf(60, 146, -112 - 40 * w, 30, leafL, vein);
        continue;
      }
      out += leaf(x, y, -32 + 52 * w + (i % 2) * 6, L, i % 2 ? leafL : leafC, vein);
      out += leaf(x, y, -148 - 52 * w - (i % 2) * 6, L, i % 2 ? leafC : leafL, vein);
    }
    if (stage === 2 && species === "moonflower") out += `<path d="M${f(top[0])} ${f(top[1])} q6 -6 2 -12 q-4 -4 -1 -7" stroke="${stemC}" stroke-width="1.4" fill="none"/>`;
    if (stage >= 3) {
      const rot = 78 * w;
      out += `<g transform="translate(${f(top[0])} ${f(top[1])}) rotate(${f(rot)})">${head(species, stage, w, s)}</g>`;
    }
    if (stage === 5 && species !== "lavender") { // a second, smaller flower on a side branch
      const [bx, by] = quad(base, ctrl, top, 0.55);
      const ex = bx - 22 - 6 * w, ey = by - 18 + 12 * w;
      out = `<path d="M${f(bx)} ${f(by)} Q${f(bx - 14)} ${f(by - 6)} ${f(ex)} ${f(ey)}" stroke="${stemC}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
        `<g transform="translate(${f(ex)} ${f(ey)}) rotate(${f(-20 + 70 * w)}) scale(.62)">${head(species, 4, w, s)}</g>` + out;
    }
    return out;
  }

  function fern(stage, w) {
    const n = [0, 1, 3, 4, 6, 8][stage], len = [0, 16, 34, 50, 62, 70][stage];
    const leafC = mix(C.leaf, C.straw, w * .65), leafL = mix(C.leafLight, C.straw, w * .65), rach = mix(C.stem, C.straw, w * .6);
    if (stage === 1) return `<path d="M60 148 Q61 136 58 130" stroke="${rach}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="60" cy="128" r="4" fill="none" stroke="${leafL}" stroke-width="2.6"/>`;
    let out = "";
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, spread = (Math.floor(i / 2) + 1) / (n / 2 + 1);
      const ang = side * (12 + spread * 58) + side * 22 * w; // droops outward when dry
      const L = len * (1 - spread * 0.28);
      const tipX = 60 + Math.sin(ang * Math.PI / 180) * L, tipY = 148 - Math.cos(ang * Math.PI / 180) * L * (1 - .35 * w);
      const cx = 60 + Math.sin(ang * Math.PI / 180) * L * .3, cy = 148 - L * .75 * (1 - .3 * w);
      out += `<path d="M60 148 Q${f(cx)} ${f(cy)} ${f(tipX)} ${f(tipY)}" stroke="${rach}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      for (let k = 1; k < 9; k++) {
        const t = k / 9.4, [x, y] = quad([60, 148], [cx, cy], [tipX, tipY], t);
        const sz = 9 * (1 - t * .75);
        const dir = Math.atan2(tipY - cy, tipX - cx) * 180 / Math.PI;
        out += leaf(x, y, dir - 62 + 30 * w, sz, k % 2 ? leafC : leafL, C.vein) + leaf(x, y, dir + 62 + 30 * w, sz, k % 2 ? leafL : leafC, C.vein);
      }
    }
    if (stage >= 4) out += `<path d="M60 148 Q63 128 60 118" stroke="${rach}" stroke-width="2" fill="none"/><circle cx="62" cy="116" r="3.4" fill="none" stroke="${leafL}" stroke-width="2"/>`;
    return out;
  }

  function monstera(stage, w) {
    const n = [0, 1, 2, 3, 4, 5][stage];
    const leafC = mix("#3F8A5A", C.straw, w * .6), leafD = mix("#2B6B45", C.straw, w * .6), pet = mix(C.stem, C.straw, w * .6);
    const specs = [[0, 46, 1], [-38, 40, .9], [36, 38, .95], [-62, 30, .8], [60, 30, .8]];
    let out = "";
    for (let i = n - 1; i >= 0; i--) {
      const [ang0, L0, sc0] = specs[i];
      const sc = sc0 * (stage === 1 ? .45 : stage === 2 ? .7 : 1);
      const ang = ang0 * (1 + .18 * w) + (ang0 === 0 ? 14 * w : 0);
      const L = L0 * (stage === 1 ? .45 : stage === 2 ? .75 : 1);
      const tx = 60 + Math.sin(ang * Math.PI / 180) * L, ty = 148 - Math.cos(ang * Math.PI / 180) * L * (1 - .22 * w);
      out += `<path d="M60 148 Q${f(60 + (tx - 60) * .2)} ${f(ty + 10)} ${f(tx)} ${f(ty)}" stroke="${pet}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      const fill = i % 2 ? leafD : leafC;
      out += `<g transform="translate(${f(tx)} ${f(ty)}) rotate(${f(ang * .6 + 22 * w * Math.sign(ang0 || 1))}) scale(${f(sc * (1 - .12 * w))})">` +
        `<path d="M0 6 C-20 4 -26 -14 -14 -26 C-6 -33 6 -33 14 -26 C26 -14 20 4 0 6Z" fill="${fill}"/>` +
        (stage >= 3 ? `<path d="M-17 -8 L-7 -10 M-15 -19 L-6 -16 M17 -8 L7 -10 M15 -19 L6 -16" stroke="#18271E" stroke-width="2.6" stroke-linecap="round"/>` : "") +
        `<path d="M0 4 L0 -28" stroke="${mix(C.vein, C.brown, w * .4)}" stroke-width="1" opacity=".5"/></g>`;
    }
    return out;
  }

  function cactus(stage, w, s) {
    const H = [0, 12, 26, 42, 52, 60][stage], W = [0, 12, 16, 20, 22, 24][stage];
    const body = mix("#5E9670", C.straw, w * .55), rib = mix("#3E7352", C.brown, w * .4);
    const lean = 10 * w;
    let out = `<g transform="rotate(${f(lean)} 60 148)">`;
    if (stage === 5) {
      out += `<path d="M${60 - W / 2} 120 h-10 q-6 0 -6 -6 v-14" stroke="${body}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M${60 + W / 2} 112 h9 q6 0 6 -6 v-10" stroke="${body}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    out += `<rect x="${60 - W / 2}" y="${148 - H}" width="${W}" height="${H + 2}" rx="${W / 2}" fill="${body}"/>`;
    for (let i = -1; i <= 1; i++) out += `<path d="M${60 + i * W / 4} ${148 - H + 5} V146" stroke="${rib}" stroke-width="1.2" opacity=".7"/>`;
    if (w > 0.3) out += `<path d="M${60 - W / 2 + 2} ${148 - H * .5} q${W / 2 - 2} 3 ${W - 4} 0 M${60 - W / 2 + 2} ${148 - H * .35} q${W / 2 - 2} 3 ${W - 4} 0" stroke="${rib}" stroke-width="1" fill="none"/>`;
    for (let k = 0; k < Math.min(stage * 3, 12); k++) {
      const yy = 148 - H + 8 + (k * 37 % Math.max(H - 10, 4)), xx = 60 + ((k % 3) - 1) * W / 3.2;
      out += `<path d="M${f(xx - 1.6)} ${yy} h3.2" stroke="#E9E2C8" stroke-width=".8" opacity=".8"/>`;
    }
    if (stage >= 3) {
      const ty = 148 - H;
      if (stage === 3) out += `<ellipse cx="60" cy="${ty - 2}" rx="3" ry="4" fill="${mix(s.petalDark, C.brown, w * .5)}"/>`;
      else {
        const p = mix(s.petal, C.brown, w * .5), pd = mix(s.petalDark, C.brown, w * .5);
        let fl = "";
        for (let i = 0; i < 8; i++) fl += `<ellipse cx="0" cy="-5" rx="2.6" ry="5.5" transform="rotate(${i * 45})" fill="${i % 2 ? p : pd}"/>`;
        out += `<g transform="translate(60 ${ty - 3}) scale(${stage === 5 ? 1.25 : 1})">${fl}<circle r="2.4" fill="${s.heart}"/></g>`;
      }
    }
    return out + "</g>";
  }

  function plantSVG(species, stage, wilt = 0, opts = {}) {
    const s = SPECIES[species] || SPECIES.fern;
    const w = Math.max(0, Math.min(1, wilt));
    let body = "";
    if (stage === 0) {
      body = `<ellipse cx="60" cy="141" rx="5" ry="3.6" fill="${s.seed}" transform="rotate(-18 60 141)"/>` +
        `<path d="M57 140 q3 -2 6 0" stroke="#00000033" stroke-width="1" fill="none"/>`;
    } else if (species === "fern") body = fern(stage, w);
    else if (species === "monstera") body = monstera(stage, w);
    else if (species === "cactus") body = cactus(stage, w, s);
    else body = stemmed(species, stage, w, s);
    const inner = (opts.soil === false ? "" : soil(s)) + body;
    if (opts.inner) return inner;
    const vb = opts.viewBox || "0 0 120 160";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${opts.className || "plant"}" role="img" aria-label="${s.label}, ${STAGES[stage].toLowerCase()}${w > .4 ? ", wilting" : ""}">${inner}</svg>`;
  }

  // The growth rules, identical to the app's src/lib/streak.ts.
  const THRESHOLDS = [0, 1, 3, 7, 14, 30];
  function stageFor(total) { let s = 0; THRESHOLDS.forEach((m, i) => { if (total >= m) s = i; }); return s; }
  // 0 missed days -> healthy; 1 -> thirsty; 2+ -> dry.
  function wiltFor(missedDays) { return missedDays <= 0 ? 0 : missedDays === 1 ? 0.55 : 1; }

  const api = { plantSVG, SPECIES, STAGES, THRESHOLDS, stageFor, wiltFor, mix, C };
  if (typeof module !== "undefined") module.exports = api; else root.GardenArt = api;
})(typeof window !== "undefined" ? window : globalThis);
