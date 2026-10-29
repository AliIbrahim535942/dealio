import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '../ui/button';
import { DialogDescription, DialogTitle } from '../ui/dialog';

export function ConfirmDialog({
  open,
  title,
  description,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className='dialog-overlay' />
        <AlertDialog.Content className='dialog-content'>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <div className='page-actions'>
            <AlertDialog.Cancel asChild>
              <Button variant='secondary'>Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant='danger' onClick={onConfirm}>
                Confirm
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
