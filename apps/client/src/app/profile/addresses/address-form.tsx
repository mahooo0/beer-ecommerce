'use client';

import { createAddress, updateAddress } from './actions';
import { useState } from 'react';

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

interface AddressFormProps {
  address?: Address;
  onCancel: () => void;
}

const inputClass = "w-full rounded-md border border-border-primary px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function AddressForm({ address, onCancel }: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      if (address) {
        await updateAddress(address.id, formData);
      } else {
        await createAddress(formData);
      }
      onCancel(); // Close form on success
      // Page will revalidate automatically due to revalidatePath
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-secondary">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            defaultValue={address?.firstName || ''}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-secondary">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            defaultValue={address?.lastName || ''}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="street" className="mb-1 block text-sm font-medium text-secondary">
          Street Address *
        </label>
        <input
          type="text"
          id="street"
          name="street"
          defaultValue={address?.street || ''}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="street2" className="mb-1 block text-sm font-medium text-secondary">
          Apartment, Suite, etc. (Optional)
        </label>
        <input
          type="text"
          id="street2"
          name="street2"
          defaultValue={address?.street2 || ''}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-secondary">
            City *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            defaultValue={address?.city || ''}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="state" className="mb-1 block text-sm font-medium text-secondary">
            State *
          </label>
          <input
            type="text"
            id="state"
            name="state"
            defaultValue={address?.state || ''}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="zipCode" className="mb-1 block text-sm font-medium text-secondary">
            Zip Code *
          </label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            defaultValue={address?.zipCode || ''}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium text-secondary">
            Country *
          </label>
          <input
            type="text"
            id="country"
            name="country"
            defaultValue={address?.country || ''}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-secondary">
          Phone (Optional)
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          defaultValue={address?.phone || ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="label" className="mb-1 block text-sm font-medium text-secondary">
          Label (Optional)
        </label>
        <input
          type="text"
          id="label"
          name="label"
          defaultValue={address?.label || ''}
          placeholder="Home, Work, etc."
          className={inputClass}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          value="true"
          defaultChecked={address?.isDefault || false}
          className="h-4 w-4 rounded border-border-primary text-brand-solid focus:ring-brand"
        />
        <label htmlFor="isDefault" className="ml-2 text-sm text-secondary">
          Set as default address
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-solid px-4 py-2 font-medium text-white hover:bg-brand-solid_hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md bg-secondary_subtle px-4 py-2 font-medium text-secondary hover:bg-primary_hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
