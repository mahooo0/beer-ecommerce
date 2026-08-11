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
import {
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Eye,
  Filter,
  Layers,
  GripVertical,
  Flag,
} from 'lucide-react';
import type { Attribute, AttributeValue } from '@repo/types';

import {
  useUpdateAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
  useReorderAttributeValues,
} from '@/lib/queries/attributes';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import SingleImageUpload from '@/components/category/single-image-upload';
import { ConfirmDialog } from '@/components/category/confirm-dialog';

type DisplayType = 'checkbox' | 'select' | 'button' | 'color' | 'range';

interface AttributeItemProps {
  attribute: Attribute;
  categoryId: string;
  /** Drag handle listeners/attributes from the parent SortableContext row. */
  dragHandle?: React.HTMLAttributes<HTMLElement>;
  onDelete: () => void;
}

// A single attribute-value row (drag-sortable). Icons render only for
// concept-like display types (checkbox/select/button), not colours/ranges.
function ValueRow({
  value,
  iconEligible,
  categoryId,
  onSetIcon,
  onDelete,
}: {
  value: AttributeValue;
  iconEligible: boolean;
  categoryId: string;
  onSetIcon: (id: string, url: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: value.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-muted-foreground"
          title="Перетягніть, щоб змінити порядок значень"
        >
          <GripVertical className="h-3 w-3" />
        </span>
        {value.colorCode && (
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full border"
            style={{ backgroundColor: value.colorCode }}
          />
        )}
        {iconEligible && (
          <SingleImageUpload
            value={value.iconUrl ?? null}
            onChange={(url) => onSetIcon(value.id, url)}
            preset="category"
            size={40}
            className="shrink-0"
          />
        )}
        <span className="truncate">{value.displayValue || value.value}</span>
      </div>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Trash2 className="h-3 w-3" />
          </Button>
        }
        title="Видалити значення?"
        description={`Значення "${value.displayValue || value.value}" буде видалено.`}
        confirmText="Видалити"
        variant="destructive"
        onConfirm={() => onDelete(value.id)}
      />
    </div>
  );
}

/**
 * One attribute row on the category detail page: header with badges + edit +
 * delete, an inline edit form, and a collapsible list of the attribute's values
 * (the "common options"). Values support add (with optional color/icon) and
 * drag-and-drop reorder. Ported from 4fr-ecom's AttributeItem; adapted to
 * taranka's dnd-kit, react-query mutation hooks and cuid string ids.
 */
export function AttributeItem({
  attribute,
  categoryId,
  dragHandle,
  onDelete,
}: AttributeItemProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: attribute.displayName,
    displayType: attribute.displayType as DisplayType,
    isFilterable: !!attribute.isFilterable,
    isVisibleOnProductPage: !!attribute.isVisibleOnProductPage,
    usedForVariations: !!attribute.usedForVariations,
    showValueIcons: !!attribute.showValueIcons,
  });
  const [newValue, setNewValue] = useState('');
  const [newColorCode, setNewColorCode] = useState('');
  const [newIconUrl, setNewIconUrl] = useState<string | null>(null);

  const updateAttribute = useUpdateAttribute();
  const createValue = useCreateAttributeValue();
  const updateValue = useUpdateAttributeValue();
  const deleteValue = useDeleteAttributeValue();
  const reorderValues = useReorderAttributeValues();

  // Icons make sense for concept values (checkbox/select/button) but not for
  // color swatches (they use colorCode) or numeric ranges (no discrete values).
  const iconEligible =
    attribute.displayType !== 'color' && attribute.displayType !== 'range';

  const handleEditStart = () => {
    setEditForm({
      displayName: attribute.displayName,
      displayType: attribute.displayType as DisplayType,
      isFilterable: !!attribute.isFilterable,
      isVisibleOnProductPage: !!attribute.isVisibleOnProductPage,
      usedForVariations: !!attribute.usedForVariations,
      showValueIcons: !!attribute.showValueIcons,
    });
    setEditing(true);
  };

  const handleEditSave = async () => {
    const displayName = editForm.displayName.trim();
    if (!displayName) return;
    try {
      await updateAttribute.mutateAsync({
        id: attribute.id,
        categoryId,
        data: {
          displayName,
          displayType: editForm.displayType,
          isFilterable: editForm.isFilterable,
          isVisibleOnProductPage: editForm.isVisibleOnProductPage,
          usedForVariations: editForm.usedForVariations,
          showValueIcons: editForm.showValueIcons,
        },
      });
      showSuccess('Атрибут оновлено');
      setEditing(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося оновити атрибут');
    }
  };

  const handleAddValue = async () => {
    const value = newValue.trim();
    if (!value) return;
    try {
      await createValue.mutateAsync({
        categoryId,
        data: {
          attributeId: attribute.id,
          value,
          ...(newColorCode ? { colorCode: newColorCode } : {}),
          ...(newIconUrl ? { iconUrl: newIconUrl } : {}),
          sortOrder: attribute.values?.length ?? 0,
        },
      });
      setNewValue('');
      setNewColorCode('');
      setNewIconUrl(null);
    } catch (err) {
      // 409 → the server sends "Значення вже існує"; surface it verbatim.
      showError(err instanceof Error ? err.message : 'Не вдалося додати значення');
    }
  };

  const handleSetValueIcon = async (valueId: string, iconUrl: string | null) => {
    try {
      await updateValue.mutateAsync({ id: valueId, categoryId, data: { iconUrl } });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося оновити іконку');
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    try {
      await deleteValue.mutateAsync({ id: valueId, categoryId });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Не вдалося видалити значення');
    }
  };

  // Local working order for value drag-and-drop; re-seeded whenever the server
  // list changes. Save-on-drop: persist the new sortOrder, revert on failure.
  const [valueOrder, setValueOrder] = useState<AttributeValue[]>(attribute.values ?? []);
  useEffect(() => {
    setValueOrder(attribute.values ?? []);
  }, [attribute.values]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleValueDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = valueOrder.findIndex((v) => v.id === active.id);
    const newIndex = valueOrder.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const prev = valueOrder;
    const next = arrayMove(valueOrder, oldIndex, newIndex);
    setValueOrder(next);
    try {
      await reorderValues.mutateAsync({
        categoryId,
        order: next.map((v, i) => ({ id: v.id, sortOrder: i })),
      });
    } catch (err) {
      setValueOrder(prev);
      showError(err instanceof Error ? err.message : 'Не вдалося змінити порядок');
    }
  };

  const badges: string[] = [];
  if (attribute.isFilterable) badges.push('фільтр');
  if (attribute.usedForVariations) badges.push('варіація');
  if (attribute.isVisibleOnProductPage) badges.push('видимий');
  if (attribute.showValueIcons) badges.push('іконки');

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded border p-2">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <span
              {...dragHandle}
              className="shrink-0 cursor-grab text-muted-foreground"
              title="Перетягніть, щоб змінити порядок атрибутів"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
              {open ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {attribute.displayName}
            </CollapsibleTrigger>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-[10px]">
              {attribute.displayType}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {attribute.values?.length ?? 0}
            </Badge>
            {badges.map((b) => (
              <Badge key={b} variant="secondary" className="text-[10px]">
                {b}
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEditStart}
              title="Редагувати атрибут"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              }
              title="Видалити атрибут?"
              description={`Атрибут "${attribute.displayName}" разом з ${attribute.values?.length ?? 0} значеннями буде видалено.`}
              confirmText="Видалити"
              variant="destructive"
              onConfirm={onDelete}
            />
          </div>
        </div>

        {editing && (
          <div className="mt-2 space-y-2 border-t pt-2">
            <Input
              placeholder="Назва атрибута"
              value={editForm.displayName}
              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
            />
            <Select
              value={editForm.displayType}
              onValueChange={(v) => setEditForm({ ...editForm, displayType: v as DisplayType })}
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
                  checked={editForm.isFilterable}
                  onCheckedChange={(v) => setEditForm({ ...editForm, isFilterable: !!v })}
                />
                <Filter className="h-3 w-3" /> Фільтрується
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={editForm.isVisibleOnProductPage}
                  onCheckedChange={(v) =>
                    setEditForm({ ...editForm, isVisibleOnProductPage: !!v })
                  }
                />
                <Eye className="h-3 w-3" /> Видимий на сторінці товару
              </label>
              {/* No variants in taranka — this toggle is intentionally DISABLED.
                  The column is kept so the shape matches 4fr, but it can't be
                  changed from the UI. */}
              <label className="flex items-center gap-2 text-xs text-muted-foreground opacity-60">
                <Checkbox checked={editForm.usedForVariations} disabled />
                <Layers className="h-3 w-3" /> Використовується для варіацій
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={editForm.showValueIcons}
                  onCheckedChange={(v) => setEditForm({ ...editForm, showValueIcons: !!v })}
                />
                <Flag className="h-3 w-3" /> Показувати іконки у фільтрі
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEditSave} disabled={updateAttribute.isPending}>
                {updateAttribute.isPending && (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                )}
                Зберегти
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={updateAttribute.isPending}
              >
                Скасувати
              </Button>
            </div>
          </div>
        )}

        <CollapsibleContent className="mt-2 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleValueDragEnd}
          >
            <SortableContext
              items={valueOrder.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {valueOrder.map((val) => (
                  <ValueRow
                    key={val.id}
                    value={val}
                    iconEligible={iconEligible}
                    categoryId={categoryId}
                    onSetIcon={handleSetValueIcon}
                    onDelete={handleDeleteValue}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-1 flex items-center gap-1">
            {iconEligible && (
              <SingleImageUpload
                value={newIconUrl}
                onChange={setNewIconUrl}
                preset="category"
                size={40}
                className="shrink-0"
              />
            )}
            <Input
              placeholder="Значення"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAddValue();
                }
              }}
            />
            {attribute.displayType === 'color' && (
              <Input
                placeholder="#hex"
                value={newColorCode}
                onChange={(e) => setNewColorCode(e.target.value)}
                className="h-7 w-20 text-xs"
              />
            )}
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleAddValue}
              disabled={createValue.isPending}
            >
              Додати
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
