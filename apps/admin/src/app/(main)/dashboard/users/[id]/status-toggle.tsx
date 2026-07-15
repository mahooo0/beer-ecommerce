'use client';

import { useState, useTransition } from 'react';
import { toggleUserStatus } from '../actions';

type StatusToggleProps = {
  userId: string;
  isActive: boolean;
  isBanned: boolean;
};

export function StatusToggle({ userId, isActive, isBanned }: StatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async () => {
    setMessage(null);

    startTransition(async () => {
      try {
        // If user is currently active, we want to ban them
        await toggleUserStatus(userId, isActive);
        setMessage({
          type: 'success',
          text: isActive ? 'User account disabled' : 'User account enabled',
        });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to update account status' });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Account Status</p>
          <p className="text-sm text-gray-500">
            Current status:{' '}
            <span className={isActive ? 'text-green-600' : 'text-red-600'}>
              {isActive ? 'Active' : 'Disabled'}
            </span>
          </p>
        </div>
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
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 ${
          isActive
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        }`}
      >
        {isPending ? 'Processing...' : isActive ? 'Disable Account' : 'Enable Account'}
      </button>
    </div>
  );
}
