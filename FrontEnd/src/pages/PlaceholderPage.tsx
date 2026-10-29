import { Compass } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/StateViews';

export function PlaceholderPage({
  title = 'Marketplace foundation',
}: {
  title?: string;
}) {
  return (
    <main className='page'>
      <PageHeader
        eyebrow='Dealio'
        title={title}
        description='A focused foundation for contract-driven marketplace features.'
      />
      <section className='content-section'>
        <div className='section-mark'>
          <Compass size={18} /> Ready for the next feature contract
        </div>
        <EmptyState
          title='No feature connected'
          description='This route intentionally contains no domain data or backend assumptions.'
        />
      </section>
    </main>
  );
}
