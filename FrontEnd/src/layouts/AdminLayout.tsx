import { LayoutDashboard, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useLogout } from '../features/auth/auth.hooks';
import { useNavigate } from 'react-router-dom';

export function AdminLayout() {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    navigate('/auth/sign-in', { replace: true });
  }

  return (
    <div className='admin-shell'>
      <aside>
        <Link className='brand' to='/'>
          dealio<span>.</span>
        </Link>
        <nav aria-label='Administration navigation'>
          <Link to='/admin'>
            <LayoutDashboard size={18} /> Overview
          </Link>
        </nav>
        <Button
          variant='ghost'
          disabled={logoutMutation.isPending}
          onClick={() => void handleLogout()}
        >
          <LogOut size={18} /> Sign out
        </Button>
      </aside>
      <div className='admin-content'>
        <Outlet />
      </div>
    </div>
  );
}
