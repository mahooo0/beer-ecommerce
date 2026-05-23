# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.9.2 - Used across all packages (apps/server, apps/client, apps/admin, packages/*)
- JavaScript (ESM) - Build output format for server, module system for all packages

**Secondary:**
- JSX/TSX - React components in Next.js apps (apps/client, apps/admin)

## Runtime

**Environment:**
- Node.js >=18 (specified in root `package.json`)
- Server runs on Node with native ESM (`"type": "module"`)
- Next.js 16.1.5 runtime for client and admin apps

**Package Manager:**
- pnpm 9.0.0 (specified in `packageManager` field)
- Workspace protocol for internal packages (`workspace:*`)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- Express 5.1.0 - Backend API framework (`apps/server/package.json`)
- Next.js 16.1.5 - Frontend framework for client and admin apps (`apps/client/package.json`, `apps/admin/package.json`)
- React 19.2.0 - UI library for Next.js apps
- Turborepo 2.8.15 - Monorepo orchestration (`turbo.json`)

**Testing:**
- Not detected - No test framework configured yet

**Build/Dev:**
- tsx 4.19.0 - TypeScript execution for development server (`apps/server/package.json`)
- TypeScript 5.9.2 - Type checking and compilation
- Prettier 3.7.4 - Code formatting (`.prettierrc`)
- ESLint 9.39.1 - Linting with TypeScript support
- Tailwind CSS 4.1.0 - Utility-first CSS framework (`apps/client` and `apps/admin`)
- PostCSS - CSS processing via `@tailwindcss/postcss` 4.1.0

## Key Dependencies

**Critical:**
- @prisma/client 6.8.0 - PostgreSQL ORM (`packages/db/package.json`)
- prisma 6.8.0 - Database schema management and migrations
- mongoose 8.14.0 - MongoDB ODM for orders (`packages/db/package.json`)
- zod 3.25.0 - Runtime schema validation (`apps/server/package.json`)

**Infrastructure:**
- cors 2.8.5 - CORS middleware for Express
- dotenv 16.5.0 - Environment variable loading
- swagger-jsdoc 6.2.8 - OpenAPI documentation generator
- swagger-ui-express 5.0.1 - Interactive API documentation
- zustand 5.0.0 - State management for client app (`apps/client/package.json`)

**Development:**
- typescript-eslint 8.50.0 - TypeScript ESLint parser and rules
- eslint-plugin-turbo 2.7.1 - Turborepo-specific linting
- eslint-plugin-react 7.37.5 - React linting rules
- eslint-plugin-react-hooks 5.2.0 - React Hooks linting
- @next/eslint-plugin-next 15.5.0 - Next.js linting rules

## Configuration

**Environment:**
- Configured via `.env` file with dotenv (never committed)
- `.env.example` provides template with required variables
- Key environment variables:
  - `DATABASE_URL` - PostgreSQL connection string
  - `MONGODB_URI` - MongoDB connection string
  - `PORT` - Server port (default 4000)
  - `NODE_ENV` - Environment mode
  - `CLERK_SECRET_KEY` - Auth provider secret
  - `STRIPE_SECRET_KEY` - Payment provider secret
  - `CLIENT_URL` - Frontend URL
  - `ADMIN_URL` - Admin panel URL

**Build:**
- `turbo.json` - Turborepo pipeline configuration
- `tsconfig.json` - Root TypeScript config extends `@repo/typescript-config/base.json`
- `packages/typescript-config/base.json` - Shared TypeScript base config (strict mode, ES2022 target, NodeNext modules)
- `packages/typescript-config/node.json` - Node.js-specific TypeScript config
- `packages/typescript-config/nextjs.json` - Next.js-specific TypeScript config (ESNext module, Bundler resolution)
- `apps/server/tsconfig.json` - Server-specific config (extends node.json, outputs to dist/)
- `apps/client/tsconfig.json` - Client-specific config (extends nextjs.json, path aliases @/*)
- `apps/admin/tsconfig.json` - Admin-specific config (extends nextjs.json, path aliases @/*)
- `.prettierrc` - Code formatting rules (semi, singleQuote, tabWidth 2, trailingComma all, printWidth 100)
- `eslint.config.js` - ESLint flat config in each app
- `packages/eslint-config/base.js` - Shared ESLint base config
- `packages/eslint-config/next.js` - Next.js-specific ESLint config
- `next.config.ts` - Next.js configuration for client and admin apps
- `postcss.config.mjs` - PostCSS configuration for Tailwind

## Platform Requirements

**Development:**
- Node.js >=18
- pnpm 9.0.0
- PostgreSQL 16 (via Docker: `postgres:16-alpine`)
- MongoDB 7 (via Docker: `mongo:7`)
- Docker and Docker Compose for local database setup

**Production:**
- Deployment target not specified
- Build outputs:
  - Server: `dist/` directory (compiled JavaScript from TypeScript)
  - Client: `.next/` directory (Next.js production build)
  - Admin: `.next/` directory (Next.js production build)
- Environment variables required in production environment

---

*Stack analysis: 2026-03-10*
