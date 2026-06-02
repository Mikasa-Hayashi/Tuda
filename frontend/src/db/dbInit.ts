/**
 * dbInit.ts
 * Вызови эту функцию ОДИН РАЗ при старте приложения (например в App.tsx).
 *
 * Пример использования в App.tsx:
 *
 *   import { setupDatabase } from './db/dbInit';
 *
 *   export default function App() {
 *     useEffect(() => {
 *       setupDatabase();
 *     }, []);
 *     ...
 *   }
 */

import { DB_SCHEMA_VERSION, db, ensureMetaTable, getSchemaVersion, initDatabase, isSeeded, resetDomainTables, setSchemaVersion } from './database';
import { syncMonumentFilterMetadata } from './monumentRepository';
import { seedDatabase, syncCitiesAndMonumentCityIds } from './seed';

export function setupDatabase(): void {
  // 1. Read schema version before creating/querying domain tables.
  ensureMetaTable();
  const currentVersion = getSchemaVersion();

  if (currentVersion !== DB_SCHEMA_VERSION) {
    console.log(`[DB] Schema mismatch ${currentVersion} -> ${DB_SCHEMA_VERSION}. Rebuilding DB...`);
    resetDomainTables();
    initDatabase();
    setSchemaVersion(DB_SCHEMA_VERSION);
    db.runSync(`DELETE FROM app_meta WHERE key = 'seeded'`);
  }
  initDatabase();

  // 2. Заливаем начальные данные (только при первом запуске)
  if (!isSeeded()) {
    console.log('[DB] First launch — seeding database...');
    seedDatabase();
    console.log('[DB] Seed complete.');
  } else {
    console.log('[DB] Database already seeded.');
  }

  syncMonumentFilterMetadata();
  syncCitiesAndMonumentCityIds();
}


/**
 * СТРУКТУРА ФАЙЛОВ:
 *
 * src/
 * ├── db/
 * │   ├── database.ts          ← схема и открытие БД
 * │   ├── seed.ts              ← начальные данные (сюда добавляешь новые памятники)
 * │   ├── monumentRepository.ts← запросы к памятникам
 * │   ├── routeRepository.ts   ← запросы к маршрутам
 * │   └── dbInit.ts            ← точка входа (вызов при старте)
 * │
 * ├── locales/                 ← i18n JSON файлы (ТОЛЬКО UI-строки, без monuments_data)
 * │   ├── ru.json
 * │   ├── en.json
 * │   ├── ar.json
 * │   └── zh.json
 * │
 * └── App.tsx
 *
 *
 * ЧТО УДАЛИТЬ ИЗ JSON ФАЙЛОВ:
 * - "monuments_data": { ... }   → теперь в seed.ts
 * - "routes_data": { ... }      → теперь в seed.ts
 *
 * ЧТО ОСТАВИТЬ В JSON ФАЙЛАХ:
 * - "settings": { ... }
 * - "info": { ... }
 * - "menu": { ... }
 * - "route_info": { ... }
 * - "map": { ... }
 * - "monument_fields": { ... }  ← лейблы полей остаются здесь!
 *
 *
 * КАК ДОБАВИТЬ НОВЫЙ ПАМЯТНИК:
 * Просто добавь новый объект в массив monumentSeedData в seed.ts.
 * При следующем запуске на свежем устройстве он появится автоматически.
 *
 * Для обновления на уже установленных устройствах — позже добавим
 * механизм синхронизации с бэкендом (FastAPI + /updates endpoint).
 *
 *
 * УСТАНОВКА ЗАВИСИМОСТИ:
 * npx expo install expo-sqlite
 */
