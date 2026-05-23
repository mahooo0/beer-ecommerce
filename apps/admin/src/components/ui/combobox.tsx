'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const selectedOption = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-9 w-[200px] justify-between font-normal', className)}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="start">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8"
        />
        <ScrollArea className="max-h-[200px]">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No results.</p>
          ) : (
            <div className="space-y-0.5">
              {value && (
                <button
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  Clear selection
                </button>
              )}
              {filtered.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                    value === option.value && 'bg-accent'
                  )}
                  onClick={() => {
                    onChange(option.value === value ? '' : option.value);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="text-left">
                    <div className="truncate">{option.label}</div>
                    {option.description && (
                      <div className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
