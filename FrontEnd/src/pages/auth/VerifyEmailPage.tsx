import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { AuthField } from '../../features/auth/AuthField';
import { AuthPageFrame } from '../../features/auth/AuthPageFrame';
import { getAuthErrorMessage } from '../../features/auth/auth.api';
import { useResendCode, useVerifyEmail } from '../../features/auth/auth.hooks';
import {
  verifyEmailSchema,
  type VerifyEmailInput,
} from '../../shared/schemas/auth.schemas';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendCode();
  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email },
  });

  async function onSubmit(values: VerifyEmailInput) {
    try {
      await verifyMutation.mutateAsync(values);
      navigate('/auth/sign-in', { replace: true });
    } catch {
      // The mutation error is rendered below.
    }
  }

  async function resend() {
    const value = form.getValues('email');
    const parsed = verifyEmailSchema.shape.email.safeParse(value);
    if (parsed.success)
      await resendMutation.mutateAsync({ email: parsed.data });
  }

  return (
    <AuthPageFrame
      eyebrow='Verify email'
      title='Check your inbox.'
      description='Enter the six-digit code sent to your email. Codes expire after 10 minutes.'
      footer={
        <>
          Need to start again? <Link to='/auth/sign-up'>Create an account</Link>
        </>
      }
    >
      <form className='auth-form' onSubmit={form.handleSubmit(onSubmit)}>
        <AuthField
          id='email'
          label='Email'
          autoComplete='email'
          registration={form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <AuthField
          id='code'
          label='Verification code'
          inputMode='numeric'
          registration={form.register('code')}
          error={form.formState.errors.code?.message}
        />
        {verifyMutation.isError && (
          <p className='form-error' role='alert'>
            {getAuthErrorMessage(
              verifyMutation.error,
              'Unable to verify email',
            )}
          </p>
        )}
        {resendMutation.isSuccess && (
          <p className='form-success' role='status'>
            {resendMutation.data.message}
          </p>
        )}
        {resendMutation.isError && (
          <p className='form-error' role='alert'>
            {getAuthErrorMessage(resendMutation.error, 'Unable to resend code')}
          </p>
        )}
        <Button type='submit' disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? 'Verifying...' : 'Verify email'}
        </Button>
        <Button
          type='button'
          variant='secondary'
          disabled={resendMutation.isPending}
          onClick={() => void resend()}
        >
          {resendMutation.isPending ? 'Sending...' : 'Resend code'}
        </Button>
      </form>
    </AuthPageFrame>
  );
}
