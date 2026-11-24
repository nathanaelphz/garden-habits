// The garden scene as an SVG string: sky by hour, hills, bed, plants, decorations.
import { plantSVG } from "./plant-art.js";
import type { DecorId } from "./garden";

export type ScenePlant = { species: string; stage: number; wilt: number; x: number; s?: number };
export type Sky = "dawn" | "day" | "dusk" | "night";

const SKY: Record<Sky, [string, string, string]> = {
  dawn: ["#2B3B4A", "#7C8C93", "#E8B07A"],
  day: ["#4F7E92", "#8DB4B8", "#D7D7B0"],
  dusk: ["#2A2B47", "#7A4F5C", "#E9935C"],
  night: ["#0A1220", "#14243A", "#24364A"],
};
const r = (n: number) => Math.round(n * 10) / 10;

// Mature heights differ by species (fern ≈61, tulip ≈135 viewBox units), so a 30-day fern
// drew smaller than a 3-day tulip. These factors bring every species to ≈130 at full bloom.
const SPECIES_SCALE: Record<string, number> = { fern: 1.55, cactus: 1.4, monstera: 1.4 };

export function sceneSVG(
  id: string,
  w: number,
  h: number,
  plants: ScenePlant[],
  opts: { sky?: Sky; decor?: DecorId[]; groundAt?: number; plantScale?: number; fade?: boolean; rain?: boolean; label?: string } = {},
): string {
  const sky = opts.sky ?? "day";
  const [s1, s2, s3] = SKY[sky];
  const night = sky === "night";
  const ground = h * (opts.groundAt ?? 0.74);
  const decor = new Set(opts.decor ?? []);
  let s = `<svg role="img" aria-label="${opts.label ?? "Your garden"}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset=".6" stop-color="${s2}"/><stop offset="1" stop-color="${s3}"/></linearGradient>` +
    `<linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1712" stop-opacity="0"/><stop offset="1" stop-color="#0E1712"/></linearGradient>` +
    `<radialGradient id="${id}-sun"><stop offset="0" stop-color="${night ? "#F3F1FF" : "#FFE2A6"}" stop-opacity=".95"/><stop offset=".35" stop-color="${night ? "#C9C3EE" : "#FFD27A"}" stop-opacity=".3"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#${id}-sky)"/>`;
  if (night) for (let i = 0; i < 32; i++) s += `<circle cx="${r((i * 137.5) % w)}" cy="${r((i * 53.3) % (ground * 0.6))}" r="${i % 5 ? 0.8 : 1.3}" fill="#F3F1FF" opacity="${0.35 + (i % 3) * 0.2}"/>`;
  const sunY = ground * (sky === "day" ? 0.28 : night ? 0.22 : 0.62);
  s += `<circle cx="${r(w * 0.78)}" cy="${r(sunY)}" r="${r(Math.min(w, h) * 0.22)}" fill="url(#${id}-sun)"/><circle cx="${r(w * 0.78)}" cy="${r(sunY)}" r="${r(Math.min(w, h) * 0.045)}" fill="${night ? "#EDEBFF" : "#FFE7B0"}"/>`;
  const far = night ? "#16283A" : sky === "dusk" ? "#4A3F52" : "#5E7F79";
  const mid = night ? "#10211C" : sky === "dusk" ? "#2E3B33" : "#3C5E48";
  s += `<path d="M0 ${r(ground * 0.72)} C ${r(w * 0.2)} ${r(ground * 0.55)} ${r(w * 0.38)} ${r(ground * 0.78)} ${r(w * 0.58)} ${r(ground * 0.62)} S ${r(w * 0.9)} ${r(ground * 0.6)} ${w} ${r(ground * 0.7)} V ${h} H 0Z" fill="${far}"/>`;
  s += `<path d="M0 ${r(ground * 0.9)} C ${r(w * 0.25)} ${r(ground * 0.8)} ${r(w * 0.5)} ${r(ground * 0.92)} ${r(w * 0.72)} ${r(ground * 0.84)} S ${w} ${r(ground * 0.86)} ${w} ${r(ground * 0.88)} V ${h} H 0Z" fill="${mid}"/>`;
  s += `<rect x="0" y="${r(ground)}" width="${w}" height="${r(h - ground)}" fill="#2B1F17"/><path d="M0 ${r(ground)} Q ${r(w / 2)} ${r(ground - 10)} ${w} ${r(ground)} V ${r(ground + 8)} H 0Z" fill="#3D2C20"/>`;
  if (decor.has("path")) {
    s += `<path d="M${r(w * 0.12)} ${h} Q ${r(w * 0.45)} ${r(ground + 18)} ${r(w * 0.55)} ${r(ground + 4)}" stroke="#5A4635" stroke-width="${r(w * 0.05)}" fill="none" stroke-linecap="round" opacity=".7"/>`;
    for (let i = 0; i < 6; i++) s += `<ellipse cx="${r(w * (0.16 + i * 0.07))}" cy="${r(h - (h - ground) * (0.2 + i * 0.13))}" rx="${r(w * 0.018)}" ry="${r(w * 0.008)}" fill="#7A6A58" opacity=".8"/>`;
  }
  const scale = opts.plantScale ?? (ground / 160) * 0.62;
  if (decor.has("bench")) {
    // set back on the far bed, behind the plants, and sized with them so it never dominates a small scene
    const k = Math.min(1, Math.max(0.5, scale / 0.75)), bw = Math.min(w * 0.12, 90) * k;
    const bx = w * 0.42, by = ground - 14 * k;
    s += `<g transform="translate(${r(bx)} ${r(by)}) scale(${Math.round(k * 1000) / 1000})"><rect x="0" y="-22" width="${r(bw / k)}" height="5" rx="2" fill="#6B4E36"/><rect x="0" y="-34" width="${r(bw / k)}" height="4" rx="2" fill="#6B4E36"/><rect x="4" y="-22" width="4" height="22" fill="#4E3826"/><rect x="${r(bw / k - 8)}" y="-22" width="4" height="22" fill="#4E3826"/></g>`;
  }
  // plants, back to front
  for (const p of plants) {
    // normalise drawn height per species so on-screen size reads as the streak
    const sc = scale * (p.s ?? 1) * (SPECIES_SCALE[p.species] ?? 1), px = p.x * w - 60 * sc, py = ground + 6 - 148 * sc;
    s += `<g transform="translate(${r(px)} ${r(py)}) scale(${Math.round(sc * 1000) / 1000})">${plantSVG(p.species, p.stage, p.wilt, { inner: true, soil: true })}</g>`;
  }
  if (decor.has("lantern")) {
    const lx = Math.min(w * 0.92, w - 22);
    s += `<path d="M${r(lx)} ${r(ground + 4)} V ${r(ground - 46)}" stroke="#2A2A2A" stroke-width="2.4"/><rect x="${r(lx - 7)}" y="${r(ground - 62)}" width="14" height="18" rx="3" fill="#F2B13C" opacity=".95"/><circle cx="${r(lx)}" cy="${r(ground - 53)}" r="14" fill="#F2B13C" opacity="${night || sky === "dusk" ? 0.18 : 0.08}"/>`;
  }
  if (decor.has("chime")) {
    const cx = w * 0.88, cy = h * 0.06;
    s += `<path d="M${r(cx - 14)} ${r(cy)} H ${r(cx + 14)}" stroke="#9A8B6E" stroke-width="2"/>` + [0, 1, 2, 3].map((i) => `<path d="M${r(cx - 10 + i * 7)} ${r(cy)} v ${14 + i * 5}" stroke="#C9C2AE" stroke-width="2.4" stroke-linecap="round"/>`).join("");
  }
  for (let i = 0; i < Math.round(w / 9); i++) {
    const x = i * 9 + (i % 3) * 2, hh = 8 + ((i * 7) % 11);
    s += `<path d="M${x} ${h} q ${i % 2 ? 2 : -2} ${-hh / 2} ${i % 2 ? 4 : -1} ${-hh}" stroke="${night ? "#1F3A2A" : "#3F6E45"}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  if (night || sky === "dusk") for (let i = 0; i < 8; i++) {
    const fx = r((i * 97) % w), fy = r(ground - 20 - ((i * 41) % (ground * 0.4)));
    s += `<circle cx="${fx}" cy="${fy}" r="1.8" fill="#FFE7A0" opacity=".85"/><circle cx="${fx}" cy="${fy}" r="6" fill="#FFE7A0" opacity=".12"/>`;
  }
  if (opts.rain) for (let i = 0; i < 40; i++) s += `<path d="M${(i * 53) % w} ${(i * 31) % ground} l -3 9" stroke="#BFE0F2" stroke-width="1.2" opacity=".5" stroke-linecap="round"/>`;
  if (opts.fade) s += `<rect x="0" y="${r(h * 0.62)}" width="${w}" height="${r(h * 0.38)}" fill="url(#${id}-fade)"/>`;
  return s + "</svg>";
}

/** Evenly spaced x positions for n plants. */
export function plotPositions(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0.5];
  const left = n > 5 ? 0.08 : 0.14, right = 1 - left;
  return Array.from({ length: n }, (_, i) => left + ((right - left) * i) / (n - 1));
}
