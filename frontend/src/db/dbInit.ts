import { DB_SCHEMA_VERSION, db, ensureMetaTable, getSchemaVersion, initDatabase, isSeeded, resetDomainTables, setSchemaVersion } from './database';
import { syncMonumentFilterMetadata } from './monumentRepository';
import { seedCitiesOnly } from './seed';

export function setupDatabase(): void {
  ensureMetaTable();
  const currentVersion = getSchemaVersion();

  if (currentVersion !== DB_SCHEMA_VERSION) {
    resetDomainTables();
    initDatabase();
    setSchemaVersion(DB_SCHEMA_VERSION);
    db.runSync(`DELETE FROM app_meta WHERE key = 'seeded'`);
  }
  initDatabase();

  if (!isSeeded()) {
    seedCitiesOnly();
  }

  syncMonumentFilterMetadata();
}
