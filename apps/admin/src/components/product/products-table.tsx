'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { columns } from './columns';
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchValue, setSearchValue] = useState('');

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
      showError('Please select products to update');
      return;
    }

    if (!confirm(`Update ${ids.length} products to ${status}?`)) {
      return;
    }

    try {
      await api.products.bulkUpdateStatus(ids, status);
      router.refresh();
      setRowSelection({});
    } catch (error) {
      showError('Failed to update products: ' + (error as Error).message);
    }
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => row.original.id);

    if (ids.length === 0) {
      showError('Please select products to delete');
      return;
    }

    if (!confirm(`Delete ${ids.length} products? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.products.bulkDelete(ids);
      router.refresh();
      setRowSelection({});
    } catch (error) {
      showError('Failed to delete products: ' + (error as Error).message);
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
          placeholder="Search products..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Status Filter */}
        <select
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* Product Type Filter */}
        <select
          onChange={(e) => handleTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="SIMPLE">Simple</option>
          <option value="VARIABLE">Variable</option>
          <option value="WEIGHTED">Weighted</option>
          <option value="DIGITAL">Digital</option>
          <option value="BUNDLED">Bundled</option>
        </select>

        {/* Create Product Button */}
        <Link
          href="/products/new"
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Product
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
                    No products found
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
                {selectedCount} selected
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
                <option value="">Bulk Actions</option>
                <option value="ACTIVE">Set to Active</option>
                <option value="DRAFT">Set to Draft</option>
                <option value="ARCHIVED">Set to Archived</option>
                <option value="DELETE">Delete Selected</option>
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
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pageIndex} of {pageCount}
          </span>
          <button
            onClick={() => router.push(`/products?page=${pageIndex + 2}`)}
            disabled={pageIndex >= pageCount}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => router.push(`/products?page=1&limit=${e.target.value}`)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
}
