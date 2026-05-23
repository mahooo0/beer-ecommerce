'use client';

import { useState } from 'react';

interface HelpTooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ content, side = 'top' }: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClass = {
    top: 'bottom-7',
    bottom: 'top-7',
    left: 'right-7',
    right: 'left-7',
  }[side];

  const arrowClass = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
  }[side];

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center hover:bg-gray-300 cursor-help"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
      >
        ?
      </button>
      {visible && (
        <div
          className={`z-50 absolute w-52 bg-gray-900 text-white text-xs rounded-md p-2.5 shadow-lg ${positionClass}`}
        >
          {content}
          <span
            className={`absolute border-4 ${arrowClass}`}
            aria-hidden="true"
          />
        </div>
      )}
    </span>
  );
}
