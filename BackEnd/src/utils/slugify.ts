export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (é -> e)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugWithSuffix(base: string, attempt: number): string {
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
}