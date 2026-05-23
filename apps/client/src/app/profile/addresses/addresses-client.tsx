'use client';

import { useState } from 'react';
import { AddressForm } from './address-form';
import { deleteAddress, setDefaultAddress } from './actions';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  street2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string | null;
  label?: string | null;
  isDefault: boolean;
}

interface AddressesClientProps {
  initialAddresses: Address[];
}

export function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addresses = initialAddresses;

  async function handleDelete(addressId: string) {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await deleteAddress(addressId);
      // Page will revalidate automatically
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  }

  async function handleSetDefault(addressId: string) {
    try {
      await setDefaultAddress(addressId);
      // Page will revalidate automatically
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Address Button */}
      {!showAddForm && !editingId && (
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-md bg-brand-solid px-4 py-2 font-medium text-white hover:bg-brand-solid_hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          Add New Address
        </button>
      )}

      {/* Add Address Form */}
      {showAddForm && (
        <div className="rounded-lg border border-border-secondary bg-primary p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Address</h2>
          <AddressForm onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="rounded-lg border border-border-secondary bg-primary p-12 text-center shadow-sm">
          <p className="text-tertiary">No saved addresses yet.</p>
          <p className="mt-2 text-sm text-tertiary">Add your first address to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-border-secondary bg-primary p-6 shadow-sm"
            >
              {editingId === address.id ? (
                <div>
                  <h2 className="mb-4 text-xl font-semibold">Edit Address</h2>
                  <AddressForm address={address} onCancel={() => setEditingId(null)} />
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      {address.label && (
                        <div className="mb-2 inline-block rounded bg-secondary_subtle px-2 py-1 text-xs font-medium text-secondary">
                          {address.label}
                        </div>
                      )}
                      {address.isDefault && (
                        <div className="mb-2 ml-2 inline-block rounded bg-utility-brand-50 px-2 py-1 text-xs font-medium text-utility-brand-700">
                          Default
                        </div>
                      )}
                      <p className="font-medium">
                        {address.firstName} {address.lastName}
                      </p>
                      <p className="text-sm text-tertiary">{address.street}</p>
                      {address.street2 && <p className="text-sm text-tertiary">{address.street2}</p>}
                      <p className="text-sm text-tertiary">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-sm text-tertiary">{address.country}</p>
                      {address.phone && <p className="mt-2 text-sm text-tertiary">{address.phone}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingId(address.id)}
                      className="text-sm text-brand-secondary hover:text-brand-secondary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-sm text-error-primary hover:text-utility-error-700 hover:underline"
                    >
                      Delete
                    </button>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-sm text-utility-success-700 hover:text-utility-success-700 hover:underline"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
