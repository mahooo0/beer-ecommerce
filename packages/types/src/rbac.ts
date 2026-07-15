// ============================================================================
// RBAC — Role-Based Access Control for the admin panel
// ============================================================================
// Single source of truth for what each role can access. Shared by:
//   - admin (Next.js): middleware, dashboard layout guard, per-section guards,
//     sidebar filtering, server actions
//   - server (Express): requirePermission route guards
//
// Model: each user has ONE `role` (stored in Clerk publicMetadata.role and
// mirrored in the DB). A role maps to a set of PERMISSIONS. Sections/routes are
// gated by permission, not by role directly — so adding a new role is just a
// new entry in ROLE_PERMISSIONS (+ a Prisma enum migration if the role is
// persisted in the DB).

// ---------------------------------------------------------------------------
// Permission catalog
// ---------------------------------------------------------------------------
// One permission per navigable admin section, plus the sensitive user/role
// management actions split out so they can be granted independently.
export const PERMISSIONS = {
  DASHBOARD: 'dashboard', // Overview
  ANALYTICS: 'analytics',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  COLLECTIONS: 'collections',
  BRANDS: 'brands',
  TAGS: 'tags',
  ORDERS: 'orders',
  SHIPPING: 'shipping',
  INVENTORY: 'inventory',
  SEARCH: 'search',
  USERS_VIEW: 'users:view', // see the Users section + user details
  USERS_MANAGE: 'users:manage', // create / ban / deactivate users
  ROLES_MANAGE: 'roles:manage', // assign roles (e.g. make someone an admin) — most sensitive
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
// Keep in sync with the Prisma `Role` enum. To add a role: add it here, add its
// permission set to ROLE_PERMISSIONS, add it to the Prisma enum (+ migration),
// and it becomes assignable from the Users UI.
export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// ---------------------------------------------------------------------------
// Role → permissions
// ---------------------------------------------------------------------------
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Owner: everything, including managing users and assigning roles.
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,

  // Full operational access to the whole dashboard, and can view users,
  // but cannot create users or change roles (that stays with SUPER_ADMIN).
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.ANALYTICS,
    PERMISSIONS.PRODUCTS,
    PERMISSIONS.CATEGORIES,
    PERMISSIONS.COLLECTIONS,
    PERMISSIONS.BRANDS,
    PERMISSIONS.TAGS,
    PERMISSIONS.ORDERS,
    PERMISSIONS.SHIPPING,
    PERMISSIONS.INVENTORY,
    PERMISSIONS.SEARCH,
    PERMISSIONS.USERS_VIEW,
  ],

  // Storefront customer — no admin access at all.
  [ROLES.CUSTOMER]: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function getPermissions(role?: string | null): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  return getPermissions(role).includes(permission);
}

/** True if the role can access the admin panel at all (has ≥1 permission). */
export function hasAdminAccess(role?: string | null): boolean {
  return getPermissions(role).length > 0;
}

// ---------------------------------------------------------------------------
// Route → permission mapping (for middleware, layout, and per-section guards)
// ---------------------------------------------------------------------------
// Ordered most-specific first so permissionForPath() matches correctly; the
// bare '/dashboard' overview entry is last.
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: '/dashboard/analytics', permission: PERMISSIONS.ANALYTICS },
  { prefix: '/dashboard/products', permission: PERMISSIONS.PRODUCTS },
  { prefix: '/dashboard/categories', permission: PERMISSIONS.CATEGORIES },
  { prefix: '/dashboard/collections', permission: PERMISSIONS.COLLECTIONS },
  { prefix: '/dashboard/brands', permission: PERMISSIONS.BRANDS },
  { prefix: '/dashboard/tags', permission: PERMISSIONS.TAGS },
  { prefix: '/dashboard/orders', permission: PERMISSIONS.ORDERS },
  { prefix: '/dashboard/shipping', permission: PERMISSIONS.SHIPPING },
  { prefix: '/dashboard/inventory', permission: PERMISSIONS.INVENTORY },
  { prefix: '/dashboard/search', permission: PERMISSIONS.SEARCH },
  { prefix: '/dashboard/users', permission: PERMISSIONS.USERS_VIEW },
  { prefix: '/dashboard', permission: PERMISSIONS.DASHBOARD },
];

/** Resolve the permission required to view a given dashboard path. */
export function permissionForPath(path: string): Permission | null {
  const match = ROUTE_PERMISSIONS.find(
    (r) => path === r.prefix || path.startsWith(r.prefix + '/')
  );
  return match ? match.permission : null;
}
