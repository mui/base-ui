'use client';
import { SearchBar } from './SearchBar';

export function Search({ enableKeyboardShortcut = false }: { enableKeyboardShortcut?: boolean }) {
  return (
    <SearchBar
      sitemap={() => import('../../app/sitemap')}
      enableKeyboardShortcut={enableKeyboardShortcut}
    />
  );
}
