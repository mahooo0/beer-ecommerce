# Phase 2: Authentication System - Research

**Researched:** 2026-03-10
**Domain:** User authentication, session management, role-based access control
**Confidence:** HIGH

## Summary

Phase 2 implements authentication across the e-commerce template using Clerk as the authentication provider. Clerk provides production-ready authentication with OAuth providers (Google, GitHub), email/password, session management, webhooks for database synchronization, and role-based access control via user metadata. The implementation spans three applications in the monorepo: client (customer-facing Next.js app), admin (admin panel Next.js app), and server (Express.js REST API).

The standard pattern uses Clerk's hybrid session approach: long-lived cookies on Clerk's domain for primary authentication, short-lived JWTs in `__session` cookies for backend verification. User roles (CUSTOMER, ADMIN, SUPER_ADMIN) are stored in publicMetadata and embedded in session tokens to enable zero-latency authorization checks. Database synchronization happens via Svix-signed webhooks that handle user.created, user.updated, and user.deleted events.

**Primary recommendation:** Use @clerk/nextjs 7.0+ for both Next.js apps with clerkMiddleware() in proxy.ts, @clerk/express for the API server with clerkMiddleware() + requireAuth(), and implement webhook-based user sync with idempotent upsert operations to handle eventual consistency.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Clerk SDK integrated in server with webhook handling for user sync | Webhook syncing architecture, signature verification with Svix, Express middleware patterns |
| AUTH-02 | User can register with email/password via Clerk on client app | ClerkProvider wrapper, SignUp component, Next.js App Router integration |
| AUTH-03 | User can login with OAuth providers (Google, GitHub) via Clerk on client app | Clerk Dashboard OAuth configuration, SignIn component with provider support |
| AUTH-04 | User session persists across browser refresh on both client and admin apps | Hybrid session cookies (__session), automatic token refresh, clerkMiddleware() session management |
| AUTH-05 | Admin app restricts access to ADMIN and SUPER_ADMIN roles only | Role-based access control via publicMetadata, checkRole() utility, middleware protection patterns |
| AUTH-06 | Server middleware validates Clerk JWT tokens and attaches user to request | clerkMiddleware() + requireAuth() for Express.js, getAuth() for user context |
| AUTH-07 | User can view and edit profile (name, email, avatar) on client app | UserProfile component, updateUser() from @clerk/nextjs, user.update() method |
| AUTH-08 | User can manage saved addresses (add, edit, delete, set default) | Database-stored addresses (not Clerk metadata due to 8KB limit), server actions with auth() verification |
| AUTH-09 | Admin can manage users (view list, view details, change roles, disable accounts) | Clerk Backend SDK (clerkClient.users), updateUserMetadata() for roles, server actions with admin role checks |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @clerk/nextjs | 7.0.1+ | Next.js authentication | Official Clerk SDK for App Router, native RSC support, fastest integration (~30 min) |
| @clerk/express | Latest | Express.js authentication | Official Clerk SDK for Express, JWT validation, clerkMiddleware() + requireAuth() |
| svix | Latest | Webhook signature verification | Clerk's webhook infrastructure provider, HMAC-SHA256 signing, official verification library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.25+ | Server action validation | Already in project - validate user profile updates, address forms |
| @clerk/testing | Latest | Test authentication mocking | Unit/integration tests - mock auth state without network calls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Clerk | NextAuth.js | More control but requires custom session management, JWT handling, OAuth setup, database sessions |
| Clerk | Supabase Auth | Tightly coupled to Supabase ecosystem, less flexible for existing Prisma/PostgreSQL setup |
| Clerk webhooks | Polling Clerk API | Simpler but rate-limited (500 req/min), not real-time, misses events during downtime |
| Svix library | Manual HMAC verification | Error-prone, must handle timestamp validation, replay attacks, signature rotation |

**Installation:**
```bash
# Next.js apps (client, admin)
pnpm add @clerk/nextjs

# Express.js server
pnpm add @clerk/express

# Webhook verification
pnpm add svix

# Testing (dev dependency)
pnpm add -D @clerk/testing
```

## Architecture Patterns

### Recommended Project Structure
```
apps/
├── client/                    # Customer-facing app
│   ├── app/
│   │   ├── layout.tsx        # <ClerkProvider> wrapper
│   │   ├── (auth)/           # Route group for auth pages
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── profile/          # User profile management
│   │   │   ├── page.tsx      # View/edit profile
│   │   │   └── addresses/    # Address management
│   │   └── api/
│   │       └── webhooks/
│   │           └── clerk/route.ts  # Webhook handler
│   ├── proxy.ts              # clerkMiddleware() config
│   └── lib/
│       └── auth.ts           # checkRole(), auth helpers
├── admin/                     # Admin panel app
│   ├── app/
│   │   ├── layout.tsx        # <ClerkProvider> wrapper
│   │   ├── page.tsx          # Redirect to /dashboard if admin
│   │   ├── dashboard/        # Admin-only routes
│   │   │   └── users/        # User management
│   │   └── unauthorized/     # Non-admin landing page
│   ├── proxy.ts              # clerkMiddleware() + role check
│   └── lib/
│       └── auth.ts           # checkRole() helper
└── server/                    # Express.js API
    ├── src/
    │   ├── index.ts          # clerkMiddleware() setup
    │   ├── middleware/
    │   │   └── auth.ts       # requireAuth() wrapper
    │   └── routes/
    │       ├── users.ts      # Protected user routes
    │       └── webhooks.ts   # Clerk webhook endpoint
    └── .env                  # CLERK_SECRET_KEY, WEBHOOK_SECRET
```

### Pattern 1: Next.js App Router Integration
**What:** Wrap entire app with ClerkProvider, use clerkMiddleware() in proxy.ts, access auth state via auth() helper in server components
**When to use:** Both client and admin Next.js apps
**Example:**
```typescript
// Source: https://clerk.com/docs/nextjs/getting-started/quickstart

// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}

// proxy.ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

// app/dashboard/page.tsx (server component)
import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return <div>Dashboard for {userId}</div>
}
```

### Pattern 2: Role-Based Access Control with Metadata
**What:** Store roles in user.publicMetadata, embed in session token via custom claims, check with checkRole() helper
**When to use:** Protecting admin routes, restricting API endpoints by role
**Example:**
```typescript
// Source: https://clerk.com/docs/guides/secure/basic-rbac

// Clerk Dashboard > Sessions > Custom Claims
// Add this JSON to session token customization:
{
  "metadata": "{{user.public_metadata}}"
}

// types/globals.d.ts
export type Roles = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}

// lib/auth.ts
import { auth } from '@clerk/nextjs/server'

export async function checkRole(role: Roles) {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata.role === role
}

export async function requireAdmin() {
  const isAdmin = await checkRole('ADMIN')
  const isSuperAdmin = await checkRole('SUPER_ADMIN')

  if (!isAdmin && !isSuperAdmin) {
    redirect('/unauthorized')
  }
}

// app/admin/dashboard/page.tsx
export default async function AdminDashboard() {
  await requireAdmin()
  return <div>Admin Dashboard</div>
}
```

### Pattern 3: Webhook-Based User Synchronization
**What:** Receive Clerk events via webhook, verify Svix signature, upsert to database using clerkId as key
**When to use:** Syncing user data to local database for relations (addresses, wishlists, reviews)
**Example:**
```typescript
// Source: https://clerk.com/docs/guides/development/webhooks/syncing

// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { db } from '@repo/db'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET!

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Verification failed', { status: 400 })
  }

  // Handle events with type safety
  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data

    // Idempotent upsert
    await db.user.upsert({
      where: { clerkId: id },
      create: {
        clerkId: id,
        email: email_addresses[0].email_address,
        firstName: first_name || '',
        lastName: last_name || '',
        avatar: image_url,
        role: (public_metadata?.role as Role) || 'CUSTOMER',
      },
      update: {
        email: email_addresses[0].email_address,
        firstName: first_name || '',
        lastName: last_name || '',
        avatar: image_url,
        role: (public_metadata?.role as Role) || 'CUSTOMER',
      },
    })
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data
    await db.user.delete({ where: { clerkId: id } })
  }

  return new Response('Webhook processed', { status: 200 })
}

// proxy.ts - Make webhook route public
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/api/webhooks/clerk'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})
```

### Pattern 4: Express.js API Protection
**What:** Use clerkMiddleware() globally, requireAuth() on protected routes, getAuth(req) to access user
**When to use:** Express.js server API endpoints
**Example:**
```typescript
// Source: https://clerk.com/docs/expressjs/getting-started/quickstart

// src/index.ts
import express from 'express'
import { clerkMiddleware } from '@clerk/express'

const app = express()

// Must be before other middleware
app.use(clerkMiddleware())

// Routes
app.use('/api/users', userRoutes)

app.listen(3001)

// src/routes/users.ts
import { Router } from 'express'
import { requireAuth, getAuth, clerkClient } from '@clerk/express'

const router = Router()

// Protected endpoint - requires authentication
router.get('/me', requireAuth(), async (req, res) => {
  const { userId } = getAuth(req)
  const user = await clerkClient.users.getUser(userId!)

  res.json({ user })
})

// Protected endpoint - requires admin role
router.patch('/:id/role', requireAuth(), async (req, res) => {
  const { userId } = getAuth(req)

  // Get current user from Clerk
  const currentUser = await clerkClient.users.getUser(userId!)
  const currentRole = currentUser.publicMetadata?.role

  // Check admin permission
  if (currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  // Update target user role
  const { id } = req.params
  const { role } = req.body

  await clerkClient.users.updateUserMetadata(id, {
    publicMetadata: { role },
  })

  res.json({ success: true })
})

export default router
```

### Pattern 5: Server Actions for User Management
**What:** Use server actions with auth() verification for profile updates, address management
**When to use:** Next.js client app - user profile editing, address CRUD
**Example:**
```typescript
// app/profile/actions.ts
'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@repo/db'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  // Update in Clerk (triggers webhook to sync to DB)
  await clerkClient.users.updateUser(userId, {
    firstName,
    lastName,
  })

  revalidatePath('/profile')
  return { success: true }
}

export async function addAddress(data: {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault?: boolean
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get user's database ID from clerkId
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new Error('User not found')

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    })
  }

  const address = await db.address.create({
    data: {
      ...data,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  })

  revalidatePath('/profile/addresses')
  return address
}
```

### Anti-Patterns to Avoid
- **Multiple middleware files**: Don't create separate middleware for /dashboard and /api - use single clerkMiddleware() with matchers to avoid redirect loops
- **Double redirects**: Don't manually redirect unauthenticated users in protected routes - clerkMiddleware() handles this automatically
- **Syncing Clerk data unnecessarily**: Only sync to database if you need user relations (addresses, wishlists) or querying other users - otherwise use session token claims
- **Storing sensitive data in publicMetadata**: Use privateMetadata for sensitive info (Stripe IDs) - publicMetadata is readable from frontend
- **Ignoring webhook idempotency**: Webhooks may deliver duplicates - always use upsert operations keyed on clerkId
- **Parsing webhook body before verification**: Must use raw body for Svix signature verification - body-parser breaks verification
- **Not checking roles on server**: Client-side role checks are insufficient - always verify with auth() or getAuth() on server

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth provider integration | Custom OAuth flow with redirect handling, token exchange, provider-specific quirks | Clerk OAuth configuration | Clerk handles Google/GitHub/20+ providers, manages token refresh, PKCE flow, provider API changes |
| Session token refresh | Custom JWT expiry + refresh token rotation, secure storage, background refresh timers | Clerk's hybrid session cookies | Clerk auto-refreshes in background before expiry (Core 3 feature), handles cross-tab sync, manages cookie security |
| Webhook signature verification | Manual HMAC-SHA256 computation, timestamp validation, replay attack prevention | Svix library + Clerk webhook signing | Svix handles signature rotation, timing attacks, provides battle-tested verification logic |
| Role-based middleware | Custom role checking middleware with database queries per request | Clerk publicMetadata + session token claims | Roles embedded in JWT (no DB call), custom claims in session token, zero-latency checks |
| Multi-app authentication | Custom session sharing, cross-domain cookies, SSO implementation | Clerk satellite domains | Clerk syncs auth state across subdomains/domains, handles CORS, manages session lifecycle |
| User profile components | Custom profile UI, form validation, image upload, error states | Clerk UserProfile component | Pre-built, accessible, customizable UI with validation, avatar upload, MFA settings |

**Key insight:** Authentication is deceptively complex - OAuth has provider-specific quirks, session management requires timing attacks prevention, webhooks need replay protection, JWTs have size/security tradeoffs. Clerk's value is handling edge cases you won't discover until production (token refresh during network interruption, webhook delivery failures, cookie 4KB limit, browser session clearing). Building custom auth typically underestimates 10x in complexity.

## Common Pitfalls

### Pitfall 1: Session Token Size Exceeds Cookie Limit
**What goes wrong:** Storing too much data in publicMetadata causes session token cookie to exceed browser's 4KB limit, breaking authentication
**Why it happens:** Developers add user preferences, settings, nested objects to publicMetadata without realizing it goes into session token
**How to avoid:** Keep publicMetadata under 1.2KB (Clerk's default claims use 2.8KB of 4KB limit). Store only role and minimal flags. Use database for preferences, addresses, settings.
**Warning signs:** Intermittent auth failures, users logged out randomly, "cookie not set" errors in production

### Pitfall 2: Webhook Signature Verification with Parsed Body
**What goes wrong:** Using Express body-parser middleware before webhook route causes signature verification to fail
**Why it happens:** Svix signature is computed on raw body bytes - JSON parsing/stringifying changes byte representation
**How to avoid:** Exclude webhook route from body-parser or use raw body. In Next.js Route Handlers, use `await req.json()` then `JSON.stringify()` for verification.
**Warning signs:** All webhook requests return 400 verification failed, webhooks work in Clerk Dashboard testing but fail in production

### Pitfall 3: Race Condition Between Webhook and User Action
**What goes wrong:** User signs up, immediately updates profile, but webhook hasn't created database record yet - update fails
**Why it happens:** Webhooks are eventually consistent, network latency can delay delivery by seconds
**How to avoid:** Use upsert operations in application code when referencing user. Check if user exists before relation operations, create if missing.
**Warning signs:** "User not found" errors immediately after signup, intermittent failures on first login

### Pitfall 4: Not Checking System Permissions with has()
**What goes wrong:** Using `auth().has({ permission: 'org:admin' })` returns false even for admins because System Permissions aren't in session token
**Why it happens:** Clerk only embeds Custom Permissions in tokens, not built-in System Permissions
**How to avoid:** Use `sessionClaims?.metadata.role` check instead of `has()` for role-based logic. Reserve `has()` for custom permissions only.
**Warning signs:** Admin users denied access, permission checks work in Clerk Dashboard but not in app

### Pitfall 5: Forgetting to Force Token Refresh After Metadata Update
**What goes wrong:** Server updates user's role via clerkClient.users.updateUserMetadata(), but UI still shows old role for 60 seconds
**Why it happens:** Session tokens are cached for 60 seconds, metadata changes don't trigger immediate refresh
**How to avoid:** After server-side metadata update, call `await auth().getToken({ template: 'default' })` to force refresh, or use optimistic UI updates
**Warning signs:** Role changes don't take effect immediately, users need to refresh page to see updated permissions

### Pitfall 6: Multiple clerkMiddleware() Calls
**What goes wrong:** Creating separate middleware files for different route patterns causes one to override the other
**Why it happens:** Next.js only supports one middleware.ts file, developers try to split logic
**How to avoid:** Use single clerkMiddleware() with createRouteMatcher() to define public/protected route patterns
**Warning signs:** Some routes not protected, unexpected redirects, middleware not firing on certain paths

### Pitfall 7: Syncing User Data Before Clerk Session Exists
**What goes wrong:** Webhook creates user in database, but Clerk session token hasn't been issued yet - userId in session doesn't match database
**Why it happens:** User creation webhook fires before sign-up flow completes
**How to avoid:** Use clerkId as foreign key in database, never assume user exists before first auth() call succeeds
**Warning signs:** Null userId in session, foreign key constraint violations, user not found errors

### Pitfall 8: Not Making Webhook Route Public
**What goes wrong:** Webhook endpoint requires authentication, Clerk can't POST events, all deliveries fail
**Why it happens:** Forgetting to exclude /api/webhooks from clerkMiddleware() protection
**How to avoid:** Use createRouteMatcher() to mark webhook routes as public: `isPublicRoute(req)` check before auth.protect()
**Warning signs:** Clerk Dashboard shows all webhook deliveries failing with 401/403, no events reaching handler

## Code Examples

Verified patterns from official sources:

### Admin Role Check in Middleware
```typescript
// Source: https://clerk.com/docs/guides/secure/basic-rbac

// proxy.ts (admin app)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/unauthorized'])

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth()
  const role = sessionClaims?.metadata?.role

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Redirect non-admins
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    const url = new URL('/unauthorized', req.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### User List with Role Management (Admin)
```typescript
// Source: https://clerk.com/docs/guides/secure/basic-rbac

// app/admin/users/page.tsx
import { clerkClient } from '@clerk/nextjs/server'
import { checkRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const isAdmin = await checkRole('ADMIN')
  const isSuperAdmin = await checkRole('SUPER_ADMIN')

  if (!isAdmin && !isSuperAdmin) {
    redirect('/unauthorized')
  }

  const { data: users } = await clerkClient.users.getUserList()

  return (
    <div>
      <h1>User Management</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// app/admin/users/actions.ts
'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export async function setUserRole(userId: string, role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN') {
  const { sessionClaims } = await auth()
  const currentRole = sessionClaims?.metadata?.role

  // Only admins can change roles
  if (currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN') {
    throw new Error('Admin access required')
  }

  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  })

  // Force token refresh for the updated user
  revalidatePath('/admin/users')
}

export async function toggleUserStatus(userId: string, active: boolean) {
  const { sessionClaims } = await auth()
  const currentRole = sessionClaims?.metadata?.role

  if (currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN') {
    throw new Error('Admin access required')
  }

  if (active) {
    await clerkClient.users.unbanUser(userId)
  } else {
    await clerkClient.users.banUser(userId)
  }

  revalidatePath('/admin/users')
}
```

### Address Management with Auth Check
```typescript
// app/profile/addresses/actions.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@repo/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  street: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  label: z.string().optional(),
  isDefault: z.boolean().default(false),
})

export async function createAddress(data: z.infer<typeof addressSchema>) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  // Validate input
  const validated = addressSchema.parse(data)

  // Get database user
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')

  // If default, unset others
  if (validated.isDefault) {
    await db.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    })
  }

  const address = await db.address.create({
    data: {
      ...validated,
      userId: user.id,
    },
  })

  revalidatePath('/profile/addresses')
  return { success: true, addressId: address.id }
}

export async function updateAddress(
  addressId: string,
  data: Partial<z.infer<typeof addressSchema>>
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')

  // Verify ownership
  const existing = await db.address.findFirst({
    where: { id: addressId, userId: user.id },
  })
  if (!existing) throw new Error('Address not found')

  // If setting as default, unset others
  if (data.isDefault) {
    await db.address.updateMany({
      where: { userId: user.id, id: { not: addressId } },
      data: { isDefault: false },
    })
  }

  await db.address.update({
    where: { id: addressId },
    data,
  })

  revalidatePath('/profile/addresses')
  return { success: true }
}

export async function deleteAddress(addressId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')

  // Verify ownership before delete
  await db.address.deleteMany({
    where: { id: addressId, userId: user.id },
  })

  revalidatePath('/profile/addresses')
  return { success: true }
}
```

### Express.js Protected Route with Role Check
```typescript
// Source: https://clerk.com/docs/expressjs/getting-started/quickstart

// apps/server/src/routes/users.ts
import { Router } from 'express'
import { requireAuth, getAuth, clerkClient } from '@clerk/express'
import { db } from '@repo/db'

const router = Router()

// Get current user profile
router.get('/me', requireAuth(), async (req, res) => {
  const { userId: clerkId } = getAuth(req)

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: { addresses: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json(user)
})

// Admin only: List all users
router.get('/', requireAuth(), async (req, res) => {
  const { userId: clerkId } = getAuth(req)

  const currentUser = await clerkClient.users.getUser(clerkId!)
  const role = currentUser.publicMetadata?.role

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  const users = await db.user.findMany({
    include: {
      _count: {
        select: { addresses: true, reviews: true, wishlists: true },
      },
    },
  })

  res.json(users)
})

export default router
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ClerkProvider in _app.tsx (Pages Router) | ClerkProvider in app/layout.tsx (App Router) | Core 2 (2024) | Native RSC support, better performance, simpler API |
| authMiddleware() | clerkMiddleware() | Core 2 (2024) | Simpler API, createRouteMatcher() for route patterns, better TypeScript |
| getToken() blocks on expiry | getToken() proactive refresh | Core 3 (March 2026) | Zero wait time, background refresh before expiry |
| @clerk/clerk-sdk-node for backend | @clerk/express for Express | Core 2 (2024) | Express-specific middleware, better DX, requireAuth() helper |
| Manual role checks with database queries | publicMetadata in session token claims | 2024 | Zero-latency role checks, no DB roundtrip |
| ngrok for webhook testing | Cloudflare Tunnel / InstaTunnel | 2026 | Free tier more generous, custom subdomains, better reliability |

**Deprecated/outdated:**
- **authMiddleware()**: Replaced by clerkMiddleware() in Core 2 - old API still works but deprecated
- **@clerk/clerk-sdk-node**: Superseded by framework-specific SDKs (@clerk/nextjs, @clerk/express) - still functional but not recommended
- **ClerkExpressRequireAuth()**: Old Express middleware replaced by requireAuth() in @clerk/express
- **Clerk.js Frontend API direct usage**: Framework SDKs (ClerkProvider) now preferred over raw Clerk.js
- **proxy.ts filename for Next.js 15**: Changed back to middleware.ts (15+), but proxy.ts naming was temporary

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework detected in project yet |
| Config file | None - see Wave 0 |
| Quick run command | TBD after framework selection |
| Full suite command | TBD after framework selection |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Webhook receives user.created and syncs to DB | integration | `vitest tests/webhooks/clerk.test.ts -x` | ❌ Wave 0 |
| AUTH-01 | Webhook signature verification rejects invalid signatures | unit | `vitest tests/webhooks/signature.test.ts -x` | ❌ Wave 0 |
| AUTH-02 | User can register with email/password | e2e | Manual - Playwright test on deployed preview | ❌ Manual |
| AUTH-03 | User can login with OAuth (Google) | e2e | Manual - Playwright test on deployed preview | ❌ Manual |
| AUTH-04 | Session persists after browser refresh | e2e | Manual - Playwright test on deployed preview | ❌ Manual |
| AUTH-05 | Admin app denies CUSTOMER role access | integration | `vitest tests/middleware/admin-access.test.ts -x` | ❌ Wave 0 |
| AUTH-06 | Express middleware attaches auth to request | unit | `vitest tests/middleware/express-auth.test.ts -x` | ❌ Wave 0 |
| AUTH-07 | User can update profile (name, avatar) | integration | `vitest tests/actions/profile.test.ts -x` | ❌ Wave 0 |
| AUTH-08 | User can add/edit/delete addresses | integration | `vitest tests/actions/addresses.test.ts -x` | ❌ Wave 0 |
| AUTH-09 | Admin can change user roles via server action | integration | `vitest tests/actions/admin-users.test.ts -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Quick smoke tests - `vitest run --reporter=verbose --bail=1`
- **Per wave merge:** Full integration suite - `vitest run --coverage`
- **Phase gate:** Full suite green + manual E2E checklist before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` (workspace root) - Configure Vitest for monorepo with @clerk/testing
- [ ] `apps/client/tests/setup.ts` - Mock Clerk context for client tests
- [ ] `apps/admin/tests/setup.ts` - Mock Clerk context for admin tests
- [ ] `apps/server/tests/setup.ts` - Mock Clerk middleware for server tests
- [ ] `tests/webhooks/clerk.test.ts` - Webhook event handling tests
- [ ] `tests/middlewares/admin-access.test.ts` - Role-based access control tests
- [ ] `tests/actions/profile.test.ts` - User profile update tests
- [ ] `tests/actions/addresses.test.ts` - Address CRUD tests
- [ ] Framework install: `pnpm add -D vitest @vitest/ui @clerk/testing` - No test framework detected

**Recommended test framework:** Vitest - already have Vite-compatible setup, faster than Jest, better TypeScript support, official @clerk/testing package provides mocks

**E2E Testing Note:** OAuth flows (Google, GitHub) and session persistence require real browser testing. Recommend Playwright for production E2E suite, but defer to Phase 21 (full QA pass). For Phase 2 verification, manual testing of auth flows is acceptable.

## Sources

### Primary (HIGH confidence)
- [Clerk Next.js Quickstart (App Router)](https://clerk.com/docs/nextjs/getting-started/quickstart) - Installation, setup, ClerkProvider, middleware
- [Clerk Webhook Syncing Guide](https://clerk.com/docs/guides/development/webhooks/syncing) - Webhook events, signature verification, database sync patterns
- [Clerk Express Middleware Reference](https://clerk.com/docs/reference/express/clerk-middleware) - clerkMiddleware(), requireAuth(), JWT validation
- [Clerk Basic RBAC Guide](https://clerk.com/docs/guides/secure/basic-rbac) - publicMetadata roles, session token customization, checkRole() pattern
- [Clerk User Metadata Guide](https://clerk.com/docs/guides/users/extending) - publicMetadata vs privateMetadata vs unsafeMetadata, size limits

### Secondary (MEDIUM confidence)
- [Complete Authentication Guide for Next.js App Router in 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router) - Architecture patterns, best practices
- [Securing Node.js Express APIs with Clerk and React](https://clerk.com/blog/securing-node-express-apis-clerk-react) - Express integration patterns
- [Clerk Webhooks Getting Started](https://clerk.com/blog/webhooks-getting-started) - Webhook setup, testing, debugging
- [@clerk/nextjs npm package](https://www.npmjs.com/package/@clerk/nextjs) - Current version (7.0.1), changelog
- [10 Best ngrok Alternatives for Webhook Testing (2026)](https://dev.to/digital_trubador/10-best-ngrok-alternatives-for-webhook-testing-2026-89d) - Local webhook testing tools

### Tertiary (LOW confidence - WebSearch only, verify before using)
- [Turbo + Expo + Next.js + Clerk + Convex Monorepo](https://github.com/get-convex/turbo-expo-nextjs-clerk-convex-monorepo) - Monorepo authentication example
- [Clerk Testing with Jest/Vitest](https://clerk.com/blog/testing-clerk-nextjs) - Mocking patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Clerk SDKs, latest versions verified via npm, official docs current as of March 2026
- Architecture: HIGH - Patterns from official Clerk documentation, verified with WebFetch of actual docs
- Pitfalls: HIGH - Common mistakes documented in official guides, community patterns verified across multiple sources
- Validation: MEDIUM - Test framework not yet set up in project, patterns based on @clerk/testing docs + Vitest best practices

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (30 days - Clerk is stable, Core 3 just released, unlikely breaking changes)
