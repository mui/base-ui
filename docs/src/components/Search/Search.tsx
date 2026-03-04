'use client';
import { SearchBar } from './SearchBar';

const sitemap = () => import('../../app/sitemap');

export function Search({
  enableKeyboardShortcut = false,
  containedScroll = false,
  isPrivate = false,
}: {
  enableKeyboardShortcut?: boolean;
  containedScroll?: boolean;
  isPrivate?: boolean;
}) {
  return (
    <SearchBar
      sitemap={sitemap}
      enableKeyboardShortcut={enableKeyboardShortcut}
      containedScroll={containedScroll}
      isPrivate={isPrivate}
    />
  );
}
