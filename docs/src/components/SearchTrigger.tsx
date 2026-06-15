'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Search } from './Search';
import './SearchTrigger.css';

interface SearchTriggerProps {
  className?: string;
  containedScroll?: boolean;
  enableKeyboardShortcut?: boolean;
}

export function SearchTrigger({ className, ...props }: SearchTriggerProps) {
  return (
    <Search triggerProps={{ className: clsx('SearchTrigger', className) }} {...props}>
      {({ isCmd }) => (
        <React.Fragment>
          Search
          <span className="SearchTriggerShortcut">
            ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
            <kbd>k</kbd>)
          </span>
        </React.Fragment>
      )}
    </Search>
  );
}
