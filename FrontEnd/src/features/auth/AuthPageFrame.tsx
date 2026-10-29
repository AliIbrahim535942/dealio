import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropsWithChildren, ReactNode } from 'react';

export function AuthPageFrame({
  eyebrow,
  title,
  description,
  children,
  footer,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}>) {
  return (
    <main className='auth-page'>
      <section className='auth-panel'>
        <div className='auth-panel-mark'>
          <ShieldCheck size={18} /> Secure account access
        </div>
        <p className='eyebrow'>{eyebrow}</p>
        <h1>{title}</h1>
        <p className='auth-description'>{description}</p>
        {children}
        {footer && <div className='auth-footer'>{footer}</div>}
      </section>
      <aside className='auth-aside'>
        <KeyRound size={32} />
        <p className='eyebrow'>Dealio account</p>
        <h2>One calm place for your marketplace identity.</h2>
        <p>
          Access your account with a short-lived access token and a protected
          session cookie.
        </p>
        <Link to='/' className='back-link'>
          <ArrowLeft size={16} /> Back to marketplace
        </Link>
      </aside>
    </main>
  );
}
