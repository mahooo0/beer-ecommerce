'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CategoryAttribute, AttributeType } from '@repo/types';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const buildAttributeFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('categoryPage.attributes.errors.nameRequired')),
    key: z
      .string()
      .regex(/^[a-z_][a-z0-9_]*$/, t('categoryPage.attributes.errors.keyInvalid')),
    type: z.enum(['SELECT', 'RANGE', 'BOOLEAN', 'TEXT']),
    values: z.string().optional(), // Comma-separated or newline-separated
    unit: z.string().optional(),
    isFilterable: z.boolean(),
    isRequired: z.boolean(),
  });

type AttributeFormData = z.infer<ReturnType<typeof buildAttributeFormSchema>>;

interface AttributeManagerProps {
  categoryId: string;
  attributes: CategoryAttribute[];
}

export default function AttributeManager({
  categoryId,
  attributes,
}: AttributeManagerProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

  const attributeFormSchema = useMemo(() => buildAttributeFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      name: '',
      key: '',
      type: 'SELECT',
      values: '',
      unit: '',
      isFilterable: true,
      isRequired: false,
    },
  });

  const name = watch('name');
  const type = watch('type');

  // Auto-generate key from name (only if key hasn't been manually edited)
  useEffect(() => {
    if (name && !keyManuallyEdited && !editingAttribute) {
      const autoKey = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setValue('key', autoKey);
    }
  }, [name, keyManuallyEdited, editingAttribute, setValue]);

  const handleEdit = (attr: CategoryAttribute) => {
    setEditingAttribute(attr);
    setShowForm(true);
    reset({
      name: attr.name,
      key: attr.key,
      type: attr.type,
      values: attr.values.join('\n'),
      unit: attr.unit || '',
      isFilterable: attr.isFilterable,
      isRequired: attr.isRequired,
    });
    setKeyManuallyEdited(true); // Prevent auto-generation when editing
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAttribute(null);
    setKeyManuallyEdited(false);
    reset({
      name: '',
      key: '',
      type: 'SELECT',
      values: '',
      unit: '',
      isFilterable: true,
      isRequired: false,
    });
    setError(null);
  };

  const onSubmit = async (data: AttributeFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError(t('categoryPage.toasts.notAuthenticated'));
        return;
      }

      // Parse values (split by newlines or commas)
      const valuesArray = data.values
        ? data.values.split(/[\n,]+/).map((v) => v.trim()).filter((v) => v)
        : [];

      const payload = {
        name: data.name,
        key: data.key,
        type: data.type,
        values: valuesArray,
        unit: data.unit || undefined,
        isFilterable: data.isFilterable,
        isRequired: data.isRequired,
      };

      if (editingAttribute) {
        // Update existing attribute
        await api.categories.updateAttribute(editingAttribute.id, payload as any, token);
      } else {
        // Create new attribute
        await api.categories.createAttribute(categoryId, payload as any, token);
      }

      // Refresh and close form
      router.refresh();
      handleCancelForm();
    } catch (err: any) {
      setError(err.message || t('categoryPage.attributes.toasts.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (attributeId: string) => {
    if (!confirm(t('categoryPage.attributes.confirm.delete'))) {
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        alert(t('categoryPage.toasts.notAuthenticated'));
        return;
      }

      await api.categories.deleteAttribute(attributeId, token);
      router.refresh();
    } catch (err: any) {
      alert(err.message || t('categoryPage.attributes.toasts.deleteFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Show values and unit fields based on type
  const showValuesField = type === 'SELECT';
  const showUnitField = type === 'SELECT' || type === 'RANGE';

  return (
    <div className="space-y-4">
      {/* Existing attributes table */}
      {attributes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('categoryPage.attributes.table.columns.name')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('categoryPage.attributes.table.columns.key')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('categoryPage.attributes.table.columns.type')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('categoryPage.attributes.table.columns.values')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('categoryPage.attributes.table.columns.filterable')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('categoryPage.attributes.table.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attributes.map((attr) => (
                <tr key={attr.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{attr.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 font-mono">{attr.key}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{attr.type}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {attr.values.length > 0 ? (
                      <span className="text-xs">{attr.values.slice(0, 3).join(', ')}...</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {attr.isFilterable ? (
                      <span className="text-green-600">{t('categoryPage.attributes.yes')}</span>
                    ) : (
                      <span className="text-gray-400">{t('categoryPage.attributes.no')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(attr)}
                      className="text-blue-600 hover:underline"
                    >
                      {t('categoryPage.actions.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(attr.id)}
                      className="text-red-600 hover:underline"
                      disabled={isLoading}
                    >
                      {t('categoryPage.actions.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('categoryPage.attributes.empty')}</p>
      )}

      {/* Add Attribute button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          {t('categoryPage.attributes.add')}
        </button>
      )}

      {/* Attribute form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="border p-4 rounded bg-gray-50 space-y-3">
          <h3 className="font-semibold text-lg mb-2">
            {editingAttribute
              ? t('categoryPage.attributes.form.editTitle')
              : t('categoryPage.attributes.form.addTitle')}
          </h3>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('categoryPage.attributes.form.name')} *
              </label>
              <input
                {...register('name')}
                id="name"
                type="text"
                placeholder={t('categoryPage.attributes.form.namePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{String(errors.name.message)}</p>
              )}
            </div>

            {/* Key */}
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                {t('categoryPage.attributes.form.key')} *
              </label>
              <input
                {...register('key')}
                id="key"
                type="text"
                placeholder={t('categoryPage.attributes.form.keyPlaceholder')}
                onChange={(e) => {
                  setKeyManuallyEdited(true);
                  register('key').onChange(e);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              {errors.key && (
                <p className="text-xs text-red-600 mt-1">{String(errors.key.message)}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                {t('categoryPage.attributes.form.type')} *
              </label>
              <select
                {...register('type')}
                id="type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SELECT">{t('categoryPage.attributes.types.select')}</option>
                <option value="RANGE">{t('categoryPage.attributes.types.range')}</option>
                <option value="BOOLEAN">{t('categoryPage.attributes.types.boolean')}</option>
                <option value="TEXT">{t('categoryPage.attributes.types.text')}</option>
              </select>
              {errors.type && (
                <p className="text-xs text-red-600 mt-1">{String(errors.type.message)}</p>
              )}
            </div>

            {/* Unit (conditional) */}
            {showUnitField && (
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('categoryPage.attributes.form.unit')}
                </label>
                <input
                  {...register('unit')}
                  id="unit"
                  type="text"
                  placeholder={t('categoryPage.attributes.form.unitPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.unit && (
                  <p className="text-xs text-red-600 mt-1">{String(errors.unit.message)}</p>
                )}
              </div>
            )}
          </div>

          {/* Values (conditional) */}
          {showValuesField && (
            <div>
              <label htmlFor="values" className="block text-sm font-medium text-gray-700 mb-1">
                {t('categoryPage.attributes.form.values')}
              </label>
              <textarea
                {...register('values')}
                id="values"
                rows={4}
                placeholder="13.3&#10;15.6&#10;17.3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              {errors.values && (
                <p className="text-xs text-red-600 mt-1">{String(errors.values.message)}</p>
              )}
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                {...register('isFilterable')}
                type="checkbox"
                className="rounded"
              />
              <span className="text-sm text-gray-700">{t('categoryPage.attributes.form.filterable')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                {...register('isRequired')}
                type="checkbox"
                className="rounded"
              />
              <span className="text-sm text-gray-700">{t('categoryPage.attributes.form.required')}</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading
                ? t('categoryPage.attributes.form.saving')
                : editingAttribute
                  ? t('categoryPage.attributes.form.update')
                  : t('categoryPage.attributes.form.add')}
            </button>
            <button
              type="button"
              onClick={handleCancelForm}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {t('categoryPage.attributes.form.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
