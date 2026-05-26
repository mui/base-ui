'use client';
import * as React from 'react';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { Search } from './Search';

interface HeaderSearchProps {
  containedScroll?: boolean;
  enableKeyboardShortcut?: boolean;
}

export function HeaderSearch(props: HeaderSearchProps) {
  return (
    <Search triggerProps={{ className: 'SearchTrigger', 'aria-label': 'Search' }} {...props}>
      {({ isCmd }) => (
        <React.Fragment>
          <MagnifyingGlassIcon className="SearchTriggerIcon" />
          <div className="SearchTriggerKbd">
            {isCmd ? (
              <kbd className="SearchTriggerCmd">⌘</kbd>
            ) : (
              <React.Fragment>
                <kbd className="SearchTriggerCtrl">Ctrl</kbd>
                <span className="SearchTriggerPlus">+</span>
              </React.Fragment>
            )}
            <kbd className="SearchTriggerK">K</kbd>
          </div>
        </React.Fragment>
      )}
    </Search>
  );
}
