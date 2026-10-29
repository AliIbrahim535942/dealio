import { LayoutDashboard, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function AdminLayout() {
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
        <Button variant='ghost'>
          <LogOut size={18} /> Sign out
        </Button>
      </aside>
      <div className='admin-content'>
        <Outlet />
      </div>
    </div>
  );
}
