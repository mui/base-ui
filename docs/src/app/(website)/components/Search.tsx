'use client';
import * as React from 'react';

import { Search as Search_ } from 'docs/src/components/Search';
import './Search.css';

export function Search() {
  return (
    <Search_
      containedScroll
      enableKeyboardShortcut
      triggerProps={{ className: 'WebsiteSearchTrigger Text sz-1' }}
    >
      {({ isCmd }) => (
        <React.Fragment>
          Search [{isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
          <kbd>k</kbd>]
        </React.Fragment>
      )}
    </Search_>
  );
}
