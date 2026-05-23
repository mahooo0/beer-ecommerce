'use client';

import React from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConfirm } from '@/hooks/use-confirm';

type RowAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  icon?: React.ReactNode;
  confirm?: string;
};

interface DataTableRowActionsProps {
  actions: RowAction[];
}

export function DataTableRowActions({ actions }: DataTableRowActionsProps) {
  const [ConfirmDialog, confirm] = useConfirm();
  const defaultActions = actions.filter((a) => a.variant !== 'destructive');
  const destructiveActions = actions.filter((a) => a.variant === 'destructive');

  const handleClick = async (action: RowAction) => {
    if (action.confirm) {
      const ok = await confirm({
        description: action.confirm,
        variant: action.variant,
      });
      if (!ok) return;
    }
    action.onClick?.();
  };

  return (
    <>
      <ConfirmDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {defaultActions.map((action) =>
            action.href ? (
              <DropdownMenuItem key={action.label} asChild>
                <Link href={action.href}>
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={action.label}
                onClick={() => handleClick(action)}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            )
          )}
          {destructiveActions.length > 0 && defaultActions.length > 0 && (
            <DropdownMenuSeparator />
          )}
          {destructiveActions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              className="text-destructive focus:text-destructive"
              onClick={() => handleClick(action)}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
