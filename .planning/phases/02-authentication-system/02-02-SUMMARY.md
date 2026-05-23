---
phase: 02-authentication-system
plan: 02
subsystem: server-auth
tags: [authentication, clerk, webhook, middleware, jwt]
dependency_graph:
  requires: [packages/db]
  provides: [auth-middleware, user-sync-webhook]
  affects: [apps/server]
tech_stack:
  added: [@clerk/express, svix]
  patterns: [jwt-validation, webhook-signature-verification, soft-delete]
key_files:
  created:
    - apps/server/src/common/middleware/auth.middleware.ts
    - apps/server/src/modules/auth/auth.controller.ts
    - apps/server/src/modules/auth/auth.routes.ts
    - apps/server/src/modules/auth/auth.service.ts
  modified:
    - apps/server/src/index.ts
    - apps/server/src/config/index.ts
decisions:
  - title: "Use Clerk's clerkMiddleware() globally for JWT parsing"
    rationale: "Enables all routes to access auth context via getAuth(req) without per-route overhead"
  - title: "Soft delete users (isActive=false) on user.deleted event"
    rationale: "Preserves order history and referential integrity when users are deleted from Clerk"
  - title: "Configure raw body parsing specifically for webhook route"
    rationale: "Svix signature verification requires raw request body before JSON parsing"
  - title: "Store role in Clerk publicMetadata instead of local DB"
    rationale: "Single source of truth for authorization, accessed via Clerk Backend SDK"
metrics:
  duration_minutes: 1.85
  completed_date: 2026-03-10
  tasks_completed: 2
  files_created: 4
  files_modified: 2
  commits: 2
---

# Phase 02 Plan 02: Server Authentication Integration Summary

JWT authentication with Clerk Express SDK and webhook-based user synchronization from Clerk to PostgreSQL.

## Overview

Replaced placeholder authentication middleware with production-ready Clerk integration. Server now validates JWT tokens globally, enforces role-based access control via Clerk's publicMetadata, and syncs user data to PostgreSQL through Svix-verified webhooks. This establishes the authentication foundation for both client and admin apps to consume protected API endpoints.

## Tasks Completed

### Task 1: Replace placeholder auth middleware with Clerk Express integration
**Status:** ✅ Completed
**Commit:** 7497efe
**Files:**
- `apps/server/src/index.ts` - Registered clerkMiddleware() globally after CORS, configured raw body parsing for webhook route
- `apps/server/src/common/middleware/auth.middleware.ts` - Replaced placeholder with requireAuth from @clerk/express, added requireAdmin and requireRole using Clerk Backend SDK
- `apps/server/src/config/index.ts` - Added clerkWebhookSecret configuration

**Key Changes:**
- Imported `clerkMiddleware` from `@clerk/express` and registered globally after CORS but before JSON parsing
- Rewrote `requireAuth` as re-export of `clerkRequireAuth()` for real JWT validation
- Implemented `requireAdmin` middleware that checks `publicMetadata.role` via `clerkClient.users.getUser(userId)`
- Added `requireRole(role)` factory function for custom role guards
- Configured `express.raw({ type: 'application/json' })` specifically for `/api/auth/webhooks` to preserve raw body for signature verification

### Task 2: Implement Clerk webhook handler for user synchronization
**Status:** ✅ Completed
**Commit:** c2b83eb
**Files:**
- `apps/server/src/modules/auth/auth.service.ts` - Expanded syncUser to handle full Clerk user payload, added deleteUser for soft delete
- `apps/server/src/modules/auth/auth.controller.ts` - Added handleWebhook with Svix signature verification, updated getMe to use getAuth(req)
- `apps/server/src/modules/auth/auth.routes.ts` - Added POST /webhooks/clerk route without auth middleware

**Key Changes:**
- Created `handleWebhook` controller method that:
  - Extracts raw body and Svix headers (svix-id, svix-timestamp, svix-signature)
  - Verifies webhook signature using `new Webhook(config.clerkWebhookSecret).verify()`
  - Handles `user.created`, `user.updated`, and `user.deleted` events
  - Extracts email, firstName, lastName, avatar, phone, and role from Clerk payload
  - Performs idempotent upsert keyed on clerkId for create/update events
  - Soft deletes users by setting `isActive=false` on delete events
- Updated `syncUser` to accept avatar, phone, and role fields in addition to existing fields
- Updated `getMe` to extract `userId` from `getAuth(req)` instead of query parameter
- Registered webhook route at `POST /api/auth/webhooks/clerk` without authentication guard

## Verification Results

All automated verification checks passed:

✅ `clerkMiddleware()` registered globally in Express app
✅ `requireAuth` uses real JWT validation from `@clerk/express`
✅ `requireAdmin` checks `publicMetadata.role` via Clerk Backend SDK
✅ Webhook route registered at `POST /api/auth/webhooks/clerk` without auth guard
✅ Webhook controller verifies Svix signature before processing
✅ Webhook handles `user.created`, `user.updated`, `user.deleted` events
✅ User sync uses idempotent upsert keyed on `clerkId`
✅ `GET /me` extracts `userId` from Clerk auth context (not query param)
✅ Raw body parsing configured specifically for webhook route

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Met

✅ Clerk clerkMiddleware() registered globally in Express app (AUTH-06 foundation)
✅ requireAuth uses real JWT validation from @clerk/express (AUTH-06)
✅ Webhook endpoint processes Clerk user events and syncs to PostgreSQL (AUTH-01)
✅ Svix signature verification protects webhook from unauthorized requests (AUTH-01)
✅ User data (email, name, avatar, role) syncs on create/update events (AUTH-01)
✅ User soft-deleted on user.deleted event (AUTH-01)

## Integration Points

**Upstream Dependencies:**
- `packages/db` - Prisma client for User model with clerkId unique index
- `@clerk/express` - JWT middleware and Backend SDK for role checks
- `svix` - Webhook signature verification library

**Downstream Consumers:**
- `apps/client` - Will authenticate users and call protected endpoints
- `apps/admin` - Will enforce admin-only routes via requireAdmin
- All server modules - Can use requireAuth/requireAdmin/requireRole for protection

**Key Exports:**
- `requireAuth` - Middleware for JWT validation (from @clerk/express)
- `requireAdmin` - Middleware for admin role enforcement
- `requireRole(role)` - Factory for custom role guards
- `POST /api/auth/webhooks/clerk` - Webhook endpoint for Clerk user events
- `GET /api/auth/me` - Get current authenticated user
- `GET /api/auth/users` - Get all users (admin only)

## Architecture Impact

**Before:** Placeholder auth middleware with no real JWT verification, manual user sync endpoint, no webhook integration.

**After:** Production-ready authentication system with:
- Global JWT validation on all requests via Clerk middleware
- Role-based access control using Clerk publicMetadata as single source of truth
- Automatic user synchronization from Clerk to PostgreSQL via webhooks
- Secure webhook signature verification preventing unauthorized sync requests

**Benefits:**
- No need to manage JWT secrets or verification logic (Clerk handles it)
- Centralized role management in Clerk publicMetadata
- Automatic user data consistency between Clerk and local database
- Protection against webhook spoofing via Svix signatures

## Testing Notes

**Manual Testing Required:**
1. Set up Clerk webhook in Clerk Dashboard pointing to `https://yourdomain.com/api/auth/webhooks/clerk`
2. Add `CLERK_WEBHOOK_SIGNING_SECRET` to environment variables
3. Create a test user in Clerk → verify user synced to PostgreSQL with correct data
4. Update user in Clerk → verify changes reflected in PostgreSQL
5. Delete user in Clerk → verify `isActive=false` in PostgreSQL
6. Make authenticated request to `GET /api/auth/me` with valid Clerk JWT → verify correct user returned
7. Make authenticated request to `GET /api/auth/users` as admin → verify user list returned
8. Make same request as non-admin → verify 403 Forbidden

**Edge Cases Handled:**
- Missing email in Clerk payload → throws 400 error
- Missing Svix headers → throws 400 error
- Invalid webhook signature → throws 400 error
- Unhandled event types → logged but not thrown
- Missing userId in auth context → throws 401 error
- Non-admin role attempting admin route → throws 403 error

## Next Steps

The server now has functional authentication. Next plans should:

1. **Client authentication** - Integrate Clerk React SDK in client app
2. **Admin authentication** - Integrate Clerk React SDK in admin app with role checks
3. **Protected endpoints** - Add requireAuth/requireAdmin to product/order/payment routes
4. **Role seeding** - Script to add role to Clerk users' publicMetadata for existing users

## Self-Check: PASSED

**Files Created:**
```bash
✅ apps/server/src/common/middleware/auth.middleware.ts
✅ apps/server/src/modules/auth/auth.controller.ts
✅ apps/server/src/modules/auth/auth.routes.ts
✅ apps/server/src/modules/auth/auth.service.ts
```

**Files Modified:**
```bash
✅ apps/server/src/index.ts
✅ apps/server/src/config/index.ts
```

**Commits Verified:**
```bash
✅ 7497efe - feat(02-02): integrate Clerk authentication middleware
✅ c2b83eb - feat(02-02): implement Clerk webhook handler for user sync
```

All files exist, commits verified, implementation matches plan requirements.
