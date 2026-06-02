/**
 * Заполняет таблицу seo_settings типовыми SEO-данными для B2B бизнес-консалтинга.
 * Запуск: node scripts/seed-seo-defaults.js
 * Повторный запуск обновляет строки (ON CONFLICT page).
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agile_business'
});

const COMMON_MINUS =
 'бесплатный заработок, работа на дому без вложений, купить диплом, кредит без отказа, ' +
    'быстрые деньги в интернете, халява, серые схемы, пиратский софт, взлом аккаунта';

const ROWS = [
    {
        page: 'index',
        seo_title: 'Agile Business — бизнес-консалтинг, стратегия, цифровая трансформация и аналитика',
        seo_description:
            'Премиальный бизнес-консалтинг: корпоративная стратегия, управление изменениями, ' +
            'IT и продукт, аналитика и данные, инвестиции и оценка бизнеса, креатив и бренд. ' +
            'Сопровождаем компании от диагностики до внедрения.',
        keywords:
            'бизнес консалтинг, корпоративная стратегия, управленческий консалтинг, трансформация бизнеса, ' +
            'цифровизация компании, IT консалтинг, продуктовый консалтинг, аналитика для бизнеса, BI, ' +
            'оценка компании, инвестиционный консалтинг, M&A сопровождение, операционная эффективность, ' +
            'Agile, управление портфелем инициатив, KPI, дорожная карта развития',
        keywords_plus:
            'стратегический консалтинг для среднего и крупного бизнеса, консалтинг для собственников и топ-менеджмента, ' +
            'внедрение управленческих практик, due diligence, финансовое моделирование, организационный дизайн, ' +
            'консалтинг по продажам и маркетингу B2B, кастомная разработка и интеграции',
        keywords_minus: COMMON_MINUS
    },
    {
        page: 'about',
        seo_title: 'О компании Agile Business — команда, подход и экспертиза в консалтинге',
        seo_description:
            'Agile Business: кто мы, как работаем и какие задачи решаем для бизнеса. ' +
            'Прозрачные этапы, измеримый результат, фокус на ROI и устойчивых изменениях.',
        keywords:
            'о компании консалтинг, команда консультантов, экспертиза в управлении, методология консалтинга, ' +
            'корпоративная культура, ценности компании, кейсы консалтинга, партнёр по развитию бизнеса',
        keywords_plus:
            'премиальный консалтинг, доверие собственников, междисциплинарная команда стратегия IT аналитика креатив',
        keywords_minus: COMMON_MINUS
    },
    {
        page: 'works',
        seo_title: 'Кейсы и проекты — портфолио Agile Business в консалтинге и трансформации',
        seo_description:
            'Примеры проектов: стратегия, операционное улучшение, цифровые продукты, аналитика, маркетинг и бренд. ' +
            'Реальные результаты для компаний разного масштаба.',
        keywords:
            'кейсы консалтинга, портфолио консалтинговой компании, успешные проекты трансформации, ' +
            'результаты внедрения стратегии, примеры цифровизации бизнеса, отраслевой консалтинг',
        keywords_plus:
            'B2B кейсы, проекты для ритейла финансов промышленности сервиса, измеримые эффекты от консалтинга',
        keywords_minus: COMMON_MINUS + ', фейковые отзывы, накрутка'
    },
    {
        page: 'work',
        seo_title: 'Кейс — проект Agile Business | стратегия, операции, IT, аналитика',
        seo_description:
            'Детальный разбор проекта: задача клиента, подход, этапы работы и достигнутые результаты. ' +
            'Шаблон для страниц отдельных кейсов.',
        keywords:
            'кейс консалтинг, описание проекта, результаты проекта, методология внедрения, пост-анализ эффекта',
        keywords_plus:
            'success story B2B, story telling кейса, метрики до и после, уроки для руководства',
        keywords_minus: COMMON_MINUS
    },
    {
        page: 'articles',
        seo_title: 'Статьи и материалы Agile Business — стратегия, управление, аналитика, IT',
        seo_description:
            'Экспертные статьи для руководителей: стратегия и трансформация, продукт и IT, данные и аналитика, ' +
            'инвестиции, маркетинг и креатив в B2B.',
        keywords:
            'статьи по бизнесу, экспертный блог консалтинга, материалы для директоров, тренды управления, ' +
            'лучшие практики стратегии, обзоры инструментов аналитики',
        keywords_plus:
            'глубокая аналитика контента, практические чек-листы, разбор ошибок внедрения изменений',
        keywords_minus: COMMON_MINUS + ', кликбейт без пользы'
    },
    {
        page: 'article',
        seo_title: 'Статья — Agile Business | экспертиза в консалтинге и управлении',
        seo_description:
            'Экспертный материал для собственников и топ-менеджмента. Практические выводы и рекомендации.',
        keywords:
            'экспертная статья, консалтинг инсайты, управление компанией, развитие бизнеса, лидер мнений B2B',
        keywords_plus:
            'длинный формат, actionable советы, ссылки на методологии и стандарты',
        keywords_minus: COMMON_MINUS
    },
    {
        page: 'calculator',
        seo_title: 'Калькулятор стоимости консалтинга — предварительная оценка проекта Agile Business',
        seo_description:
            'Онлайн-расчёт ориентировочного бюджета консалтингового проекта: направление, масштаб, сложность и срок. ' +
            'Не публичная оферта; точная смета — после диагностики.',
        keywords:
            'стоимость бизнес консалтинга, калькулятор консалтинга, оценка проекта консультанта, бюджет стратегического проекта, ' +
            'расчёт стоимости трансформации, цена консалтинговых услуг B2B',
        keywords_plus:
            'прозрачное ценообразование, параметры влияющие на стоимость, сравнение пакетов работ',
        keywords_minus: COMMON_MINUS + ', бесплатный полный аудит без договора'
    },
    {
        page: 'privacy',
        seo_title: 'Политика конфиденциальности — Agile Business',
        seo_description:
            'Как Agile Business обрабатывает персональные данные посетителей сайта и клиентов: цели, сроки хранения, ' +
            'меры защиты и контакты по вопросам данных.',
        keywords:
            'политика конфиденциальности, обработка персональных данных, GDPR oriented, защита данных клиентов консалтинга',
        keywords_plus:
            'прозрачность для B2B клиентов, согласие на обработку, права субъекта данных',
        keywords_minus: 'спам рассылка без согласия, продажа баз данных'
    },
    {
        page: 'client-access',
        seo_title: 'Личный кабинет клиента — Agile Business',
        seo_description:
            'Безопасный вход для клиентов Agile Business: статусы проектов, документы и коммуникации.',
        keywords:
            'личный кабинет клиента консалтинга, доступ к материалам проекта, клиентский портал B2B',
        keywords_plus:
            'закрытая зона для заказчиков, статус этапов проекта',
        keywords_minus: COMMON_MINUS
    },
    {
        page: 'client',
        seo_title: 'Профиль клиента — Agile Business',
        seo_description:
            'Страница профиля клиента в экосистеме Agile Business.',
        keywords:
            'профиль клиента, кабинет заказчика, консалтинг клиентский доступ',
        keywords_plus: 'B2B сервис, безопасный доступ',
        keywords_minus: COMMON_MINUS
    }
];

async function main() {
    const c = await pool.connect();
    try {
        await c.query(`CREATE TABLE IF NOT EXISTS seo_settings (
            id SERIAL PRIMARY KEY,
            page VARCHAR(120) UNIQUE NOT NULL,
            seo_title VARCHAR(255) DEFAULT '',
            seo_description TEXT DEFAULT '',
            keywords TEXT DEFAULT '',
            keywords_plus TEXT DEFAULT '',
            keywords_minus TEXT DEFAULT '',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await c.query(`ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) DEFAULT ''`);
        await c.query(`ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT ''`);
        await c.query(`ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS keywords_plus TEXT DEFAULT ''`);
        await c.query(`ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS keywords_minus TEXT DEFAULT ''`);
        await c.query(`ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        // Старый setup-db: title / description / og_*
        await c.query(`ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT ''`);
        await c.query(`ALTER TABLE seo_settings ADD COLUMN IF NOT EXISTS description TEXT`);
        try {
            await c.query(`ALTER TABLE seo_settings ALTER COLUMN page TYPE VARCHAR(120)`);
        } catch (_e) { /* уже достаточной длины или нет прав */ }
        await c.query(`
            UPDATE seo_settings SET seo_title = title
            WHERE trim(coalesce(seo_title, '')) = '' AND trim(coalesce(title, '')) <> ''
        `);
        await c.query(`
            UPDATE seo_settings SET seo_description = description
            WHERE trim(coalesce(seo_description, '')) = '' AND description IS NOT NULL AND trim(description) <> ''
        `);

        for (const row of ROWS) {
            await c.query(
                `INSERT INTO seo_settings (page, seo_title, seo_description, keywords, keywords_plus, keywords_minus, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6, CURRENT_TIMESTAMP)
                 ON CONFLICT (page) DO UPDATE SET
                    seo_title = EXCLUDED.seo_title,
                    seo_description = EXCLUDED.seo_description,
                    keywords = EXCLUDED.keywords,
                    keywords_plus = EXCLUDED.keywords_plus,
                    keywords_minus = EXCLUDED.keywords_minus,
                    updated_at = CURRENT_TIMESTAMP`,
                [row.page, row.seo_title, row.seo_description, row.keywords, row.keywords_plus, row.keywords_minus]
            );
        }
        console.log(`OK SEO: записано/обновлено страниц: ${ROWS.length}`);
    } finally {
        c.release();
        await pool.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
