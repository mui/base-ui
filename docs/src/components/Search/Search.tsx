'use client';
import { SearchBar } from './SearchBar';

const sitemap = () => import('../../app/sitemap');

export function Search({ enableKeyboardShortcut = false }: { enableKeyboardShortcut?: boolean }) {
  return <SearchBar sitemap={sitemap} enableKeyboardShortcut={enableKeyboardShortcut} />;
}
