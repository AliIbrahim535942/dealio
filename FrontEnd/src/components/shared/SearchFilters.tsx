import { Search, SlidersHorizontal } from 'lucide-react';
import { useId } from 'react';
import { Button } from '../ui/button';

export function SearchFilters({
  placeholder = 'Search',
  onSearch,
}: {
  placeholder?: string;
  onSearch?: (value: string) => void;
}) {
  const inputId = useId();
  return (
    <form
      className='search-filters'
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('search');
        onSearch?.(typeof value === 'string' ? value : '');
      }}
    >
      <label htmlFor={inputId}>
        <Search size={18} />
        <span className='sr-only'>{placeholder}</span>
      </label>
      <input id={inputId} name='search' placeholder={placeholder} />
      <Button type='button' variant='secondary' aria-label='Open filters'>
        <SlidersHorizontal size={17} /> Filters
      </Button>
    </form>
  );
}
