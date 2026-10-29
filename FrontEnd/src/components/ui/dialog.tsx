import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/utils/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className='dialog-overlay' />
      <DialogPrimitive.Content className={cn('dialog-content', className)}>
        {children}
        <DialogPrimitive.Close
          className='dialog-close'
          aria-label='Close dialog'
        >
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
