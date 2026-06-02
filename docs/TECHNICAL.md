# Техническая документация — Agile Business Website

> Репозиторий: [github.com/5eeee/agile-business-site](https://github.com/5eeee/agile-business-site)  
> Автор: Владимир Кутомкин

## 1. Назначение

Премиальный корпоративный сайт IT-консалтинга **Agile Business**: портфолио проектов, блог, калькулятор стоимости услуг, CRM-админка, личный кабинет клиента, мультиязычность (ru, en, ka, bg, hy), интеграция с Telegram и Яндекс.Метрикой.

## 2. Стек технологий

| Слой | Технологии |
|------|------------|
| Frontend | HTML5, CSS3 (~2800 строк), Vanilla JavaScript, PWA |
| Backend | Node.js 18+, Express 4 |
| БД | PostgreSQL 17 (через `pg`) |
| Безопасность | Helmet, express-rate-limit, bcryptjs, express-session |
| Интеграции | Telegram Bot API, Nodemailer, QR-коды, webhook CRM |

## 3. Структура проекта

```
├── server.js              # Главный HTTP-сервер
├── admin-routes.js        # Маршруты /api/admin/*
├── setup-db.js            # Инициализация БД
├── public/                # Публичные HTML-страницы и статика
│   ├── index.html, calculator.html, works.html, articles.html
│   ├── css/style.css
│   └── js/                # main.js, calculator.js, i18n*.js
├── admin-subdomain/       # SPA админ-панели
├── migrations/            # SQL-миграции 001–003
├── scripts/               # deploy.ps1, backup, seed
├── uploads/               # Загруженные медиа
└── .env.example
```

## 4. Переменные окружения

| Переменная | Описание |
|------------|----------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL |
| `PORT` | Порт сервера (по умолчанию 3000) |
| `SESSION_SECRET` | Секрет сессии |
| `ADMIN_PASSWORD` | Пароль администратора |
| `TG_BOT_TOKEN`, `TG_CHAT_ID` | Telegram-уведомления |
| `ADMIN_HOST`, `COOKIE_DOMAIN` | Домены для cookies |

## 5. Публичное API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/contact` | Форма обратной связи |
| POST | `/api/calculator/start`, `/update`, `/complete` | Калькулятор проекта |
| GET | `/api/pricing/calculator` | Тарифы калькулятора |
| GET | `/api/projects`, `/api/projects/:slug` | Портфолио |
| GET | `/api/articles`, `/api/articles/:slug` | Блог |
| GET | `/api/i18n/:lang` | Переводы |
| POST | `/api/client/register`, `/login` | Кабинет клиента |
| POST | `/api/analytics/event` | События аналитики |

## 6. Админ API (`/api/admin/*`)

- **Auth:** `POST /login`, `/logout`, `GET /me`, 2FA
- **CRM:** `/leads`, `/orders`, `/pipeline`, `/proposals`, `/invoices`
- **Контент:** `/pages`, `/projects`, `/articles`, `/reviews`
- **Настройки:** `/seo-settings`, `/settings`, `/calculator/pricing`
- **Аналитика:** `/dashboard/stats`, `/metrika/*`, `/webmaster/stats`
- **Файлы:** `POST /upload`, `/upload-files`

## 7. База данных

Основные таблицы: `projects`, `articles`, `leads`, `orders`, `clients`, `pages`, `admin_users`, `analytics_events`, `calculator_sessions`, `seo_settings`, `audit_log`.

Миграции: `migrations/001-stack-and-article-gallery.sql` и далее.

## 8. Локальный запуск

```bash
npm install
cp .env.example .env
npm run setup-db
npm start
```

Откройте http://localhost:3000

## 9. Деплой

```powershell
npm run deploy
# или scripts/deploy.ps1 — SCP/SSH на VPS, PM2
```

## 10. Особенности

- Кэш публичных ответов в памяти для производительности
- Автоматическая пересборка sitemap: `npm run rebuild-sitemap`
- Seed SEO и калькулятора: `npm run seed-seo`, `npm run seed-pricing`
- Бэкап: `npm run backup`
