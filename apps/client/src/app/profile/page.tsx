import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getProfile, updateProfile } from './actions';

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const profile = await getProfile();
  if (!profile) {
    redirect('/sign-in');
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">My Profile</h1>

      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="rounded-lg border border-border-secondary bg-primary p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Profile Picture</h2>
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Profile avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-quaternary text-2xl font-semibold text-white">
                {profile.firstName[0]?.toUpperCase() || ''}
                {profile.lastName[0]?.toUpperCase() || ''}
              </div>
            )}
            <div>
              <p className="text-sm text-tertiary">
                To change your avatar, click your profile picture in the header and select "Manage
                account"
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="rounded-lg border border-border-secondary bg-primary p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Personal Information</h2>
          <form action={updateProfile} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-secondary">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                defaultValue={profile.firstName}
                required
                maxLength={50}
                className="w-full rounded-md border border-border-primary px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-secondary">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                defaultValue={profile.lastName}
                required
                maxLength={50}
                className="w-full rounded-md border border-border-primary px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-secondary">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                disabled
                className="w-full rounded-md border border-border-primary bg-secondary_subtle px-3 py-2 text-tertiary"
              />
              <p className="mt-1 text-xs text-tertiary">
                Email is managed by your account settings
              </p>
            </div>

            <button
              type="submit"
              className="rounded-md bg-brand-solid px-4 py-2 font-medium text-white hover:bg-brand-solid_hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Address Management Link */}
        <div className="rounded-lg border border-border-secondary bg-primary p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Saved Addresses</h2>
          <p className="mb-4 text-sm text-tertiary">Manage your delivery and billing addresses</p>
          <a
            href="/profile/addresses"
            className="inline-block rounded-md bg-secondary_subtle px-4 py-2 text-sm font-medium text-secondary hover:bg-primary_hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Manage Addresses
          </a>
        </div>
      </div>
    </div>
  );
}
