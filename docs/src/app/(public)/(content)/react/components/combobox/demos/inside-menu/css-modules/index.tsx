import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { Combobox } from '@base-ui-components/react/combobox';
import styles from './index.module.css';
import { labels } from './data';

export default function ExampleMenuCombobox() {
  const [selectedLabel, setSelectedLabel] = React.useState('feature');
  const [inputValue, setInputValue] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const filteredLabels = React.useMemo(() => {
    if (inputValue.trim() === '') {
      return labels;
    }
    return labels.filter((label) =>
      label.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [inputValue]);

  return (
    <div className={styles.Container}>
      <div className={styles.TaskCard}>
        <p className={styles.TaskInfo}>
          <span className={styles.LabelBadge}>{selectedLabel}</span>
          <span className={styles.TaskText}>Create a new project</span>
        </p>
        <Menu.Root open={open} onOpenChange={setOpen}>
          <Menu.Trigger className={styles.Button}>
            <MoreHorizontalIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              className={styles.Positioner}
              sideOffset={8}
              align="end"
            >
              <Menu.Popup className={styles.Popup}>
                <Menu.Arrow className={styles.Arrow}>
                  <ArrowSvg />
                </Menu.Arrow>
                <div className={styles.MenuLabel}>Actions</div>
                <Menu.Item className={styles.Item}>Assign to...</Menu.Item>
                <Menu.Item className={styles.Item}>Set due date...</Menu.Item>
                <Menu.Separator className={styles.Separator} />

                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                    Apply label
                    <ChevronRightIcon />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      className={styles.Positioner}
                      alignOffset={-4}
                      sideOffset={-4}
                    >
                      <Menu.Popup className={styles.ComboboxPopup}>
                        <Combobox.Root
                          open
                          value={selectedLabel}
                          onValueChange={(nextValue) => {
                            setSelectedLabel(nextValue);
                            setInputValue('');
                            setOpen(false);
                          }}
                          select="single"
                        >
                          <div className={styles.InputContainer}>
                            <Combobox.Input
                              placeholder="Filter label..."
                              className={styles.Input}
                              value={inputValue}
                              onChange={(event) => {
                                React.startTransition(() => {
                                  setInputValue(event.target.value);
                                });
                              }}
                            />
                          </div>
                          <Combobox.Status className={styles.NoResults}>
                            {filteredLabels.length === 0 && (
                              <div>No label found.</div>
                            )}
                          </Combobox.Status>
                          <Combobox.List className={styles.List}>
                            {filteredLabels.map((label) => (
                              <Combobox.Item
                                key={label}
                                value={label}
                                className={styles.ComboboxItem}
                              >
                                <Combobox.ItemIndicator
                                  className={styles.ItemIndicator}
                                >
                                  <CheckIcon className={styles.ItemIndicatorIcon} />
                                </Combobox.ItemIndicator>
                                <div className={styles.ItemText}>{label}</div>
                              </Combobox.Item>
                            ))}
                          </Combobox.List>
                        </Combobox.Root>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </div>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
}

function MoreHorizontalIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentcolor" strokeWidth="1.5" />
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
