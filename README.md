# Frontend (Separated)

This is the separated frontend app copied from the existing hostel UI.

## Run

```bash
pnpm install
pnpm dev
```

Default port is `5173` unless overridden.

## Backend Connection

The API client now sends Firebase ID tokens when a Firebase session exists and still keeps `credentials: include` for legacy cookie sessions during migration.

## Firebase Auth

Add these env vars in `.env.local`:

- `VITE_apiKey`
- `VITE_authDomain`
- `VITE_projectId`
- `VITE_storageBucket`
- `VITE_messagingSenderId`
- `VITE_appId`
