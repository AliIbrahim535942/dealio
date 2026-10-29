import * as ToastPrimitive from '@radix-ui/react-toast';
import { useState } from 'react';

export function Toaster() {
  const [open] = useState(false);

  return (
    <ToastPrimitive.Provider swipeDirection='right'>
      <ToastPrimitive.Root open={open} className='toast'>
        <ToastPrimitive.Title>Notification</ToastPrimitive.Title>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className='toast-viewport' />
    </ToastPrimitive.Provider>
  );
}
