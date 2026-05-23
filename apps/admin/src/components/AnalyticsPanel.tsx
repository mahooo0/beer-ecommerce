'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

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
  color?: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, color = 'bg-blue-50', subtitle }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {icon && <div className={`rounded-md ${color} p-2 flex-shrink-0`}>{icon}</div>}
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
  color?: string;
}

export function MiniBar({ label, value, max, color = 'bg-blue-500' }: MiniBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 truncate text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-medium">{value}</span>
    </div>
  );
}
