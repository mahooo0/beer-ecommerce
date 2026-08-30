'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CARD_TONES, TONE_BAR, type CardTone } from '@/lib/chart-colors';

interface AnalyticsPanelProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AnalyticsPanel({ title = 'Analytics', children, defaultOpen = true }: AnalyticsPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {title}
            </span>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 py-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /**
   * Preferred: a colour tone. Paints a tinted gradient across the whole card
   * plus a matching icon tile, so a KPI row reads as a colourful set (and stays
   * legible in dark mode). Matches the analytics `stat-card.tsx` look.
   */
  tone?: CardTone;
  /**
   * @deprecated Legacy prop — a raw `bg-*` class for the icon tile only. Kept for
   * backward compatibility; ignored when `tone` is provided. Prefer `tone`.
   */
  color?: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, tone, color, subtitle }: StatCardProps) {
  const c = tone ? CARD_TONES[tone] : null;
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border p-3', c && `bg-linear-to-t ${c.grad} to-card`)}>
      {icon && (
        <div className={cn('rounded-md p-2 flex-shrink-0', c ? cn(c.iconBg, c.iconText) : (color ?? 'bg-blue-50'))}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

interface MiniBarProps {
  label: string;
  value: number;
  max: number;
  /** A `bg-*` fill class. Ignored when `tone` is set. */
  color?: string;
  /** Preferred: a colour tone → a vibrant fill from the shared palette. */
  tone?: CardTone;
}

export function MiniBar({ label, value, max, color, tone }: MiniBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const bar = tone ? TONE_BAR[tone] : (color ?? 'bg-blue-500');
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 truncate text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-medium">{value}</span>
    </div>
  );
}
