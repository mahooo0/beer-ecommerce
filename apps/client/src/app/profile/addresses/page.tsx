import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getAddresses } from './actions';
import { AddressesClient } from './addresses-client';

export default async function AddressesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const addresses = await getAddresses();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Saved Addresses</h1>
        <a
          href="/profile"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Back to Profile
        </a>
      </div>

      <AddressesClient initialAddresses={addresses} />
    </div>
  );
}
