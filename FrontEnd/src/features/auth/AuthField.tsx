import type { UseFormRegisterReturn } from 'react-hook-form';

export function AuthField({
  id,
  label,
  type = 'text',
  registration,
  error,
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete?: string;
  inputMode?:
    | 'none'
    | 'text'
    | 'tel'
    | 'url'
    | 'email'
    | 'numeric'
    | 'decimal'
    | 'search';
}) {
  return (
    <div className='auth-field'>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...registration}
      />
      {error && (
        <span id={`${id}-error`} role='alert'>
          {error}
        </span>
      )}
    </div>
  );
}
