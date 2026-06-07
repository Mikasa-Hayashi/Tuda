# Tuda – Mobile Client

Expo + React Native app for the Tuda mobile application.

## Features

- City selection with **backend monument counts** (`GET /api/monuments/counts`) merged with local SQLite totals
- Monument browsing (overview list and map tabs)
- Monument detail pages with localized content
- Monument-specific quiz generation
- Route list and route details (from local DB; route API sync is partial)
- Camera screen and settings (including clear local cache)
- Light/dark theming
- Multilingual UI (`ru`, `en`, `ar`, `zh`)
- Offline SQLite storage; monuments loaded via backend sync on Overview focus

## Tech Stack

- Expo SDK 54 + React Native 0.81
- Expo Router (file-based navigation)
- SQLite (`expo-sqlite`)
- `react-i18next` + `i18next` + `expo-localization`
- TypeScript

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure API URL

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_BASE_URL` (e.g. `http://192.168.1.10:8000/api` on a real device).

### 3) Run the app

```bash
npx expo start
```

Ensure the [backend](../backend/README.md) is running and seeded before testing sync.
