// Home-page ink painting: the tree on the hill, the sun that sets as you scroll,
// the ridge that brushes itself down the page, and the parchment that unrolls.
// Everything is canvas 2D; text stays real HTML on top.

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tok = (n) => getComputedStyle(root).getPropertyValue(n).trim();
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const mulberry = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rgba = (hex, a) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };

function leafPath(ctx, x, y, rot, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * .55, s, 0); ctx.quadraticCurveTo(0, s * .55, -s, 0); ctx.restore();
}

function sizeCanvas(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect();
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
  return { w: r.width, h: r.height, dpr };
}

function layer(w, h, dpr) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return x;
}

function bez(p0, p1, p2, p3, n, out) {
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]);
  }
  return out;
}

// A loaded brush dragged along a path: each bristle carries its own ink and runs dry over the stroke,
// which is what makes real dry-brush streaks. advance() can resume, so strokes can be drawn by scroll.
class Brush {
  constructor(pts, wfn, wmax, seed, o) {
    this.pts = pts; this.wfn = wfn; this.o = o; this.i = 0; this.d = 0;
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]);
    this.L = L || 1;
    const r = mulberry(seed), K = Math.max(2, Math.min(24, Math.round(wmax * 1.2)));
    this.b = Array.from({ length: K }, (_, j) => ({ o: j / (K - 1) - .5, load: .8 + r() * .25, dep: (.5 + r()) * o.dry / this.L, rad: Math.max(.45, wmax / K * (.55 + r() * .5)), ph: r() * 100 }));
  }
  advance(ctx, to) {
    const { pts, b, o } = this;
    ctx.fillStyle = o.col;
    for (; this.i < to && this.i < pts.length - 1; this.i++) {
      const [x1, y1] = pts[this.i], [x2, y2] = pts[this.i + 1], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || .001, nx = -dy / L, ny = dx / L, n = Math.max(1, Math.ceil(L / .8));
      for (let s = 0; s < n; s++) {
        const x = x1 + dx * s / n, y = y1 + dy * s / n, w = this.wfn(this.d / this.L);
        for (const q of b) {
          const ink = q.load - q.dep * this.d + (noise1(q.ph + this.d * .05) - .5) * .5;
          if (ink < .32) continue;
          const off = (q.o + (noise1(q.ph * 1.7 + this.d * .08) - .5) * .06) * w;
          ctx.globalAlpha = Math.min(1, ink) * o.alpha;
          ctx.fillRect(x + nx * off - q.rad, y + ny * off - q.rad, q.rad * 2, q.rad * 2);
        }
        this.d += L / n;
      }
    }
    ctx.globalAlpha = 1;
  }
}

class Scene {
  constructor(el) {
    this.hero = el.querySelector('[data-ink-hero]');
    this.flowEl = el.querySelector('[data-ink-flow]');
    this.flowC = this.flowEl.querySelector('canvas');
    this.parch = el.querySelector('[data-parchment]');
    this.sheet = this.parch?.querySelector('[data-sheet]');
  }

  build() {
    const H0 = sizeCanvas(this.hero), F0 = sizeCanvas(this.flowC);
    const W = H0.w, H = H0.h, dpr = H0.dpr;
    if (W < 10 || H < 10) return;
    this.W = W; this.H = H; this.dpr = dpr; this.F = F0;
    const night = root.classList.contains('dark');
    const c = this.c = { tree: tok('--tree'), stroke: tok('--stroke'), sun: tok('--sun'), top: tok('--sky-top'), glow: tok('--sky-glow'), paper: tok('--bg') };
    const portrait = W / H < 1.1;
    const hx = this.hx = W * (portrait ? .56 : .68), hy = this.hy = H * (portrait ? .84 : .7);
    const r = mulberry(11);

    // Sky.
    const bg = this.bg = layer(W, H, dpr);
    if (night) {
      const g = bg.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, c.top); g.addColorStop(.62, c.glow); g.addColorStop(1, c.paper);
      bg.fillStyle = g;
    } else bg.fillStyle = c.paper;
    bg.fillRect(0, 0, W, H);

    // Hill ridge: rises to the tree, falls off the right edge where the page ridge picks it up.
    const ridge = bez([-10, H * .9], [W * .25, H * .9], [W * .45, hy], [hx, hy], 120, []);
    bez([hx, hy], [W * .78, hy], [W * .85, H * .86], [W * .86, H + 2], 120, ridge);

    // Sun (moon at night): a watercolour wash painted once, then moved per frame so it can set behind the hill.
    const sr = Math.min(W, H) * (night ? .075 : .13), sx = W * (portrait ? .22 : .3);
    const ry = ridge.reduce((a, p) => Math.abs(p[0] - sx) < Math.abs(a[0] - sx) ? p : a)[1];
    const R = sr * 1.1, sz = Math.ceil(R * 2), sl = layer(sz, sz, dpr), sr2 = mulberry(9);
    const disc = () => {
      sl.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = i / 120 * Math.PI * 2, rr = sr * (1 + (noise1(Math.cos(a) * 2 + 5) + noise1(Math.sin(a) * 2 + 9) - 1) * .035);
        i ? sl.lineTo(R + Math.cos(a) * rr, R + Math.sin(a) * rr) : sl.moveTo(R + Math.cos(a) * rr, R + Math.sin(a) * rr);
      }
      sl.closePath();
    };
    disc(); sl.fillStyle = rgba(c.sun, night ? .9 : .64); sl.fill();
    sl.save(); sl.clip();
    for (let i = 0, n = sr * sr * .5; i < n; i++) {
      const a = sr2() * Math.PI * 2, d = Math.sqrt(sr2()) * sr, z = .6 + sr2() * 1.4;
      sl.fillStyle = sr2() < .55 ? rgba(c.paper, .05 + sr2() * .08) : rgba(c.sun, .06 + sr2() * .08);
      sl.fillRect(R + Math.cos(a) * d, R + Math.sin(a) * d, z, z);
    }
    sl.restore();
    disc(); sl.strokeStyle = rgba(c.sun, night ? .3 : .38); sl.lineWidth = 1.6; sl.stroke();
    this.sun = { sx, ry, sr, R, night, img: sl.canvas };

    // Hill: paper fill hides the set sun, a faint wash under the ridge, two brush strokes, a few grass flicks.
    const hl = this.hill = layer(W, H, dpr);
    hl.beginPath(); ridge.forEach(([x, y], i) => i ? hl.lineTo(x, y) : hl.moveTo(x, y)); hl.lineTo(-10, H + 2); hl.closePath();
    hl.fillStyle = c.paper; hl.fill();
    const hg = hl.createLinearGradient(0, hy, 0, hy + H * .16);
    hg.addColorStop(0, rgba(c.tree, .07)); hg.addColorStop(1, rgba(c.tree, 0));
    hl.fillStyle = hg; hl.fill();
    const wm = Math.max(3, W * .0065);
    [ridge.slice(0, 121), ridge.slice(121)].forEach((p, k) => new Brush(p, (t) => wm * (.45 + .55 * noise1(t * 5 + k * 4)) * Math.min(1, t * 6 + .3), wm, 21 + k, { col: c.tree, alpha: .9, dry: .55 }).advance(hl, p.length));
    for (let i = 4; i < ridge.length - 4; i += 5) {
      const [x, y] = ridge[i];
      if (Math.abs(x - hx) < W * .1 || x < 0 || x > W || r() > .16) continue;
      for (let f = 0, n = 2 + (r() * 2 | 0); f < n; f++) {
        const a = (r() - .5) * 1.1, l = H * (.018 + r() * .02), bx = x + (r() - .5) * 8;
        new Brush([[bx, y], [bx + Math.sin(a) * l * .4, y - l * .55], [bx + Math.sin(a) * l, y - l]], (t) => 1.8 * (1 - t * .8), 1.8, i * 7 + f, { col: c.tree, alpha: .7, dry: 1 }).advance(hl, 3);
      }
    }

    // Tree: bare dry-brush branches, painted once.
    const tips = [], branches = [], MAXD = 7;
    const grow = (x, y, a, len, w, d) => {
      let cx = x, cy = y; const bp = [[x, y]];
      for (let i = 0; i < 3; i++) {
        a += (r() - .5) * .22;
        cx += Math.sin(a) * len / 3; cy -= Math.cos(a) * len / 3; bp.push([cx, cy]);
      }
      branches.push({ pts: bp, w, d });
      const we = w * .7;
      if (d >= MAXD || we < .6) { tips.push({ x: cx, y: cy }); return; }
      const n = d === 0 ? 2 : (r() < .35 ? 3 : 2);
      for (let i = 0; i < n; i++) {
        let ca = a + (i / (n - 1) - .5) * (.9 + r() * .4) + (r() - .5) * .2;
        if (d > 1) ca += Math.sign(ca || 1) * .08;
        grow(cx, cy, clamp(ca, -1.6, 1.6), len * (.68 + r() * .1), we * (.86 + r() * .08), d + 1);
      }
    };
    // Size the tree off the narrower dimension so it fits phone widths too.
    const base = Math.min(H, W * 1.15);
    grow(hx, hy + 2, -.1, base * (portrait ? .13 : .15), Math.max(5, Math.min(W, H) * .032), 0);
    this.tips = tips;
    this.tree = layer(W, H, dpr);
    branches.forEach((b, i) => new Brush(b.pts, (u) => b.w * (1 - .38 * u) * (1 + .18 * Math.max(0, 1 - u * 6)), b.w * 1.18, 100 + i, { col: c.tree, alpha: Math.max(.45, .95 - b.d * .07), dry: .5 }).advance(this.tree, b.pts.length));

    // Page ridge: from the hill's right foot, behind About, to the top of the parchment. Three strokes with brush lifts.
    const fw = F0.w, fh = F0.h;
    const pts = bez([fw * .86, 0], [fw * .86, fh * .2], [fw * .06, fh * .2], [fw * .1, fh * .52], 260, []);
    bez([fw * .1, fh * .52], [fw * .14, fh * .82], [fw * .5, fh * .8], [fw * .5, fh + 2], 260, pts);
    this.rpts = pts; this.rdrawn = 0; this.rwidth = Math.max(4, fw * .008) * 1.15;
    this.rlayer = layer(fw, fh, F0.dpr); this.ralpha = fw < 640 ? .35 : 1;
    this.rstrokes = [[0, 215], [222, 400], [406, 520]].map((rg) => ({ rg, br: null }));

    this.parts = []; this.fparts = []; this.spawn = .6; this.fspawn = 1;
    if (this.sheet) this.parch.style.setProperty('--sheet-h', this.sheet.offsetHeight + 'px');
    this.t0 = this.last = performance.now();
  }

  leaf(x, y, col) {
    return { x, y, col, s: this.H * (.007 + Math.random() * .006), rot: Math.random() * 6, vr: (Math.random() - .5) * .04, ph: Math.random() * 6 };
  }

  drift(ctx, p, t, dt) {
    p.y += (26 + p.s * 2) * .7 * dt; p.x += (Math.sin(p.ph + t * 1.3) * 22 + 8) * .7 * dt; p.rot += p.vr * .7;
    ctx.fillStyle = p.col; ctx.globalAlpha = .6; leafPath(ctx, p.x, p.y, p.rot + Math.sin(t * 2 + p.ph) * .5, p.s); ctx.fill(); ctx.globalAlpha = 1;
    return p.y;
  }

  step(now) {
    if (!this.tree) return;
    const c = this.c, t = (now - this.t0) / 1000, dt = Math.min(.05, (now - this.last) / 1000), vh = innerHeight;
    this.last = now;

    const hr = this.hero.getBoundingClientRect();
    if (hr.bottom > 0) {
      const x = this.hero.getContext('2d'), d = this.dpr, { sx, ry, sr, R, night, img } = this.sun;
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.hero.width, this.hero.height);
      x.drawImage(this.bg.canvas, 0, 0);
      // Sun sets behind the far slope over the first ~half screen of scroll.
      const sp = reduce ? 0 : ease(clamp(-hr.top / (this.H * .55)));
      const sy = ry - sr * 1.15 + sp * sr * 2.4, glow = (night ? .06 : .22) * (1 - sp * .8);
      x.setTransform(d, 0, 0, d, 0, 0);
      const band = x.createLinearGradient(0, ry - this.H * .45, 0, ry);
      band.addColorStop(0, rgba(c.glow, 0)); band.addColorStop(1, rgba(night ? c.sun : c.glow, glow));
      x.fillStyle = band; x.fillRect(0, ry - this.H * .45, this.W, this.H * .45);
      const fade = x.createLinearGradient(0, ry, 0, this.H);
      fade.addColorStop(0, rgba(night ? c.sun : c.glow, glow)); fade.addColorStop(1, rgba(c.glow, 0));
      x.fillStyle = fade; x.fillRect(0, ry, this.W, this.H - ry);
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.drawImage(img, Math.round((sx - R) * d), Math.round((sy - R) * d));
      x.drawImage(this.hill.canvas, 0, 0);
      x.save();
      if (!reduce) { x.translate(this.hx * d, this.hy * d); x.rotate(Math.sin(t * .7) * .0035); x.translate(-this.hx * d, -this.hy * d); }
      x.drawImage(this.tree.canvas, 0, 0);
      x.restore();
      x.setTransform(d, 0, 0, d, 0, 0);
      if (!reduce) {
        this.spawn -= dt;
        if (this.spawn <= 0) { const l = this.tips[Math.random() * this.tips.length | 0]; this.parts.push(this.leaf(l.x, l.y, c.tree)); this.spawn = (.5 + Math.random() * .7) * 2.2; }
      }
      this.parts = this.parts.filter((p) => this.drift(x, p, t, dt) < this.H + 20);
    }

    // Page ridge follows scroll both ways.
    const fr = this.flowEl.getBoundingClientRect();
    if (reduce || fr.top < vh && fr.bottom > 0 || this.rdrawn) {
      const rt = Math.floor((reduce ? 1 : clamp((vh * .72 - fr.top) / fr.height)) * (this.rpts.length - 1));
      if (rt < this.rdrawn) { this.rlayer.clearRect(0, 0, this.F.w, this.F.h); this.rdrawn = 0; this.rstrokes.forEach((s) => s.br = null); }
      if (rt > this.rdrawn) {
        this.rstrokes.forEach((s, k) => {
          const [a, b] = s.rg, local = clamp(rt - a, 0, b - a), wm = this.rwidth;
          if (!local) return;
          s.br ||= new Brush(this.rpts.slice(a, b + 1), (u) => wm * (.5 + .5 * noise1(u * 4 + k * 3)) * Math.min(1, u * 7 + .25) * (1 - .4 * u), wm, 40 + k, { col: c.stroke, alpha: .9, dry: .85 });
          s.br.advance(this.rlayer, local);
        });
        this.rdrawn = rt;
      }
      const fx = this.flowC.getContext('2d');
      fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, this.flowC.width, this.flowC.height);
      fx.globalAlpha = this.ralpha; fx.drawImage(this.rlayer.canvas, 0, 0); fx.globalAlpha = 1;
      fx.setTransform(this.F.dpr, 0, 0, this.F.dpr, 0, 0);
      if (!reduce && fr.top < vh && fr.bottom > 0) {
        this.fspawn -= dt;
        if (this.fspawn <= 0) { this.fparts.push(this.leaf(this.F.w * (.1 + Math.random() * .8), -10, c.stroke)); this.fspawn = (.9 + Math.random() * .9) * 2; }
      }
      this.fparts = this.fparts.filter((p) => this.drift(fx, p, t, dt) < this.F.h + 20);
    }

    // Parchment unrolls as it rises through the viewport.
    if (this.parch) {
      const pr = this.parch.getBoundingClientRect();
      this.parch.style.setProperty('--p', reduce ? 1 : clamp((vh * .92 - pr.top) / (vh * .5)).toFixed(3));
    }
  }
}

export function startInkScene(el) {
  const scene = new Scene(el);
  const rebuild = () => scene.build();
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rebuild, 150); });
  // ThemeToggle flips the .dark class; repaint in the night palette.
  new MutationObserver(rebuild).observe(root, { attributes: true, attributeFilter: ['class'] });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    rebuild();
    const loop = (now) => { scene.step(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
}
