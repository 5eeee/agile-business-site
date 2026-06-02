/**
 * Заполняет карточку проекта «Внутренняя платформа Revolution Print»
 * (slug: vnutrennyaya-platforma-revolution-print): заголовок, лид и HTML-описание
 * на основе публичной страницы кейса и сайта заказчика https://revolutionprint.ru/
 *
 * Запуск из корня репозитория: node scripts/patch-revolution-print-project.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const SLUG = 'vnutrennyaya-platforma-revolution-print';

const TITLE_RU = 'Внутренняя платформа Revolution Print';
const EXCERPT_RU =
  'Веб-платформа для типографии DTF-печати в Москве: заказы, статусы производства и прозрачность для клиентов и команды.';

const HTML_RU = `
<h2>О заказчике</h2>
<p><a href="https://revolutionprint.ru/" target="_blank" rel="noopener noreferrer">Revolution Print</a> — типография DTF-печати на одежде в Москве: печать логотипов, фото и принтов под заказ, каталог позиций (футболки, худи, бейсболки, сумки, фартуки и др.), фулфилмент и доставка. На сайте компании подчёркиваются технологичность оборудования, устойчивое качество оттиска и ориентир на сроки — типично 1–5 рабочих дней в зависимости от объёма и сложности. Заказчики — маркетплейсы и бренды (в т.ч. сегменты вроде Wildberries и Ozon), корпоративные клиенты, собственные бренды и организаторы мероприятий. Офис: Москва, Большая Новодмитровская улица, 23с1.</p>

<h2>Задача проекта</h2>
<p>Спроектировать и внедрить внутреннюю веб-платформу под процессы типографии: приём и обработка заказов, прозрачные статусы производства, единая точка входа для команды и клиентов, подготовка к масштабированию без «ручного» хаоса в переписках и таблицах.</p>

<h2>Что сделали</h2>
<ul>
<li>Согласовали пользовательские сценарии с учётом DTF-производства и фулфилмента.</li>
<li>Реализовали клиентский кабинет и внутренние роли для обработки заказов.</li>
<li>Настроили структуру данных и интерфейсы под реальные этапы производства.</li>
<li>Обеспечили адаптивный интерфейс и основу для дальнейших интеграций.</li>
</ul>

<h2>Результат</h2>
<p>Заказчик получил управляемую цифровую среду для приёма заказов и контроля статусов, снижение нагрузки на операционный блок и более предсказуемую коммуникацию с клиентами — на фоне растущего потока заказов и требований к скорости, характерных для DTF-сегмента.</p>
`.trim();

const TITLE_EN = 'Internal platform for Revolution Print';
const EXCERPT_EN =
  'A web platform for a Moscow DTF print shop: orders, production status, and transparency for clients and the team.';

const HTML_EN = `
<h2>About the client</h2>
<p><a href="https://revolutionprint.ru/" target="_blank" rel="noopener noreferrer">Revolution Print</a> is a Moscow-based DTF garment printing company: custom logos, photos and prints, a broad product catalog (T-shirts, hoodies, caps, bags, aprons, etc.), fulfilment and delivery. Their public site highlights modern equipment, stable print quality and short lead times (often quoted around 1–5 business days depending on volume and complexity). They serve marketplaces and brands (including segments such as Wildberries and Ozon), corporate clients, private labels and event organisers. Office: Moscow, Bolshaya Novodmitrovskaya St., 23с1.</p>

<h2>Project goals</h2>
<p>Design and roll out an internal web platform aligned with print-shop operations: order intake and processing, clear production statuses, a single entry point for staff and clients, and a foundation to scale without losing control to chats and spreadsheets.</p>

<h2>What we delivered</h2>
<ul>
<li>Aligned user flows with DTF production and fulfilment realities.</li>
<li>Built a client area and internal roles for order handling.</li>
<li>Structured data and UI around real production stages.</li>
<li>Shipped a responsive UI and a base for further integrations.</li>
</ul>

<h2>Outcome</h2>
<p>The client gained a manageable digital layer for orders and status tracking, less operational friction, and clearer client communication — supporting growth and speed expectations typical of the DTF segment.</p>
`.trim();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agile_business',
  max: 2
});

(async () => {
  try {
    const pr = await pool.query('SELECT id FROM projects WHERE slug = $1', [SLUG]);
    if (!pr.rows.length) {
      console.error('Project not found:', SLUG, '— создайте проект в админке с этим slug, затем запустите скрипт снова.');
      process.exitCode = 1;
      return;
    }
    const projectId = pr.rows[0].id;

    for (const [lang, title, excerpt, html] of [
      ['ru', TITLE_RU, EXCERPT_RU, HTML_RU],
      ['en', TITLE_EN, EXCERPT_EN, HTML_EN]
    ]) {
      await pool.query(
        `INSERT INTO project_locales (project_id, lang, title, excerpt, html, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (project_id, lang)
         DO UPDATE SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, html = EXCLUDED.html, updated_at = CURRENT_TIMESTAMP`,
        [projectId, lang, title, excerpt, html]
      );
      console.log('Updated locale', lang, 'for', SLUG);
    }

    console.log('Done.');
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
