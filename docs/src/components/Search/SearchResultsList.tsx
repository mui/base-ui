import * as React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import type { SearchResult, SearchResults } from '@mui/internal-docs-infra/useSearch/types';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { getDisplayTitle } from '../../utils/getDisplayTitle';
import { normalizeSearchGroup } from './searchUtils';

interface SearchResultsListClasses {
  group: string;
  groupLabel: string;
  item: string;
  breadcrumbText?: string;
  breadcrumbPart: string;
  breadcrumbPartLast?: string;
  separator: string;
  score: string;
}

interface SearchResultsListProps {
  buildResultUrl: (result: SearchResult) => string;
  className: string;
  classes: SearchResultsListClasses;
  onKeyDownCapture: React.KeyboardEventHandler;
  onResultNavigate: (result: SearchResult) => void;
  separatorVariant: 'filled' | 'stroked';
}

export function SearchResultsList({
  buildResultUrl,
  className,
  classes,
  onKeyDownCapture,
  onResultNavigate,
  separatorVariant,
}: SearchResultsListProps) {
  const renderGroup = React.useCallback(
    (group: SearchResults[number]) => (
      <Autocomplete.Group key={group.group} items={group.items} className={classes.group}>
        {group.group !== 'Default' && (
          <Autocomplete.GroupLabel className={classes.groupLabel}>
            {normalizeSearchGroup(group.group)}
          </Autocomplete.GroupLabel>
        )}
        <Autocomplete.Collection>
          {(result: SearchResult, i) => (
            <Autocomplete.Item
              key={result.id || i}
              value={result}
              render={
                <Link
                  href={buildResultUrl(result)}
                  onNavigate={() => onResultNavigate(result)}
                  tabIndex={-1}
                />
              }
              className={classes.item}
            >
              <SearchResultItem
                result={result}
                classes={classes}
                separatorVariant={separatorVariant}
              />
            </Autocomplete.Item>
          )}
        </Autocomplete.Collection>
      </Autocomplete.Group>
    ),
    [buildResultUrl, classes, onResultNavigate, separatorVariant],
  );

  return (
    <Autocomplete.List className={className} onKeyDownCapture={onKeyDownCapture}>
      {renderGroup}
    </Autocomplete.List>
  );
}

function SearchResultItem({
  classes,
  result,
  separatorVariant,
}: {
  classes: SearchResultsListClasses;
  result: SearchResult;
  separatorVariant: 'filled' | 'stroked';
}) {
  const breadcrumb = (
    <React.Fragment>
      {result.title?.split(' ‣ ').map((part, i, arr) => (
        <React.Fragment key={i}>
          <span
            className={clsx(
              classes.breadcrumbPart,
              i === arr.length - 1 && classes.breadcrumbPartLast,
            )}
          >
            {getDisplayTitle(part)}
          </span>
          {i !== arr.length - 1 && (
            <SearchBreadcrumbSeparator className={classes.separator} variant={separatorVariant} />
          )}
        </React.Fragment>
      ))}
    </React.Fragment>
  );

  return (
    <React.Fragment>
      {classes.breadcrumbText ? (
        <span className={classes.breadcrumbText}>{breadcrumb}</span>
      ) : (
        breadcrumb
      )}
      {process.env.NODE_ENV !== 'production' && result.score && (
        <span className={classes.score}>{result.score.toFixed(2)}</span>
      )}
    </React.Fragment>
  );
}

function SearchBreadcrumbSeparator({
  className,
  variant,
}: {
  className: string;
  variant: 'filled' | 'stroked';
}) {
  if (variant === 'stroked') {
    return (
      <svg
        className={className}
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          d="M6.5 3.5 11 8l-4.5 4.5"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className={className} width="16" height="16" fill="none" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M5.47 13.03a.75.75 0 0 1 0-1.06L9.44 8 5.47 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0"
        clipRule="evenodd"
      />
    </svg>
  );
}
