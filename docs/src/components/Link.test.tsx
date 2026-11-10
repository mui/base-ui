import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import NextLink from 'next/link';
import { expect, it, vi } from 'vitest';
import { Link } from './Link';

vi.mock('next/link', () => ({ default: vi.fn(() => null) }));

it.each([
  { name: 'RSS feed', href: '/blog/rss.xml', usesRouter: false },
  { name: 'page', href: '/blog', usesRouter: true },
])('uses the appropriate navigation for a $name link', ({ href, usesRouter }) => {
  const view = ReactDOM.renderToStaticMarkup(<Link href={href}>Read</Link>);

  expect(NextLink).toHaveBeenCalledTimes(usesRouter ? 1 : 0);
  expect(view).toBe(usesRouter ? '' : '<a href="/blog/rss.xml" class="Link">Read</a>');
});
