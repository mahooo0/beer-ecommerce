'use client';

import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tree, NodeModel } from '@minoru/react-dnd-treeview';
import type { Category } from '@repo/types';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Tag, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DataTableRowActions } from '@/components/DataTableRowActions';
import { showError } from '@/lib/toast';
import { useRouter } from 'next/navigation';

interface CategoryTreeProps {
  categories: Category[];
  onEditCategory?: (category: Category) => void;
}

export default function CategoryTree({ categories, onEditCategory }: CategoryTreeProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Transform flat categories to tree data format
  const treeData: NodeModel[] = categories.map((cat) => ({
    id: cat.id,
    parent: cat.parentId || 0,
    text: cat.name,
    droppable: true,
    data: cat,
  }));

  const handleDrop = async (
    newTree: NodeModel[],
    options: {
      dragSourceId?: string | number;
      dropTargetId?: string | number;
      dragSource?: NodeModel;
      dropTarget?: NodeModel;
    }
  ) => {
    const { dragSourceId, dropTargetId } = options;

    // Validate drop operation
    if (!dragSourceId || dragSourceId === dropTargetId) {
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        showError('Not authenticated');
        return;
      }

      // Call move API
      await api.categories.move(
        String(dragSourceId),
        {
          newParentId: dropTargetId === 0 ? null : String(dropTargetId),
          position: 0,
        },
        token
      );

      // Refresh to get updated tree
      router.refresh();
    } catch (error: any) {
      showError(error.message || 'Failed to move category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        showError('Not authenticated');
        return;
      }

      await api.categories.delete(categoryId, token);
      router.refresh();
    } catch (error: any) {
      showError(error.message || 'Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Processing...</div>
        </div>
      )}

      <Tree
        tree={treeData}
        rootId={0}
        onDrop={handleDrop}
        render={(node, { depth, isOpen, onToggle }) => {
          const category = node.data as Category;
          const hasChildren = treeData.some((n) => n.parent === node.id);

          return (
            <div
              className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded"
              style={{ paddingLeft: `${depth * 20 + 12}px` }}
            >
              {/* Expand/collapse toggle */}
              {hasChildren && (
                <button
                  onClick={onToggle}
                  className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? '▼' : '▶'}
                </button>
              )}
              {!hasChildren && <span className="w-4" />}

              {/* Category name */}
              <span className="flex-1 text-sm font-medium text-foreground">
                {node.text}
              </span>

              {/* Product count badge - optional, would come from API if included */}

              {/* Action buttons */}
              <DataTableRowActions actions={[
                { label: 'Edit', ...(onEditCategory ? { onClick: () => onEditCategory(category) } : { href: `/dashboard/categories?action=edit&id=${node.id}` }), icon: <Pencil className="h-4 w-4" /> },
                { label: 'Attributes', href: `/dashboard/categories?action=attributes&id=${node.id}`, icon: <Tag className="h-4 w-4" /> },
                { label: 'Delete', onClick: () => handleDelete(String(node.id)), variant: 'destructive', icon: <Trash2 className="h-4 w-4" />, confirm: 'Are you sure you want to delete this category?' },
              ]} />
            </div>
          );
        }}
      />
    </div>
    </DndProvider>
  );
}
