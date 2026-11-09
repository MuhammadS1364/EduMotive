# EduMotive Workspace

A ZiteJS monorepo containing three apps that share one Zite Database.

| App | Path | Description |
| --- | --- | --- |
| EduMotive | `apps/edumotive` | Public education magazine site: articles, authors, e-magazine flipbook reader, subscriptions & parcel tracking |
| Motive Admin | `apps/motive-admin` | Admin console for articles, authors, issues and subscriptions |
| UniMedia | `apps/unimedia` | Companion media site |

Shared UI components (shadcn/ui) live in `packages/components`.

## Tech stack
React + Vite + TypeScript, Tailwind CSS, shadcn/ui, ZiteJS backend endpoints (`src/api/*.ts`) and the Zite Database.

## Getting started
```bash
npm install
npx zitejs generate   # regenerate typed SDKs in .zite/
```

## Secrets
Never commit credentials. Secrets and integration tokens are managed in Zite (Settings → Secrets / Integrations) and read at runtime via `zitejs/integrations` or `process.env.ZITE_*`. `.env*` files are git-ignored.

## Structure
```
apps/<app>/src/        frontend (pages, components)
apps/<app>/src/api/    backend endpoints
packages/components/   shared design system
.zite/                 auto-generated SDKs (do not edit)
```
