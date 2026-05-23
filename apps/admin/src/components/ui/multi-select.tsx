'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchable = true,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
    );
  };

  const triggerLabel =
    value.length === 0
      ? placeholder
      : `${value.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-9 w-[200px] justify-between font-normal', className)}
        >
          <span className="truncate">{triggerLabel}</span>
          {value.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="start">
        {searchable && (
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 h-8"
          />
        )}
        <ScrollArea className="max-h-[200px]">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No results.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    onCheckedChange={() => toggle(option.value)}
                  />
                  <span className="truncate">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full h-7 text-xs"
            onClick={() => onChange([])}
          >
            <X className="mr-1 h-3 w-3" /> Clear all
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
