'use client';

import { useTranslation } from 'react-i18next';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const { t } = useTranslation('shop');
  return (
    <div className="flex items-center border border-neutral-300">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`flex items-center justify-center p-2 transition ${
          view === 'grid'
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-400 hover:text-neutral-700'
        }`}
        aria-label={t('viewToggle.grid')}
        title={t('viewToggle.grid')}
      >
        <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex items-center justify-center p-2 transition ${
          view === 'list'
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-400 hover:text-neutral-700'
        }`}
        aria-label={t('viewToggle.list')}
        title={t('viewToggle.list')}
      >
        <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="14" height="4" rx="1" />
          <rect x="1" y="7" width="14" height="4" rx="1" />
          <rect x="1" y="13" width="14" height="2" rx="1" />
        </svg>
      </button>
    </div>
  );
}
