'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GripVertical, Package, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order } from '@repo/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Fulfillment pipeline, left → right. Cards live in exactly one column (status).
const BOARD_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'refund_requested',
] as const;
type BoardStatus = (typeof BOARD_STATUSES)[number];

const statusAccent: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  processing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  shipped: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  delivered: 'bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
  returned: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  refund_requested: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
};

const zl = (cents: number) => `${(cents / 100).toFixed(2)} zł`;
const orderKey = (o: Order) => ((o as unknown as { _id?: string })._id ?? o.id) as string;

function customerName(o: Order): string {
  if (o.shippingAddress) return `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`.trim();
  return o.guestEmail || o.userId || '—';
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
function OrderCard({ order }: { order: Order }) {
  const id = orderKey(order);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'order', status: order.status },
  });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="group relative cursor-grab gap-0 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <button
        type="button"
        aria-label="Drag"
        className="absolute top-3 right-2 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex items-center justify-between pr-6">
        <span className="font-mono font-medium text-foreground text-sm">{order.orderNumber}</span>
        <span className="text-foreground text-sm font-semibold tabular-nums">{zl(order.totalAmount)}</span>
      </div>
      <p className="mt-1 truncate text-muted-foreground text-xs">{customerName(order)}</p>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          {order.items?.length ?? 0}
        </span>
        <span>•</span>
        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        <span className="flex-1" />
        <Link
          href={`/dashboard/orders/${id}`}
          className="rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label="Open order"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------
function OrderColumn({
  status,
  title,
  orders,
}: {
  status: BoardStatus;
  title: string;
  orders: Order[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column' } });
  return (
    <div className="flex w-[300px] min-w-[300px] flex-col rounded-xl bg-muted/50 p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm">
          <span className={cn('inline-block size-2 rounded-full', statusAccent[status])} />
          {title}
        </h3>
        <Badge variant="secondary" className="rounded-md px-2 text-[11px] tabular-nums">
          {orders.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg p-1 transition-colors',
          isOver && 'bg-primary/5',
        )}
      >
        <SortableContext items={orders.map(orderKey)} strategy={verticalListSortingStrategy}>
          {orders.map((o) => (
            <OrderCard key={orderKey(o)} order={o} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------
export function OrdersBoard() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [ordersById, setOrdersById] = React.useState<Record<string, Order>>({});
  const [columns, setColumns] = React.useState<Record<string, string[]>>({});
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = (await getToken()) || undefined;
        const res = await api.orders.getAll({ limit: 200, token });
        const list = res.data || [];
        const byId: Record<string, Order> = {};
        const cols: Record<string, string[]> = Object.fromEntries(BOARD_STATUSES.map((s) => [s, []]));
        for (const o of list) {
          const id = orderKey(o);
          byId[id] = o;
          (cols[o.status] ??= []).push(id);
        }
        setOrdersById(byId);
        setColumns(cols);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const statusOf = React.useCallback(
    (id: string): BoardStatus | undefined =>
      (Object.keys(columns) as BoardStatus[]).find((s) => columns[s]?.includes(id)),
    [columns],
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = active.id as string;
    const from = statusOf(id);
    if (!from) return;

    // Target is either a column (drop on empty area) or another card.
    const overId = over.id as string;
    const to = (BOARD_STATUSES as readonly string[]).includes(overId)
      ? (overId as BoardStatus)
      : statusOf(overId);
    if (!to || to === from) return;

    // Optimistic move. Card placement is driven by `columns`; the card doesn't
    // render status, so ordersById needs no status rewrite here.
    const prevColumns = columns;
    const target: BoardStatus = to;
    setColumns((prev) => {
      const fromList = (prev[from] ?? []).filter((x) => x !== id);
      const toList = prev[target] ?? [];
      const nextTo = toList.includes(id) ? toList : [id, ...toList];
      return { ...prev, [from]: fromList, [target]: nextTo };
    });

    try {
      const token = (await getToken()) || undefined;
      await api.orders.updateStatus(id, to, token);
    } catch (err) {
      setColumns(prevColumns); // revert on failure
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  if (loading) {
    return (
      <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-4">
        {BOARD_STATUSES.slice(0, 5).map((s) => (
          <div key={s} className="h-64 w-[300px] min-w-[300px] animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  const activeOrder = activeId ? ordersById[activeId] : null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm">
          {error}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-4">
          {BOARD_STATUSES.map((status) => (
            <OrderColumn
              key={status}
              status={status}
              title={t(`orders.status.${status}`)}
              orders={(columns[status] || []).map((id) => ordersById[id]).filter(Boolean) as Order[]}
            />
          ))}
        </div>
        <DragOverlay>{activeOrder ? <OrderCard order={activeOrder} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
