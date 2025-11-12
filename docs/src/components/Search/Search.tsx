'use client';
import { SearchBar } from './SearchBar';

export function Search() {
  return <SearchBar sitemap={() => import('../../app/sitemap')} />;
}
