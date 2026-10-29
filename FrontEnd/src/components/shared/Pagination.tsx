import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
}: {
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  return (
    <nav className='pagination' aria-label='Pagination'>
      <Button
        variant='ghost'
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        aria-label='Previous page'
      >
        <ChevronLeft size={18} />
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        variant='ghost'
        disabled={page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
        aria-label='Next page'
      >
        <ChevronRight size={18} />
      </Button>
    </nav>
  );
}
