import { LogIn, LogOut, UserRound, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { getAuthErrorMessage } from './auth.api';
import { useLogout } from './auth.hooks';
import { useAuthStore } from '../../stores/auth.store';

export function AccountMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const logoutMutation = useLogout();

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
      setIsOpen(false);
      navigate('/auth/sign-in', { replace: true });
    } catch {
      // The session is reset by the mutation even when the server is unavailable.
    }
  }

  return (
    <div className='account-menu'>
      <Button
        variant='ghost'
        aria-label={isAuthenticated ? 'Open account menu' : 'Sign in'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <UserRound size={19} />
      </Button>
      {isOpen && (
        <div
          className='account-popover'
          role='dialog'
          aria-label='Account menu'
        >
          {isInitializing ? (
            <p className='account-muted'>Checking your session...</p>
          ) : isAuthenticated && user ? (
            <>
              <div className='account-heading'>
                <span className='account-avatar'>
                  <UserRound size={18} />
                </span>
                <div>
                  <strong>{user.full_name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <dl className='account-details'>
                <div>
                  <dt>Role</dt>
                  <dd>{user.role}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd>{user.auth_provider}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.is_email_verified ? 'Verified' : 'Unverified'}</dd>
                </div>
              </dl>
              {logoutMutation.isError && (
                <p className='form-error' role='alert'>
                  {getAuthErrorMessage(
                    logoutMutation.error,
                    'Unable to sign out',
                  )}
                </p>
              )}
              <Button
                variant='danger'
                disabled={logoutMutation.isPending}
                onClick={() => void handleLogout()}
              >
                <LogOut size={17} />
                {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
              </Button>
            </>
          ) : (
            <>
              <div className='account-heading'>
                <span className='account-avatar'>
                  <UserRound size={18} />
                </span>
                <div>
                  <strong>Welcome to Dealio</strong>
                  <span>Sign in to view your account</span>
                </div>
              </div>
              <div className='account-actions'>
                <Link to='/auth/sign-in' onClick={() => setIsOpen(false)}>
                  <LogIn size={17} /> Sign in
                </Link>
                <Link to='/auth/sign-up' onClick={() => setIsOpen(false)}>
                  <UserPlus size={17} /> Create account
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
