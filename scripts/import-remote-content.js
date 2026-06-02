/*
 * Import projects and articles from production API into local PostgreSQL.
 * Run: node scripts/import-remote-content.js
 */
require('dotenv').config();
const https = require('https');
const { Pool } = require('pg');

const SOURCE_BASE = process.env.SOURCE_BASE || 'https://agile-business-pro.com';
const LANGS = ['ru', 'en', 'ka', 'hy', 'bg'];

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agile_business',
  max: 4
});

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON from ' + url));
          }
        });
      })
      .on('error', reject);
  });
}

function safeString(v) {
  return v == null ? '' : String(v);
}

function safeJsonArray(v) {
  return JSON.stringify(Array.isArray(v) ? v : []);
}

function mapStackGroups(groups) {
  const g = groups && typeof groups === 'object' ? groups : {};
  return {
    front: safeJsonArray(g.front),
    back: safeJsonArray(g.back),
    db: safeJsonArray(g.db),
    deploy: safeJsonArray(g.deploy),
    android: safeJsonArray(g.android),
    ios: safeJsonArray(g.ios)
  };
}

async function upsertProject(projectSummary) {
  const slug = safeString(projectSummary.slug).trim();
  if (!slug) return null;

  const detailsByLang = {};
  for (const lang of LANGS) {
    try {
      const payload = await getJson(
        SOURCE_BASE + '/api/projects/' + encodeURIComponent(slug) + '?lang=' + encodeURIComponent(lang)
      );
      detailsByLang[lang] = payload && payload.project ? payload.project : null;
    } catch (e) {
      detailsByLang[lang] = null;
    }
  }

  const base = detailsByLang.ru || Object.values(detailsByLang).find(Boolean);
  if (!base) return null;

  const projectInsert = await pool.query(
    `
      INSERT INTO projects (slug, is_published, cover_image, deadline_text, duration_text, created_at, updated_at)
      VALUES ($1, TRUE, $2, $3, $4, COALESCE($5::timestamp, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
      ON CONFLICT (slug)
      DO UPDATE SET
        is_published = TRUE,
        cover_image = EXCLUDED.cover_image,
        deadline_text = EXCLUDED.deadline_text,
        duration_text = EXCLUDED.duration_text,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [
      slug,
      safeString(base.cover_image),
      safeString(base.deadline_text),
      safeString(base.duration_text),
      base.created_at || null
    ]
  );
  const projectId = projectInsert.rows[0].id;

  for (const lang of LANGS) {
    const d = detailsByLang[lang];
    if (!d) continue;

    const groups = mapStackGroups(d.stack_groups);
    await pool.query(
      `
        INSERT INTO project_locales (
          project_id, lang, title, excerpt, html,
          gallery_json, stack_json,
          stack_front_json, stack_back_json, stack_db_json, stack_deploy_json, stack_android_json, stack_ios_json,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
        ON CONFLICT (project_id, lang)
        DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          html = EXCLUDED.html,
          gallery_json = EXCLUDED.gallery_json,
          stack_json = EXCLUDED.stack_json,
          stack_front_json = EXCLUDED.stack_front_json,
          stack_back_json = EXCLUDED.stack_back_json,
          stack_db_json = EXCLUDED.stack_db_json,
          stack_deploy_json = EXCLUDED.stack_deploy_json,
          stack_android_json = EXCLUDED.stack_android_json,
          stack_ios_json = EXCLUDED.stack_ios_json,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        projectId,
        lang,
        safeString(d.title),
        safeString(d.excerpt),
        safeString(d.html),
        safeJsonArray(d.gallery),
        safeJsonArray(d.stack),
        groups.front,
        groups.back,
        groups.db,
        groups.deploy,
        groups.android,
        groups.ios
      ]
    );
  }

  return slug;
}

async function upsertArticle(articleSummary) {
  const slug = safeString(articleSummary.slug).trim();
  if (!slug) return null;

  const detailsByLang = {};
  for (const lang of LANGS) {
    try {
      const payload = await getJson(
        SOURCE_BASE + '/api/articles/' + encodeURIComponent(slug) + '?lang=' + encodeURIComponent(lang)
      );
      detailsByLang[lang] = payload && payload.article ? payload.article : null;
    } catch (e) {
      detailsByLang[lang] = null;
    }
  }

  const base = detailsByLang.ru || Object.values(detailsByLang).find(Boolean);
  if (!base) return null;

  const articleInsert = await pool.query(
    `
      INSERT INTO articles (slug, is_published, cover_image, created_at, updated_at)
      VALUES ($1, TRUE, $2, COALESCE($3::timestamp, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
      ON CONFLICT (slug)
      DO UPDATE SET
        is_published = TRUE,
        cover_image = EXCLUDED.cover_image,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [slug, safeString(base.cover_image), base.created_at || null]
  );
  const articleId = articleInsert.rows[0].id;

  for (const lang of LANGS) {
    const d = detailsByLang[lang];
    if (!d) continue;

    await pool.query(
      `
        INSERT INTO article_locales (
          article_id, lang, title, excerpt, html, gallery_json, stack_json, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (article_id, lang)
        DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          html = EXCLUDED.html,
          gallery_json = EXCLUDED.gallery_json,
          stack_json = EXCLUDED.stack_json,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        articleId,
        lang,
        safeString(d.title),
        safeString(d.excerpt),
        safeString(d.html),
        safeJsonArray(d.gallery),
        safeJsonArray(d.stack)
      ]
    );
  }

  return slug;
}

async function importAll() {
  const projectsResp = await getJson(SOURCE_BASE + '/api/projects?lang=ru');
  const articlesResp = await getJson(SOURCE_BASE + '/api/articles?lang=ru');

  const projects = Array.isArray(projectsResp.projects) ? projectsResp.projects : [];
  const articles = Array.isArray(articlesResp.articles) ? articlesResp.articles : [];

  const importedProjects = [];
  for (const p of projects) {
    const slug = await upsertProject(p);
    if (slug) importedProjects.push(slug);
  }

  const importedArticles = [];
  for (const a of articles) {
    const slug = await upsertArticle(a);
    if (slug) importedArticles.push(slug);
  }

  return { importedProjects, importedArticles };
}

(async () => {
  try {
    console.log('Importing content from ' + SOURCE_BASE + ' ...');
    const result = await importAll();
    console.log('Projects imported: ' + result.importedProjects.length);
    console.log(result.importedProjects.join('\n'));
    console.log('Articles imported: ' + result.importedArticles.length);
    console.log(result.importedArticles.join('\n'));
    console.log('Done.');
  } catch (e) {
    console.error('Import failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
