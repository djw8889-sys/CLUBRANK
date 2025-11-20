# CLUBRANK

A lightweight Express server that powers the CLUBRANK API. This repo now ships
with tooling that works cleanly inside GitHub Codespaces.

## Running in Codespaces
1. Copy `.env.example` to `.env` and provide either `FIREBASE_SERVICE_ACCOUNT`
   (base64-encoded JSON) or `FIREBASE_SERVICE_ACCOUNT_PATH`.
2. From the workspace root run:
   ```bash
   npm install --ignore-scripts
   npm run dev
   ```
   The dev server binds to `0.0.0.0` so the forwarded port works in Codespaces.

## API
- `GET /health` – healthcheck.
- `GET /api/clubs/my-membership` – expects `x-user-id` header and returns a
  Firestore membership document when Firebase Admin is configured.
