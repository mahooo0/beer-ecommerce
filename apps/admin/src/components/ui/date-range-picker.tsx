'use client';

import * as React from 'react';
import { format, subDays, startOfMonth, startOfDay, endOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
  placeholder?: string;
  className?: string;
}

const presets = [
  { label: 'Today', range: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last 7 days', range: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', range: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'This month', range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick date range',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateRange: DateRange | undefined =
    value.from || value.to
      ? {
          from: value.from ? new Date(value.from) : undefined,
          to: value.to ? new Date(value.to) : undefined,
        }
      : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    onChange({
      from: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      to: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
    });
  };

  const handlePreset = (preset: (typeof presets)[number]) => {
    const { from, to } = preset.range();
    onChange({
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    });
  };

  const displayValue =
    value.from && value.to
      ? `${format(new Date(value.from), 'MMM d')} - ${format(new Date(value.to), 'MMM d, yyyy')}`
      : value.from
        ? `From ${format(new Date(value.from), 'MMM d, yyyy')}`
        : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 w-[250px] justify-start font-normal',
            !value.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r p-2 space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-7"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
            {(value.from || value.to) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-7 text-destructive"
                onClick={() => onChange({ from: undefined, to: undefined })}
              >
                Clear
              </Button>
            )}
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            defaultMonth={dateRange?.from || new Date()}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
