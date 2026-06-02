/* ================================================================
   AGILE BUSINESS — Main JavaScript
   Cursor · Parallax · 3D · Scroll Reveal · Theme · Lang · Forms
   ================================================================ */
(function () {
    'use strict';

    const $ = (s, p) => (p || document).querySelector(s);
    const $$ = (s, p) => [...(p || document).querySelectorAll(s)];
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Analytics / Page Tracking ──────────────────────
       /api/track часто попадает под общий rate-limit прокси (429) при F5.
       Дедуп + отложенный POST снижают параллельный залп с i18n/pages/analytics. */
    function trackVisit() {
        try {
            const h = (location.hostname || '').toLowerCase();
            if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return;
        } catch (e) { /* ignore */ }

        const path = location.pathname + location.search;
        const now = Date.now();
        try {
            const raw = sessionStorage.getItem('ab_track_last');
            if (raw) {
                const o = JSON.parse(raw);
                if (o && o.p === path && (now - o.t) < 4000) return;
            }
            sessionStorage.setItem('ab_track_last', JSON.stringify({ p: path, t: now }));
        } catch (e) { /* ignore */ }

        const ua = navigator.userAgent;
        let device = 'desktop';
        if (/Mobi|Android/i.test(ua)) device = 'tablet';
        if (/iPhone|iPod|Android.*Mobile/i.test(ua)) device = 'mobile';

        let browser = 'Other';
        if (/Edg\//i.test(ua)) browser = 'Edge';
        else if (/Chrome/i.test(ua)) browser = 'Chrome';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/Safari/i.test(ua)) browser = 'Safari';

        let os = 'Other';
        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Mac OS/i.test(ua)) os = 'macOS';
        else if (/Linux/i.test(ua)) os = 'Linux';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iOS|iPhone/i.test(ua)) os = 'iOS';

        const body = JSON.stringify({
            page: location.pathname,
            referrer: document.referrer,
            device: device,
            browser: browser,
            os: os
        });

        const delay = 500 + Math.floor(Math.random() * 400);
        setTimeout(() => {
            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                credentials: 'same-origin',
                cache: 'no-store'
            }).catch(() => {});
        }, delay);
    }
    trackVisit();

    /* ── Loading Screen ──────────────────────────────── */
    const loader = $('#loader');
    if (loader) {
        loader.classList.add('loaded');
        loader.setAttribute('aria-hidden', 'true');
        setTimeout(() => { loader.style.display = 'none'; }, 0);
    }

    /* ── Custom Cursor ───────────────────────────────── */
    const cursor = $('#cursor');
    const follower = $('#cursor-follower');

    if (cursor && follower && window.matchMedia('(pointer: fine)').matches) {
        let mx = 0, my = 0;
        let dx = 0, dy = 0;
        let rx = 0, ry = 0;
        let isHover = false;
        let animating = false;

        function cursorTick() {
            rx += (mx - rx) * 0.15;
            ry += (my - ry) * 0.15;

            /* Clamp dot inside follower circle */
            var fR = isHover ? 35 : 22;   /* visual follower radius */
            var maxD = fR - 4;             /* minus dot radius */
            var offX = mx - rx, offY = my - ry;
            var dist = Math.sqrt(offX * offX + offY * offY);
            if (dist > maxD) { offX = offX / dist * maxD; offY = offY / dist * maxD; }
            dx = rx + offX;
            dy = ry + offY;

            cursor.style.transform = `translate3d(${dx - 4}px, ${dy - 4}px, 0)`;
            follower.style.transform = `translate3d(${rx - 22}px, ${ry - 22}px, 0) scale(${isHover ? 1.6 : 1})`;
            if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) {
                requestAnimationFrame(cursorTick);
            } else {
                animating = false;
            }
        }

        document.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
            if (!animating) { animating = true; requestAnimationFrame(cursorTick); }
        });

        document.addEventListener('mousedown', () => {
            cursor.classList.add('cursor--click');
            follower.classList.add('cursor-follower--click');
        });
        document.addEventListener('mouseup', () => {
            cursor.classList.remove('cursor--click');
            follower.classList.remove('cursor-follower--click');
        });

        /* Event delegation: one listener instead of N listeners per hover element.
           Работает для динамически вставленных [data-hover] (статьи, проекты) без MutationObserver. */
        const HOVER_SELECTOR = 'a, button, [data-hover], input, textarea, select, .service-card, .approach__step, .portfolio-card, .article-card, .calc-option';
        let hoverCurrent = null;
        document.addEventListener('mouseover', e => {
            const el = e.target.closest(HOVER_SELECTOR);
            if (!el || el === hoverCurrent) return;
            hoverCurrent = el;
            isHover = true;
            cursor.classList.add('cursor--hover');
            follower.classList.add('cursor-follower--hover');
        }, { passive: true });
        document.addEventListener('mouseout', e => {
            if (!hoverCurrent) return;
            const to = e.relatedTarget;
            if (to && hoverCurrent.contains && hoverCurrent.contains(to)) return;
            hoverCurrent = null;
            isHover = false;
            cursor.classList.remove('cursor--hover');
            follower.classList.remove('cursor-follower--hover');
        }, { passive: true });
    } else {
        if (cursor) cursor.style.display = 'none';
        if (follower) follower.style.display = 'none';
    }

    /* ── Navigation ──────────────────────────────────── */
    const nav = $('#nav');
    const burger = $('#burger');
    const mobileMenu = $('#mobile-menu');
    const hasHeroSection = !!$('#hero');
    let lastScroll = 0;
    let scrollY = window.scrollY || 0;
    let scrollTicking = false;

    function handleScrollTick() {
        const y = scrollY;

        if (nav) {
            const shouldSolid = !hasHeroSection || y > 50;
            nav.classList.toggle('scrolled', shouldSolid);
            if (y > lastScroll && y > 300) nav.classList.add('nav--hidden');
            else nav.classList.remove('nav--hidden');
            lastScroll = y;
        }

        handleParallax(y);
    }

    if (nav) {
        window.addEventListener('scroll', () => {
            scrollY = window.scrollY || 0;
            if (scrollTicking) return;
            scrollTicking = true;
            requestAnimationFrame(() => {
                scrollTicking = false;
                handleScrollTick();
            });
        }, { passive: true });
    }

    if (burger && mobileMenu) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        $$('.mobile-menu__link').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    /* ── Smooth Anchor Scroll ────────────────────────── */
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ── Scroll Reveal (IntersectionObserver) ──────────
       Важно: на /works и /articles карточки подгружаются после main.js (pages.js/articles.js).
       Без наблюдателя за DOM они навсегда остаются с opacity:0 (.reveal без .revealed). */
    if (!('IntersectionObserver' in window)) {
        // Fallback: show all .reveal elements immediately
        $$('.reveal').forEach(el => el.classList.add('revealed'));
    } else {
    const revealObserver = new IntersectionObserver(
        entries => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                        revealObserver.unobserve(entry.target);
                    }, i * 80);
                }
            });
        },
        { threshold: 0.05, rootMargin: '0px 0px 80px 0px' }
    );
    function scheduleRevealIfAlreadyVisible(el) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!el || !el.isConnected || el.classList.contains('revealed')) return;
                const r = el.getBoundingClientRect();
                const vh = window.innerHeight || document.documentElement.clientHeight || 0;
                // Если блок уже в зоне видимости при вставке — не ждём второго кадра scroll/IO
                if (r.bottom > -40 && r.top < vh + 120) {
                    el.classList.add('revealed');
                    try { revealObserver.unobserve(el); } catch (e) { /* noop */ }
                }
            });
        });
    }
    function watchRevealEl(el) {
        if (!el || el.nodeType !== 1) return;
        if (!el.classList.contains('reveal') || el.classList.contains('revealed')) return;
        if (el.getAttribute('data-reveal-observed')) return;
        el.setAttribute('data-reveal-observed', '1');
        revealObserver.observe(el);
        scheduleRevealIfAlreadyVisible(el);
    }
    /** После AJAX/innerHTML: принудительно показать .reveal, которые уже в viewport */
    window.abForceRevealVisible = function (root) {
        const nodes = root && root.querySelectorAll
            ? root.querySelectorAll('.reveal:not(.revealed)')
            : document.querySelectorAll('.reveal:not(.revealed)');
        nodes.forEach(el => {
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight || 0;
            if (r.bottom > -40 && r.top < vh + 120) {
                el.classList.add('revealed');
                try { revealObserver.unobserve(el); } catch (e) { /* noop */ }
            }
        });
    };
    window.abWatchReveal = watchRevealEl;
    $$('.reveal').forEach(watchRevealEl);
    const revealMutation = new MutationObserver(muts => {
        for (const m of muts) {
            for (const node of m.addedNodes) {
                if (!node || node.nodeType !== 1) continue;
                if (node.matches && node.matches('.reveal')) watchRevealEl(node);
                if (node.querySelectorAll) node.querySelectorAll('.reveal').forEach(watchRevealEl);
            }
        }
    });
    revealMutation.observe(document.documentElement, { childList: true, subtree: true });
    } // end IntersectionObserver support check

    /* ── Counter Animation ───────────────────────────── */
    const counters = $$('[data-count]');
    if (counters.length && ('IntersectionObserver' in window)) {
        const counterObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count, 10);
                    const suffix = el.dataset.suffix || '';
                    const duration = 2000;
                    const start = performance.now();
                    function step(now) {
                        const progress = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 4);
                        el.textContent = Math.floor(target * eased) + suffix;
                        if (progress < 1) requestAnimationFrame(step);
                    }
                    requestAnimationFrame(step);
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(el => counterObserver.observe(el));
    }

    /* ── Hero: интерактивная сетка точек, отталкивается от курсора ── */
    (function initHeroParticleGrid() {
        if (isMobile || prefersReducedMotion) return;
        const canvas = document.getElementById('heroParticleGrid');
        const hero = document.getElementById('hero');
        if (!canvas || !hero) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const mouse = { x: -9999, y: -9999 };
        let dots = [];
        const spacing = 40;
        const radius = 150;
        let running = false;
        let rafId = 0;
        let accent = [255, 61, 82];
        try {
            const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
            const m = v.match(/#?([0-9a-f]{6})/i);
            if (m) {
                accent = [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
            }
        } catch (e) { /* fall through to default */ }

        function initDots() {
            const w = hero.offsetWidth;
            const h = hero.offsetHeight;
            canvas.width = Math.floor(w * DPR);
            canvas.height = Math.floor(h * DPR);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(DPR, DPR);
            dots = [];
            for (let x = spacing; x < w; x += spacing) {
                for (let y = spacing; y < h; y += spacing) {
                    dots.push({ ox: x, oy: y, x, y });
                }
            }
        }
        initDots();
        window.addEventListener('resize', () => { initDots(); }, { passive: true });

        hero.addEventListener('mousemove', e => {
            const rect = hero.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        }, { passive: true });
        hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

        function draw() {
            if (!running) return;
            const w = hero.offsetWidth;
            const h = hero.offsetHeight;
            ctx.clearRect(0, 0, w, h);
            const baseColor = `rgba(${accent[0]},${accent[1]},${accent[2]},0.12)`;
            for (let i = 0; i < dots.length; i++) {
                const d = dots[i];
                const dx = mouse.x - d.ox;
                const dy = mouse.y - d.oy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < radius) {
                    const force = 1 - dist / radius;
                    d.x = d.ox - dx * force * 0.3;
                    d.y = d.oy - dy * force * 0.3;
                    ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${(force * 0.8 + 0.12).toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, 1.4 + force * 1.8, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    d.x += (d.ox - d.x) * 0.1;
                    d.y += (d.oy - d.y) * 0.1;
                    ctx.fillStyle = baseColor;
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            rafId = requestAnimationFrame(draw);
        }

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    running = true;
                    if (!rafId) rafId = requestAnimationFrame(draw);
                } else {
                    running = false;
                    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
                }
            }, { threshold: 0.05 });
            io.observe(hero);
        } else {
            running = true;
            rafId = requestAnimationFrame(draw);
        }
    })();

    /* ── Parallax on Scroll ──────────────────────────── */
    const heroContent = $('.hero__content');
    const parallaxBackdrop = $('.hero__backdrop');

    function handleParallax(y) {
        if (typeof y !== 'number') y = window.scrollY || 0;
        const vh = window.innerHeight;
        if (y > vh * 1.5) return;

        if (!prefersReducedMotion && heroContent) {
            heroContent.style.opacity = 1 - y / (vh * 1.1);
        } else if (prefersReducedMotion && heroContent) {
            heroContent.style.opacity = '1';
        }
        if (parallaxBackdrop && !prefersReducedMotion) {
            parallaxBackdrop.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0)';
        } else if (parallaxBackdrop && prefersReducedMotion) {
            parallaxBackdrop.style.transform = '';
        }
    }
    handleScrollTick();

    /* ── 3D Card Tilt ────────────────────────────────── */
    function setup3DTilt(el, intensity) {
        if (!el || window.matchMedia('(hover: none)').matches) return;
        intensity = intensity || 12;
        const servicesPanel = () => document.getElementById('servicesPanel');
        el.addEventListener('mousemove', e => {
            const panel = servicesPanel();
            if (panel && panel.getAttribute('aria-hidden') === 'false') return;
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.02,1.02,1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    }

    const aboutCard = $('#aboutCard');
    if (aboutCard) setup3DTilt(aboutCard, 15);
    $$('.service-card').forEach(card => {
        /* В сетке услуг tilt отключён */
        if (card.closest('.services__grid')) return;
        setup3DTilt(card, 6);
    });

    /* ── Services: карточки + панель деталей (без ripple, спокойное открытие) ─── */
    (function initServiceDetails() {
        /* ── Методология: словарь контента (до return по DOM услуг — нужен для initApproachDetails) ─ */
        const APPROACH_DETAILS = {
            ru: {
                discovery: {
                    stage: 'Этап 01',
                    title: 'Диагностика',
                    text: 'Честно смотрим на бизнес и его процессы глазами внешней команды. Задача — не «поругать», а выявить реальные причины того, где теряется прибыль, клиенты и время, и с чего нужно начать, чтобы получить эффект за 2–3 месяца.',
                    items: [
                        'Интервью с собственником, топ-менеджерами и ключевыми сотрудниками',
                        'Анализ финансовой отчётности, P&L, cash flow и unit-экономики',
                        'Аудит бизнес-процессов: продажи, производство, сервис, IT',
                        'Проверка воронки маркетинга и каналов привлечения клиентов',
                        'Анализ оргструктуры, KPI, системы мотивации и зон ответственности',
                        'Изучение конкурентной среды, позиционирования и доли рынка'
                    ],
                    results: [
                        'Отчёт с точной картой проблем и их финансовым весом',
                        'Приоритизированный список точек роста с оценкой эффекта',
                        'Карта рисков и узких мест, которые надо закрыть в первую очередь',
                        'Пакет гипотез и первые быстрые победы (quick wins) на 30–60 дней'
                    ]
                },
                strategy: {
                    stage: 'Этап 02',
                    title: 'Стратегия',
                    text: 'Переводим выводы из диагностики в конкретный план действий с цифрами, сроками и ответственными. Стратегия — это не толстый документ «в стол», а рабочий инструмент, которым пользуется команда каждую неделю.',
                    items: [
                        'Формулирование целей на 6/12/24 месяца и декомпозиция до задач',
                        'Разработка финансовой модели и целевых показателей (KPI, OKR)',
                        'Roadmap инициатив: что, когда, кто делает, какой ожидаемый эффект',
                        'Проектирование новых бизнес-процессов «как должно быть»',
                        'План по команде: найм, ротация, обучение, система мотивации',
                        'Риск-менеджмент: сценарии A/B/C и план Б при проседании рынка'
                    ],
                    results: [
                        'Защищённая перед собственником стратегия в формате roadmap + модель',
                        'KPI-дерево, по которому можно управлять еженедельно',
                        'Набор регламентов и шаблонов для запуска изменений',
                        'Календарь инициатив и точек контроля на ближайшие 6–12 месяцев'
                    ]
                },
                execution: {
                    stage: 'Этап 03',
                    title: 'Реализация',
                    text: 'Самый «дорогой» и недооцененный этап: воплощение плана в реальность. Сопровождаем внедрение, помогаем команде пройти через сопротивление изменениям и корректируем курс по факту — не раз в год, а раз в 1–2 недели.',
                    items: [
                        'Назначение проектного офиса и регулярных точек контроля',
                        'Внедрение новых процессов, регламентов и инструментов',
                        'Настройка CRM, BI, учётных систем и интеграций между ними',
                        'Запуск маркетинговых активностей и новых продуктов',
                        'Операционное сопровождение: еженедельные статусы, разборы и корректировки',
                        'Работа с командой: обучение, коммуникации, поддержка лидеров изменений'
                    ],
                    results: [
                        'Работающие процессы и инструменты, а не презентации о них',
                        'Измеримые промежуточные результаты каждые 30 дней',
                        'Обученная команда, которая сама поддерживает изменения',
                        'Оперативные управленческие отчёты по факту, а не по плану'
                    ]
                },
                scale: {
                    stage: 'Этап 04',
                    title: 'Масштабирование',
                    text: 'Когда результаты зафиксированы и процессы работают стабильно, переходим к росту: расширяем успешные модели, тиражируем, выходим на новые рынки или запускаем новые продукты — но уже с подстрахованной базой.',
                    items: [
                        'Анализ достигнутых результатов и готовности к росту',
                        'Тиражирование работающих моделей (филиалы, франшиза, новые продукты)',
                        'Запуск в новых регионах, сегментах или странах',
                        'Привлечение финансирования под рост (инвесторы, банки, фонды)',
                        'Оптимизация оргструктуры под новый масштаб',
                        'Переход от ручного управления к системному: data-driven, автоматизация'
                    ],
                    results: [
                        'Рост выручки и маржи без потери управляемости',
                        'Отлаженная модель, готовая к тиражированию',
                        'Повышение капитализации и инвестиционной привлекательности',
                        'Бизнес работает и растёт без «ручного» режима собственника'
                    ]
                }
            },
            en: {
                discovery: { stage: 'Stage 01', title: 'Discovery', text: 'An honest external view of the business. Not blame, but facts: where profit, clients and time leak, and where to start to see impact in 2–3 months.', items: ['Interviews with owners, execs and key staff', 'Financial statements, P&L, cash flow and unit economics review', 'Process audit: sales, ops, service, IT', 'Marketing funnel and channel review', 'Org structure, KPI and motivation system review', 'Competitor and positioning analysis'], results: ['Map of problems with financial impact', 'Prioritized growth opportunities', 'Risk and bottleneck map', 'Quick-win hypotheses for 30–60 days'] },
                strategy: { stage: 'Stage 02', title: 'Strategy', text: 'We translate discovery findings into a concrete plan with numbers, deadlines and owners. A working tool — not a shelf document.', items: ['6/12/24 month goals decomposed into actions', 'Financial model and target KPIs/OKRs', 'Roadmap of initiatives with expected impact', '"To-be" process design', 'People plan: hiring, training, motivation', 'Risk management: A/B/C scenarios and plan B'], results: ['Roadmap + model defended with the owner', 'KPI tree for weekly management', 'Regulations and templates for rollout', '6–12 month control calendar'] },
                execution: { stage: 'Stage 03', title: 'Execution', text: 'The hardest and most underrated phase. We support rollout, help the team through resistance, and adjust course every 1–2 weeks.', items: ['PMO and regular control points', 'Process, regulation and tooling rollout', 'CRM, BI and ERP setup with integrations', 'Marketing and product launches', 'Weekly status, reviews and course correction', 'Training, communication and change leaders'], results: ['Working processes and tools — not slides', 'Measurable results every 30 days', 'Team that sustains the change', 'Operational reporting from facts, not plans'] },
                scale: { stage: 'Stage 04', title: 'Scale', text: 'Once results and processes are stable, we grow: replicate working models, enter new markets or launch new products — on a secure base.', items: ['Readiness review and growth assessment', 'Replication: branches, franchise, new products', 'Expansion into new regions or segments', 'Growth funding (investors, banks, funds)', 'Org structure redesign for new scale', 'Shift from manual to data-driven management'], results: ['Revenue and margin growth without losing control', 'Repeatable model ready to scale', 'Higher valuation and investor appeal', 'Business grows without owner being the bottleneck'] }
            }
        };
        try { window.AB_APPROACH_DETAILS = APPROACH_DETAILS; } catch (e) { /* ignore */ }

        const cards = $$('.service-card[data-service]');
        const wrap = $('.services__grid-wrap');
        const panel = $('#servicesPanel');
        const clipEl = panel && panel.querySelector('.services-panel__clip');
        if (!cards.length || !panel || !wrap || !clipEl) return;

        /* Панель без ripple — сразу на весь блок (спокойнее для раздела услуг) */
        const RIPPLE_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';
        const RIPPLE_OPEN_MS = 0;
        const RIPPLE_CLOSE_MS = 0;
        const panelNoMotion = true;

        function setClipPath(el, value) {
            el.style.clipPath = value;
            el.style.webkitClipPath = value;
        }

        const DETAILS = {
            ru: {
                analytics: {
                    title: 'Бизнес-аналитика',
                    text: 'Прикладная аналитика для решений собственника и команды: рынок, воронка, процессы, люди, финансы и запуск продуктов. Цены ориентируем на прайс «средний бизнес»; в калькуляторе можно собрать набор услуг.',
                    items: [
                        'Анализ конкурентов, ЦА и CJM — позиционирование и карта пути клиента',
                        'Аудит воронки от лида до оплаты — где теряются деньги и конверсия',
                        'Система KPI и дашборды — управление по цифрам, а не по ощущениям',
                        'Карта процесса AS-IS и зоны автоматизации',
                        'Загрузка персонала и оргструктура — ФОТ и роли без лишних потерь',
                        'Экспресс-диагностика отдела продаж за 2 дня',
                        'Юнит-экономика: CAC, LTV, маржинальность, сценарии',
                        'Финансовый анализ и управленческая отчётность',
                        'Go-to-market для нового продукта',
                        'Бизнес-план и ТЭО под банк или инвестора',
                        'Плюс веб-, маркетинговая и сквозная аналитика, CRO, BI-панели'
                    ]
                },
                it: {
                    title: 'ИТ и Разработка',
                    text: 'Цифровые продукты и инфраструктура под задачу бизнеса: от аудита и стратегии до сайтов, сервисов, интеграций и ИБ. В прайсе — ориентиры по средней сложности из вашего IT-ценника.',
                    items: [
                        'IT-аудит, IT-стратегия на 1–3 года, консалтинг по цифровой трансформации',
                        'Лендинги, корпоративные сайты, интернет-магазины, SaaS',
                        'Сопровождение и развитие проектов (ретейнер)',
                        'Кроссплатформенные приложения, CRM/ERP, BI-панели',
                        'Анализ данных, AI-сервисы',
                        'Интеграции API, пентест, аудит информационной безопасности'
                    ]
                },
                creative: {
                    title: 'Креатив',
                    text: 'Три поднаправления — маркетинг, продажи и дизайн — снимают разрыв между «красиво» и «продаёт». Ниже структура по зонам ответственности.',
                    subs: [
                        {
                            title: 'Маркетинг',
                            items: [
                                'Позиционирование и brand-стратегия',
                                'Performance-маркетинг (реклама, SEO)',
                                'Контент-маркетинг и SMM',
                                'Построение маркетинговой воронки и коммуникаций'
                            ]
                        },
                        {
                            title: 'Продажи',
                            items: [
                                'Аудит воронки и процесса продаж',
                                'Скрипты, КП, обучение отдела продаж (sales enablement)'
                            ]
                        },
                        {
                            title: 'Дизайн',
                            items: [
                                'Фирменный стиль и айдентика',
                                'UI/UX продукта или сайта',
                                'Дизайн лендингов и ключевых страниц'
                            ]
                        }
                    ],
                    items: []
                }
            },
            en: {
                analytics: {
                    title: 'Business analytics',
                    text: 'Applied analytics for owners and teams: market, funnel, processes, people, finance and product launches. Pricing aligns with our mid-market rate card.',
                    items: [
                        'Competitors, ICP and customer journey mapping',
                        'Full funnel audit from lead to cash',
                        'KPI system and dashboards',
                        'Process mapping (as-is) and automation opportunities',
                        'Org load and structure',
                        '2-day sales team express diagnostics',
                        'Unit economics: CAC, LTV, margin scenarios',
                        'Financial analysis and management reporting',
                        'Go-to-market for new products',
                        'Business plan / feasibility study',
                        'Plus web, marketing & end-to-end analytics, CRO, BI'
                    ]
                },
                it: {
                    title: 'IT & Development',
                    text: 'Digital products and infrastructure: audit, strategy, sites, services, integrations and security — scoped to business outcomes.',
                    items: [
                        'IT audit, 1–3 year IT strategy, digital transformation consulting',
                        'Landings, corporate sites, e-commerce, SaaS',
                        'Ongoing support and evolution (retainer)',
                        'Cross-platform apps, CRM/ERP, BI',
                        'Data analysis, AI services',
                        'API integrations, pentest, information security audit'
                    ]
                },
                creative: {
                    title: 'Creative',
                    text: 'Three pillars — marketing, sales and design — aligned for revenue, not just visuals.',
                    subs: [
                        {
                            title: 'Marketing',
                            items: [
                                'Positioning and brand strategy',
                                'Performance marketing (ads, SEO)',
                                'Content marketing & SMM',
                                'Marketing funnel & communications'
                            ]
                        },
                        {
                            title: 'Sales',
                            items: [
                                'Sales funnel and process audit',
                                'Scripts, proposals, sales team enablement'
                            ]
                        },
                        {
                            title: 'Design',
                            items: [
                                'Brand identity',
                                'UI/UX for product or site',
                                'Landing and key page design'
                            ]
                        }
                    ],
                    items: []
                }
            }
        };

        function currentLang() {
            try { return localStorage.getItem('ab_lang') || document.documentElement.getAttribute('lang') || 'ru'; }
            catch { return 'ru'; }
        }

        let openKey = null;
        /** Точка круга: угол карточки (не центр), чтобы не было эффекта «из середины» */
        let lastRipple = null;
        let rippleClosing = false;

        function computeRipple(originEl) {
            const rbox = wrap.getBoundingClientRect();
            let ox = rbox.width * 0.5;
            let oy = rbox.height;
            if (originEl && originEl.getBoundingClientRect) {
                const c = originEl.getBoundingClientRect();
                ox = c.right - rbox.left;
                oy = c.bottom - rbox.top;
            }
            const r = Math.ceil(Math.hypot(Math.max(ox, rbox.width - ox), Math.max(oy, rbox.height - oy))) + 2;
            return { ox, oy, r };
        }

        function rippleRadiusAt(ox, oy) {
            const rbox = wrap.getBoundingClientRect();
            return Math.ceil(Math.hypot(Math.max(ox, rbox.width - ox), Math.max(oy, rbox.height - oy))) + 2;
        }

        function isPanelOpen() {
            return panel.getAttribute('aria-hidden') === 'false';
        }

        function fillPanelContent(key) {
            const group = DETAILS[currentLang()] || DETAILS.ru;
            const detail = group[key] || DETAILS.ru[key];
            if (!detail) return;
            const titleEl = panel.querySelector('.services-panel__title');
            const textEl = panel.querySelector('.services-panel__text');
            const itemsEl = panel.querySelector('.services-panel__items');
            if (titleEl) titleEl.textContent = detail.title;
            if (textEl) textEl.textContent = detail.text;
            if (itemsEl) {
                const subs = detail.subs;
                if (Array.isArray(subs) && subs.length) {
                    itemsEl.classList.add('services-panel__items--subs');
                    itemsEl.innerHTML = subs.map(sub => `
                        <div class="services-panel__subblock">
                            <div class="services-panel__subhead">${sub.title}</div>
                            ${(sub.items || []).map(item => `<div class="services-panel__item">${item}</div>`).join('')}
                        </div>
                    `).join('');
                } else {
                    itemsEl.classList.remove('services-panel__items--subs');
                    itemsEl.innerHTML = (detail.items || []).map(item => `<div class="services-panel__item">${item}</div>`).join('');
                }
            }
        }

        function setCardsActive(key) {
            cards.forEach(card => {
                const on = card.dataset.service === key;
                card.classList.toggle('service-card--active', on);
                card.setAttribute('aria-expanded', on ? 'true' : 'false');
            });
        }

        function finishClosePanel() {
            rippleClosing = false;
            panel.setAttribute('aria-hidden', 'true');
            openKey = null;
            lastRipple = null;
            clipEl.style.transition = '';
            setClipPath(clipEl, '');
            cards.forEach(card => {
                card.classList.remove('service-card--active');
                card.setAttribute('aria-expanded', 'false');
            });
        }

        function playRippleOpen(ox, oy, r) {
            if (prefersReducedMotion || panelNoMotion) {
                panel.classList.add('services-panel--instant');
                clipEl.style.transition = 'none';
                setClipPath(clipEl, `circle(${r}px at ${ox}px ${oy}px)`);
                return;
            }
            panel.classList.remove('services-panel--instant');
            clipEl.style.transition = 'none';
            setClipPath(clipEl, `circle(0px at ${ox}px ${oy}px)`);
            void clipEl.offsetWidth;
            clipEl.style.transition = `clip-path ${RIPPLE_OPEN_MS}s ${RIPPLE_EASE}`;
            setClipPath(clipEl, `circle(${r}px at ${ox}px ${oy}px)`);
        }

        function closePanel() {
            if (!isPanelOpen() || rippleClosing) return;
            if (prefersReducedMotion || panelNoMotion) {
                finishClosePanel();
                return;
            }
            if (!lastRipple) {
                finishClosePanel();
                return;
            }
            rippleClosing = true;
            const { ox, oy } = lastRipple;
            const rStart = rippleRadiusAt(ox, oy);
            panel.classList.remove('services-panel--instant');
            clipEl.style.transition = 'none';
            setClipPath(clipEl, `circle(${rStart}px at ${ox}px ${oy}px)`);
            void clipEl.offsetWidth;
            clipEl.style.transition = `clip-path ${RIPPLE_CLOSE_MS}s ${RIPPLE_EASE}`;
            setClipPath(clipEl, `circle(0px at ${ox}px ${oy}px)`);
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                clipEl.removeEventListener('transitionend', onEnd);
                clearTimeout(fallback);
                finishClosePanel();
            };
            const onEnd = e => {
                if (e.propertyName !== 'clip-path' && e.propertyName !== '-webkit-clip-path') return;
                finish();
            };
            const fallback = setTimeout(finish, Math.ceil(RIPPLE_CLOSE_MS * 1000) + 120);
            clipEl.addEventListener('transitionend', onEnd);
        }

        function openPanel(key, originEl) {
            if (rippleClosing) return;
            const group = DETAILS[currentLang()] || DETAILS.ru;
            const detail = group[key] || DETAILS.ru[key];
            if (!detail) return;

            if (openKey === key && isPanelOpen()) {
                closePanel();
                return;
            }

            if (isPanelOpen() && openKey !== key) {
                openKey = key;
                const originCard = cards.find(c => c.dataset.service === key);
                lastRipple = computeRipple(originCard || null);
                fillPanelContent(key);
                setCardsActive(key);
                return;
            }

            openKey = key;
            lastRipple = computeRipple(originEl);

            fillPanelContent(key);
            setCardsActive(key);
            cards.forEach(c => { c.style.transform = ''; });

            if (prefersReducedMotion || panelNoMotion) {
                panel.classList.add('services-panel--instant');
            } else {
                panel.classList.remove('services-panel--instant');
            }

            panel.setAttribute('aria-hidden', 'false');

            const { ox, oy, r } = lastRipple;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    playRippleOpen(ox, oy, r);
                });
            });

            const closeBtn = panel.querySelector('.services-panel__close');
            if (closeBtn) closeBtn.focus();
        }

        const sheetEl = panel.querySelector('.services-panel__sheet');
        const closeBtn = panel.querySelector('.services-panel__close');
        if (sheetEl) {
            sheetEl.addEventListener('click', e => {
                if (e.target.closest('.services-panel__close')) return;
                if (!e.target.closest('.services-panel__content')) closePanel();
            });
        }
        if (closeBtn) closeBtn.addEventListener('click', e => { e.stopPropagation(); closePanel(); });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && isPanelOpen()) closePanel();
        });

        cards.forEach(card => {
            const key = card.dataset.service;
            const open = () => openPanel(key, card);
            card.addEventListener('click', open);
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
        });

        window.abOpenServiceDetail = function (key) {
            openPanel(key, null);
        };
    })();

    /* ── Методология: кликабельные карточки + панель с деталями (аналог service ripple) ─ */
    (function initApproachDetails() {
        const cards = $$('.approach__step[data-step]');
        const wrap = $('.approach__steps-wrap');
        const panel = $('#approachPanel');
        const clipEl = panel && panel.querySelector('.approach-panel__clip');
        if (!cards.length || !wrap || !panel || !clipEl) return;

        const EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';
        const OPEN_MS = 0.72;
        const CLOSE_MS = 0.6;
        let openKey = null;
        let lastRipple = null;
        let closing = false;

        function setClip(el, value) {
            el.style.clipPath = value;
            el.style.webkitClipPath = value;
        }

        function currentLang() {
            try { return localStorage.getItem('ab_lang') || document.documentElement.getAttribute('lang') || 'ru'; }
            catch (e) { return 'ru'; }
        }

        function isOpen() { return panel.getAttribute('aria-hidden') === 'false'; }

        function computeRipple(origin) {
            const rbox = wrap.getBoundingClientRect();
            let ox = rbox.width * 0.5;
            let oy = rbox.height * 0.5;
            if (origin && origin.getBoundingClientRect) {
                const c = origin.getBoundingClientRect();
                ox = (c.left + c.right) / 2 - rbox.left;
                oy = c.bottom - rbox.top;
            }
            const r = Math.ceil(Math.hypot(Math.max(ox, rbox.width - ox), Math.max(oy, rbox.height - oy))) + 2;
            return { ox, oy, r };
        }

        function fillPanel(key) {
            const AD = window.AB_APPROACH_DETAILS;
            if (!AD) return;
            const group = AD[currentLang()] || AD.ru;
            const d = group[key] || AD.ru[key];
            if (!d) return;
            const stageEl = panel.querySelector('.approach-panel__stage');
            const titleEl = panel.querySelector('.approach-panel__title');
            const textEl = panel.querySelector('.approach-panel__text');
            const itemsEl = panel.querySelector('.approach-panel__items');
            const resultsEl = panel.querySelector('.approach-panel__results');
            if (stageEl) stageEl.textContent = d.stage || '';
            if (titleEl) titleEl.textContent = d.title || '';
            if (textEl) textEl.textContent = d.text || '';
            if (itemsEl) itemsEl.innerHTML = (d.items || []).map(i => `<li>${i}</li>`).join('');
            if (resultsEl) resultsEl.innerHTML = (d.results || []).map(i => `<li>${i}</li>`).join('');
        }

        function setActive(key) {
            cards.forEach(c => {
                const on = c.dataset.step === key;
                c.classList.toggle('approach__step--active', on);
                c.setAttribute('aria-expanded', on ? 'true' : 'false');
            });
        }

        function finishClose() {
            closing = false;
            panel.setAttribute('aria-hidden', 'true');
            openKey = null;
            lastRipple = null;
            clipEl.style.transition = '';
            setClip(clipEl, '');
            cards.forEach(c => {
                c.classList.remove('approach__step--active');
                c.setAttribute('aria-expanded', 'false');
            });
        }

        function playOpen(ox, oy, r) {
            if (prefersReducedMotion) {
                panel.classList.add('approach-panel--instant');
                clipEl.style.transition = 'none';
                setClip(clipEl, `circle(${r}px at ${ox}px ${oy}px)`);
                return;
            }
            panel.classList.remove('approach-panel--instant');
            clipEl.style.transition = 'none';
            setClip(clipEl, `circle(0px at ${ox}px ${oy}px)`);
            void clipEl.offsetWidth;
            clipEl.style.transition = `clip-path ${OPEN_MS}s ${EASE}`;
            setClip(clipEl, `circle(${r}px at ${ox}px ${oy}px)`);
        }

        function close() {
            if (!isOpen() || closing) return;
            if (prefersReducedMotion || !lastRipple) { finishClose(); return; }
            closing = true;
            const { ox, oy } = lastRipple;
            const rbox = wrap.getBoundingClientRect();
            const rStart = Math.ceil(Math.hypot(Math.max(ox, rbox.width - ox), Math.max(oy, rbox.height - oy))) + 2;
            panel.classList.remove('approach-panel--instant');
            clipEl.style.transition = 'none';
            setClip(clipEl, `circle(${rStart}px at ${ox}px ${oy}px)`);
            void clipEl.offsetWidth;
            clipEl.style.transition = `clip-path ${CLOSE_MS}s ${EASE}`;
            setClip(clipEl, `circle(0px at ${ox}px ${oy}px)`);
            let done = false;
            const onEnd = e => {
                if (e.propertyName !== 'clip-path' && e.propertyName !== '-webkit-clip-path') return;
                if (done) return;
                done = true;
                clipEl.removeEventListener('transitionend', onEnd);
                clearTimeout(fallback);
                finishClose();
            };
            const fallback = setTimeout(() => { if (!done) { done = true; clipEl.removeEventListener('transitionend', onEnd); finishClose(); } }, Math.ceil(CLOSE_MS * 1000) + 120);
            clipEl.addEventListener('transitionend', onEnd);
        }

        function open(key, originEl) {
            if (closing) return;
            const AD = window.AB_APPROACH_DETAILS;
            if (!AD) return;
            const group = AD[currentLang()] || AD.ru;
            if (!group[key]) return;

            if (openKey === key && isOpen()) { close(); return; }

            if (isOpen() && openKey !== key) {
                openKey = key;
                const origin = cards.find(c => c.dataset.step === key);
                lastRipple = computeRipple(origin || null);
                fillPanel(key);
                setActive(key);
                return;
            }

            openKey = key;
            lastRipple = computeRipple(originEl);
            fillPanel(key);
            setActive(key);

            if (prefersReducedMotion) panel.classList.add('approach-panel--instant');
            else panel.classList.remove('approach-panel--instant');
            panel.setAttribute('aria-hidden', 'false');

            const { ox, oy, r } = lastRipple;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => playOpen(ox, oy, r));
            });

            const closeBtn = panel.querySelector('.approach-panel__close');
            if (closeBtn) closeBtn.focus();
        }

        const sheet = panel.querySelector('.approach-panel__sheet');
        const closeBtn = panel.querySelector('.approach-panel__close');
        if (sheet) {
            sheet.addEventListener('click', e => {
                if (e.target.closest('.approach-panel__close')) return;
                if (!e.target.closest('.approach-panel__content')) close();
            });
        }
        if (closeBtn) closeBtn.addEventListener('click', e => { e.stopPropagation(); close(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && isOpen()) close();
        });

        cards.forEach(card => {
            const key = card.dataset.step;
            const handler = () => open(key, card);
            card.addEventListener('click', handler);
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
            });
        });

        window.abOpenApproachDetail = function (key) { open(key, null); };
    })();

    /* ── Magnetic Buttons ────────────────────────────── */
    if (window.matchMedia('(pointer: fine)').matches) {
        $$('.btn').forEach(btn => {
            btn.addEventListener('mousemove', e => {
                const rect = btn.getBoundingClientRect();
                const dx = e.clientX - (rect.left + rect.width / 2);
                const dy = e.clientY - (rect.top + rect.height / 2);
                btn.style.transform = `translate3d(${dx * 0.15}px, ${dy * 0.15}px, 0)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    /* ── Theme Toggle ────────────────────────────────── */
    const themeToggle = $('#themeToggle');
    const darkIcon = $('.theme-icon-dark');
    const lightIcon = $('.theme-icon-light');
    const stored = localStorage.getItem('ab_theme');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (darkIcon && lightIcon) {
            darkIcon.style.display = theme === 'dark' ? '' : 'none';
            lightIcon.style.display = theme === 'light' ? '' : 'none';
        }
        localStorage.setItem('ab_theme', theme);
    }
    applyTheme(stored || 'light');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    /* ── Language Dropdown (replaces old toggle) ────────── */
    // Dropdown built by i18n.js buildLangDropdown()

    /* ── WhatsApp link from meta ─────────────────────── */
    (function initFabWhatsApp() {
        const meta = document.querySelector('meta[name="ab-whatsapp-phone"]');
        const raw = meta && meta.content ? String(meta.content).replace(/\D/g, '') : '';
        const wa = document.querySelector('.fab-hub__item--wa');
        if (wa && raw.length >= 10) wa.href = 'https://wa.me/' + raw;
    })();

    /* ── FAB Hub toggle ─────────────────────────────── */
    const fabHub = $('#fabHub');
    const fabTrigger = $('#fabTrigger');
    if (fabTrigger && fabHub) {
        fabTrigger.addEventListener('click', () => {
            fabHub.classList.toggle('open');
            const openIcon = fabHub.querySelector('.fab-hub__icon-open');
            const closeIcon = fabHub.querySelector('.fab-hub__icon-close');
            if (fabHub.classList.contains('open')) {
                if (openIcon) openIcon.style.display = 'none';
                if (closeIcon) closeIcon.style.display = '';
            } else {
                if (openIcon) openIcon.style.display = '';
                if (closeIcon) closeIcon.style.display = 'none';
            }
        });
        document.addEventListener('click', (e) => {
            if (!fabHub.contains(e.target)) {
                fabHub.classList.remove('open');
                const openIcon = fabHub.querySelector('.fab-hub__icon-open');
                const closeIcon = fabHub.querySelector('.fab-hub__icon-close');
                if (openIcon) openIcon.style.display = '';
                if (closeIcon) closeIcon.style.display = 'none';
            }
        });
    }

    /* ── UTM Capture ────────────────────────────────── */
    function getUtmParams() {
        const p = new URLSearchParams(location.search);
        const u = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
            const v = p.get(k) || sessionStorage.getItem('ab_' + k) || '';
            if (v) { u[k] = v; sessionStorage.setItem('ab_' + k, v); }
        });
        return u;
    }
    getUtmParams(); // store on landing

    /* ── Contact Form Submission ──────────────────────── */
    const contactForm = $('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();
            const fd = new FormData(contactForm);
            const data = {};
            fd.forEach(function(v, k) { data[k] = v; });
            Object.assign(data, getUtmParams());
            const btn = contactForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    contactForm.reset();
                    showToast(typeof t === 'function' ? t('contact_success') : 'Submitted!');
                } else {
                    showToast(typeof t === 'function' ? t('contact_error') : 'Error.');
                }
            } catch {
                showToast(typeof t === 'function' ? t('contact_error') : 'Error.');
            }
            if (btn) btn.disabled = false;
        });
    }

    /* ── Toast Notification ──────────────────────────── */
    let toastEl = null;
    function showToast(msg) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3000);
    }
    window.showToast = showToast;

    /* ── Marquee ───────────────────────────────────── */
    /* constant speed, no scroll acceleration */

    /* ── Apply translations on load ──────────────────── */
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }

    /* ── Hydrate [data-site] elements from DB settings ── */
    (function loadSiteInfo() {
        fetch('/api/site-info').then(function(r) { return r.json(); }).then(function(info) {
            if (!info || typeof info !== 'object') return;
            var els = document.querySelectorAll('[data-site]');
            for (var i = 0; i < els.length; i++) {
                var key = els[i].getAttribute('data-site');
                if (info[key]) els[i].textContent = info[key];
            }
            // Update WhatsApp FAB link if phone available
            var waFab = document.querySelector('.fab-hub__item--wa');
            if (waFab && info.whatsapp) {
                waFab.href = 'https://wa.me/' + String(info.whatsapp).replace(/\D/g, '');
            }
            // Update ab-whatsapp-phone meta
            var waMeta = document.querySelector('meta[name="ab-whatsapp-phone"]');
            if (waMeta && info.whatsapp) waMeta.content = info.whatsapp;
        }).catch(function() {});
    })();

    /* ── Cookie Consent Banner ───────────────────────── */
    (function initCookieBanner() {
        try {
            if (localStorage.getItem('ab_cookie_consent')) return;
        } catch (e) { return; }

        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.innerHTML = `
            <div class="cookie-banner__inner">
                <div class="cookie-banner__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="8" cy="9" r="1" fill="currentColor"/>
                        <circle cx="15" cy="7" r="1" fill="currentColor"/>
                        <circle cx="10" cy="14" r="1" fill="currentColor"/>
                        <circle cx="16" cy="13" r="1" fill="currentColor"/>
                        <circle cx="13" cy="17" r="1" fill="currentColor"/>
                    </svg>
                </div>
                <div class="cookie-banner__text">
                    Мы используем файлы cookie и аналитику (Яндекс.Метрика) для улучшения работы сайта и анализа трафика.
                    Продолжая использовать сайт, вы соглашаетесь с нашей <a href="/about">политикой обработки данных</a>.
                </div>
                <div class="cookie-banner__actions">
                    <button class="cookie-banner__btn cookie-banner__btn--accept" id="cookieAccept">Принять</button>
                    <button class="cookie-banner__btn cookie-banner__btn--decline" id="cookieDecline">Отклонить</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                banner.classList.add('is-visible');
            });
        });

        function dismiss(accepted) {
            try { localStorage.setItem('ab_cookie_consent', accepted ? 'accepted' : 'declined'); } catch (e) {}
            banner.classList.remove('is-visible');
            setTimeout(function() { banner.remove(); }, 600);
        }

        var acceptBtn = document.getElementById('cookieAccept');
        var declineBtn = document.getElementById('cookieDecline');
        if (acceptBtn) acceptBtn.addEventListener('click', function() { dismiss(true); });
        if (declineBtn) declineBtn.addEventListener('click', function() { dismiss(false); });
    })();

})();
