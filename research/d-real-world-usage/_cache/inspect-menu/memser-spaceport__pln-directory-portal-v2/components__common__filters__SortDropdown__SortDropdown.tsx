import React from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import s from './SortDropdown.module.scss';

export interface SortOption {
  value: string;
  label: React.ReactNode;
}

interface SortDropdownProps {
  options: readonly SortOption[];
  currentSort: string;
  onSortChange: (sort: string) => void;
  className?: string;
  /** When set, shows this text before the dropdown (e.g. "Sort by:"). */
  sortByLabel?: string;
}

export function SortDropdown({ options, currentSort, onSortChange, className, sortByLabel }: SortDropdownProps) {
  const currentLabel = options.find((o) => o.value === currentSort)?.label || options[0]?.label;

  const dropdown = (
    <Menu.Root modal={false}>
      <Menu.Trigger className={clsx(s.trigger, className)}>
        {currentLabel}
        <svg className={s.caret} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} align="end" sideOffset={4}>
          <Menu.Popup className={s.menu}>
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                className={clsx(s.option, currentSort === option.value && s.optionActive)}
                onClick={() => onSortChange(option.value)}
              >
                {option.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );

  if (!sortByLabel) {
    return dropdown;
  }

  return (
    <div className={s.sortGroup}>
      <span className={s.sortByLabel}>{sortByLabel}</span>
      {dropdown}
    </div>
  );
}
