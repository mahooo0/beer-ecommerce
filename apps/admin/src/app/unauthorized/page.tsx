import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3002';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-gray-900">Access Denied</h1>

        <p className="mb-6 text-gray-600">
          You do not have permission to access the admin panel. Only administrators can access this area.
        </p>

        <div className="space-y-3">
          <Link
            href={clientUrl}
            className="block w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Return to Store
          </Link>

          <SignOutButton>
            <button className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Sign out and try a different account
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
