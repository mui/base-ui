import * as React from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { Select } from '@base-ui/react/select';
import styles from './index.module.css';

export default function ExampleToolbar() {
  return (
    <Toolbar.Root className={styles.Toolbar}>
      <ToggleGroup className={styles.Group} aria-label="Alignment">
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align left"
          value="align-left"
          className={styles.Button}
        >
          Align Left
        </Toolbar.Button>
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align right"
          value="align-right"
          className={styles.Button}
        >
          Align Right
        </Toolbar.Button>
      </ToggleGroup>
      <Toolbar.Separator className={styles.Separator} />
      <Toolbar.Group className={styles.Group} aria-label="Numerical format">
        <Toolbar.Button className={styles.Button} aria-label="Format as currency">
          $
        </Toolbar.Button>
        <Toolbar.Button className={styles.Button} aria-label="Format as percent">
          %
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator className={styles.Separator} />
      <Select.Root defaultValue="Helvetica">
        <Toolbar.Button render={<Select.Trigger />} className={styles.Button}>
          <Select.Value />
          <Select.Icon className={styles.SelectIcon}>
            <ChevronUpDownIcon />
          </Select.Icon>
        </Toolbar.Button>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={8}>
            <Select.Popup className={styles.Popup}>
              <Select.Item className={styles.Item} value="Helvetica">
                <Select.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={styles.ItemText}>Helvetica</Select.ItemText>
              </Select.Item>
              <Select.Item className={styles.Item} value="Arial">
                <Select.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={styles.ItemText}>Arial</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Toolbar.Separator className={styles.Separator} />
      <Toolbar.Link className={styles.Link} href="#">
        Edited 51m ago
      </Toolbar.Link>
    </Toolbar.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
