import * as React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { type RouteMetadata } from '../../data/pages';
import classes from './SiblingPageLinks.module.css';

export interface SiblingPageLinksProps extends React.HTMLAttributes<HTMLDivElement> {
  currentSlug: string;
  pages: readonly RouteMetadata[];
}

export function SiblingPageLinks(props: SiblingPageLinksProps) {
  const { currentSlug, className, pages, ...other } = props;

  const flattenedPages = flattenSitepmap(pages);
  const currentIndex = flattenedPages.findIndex((page) => page.pathname === currentSlug);

  const previousPage = flattenedPages[currentIndex - 1];
  const nextPage = flattenedPages[currentIndex + 1];

  return (
    <div {...other} className={clsx(classes.root, className)}>
      {previousPage && (
        <LinkBlock href={previousPage.pathname} relation="previous">
          {previousPage.title}
        </LinkBlock>
      )}
      {previousPage && nextPage && <div className={classes.separator} role="separator" />}
      {nextPage && (
        <LinkBlock href={nextPage.pathname} relation="next">
          {nextPage.title}
        </LinkBlock>
      )}
    </div>
  );
}

function flattenSitepmap(pages: readonly RouteMetadata[]): RouteMetadata[] {
  const flatPages: RouteMetadata[] = [];
  for (const page of pages) {
    if (!page.children) {
      flatPages.push(page);
    } else {
      flatPages.push(...flattenSitepmap(page.children));
    }
  }

  return flatPages;
}

interface LinkBlockProps {
  href: string;
  children: React.ReactNode;
  relation: 'previous' | 'next';
}

function LinkBlock(props: LinkBlockProps) {
  const { href, relation, children } = props;

  return (
    <Link href={href} className={clsx(classes.link, classes[relation])}>
      <div className={classes.block}>
        <span className={classes.label}>{relation === 'previous' ? 'Previous' : 'Next'}</span>
        <div className={classes.pageTitleWrapper}>
          {relation === 'previous' && <GrowingChevron direction="left" />}
          <span className={classes.pageTitle}>{children}</span>
          {relation === 'next' && <GrowingChevron direction="right" />}
        </div>
      </div>
    </Link>
  );
}

interface GrowingChevronProps {
  direction: 'left' | 'right';
}

function GrowingChevron(props: GrowingChevronProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={clsx(classes.chevron, classes[props.direction])}
    >
      <path d="M2.5 8H13.5" stroke="currentColor" strokeLinecap="round" className={classes.line} />
      <path
        d="M9 3.5L13.5 8L9 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={classes.tip}
      />
    </svg>
  );
}
