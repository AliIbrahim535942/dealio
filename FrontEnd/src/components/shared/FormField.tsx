import type { UseFormRegisterReturn } from 'react-hook-form';

export function FormField({
  id,
  label,
  registration,
  error,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className='form-field'>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
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
