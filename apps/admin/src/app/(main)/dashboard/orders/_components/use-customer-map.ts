'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

export interface CustomerLite {
  id: string; // Clerk userId
  name: string;
  avatar: string | null;
  email: string;
}

/**
 * Resolves order `userId`s (Clerk ids) to a light customer profile (name +
 * Clerk avatar) so order tables/cards/detail can render the real user avatar
 * and link through to the customer page. One users fetch, shared per screen.
 */
export function useCustomerMap() {
  const { getToken } = useAuth();
  const [map, setMap] = useState<Map<string, CustomerLite>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = (await getToken()) || undefined;
        const res = await api.users.getAll({ limit: 500, token });
        const m = new Map<string, CustomerLite>();
        for (const u of res.data || []) {
          m.set(u.id, {
            id: u.id,
            name: `${u.firstName} ${u.lastName}`.trim() || u.email,
            avatar: u.avatar,
            email: u.email,
          });
        }
        if (!cancelled) setMap(m);
      } catch {
        // Non-critical enrichment — the order UI still works without avatars.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return map;
}
