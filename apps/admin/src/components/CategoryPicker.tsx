'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategoryTree, type CategoryTreeNode } from '@/lib/queries/categories';

function flattenTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

// Remove a subtree (node + descendants) from the tree — used to prevent a
// category from becoming its own ancestor (cycle) in the parent picker.
function pruneSubtree(
  nodes: CategoryTreeNode[],
  excludeId: string | undefined
): CategoryTreeNode[] {
  if (!excludeId) return nodes;
  return nodes
    .filter((n) => n.id !== excludeId)
    .map((n) => ({ ...n, children: pruneSubtree(n.children ?? [], excludeId) }));
}

interface CategoryPickerProps {
  value: string | null | undefined;
  onChange: (categoryId: string | null) => void;
  placeholder?: string;
  /** Show a "None (root)" choice at the top that emits null. */
  allowNone?: boolean;
  noneLabel?: string;
  /** Hide this category and its descendants (cycle prevention). */
  excludeSubtreeId?: string;
}

function buildBreadcrumb(
  categoryId: string,
  flatCategories: CategoryTreeNode[]
): string[] {
  const byId = new Map(flatCategories.map((c) => [c.id, c]));
  const parts: string[] = [];
  let current = byId.get(categoryId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return parts;
}

function matchesSearch(cat: CategoryTreeNode, query: string): boolean {
  return cat.name.toLowerCase().includes(query.toLowerCase());
}

function treeHasMatch(cat: CategoryTreeNode, query: string): boolean {
  if (matchesSearch(cat, query)) return true;
  return (cat.children ?? []).some((child) => treeHasMatch(child, query));
}

function subtreeContainsId(cat: CategoryTreeNode, id: string): boolean {
  if (cat.id === id) return true;
  return (cat.children ?? []).some((child) => subtreeContainsId(child, id));
}

function CategoryNode({
  category,
  search,
  selectedId,
  onSelect,
  level = 0,
}: {
  category: CategoryTreeNode;
  search: string;
  selectedId: string | null | undefined;
  onSelect: (id: string) => void;
  level?: number;
}) {
  const hasChildren = (category.children ?? []).length > 0;
  const isSearching = search.length > 0;
  // Collapsed by default; auto-expand only the branch that leads to the
  // currently selected category so the existing choice stays visible.
  const [open, setOpen] = useState(() => {
    if (!selectedId) return false;
    return (category.children ?? []).some((child) =>
      subtreeContainsId(child, selectedId)
    );
  });

  const shouldShow = !isSearching || treeHasMatch(category, search);
  const isExpanded = isSearching ? treeHasMatch(category, search) : open;

  if (!shouldShow) return null;

  const isSelected = selectedId === category.id;
  const isDirectMatch = isSearching && matchesSearch(category, search);

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors ${
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted/50'
        } ${isDirectMatch && !isSelected ? 'font-medium' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(category.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="shrink-0 p-0.5 rounded hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <span className="truncate">{category.name}</span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {(category.children ?? []).map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              search={search}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryPicker({
  value,
  onChange,
  placeholder = 'Select a category',
  allowNone = false,
  noneLabel = 'None (root)',
  excludeSubtreeId,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: rawTree } = useCategoryTree();

  const tree = useMemo(
    () => pruneSubtree(rawTree ?? [], excludeSubtreeId),
    [rawTree, excludeSubtreeId]
  );
  const flatCategories = useMemo(() => flattenTree(tree), [tree]);

  const breadcrumb = useMemo(() => {
    if (!value || !flatCategories.length) return null;
    return buildBreadcrumb(value, flatCategories);
  }, [value, flatCategories]);

  const selectedName = breadcrumb ? breadcrumb.join(' → ') : null;

  const handleSelect = (categoryId: string | null) => {
    onChange(categoryId);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-9 text-sm font-normal"
        >
          {selectedName ? (
            <span className="truncate">{selectedName}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Select category
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <ScrollArea className="h-[350px] -mx-2">
          <div className="px-2">
            {allowNone && (
              <div
                className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors ${
                  !value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted/50'
                }`}
                style={{ paddingLeft: '8px' }}
                onClick={() => handleSelect(null)}
              >
                <span className="w-5 shrink-0" />
                <span className="truncate italic">{noneLabel}</span>
              </div>
            )}

            {tree.length > 0 ? (
              tree.map((cat) => (
                <CategoryNode
                  key={cat.id}
                  category={cat}
                  search={search}
                  selectedId={value}
                  onSelect={handleSelect}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No categories found
              </p>
            )}
          </div>
        </ScrollArea>

        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground border-t pt-3">
            <span>Selected:</span>
            {breadcrumb.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span
                  className={
                    i === breadcrumb.length - 1
                      ? 'font-medium text-foreground'
                      : ''
                  }
                >
                  {part}
                </span>
              </span>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
