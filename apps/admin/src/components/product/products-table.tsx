'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import type { Product } from '@repo/types';
import { getColumns } from './columns';
import { api } from '@/lib/api';
import Link from 'next/link';
import { showError } from '@/lib/toast';

interface ProductsTableProps {
  data: Product[];
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  total: number;
}

export function ProductsTable({
  data,
  pageCount,
  pageIndex,
  pageSize,
  total,
}: ProductsTableProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchValue, setSearchValue] = useState('');

  const columns = useMemo(() => getColumns(t), [t]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount,
  });

  const handleSearch = (value: string) => {
    setSearchValue(value);
    table.getColumn('name')?.setFilterValue(value);
  };

  const handleStatusFilter = (value: string) => {
    table.getColumn('status')?.setFilterValue(value === 'ALL' ? '' : value);
  };

  const handleTypeFilter = (value: string) => {
    table.getColumn('productType')?.setFilterValue(value === 'ALL' ? '' : value);
  };

  const handleBulkUpdateStatus = async (status: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);

    if (ids.length === 0) {
      showError(t('products.toasts.selectToUpdate'));
      return;
    }

    if (!confirm(t('products.bulk.confirmUpdate', { count: ids.length, status }))) {
      return;
    }

    try {
      await api.products.bulkUpdateStatus(ids, status);
      router.refresh();
      setRowSelection({});
    } catch (error) {
      showError(t('products.toasts.updateFailed', { message: (error as Error).message }));
    }
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);

    if (ids.length === 0) {
      showError(t('products.toasts.selectToDelete'));
      return;
    }

    if (!confirm(t('products.bulk.confirmDelete', { count: ids.length }))) {
      return;
    }

    try {
      await api.products.bulkDelete(ids);
      router.refresh();
      setRowSelection({});
    } catch (error) {
      showError(t('products.toasts.deleteFailedDetail', { message: (error as Error).message }));
    }
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg shadow">
        {/* Search */}
        <input
          type="text"
          placeholder={t('products.table.searchPlaceholder')}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Status Filter */}
        <select
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">{t('products.filters.allStatuses')}</option>
          <option value="DRAFT">{t('products.status.DRAFT')}</option>
          <option value="ACTIVE">{t('products.status.ACTIVE')}</option>
          <option value="ARCHIVED">{t('products.status.ARCHIVED')}</option>
        </select>

        {/* Product Type Filter */}
        <select
          onChange={(e) => handleTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">{t('products.filters.allTypes')}</option>
          <option value="SIMPLE">{t('products.type.SIMPLE')}</option>
          <option value="VARIABLE">{t('products.type.VARIABLE')}</option>
          <option value="WEIGHTED">{t('products.type.WEIGHTED')}</option>
          <option value="DIGITAL">{t('products.type.DIGITAL')}</option>
          <option value="BUNDLED">{t('products.type.BUNDLED')}</option>
        </select>

        {/* Create Product Button */}
        <Link
          href="/products/new"
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('products.table.createProduct')}
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-2'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span>
                              {header.column.getIsSorted() === 'asc'
                                ? '↑'
                                : header.column.getIsSorted() === 'desc'
                                  ? '↓'
                                  : '↕'}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {t('products.table.empty')}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow">
        {/* Selected Count & Bulk Actions */}
        <div className="flex items-center gap-4">
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {t('products.bulk.selectedCount', { count: selectedCount })}
              </span>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'DELETE') {
                    handleBulkDelete();
                  } else if (value) {
                    handleBulkUpdateStatus(value);
                  }
                  e.target.value = '';
                }}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">{t('products.bulk.actions')}</option>
                <option value="ACTIVE">{t('products.bulk.setActive')}</option>
                <option value="DRAFT">{t('products.bulk.setDraft')}</option>
                <option value="ARCHIVED">{t('products.bulk.setArchived')}</option>
                <option value="DELETE">{t('products.bulk.deleteSelected')}</option>
              </select>
            </>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/products?page=${pageIndex}`)}
            disabled={pageIndex === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {t('products.pagination.previous')}
          </button>
          <span className="text-sm text-gray-600">
            {t('products.pagination.pageOf', { page: pageIndex, total: pageCount })}
          </span>
          <button
            onClick={() => router.push(`/products?page=${pageIndex + 2}`)}
            disabled={pageIndex >= pageCount}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {t('products.pagination.next')}
          </button>
          <select
            value={pageSize}
            onChange={(e) => router.push(`/products?page=1&limit=${e.target.value}`)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="10">{t('products.pagination.perPage', { count: 10 })}</option>
            <option value="25">{t('products.pagination.perPage', { count: 25 })}</option>
            <option value="50">{t('products.pagination.perPage', { count: 50 })}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
