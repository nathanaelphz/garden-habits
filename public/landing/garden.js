/* Garden landing page: the live surface.
   Everything on screen is computed from the sample log below with the app's
   real rules (src/lib/streak.ts): growth stages at 1, 3, 7, 14, 30 check-ins,
   thirsty after one missed day, dry after two, a rain day per 7 full days. */
(function () {
  "use strict";
  const A = window.GardenArt, I = window.GardenIcons;
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const icon = (n, s = 18) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;

  // ------------------------------------------------------------ the sample
  const HABITS = [
    { id: "read", name: "Read 20 min", sp: "sunflower", x: 0.3 },
    { id: "water", name: "Drink 8 glasses", sp: "fern", x: 0.52 },
    { id: "walk", name: "Morning walk", sp: "tulip", x: 0.73 },
  ];
  // The only two misses in the sample month.
  const didIt = (id, d) => !(id === "read" && d === 12) && !(id === "walk" && d === 20);
  let choice = null; // "rain" | "water" | null, set by the visitor in act 4

  function simulate(D, opts = {}) {
    const st = {}, events = [];
    HABITS.forEach((h) => (st[h.id] = { total: 0, streak: 0, best: 0, missed: 0, broken: 0, coveredDays: [] }));
    let held = 0, run = 0, earned = 0, used = 0, unlockedOn = 0;
    const days = [];
    for (let d = 1; d <= D; d++) {
      let full = true, rainy = false;
      const ev = [];
      HABITS.forEach((h) => {
        const s = st[h.id];
        const cover = !didIt(h.id, d) && h.id === "read" && d === 12 && choice === "rain" && (D >= 13 || opts.afterChoice) && held > 0;
        if (didIt(h.id, d)) {
          // Streak-driven: a check-in after a miss (no rain day) starts the plant over.
          const restarted = s.missed > 0 && s.broken > 0;
          const before = stageOf(s);
          s.total++; s.streak++; s.missed = 0;
          if (restarted) { ev.push({ k: "restart", h, lost: s.broken }); s.broken = 0; }
          else {
            const after = stageOf(s);
            if (after !== before) ev.push({ k: "grow", h, stage: after });
          }
        } else if (cover) {
          s.streak++; s.missed = 0; held--; used++; rainy = true; s.coveredDays.push(d);
          ev.push({ k: "rain", h });
        } else {
          if (s.streak > 0) s.broken = s.streak;
          s.streak = 0; s.missed++; full = false;
          ev.push({ k: "thirsty", h });
        }
        s.best = Math.max(s.best, s.streak);
        if (!unlockedOn && s.streak >= 21) { unlockedOn = d; ev.push({ k: "unlock", h }); }
      });
      if (full) { run++; if (run === 7) { run = 0; if (held < 3) { held++; earned++; ev.push({ k: "earned" }); } } }
      else run = 0;
      days.push({ d, full, rainy, partial: !full });
      events[d] = ev;
    }
    return { D, st, held, earned, used, unlockedOn, days, events: events[D] || [] };
  }

  const wiltOf = (s) => A.wiltFor(s.missed);
  // Stage follows the streak; a thirsty or dry plant still shows the streak it is about to lose.
  function stageOf(s) { return A.stageFor(s.missed > 0 ? s.broken : s.streak); }
  const nextTxt = (t) => { const s = A.stageFor(t), n = A.THRESHOLDS[s + 1]; return n ? `${n - t} more to ${A.STAGES[s + 1].toLowerCase()}` : "fully grown"; };

  function eventText(ev) {
    const pick = ev.find((e) => e.k === "unlock") || ev.find((e) => e.k === "earned") || ev.find((e) => e.k === "rain") || ev.find((e) => e.k === "restart") || ev.find((e) => e.k === "thirsty") || ev.slice().reverse().find((e) => e.k === "grow");
    if (!pick) return null;
    const plantName = (h) => A.SPECIES[h.sp].label.toLowerCase();
    switch (pick.k) {
      case "unlock": return { ic: "sparkles", tone: "amber", t: `Moonflower unlocked. ${pick.h.name}, 21 days in a row.` };
      case "earned": return { ic: "cloud-rain", tone: "water", t: "Rain day earned. 7 full days in a row." };
      case "rain": return { ic: "cloud-rain", tone: "water", t: `Rain day used. ${pick.h.name} keeps its streak.` };
      case "restart": return { ic: "droplet", tone: "straw", t: `No rain day, so the ${pick.lost} day streak is gone. The ${plantName(pick.h)} starts again.` };
      case "thirsty": return { ic: "droplet", tone: "straw", t: `${pick.h.name} was missed. The ${plantName(pick.h)} is thirsty.` };
      case "grow": return { ic: "sprout", tone: "amber", t: pick.stage === 5 ? `Your ${plantName(pick.h)} is fully grown.` : `Your ${plantName(pick.h)} ${pick.stage === 4 ? "bloomed" : "grew into a " + A.STAGES[pick.stage].toLowerCase()}.` };
    }
  }

  // ------------------------------------------------------------ plant art
  function plantEl(sp, stage, wilt) {
    const d = document.createElement("div");
    d.className = "plant__art";
    d.innerHTML = A.plantSVG(sp, stage, wilt, { className: "plant__svg" });
    return d;
  }
  // A plant node that crossfades when its stage or wilt changes.
  function makePlant(host, sp) {
    let key = "";
    return {
      set(stage, wilt, pop = true) {
        const k = stage + ":" + wilt;
        if (k === key) return;
        const grew = key && +key.split(":")[0] < stage;
        key = k;
        const next = plantEl(sp, stage, wilt);
        const prev = $$(".plant__art", host);
        if (!RM && prev.length) { next.classList.add("is-entering"); if (grew && pop) next.classList.add("is-growing"); }
        host.appendChild(next);
        if (!RM && prev.length) {
          requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove("is-entering")));
          setTimeout(() => prev.forEach((p) => p.remove()), 420);
        } else prev.forEach((p) => p.remove());
      },
    };
  }
  function thumb(sp, stage, wilt, size = 46) {
    const tall = [16, 30, 52, 80, 104, 118][stage] + 14, s = Math.max(tall, 44);
    return `<svg aria-hidden="true" viewBox="${60 - s / 2 + (wilt > .4 ? 8 : 0)} ${153 - s} ${s} ${s}" width="${size}" height="${size}">${A.plantSVG(sp, stage, wilt, { inner: true })}</svg>`;
  }

  // ------------------------------------------------------------ the garden scene
  // Layered: sky, sun, stars, far hills, mid hedge, bed, plants, foreground.
  // Each layer carries data-depth; the hero moves them at different rates.
  const SKY = [ // t: 0 day, .5 dusk, 1 night
    ["#4F7E92", "#8DB4B8", "#D9D6AE"],
    ["#2A2B47", "#7A4F5C", "#E9935C"],
    ["#070D18", "#10203A", "#1C2E44"],
  ];
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixHex = (a, b, t) => "rgb(" + hexRgb(a).map((v, i) => Math.round(lerp(v, hexRgb(b)[i], t))).join(",") + ")";
  function skyAt(t) {
    const seg = t < .5 ? 0 : 1, u = t < .5 ? t / .5 : (t - .5) / .5;
    return SKY[seg].map((c, i) => mixHex(c, SKY[seg + 1][i], u));
  }

  function buildScene(el, { plots = HABITS, extraPlot = false, dawn = false } = {}) {
    el.classList.add("scene");
    const W = 1200, H = 700;
    const stars = Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 197.3) % W}" cy="${(i * 71.7) % 380}" r="${i % 6 ? 1.1 : 1.8}" fill="#F3F1FF" opacity="${.35 + (i % 3) * .22}"/>`).join("");
    let grass = "";
    for (let i = 0; i < 150; i++) { const x = i * 8 + (i % 3) * 2.5, hh = 14 + (i * 7 % 19); grass += `<path d="M${x} ${H} q ${i % 2 ? 4 : -4} ${-hh / 2} ${i % 2 ? 7 : -2} ${-hh}" stroke="var(--grass)" stroke-width="3" fill="none" stroke-linecap="round"/>`; }
    const leaf = (x, y, r, s, c) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C40 -48 110 -42 140 0 C110 34 40 36 0 0Z" fill="${c}"/><path d="M8 0 Q70 -4 128 0" stroke="#1E3A27" stroke-width="3" fill="none" opacity=".5"/></g>`;
    el.innerHTML = `
<svg class="scene__layer scene__sky" data-depth="0" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="${el.id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color: var(--sky1)"/><stop offset=".62" style="stop-color: var(--sky2)"/><stop offset="1" style="stop-color: var(--sky3)"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${el.id}-sky)"/></svg>
<svg class="scene__layer scene__stars" data-depth=".05" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${stars}</svg>
<div class="scene__layer scene__sun" data-depth=".1" aria-hidden="true"><span></span></div>
<svg class="scene__layer scene__far" data-depth=".22" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 330 C 220 240 420 380 640 300 S 1000 260 1200 320 V ${H} H 0Z" style="fill: var(--far)"/></svg>
<svg class="scene__layer scene__mid" data-depth=".42" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 450 C 260 395 520 470 760 425 S 1100 430 1200 440 V ${H} H 0Z" style="fill: var(--mid)"/><g style="fill: var(--mid)">${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${60 + i * 140}" cy="${440 + (i % 3) * 8}" rx="${70 + (i % 2) * 20}" ry="${34 + (i % 3) * 6}"/>`).join("")}</g></svg>
<svg class="scene__layer scene__bed" data-depth=".62" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect x="0" y="540" width="${W}" height="${H - 540}" fill="#2A1E16"/><path d="M0 540 Q 600 515 1200 540 V 556 H 0Z" fill="#3D2C20"/><path d="M120 ${H} Q 520 600 620 552" stroke="#4E3B2C" stroke-width="56" fill="none" stroke-linecap="round" opacity=".6"/></svg>
<div class="scene__layer scene__plants" data-depth=".62">${plots.map((h) => `<div class="plant" data-plant="${h.id}" style="--x: ${h.x}"><span class="plant__tag" hidden></span></div>`).join("")}${extraPlot ? `<div class="plant plant--extra" data-plant="moon" style="--x: .89"><span class="plant__tag">New: Moonflower</span></div>` : ""}</div>
<div class="scene__layer scene__flies" data-depth=".7" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<span style="left: ${(i * 61) % 100}%; top: ${30 + (i * 23) % 40}%; animation-delay: ${-(i * .7)}s"></span>`).join("")}</div>
<svg class="scene__layer scene__fg" data-depth="1" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${grass}${leaf(-30, 690, -38, 1.5, "#2F5E3A")}${leaf(-10, 700, -18, 1.1, "#3E7347")}${leaf(1230, 690, 218, 1.5, "#2F5E3A")}${leaf(1215, 700, 198, 1.05, "#4C8A50")}</svg>`;
    const plants = {};
    $$(".plant", el).forEach((p) => (plants[p.dataset.plant] = makePlant(p, p.dataset.plant === "moon" ? "moonflower" : HABITS.find((h) => h.id === p.dataset.plant).sp)));
    const api = {
      el, plants,
      time(t) { // 0 day .. 1 night
        const [a, b, c] = skyAt(t);
        el.style.setProperty("--sky1", a); el.style.setProperty("--sky2", b); el.style.setProperty("--sky3", c);
        el.style.setProperty("--night", clamp((t - .55) / .45).toFixed(3));
        el.style.setProperty("--far", mixHex(t < .5 ? "#5E7F79" : "#4A3F52", t < .5 ? "#4A3F52" : "#14253A", t < .5 ? t * 2 : (t - .5) * 2));
        el.style.setProperty("--mid", mixHex(t < .5 ? "#3C5E48" : "#2E3B33", t < .5 ? "#2E3B33" : "#0E1F1A", t < .5 ? t * 2 : (t - .5) * 2));
        el.style.setProperty("--grass", mixHex("#3F6E45", "#1F3A2A", clamp(t)));
        el.style.setProperty("--sun-y", (18 + t * 44).toFixed(1) + "%");
        el.style.setProperty("--sun-c", t > .6 ? "#EDEBFF" : "#FFE7B0");
      },
      show(sim) {
        HABITS.forEach((h) => { if (plants[h.id]) { const s = sim.st[h.id]; plants[h.id].set(stageOf(s), wiltOf(s)); } });
      },
    };
    api.time(dawn ? .08 : 0);
    return api;
  }

  // ------------------------------------------------------------ today list
  function buildToday(el) {
    el.innerHTML = HABITS.map((h) => `<li class="row" data-row="${h.id}"><span class="row__thumb"></span><span class="row__text"><span class="row__name">${h.name}</span><span class="row__meta"></span></span><span class="row__check" aria-hidden="true">${icon("check", 20)}</span></li>`).join("");
    return {
      show(sim, D) {
        HABITS.forEach((h) => {
          const row = $(`[data-row="${h.id}"]`, el), s = sim.st[h.id];
          const did = D > 0 && (didIt(h.id, D) || s.coveredDays.includes(D));
          const stage = stageOf(s), wilt = wiltOf(s);
          const tk = stage + ":" + wilt;
          if (row.dataset.k !== tk) { row.dataset.k = tk; $(".row__thumb", row).innerHTML = thumb(h.sp, stage, wilt); }
          row.classList.toggle("is-done", did);
          row.classList.toggle("is-thirsty", wilt > 0);
          $(".row__meta", row).textContent = wilt > 0 ? `Thirsty · ${s.broken} day streak at risk` : `${A.STAGES[stage]} · ${s.streak} day streak · ${nextTxt(s.streak)}`;
        });
      },
    };
  }

  // ------------------------------------------------------------ toast
  function toaster(el) {
    let last = "";
    return (ev) => {
      const t = ev && eventText(ev);
      const key = t ? t.t : "";
      if (key === last) return;
      last = key;
      if (!t) { el.classList.remove("is-on"); return; }
      el.className = "toast is-on toast--" + t.tone;
      el.innerHTML = icon(t.ic, 17) + `<span>${t.t}</span>`;
    };
  }

  // ------------------------------------------------------------ progress
  const progOf = (act) => {
    const v = parseFloat(act.style.getPropertyValue("--sc-p"));
    if (!isNaN(v)) return v;
    const r = act.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight));
  };
  const flowProg = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (r.height + innerHeight)); };

  // ============================================================ wiring
  document.addEventListener("DOMContentLoaded", () => {
    const acts = {
      hero: $("#day-one"), week: $("#first-week"), dry: $("#day-twelve"), rain: $("#rain"), peak: $("#month"), seeds: $("#seeds"), plant: $("#plant"),
    };

    // ---- hero: day 1 morning, operable
    const heroScene = buildScene($("#hero-scene"), { dawn: true });
    const heroSim = { st: {} };
    const heroDone = new Set();
    const heroShow = () => {
      HABITS.forEach((h) => heroScene.plants[h.id].set(heroDone.has(h.id) ? 1 : 0, 0));
      $$("#hero-today [data-water]").forEach((b) => {
        const on = heroDone.has(b.dataset.water);
        b.setAttribute("aria-pressed", on);
        b.classList.toggle("is-done", on);
        b.closest(".row").classList.toggle("is-done", on);
        b.closest(".row").querySelector(".row__meta").textContent = on ? "Sprout · 2 to Seedling · 1 day streak" : "Seed · water it to sprout";
        b.closest(".row").querySelector(".row__thumb").innerHTML = thumb(HABITS.find((h) => h.id === b.dataset.water).sp, on ? 1 : 0, 0);
        b.setAttribute("aria-label", (on ? "Undo " : "Water ") + HABITS.find((h) => h.id === b.dataset.water).name);
      });
      $("#hero-count").textContent = heroDone.size;
    };
    $$("#hero-today [data-water]").forEach((b) => b.addEventListener("click", () => { heroDone.has(b.dataset.water) ? heroDone.delete(b.dataset.water) : heroDone.add(b.dataset.water); heroShow(); }));
    heroShow();

    // ---- act 2: first week
    const weekScene = buildScene($("#week-scene"));
    const weekToday = buildToday($("#week-today"));
    const weekToast = toaster($("#week-toast"));

    // ---- act 3: day twelve, healthy underneath, dry wiped over
    const dryBase = buildScene($("#dry-base"));
    const dryTop = buildScene($("#dry-top"));
    dryBase.show(simulate(11)); dryBase.time(.12);
    const d12 = simulate(12);
    // the whole bed browns a little, the sunflower droops
    dryTop.show(d12); dryTop.time(.4);
    $("#dry-top").style.setProperty("--grass", "#6B6A3E");

    // ---- act 4: the choice
    const rainPlant = makePlant($("#rain-plant"), "sunflower");
    const rainStatus = $("#rain-status");
    const showChoice = () => {
      const s = choice === "rain" ? simulate(12, { afterChoice: true }) : choice === "water" ? simulate(13) : d12;
      const sf = s.st.read;
      rainPlant.set(choice === "water" ? 1 : stageOf(sf), choice ? 0 : wiltOf(sf));
      $$("[data-choice]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.choice === choice));
      rainStatus.textContent = choice === "rain" ? `Rain day used. Day 12 counts as watered, so the streak lives on at ${sf.streak} days. Rain days left: ${s.held}.`
        : choice === "water" ? `Watered on day 13 without a rain day. The 11 day streak is gone, so the sunflower starts again as a sprout.`
        : "Thirsty since yesterday. Choose how to save it.";
      $("#rain-held").textContent = choice === "rain" ? "0 saved" : "1 saved";
    };
    $$("[data-choice]").forEach((b) => b.addEventListener("click", () => { choice = b.dataset.choice; showChoice(); render(true); }));
    showChoice();

    // ---- act 5: the month
    const peakScene = buildScene($("#peak-scene"), { extraPlot: true });
    const peakToast = toaster($("#peak-toast"));
    const peakDay = $("#peak-day");

    // ---- act 6: seed rail
    $$(".specimen").forEach((c) => {
      const sp = c.dataset.sp;
      $(".specimen__art", c).innerHTML = A.plantSVG(sp, 5, 0, { className: "specimen__svg" });
      $(".specimen__stages", c).innerHTML = [0, 1, 2, 3, 4, 5].map((s) => `<span title="${A.STAGES[s]}">${thumb(sp, s, 0, 34)}</span>`).join("");
    });

    // ---- act 7: plant yours
    const ghost = $("#my-ghost");
    const setGhost = (sp) => { ghost.innerHTML = A.plantSVG(sp, 4, 0, { soil: false, className: "ghost__svg" }); $("#my-ghost-label").textContent = `A ${A.SPECIES[sp].label.toLowerCase()} blooms at 14 check-ins`; };
    setGhost("sunflower");
    const myPlant = makePlant($("#my-plant"), "sunflower");
    let mySp = "sunflower", myStage = -1;
    const cta = $("#cta");
    const syncCta = () => {
      const name = $("#my-habit").value.trim();
      const base = cta.dataset.appUrl || "/";
      const q = new URLSearchParams(); if (name) q.set("habit", name); q.set("plant", mySp);
      cta.href = base + (base.includes("?") ? "&" : "?") + q.toString();
    };
    $$("[name=my-sp]").forEach((r) => r.addEventListener("change", () => {
      mySp = r.value;
      setGhost(mySp);
      $("#my-plant").innerHTML = "";
      const p = makePlant($("#my-plant"), mySp); myPlantRef = p;
      p.set(Math.max(myStage, 0), 0);
      syncCta();
    }));
    let myPlantRef = myPlant;
    myPlantRef.set(0, 0);
    $("#my-habit").addEventListener("input", syncCta);
    const status = $("#plant-status"), go = $("#plant-go");
    $("#plant-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#my-habit").value.trim();
      if (!name) { status.textContent = "Name the habit first, then plant it."; $("#my-habit").focus(); return; }
      if (myStage < 0) { myStage = 0; myPlantRef.set(0, 0); status.textContent = `Planted. Check in on "${name}" today and it sprouts.`; go.textContent = "Water it"; }
      else if (myStage === 0) { myStage = 1; myPlantRef.set(1, 0); status.textContent = `It sprouted. Two more days of "${name}" and it becomes a seedling.`; go.textContent = "Planted"; go.disabled = true; }
      syncCta();
    });
    syncCta();

    // ---- the status bar trace (signature): scroll is the calendar
    const trace = $("#trace"), traceDay = $("#trace-day");
    trace.innerHTML = Array.from({ length: 30 }, (_, i) => `<button type="button" class="trace__cell" data-day="${i + 1}" aria-label="Jump to day ${i + 1}"></button>`).join("");
    const cells = $$(".trace__cell", trace);

    // Jumping: map a day back to a scroll position inside the act that shows it.
    const yFor = (d) => {
      const at = (el, p) => { const top = el.getBoundingClientRect().top + scrollY; return top + p * Math.max(0, el.offsetHeight - innerHeight); };
      if (d <= 1) return at(acts.week, 0.02);
      if (d <= 11) return at(acts.week, (d - 1) / 10 * .92 + .04);
      if (d <= 12) return acts.dry.getBoundingClientRect().top + scrollY - innerHeight * .1;
      return at(acts.peak, .14 + (d - 13) / 17 * .62);
    };
    cells.forEach((c) => c.addEventListener("click", () => scrollTo({ top: yFor(+c.dataset.day), behavior: RM ? "auto" : "smooth" })));

    const tabs = $$(".tabs a");
    let lastD = -1, lastTab = "";

    function globalDay() {
      const p5 = progOf(acts.peak), p2 = progOf(acts.week);
      const r5 = acts.peak.getBoundingClientRect(), r3 = acts.dry.getBoundingClientRect(), r2 = acts.week.getBoundingClientRect();
      if (r5.top <= 0) return peakDayFrom(p5);
      if (r3.top < innerHeight * .6) return 12;
      if (r2.top <= 0) return weekDayFrom(p2);
      return 0;
    }
    const weekDayFrom = (p) => Math.max(1, Math.min(11, 1 + Math.floor(clamp((p - .04) / .92) * 11)));
    const peakDayFrom = (p) => Math.max(13, Math.min(30, 13 + Math.floor(clamp((p - .14) / .62) * 18)));

    function render(force) {
      // act 2
      const p2 = progOf(acts.week);
      const wd = weekDayFrom(p2);
      if (force || weekScene._d !== wd) {
        weekScene._d = wd;
        const s = simulate(wd);
        weekScene.show(s); weekToday.show(s, wd);
        $("#week-day").textContent = `Day ${wd}`;
        $("#week-held").textContent = s.held;
        weekToast(s.events);
      }
      weekScene.time(clamp(p2) * .22);

      // act 5
      const p5 = progOf(acts.peak);
      const pd = peakDayFrom(p5);
      const el5 = acts.peak;
      el5.style.setProperty("--open", clamp(p5 / .12).toFixed(3));
      peakScene.time(p5 < .76 ? clamp((p5 - .14) / .62) * .46 : .46 + clamp((p5 - .76) / .12) * .54);
      el5.style.setProperty("--moon", clamp((p5 - .84) / .06).toFixed(3));
      if (force || peakScene._d !== pd) {
        peakScene._d = pd;
        const s = simulate(pd);
        peakScene.show(s);
        peakDay.textContent = `Day ${pd}`;
        peakToast(s.events);
        if (pd >= 21) peakScene.plants.moon.set(0, 0);
        const s30 = simulate(30);
        $("#sum-read").textContent = `${s30.st.read.total} of 30`;
        $("#sum-water").textContent = `${s30.st.water.total} of 30`;
        $("#sum-walk").textContent = `${s30.st.walk.total} of 30`;
        $("#sum-streak").textContent = `${Math.max(...HABITS.map((h) => s30.st[h.id].best))} days`;
        $("#sum-rain").textContent = `${s30.earned} earned, ${s30.used} used`;
      }
      el5.classList.toggle("is-night", p5 > .86);

      // trace
      const D = globalDay();
      if (force || D !== lastD) {
        lastD = D;
        const s = simulate(Math.max(D, 0), { afterChoice: D >= 12 });
        cells.forEach((c, i) => {
          const day = s.days[i];
          c.className = "trace__cell" + (day ? (day.rainy ? " is-rain" : day.full ? " is-full" : " is-partial") : "") + (i + 1 === D ? " is-now" : "");
          c.setAttribute("aria-label", `Day ${i + 1}${day ? (day.rainy ? ", rain day used" : day.full ? ", all watered" : ", one habit missed") : ""}. Jump there.`);
        });
        traceDay.textContent = D === 0 ? "Day 1 · morning" : D === 12 ? "Day 12 · one missed" : `Day ${D}`;
        trace.closest("[data-sc-verify-state]").setAttribute("data-sc-verify-state", "d" + D);
      }
      // active tab
      const mid = innerHeight * .45;
      let cur = "day-one";
      [["day-one", acts.hero], ["first-week", acts.week], ["day-twelve", acts.dry], ["month", acts.peak], ["seeds", acts.seeds], ["plant", acts.plant]].forEach(([id, el]) => { if (el.getBoundingClientRect().top < mid) cur = id; });
      const tabFor = { "day-one": "first-week", "first-week": "first-week", "day-twelve": "day-twelve", rain: "day-twelve", month: "month", seeds: "seeds", plant: "plant" }[cur];
      if (tabFor !== lastTab) { lastTab = tabFor; tabs.forEach((t) => t.toggleAttribute("aria-current", t.getAttribute("href") === "#" + tabFor)); }

      // hero parallax (scroll), pointer handled below
      const hp = clamp(scrollY / innerHeight);
      if (!RM) $$("#hero-scene .scene__layer").forEach((l) => { l.style.setProperty("--ty", (hp * (1 - +l.dataset.depth) * -120 * -1).toFixed(1) + "px"); });
    }

    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; render(false); }); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    // the engine writes --sc-p in its own frame loop; follow it
    if (window.ScrollCraft) { (function loop() { render(false); requestAnimationFrame(loop); })(); }
    render(true);

    // pointer depth on the hero: the world leans, slightly
    if (FINE && !RM) {
      const hero = $("#hero-scene");
      let mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
      hero.closest(".hero").addEventListener("pointermove", (e) => { const r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; if (!raf) raf = requestAnimationFrame(step); });
      function step() {
        tx = lerp(tx, mx, .08); ty = lerp(ty, my, .08);
        $$(".scene__layer", hero).forEach((l) => { const d = +l.dataset.depth; l.style.setProperty("--px", (tx * d * -26).toFixed(2) + "px"); l.style.setProperty("--py", (ty * d * -10).toFixed(2) + "px"); });
        raf = Math.abs(tx - mx) + Math.abs(ty - my) > .001 ? requestAnimationFrame(step) : 0;
      }
    }
  });
})();
