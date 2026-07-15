# syntax=docker/dockerfile:1
# Single image containing the whole built monorepo.
# Prod containers (client/admin/server/storage) run from this image with different commands.
FROM node:22-slim AS build
ENV PNPM_HOME=/pnpm PATH="/pnpm:$PATH" NEXT_TELEMETRY_DISABLED=1 CI=1
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate \
    && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# NEXT_PUBLIC_* are inlined into the client/admin bundles at build time,
# so they must carry PROD values here (passed as --build-arg from CI).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STORAGE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CLIENT_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEILISEARCH_HOST
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_STORAGE_URL=$NEXT_PUBLIC_STORAGE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CLIENT_URL=$NEXT_PUBLIC_CLIENT_URL \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEILISEARCH_HOST=$NEXT_PUBLIC_MEILISEARCH_HOST

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
# Build only the Next.js apps. server/storage run via tsx at runtime — their
# `tsc` build currently fails on nodenext/type errors that tsx (dev) tolerates.
RUN pnpm exec turbo run build --filter=client --filter=admin

EXPOSE 3002 3003 4000 4001
# Base image — each service overrides `command` in the compose file.
CMD ["node", "-e", "console.log('taranka base image — set a per-service command')"]
