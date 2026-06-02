# VolgoGid

Mobile app built with Expo + React Native for exploring monuments and routes across selected cities.

## Features

- City selection with local persistence and downloadable city state
- Monument browsing in list and map tabs
- Dynamic city object counters based on DB data (`monuments.city_id`)
- Monument detail pages with localized content
- Monument-specific quiz generation
- Route list and route details
- Camera screen and settings screen
- Light/dark theming
- Multilingual UI (`ru`, `en`, `ar`, `zh`)
- Local SQLite storage with seed + migration flow

## Tech Stack

- Expo SDK 54 + React Native 0.81
- Expo Router (file-based navigation)
- SQLite (`expo-sqlite`)
- `react-i18next` + `i18next` + `expo-localization`
- TypeScript

## Project Structure

```text
app/
  _layout.tsx            # Root stack + providers + DB setup call
  index.tsx              # Entry gate (onboarding/city flow redirect)
  select-city.tsx        # City picker
  menu.tsx               # Monument menu/search
  info.tsx               # Monument details
  route-info.tsx         # Route details
  quiz.tsx               # Monument quiz
  settings.tsx
  camera.tsx
  (tabs)/
    _layout.tsx          # Bottom tabs
    index.tsx            # Map tab
    overview.tsx         # Monument overview tab
    routes.tsx           # Routes tab

src/
  db/
    database.ts          # Schema + migrations
    dbInit.ts            # DB initialization orchestration
    seed.ts              # Seed data + city/monument sync
    monumentRepository.ts
    routeRepository.ts
  data/
    cities.ts
    monumentFilterMeta.ts
    quiz.ts
  i18n/
    i18n.ts
    ru.json
    en.json
    ar.json
    zh.json
  storage/
    citySelection.ts
  theme/
  components/
  map/
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run the app

```bash
npm run start
```

You can then open the app in Expo Go / emulator from the Expo CLI prompt.

### Platform shortcuts

```bash
npm run android
npm run ios
npm run web
```

## Quality Checks

```bash
npm run lint
npx tsc --noEmit
```

## Data and Localization Notes

- Database setup runs at app startup in `app/_layout.tsx` via `setupDatabase()`.
- Monument data is stored in SQLite and seeded from `src/db/seed.ts`.
- City object counters are derived from DB aggregates, not hardcoded values.
- Translations live in `src/i18n/*.json`; i18n bootstrap is in `src/i18n/i18n.ts`.

## NPM Scripts

- `start` - start Expo dev server
- `android` - start and open Android target
- `ios` - start and open iOS target
- `web` - start web target
- `lint` - run Expo lint
- `reset-project` - reset scaffold utility script
