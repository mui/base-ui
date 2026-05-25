'use client';
import * as React from 'react';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { SearchTrigger as SearchTrigger_ } from './Search';

export function SearchTrigger() {
  return (
    <SearchTrigger_ className="SearchTrigger" aria-label="Search">
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
    </SearchTrigger_>
  );
}
