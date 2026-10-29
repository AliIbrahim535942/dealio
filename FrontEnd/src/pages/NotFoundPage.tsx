import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return (
    <main className='not-found'>
      <span className='eyebrow'>404</span>
      <h1>Page not found</h1>
      <p>The route you requested does not exist.</p>
      <Link to='/'>
        <Button>Return to storefront</Button>
      </Link>
    </main>
  );
}
