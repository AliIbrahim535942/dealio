import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = 'primary', ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn('button', `button-${variant}`, className)}
        {...props}
      />
    );
  },
);
