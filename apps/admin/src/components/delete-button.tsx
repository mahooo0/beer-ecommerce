'use client';

import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';

export default function DeleteButton({
  action,
  confirmMessage = 'Are you sure you want to delete this?',
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage?: string;
}) {
  const [ConfirmDialog, confirm] = useConfirm();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const ok = await confirm({
      description: confirmMessage,
      variant: 'destructive',
    });
    if (!ok) return;

    const form = (e.target as HTMLElement).closest('form');
    if (form) {
      const formData = new FormData(form);
      await action(formData);
    }
  };

  return (
    <>
      <ConfirmDialog />
      <form action={action}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleClick}
        >
          Delete
        </Button>
      </form>
    </>
  );
}
