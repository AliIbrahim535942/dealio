import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { AuthField } from '../../features/auth/AuthField';
import { AuthPageFrame } from '../../features/auth/AuthPageFrame';
import { getAuthErrorMessage } from '../../features/auth/auth.api';
import { useSignUp } from '../../features/auth/auth.hooks';
import {
  signUpSchema,
  type SignUpInput,
} from '../../shared/schemas/auth.schemas';

export function SignUpPage() {
  const navigate = useNavigate();
  const signUpMutation = useSignUp();
  const form = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpInput) {
    try {
      await signUpMutation.mutateAsync(values);
      navigate(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch {
      // The mutation error is rendered below.
    }
  }

  return (
    <AuthPageFrame
      eyebrow='Create account'
      title='Make room for good finds.'
      description='Create a customer account, then verify your email before signing in.'
      footer={
        <>
          Already have an account? <Link to='/auth/sign-in'>Sign in</Link>
        </>
      }
    >
      <form className='auth-form' onSubmit={form.handleSubmit(onSubmit)}>
        <AuthField
          id='full_name'
          label='Full name'
          autoComplete='name'
          registration={form.register('full_name')}
          error={form.formState.errors.full_name?.message}
        />
        <AuthField
          id='email'
          label='Email'
          autoComplete='email'
          registration={form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <AuthField
          id='phone'
          label='Phone'
          type='tel'
          autoComplete='tel'
          registration={form.register('phone')}
          error={form.formState.errors.phone?.message}
        />
        <AuthField
          id='password'
          label='Password'
          type='password'
          autoComplete='new-password'
          registration={form.register('password')}
          error={form.formState.errors.password?.message}
        />
        {signUpMutation.isError && (
          <p className='form-error' role='alert'>
            {getAuthErrorMessage(
              signUpMutation.error,
              'Unable to create account',
            )}
          </p>
        )}
        <Button type='submit' disabled={signUpMutation.isPending}>
          {signUpMutation.isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthPageFrame>
  );
}
