import { AlertCircle, Inbox, LoaderCircle, ShieldAlert } from 'lucide-react';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className='state-view' role='status'>
      <LoaderCircle className='spin' size={24} />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'This area will be ready when its first feature is connected.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className='state-view'>
      <Inbox size={28} />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again later.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className='state-view state-error'>
      <AlertCircle size={28} />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function UnauthorizedState() {
  return (
    <div className='state-view'>
      <ShieldAlert size={28} />
      <div>
        <strong>Unauthorized</strong>
        <p>You do not have access to this area.</p>
      </div>
    </div>
  );
}
