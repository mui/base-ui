'use client';
import { SearchBar } from './SearchBar';

const sitemap = () => import('../../app/sitemap');

export function Search({
  enableKeyboardShortcut = false,
  containedScroll = false,
}: {
  enableKeyboardShortcut?: boolean;
  containedScroll?: boolean;
}) {
  return (
    <SearchBar
      sitemap={sitemap}
      enableKeyboardShortcut={enableKeyboardShortcut}
      containedScroll={containedScroll}
    />
  );
}
