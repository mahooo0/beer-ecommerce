'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@repo/types';
import { ProductStatusBadge } from './product-status-badge';

const formatPrice = (cents: number) => '$' + (cents / 100).toFixed(2);
const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
const capitalizeProductType = (type: string) =>
  type.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const columns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const product = row.original;
      const firstImage = product.images?.[0];

      return (
        <Link
          href={`/products/${product.id}/edit`}
          className="flex items-center gap-3 hover:underline"
        >
          {firstImage && (
            <Image
              src={firstImage}
              alt={product.name}
              width={40}
              height={40}
              className="rounded object-cover"
            />
          )}
          <span className="font-medium">{product.name}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: 'productType',
    header: 'Type',
    cell: ({ getValue }) => {
      const type = getValue() as string;
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
          {capitalizeProductType(type)}
        </span>
      );
    },
    filterFn: 'equals',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      return <ProductStatusBadge status={status} />;
    },
    filterFn: 'equals',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => {
      const price = getValue() as number;
      return <span className="font-medium">{formatPrice(price)}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ getValue }) => {
      const date = getValue() as Date | string;
      return <span className="text-sm text-gray-600">{formatDate(date)}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/products/${product.id}/edit`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </Link>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
