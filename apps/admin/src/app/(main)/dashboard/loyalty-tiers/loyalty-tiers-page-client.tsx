'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { LoyaltyTier } from '@repo/types';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { LoyaltyTierRowActions } from './loyalty-tier-row-actions';
import { LoyaltyTierSheet } from './loyalty-tier-sheet';

function zl(cents: number): string {
  return `${(cents / 100).toLocaleString('pl-PL')} zł`;
}

export function LoyaltyTiersPageClient({ tiers }: { tiers: LoyaltyTier[] }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyTier | null>(null);

  const handleSuccess = () => {
    setSheetOpen(false);
    setEditing(null);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('loyaltyTiers.title')}</h1>
        <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
          {t('loyaltyTiers.add')}
        </Button>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{t('loyaltyTiers.hint')}</p>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('loyaltyTiers.columns.minSpend')}</TableHead>
              <TableHead>{t('loyaltyTiers.columns.percent')}</TableHead>
              <TableHead>{t('loyaltyTiers.columns.position')}</TableHead>
              <TableHead>{t('loyaltyTiers.columns.status')}</TableHead>
              <TableHead>{t('loyaltyTiers.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell className="font-medium text-foreground">{zl(tier.minSpendCents)}</TableCell>
                <TableCell className="text-muted-foreground">{tier.percent}%</TableCell>
                <TableCell className="text-muted-foreground">{tier.position}</TableCell>
                <TableCell>
                  <span
                    className={
                      tier.active
                        ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
                        : 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                    }
                  >
                    {tier.active ? t('loyaltyTiers.status.active') : t('loyaltyTiers.status.inactive')}
                  </span>
                </TableCell>
                <TableCell>
                  <LoyaltyTierRowActions
                    tierId={tier.id}
                    onEdit={() => { setEditing(tier); setSheetOpen(true); }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tiers.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">{t('loyaltyTiers.empty')}</div>
        )}
      </div>

      <LoyaltyTierSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tier={editing}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
