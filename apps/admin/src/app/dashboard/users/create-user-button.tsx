'use client';

import { useState } from 'react';
import { CreateUserForm } from './create-user-form';

export function CreateUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Add User
      </button>
      {open && <CreateUserForm onClose={() => setOpen(false)} />}
    </>
  );
}
