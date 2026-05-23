'use client';

import React, { useState } from 'react';
import { useSiteTour } from './tour-provider';

export function TourButton() {
  const { startTour, stopTour, isTourActive, isTourCompleted, resetTour } = useSiteTour();
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    if (isTourActive) {
      stopTour();
    } else if (isTourCompleted) {
      setShowMenu(!showMenu);
    } else {
      startTour();
    }
  };

  const handleRestart = () => {
    resetTour();
    setShowMenu(false);
    // Small delay to allow state reset
    setTimeout(() => startTour(), 100);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      {/* Menu popup */}
      {showMenu && !isTourActive && (
        <div className="mb-3 w-56 border border-neutral-200 bg-white p-4 shadow-xl">
          <p className="text-xs font-semibold tracking-wider text-neutral-900 uppercase">Site Guide</p>
          <p className="mt-1 text-xs text-neutral-500">
            You&apos;ve completed the tour. Would you like to take it again?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRestart}
              className="flex-1 bg-neutral-900 py-2 text-[10px] font-medium tracking-wider text-white uppercase transition hover:bg-neutral-800"
            >
              Restart
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="flex-1 border border-neutral-300 py-2 text-[10px] font-medium tracking-wider text-neutral-600 uppercase transition hover:bg-neutral-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Float button */}
      <button
        onClick={handleClick}
        className={`group flex items-center gap-2 px-4 py-2.5 shadow-lg transition ${
          isTourActive
            ? 'bg-neutral-700 text-white hover:bg-neutral-600'
            : 'bg-neutral-900 text-white hover:bg-neutral-800'
        }`}
        aria-label={isTourActive ? 'Stop tour' : 'Start site tour'}
      >
        {isTourActive ? (
          <>
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs font-medium tracking-wider uppercase">Stop Tour</span>
          </>
        ) : (
          <>
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <span className="text-xs font-medium tracking-wider uppercase">
              {isTourCompleted ? 'Site Guide' : 'Take a Tour'}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
