'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface DateRangeFilterProps {
  value: { from?: string; to?: string };
  onChange: (value: { from: string; to: string }) => void;
}

const presets = [
  { labelKey: 'overview.dateRange.last7d', days: 7 },
  { labelKey: 'overview.dateRange.last30d', days: 30 },
  { labelKey: 'overview.dateRange.last90d', days: 90 },
  { labelKey: 'overview.dateRange.thisYear', days: -1 },
];

function getPresetRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = days === -1 ? new Date(to.getFullYear(), 0, 1) : new Date(Date.now() - days * 86400000);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return { from: fmt(from), to: fmt(to) };
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((preset) => (
        <Button
          key={preset.labelKey}
          variant="outline"
          size="sm"
          onClick={() => onChange(getPresetRange(preset.days))}
        >
          {t(preset.labelKey)}
        </Button>
      ))}
      <DateRangePicker
        value={value}
        onChange={(v) => {
          if (v.from && v.to) onChange({ from: v.from, to: v.to });
        }}
      />
    </div>
  );
}
