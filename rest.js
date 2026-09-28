// Простые секции: каталог услуг (фильтры, «показать ещё», окно «Подробнее»), форма заявки.
// Данные — из макета и документа «Услуги для ути» (API сайта сейчас отвечает 404).
// Блок специалистов временно убран (ознакомительная версия) — код лежит в исходники/специалисты-блок/.
(() => {
  // ---------- каталог ----------
  const IT = 'IT и цифровизация';
  const SERVICES = [
    { f: 'law', cat: 'Юридические услуги', img: 'svc-1', name: 'Юридическая консультация для бизнеса', short: 'Консультация по договору, рискам сделки, претензии, корпоративным и налоговым вопросам.', price: 'от 2 500 ₽' },
    { f: 'law', cat: 'Юридические услуги', img: 'svc-2', name: 'Регистрация ИП под ключ', short: 'Подготовка заявления, подбор ОКВЭД, сопровождение подачи документов.', price: 'от 5 000 ₽' },
    { f: 'law', cat: 'Юридические услуги', img: 'svc-3', name: 'Подготовка претензии контрагенту', short: 'Составление претензии по задолженности, нарушению срока или условий договора.', price: 'от 4 000 ₽' },
    { f: 'law', cat: 'Юридические услуги', img: 'svc-4', name: 'Регистрация ООО под ключ', short: 'Пакет документов для регистрации ООО, подбор ОКВЭД, устав, консультация по налоговому режиму.', price: 'от 10 000 ₽' },
    { f: 'law', cat: 'Юридические услуги', img: 'svc-5', name: 'Правовая экспертиза договора', short: 'Проверка договора с выявлением рисков и корректировками для защиты ваших интересов.', price: 'от 6 000 ₽' },
    { f: 'fin', cat: 'Финансы и налоги', img: 'svc-6', name: 'Бизнес-план с финансовой моделью', short: 'Бизнес-план для запуска, банка, инвестора или гранта с расчётом экономики проекта.', price: 'от 25 000 ₽' },
    { f: 'fin', cat: 'Бухгалтерские услуги', img: 'svc-acc', name: 'Онлайн-бухгалтерия', short: 'Ведение бухгалтерского и налогового учёта, расчёт налогов и сдача отчётности.', price: '25 000 ₽', term: '1–2 рабочих дня', format: 'Онлайн / Очно',
      desc: 'Ведение бухгалтерского и налогового учета: учет первичных документов, учет доходов и расходов, расчет налогов и страховых взносов, поиск законных вариантов снижения налоговой нагрузки, подготовка и сдача отчетности, работа с требованиями ФНС.' },
    { f: 'it', cat: 'Веб-разработка', name: 'Разработка лендинга под ключ', short: 'Создание одностраничного сайта для презентации продукта или услуги с высокой конверсией.', price: 'от 8 000 ₽', term: '3–7 рабочих дней',
      desc: 'Разработка адаптивного одностраничного сайта (Landing Page) с уникальным дизайном, версткой и базовой SEO-оптимизацией. Идеально подходит для запуска новых продуктов, акций или сбора заявок. Включает подключение форм захвата и аналитики.' },
    { f: 'it', cat: 'Веб-разработка', name: 'Разработка многостраничного сайта', short: 'Создание корпоративного сайта или каталога с продуманной структурой и удобной навигацией.', price: 'от 15 000 ₽', term: 'от 1 до 4 недель',
      desc: 'Проектирование и разработка многостраничного сайта. Включает создание структуры, дизайн ключевых страниц, адаптивную верстку и подключение системы управления контентом (CMS) для самостоятельного редактирования контента.' },
    { f: 'it', cat: 'Веб-разработка', name: 'Разработка SaaS-платформы', short: 'Создание облачного сервиса с подписочной моделью, личным кабинетом и панелью администратора.', price: 'от 100 000 ₽', term: 'от 1 месяца',
      desc: 'Разработка архитектуры и создание SaaS-решения. Включает проектирование базы данных, разработку бэкенда, личного кабинета пользователя, панели администратора и системы биллинга. Масштабируемое решение для стартапов и бизнеса.' },
    { f: 'it', cat: 'Веб-разработка', name: 'Сайт на WordPress', short: 'Быстрый запуск сайта на популярной CMS с настройкой готовой или кастомной темы.', price: 'от 8 000 ₽', term: '3–10 рабочих дней',
      desc: 'Установка и настройка WordPress, адаптация готовой темы или верстка по вашему макету. Настройка необходимых плагинов, форм обратной связи, базовых элементов SEO и обучение по управлению сайтом.' },
    { f: 'it', cat: 'Веб-разработка', name: 'Сайт на Tilda', short: 'Создание стильного сайта на конструкторе Tilda без программирования.', price: 'от 8 000 ₽', term: '2–5 рабочих дней',
      desc: 'Дизайн и сборка сайта на платформе Tilda. Включает настройку Zero Block, адаптацию под мобильные устройства, подключение домена и настройку форм сбора данных. Отличный выбор для быстрого и бюджетного запуска.' },
    { f: 'it', cat: 'Мобильная разработка', name: 'Разработка мобильного приложения', short: 'Создание кроссплатформенного или нативного приложения для iOS и Android.', price: 'от 30 000 ₽', term: 'от 1 месяца',
      desc: 'Полный цикл разработки мобильного приложения: от проектирования интерфейса до публикации в App Store и Google Play. Работаем с Flutter, Ionic. Интеграция с API и push-уведомлениями.' },
    { f: 'it', cat: 'Автоматизация', name: 'Разработка чат-бота', short: 'Создание ботов для Telegram, WhatsApp или других мессенджеров для автоматизации продаж и поддержки.', price: 'от 8 000 ₽', term: '2–7 рабочих дней',
      desc: 'Разработка сценариев и программирование чат-бота. Интеграция с CRM, платежными системами и базами данных. Подходит для службы поддержки, массовых рассылок и построения воронок продаж.' },
    { f: 'it', cat: 'E-commerce', name: 'Разработка интернет-магазина', short: 'Создание полноценного онлайн-магазина с каталогом, корзиной, оплатой и личным кабинетом.', price: 'от 200 000 ₽', term: 'от 1.5 месяцев',
      desc: 'Разработка интернет-магазина под ключ. Включает интеграцию с 1С, настройку платежных шлюзов, служб доставки, личного кабинета и системы управления заказами. Высокая нагрузочная способность и безопасность.' },
    { f: 'it', cat: 'Веб-разработка', name: 'Разработка веб-портала', short: 'Создание сложных высоконагруженных порталов с разграничением прав доступа.', price: 'от 100 000 ₽', term: 'от 2 месяцев',
      desc: 'Проектирование и разработка корпоративных порталов, государственных сервисов или крупных информационных платформ. Высокие требования к безопасности, отказоустойчивости и масштабируемости.' },
    { f: 'it', cat: 'Дизайн', name: 'UX/UI дизайн интерфейсов', short: 'Проектирование удобных и современных интерфейсов для веб и мобильных приложений.', price: 'от 10 000 ₽', term: '1–3 недели',
      desc: 'Анализ целевой аудитории, создание прототипов (wireframes), разработка визуального стиля и дизайн-макетов в Figma. Подготовка UI-kit для разработчиков. Ориентация на удобство пользователя и бизнес-метрики.' },
    { f: 'it', cat: 'Разработка продуктов', name: 'Разработка MVP продукта', short: 'Быстрый запуск минимально жизнеспособной версии продукта для тестирования гипотез.', price: 'от 100 000 ₽', term: 'от 1 месяца',
      desc: 'Формирование гипотез, проектирование и разработка MVP. Позволяет быстро вывести продукт на рынок, собрать обратную связь от первых пользователей и привлечь инвестиции. Минимальный набор функций для старта.' },
    { f: 'it', cat: 'Data & AI', name: 'Разработка ML-моделей', short: 'Внедрение машинного обучения для автоматизации процессов и анализа данных.', price: 'от 50 000 ₽', term: 'от 3 недель',
      desc: 'Сбор и подготовка данных, обучение и валидация моделей машинного обучения, интеграция ML-решений в существующую инфраструктуру бизнеса. Работа с Computer Vision, NLP и предиктивной аналитикой.' },
    { f: 'it', cat: 'Аналитика', name: 'Аналитика проекта', short: 'Исследование рынка, анализ конкурентов и формирование требований к продукту.', price: '15 000 ₽', term: '3–5 рабочих дней',
      desc: 'Комплексный анализ бизнес-требований, исследование целевой аудитории и конкурентной среды. Формирование технического задания (ТЗ) и дорожной карты проекта. Помогает избежать лишних затрат на разработку.' },
  ];
  const PAGE = 6;
  const grid = document.querySelector('.svc-grid'), moreBtn = document.querySelector('#services .more');
  let svcFilter = 'all', shown = PAGE;

  const card = (s, i) => `
    <article class="svc">
      <div class="svc-img"><img src="assets/site/${s.img || 'svc-it'}.webp" alt="" loading="lazy"${s.img && s.img !== 'svc-acc' ? '' : ' style="object-position: 50% 38%"'}></div>
      <div class="svc-body">
        <div class="svc-cat">${s.f === 'it' ? IT : s.cat}</div>
        <h3>${s.name}</h3><p>${s.short}</p>
        <div class="svc-foot"><span class="svc-price">${s.price}</span><button class="btn btn-yellow btn-sm" type="button" data-i="${i}">Подробнее</button></div>
      </div>
    </article>`;

  function renderServices(animate) {
    const list = SERVICES.map((s, i) => [s, i]).filter(([s]) => svcFilter === 'all' || s.f === svcFilter);
    grid.innerHTML = list.length
      ? list.slice(0, shown).map(([s, i]) => card(s, i)).join('')
      : '<div class="empty"><b>Скоро добавим услуги этого направления</b>Оставьте заявку — подберём эксперта под вашу задачу уже сейчас.</div>';
    const rest = list.length - shown;
    moreBtn.style.display = rest > 0 ? '' : 'none';
    moreBtn.textContent = `Показать ещё услуги (${rest})`;
    reveal(grid.children, animate);
  }
  document.querySelectorAll('#services .fchip').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#services .fchip').forEach(x => x.classList.toggle('on', x === b));
    svcFilter = b.dataset.f; shown = PAGE; renderServices(true);
  }));
  moreBtn.addEventListener('click', () => {
    const before = grid.children.length; shown += PAGE; renderServices(false);
    reveal([...grid.children].slice(before), true);
    window.ScrollTrigger && ScrollTrigger.refresh();
  });

  // окно «Подробнее»
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = '<div class="modal-card" role="dialog" aria-modal="true"><button class="modal-x" type="button" aria-label="Закрыть">×</button><div class="modal-in"></div></div>';
  document.body.append(modal);
  const closeModal = () => modal.classList.remove('open');
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.modal-x')) closeModal(); });
  addEventListener('keydown', e => e.key === 'Escape' && closeModal());
  grid.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) openService(+b.dataset.i); });
  function openService(i) {
    const s = SERVICES[i];
    modal.querySelector('.modal-card').classList.add('svc-modal');
    modal.querySelector('.modal-in').innerHTML = `
      <img class="svm-img" src="assets/site/${s.img || 'svc-it'}.webp" alt="">
      <div class="svm-body">
        <div class="svc-cat">${s.cat}</div><h3>${s.name}</h3>
        <div class="svm-price">${s.price}</div>
        <div class="svm-stats">${s.term ? `<div><small>СРОК</small><b>${s.term}</b></div>` : ''}<div><small>ФОРМАТ</small><b>${s.format || 'Удалённо'}</b></div></div>
        <p>${s.desc || s.short}</p>
        <form class="svm-form" novalidate>
          <h4>Оставить заявку на эту услугу</h4>
          <label class="f">Услуга<input type="text" value="${s.name}" readonly></label>
          <label class="f">Имя *<input type="text" name="name" placeholder="Ваше имя"></label>
          <label class="f">Телефон *<input type="tel" name="phone" placeholder="+7 (___) ___-__-__"></label>
          <label class="f">Email *<input type="email" name="email" placeholder="email@example.com"></label>
          <label class="f">Сообщение<textarea name="message" placeholder="Опишите вашу задачу..."></textarea></label>
          <button class="btn btn-yellow" type="submit"><span>🚀 Отправить заявку</span></button>
        </form>
      </div>`;
    modal.querySelector('.svm-form').addEventListener('submit', e => {       // прототип: заявка никуда не уходит
      e.preventDefault(); const f = e.target;
      const bad = ['name', 'phone', 'email'].find(n => !f[n].value.trim());
      if (bad) { f[bad].focus(); return; }
      f.innerHTML = '<div class="form-ok" style="display:block"><img src="assets/proc-5.webp" alt="" width="110" style="margin:0 auto"><b>Заявка принята!</b><p>Свяжемся в течение одного рабочего дня.</p></div>';
    });
    modal.classList.add('open');
  }
  modal.addEventListener('click', e => { if (e.target.closest('a[href="#contacts"]')) closeModal(); });

  // ---------- форма ----------
  const form = document.querySelector('.form'), send = form.querySelector('button[type=submit]');
  const sync = () => { send.disabled = !(form.c1.checked && form.c2.checked); };
  form.addEventListener('change', sync);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = ['name', 'phone', 'email'].filter(n => !form[n].value.trim());
    if (bad.length) { form[bad[0]].focus(); return; }
    form.classList.add('sent');          // прототип: заявка никуда не отправляется, только показываем «спасибо»
  });

  renderServices(false);

  // ?only=rest — показать только эти секции, без анимаций (для скриншотов)
  const only = new URLSearchParams(location.search).get('only') === 'rest';
  if (only) ['#hero', '#advantages', '#process', '#it'].forEach(s => { document.querySelector(s).style.display = 'none'; });
  // ?only=rest&svc=6 — открыть окно услуги №6 (номер в массиве SERVICES)
  const svcDbg = new URLSearchParams(location.search).get('svc');
  if (only && svcDbg !== null) { ['#services', '.promo'].forEach(q => { document.querySelector(q).style.display = 'none'; }); openService(+svcDbg); }

  // ---------- мягкое появление при скролле ----------
  // Движение — только CSS-переход (.rv → .rv.in), двигается свойство translate, а hover у карточек — transform,
  // поэтому они не спорят. Момент появления — функция check() ниже.
  const calm = only || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = (els, step) => els.forEach((el, i) => { el.style.setProperty('--d', `${i * step}s`); el.classList.add('in'); });
  function watch(els) {                           // спрятать мгновенно — без перехода «исчезания» при загрузке
    if (calm) return;
    els = [...els];
    els.forEach(el => { el.style.transition = 'none'; el.classList.add('rv'); });
    void document.body.offsetWidth;
    els.forEach(el => { el.style.transition = ''; });
  }
  function reveal(els, animate) {                 // карточки после фильтра / «показать ещё»: волной, сразу
    if (!animate || calm) return;                 // !animate первым: при первой отрисовке calm ещё не объявлена
    els = [...els];
    els.forEach(el => { el.classList.remove('in'); el.classList.add('rv'); });
    void grid.offsetWidth;                        // зафиксировать начальное состояние, чтобы переход сработал
    show(els, .05);
  }
  watch(document.querySelectorAll('[data-reveal]'));
  watch(grid.children);
  // Проверка на каждой прокрутке: элемент появляется, когда его верх поднялся выше 86% высоты экрана.
  // Не зависит от порядка создания закреплённых секций (GSAP) — просто меряет, где элемент сейчас.
  function check() {
    const line = innerHeight * .86, fresh = [];
    document.querySelectorAll('.rv:not(.in)').forEach(el => {
      if (el.offsetParent !== null && el.getBoundingClientRect().top < line) fresh.push(el);
    });
    if (fresh.length) show(fresh, .07);
  }
  const start = () => {
    if (calm) return;
    addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    if (window.__lenis) window.__lenis.on('scroll', check);   // плавная прокрутка Lenis
    check();
    // ?goto=%23contacts — через 4 с прокрутить к блоку (для проверки в фоновом браузере, где нет событий scroll)
    const go = new URLSearchParams(location.search).get('goto');
    if (go) setTimeout(() => { const el = document.querySelector(go); if (el) { scrollTo(0, el.getBoundingClientRect().top + scrollY - 100); setTimeout(check, 100); } }, 4000);
  };
  window.__heroReady ? start() : addEventListener('hero-ready', start, { once: true });
})();
