'use client';
import * as React from 'react';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { Search } from './Search';

interface SearchTriggerProps {
  containedScroll?: boolean;
  enableKeyboardShortcut?: boolean;
}

export function SearchTrigger({ enableKeyboardShortcut, ...props }: SearchTriggerProps) {
  return (
    <Search
      triggerProps={{ className: 'SearchTrigger', 'aria-label': 'Search' }}
      enableKeyboardShortcut={enableKeyboardShortcut}
      {...props}
    >
      {({ isCmd }) => (
        <React.Fragment>
          <span className="SearchTriggerIcon">
            <MagnifyingGlassIcon aria-hidden="true" />
          </span>
          <span className="SearchTriggerText">
            Search
            {enableKeyboardShortcut && (
              <span className="SearchTriggerShortcut">
                ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
                <kbd>k</kbd>)
              </span>
            )}
          </span>
        </React.Fragment>
      )}
    </Search>
  );
}
