# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tuda** is an offline-first mobile travel companion for discovering monuments and walking routes across Russian cities (Maykop, Astrakhan, Volgograd, Elista, Krasnodar, Rostov-on-Don, Sevastopol). It consists of a FastAPI backend and an Expo React Native frontend.

## Backend (Python/FastAPI)

### Setup & Running

```bash
cd backend

# Local development (Python 3.13 required)
py -3.13 -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env            # Set DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload
python -m scripts.import_seed   # Seed initial data

# Docker
docker compose up --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.import_seed
```

### Linting & Formatting

```bash
ruff check .
ruff format .
mypy .
black .
```

Config in `pyproject.toml`: ruff (E/F/I/UP rules), black (line-length 88), mypy strict mode.

### Migrations

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

### Architecture

```
backend/app/
├── main.py              # FastAPI app, mounts /api router
├── api/
│   ├── router.py        # Aggregates monuments, routes, sync routers
│   └── routes/          # monuments.py, routes.py, sync.py
├── core/
│   ├── config.py        # Pydantic Settings (DATABASE_URL)
│   └── database.py      # Async SQLAlchemy engine, get_db dependency
├── models/              # SQLAlchemy ORM models
│   ├── base.py          # DeclarativeBase
│   ├── mixins.py        # TimestampMixin (updated_at), SoftDeleteMixin (deleted bool)
│   ├── monument.py      # Monument + relationship to translations/field_configs
│   ├── monument_translation.py
│   ├── monument_field_config.py  # Per-monument detail/visitors section field layout
│   ├── route.py         # Route + soft delete
│   ├── route_stop.py    # Ordered stops linking routes to monuments
│   └── route_translation.py
├── schemas/             # Pydantic response models
└── services/
    ├── monument_service.py
    ├── route_service.py
    └── sync_service.py  # Incremental sync: returns changed/deleted records since a timestamp
```

**Soft delete pattern**: `Monument` and `Route` use `SoftDeleteMixin` (a `deleted` boolean). Queries filter `deleted.is_(False)`; the sync endpoint returns deleted IDs so the client can remove them.

**Sync flow**: `GET /api/sync/?since=<ISO datetime>&city_id=<optional>` returns all updated monuments, translations, field_configs, routes, route_stops, route_translations, and deleted IDs since the given timestamp.

**`monument_field_config`** drives per-monument detail page layout: each row has a `section` (`details` or `visitors`), `order_index`, `label_key` (i18n key), and either a `field_key` (resolved against monument translations) or a `static_value`.

## Frontend (Expo React Native)

### Setup & Running

```bash
cd frontend
npm install
cp .env.example .env   # Set EXPO_PUBLIC_API_BASE_URL (use LAN IP for real devices)
npx expo start
npx expo start --android
npx expo start --ios
```

### Linting

```bash
npm run lint   # expo lint (eslint-config-expo)
```

### Architecture

```
frontend/
├── app/                    # Expo Router file-based navigation
│   ├── _layout.tsx         # Root layout (DB init, i18n setup)
│   ├── index.tsx           # Entry / redirect
│   ├── select-city.tsx     # City picker (merges backend counts + local SQLite totals)
│   ├── (tabs)/             # Native bottom tab bar (NativeTabs)
│   │   ├── overview/       # Own Stack (native large title, search bar, ⋯ menu); index.tsx = 2-column monument grid, backend sync on focus
│   │   ├── routes/         # Own Stack (native large title, search, ⋯ sort menu); index.tsx = route catalog from local DB
│   │   └── index.tsx       # Map tab (Yandex Maps via WebView)
│   ├── quiz.tsx            # Monument-specific quiz
│   ├── route-info.tsx      # Route detail
│   ├── info.tsx            # Monument detail (native SwiftUI Form + floating audio-guide button)
│   ├── camera.tsx
│   ├── menu.tsx
│   └── settings.tsx        # Clear local cache
└── src/
    ├── db/
    │   ├── database.ts         # expo-sqlite open, schema DDL, DB_SCHEMA_VERSION
    │   ├── dbInit.ts           # setupDatabase(): version check → rebuild if mismatch, seed cities
    │   ├── monumentRepository.ts
    │   ├── routeRepository.ts
    │   ├── seed.ts             # seedCitiesOnly() — monuments come from backend sync
    │   ├── devSeed.ts          # __DEV__-only fake monuments (test_* ids) when backend is unreachable and the city is empty
    │   └── monumentCacheEvents.ts
    ├── services/
    │   └── monumentsApi.ts     # fetch wrappers: counts, sync, paginated list, detail, search
    ├── components/
    │   ├── SearchBar.tsx       # Shared search input (used in overview, routes, menu, select-city)
    │   ├── RouteRow.tsx        # Shared route list row (used in routes tab and menu)
    │   ├── ActionButton.tsx    # Shared primary action button (used in info and route-info)
    │   ├── ScannerFrame.tsx        # Camera scanner corner frame
    │   └── LoadingOverlay.tsx      # Modal loading spinner
    ├── i18n/                   # react-i18next setup, locale files (ru/en/ar/zh)
    ├── map/
    ├── storage/
    └── theme/
```

**Offline-first SQLite**: The local DB (`volgogid.db`) mirrors the backend schema. `DB_SCHEMA_VERSION` in `database.ts` gates schema migrations — incrementing it triggers a full rebuild on next launch. Cities are seeded locally on first launch; all monument and route data comes from backend sync.

**Sync trigger**: The Overview tab calls `syncCityData(cityId, sinceIso)` on focus, which hits `GET /api/sync/` and upserts results into the local SQLite tables.

**i18n**: UI strings use `react-i18next`. Monument content translations are stored in the local DB (`monument_translations` table) as `lang` / `field_key` / `field_value` rows.

**Navigation**: Expo Router file-based. Screens outside `(tabs)/` are pushed modally/as stack screens. `select-city` must be visited before `(tabs)` to set the active city.

## UI rule: native iOS elements only

The app targets iOS and must use **only native elements and components**: the system navigation header and its glass back button, SF Symbols (`expo-symbols`), `Switch`, system action sheets/alerts/menus, system colors and the system font (SF Pro). Do **not** write custom replacements for native controls (back buttons, tab buttons, switches, pickers, menus).

- If a native element misbehaves, find the cause (Metro logs, SDK / `react-native-screens` version) or ask the user. Do not swap in a custom component as a workaround without explicit approval.
- If no native option exists in the current SDK (e.g. a popup menu in a row, native tab bar), stop and ask.
- Known stop-gaps accepted earlier: `ListGroup`/`ListRow` (iOS-style grouped list built from RN views). Replace with native equivalents (`@expo/ui` SwiftUI `Form`/`Menu`). The tab bar is native (`NativeTabs` from `expo-router/native-tabs`); the center "scan" tab is a regular screen with a native SwiftUI glass button (`@expo/ui`) that opens `/camera`. `src/components/ScanTabButton.tsx` is unused and can be deleted.
