'use client';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { LoyaltyTier } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const buildSchema = () =>
  z.object({
    // Threshold entered in złoty (major units); converted to cents on submit.
    minSpendZl: z.number().min(0),
    percent: z.number().int().min(0).max(100),
    active: z.boolean(),
    position: z.number().int().min(0),
  });

type FormData = z.infer<ReturnType<typeof buildSchema>>;

interface LoyaltyTierFormProps {
  tier?: LoyaltyTier;
  onSuccess: () => void;
}

export default function LoyaltyTierForm({ tier, onSuccess }: LoyaltyTierFormProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => buildSchema(), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      minSpendZl: tier ? tier.minSpendCents / 100 : 0,
      percent: tier?.percent ?? 0,
      active: tier?.active ?? true,
      position: tier?.position ?? 0,
    },
  });

  const active = watch('active');

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const token = await getToken();
      if (!token) throw new Error(t('loyaltyTiers.errors.notAuth'));

      const payload = {
        minSpendCents: Math.round(data.minSpendZl * 100),
        percent: data.percent,
        active: data.active,
        position: data.position,
      };

      if (tier) {
        await api.loyaltyTiers.update(tier.id, payload, token);
      } else {
        await api.loyaltyTiers.create(payload, token);
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loyaltyTiers.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="minSpendZl" className="mb-1">
            {t('loyaltyTiers.form.minSpend')} <span className="text-red-500">*</span>
          </Label>
          <Input id="minSpendZl" type="number" min={0} step="0.01" {...register('minSpendZl', { valueAsNumber: true })} />
          {errors.minSpendZl && <p className="mt-1 text-sm text-red-600">{String(errors.minSpendZl.message)}</p>}
        </div>
        <div>
          <Label htmlFor="percent" className="mb-1">
            {t('loyaltyTiers.form.percent')} <span className="text-red-500">*</span>
          </Label>
          <Input id="percent" type="number" min={0} max={100} {...register('percent', { valueAsNumber: true })} />
          {errors.percent && <p className="mt-1 text-sm text-red-600">{String(errors.percent.message)}</p>}
        </div>
      </div>

      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <Switch id="active" checked={active} onCheckedChange={(v) => setValue('active', v)} />
          <Label htmlFor="active">{t('loyaltyTiers.form.active')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="position">{t('loyaltyTiers.form.position')}</Label>
          <Input id="position" type="number" min={0} className="w-24" {...register('position', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('loyaltyTiers.form.saving')
            : tier
              ? t('loyaltyTiers.form.update')
              : t('loyaltyTiers.form.create')}
        </Button>
      </div>
    </form>
  );
}
