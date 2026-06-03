/**
 * seed.ts
 * Bootstrap city rows in SQLite on first launch.
 * Monument and route data come from the backend sync API.
 */

import { db, markSeeded } from './database';
import { CITIES } from '../data/cities';

export function seedCitiesOnly(): void {
  db.withTransactionSync(() => {
    for (const city of CITIES) {
      db.runSync(`INSERT OR IGNORE INTO cities (slug) VALUES (?)`, [city.id]);
    }
  });
  markSeeded();
}
