'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Wand2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { CategoryFilter } from '@repo/types';

import {
  useFiltersByCategory,
  useCreateFilter,
  useDeleteFilter,
  useCreateFilterOption,
  useDeleteFilterOption,
  useAutoPopulateFilter,
} from '@/lib/queries/filters';
import { toMachineName } from '@/lib/slug';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ConfirmDialog } from '@/components/category/confirm-dialog';

type FilterType = 'select' | 'multi-select' | 'range' | 'checkbox';
type FilterSource = 'manual' | 'manufacturer';

// One manual filter: header + collapsible option list with add/delete. The
// auto-populate wand only shows for manufacturer-source filters (the server
// rejects it otherwise).
function FilterItem({ filter, categoryId }: { filter: CategoryFilter; categoryId: string }) {
  const [open, setOpen] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');

  const deleteFilter = useDeleteFilter();
  const createOption = useCreateFilterOption();
  const deleteOption = useDeleteFilterOption();
  const autoPopulate = useAutoPopulateFilter();

  const handleDeleteFilter = async () => {
    try {
      await deleteFilter.mutateAsync({ id: filter.id, categoryId });
      showSuccess('Фільтр видалено');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося видалити фільтр');
    }
  };

  const handleAutoPopulate = async () => {
    try {
      const res = await autoPopulate.mutateAsync({ id: filter.id, categoryId });
      showSuccess(`Додано опцій: ${res?.count ?? 0}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося автозаповнити');
    }
  };

  const handleAddOption = async () => {
    const value = newOptionValue.trim();
    if (!value) return;
    try {
      await createOption.mutateAsync({
        categoryId,
        data: { filterId: filter.id, value },
      });
      setNewOptionValue('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося додати опцію');
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      await deleteOption.mutateAsync({ id: optionId, categoryId });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося видалити опцію');
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded border p-2">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {filter.displayName}
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {filter.options?.length ?? 0} опц.
            </Badge>
            {filter.source === 'manufacturer' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleAutoPopulate}
                disabled={autoPopulate.isPending}
                title="Автозаповнення з виробників"
              >
                <Wand2 className="h-3 w-3" />
              </Button>
            )}
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              }
              title="Видалити фільтр?"
              description={`Фільтр "${filter.displayName}" разом з ${filter.options?.length ?? 0} опціями буде видалено.`}
              confirmText="Видалити"
              variant="destructive"
              onConfirm={handleDeleteFilter}
            />
          </div>
        </div>

        <CollapsibleContent className="mt-2 space-y-1">
          {filter.options?.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs"
            >
              <span className="truncate">{opt.label || opt.value}</span>
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                }
                title="Видалити опцію?"
                description={`Опція "${opt.label || opt.value}" буде видалена.`}
                confirmText="Видалити"
                variant="destructive"
                onConfirm={() => handleDeleteOption(opt.id)}
              />
            </div>
          ))}

          <div className="mt-1 flex gap-1">
            <Input
              placeholder="Значення опції"
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAddOption();
                }
              }}
            />
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleAddOption}
              disabled={createOption.isPending}
            >
              Додати
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface FilterSectionProps {
  categoryId: string;
}

/**
 * The "Фільтри категорії" panel: manual (ad-hoc) category filters distinct from
 * structured attributes. Supports create (displayName → machine name, type,
 * source), delete, per-filter options and a manufacturer auto-populate button.
 * Ported from 4fr-ecom's FilterSection; adapted to taranka's react-query hooks,
 * the real filter type/source enums and cuid string ids.
 */
export function FilterSection({ categoryId }: FilterSectionProps) {
  const { data: filters } = useFiltersByCategory(categoryId);
  const createFilter = useCreateFilter();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFilter, setNewFilter] = useState<{
    displayName: string;
    type: FilterType;
    source: FilterSource;
  }>({ displayName: '', type: 'select', source: 'manual' });

  const handleAddFilter = async () => {
    const displayName = newFilter.displayName.trim();
    if (!displayName) return;
    try {
      await createFilter.mutateAsync({
        categoryId,
        data: {
          name: toMachineName(displayName),
          displayName,
          type: newFilter.type,
          source: newFilter.source,
        },
      });
      showSuccess('Фільтр створено');
      setNewFilter({ displayName: '', type: 'select', source: 'manual' });
      setShowAddForm(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося створити фільтр');
    }
  };

  return (
    <div className="space-y-3">
      {filters?.map((filter) => (
        <FilterItem key={filter.id} filter={filter} categoryId={categoryId} />
      ))}

      {!filters?.length && !showAddForm && (
        <p className="text-xs text-muted-foreground">
          Немає фільтрів для цієї категорії
        </p>
      )}

      {showAddForm ? (
        <div className="space-y-2 rounded border p-3">
          <Input
            placeholder="Відображувана назва (напр. Виробник)"
            value={newFilter.displayName}
            onChange={(e) => setNewFilter({ ...newFilter, displayName: e.target.value })}
          />
          <Select
            value={newFilter.type}
            onValueChange={(v) => setNewFilter({ ...newFilter, type: v as FilterType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select">Список</SelectItem>
              <SelectItem value="multi-select">Множинний вибір</SelectItem>
              <SelectItem value="range">Діапазон</SelectItem>
              <SelectItem value="checkbox">Чекбокс</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={newFilter.source}
            onValueChange={(v) => setNewFilter({ ...newFilter, source: v as FilterSource })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Вручну</SelectItem>
              <SelectItem value="manufacturer">Виробник (автозаповнення)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddFilter} disabled={createFilter.isPending}>
              Створити
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
              Скасувати
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-3 w-3" /> Додати фільтр
        </Button>
      )}
    </div>
  );
}
