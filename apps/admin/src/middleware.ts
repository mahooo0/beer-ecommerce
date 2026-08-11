import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { hasAdminAccess, hasPermission, permissionForPath } from '@repo/types/rbac';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/unauthorized']);

export default clerkMiddleware(async (auth, req) => {
  // Public routes can be accessed without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  await auth.protect();

  // Role/permission gate
  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role as string | undefined;

  // Authenticated but not an admin (e.g. a storefront CUSTOMER) → unauthorized
  if (!hasAdminAccess(role)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // Section-level permission: block dashboard areas the role can't access
  const requiredPermission = permissionForPath(req.nextUrl.pathname);
  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    // Has admin access but not this section → send back to the overview
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
