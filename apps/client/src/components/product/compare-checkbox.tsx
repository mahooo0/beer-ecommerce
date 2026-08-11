'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompareStore } from '../../stores/compare-store';

interface CompareCheckboxProps {
  productId: string;
  name: string;
  imageUrl: string;
  slug: string;
}

export function CompareCheckbox({ productId, name, imageUrl, slug }: CompareCheckboxProps) {
  const { t } = useTranslation('shop');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCompareStore((s) => s.items);
  const toggleItem = useCompareStore((s) => s.toggleItem);

  const isChecked = mounted ? items.some((i) => i.productId === productId) : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleItem({ productId, name, imageUrl, slug });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <label
      onClick={handleClick}
      className="flex items-center gap-1 bg-primary bg-opacity-80 hover:bg-opacity-100 rounded px-1.5 py-1 shadow-sm cursor-pointer select-none transition-all duration-200"
      title={t('compare.add')}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="w-3 h-3 accent-brand-solid cursor-pointer"
        aria-label={t('compare.ariaCompareName', { name })}
      />
      <span className="text-xs text-tertiary font-medium">{t('compare.label')}</span>
    </label>
  );
}
