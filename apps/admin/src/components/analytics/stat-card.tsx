'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CARD_TONES, type CardTone } from '@/lib/chart-colors';

interface StatCardProps {
  tone?: CardTone;
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  /** Percent change vs previous period; null → no basis (shown as a neutral pill). */
  delta?: number | null;
  /** When true, a lower value is good (e.g. abandoned carts) → colour inverts. */
  invertDelta?: boolean;
}

/**
 * Tinted-gradient stat card. Each tone paints a different dim hue on the card
 * backdrop + icon tile, so a KPI row reads as a colourful set rather than a wall
 * of grey. Matches the dashboard template's `bg-linear-to-t from-…/… to-card`.
 */
export function StatCard({ tone = 'blue', label, value, sub, icon, delta, invertDelta }: StatCardProps) {
  const c = CARD_TONES[tone];
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const up = hasDelta && (delta as number) >= 0;
  const positive = hasDelta ? (invertDelta ? !up : up) : null;

  return (
    <Card className={cn('bg-linear-to-t to-card', c.grad)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        {icon && (
          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', c.iconBg, c.iconText)}>
            {icon}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-2xl font-semibold leading-none tracking-tight tabular-nums">{value}</div>
          {hasDelta && (
            <Badge
              variant="outline"
              className={cn(
                'gap-0.5 border-0',
                positive
                  ? 'bg-green-500/12 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                  : 'bg-destructive/12 text-destructive',
              )}
            >
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(delta as number).toFixed(1)}%
            </Badge>
          )}
        </div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
