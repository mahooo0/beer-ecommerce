'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberRangeInputProps {
  value: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number }) => void;
  prefix?: string;
  placeholderMin?: string;
  placeholderMax?: string;
  className?: string;
  debounceMs?: number;
}

export function NumberRangeInput({
  value,
  onChange,
  prefix,
  placeholderMin = 'Min',
  placeholderMax = 'Max',
  className,
  debounceMs = 300,
}: NumberRangeInputProps) {
  const [localMin, setLocalMin] = React.useState(value.min?.toString() ?? '');
  const [localMax, setLocalMax] = React.useState(value.max?.toString() ?? '');
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    setLocalMin(value.min?.toString() ?? '');
    setLocalMax(value.max?.toString() ?? '');
  }, [value.min, value.max]);

  const emitChange = (min: string, max: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange({
        min: min ? Number(min) : undefined,
        max: max ? Number(max) : undefined,
      });
    }, debounceMs);
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={localMin}
          onChange={(e) => {
            setLocalMin(e.target.value);
            emitChange(e.target.value, localMax);
          }}
          placeholder={placeholderMin}
          className={cn('h-9 w-[100px]', prefix && 'pl-5')}
        />
      </div>
      <span className="text-xs text-muted-foreground">–</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={localMax}
          onChange={(e) => {
            setLocalMax(e.target.value);
            emitChange(localMin, e.target.value);
          }}
          placeholder={placeholderMax}
          className={cn('h-9 w-[100px]', prefix && 'pl-5')}
        />
      </div>
    </div>
  );
}
