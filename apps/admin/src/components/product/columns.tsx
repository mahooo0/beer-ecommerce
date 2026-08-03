'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@repo/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { computeProductCompleteness } from '@/lib/product-completeness';
import { CompletenessBar } from './completeness-bar';
import { ProductStatusBadge } from './product-status-badge';

// Prices are integer cents; the catalog shows a plain hryvnia amount.
const formatPrice = (cents: number) =>
  `${(cents / 100).toFixed(2)} ₴`;

// Admin-only completeness annotations the list endpoint may attach per row
// (categoryAttrCount / productAttrFilledCount). When absent the helper simply
// skips the non-scored attribute slot, so the six scored fields still line up
// with the server's /completeness-stats bucketing.
type ProductRow = Product & {
  category?: { id: string; name: string } | null;
  categoryAttrCount?: number;
  productAttrFilledCount?: number;
};

function computeRowCompleteness(row: ProductRow) {
  return computeProductCompleteness(row, {
    attributesNeeded: row.categoryAttrCount ?? 0,
    attributesFilled: row.productAttrFilledCount ?? 0,
  });
}

export const columns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Обрати всі"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Обрати рядок"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'image',
    header: 'Зображення',
    cell: ({ row }) => {
      const product = row.original;
      const src = product.images?.[0];
      return src ? (
        <Image
          src={src}
          alt={product.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg object-cover"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-muted" />
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Назва',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <Link
          href={`/dashboard/products/${product.id}`}
          className="block max-w-[280px] font-medium text-foreground hover:underline"
        >
          <span className="line-clamp-2 break-words">{product.name}</span>
          <span className="block text-xs text-muted-foreground">{product.slug}</span>
        </Link>
      );
    },
  },
  {
    id: 'category',
    header: 'Категорія',
    cell: ({ row }) => {
      const category = (row.original as ProductRow).category;
      return category?.name ? (
        <span className="text-sm text-muted-foreground">{category.name}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'price',
    header: 'Ціна',
    cell: ({ row }) => {
      const { price, salePrice } = row.original;
      // salePrice (discount, "цена со скидкой") is the active price when set;
      // the regular `price` renders struck-through beside it.
      if (salePrice != null) {
        return (
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="font-medium text-green-600">{formatPrice(salePrice)}</span>
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(price)}
            </span>
          </div>
        );
      }
      return <span className="font-medium">{formatPrice(price)}</span>;
    },
  },
  {
    id: 'availability',
    header: 'Наявність',
    cell: ({ row }) => {
      const { trackQuantity, quantity, isAvailable } = row.original;
      // Dual-mode stock: in "кількість" mode show the numeric stock (coloured by
      // whether any is left); otherwise fall back to a manual in/out badge.
      if (trackQuantity) {
        return (
          <Badge
            variant="secondary"
            className={
              quantity > 0
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }
          >
            {quantity} шт
          </Badge>
        );
      }
      return (
        <Badge
          variant="secondary"
          className={
            isAvailable
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }
        >
          {isAvailable ? 'В наявності' : 'Немає'}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    id: 'completeness',
    accessorFn: (row) => computeRowCompleteness(row as ProductRow).percent,
    header: 'Заповнення',
    cell: ({ row }) => (
      <CompletenessBar
        data={computeRowCompleteness(row.original as ProductRow)}
        showPercent
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ getValue }) => {
      const status = getValue() as 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      return <ProductStatusBadge status={status} />;
    },
    filterFn: 'equals',
  },
  {
    id: 'actions',
    header: 'Дії',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/products/${row.original.id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Редагувати
        </Link>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
