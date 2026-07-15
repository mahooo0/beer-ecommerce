import { getUserDetail } from '../actions';
import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RoleForm } from './role-form';
import { StatusToggle } from './status-toggle';

type Params = Promise<{
  id: string;
}>;

export default async function UserDetailPage({ params }: { params: Params }) {
  await requireAdmin();

  const { id } = await params;
  const user = await getUserDetail(id);

  if (!user) {
    notFound();
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/users"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Users
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">User Information</h2>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    className="h-24 w-24 rounded-full"
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl font-medium text-gray-600">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                  {user.phone && (
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{user.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {user.lastLoginAt && (
                    <div>
                      <p className="text-gray-500">Last Login</p>
                      <p className="font-medium text-gray-900">
                        {new Date(user.lastLoginAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Addresses</h2>
            {user.addresses.length > 0 ? (
              <div className="space-y-4">
                {user.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {address.firstName} {address.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{address.street}</p>
                        {address.street2 && (
                          <p className="text-sm text-gray-600">{address.street2}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                        {address.phone && (
                          <p className="text-sm text-gray-600">{address.phone}</p>
                        )}
                      </div>
                      {address.isDefault && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                    {address.label && (
                      <p className="mt-2 text-sm text-gray-500">{address.label}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No addresses added yet</p>
            )}
          </div>

          {/* Statistics Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Activity Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {user.addresses.length}
                </p>
                <p className="text-sm text-gray-500">Addresses</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{user._count.reviews}</p>
                <p className="text-sm text-gray-500">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{user._count.wishlists}</p>
                <p className="text-sm text-gray-500">Wishlists</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Role Management */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Role Management</h2>
            <RoleForm userId={user.id} currentRole={user.role} />
          </div>

          {/* Account Status */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Account Control</h2>
            <StatusToggle
              userId={user.id}
              isActive={user.isActive}
              isBanned={user.banned}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
