import { BookMetadata } from '../types/epub';

/**
 * Stable identity for a book, used to scope bookmarks, highlights and reading
 * progress to the right title. Title + author is the only identity an EPUB
 * reliably provides (there is no ISBN guarantee), so both go into the key.
 *
 * Normalised to lowercase ASCII-ish form so that re-importing the same book
 * with slightly different metadata casing still lands on the same key.
 */
export function bookId(metadata: BookMetadata): string {
  const raw = `${metadata.title}::${metadata.author || ''}`;
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || 'unbenannt';
}

/** Storage key for a book's saved reading position. */
export function progressKey(metadata: BookMetadata): string {
  return `bibliotheca_progress_${bookId(metadata)}`;
}
