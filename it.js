// IT-блок: по скроллу ноутбук открывается (кадры видео на canvas), экран включается,
// на нём печатается код → собирается макет продукта → загораются направления.
// Экран — настоящий HTML, натянутый на 4 угла дисплея через matrix3d (углы — assets/laptop.json).
(async () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 900px)').matches;
  const sec = document.querySelector('#it');
  const $ = s => sec.querySelector(s), $$ = s => [...sec.querySelectorAll(s)];
  const canvas = $('.it-canvas'), ctx = canvas.getContext('2d'), screen = $('.it-screen');
  const META = await fetch('assets/laptop.json').then(r => r.json());
  const N = META.frames, [IW, IH] = META.aspect;
  const DIR = mobile ? 'lap-sm' : 'lap-wide';
  const CROP = mobile ? META.mobileCrop : [0, 1];          // какая часть кадра по ширине попадает в canvas

  // сценарий скролла (доли прогресса секции)
  const OPEN_END = .4, POWER = [.4, .46], CODE = [.46, .64], APP = [.64, .8], TAGS = [.8, .95];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, [a, b]) => clamp((p - a) / (b - a));
  const outExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

  // ---------- кадры ----------
  const frames = new Array(N);
  let want = 0, shown = -1;
  function load(i) {
    if (frames[i]) return frames[i].p;
    const im = new Image(); im.decoding = 'async';
    im.p = new Promise(r => { im.onload = () => { im.ok = true; r(); if (i === want) draw(want, true); }; im.onerror = r; });
    im.src = `frames/${DIR}/${String(i).padStart(3, '0')}.webp`; frames[i] = im; return im.p;
  }
  function loadAll() {
    const order = [], seen = new Set();
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    let k = 0; const next = () => { if (k < order.length) load(order[k++]).then(next); };
    for (let n = 0; n < 4; n++) next();
  }

  // как кадр вписан в canvas: «cover», на десктопе прижат вправо (ноутбук справа, текст слева)
  let fit = { s: 1, dx: 0, dy: 0 };
  function draw(i, force) {
    want = i;
    let j = i;
    for (let d = 0; d < N; d++) {
      if (frames[i - d] && frames[i - d].ok) { j = i - d; break; }
      if (frames[i + d] && frames[i + d].ok) { j = i + d; break; }
    }
    if (!frames[j] || !frames[j].ok || (j === shown && !force)) return;
    const im = frames[j], k = canvas.width / canvas.clientWidth;
    ctx.fillStyle = '#132c55'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(im, fit.dx * k, fit.dy * k, im.naturalWidth * fit.s * k, im.naturalHeight * fit.s * k);
    shown = j;
  }

  // ---------- экран: гомография прямоугольника 1000×625 на 4 угла дисплея ----------
  function homography(src, dst) {
    // решаем 8×8 систему (метод Гаусса) — классическая формула для CSS matrix3d
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (let c = 0; c < 8; c++) {
      let m = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      [A[c], A[m]] = [A[m], A[c]]; [b[c], b[m]] = [b[m], b[c]];
      for (let r = 0; r < 8; r++) if (r !== c) {
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    const h = b.map((v, i) => v / A[i][i]);
    return `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,1)`;
  }

  function layout() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const iw = IW * (CROP[1] - CROP[0]);                      // ширина видимой части кадра в пикселях исходника
    const s = mobile ? cw / iw : Math.max(cw / IW, ch / IH);
    const k = frames[0] && frames[0].naturalWidth ? frames[0].naturalWidth / iw : 1;   // исходник → файл кадра
    fit = { s: s / k, dx: mobile ? 0 : cw - IW * s, dy: mobile ? 0 : (ch - IH * s) / 2 };
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    // углы экрана в CSS-пикселях canvas
    const pts = META.screen.map(([x, y]) => [fit.dx + (x - CROP[0]) * IW * s, fit.dy + y * IH * s]);
    screen.style.transform = homography([[0, 0], [1000, 0], [1000, 625], [0, 625]], pts);
    draw(want, true);
  }

  // ---------- содержимое экрана ----------
  const CODE_LINES = [
    [['k', 'const'], ['', ' project = '], ['p', 'createProject'], ['', '({']],
    [['p', '  idea'], ['', ': '], ['s', "'ваша задача'"], ['', ',']],
    [['p', '  stack'], ['', ': ['], ['s', "'web'"], ['', ', '], ['s', "'mobile'"], ['', ', '], ['s', "'AI'"], ['', '],']],
    [['p', '  team'], ['', ': ['], ['s', "'IT'"], ['', ', '], ['s', "'юрист'"], ['', ', '], ['s', "'бухгалтер'"], ['', '],']],
    [['', '})']],
    [['', '']],
    [['k', 'await'], ['', ' project.'], ['p', 'launch'], ['', '()  '], ['c', '// от идеи до продукта']],
  ];
  const TOTAL = CODE_LINES.flat().reduce((n, [, t]) => n + t.length, 0);
  const codeEl = $('.code');
  let lastChars = -1;
  function renderCode(t) {
    const chars = Math.round(t * TOTAL);
    if (chars === lastChars) return;
    lastChars = chars;
    let left = chars, html = '';
    CODE_LINES.forEach((line, i) => {
      if (left <= 0 && i > 0) return;
      html += `<span class="ln">${i + 1}</span>`;
      for (const [cls, text] of line) {
        const part = text.slice(0, Math.max(0, left)); left -= text.length;
        if (part) html += cls ? `<span class="${cls}">${part}</span>` : part;
        if (left < 0) break;
      }
      if (left < 0 || i === CODE_LINES.length - 1) html += '<span class="caret-b"></span>';
      html += '\n';
    });
    codeEl.innerHTML = html;
  }

  const [scCode, scApp, scTags] = $$('.scr'), pv = $$('.pv'), chips = $$('.chip-it');
  function render(p) {
    const f = Math.round(clamp(p / OPEN_END) * (N - 1));
    draw(f);
    const pw = seg(p, POWER);
    screen.style.opacity = pw > 0 ? 1 : 0;
    screen.style.setProperty('--flash', pw > 0 ? (1 - outExpo(pw)) * .5 : 0);
    const c = seg(p, CODE), a = seg(p, APP), g = seg(p, TAGS);
    scCode.style.opacity = pw > 0 && a < .5 ? 1 : 0;
    renderCode(c);
    scApp.style.opacity = a > 0 && g < .15 ? Math.min(1, a * 3) : 0;
    pv.forEach((el, i) => {                                     // блоки макета «собираются» по очереди
      const t = clamp(a * 1.6 - i * .1);
      el.style.opacity = t; el.style.transform = `translateY(${(1 - outExpo(t)) * 30}px) scale(${.96 + .04 * t})`;
    });
    scTags.style.opacity = Math.min(1, g * 5);
    chips.forEach((ch, i) => ch.classList.toggle('on', g > .15 + i * .11));
  }

  // ---------- запуск ----------
  const split = () => { if (!reduced) gsap.timeline({ scrollTrigger: { trigger: $('.it-copy'), start: 'top 80%' }, defaults: { ease: 'expo.out' } })
    .from($('.it-label'), { y: 14, opacity: 0, duration: .9 })
    .from($$('.it h2 .wi, .it-text .wi'), { yPercent: 115, opacity: 0, filter: 'blur(8px)', duration: 1.2, stagger: .025 }, .1)
    .from($$('.it-feat'), { x: -24, opacity: 0, duration: .9, stagger: .12 }, .5)
    .from($('.it-copy .btn'), { y: 16, opacity: 0, duration: .8 }, .8); };

  async function init() {
    await Promise.all([load(0), load(N - 1)]);
    layout();
    addEventListener('resize', () => { layout(); ScrollTrigger.refresh(); });
    loadAll();

    const dbg = new URLSearchParams(location.search).get('it');     // ?it=0.9 — показать сцену на моменте прогресса
    if (dbg !== null) {
      ['#hero', '#advantages', '#process'].forEach(s => document.querySelector(s).style.display = 'none');
      render(+dbg); return;
    }
    split();
    if (reduced) { render(1); return; }
    if (!mobile) {
      let target = 0, cur = 0;
      ScrollTrigger.create({ trigger: sec, start: 'top top', end: '+=3000', pin: true, onUpdate: self => { target = self.progress; } });
      ScrollTrigger.refresh();                        // пересчитать точки срабатывания секций выше/ниже с учётом этого закрепления
      gsap.ticker.add(() => { cur += (target - cur) * .12; render(cur); });
    } else {
      const st = { p: 0 }; render(0);
      ScrollTrigger.create({ trigger: $('.it-stage'), start: 'top 70%', once: true,
        onEnter: () => gsap.to(st, { p: 1, duration: 7, ease: 'none', onUpdate: () => render(st.p) }) });
    }
  }

  const dbg = new URLSearchParams(location.search).has('it');
  (window.__heroReady || dbg) ? init() : addEventListener('hero-ready', init, { once: true });
})();
