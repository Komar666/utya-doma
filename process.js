// «Как мы работаем»: секция закрепляется, по скроллу заявка в окне «приложения» проходит 5 этапов.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 900px)').matches;
  const sec = document.querySelector('#process');
  const $ = s => sec.querySelector(s), $$ = s => [...sec.querySelectorAll(s)];

  const STATUS = ['Новая заявка', 'Обсуждаем задачу', 'Подбираем эксперта', 'Решение готово', 'На сопровождении'];
  const steps = $$('.step'), scenes = $$('.scene'), ducks = $$('.app-ducks img'), blob = $('.app-blob');
  const BLOB = ['#fff1bf', '#dce8ff'];              // кремовый / светло-голубой — как круги за Утями в «Преимуществах»
  const status = $('.app-status'), bar = $('.app-progress i'), rail = $('.rail i');

  // печатает текст в «поле ввода»
  const type = (el, dur) => {
    const text = el.dataset.type, o = { n: 0 };
    return gsap.timeline()
      .add(() => el.classList.add('focus'))
      .to(o, { n: text.length, duration: dur, ease: 'none', onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); } })
      .add(() => el.classList.remove('focus'));
  };

  // анимация содержимого окна для каждого этапа (запускается заново при каждом входе в этап)
  const SCENES = [
    sc => {                                                   // 1. форма заполняется и отправляется
      const inputs = [...sc.querySelectorAll('.inp')], btn = sc.querySelector('.send');
      inputs.forEach(i => { i.textContent = ''; i.classList.remove('focus'); });
      btn.classList.remove('ok'); btn.textContent = 'Отправить заявку';
      return gsap.timeline({ delay: .2 })
        .add(type(inputs[0], .35)).add(type(inputs[1], .7)).add(type(inputs[2], .9))
        .to(btn, { scale: .96, duration: .12, yoyo: true, repeat: 1 }, '+=.15')
        .add(() => { btn.classList.add('ok'); btn.textContent = '✓ Заявка принята'; });
    },
    sc => {                                                   // 2. чат с менеджером
      const [who, m1, m2, typing, answer] = sc.querySelectorAll('.who, .msg');
      return gsap.timeline()
        .fromTo(who, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4 })
        .fromTo(m1, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: 'back.out(1.6)' }, '+=.1')
        .fromTo(m2, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: 'back.out(1.6)' }, '+=.5')
        .fromTo(typing, { opacity: 0, display: 'flex' }, { opacity: 1, duration: .25 }, '+=.3')
        .set(answer, { opacity: 0, display: 'none' }, 0)
        .to(typing, { opacity: 0, display: 'none', duration: .2 }, '+=1')
        .fromTo(answer, { opacity: 0, y: 14, display: 'flex' }, { opacity: 1, y: 0, duration: .45, ease: 'back.out(1.6)' });
    },
    sc => {                                                   // 3. подбор эксперта: сканирование и выбор
      const cands = [...sc.querySelectorAll('.cand')], scan = sc.querySelector('.scan'), fit = sc.querySelector('.fit');
      cands.forEach(c => c.classList.remove('pick'));
      return gsap.timeline()
        .fromTo(sc.querySelector('.scene-h'), { opacity: 0 }, { opacity: 1, duration: .3 })
        .fromTo(cands, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: .5, stagger: .12, ease: 'power3.out' }, .1)
        .fromTo(scan, { opacity: 1, y: 0 }, { y: 150, duration: .7, ease: 'sine.inOut', yoyo: true, repeat: 2 }, '+=.1')
        .to(scan, { opacity: 0, duration: .2 })
        .add(() => cands[0].classList.add('pick'))
        .to(cands.slice(1), { opacity: .35, duration: .4 }, '<')
        .fromTo(fit, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(2.4)' }, '<');
    },
    sc => {                                                   // 4. документ прорисовывается, ставится штамп
      return gsap.timeline()
        .fromTo(sc.querySelector('.doc'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' })
        .fromTo(sc.querySelectorAll('.doc-l'), { scaleX: 0 }, { scaleX: 1, duration: .45, stagger: .1, ease: 'power2.out' }, .2)
        .fromTo(sc.querySelector('.stamp'), { opacity: 0, scale: 2.2, rotation: -24 }, { opacity: 1, scale: 1, rotation: -8, duration: .5, ease: 'back.out(1.8)' }, '+=.15')
        .fromTo(sc.querySelectorAll('.chip'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4, stagger: .1 }, '-=.1');
    },
    sc => {                                                   // 5. сопровождение
      return gsap.timeline()
        .fromTo(sc.querySelector('.who'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4 })
        .fromTo(sc.querySelector('.msg'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: 'back.out(1.6)' }, '+=.1')
        .fromTo(sc.querySelector('.todo'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45 }, '+=.2')
        .fromTo(sc.querySelectorAll('.todo li'), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: .35, stagger: .15 }, '-=.2');
    },
  ];

  let cur = -1, running = null;
  function setStep(i, instant) {
    if (i === cur) return;
    const prev = cur; cur = i;
    steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); });
    status.textContent = STATUS[i];
    bar.style.width = `${(i + 1) * 20}%`;

    running && running.kill();
    gsap.set(scenes, { autoAlpha: 0 });
    gsap.set(scenes[i], { autoAlpha: 1 });
    if (instant || reduced) { running = SCENES[i](scenes[i]); running.progress(1); }
    else {
      gsap.fromTo(scenes[i], { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' });
      running = SCENES[i](scenes[i]);
    }

    // клякса меняет цвет и пружинисто «подпрыгивает»
    blob.style.setProperty('--blob', BLOB[i % 2]);
    if (!instant && !reduced) gsap.fromTo(blob, { scale: .82 }, { scale: 1, duration: .9, ease: 'elastic.out(1, .45)', overwrite: true });

    // Утя над окном меняет позу: предыдущая уезжает вниз за окно, новая выглядывает
    if (prev >= 0) gsap.to(ducks[prev], { yPercent: 70, opacity: 0, duration: .35, ease: 'power2.in', overwrite: true });
    gsap.fromTo(ducks[i], { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: instant || reduced ? 0 : .6, delay: prev >= 0 ? .2 : 0, ease: 'back.out(1.8)', overwrite: true });
  }

  function init() {
    // ?proc=3 — показать этап сразу в конечном состоянии, без скролла (для скриншотов)
    const dbg = new URLSearchParams(location.search).get('proc');
    if (dbg !== null) {
      document.querySelector('#hero').style.display = 'none';
      document.querySelector('#advantages').style.display = 'none';
      setStep(+dbg - 1, true);
      gsap.set(rail, { scaleY: (+dbg - .5) / 5 });
      return;
    }
    setStep(0, true);

    if (!reduced) gsap.timeline({ scrollTrigger: { trigger: $('.proc-head'), start: 'top 85%' }, defaults: { ease: 'expo.out' } })
      .from($('.proc .eyebrow'), { y: 14, opacity: 0, duration: .9 })
      .from($$('.proc-head .wi'), { yPercent: 115, opacity: 0, filter: 'blur(8px)', duration: 1.2, stagger: .03 }, .1);

    if (!mobile) {
      // десктоп: секция закреплена, 5 этапов делят длину скролла поровну
      const st = ScrollTrigger.create({
        trigger: sec, start: 'top top', end: '+=2800', pin: true,
        onUpdate: self => {
          gsap.set(rail, { scaleY: self.progress });
          setStep(Math.min(4, Math.floor(self.progress * 5)));
        },
      });
      // клик по шагу — плавно прокрутить к нему
      steps.forEach((s, i) => s.addEventListener('click', () => {
        const y = st.start + (st.end - st.start) * (i + .5) / 5;
        window.__lenis ? window.__lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' });
      }));
    } else {
      // телефон: окно «липкое», шаги прокручиваются под ним
      steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 65%', end: 'bottom 65%', onToggle: self => self.isActive && setStep(i) }));
      ScrollTrigger.create({ trigger: $('.steps'), start: 'top 65%', end: 'bottom 65%', onUpdate: self => gsap.set(rail, { scaleY: self.progress }) });
    }
  }

  const dbg = new URLSearchParams(location.search).has('proc');
  (window.__heroReady || dbg) ? init() : addEventListener('hero-ready', init, { once: true });
})();
