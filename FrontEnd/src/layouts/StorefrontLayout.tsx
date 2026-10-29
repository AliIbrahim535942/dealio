import { Search, ShoppingBag } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AccountMenu } from '../features/auth/AccountMenu';

export function StorefrontLayout() {
  return (
    <div className='app-shell'>
      <header className='site-header'>
        <Link className='brand' to='/'>
          dealio<span>.</span>
        </Link>
        <nav aria-label='Primary navigation'>
          <Link to='/search'>Discover</Link>
          <Link to='/search'>Collections</Link>
        </nav>
        <div className='header-actions'>
          <Button variant='ghost' aria-label='Search'>
            <Search size={19} />
          </Button>
          <AccountMenu />
          <Button variant='ghost' aria-label='Shopping bag'>
            <ShoppingBag size={19} />
          </Button>
        </div>
      </header>
      <Outlet />
      <footer className='site-footer'>
        <span>Dealio marketplace foundation</span>
        <span>Built for thoughtful discovery</span>
      </footer>
    </div>
  );
}
