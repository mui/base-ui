'use client';

import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { Select } from '@base-ui/react/select';
import classes from './ToolbarSelect.module.css';

export interface ToolbarSelectItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface ToolbarSelectProps {
  value: string;
  onValueChange: (value: string | null) => void;
  items: ToolbarSelectItem[];
  'aria-label'?: string | undefined;
  className?: string | undefined;
  placeholder?: string | undefined;
}

export function ToolbarSelect(props: ToolbarSelectProps) {
  const { value, onValueChange, items, 'aria-label': ariaLabel, className, placeholder } = props;

  const isSelected = React.useMemo(() => {
    return items.some((item) => item.value === value && value !== '' && value !== 'none');
  }, [items, value]);

  const handleValueChange = React.useCallback(
    (nextValue: string | null) => {
      if (nextValue === value) {
        // Toggle off if clicking the same value
        onValueChange(null);
      } else {
        onValueChange(nextValue);
      }
    },
    [onValueChange, value],
  );

  const displayIcon = React.useMemo(() => {
    const activeItem = items.find((i) => i.value === value);
    if (activeItem?.icon) {
      return activeItem.icon;
    }
    // If no active item with an icon, default to the first item's icon if it exists
    return items[0]?.icon || placeholder;
  }, [items, value, placeholder]);

  return (
    <Select.Root value={value} onValueChange={handleValueChange}>
      <Select.Trigger
        render={
          <Button className={className} data-selected={isSelected} aria-pressed={isSelected} aria-label={ariaLabel}>
            <span className={classes.icon}>{displayIcon}</span>
          </Button>
        }
      />
      <Select.Portal>
        <Select.Positioner sideOffset={4} align="start" alignItemWithTrigger>
          <Select.Popup className={classes.popup}>
            <Select.List>
              {items.map((item) => (
                <Select.Item key={item.value} value={item.value} className={classes.item}>
                  <span className={classes.itemContent}>
                    {item.icon && <span className={classes.icon}>{item.icon}</span>}
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </span>
                  <Select.ItemIndicator className={classes.indicator}>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 5L4 7L8 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
