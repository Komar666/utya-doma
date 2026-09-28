// «Наши преимущества»: крыша рисуется по скроллу, карточки поднимаются под неё, Ути выпрыгивают.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const sec = document.querySelector('#advantages');
  const q = s => [...sec.querySelectorAll(s)];

  // ---------- крыша ----------
  // Контур строится под реальный размер SVG (без растягивания), крыша и труба — одна непрерывная линия.
  const roof = sec.querySelector('.roof'), line = roof.querySelector('.r-line'), fill = roof.querySelector('.r-fill');
  const pen = roof.querySelector('.r-pen'), smokeG = roof.querySelector('.smoke');
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let len = 0, drawn = 0, smoking = false;

  function buildRoof() {
    const W = roof.clientWidth, H = roof.clientHeight;
    roof.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const m = 4, top = 10, base = H - 3, cx = W / 2;
    const slope = x => top + Math.abs(x - cx) / (cx - m) * (base - top);   // высота ската в точке x
    const rr = Math.max(14, W * .025);                                   // скругление конька
    const c1 = W * .72, cw = Math.min(38, Math.max(22, W * .03)), c2 = c1 + cw;
    const cTop = slope(c1) - Math.min(40, Math.max(20, H * .3));          // верх трубы
    const pt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
    const ridge = `M${pt(m, base)} L${pt(cx - rr, slope(cx - rr))} Q${pt(cx, top)} ${pt(cx + rr, slope(cx + rr))}`;
    line.setAttribute('d', `${ridge} L${pt(c1, slope(c1))} L${pt(c1, cTop)} L${pt(c2, cTop)} L${pt(c2, slope(c2))} L${pt(W - m, base)}`);
    fill.setAttribute('d', `${ridge} L${pt(W - m, base)} Z`);
    q('.smoke circle').forEach((c, i) => { c.setAttribute('cx', (c1 + c2) / 2 + (i - 1) * 5); c.setAttribute('cy', cTop - 6); });
    len = line.getTotalLength();
    line.style.strokeDasharray = `${len} ${len}`;
    setDrawn(drawn);
  }

  function setDrawn(t) {
    drawn = t;
    line.style.strokeDashoffset = len * (1 - t);
    // «перо» — светящаяся точка на кончике рисуемой линии
    if (t > 0 && t < 1) { const p = line.getPointAtLength(len * t); pen.setAttribute('cx', p.x); pen.setAttribute('cy', p.y); }
    pen.style.opacity = Math.min(1, t * 25, (1 - t) * 25);
    const done = smooth(.9, 1, t);
    fill.style.opacity = done;
    smokeG.style.opacity = done;
    if (t > .97 && !smoking) { smoking = true; smoke(); }
  }

  function smoke() {
    q('.smoke circle').forEach((c, i) => gsap.timeline({ repeat: -1, delay: i * .75 })
      .fromTo(c, { y: 0, x: 0, scale: .5, transformOrigin: '50% 50%' }, { y: -42, x: 8 + i * 5, scale: 1.6, duration: 2.4, ease: 'sine.out' }, 0)
      .fromTo(c, { opacity: 0 }, { opacity: .9, duration: .5 }, 0)
      .to(c, { opacity: 0, duration: 1.6 }, .7));
  }

  function init() {
    buildRoof();
    addEventListener('resize', buildRoof);
    if (reduced) { setDrawn(1); return; }

    // заголовок — по словам, как в hero
    gsap.timeline({ scrollTrigger: { trigger: sec.querySelector('.adv-head'), start: 'top 82%' }, defaults: { ease: 'expo.out' } })
      .from(q('.eyebrow'), { y: 14, opacity: 0, duration: .9 })
      .from(q('.adv-head .wi'), { yPercent: 115, opacity: 0, filter: 'blur(8px)', duration: 1.2, stagger: .03 }, .1);

    // крыша рисуется вслед за скроллом
    const state = { t: 0 };
    gsap.to(state, {
      t: 1, ease: 'power1.inOut', onUpdate: () => setDrawn(state.t),
      scrollTrigger: { trigger: sec.querySelector('.house'), start: 'top 88%', end: 'top 40%', scrub: .8 },
    });

    // карточки поднимаются под крышу, Ути выпрыгивают из-за них и дальше тихонько «дышат»
    gsap.timeline({ scrollTrigger: { trigger: sec.querySelector('.adv-grid'), start: 'top 80%' }, defaults: { ease: 'expo.out' } })
      .from(q('.adv-card'), { y: 90, rotationX: 14, opacity: 0, duration: 1.3, stagger: .12 })
      .from(q('.adv-tint'), { scale: 0, duration: .9, stagger: .12, ease: 'back.out(1.8)' }, .2)
      .from(q('.duck-float img'), { y: 70, scale: .55, opacity: 0, duration: 1.1, stagger: .12, ease: 'back.out(2.2)' }, .3)
      .from(q('.adv-num'), { opacity: 0, x: -8, duration: .8, stagger: .12 }, .5)
      .add(() => q('.duck-float').forEach((d, i) =>
        gsap.to(d, { y: -7, rotation: i % 2 ? 1.2 : -1.2, duration: 2.2 + i * .25, ease: 'sine.inOut', yoyo: true, repeat: -1 })));

    if (touch) return;
    // наведение: карточка наклоняется к курсору, блик ходит за мышью, Утя подпрыгивает
    q('.adv-card').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3' });
      const img = card.querySelector('.duck-float img'), blob = card.querySelector('.adv-tint');
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        ry((x - .5) * 10); rx(-(y - .5) * 8);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerenter', () => {
        gsap.fromTo(img, { y: 0 }, { y: -18, duration: .32, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: true });
        gsap.to(blob, { scale: 1.1, duration: .5, ease: 'back.out(2)' });
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); gsap.to(blob, { scale: 1, duration: .5 }); });
    });
  }

  // ?adv — только этот блок, сразу в конечном состоянии (для скриншотов и проверки вёрстки)
  if (new URLSearchParams(location.search).has('adv')) {
    document.querySelector('#hero').style.display = 'none';
    sec.style.paddingTop = '140px';
    init();
    ScrollTrigger.getAll().forEach(t => t.animation && t.animation.progress(1));
    const r = new URLSearchParams(location.search).get('roof');     // ?adv&roof=0.5 — крыша, нарисованная наполовину
    if (r !== null) setDrawn(+r);
    return;
  }
  window.__heroReady ? init() : addEventListener('hero-ready', init, { once: true });
})();
