/**
 * database.ts
 * Открывает БД и создаёт таблицы при первом запуске.
 *
 * Установка: npx expo install expo-sqlite
 */

import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('volgogid.db');
export const DB_SCHEMA_VERSION = 2;

export function ensureMetaTable(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function initDatabase(): void {
  db.execSync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS cities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monuments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id      INTEGER NOT NULL,
      slug         TEXT NOT NULL,
      lat          REAL NOT NULL,
      lon          REAL NOT NULL,
      image_url    TEXT,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      popularity   INTEGER NOT NULL DEFAULT 0,
      tags_json    TEXT NOT NULL DEFAULT '[]',
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(city_id, slug),
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS monument_translations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      monument_id  INTEGER NOT NULL,
      lang         TEXT NOT NULL,
      field_key    TEXT NOT NULL,
      field_value  TEXT NOT NULL,
      UNIQUE(monument_id, lang, field_key),
      FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS monument_field_config (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      monument_id  INTEGER NOT NULL,
      section      TEXT NOT NULL CHECK(section IN ('details', 'visitors')),
      order_index  INTEGER NOT NULL,
      label_key    TEXT NOT NULL,
      field_key    TEXT,
      static_value TEXT,
      FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routes (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id            INTEGER NOT NULL,
      slug               TEXT NOT NULL,
      cover_monument_id  INTEGER,
      sort_order         INTEGER NOT NULL DEFAULT 0,
      difficulty         TEXT,
      duration_min       INTEGER,
      distance_km        REAL,
      is_active          INTEGER NOT NULL DEFAULT 1,
      created_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(city_id, slug),
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
      FOREIGN KEY (cover_monument_id) REFERENCES monuments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS route_stops (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id     INTEGER NOT NULL,
      monument_id  INTEGER NOT NULL,
      order_index  INTEGER NOT NULL,
      UNIQUE(route_id, order_index),
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
      FOREIGN KEY (monument_id) REFERENCES monuments(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS route_translations (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id           INTEGER NOT NULL,
      lang               TEXT NOT NULL,
      name               TEXT NOT NULL,
      short_description  TEXT NOT NULL DEFAULT '',
      description        TEXT NOT NULL,
      UNIQUE(route_id, lang),
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      key   TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
    CREATE INDEX IF NOT EXISTS idx_monuments_city_slug ON monuments(city_id, slug);
    CREATE INDEX IF NOT EXISTS idx_monument_translations_lookup ON monument_translations(monument_id, lang, field_key);
    CREATE INDEX IF NOT EXISTS idx_routes_city_slug ON routes(city_id, slug);
    CREATE INDEX IF NOT EXISTS idx_route_translations_lookup ON route_translations(route_id, lang);
    CREATE INDEX IF NOT EXISTS idx_route_stops_route_order ON route_stops(route_id, order_index);
  `);
}

export function resetDomainTables(): void {
  db.execSync(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS route_stops;
    DROP TABLE IF EXISTS route_translations;
    DROP TABLE IF EXISTS routes;
    DROP TABLE IF EXISTS monument_field_config;
    DROP TABLE IF EXISTS monument_translations;
    DROP TABLE IF EXISTS monuments;
    DROP TABLE IF EXISTS cities;
    DROP TABLE IF EXISTS app_meta;
    PRAGMA foreign_keys = ON;
  `);
}

export function getSchemaVersion(): number {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'schema_version'`,
  );
  return row ? Number(row.value) || 0 : 0;
}

export function setSchemaVersion(version: number): void {
  db.runSync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('schema_version', ?)`, [String(version)]);
}

/** Проверяет, была ли уже выполнена начальная загрузка данных */
export function isSeeded(): boolean {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'seeded'`
  );
  return row?.value === '1';
}

export function markSeeded(): void {
  db.runSync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seeded', '1')`);
}
