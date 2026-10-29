import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { AuthField } from '../../features/auth/AuthField';
import { AuthPageFrame } from '../../features/auth/AuthPageFrame';
import {
  getAuthErrorMessage,
  getGoogleAuthUrl,
} from '../../features/auth/auth.api';
import { useLogin } from '../../features/auth/auth.hooks';
import {
  loginSchema,
  type LoginInput,
} from '../../shared/schemas/auth.schemas';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/';

  async function onSubmit(values: LoginInput) {
    try {
      await loginMutation.mutateAsync(values);
      navigate(from, { replace: true });
    } catch {
      // The mutation error is rendered below without exposing credentials.
    }
  }

  return (
    <AuthPageFrame
      eyebrow='Welcome back'
      title='Sign in to Dealio'
      description='Use your verified local account to continue.'
      footer={
        <>
          New to Dealio? <Link to='/auth/sign-up'>Create an account</Link>
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
          id='password'
          label='Password'
          type='password'
          autoComplete='current-password'
          registration={form.register('password')}
          error={form.formState.errors.password?.message}
        />
        {loginMutation.isError && (
          <p className='form-error' role='alert'>
            {getAuthErrorMessage(loginMutation.error, 'Unable to sign in')}
          </p>
        )}
        <Button type='submit' disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>
        <span className='form-divider'>or</span>
        <Button
          type='button'
          variant='secondary'
          onClick={() => window.location.assign(getGoogleAuthUrl())}
        >
          Continue with Google
        </Button>
      </form>
    </AuthPageFrame>
  );
}
