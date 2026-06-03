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
import { seedCitiesOnly } from './seed';

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

  // 2. Создаем только записи городов. Данные памятников приходят из backend sync.
  if (!isSeeded()) {
    console.log('[DB] First launch — creating city rows...');
    seedCitiesOnly();
    console.log('[DB] City bootstrap complete.');
  } else {
    console.log('[DB] Database already seeded.');
  }

  syncMonumentFilterMetadata();
}


/**
 * Памятники и маршруты загружаются с бэкенда (Overview → /sync/, /monuments).
 * seed.ts создаёт только строки городов при первом запуске.
 */
