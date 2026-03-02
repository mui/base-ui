'use client';
import { SearchBar } from './SearchBar';

const sitemap = () => import('../../app/sitemap');

export function Search({
  enableKeyboardShortcut = false,
  containedScroll = false,
  isPublic = false,
}: {
  enableKeyboardShortcut?: boolean;
  containedScroll?: boolean;
  isPublic?: boolean;
}) {
  return (
    <SearchBar
      sitemap={sitemap}
      enableKeyboardShortcut={enableKeyboardShortcut}
      containedScroll={containedScroll}
      isPublic={isPublic}
    />
  );
}
