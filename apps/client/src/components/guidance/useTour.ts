'use client';

import { useCallback, useState } from 'react';
import { driver } from 'driver.js';
import type { DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_PREFIX = 'tour_completed_';

export function useTour(tourId: string, steps: DriveStep[]) {
  const storageKey = STORAGE_PREFIX + tourId;

  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storageKey) === 'true';
  });

  const startTour = useCallback(() => {
    if (localStorage.getItem(storageKey) === 'true') return;

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      showButtons: ['previous', 'next', 'close'],
      doneBtnText: 'Got it!',
      steps,
      onDestroyed: () => {
        localStorage.setItem(storageKey, 'true');
        setIsCompleted(true);
      },
    });

    driverObj.drive();
  }, [storageKey, steps]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setIsCompleted(false);
  }, [storageKey]);

  return { startTour, isCompleted, resetTour };
}
