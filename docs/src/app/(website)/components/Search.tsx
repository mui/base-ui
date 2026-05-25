'use client';
import * as React from 'react';

import { SearchTrigger as SearchTrigger_ } from 'docs/src/components/Search';
import './Search.css';

export function SearchTrigger() {
  return (
    <SearchTrigger_ className="WebsiteSearchTrigger Text sz-1">
      {({ isCmd }) => (
        <React.Fragment>
          Search [{isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
          <kbd>k</kbd>]
        </React.Fragment>
      )}
    </SearchTrigger_>
  );
}
