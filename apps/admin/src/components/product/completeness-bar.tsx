'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProductCompleteness } from '@/lib/product-completeness';

const SEGMENTS = 12;

function tierColors(percent: number) {
  if (percent >= 80) {
    return { fill: 'bg-green-500', empty: 'bg-green-500/20', text: 'text-green-700' };
  }
  if (percent >= 40) {
    return { fill: 'bg-yellow-500', empty: 'bg-yellow-500/20', text: 'text-yellow-700' };
  }
  return { fill: 'bg-red-500', empty: 'bg-red-500/20', text: 'text-red-700' };
}

/**
 * Segmented completeness bar (Health-style). Renders SEGMENTS thin pills; the
 * first N are coloured per the tier, the rest are faded. Wrapped in a tooltip
 * that shows the percent and the list of still-missing fields.
 *
 * Ported from 4fr-ecom apps/admin/src/components/products/completeness-bar.tsx.
 * The taranka Product model is flat (no variants); the caller feeds a
 * ProductCompleteness from lib/product-completeness.ts (server-aligned score).
 */
export function CompletenessBar({
  data,
  className,
  showPercent = false,
}: {
  data: ProductCompleteness;
  className?: string;
  showPercent?: boolean;
}) {
  const { t } = useTranslation();
  const { percent, missing } = data;
  const filledSegments = Math.round((percent / 100) * SEGMENTS);
  const { fill, empty, text } = tierColors(percent);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-2', className)}>
          <div className="flex items-center gap-[2px]">
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-4 w-[3px] rounded-[1px]',
                  i < filledSegments ? fill : empty,
                )}
              />
            ))}
          </div>
          {showPercent && (
            <span className={cn('text-xs font-medium tabular-nums', text)}>
              {percent}%
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        <div className="space-y-1.5">
          <div className="font-medium">{t('productForm.completeness.filled', { percent })}</div>
          {missing.length === 0 ? (
            <div className="text-[11px] opacity-80">{t('productForm.completeness.allFilled')}</div>
          ) : (
            <ul className="text-[11px] space-y-0.5 list-disc pl-3 opacity-90">
              {missing.map((f) => (
                <li key={f.key}>{f.label}</li>
              ))}
            </ul>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
