import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className='auth-shell'>
      <Link className='brand' to='/'>
        dealio<span>.</span>
      </Link>
      <Outlet />
    </div>
  );
}
