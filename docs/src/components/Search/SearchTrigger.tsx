'use client';
import * as React from 'react';
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
          Search
          {enableKeyboardShortcut && (
            <span className="SearchTriggerShortcut">
              ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
              <kbd>k</kbd>)
            </span>
          )}
        </React.Fragment>
      )}
    </Search>
  );
}
