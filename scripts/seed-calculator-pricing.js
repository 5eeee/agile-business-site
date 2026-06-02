/**
 * Записывает актуальный прайс калькулятора в БД (перезаписывает calculator_pricing_json).
 * Запуск: node scripts/seed-calculator-pricing.js
 * Требуется .env с доступом к PostgreSQL (как у setup-db.js).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const pricingPath = path.join(__dirname, '..', 'data', 'default-calculator-pricing.json');
const pricing = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agile_business'
};

async function main() {
    const conn = new Client(DB_CONFIG);
    await conn.connect();
    try {
        await conn.query(
            `INSERT INTO settings (setting_key, setting_value)
             VALUES ('calculator_pricing_json', $1)
             ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
            [JSON.stringify(pricing)]
        );
        console.log('OK: calculator_pricing_json обновлён из data/default-calculator-pricing.json');
    } finally {
        await conn.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
