'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Eye, Filter, Layers, Flag } from 'lucide-react';
import type { Attribute } from '@repo/types';

import {
  useAttributesByCategory,
  useCreateAttribute,
  useDeleteAttribute,
  useReorderAttributes,
} from '@/lib/queries/attributes';
import { toMachineName } from '@/lib/slug';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttributeItem } from '@/components/category/attribute-item';

type DisplayType = 'checkbox' | 'select' | 'button' | 'color' | 'range';

// Wraps one attribute in a sortable node and hands its drag-handle props down to
// AttributeItem, which renders the grip. The rest of AttributeItem stays fully
// interactive (only the grip starts a drag).
function SortableAttribute({
  attribute,
  categoryId,
  onDelete,
}: {
  attribute: Attribute;
  categoryId: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: attribute.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <AttributeItem
        attribute={attribute}
        categoryId={categoryId}
        dragHandle={{ ...attributes, ...listeners }}
        onDelete={onDelete}
      />
    </div>
  );
}

interface AttributeSectionProps {
  categoryId: string;
}

/**
 * The "Атрибути" panel on the category detail page. Lists the category's
 * structured attributes (normalized 4fr model), supports create (displayName →
 * auto machine name), delete (with confirm inside each item) and drag-and-drop
 * reorder. Data + mutations come from lib/queries/attributes. Ported from
 * 4fr-ecom's AttributeSection; adapted to taranka's react-query hooks, dnd-kit
 * and cuid string ids.
 */
export function AttributeSection({ categoryId }: AttributeSectionProps) {
  const { data: attributes } = useAttributesByCategory(categoryId);
  const createAttribute = useCreateAttribute();
  const deleteAttribute = useDeleteAttribute();
  const reorderAttributes = useReorderAttributes();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAttr, setNewAttr] = useState({
    displayName: '',
    displayType: 'checkbox' as DisplayType,
    isFilterable: true,
    isVisibleOnProductPage: true,
    showValueIcons: false,
  });

  const handleAdd = async () => {
    const displayName = newAttr.displayName.trim();
    if (!displayName) return;
    const name = toMachineName(displayName);
    if (!name) {
      showError('Не вдалося згенерувати системну назву. Спробуйте інакше');
      return;
    }
    try {
      await createAttribute.mutateAsync({
        categoryId,
        name,
        displayName,
        displayType: newAttr.displayType,
        isFilterable: newAttr.isFilterable,
        isVisibleOnProductPage: newAttr.isVisibleOnProductPage,
        showValueIcons: newAttr.showValueIcons,
      });
      showSuccess('Атрибут створено');
      setNewAttr({
        displayName: '',
        displayType: 'checkbox',
        isFilterable: true,
        isVisibleOnProductPage: true,
        showValueIcons: false,
      });
      setShowAddForm(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося створити атрибут');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAttribute.mutateAsync({ id, categoryId });
      showSuccess('Атрибут видалено');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося видалити атрибут');
    }
  };

  // Local working order for attribute drag-and-drop; re-seeded whenever the
  // server list changes (add/delete/refetch).
  const [order, setOrder] = useState<Attribute[]>(attributes ?? []);
  useEffect(() => {
    setOrder(attributes ?? []);
  }, [attributes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((a) => a.id === active.id);
    const newIndex = order.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const prev = order;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    try {
      await reorderAttributes.mutateAsync({
        categoryId,
        order: next.map((a, i) => ({ id: a.id, sortOrder: i })),
      });
    } catch (err) {
      setOrder(prev);
      showError(err instanceof Error ? err.message : 'Не вдалося змінити порядок');
    }
  };

  const machinePreview = newAttr.displayName.trim()
    ? toMachineName(newAttr.displayName.trim()) || '—'
    : '';

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={order.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {order.map((attr) => (
              <SortableAttribute
                key={attr.id}
                attribute={attr}
                categoryId={categoryId}
                onDelete={() => handleDelete(attr.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!attributes?.length && !showAddForm && (
        <p className="text-xs text-muted-foreground">
          Немає атрибутів для цієї категорії
        </p>
      )}

      {showAddForm ? (
        <div className="space-y-2 rounded border p-3">
          <div className="space-y-1">
            <Input
              placeholder="Назва атрибута (напр. Смак корму)"
              value={newAttr.displayName}
              onChange={(e) => setNewAttr({ ...newAttr, displayName: e.target.value })}
            />
            {machinePreview && (
              <p className="font-mono text-[10px] text-muted-foreground">
                Системний код: {machinePreview}
              </p>
            )}
          </div>
          <Select
            value={newAttr.displayType}
            onValueChange={(v) => setNewAttr({ ...newAttr, displayType: v as DisplayType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checkbox">Чекбокс</SelectItem>
              <SelectItem value="select">Випадний список</SelectItem>
              <SelectItem value="button">Кнопки</SelectItem>
              <SelectItem value="color">Зразки кольорів</SelectItem>
              <SelectItem value="range">Діапазон</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={newAttr.isFilterable}
                onCheckedChange={(v) => setNewAttr({ ...newAttr, isFilterable: !!v })}
              />
              <Filter className="h-3 w-3" /> Фільтрується
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={newAttr.isVisibleOnProductPage}
                onCheckedChange={(v) =>
                  setNewAttr({ ...newAttr, isVisibleOnProductPage: !!v })
                }
              />
              <Eye className="h-3 w-3" /> Видимий на сторінці товару
            </label>
            {/* No variants in taranka — disabled on purpose (see AttributeItem). */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground opacity-60">
              <Checkbox checked={false} disabled />
              <Layers className="h-3 w-3" /> Використовується для варіацій
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={newAttr.showValueIcons}
                onCheckedChange={(v) => setNewAttr({ ...newAttr, showValueIcons: !!v })}
              />
              <Flag className="h-3 w-3" /> Показувати іконки у фільтрі
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createAttribute.isPending}>
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
          <Plus className="h-3 w-3" /> Додати атрибут
        </Button>
      )}
    </div>
  );
}
