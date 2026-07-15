'use client';

import { useState, useTransition } from 'react';
import { setUserRole } from '../actions';

type RoleFormProps = {
  userId: string;
  currentRole: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
};

export function RoleForm({ userId, currentRole }: RoleFormProps) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        await setUserRole(userId, role);
        setMessage({ type: 'success', text: 'Role updated successfully' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to update role' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          User Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          disabled={isPending}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || role === currentRole}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isPending ? 'Updating...' : 'Update Role'}
      </button>
    </form>
  );
}
