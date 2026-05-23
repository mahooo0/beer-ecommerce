'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormData } from '@repo/types';

interface SimpleFieldsProps {
  form: UseFormReturn<ProductFormData>;
}

export function SimpleFields({ form }: SimpleFieldsProps) {
  return (
    <div className="text-sm text-muted-foreground py-4">
      <p>Simple products use only the base fields above.</p>
      <p className="mt-2 text-xs text-muted-foreground">
        No additional type-specific configuration is required for simple products.
      </p>
    </div>
  );
}
