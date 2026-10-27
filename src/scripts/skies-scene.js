// Skies: the home-page ASCII sky (Appa, Momo, Aang, Toothless, the Light Fury and the Night Lights).
// Ported from the Skies artifact; the theme follows the site's `.dark` class set by ThemeToggle.
export function startSkies(cvs) {
  const ctx = cvs.getContext('2d', { alpha: false });
  const GL = '·:;~%sSX8@-o~/\\|'; // 0-9 density ramp, then forced glyphs
  const G_DASH = 10, G_O = 11, G_WAVE = 12, G_SL = 13, G_BS = 14, G_BAR = 15;
  const FONT = '"Geist Mono", ui-monospace, Menlo, monospace';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- helpers + noise ---
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];
  const wrap = (v, n) => ((v % n) + n) % n;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const hash = (x, y, z) => {
    let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const sm = t => t * t * (3 - 2 * t);
  const vn = (x, y, z = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
    const a = hash(xi, yi, z), b = hash(xi + 1, yi, z), c = hash(xi, yi + 1, z), d = hash(xi + 1, yi + 1, z);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  // value noise that repeats every P lattice cells in x, so cloud strips wrap seamlessly
  const pn = (x, y, z, P) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi), x0 = wrap(xi, P), x1 = wrap(xi + 1, P);
    const a = hash(x0, yi, z), b = hash(x1, yi, z), c = hash(x0, yi + 1, z), d = hash(x1, yi + 1, z);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const segDist = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay, t = clamp01(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy));
    return Math.hypot(px - ax - vx * t, py - ay - vy * t);
  };
  const dirGlyph = (dx, dy) => Math.abs(dx) > 2 * Math.abs(dy) ? G_DASH : Math.abs(dy) > 2 * Math.abs(dx) ? G_BAR : dx * dy < 0 ? G_SL : G_BS;

  // --- cell buffers ---
  let cs, cpx, cols, rows, U, dpr, D, R, G, B, O, F, bg, glowC, glowS, glowI, shadC, shadS, shadI;
  let light = false, FG = 0; // FG: currently drawing a solid flier (casts a shadow in light mode)
  let layers = [], parts = [], blasts = [], tooth = {}, aangOff = [0, 0], momoOff = [0, 0];
  let lastT = 0, nextSwirl = 0, swirlEnd = 0, nextWind = 0;
  const P = { x: 0, y: 0, on: false, last: -1e9 };
  const ZERO = [0, 0];

  // op < 1 = translucent: blends over what is already there instead of punching a hole. gl forces a glyph.
  const putc = (x, y, d, r, g, b, op = 1, gl = -1) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= cols || y >= rows || d < 0.04) return;
    const i = y * cols + x, od = D[i];
    if (op >= 1 || !od) { D[i] = d; R[i] = r; G[i] = g; B[i] = b; O[i] = gl; F[i] = FG ? d : 0; return; }
    D[i] = Math.max(od, d);
    R[i] += (r - R[i]) * op; G[i] += (g - G[i]) * op; B[i] += (b - B[i]) * op;
    if (gl >= 0 && op > 0.5) O[i] = gl;
    if (FG) F[i] = Math.max(F[i], d);
  };
  const put = (x, y, d, c, op, gl) => putc(x, y, d, c[0], c[1], c[2], op, gl);
  const small = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // Glyphs are pre-rendered once per (quantised) colour, then blitted.
  const atlases = new Map(), fills = new Map();
  const atlas = (r, g, b) => {
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    let a = atlases.get(key);
    if (!a) {
      if (atlases.size > 1500) atlases.clear();
      a = small(cpx * GL.length, cpx);
      const c = a.getContext('2d');
      c.font = `400 ${Math.round(cpx * 0.74)}px ${FONT}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = `rgb(${(key >> 8) * 17},${((key >> 4) & 15) * 17},${(key & 15) * 17})`;
      for (let k = 0; k < GL.length; k++) c.fillText(GL[k], k * cpx + cpx / 2, cpx * 0.54);
      atlases.set(key, a);
    }
    return a;
  };
  const fillOf = (r, g, b, al) => {
    const key = ((r >> 4) << 12) | ((g >> 4) << 8) | ((b >> 4) << 4) | al;
    let s = fills.get(key);
    if (!s) { s = `rgba(${(r >> 4) * 17},${(g >> 4) * 17},${(b >> 4) * 17},${(al / 15).toFixed(3)})`; fills.set(key, s); }
    return s;
  };

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const w = innerWidth, h = innerHeight;
    cs = Math.max(6, Math.min(10, Math.round(w / 170)));
    cpx = Math.round(cs * dpr);
    cols = Math.ceil(w / cs); rows = Math.ceil(h / cs);
    U = Math.min(cols, rows) / 70;
    cvs.width = cols * cpx; cvs.height = rows * cpx;
    cvs.style.width = cols * cpx / dpr + 'px'; cvs.style.height = rows * cpx / dpr + 'px';
    const n = cols * rows;
    D = new Float32Array(n); O = new Int8Array(n); F = new Float32Array(n);
    R = new Uint8Array(n); G = new Uint8Array(n); B = new Uint8Array(n);
    atlases.clear();
    bg = small(cvs.width, cvs.height);
    buildBg();
    glowC = small(cols, rows); glowS = small(Math.ceil(cols / 5), Math.ceil(rows / 5));
    glowI = new ImageData(cols, rows);
    shadC = small(cols, rows); shadS = small(Math.ceil(cols / 2), Math.ceil(rows / 2));
    shadI = new ImageData(cols, rows);
    seed();
  }
  function buildBg() {
    const b = bg.getContext('2d'), W = cvs.width, H = cvs.height;
    const g = b.createLinearGradient(0, 0, 0, H);
    if (light) { g.addColorStop(0, '#f6f6f4'); g.addColorStop(1, '#e7e7ea'); }
    else { g.addColorStop(0, '#111113'); g.addColorStop(1, '#1a1a1d'); }
    b.fillStyle = g; b.fillRect(0, 0, W, H);
    b.strokeStyle = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.024)'; b.lineWidth = 1;
    b.beginPath();
    for (let x = 0; x <= cols; x++) { b.moveTo(x * cpx + 0.5, 0); b.lineTo(x * cpx + 0.5, H); }
    for (let y = 0; y <= rows; y++) { b.moveTo(0, y * cpx + 0.5); b.lineTo(W, y * cpx + 0.5); }
    b.stroke();
  }

  // --- clouds: three strips, each baked once and scrolled at its own speed ---
  function makeLayer({ speed, freq, aspect, thr, band, dmax, c0, c1, c0L, c1L, op, z }) {
    const W = Math.round(cols * 2.5), Lp = Math.max(2, Math.round(W * freq / U)), fx = Lp / W, fy = freq / U * aspect;
    const dens = new Float32Array(W * rows), lit = new Float32Array(W * rows);
    for (let y = 0; y < rows; y++) {
      const bnd = band(y / rows) * dmax;
      if (bnd < 0.02) continue;
      for (let x = 0; x < W; x++) {
        const n = 0.55 * pn(x * fx, y * fy, z, Lp) + 0.3 * pn(x * fx * 2, y * fy * 2, z + 1, Lp * 2) + 0.15 * pn(x * fx * 4, y * fy * 4, z + 2, Lp * 4);
        dens[y * W + x] = smooth(thr, thr + 0.16, n) * bnd;
      }
    }
    // lit tops, shaded bellies
    for (let i = 0; i < dens.length; i++) if (dens[i]) lit[i] = clamp01(0.55 + (dens[i] - (i + 2 * W < dens.length ? dens[i + 2 * W] : 0)) * 2.4);
    return { W, dens, lit, speed: speed * U, c0, c1, c0L, c1L, op };
  }
  function drawLayer(L, t) {
    const base = wrap(Math.floor(L.speed * t), L.W), [r0, g0, b0] = light ? L.c0L : L.c0, [r1, g1, b1] = light ? L.c1L : L.c1;
    for (let y = 0; y < rows; y++) {
      const row = y * L.W;
      for (let x = 0; x < cols; x++) {
        let j = base + x; if (j >= L.W) j -= L.W;
        const d = L.dens[row + j];
        if (d < 0.04) continue;
        const k = L.lit[row + j];
        putc(x, y, d, r0 + (r1 - r0) * k, g0 + (g1 - g0) * k, b0 + (b1 - b0) * k, L.op);
      }
    }
  }

  function seed() {
    layers = [
      makeLayer({ speed: 0.18, freq: 0.05, aspect: 2.2, thr: 0.56, band: v => 1 - smooth(0.5, 0.85, v), dmax: 0.22,
        c0: [92, 96, 108], c1: [148, 152, 164], c0L: [150, 156, 170], c1L: [178, 184, 196], op: 0.7, z: 40 }),
      makeLayer({ speed: 0.5, freq: 0.035, aspect: 2.6, thr: 0.54, band: v => Math.exp(-(((v - 0.4) / 0.2) ** 2)), dmax: 0.62,
        c0: [108, 112, 124], c1: [204, 206, 214], c0L: [140, 148, 166], c1L: [206, 210, 220], op: 0.8, z: 50 }),
      makeLayer({ speed: 1.3, freq: 0.025, aspect: 2.4, thr: 0.56,
        band: v => Math.max(Math.exp(-(((v - 0.93) / 0.13) ** 2)), 0.8 * Math.exp(-(((v - 0.04) / 0.08) ** 2))), dmax: 0.85,
        c0: [124, 128, 140], c1: [238, 238, 242], c0L: [132, 140, 160], c1L: [222, 224, 232], op: 0.72, z: 60 }),
    ];
    tooth = { first: true };
    parts = []; blasts = [];
  }

  // --- shared drawing ---
  const LIGHT = (() => { const v = [-0.5, -0.6, 0.62], m = Math.hypot(...v); return v.map(c => c / m); })();

  function sprite(bm, pal, ax, ay, ang, S, sy = 1, mul = 1) {
    const ca = Math.cos(ang), sa = Math.sin(ang), hw = bm[0].length / 2, hh = bm.length / 2, Sy = S * sy;
    const ext = Math.ceil(Math.hypot(hw, hh) * S) + 1;
    for (let y = -ext; y <= ext; y++) for (let x = -ext; x <= ext; x++) {
      const bx = Math.floor((x * ca + y * sa) / S + hw), by = Math.floor((-x * sa + y * ca) / Sy + hh);
      const ch = bm[by]?.[bx];
      if (!ch || ch === '.') continue;
      const e = pal[ch];
      put(ax + x, ay + y, e[1] * (0.86 + 0.14 * hash(bx, by, 3)) * mul, e[0], 1, e[2] ?? -1);
    }
  }
  // World position of bitmap cell (bx, by) on a sprite drawn by sprite().
  const local = (bm, ax, ay, ang, S, bx, by) => {
    const dx = (bx - bm[0].length / 2) * S, dy = (by - bm.length / 2) * S, ca = Math.cos(ang), sa = Math.sin(ang);
    return [ax + dx * ca - dy * sa, ay + dx * sa + dy * ca];
  };
  const spawn = (x, y, vx, vy, life, c, d, gl, wob = 0) =>
    parts.length < 900 && parts.push({ x, y, vx, vy, life, max: life, c, d, gl, wob, ph: rnd(0, 9) });

  // Pointer as wind: things near it get pushed away, fading out once it stops moving.
  function push(x, y) {
    if (!P.on) return ZERO;
    const fade = clamp01(1 - (performance.now() - P.last) / 3000);
    if (!fade) return ZERO;
    const dx = x - P.x, dy = y - P.y, d2 = dx * dx + dy * dy, Rr = 16 * U, d = Math.sqrt(d2) || 1;
    const f = 10 * U * Math.exp(-d2 / (Rr * Rr)) * fade;
    return [dx / d * f, dy / d * f];
  }
  const ease = (o, tgt, dt) => { const k = Math.min(1, dt * 4); o[0] += (tgt[0] - o[0]) * k; o[1] += (tgt[1] - o[1]) * k; };

  // --- Appa: drawn from shapes, not a bitmap, so he shades and scales cleanly ---
  // Cream coat; the brown arrow runs off his head into a spine stripe with three pointed bands down his side and
  // a stripe along his tail. Dark horns growing up and forward, dark grey chin and muzzle, pale eye, dark feet.
  const CREAM_L = [246, 240, 222], CREAM_D = [166, 158, 144], STRIPE = [170, 118, 68], STRIPE_D = [130, 86, 48];
  const HOOF = [76, 72, 74], HORN_DK = [110, 98, 86], HORN_TIP = [26, 26, 30], NOSE = [70, 66, 72];
  const CHIN_D = [62, 60, 64], CHIN_L = [124, 120, 120], EYE_PALE = [226, 218, 196], MOUTH_DK = [36, 34, 38];
  const SADDLE = [180, 86, 54], SADDLE_D = [112, 58, 40], REIN = [100, 62, 44];
  const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
  // A thick curved stroke sampled as short segments; returns how far along it (0..1) the point is, or -1.
  const stroke = (x, y, f, w0, w1, n) => {
    for (let k = 0; k < n; k++) {
      const [ax, ay] = f(k / n), [bx, by] = f((k + 1) / n);
      if (segDist(x, y, ax, ay, bx, by) < w0 + (w1 - w0) * (k + 0.5) / n) return (k + 0.5) / n;
    }
    return -1;
  };
  const creamShade = (nx, ny, x, y) => {
    const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, nx * nx + ny * ny)));
    const lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    return [(0.32 + 0.6 * lit) * (0.86 + 0.14 * vn(x * 1.4, y * 1.4, 33)), mix(CREAM_D, CREAM_L, lit)];
  };
  function appaAt(x, y, tail, legP) {
    const fur = (vn(x * 0.8 + 3, y * 0.8, 31) - 0.5) * 0.28; // shaggy outline
    for (const hx of [12.6, 16.2]) { // horns grow out of the head, up and forward
      const k = stroke(x, y, s => [hx + 3.4 * s, -4.4 - 6.8 * s + 1.4 * s * s], 1.15, 0.55, 6);
      if (k >= 0) return [0.88, k > 0.7 ? HORN_TIP : HORN_DK];
    }
    const hx = x - 15, hy = y + 1, he = (hx * hx) / 49 + (hy * hy) / 43.6;
    const jowl = ell(x, y, 18.4, 3.0, 4.4, 3.6); // the big dark chin that hangs below his face
    if (he < 1 + fur || jowl < 1) {
      if (ell(x, y, 19.4, -0.6, 0.9, 0.7) < 1) return [0.9, EYE_PALE];
      if (ell(x, y, 22.0, 0.9, 0.6, 0.5) < 1) return [0.9, NOSE];
      if (Math.abs(y - 3.4) < 0.45 && x > 17.6 && x < 21.8) return [0.75, MOUTH_DK];
      const top = -1 - 6.6 * Math.sqrt(Math.max(0, 1 - hx * hx / 49));
      const thick = x > 17 ? (21.8 - x) * 0.95 : 1.6;
      if (he < 1 && x > 8 && y - top < thick) return [0.88, STRIPE]; // the arrow, running back into the spine stripe
      if (jowl < 1 || (x > 13 && y > 1.5 - (x - 13) * 0.39)) {        // dark grey muzzle and chin
        const nx = (x - 18.4) / 4.4, ny = (y - 3.0) / 3.6, nz = Math.sqrt(Math.max(0, 1 - Math.min(1, nx * nx + ny * ny)));
        const lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
        return [0.62 + 0.25 * lit, mix(CHIN_D, CHIN_L, lit)];
      }
      if (ell(x, y, 12.4, 1.4, 1.6, 1.1) < 1) return [0.7, CREAM_L];   // small ear
      return creamShade(hx / 7, hy / 6.6, x, y);
    }
    if (segDist(x, y, 4.5, -8.4, 13, -5.5) < 0.38) return [0.72, REIN];
    const bodyTop = Math.abs(x) < 16 ? -8.8 * Math.sqrt(1 - (x * x) / 256) : 0;
    if (x > -7 && x < 4.5 && y > bodyTop - 1.8 && y < bodyTop + 0.9) { // saddle
      const rim = x < -6.2 || x > 3.7 || y < bodyTop - 1.1;
      return [0.84, rim ? SADDLE_D : SADDLE];
    }
    const ry = y > 0 ? 8 : 8.8, be = (x * x) / 256 + (y * y) / (ry * ry);
    if (be < 1 + fur) {
      let band = 0; // three pointed bands down his side, hanging off the spine stripe
      for (const c of [-9, 0, 9]) band = Math.max(band, 1 - Math.abs(x - c) / 2.8);
      if (y < bodyTop + 1.4 + 5.6 * band) return [0.86, y < bodyTop + 1.1 ? STRIPE_D : STRIPE];
      return creamShade(x / 16, y / ry, x, y);
    }
    for (const lx of [-9.5, -2.5, 5.2]) { // three visible legs, paddling slowly
      const sw = Math.sin(legP + lx * 0.4), cx = lx + sw * 0.5;
      if (Math.abs(x - cx) < 1.7 && y > 6 && y < 11.2 + sw * 0.4)
        return y > 10.1 + sw * 0.4 ? [0.8, HOOF] : [0.6 + 0.1 * vn(x, y, 7), CREAM_L];
    }
    // flat beaver tail, waggling, brown along the top in little points
    const tx = x + 15, ty = y - 1, ct = Math.cos(tail), st = Math.sin(tail);
    const u = tx * ct + ty * st, v = -tx * st + ty * ct;
    if ((u + 6.5) ** 2 / 42 + (v * v) / 6.8 < 1 + fur) {
      const f = ((u / 3.2) % 1 + 1) % 1, tooth = Math.pow(1 - Math.abs(2 * f - 1), 1.4);
      return v < -0.3 - 1.3 * tooth ? [0.86, STRIPE] : creamShade((u + 6.5) / 6.5, v / 2.6, x, y);
    }
    return null;
  }
  // Appa's path is a pure function of time, so Toothless can plan around where he will be.
  const appaS = () => Math.min(cols, rows) * 0.44 / 46;
  const appaX = t => { const S = appaS(); return wrap(t * 1.1 * U + cols * 0.35, cols + 70 * S) - 32 * S; };
  const APPA_FEET = 0.32; // high in the sky, clear of the intro text below
  const appaFeet = () => rows * APPA_FEET + 1.2 * U;
  function appa(t) {
    const S = appaS();
    const cx = appaX(t), cy = rows * APPA_FEET - 11.5 * S + Math.sin(t * 0.4) * 1.2 * U;
    const pitch = Math.cos(t * 0.4) * 0.05, ca = Math.cos(pitch), sa = Math.sin(pitch);
    const tail = Math.sin(t * 1.3) * 0.22, legP = t * 1.6, ex = Math.ceil(29 * S), ey = Math.ceil(14 * S);
    for (let y = -ey; y <= ey; y++) for (let x = -ex; x <= ex; x++) {
      const r = appaAt((x * ca + y * sa) / S, (-x * sa + y * ca) / S, tail, legP);
      if (r) put(cx + x, cy + y, r[0], r[1], 1);
    }
    if (Math.random() < 0.25) spawn(cx - 22 * S, cy + rnd(-4, 4) * S, -2 * U, 0, rnd(0.8, 1.4), [150, 154, 166], 0.22, G_DASH);
    return [cx, cy, S];
  }

  // --- bitmaps (pointing up; rotated to their heading) ---
  const MOMO_A = ['w..g..w', 'ww.g.ww', '.wgggw.', '...g...', '...t...'];
  const MOMO_B = ['...g...', '.wwgww.', 'wwgggww', '...g...', '...t...'];
  const MOMO_C = { w: [[150, 140, 128], 0.7], g: [[216, 212, 202], 0.82], t: [[120, 110, 100], 0.7] };
  const AANG = [
    '........t........',
    '........t........',
    '..RRRRRRtRRRRRR..',
    '.RRRRRRRtRRRRRRR.',
    'RRRRRRRRtRRRRRRRR',
    '.rrrrrrhBhrrrrrr.',
    '......hhBhh......',
    '.......yyy.......',
    '......oyyyo......',
    '.......yyy.......',
    '.......ooo.......',
    '........t........',
    '......RRtRR......',
    '.......RtR.......'];
  const AANG_C = { t: [[200, 164, 112], 0.84], R: [[206, 74, 52], 0.84], r: [[156, 54, 42], 0.8], h: [[238, 202, 162], 0.88],
    B: [[84, 156, 236], 0.95], y: [[246, 198, 62], 0.9], o: [[238, 130, 42], 0.88] };
  const TOOTH_A = [
    '.........kk.........',
    '........kkkk........',
    '.......ekkkke.......',
    '......K.kkkk.K......',
    '.........kk.........',
    '........kkkk........',
    'kk.....kkkkkk.....kk',
    'kkkk..kkkkkkkk..kkkk',
    '.kkkkkkkkkkkkkkkkkk.',
    '..kkkkkkkkkkkkkkkk..',
    '...kkkKKkkkkKKkkk...',
    '.....kk.kkkk.kk.....',
    '........kkkk........',
    '.......K.kk.K.......',
    '.........kk.........',
    '.........kk.........',
    '........fkkK........',
    '.......ff..KK.......'];
  const TOOTH_B = TOOTH_A.slice(0, 6).concat([
    '......kkkkkkkk......',
    '...kkkkkkkkkkkkkk...',
    '..kkkkkkkkkkkkkkkk..',
    '...kkkKKkkkkKKkkk...',
    '.....kkkkkkkkkk.....'], TOOTH_A.slice(11));
  // His tail fin is half red prosthetic (f), half black (K).
  const TOOTH_C = { k: [[74, 82, 104], 0.82], K: [[52, 58, 76], 0.76], e: [[140, 240, 120], 0.97], f: [[214, 52, 48], 0.88] };
  // The Light Fury: same build, pale scales, blue eyes, both tail fins her own.
  const LIGHTFURY_C = { k: [[228, 232, 240], 0.8], K: [[196, 204, 222], 0.74], e: [[110, 196, 255], 0.97], f: [[214, 222, 238], 0.78] };
  // Their three Night Lights, Momo-sized: Dart (white, green eyes), Pouncer (dark, white belly, blue eyes), Ruffrunner (black, green eyes).
  // round head, three-wide body, broad wings: upstroke (A) and downstroke (B)
  const KID_A = ['.....k.k.....', '....kkkkk....', '....kekek....', '.....kkk.....', 'kk...kbk...kk', '.kkkkkbkkkkk.',
    '..kkkkbkkkk..', '.....kbk.....', '.....kkk.....', '......k......', '.....k.k.....'];
  const KID_B = ['.....k.k.....', '....kkkkk....', '....kekek....', '.....kkk.....', '.....kbk.....', '...kkkbkkk...',
    '.kkkkkbkkkkk.', 'kk...kbk...kk', '.....kkk.....', '......k......', '.....k.k.....'];
  const KIDS = [
    { k: [[230, 234, 242], 0.82], b: [[244, 244, 248], 0.86], e: [[120, 226, 140], 0.97] },
    { k: [[72, 74, 90], 0.82], b: [[232, 232, 238], 0.86], e: [[110, 190, 255], 0.97] },
    { k: [[56, 60, 76], 0.82], b: [[88, 92, 108], 0.8], e: [[140, 240, 120], 0.97] },
  ];

  function wingtrail(bm, x, y, ang, S, tips, dx, dy, c) {
    const gl = dirGlyph(dx, dy);
    for (const [bx, by] of tips) {
      const [wx, wy] = local(bm, x, y, ang, S, bx, by);
      spawn(wx, wy, 0, 0, rnd(0.35, 0.7), c, 0.3, gl);
    }
  }

  function momo(ax, ay, S, t, dt) {
    // flits around just ahead of Appa's head, low enough to stay clear of the nav
    const lx = 26 + 5 * Math.sin(t * 0.83), ly = -4 + 4 * Math.sin(t * 1.9);
    const dx = 1.1 * U + 5 * S * 0.83 * Math.cos(t * 0.83), dy = 4 * S * 1.9 * Math.cos(t * 1.9);
    const x = ax + lx * S, y = ay + ly * S;
    ease(momoOff, push(x, y), dt);
    sprite(Math.floor(t * 9) % 2 ? MOMO_A : MOMO_B, MOMO_C, x + momoOff[0], y + momoOff[1], Math.atan2(dy, dx) + Math.PI / 2, 0.8 * U);
  }

  // Aang alternates direction every pass and picks a new cruising altitude each time.
  const AIR = [[120, 188, 255], [170, 214, 255], [92, 160, 240]];
  function aang(t, dt) {
    const v = 9 * U, span = cols + 40, run = t * v + cols * 0.6, pass = Math.floor(run / span), dir = pass % 2 ? -1 : 1;
    const u = wrap(run, span) - 20, x = dir > 0 ? u : cols - u;
    const base = 0.3 + 0.18 * hash(pass, 0, 77);
    const y = rows * (base + 0.14 * Math.sin(t * 0.9) + 0.05 * Math.sin(t * 2.3 + 1));
    const dx = v * dir, dy = rows * (0.14 * 0.9 * Math.cos(t * 0.9) + 0.05 * 2.3 * Math.cos(t * 2.3 + 1));
    const ang = Math.atan2(dy, dx) + Math.PI / 2;
    ease(aangOff, push(x, y), dt);
    const ax = x + aangOff[0], ay = y + aangOff[1], S = 0.95 * U;
    if (Math.random() < 30 * dt) wingtrail(AANG, ax, ay, ang, S, [[0, 4], [16, 4]], dx, dy, [176, 208, 240]);
    if (t > nextSwirl && x > 12 && x < cols - 12) { // airbending: a blue ring thrown off the glider, then a spiral for a beat
      nextSwirl = t + rnd(5, 9); swirlEnd = t + 1.3;
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        spawn(ax + Math.cos(a) * 3 * U, ay + Math.sin(a) * 3 * U, (-Math.sin(a) * 6 + Math.cos(a) * 3.5) * U, (Math.cos(a) * 6 + Math.sin(a) * 3.5) * U,
          rnd(0.9, 1.5), pick(AIR), 0.56, k % 3 ? G_WAVE : G_O);
      }
    }
    if (t < swirlEnd) for (let k = 0; k < 3; k++) {
      const a = t * 14 + k * 2.1, r = 3.6 * U;
      spawn(ax + Math.cos(a) * r, ay + Math.sin(a) * r, -dx * 0.25 - Math.sin(a) * 4 * U, -dy * 0.25 + Math.cos(a) * 4 * U,
        rnd(0.7, 1.2), pick(AIR), 0.52, k ? G_WAVE : G_O);
    }
    sprite(AANG, AANG_C, ax, ay, ang, S);
  }

  // Toothless works like a Night Fury: skims the edges unseen, vanishes, circles back high, then dive-bombs,
  // fires a plasma blast at the bottom of the dive and pulls out. Each move is a cubic Bezier.
  const bez = (p, s) => { const u = 1 - s, a = u * u * u, b = 3 * u * u * s, c = 3 * u * s * s, d = s * s * s;
    return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]]; };
  const bezD = (p, s) => { const u = 1 - s, a = 3 * u * u, b = 6 * u * s, c = 3 * s * s;
    return [a * (p[1][0] - p[0][0]) + b * (p[2][0] - p[1][0]) + c * (p[3][0] - p[2][0]), a * (p[1][1] - p[0][1]) + b * (p[2][1] - p[1][1]) + c * (p[3][1] - p[2][1])]; };
  // He keeps clear of Appa (who flies high): edge runs stay below him, and the dive drops in from above the
  // screen as far from him as it can, bottoms out below his feet, and pulls out on the far side.
  function planToothless(t, first, dance) {
    const W = cols, H = rows, o = 30 * U, feet = appaFeet();
    const lurkDur = dance ? 10.6 : rnd(6, 8.5), gapDur = rnd(1.5, 3.5), tDive = t + (first ? 0 : lurkDur + gapDur) + 3.2;
    const sideTop = feet + 12 * U;
    const lurk = pick([
      [[W + o, H - 3], [W * 0.6, H + 2], [W * 0.3, H - 6], [-o, H - 2]],                      // low through the bottom clouds
      [[W + o, sideTop], [W - 4, sideTop + H * 0.12], [W - 6, H * 0.7], [W + o, H * 0.85]],  // hug the right side
      [[-o, H * 0.85], [6, H * 0.7], [4, sideTop + H * 0.12], [-o, sideTop]],                 // hug the left side
    ]);
    const ax = appaX(tDive);
    let tx = W * 0.5, best = -1;
    for (let k = 0; k < 8; k++) { const c = W * rnd(0.22, 0.78), d = Math.abs(c - ax); if (d > best) { best = d; tx = c; } }
    const ty = Math.max(feet + 14 * U, H * rnd(0.46, 0.56));
    const side = ax > tx ? 1 : -1, ex = tx - side * W * 0.35; // pull out away from Appa
    const dd = Math.random() < 0.5 ? 1 : -1;
    // every other round he flies with the Light Fury instead: a paired spiral down in the bottom-left corner,
    // far from Appa: in low along the bottom, a loop up beside the text column, and back out the left edge
    const open = dance
      ? { kind: 'dance', dur: lurkDur, dir: dd, ease: s => s,
          p: [[-o, H * 0.96], [W * 0.26, H * 1.0], [W * 0.2, H * 0.56], [-o, H * 0.62]] }
      : { kind: 'lurk', dur: lurkDur, p: lurk, ease: s => s };
    return [
      open,
      { kind: 'gap', dur: gapDur },
      { kind: 'dive', dur: 3.2, ease: s => s ** 1.8,
        p: [[side > 0 ? W + o : -o, -o], [W * 0.5 + side * W * 0.15, -H * 0.25], [tx + side * W * 0.06, ty - H * 0.55], [tx, ty]] },
      { kind: 'pull', dur: 2.2, ease: s => 1 - (1 - s) ** 1.6,
        p: [[tx, ty], [tx - side * 4 * U, ty + 14 * U], [ex, ty + 4 * U], [ex - side * W * 0.25, -o]] },
      { kind: 'gap', dur: rnd(2, 4) },
    ];
  }
  function toothless(t, dt) {
    const T = tooth;
    if (!T.segs || T.i >= T.segs.length) {
      T.n = (T.n || 0) + 1;
      T.segs = planToothless(t, T.first, !T.first && T.n % 2 === 0); T.i = T.first ? 2 : 0; T.first = false; T.t0 = t; T.fired = false;
    }
    const seg = T.segs[T.i], s = (t - T.t0) / seg.dur;
    if (s >= 1) { T.i++; T.t0 = t; T.fired = false; return; }
    if (!seg.p) return;
    if (seg.kind === 'dance') {
      // the parents finish 1.6 s early, parked off-screen, so the trailing kids have time to cross and leave
      const SD = 0.84 * U, Rr = 8 * U, el = t - T.t0, pd = seg.dur - 1.6;
      const center = tt => bez(seg.p, clamp01((tt - T.t0) / pd));
      const at = (tt, sgn) => {
        const [cx, cy] = center(tt), a = (tt - T.t0) * 1.9 * seg.dir + (sgn > 0 ? 0 : Math.PI);
        return [cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr * 0.7];
      };
      KIDS.forEach((pal, k) => { // tumbling along the parents' path, a beat behind, each wobbling its own way
        const kid = tt => { const [cx, cy] = center(tt - 0.7 - k * 0.4), w = tt * 3 + k * 2.1; return [cx + Math.cos(w) * 3 * U, cy + Math.sin(w * 1.3) * 2 * U]; };
        const [x, y] = kid(t), [x2, y2] = kid(t + 0.03);
        sprite(Math.floor(t * 8 + k) % 2 ? KID_A : KID_B, pal, x, y, Math.atan2(y2 - y, x2 - x) + Math.PI / 2, 0.52 * U);
      });
      // she fades in out of the clouds and cloaks away again at the end, shimmering as she goes
      const fade = clamp01(el / 0.9) * clamp01((pd - el) / 0.9);
      for (const [sgn, pal, mul] of [[1, TOOTH_C, 1], [-1, LIGHTFURY_C, fade]]) {
        const [x, y] = at(t, sgn), [x2, y2] = at(t + 0.03, sgn), dx = x2 - x, dy = y2 - y, ang = Math.atan2(dy, dx) + Math.PI / 2;
        const bm = Math.floor(t * 5 + (sgn > 0 ? 0 : 1)) % 2 ? TOOTH_A : TOOTH_B;
        if (Math.random() < 20 * dt) wingtrail(bm, x, y, ang, SD, [[0, 6], [19, 6]], dx, dy, sgn > 0 ? [190, 196, 210] : [214, 226, 246]);
        if (mul > 0.05) sprite(bm, pal, x, y, ang, SD, 1, mul);
        if (sgn < 0 && mul > 0.02 && mul < 0.95 && Math.random() < 45 * dt)
          spawn(x + rnd(-6, 6) * U, y + rnd(-6, 6) * U, rnd(-2, 2) * U, rnd(-2, 2) * U, rnd(0.3, 0.7), [200, 226, 255], 0.6, G_O);
      }
      return;
    }
    const e = seg.ease(s), [x, y] = bez(seg.p, e), [dx, dy] = bezD(seg.p, e), m = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx) + Math.PI / 2, S = 0.84 * U, dive = seg.kind === 'dive';
    const bm = dive && e > 0.4 ? TOOTH_B : Math.floor(t * (seg.kind === 'pull' ? 7 : 4)) % 2 ? TOOTH_A : TOOTH_B; // wings tucked for the plunge
    if (Math.random() < (dive || seg.kind === 'pull' ? 70 : 16) * dt) wingtrail(bm, x, y, ang, S, [[0, 6], [19, 6], [9, 17]], dx, dy, [190, 196, 210]);
    sprite(bm, TOOTH_C, x, y, ang, S, 1, seg.kind === 'lurk' ? 0.8 : 1);
    if (dive && e > 0.86 && !T.fired) {
      T.fired = true;
      const [mx, my] = local(bm, x, y, ang, S, 10, -2);
      blasts.push({ x: mx, y: my, ux: dx / m, uy: dy / m, v: 44 * U, t0: t, dist: 24 * U });
    }
  }
  function burst(x, y) { // plasma impact: a white-violet flash and an expanding ring
    for (let k = 0; k < 18; k++) spawn(x + rnd(-2.5, 2.5) * U, y + rnd(-2.5, 2.5) * U, 0, 0, rnd(0.2, 0.45), [240, 232, 255], 0.95, -1);
    for (let k = 0; k < 44; k++) {
      const a = (k / 44) * Math.PI * 2, sp = (k % 2 ? rnd(12, 18) : rnd(5, 9)) * U; // two rings, fast and slow
      spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.6, 1.1), pick([[170, 140, 255], [120, 96, 255], [214, 200, 255]]), 0.78, k % 3 ? -1 : G_O);
    }
  }

  // Streak along (ux,uy) with a round head: Toothless's plasma blasts.
  function trail(hx, hy, ux, uy, L, hr, grow, c1, c2, t) {
    const tx = hx - ux * L, ty = hy - uy * L, pad = hr + L * grow + 2;
    for (let y = Math.floor(Math.min(hy, ty) - pad); y <= Math.max(hy, ty) + pad; y++)
      for (let x = Math.floor(Math.min(hx, tx) - pad); x <= Math.max(hx, tx) + pad; x++) {
        const px = x - hx, py = y - hy, s = -(px * ux + py * uy), w = Math.abs(px * uy - py * ux);
        if (s < -hr - 1 || s > L) continue;
        const head = Math.max(0, 1 - Math.hypot(px, py) / hr), tw = 0.6 + s * grow;
        let tail = s > 0 ? Math.pow(1 - s / L, 1.6) * Math.exp(-((w / tw) ** 2)) * 0.8 : 0;
        if (s > L * 0.35 && hash(x, y, Math.floor(t * 5)) < 0.45) tail *= 0.35;
        const d = Math.max(head, tail);
        put(x, y, d, mix(c1, c2, clamp01(s / L)), d * 0.85);
      }
  }

  function scene(t, dt) {
    D.fill(0); O.fill(-1); F.fill(0);
    FG = 0; drawLayer(layers[0], t);
    drawLayer(layers[1], t);
    FG = 1;
    const [ax, ay, S] = appa(t);
    momo(ax, ay, S, t, dt);
    toothless(t, dt);
    FG = 0;
    for (const b of blasts) {
      const s = (t - b.t0) * b.v;
      if (s >= b.dist) { b.done = true; burst(b.x + b.ux * b.dist, b.y + b.uy * b.dist); continue; }
      trail(b.x + b.ux * s, b.y + b.uy * s, b.ux, b.uy, 9 * U, 1.5 * U, 0.06, [232, 222, 255], [104, 78, 255], t);
    }
    blasts = blasts.filter(b => !b.done);
    drawLayer(layers[2], t);
    FG = 1; aang(t, dt); FG = 0;
    if (t > nextWind) { // stray gusts drifting across, like ripples on the pond
      nextWind = t + rnd(0.15, 0.5);
      const len = rnd(3, 8) | 0, x = rnd(0, cols), y = rnd(0, rows), life = rnd(0.8, 1.6);
      for (let k = 0; k < len; k++) spawn(x + k, y, -6 * U, 0, life, [146, 150, 162], 0.22, k && k < len - 1 ? pick([G_DASH, G_WAVE]) : G_DASH);
    }
    for (const p of parts) {
      p.life -= dt;
      p.x += (p.vx + Math.sin(t * 3 + p.ph) * p.wob) * dt; p.y += p.vy * dt;
      p.vx *= 1 - Math.min(1, dt * 1.2); p.vy *= 1 - Math.min(1, dt * 1.2);
      put(p.x, p.y, p.d * clamp01(p.life / p.max * 1.5), p.c, 0.8, p.gl);
    }
    parts = parts.filter(p => p.life > 0);
  }

  // --- render ---
  function render(t) {
    const W = cvs.width, H = cvs.height;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(bg, 0, 0);

    // dark mode: soft coloured glow; light mode: a soft drop shadow under the fliers
    const blurUp = (src, dst, img, x, y, alpha, op) => {
      src.getContext('2d').putImageData(img, 0, 0);
      const dc = dst.getContext('2d');
      dc.clearRect(0, 0, dst.width, dst.height);
      dc.drawImage(src, 0, 0, dst.width, dst.height);
      ctx.globalAlpha = alpha; ctx.globalCompositeOperation = op; ctx.imageSmoothingEnabled = true;
      ctx.drawImage(dst, x, y, W, H);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    };
    if (light) {
      const sd = shadI.data;
      sd.fill(0);
      for (let i = 0; i < F.length; i++) if (F[i]) sd[i * 4 + 3] = 210 * F[i];
      blurUp(shadC, shadS, shadI, cpx * 1.3, cpx * 2, 0.34, 'source-over');
    } else {
      const gd = glowI.data;
      gd.fill(0);
      for (let i = 0; i < D.length; i++) {
        const d = D[i]; if (!d) continue;
        const o = i * 4;
        gd[o] = R[i]; gd[o + 1] = G[i]; gd[o + 2] = B[i]; gd[o + 3] = 255 * d;
      }
      blurUp(glowC, glowS, glowI, 0, 0, 0.22, 'lighter');
    }

    const tick = Math.floor(t * 3), gap = Math.max(1, Math.round(dpr)), inner = cpx - gap;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x, d = D[i];
      if (!d) continue;
      let g = O[i];
      if (g < 0) {
        g = Math.min(9, Math.floor(d * 10));
        const f = hash(x, y, tick);
        if (f < 0.06) g = Math.max(0, g - 1); else if (f > 0.94) g = Math.min(9, g + 1);
      }
      const r = R[i], gg = G[i], b = B[i], dx = x * cpx, dy = y * cpx;
      if (d > 0.42) {
        ctx.fillStyle = fillOf(r, gg, b, Math.round((0.3 + 0.55 * d) * 15));
        ctx.fillRect(dx + gap, dy + gap, inner, inner);
        // dark tiles (Toothless) get light glyphs so they still read on charcoal
        const glyph = 0.3 * r + 0.59 * gg + 0.11 * b < 100
          ? atlas(r + (255 - r) * 0.55 | 0, gg + (255 - gg) * 0.55 | 0, b + (255 - b) * 0.55 | 0)
          : atlas(r * 0.22 | 0, gg * 0.22 | 0, b * 0.3 | 0);
        ctx.drawImage(glyph, g * cpx, 0, cpx, cpx, dx, dy, cpx, cpx);
      } else {
        ctx.globalAlpha = Math.min(1, 0.3 + 1.3 * d);
        // bare glyphs are drawn in their own colour; on the light sky that needs darkening to show
        ctx.drawImage(light ? atlas(r * 0.5 | 0, gg * 0.5 | 0, b * 0.56 | 0) : atlas(r, gg, b), g * cpx, 0, cpx, cpx, dx, dy, cpx, cpx);
        ctx.globalAlpha = 1;
      }
    }
  }

  // --- pointer wind ---
  addEventListener('pointermove', e => {
    const nx = e.clientX / cs, ny = e.clientY / cs;
    if (P.on) {
      const dx = nx - P.x, dy = ny - P.y, dist = Math.hypot(dx, dy);
      if (dist > 0.6) {
        const gl = dirGlyph(dx, dy), steps = Math.min(12, Math.ceil(dist / 1.5));
        for (let k = 0; k < steps; k++) {
          const f = k / steps;
          spawn(P.x + dx * f + rnd(-1, 1), P.y + dy * f + rnd(-1, 1), dx * 0.5, dy * 0.5, rnd(0.7, 1.3), light ? pick(AIR) : [210, 216, 230], light ? 0.54 : 0.48, Math.random() < 0.3 ? G_WAVE : gl);
        }
      }
    }
    P.x = nx; P.y = ny; P.on = true; P.last = performance.now();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { P.on = false; });

  const frame = now => {
    const t = now / 1000 + 20, dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    scene(t, dt); render(t);
    if (!reduce) requestAnimationFrame(frame);
  };

  // --- theme follows the site's .dark class ---
  const root = document.documentElement;
  function applyTheme() {
    const next = !root.classList.contains('dark');
    if (next === light) return;
    light = next;
    if (bg) { buildBg(); if (reduce) frame(0); }
  }
  new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['class'] });
  applyTheme();

  resize();
  addEventListener('resize', () => { resize(); if (reduce) frame(0); });
  document.fonts?.ready.then(() => { atlases.clear(); if (reduce) frame(0); });
  frame(0);
}
