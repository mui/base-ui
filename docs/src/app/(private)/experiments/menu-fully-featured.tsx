'use client';
import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { OptionsPanel } from './infra/OptionsPanel';
import '../../../demo-theme.css';
import classes from './menu.module.css';

type Options = Partial<Record<'customAnchor' | 'modal' | 'openOnHover', boolean>>;

const settings: OptionsPanel.Props['settings'] = [
  {
    type: 'boolean',
    key: 'customAnchor',
    label: 'Custom anchor',
    initialValue: false,
  },
  {
    type: 'boolean',
    key: 'modal',
    label: 'Modal',
    initialValue: true,
  },
  {
    type: 'boolean',
    key: 'openOnHover',
    label: 'Open on hover',
    initialValue: false,
  },
];

export default function MenuFullyFeatured() {
  const [options, setOptions] = React.useState<Options>({});

  const anchorRef = React.useRef<HTMLDivElement>(null);

  return (
    <div>
      <Menu.Root openOnHover={options.openOnHover} modal={options.modal}>
        <Menu.Trigger className={classes.Button}>
          Menu <ChevronDownIcon className={classes.ButtonIcon} />
        </Menu.Trigger>
        <Menu.Portal keepMounted>
          <Menu.Positioner
            className={classes.Positioner}
            sideOffset={8}
            anchor={options.customAnchor ? anchorRef : undefined}
          >
            <Menu.Popup className={classes.Popup}>
              <Menu.Arrow className={classes.Arrow}>
                <ArrowIcon />
              </Menu.Arrow>
              <Menu.Item className={classes.Item}>Item</Menu.Item>
              <Menu.Item className={classes.Item}>Item</Menu.Item>
              <Menu.Separator className={classes.Separator} />
              <Menu.Item className={classes.Item} closeOnClick={false}>
                Item (close on click disabled)
              </Menu.Item>
              <Menu.Item className={classes.Item} disabled>
                Disabled Item
              </Menu.Item>
              <Menu.Separator className={classes.Separator} />

              <Menu.Root>
                <Menu.SubmenuTrigger className={classes.SubmenuTrigger}>
                  Nested menu
                  <ChevronRightIcon />
                </Menu.SubmenuTrigger>

                <Menu.Portal>
                  <Menu.Positioner className={classes.Positioner} sideOffset={8}>
                    <Menu.Popup className={classes.Popup}>
                      <Menu.Group>
                        <Menu.GroupLabel className={classes.GroupLabel}>
                          Radio items
                        </Menu.GroupLabel>
                        <Menu.RadioGroup>
                          <Menu.RadioItem className={classes.RadioItem} value="date">
                            <Menu.RadioItemIndicator
                              className={classes.RadioItemIndicator}
                            >
                              <CheckIcon
                                className={classes.RadioItemIndicatorIcon}
                              />
                            </Menu.RadioItemIndicator>
                            <span className={classes.RadioItemText}>Option 1</span>
                          </Menu.RadioItem>
                          <Menu.RadioItem className={classes.RadioItem} value="name">
                            <Menu.RadioItemIndicator
                              className={classes.RadioItemIndicator}
                            >
                              <CheckIcon
                                className={classes.RadioItemIndicatorIcon}
                              />
                            </Menu.RadioItemIndicator>
                            <span className={classes.RadioItemText}>Option 2</span>
                          </Menu.RadioItem>
                          <Menu.RadioItem
                            className={classes.RadioItem}
                            value="type"
                            closeOnClick
                          >
                            <Menu.RadioItemIndicator
                              className={classes.RadioItemIndicator}
                            >
                              <CheckIcon
                                className={classes.RadioItemIndicatorIcon}
                              />
                            </Menu.RadioItemIndicator>
                            <span className={classes.RadioItemText}>
                              Option 3 (close on click)
                            </span>
                          </Menu.RadioItem>
                        </Menu.RadioGroup>
                      </Menu.Group>

                      <Menu.Separator className={classes.Separator} />

                      <Menu.Group>
                        <Menu.GroupLabel className={classes.GroupLabel}>
                          Checkbox Items
                        </Menu.GroupLabel>
                        <Menu.CheckboxItem className={classes.CheckboxItem}>
                          <Menu.CheckboxItemIndicator
                            className={classes.CheckboxItemIndicator}
                          >
                            <CheckIcon
                              className={classes.CheckboxItemIndicatorIcon}
                            />
                          </Menu.CheckboxItemIndicator>
                          <span className={classes.CheckboxItemText}>Option A</span>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem className={classes.CheckboxItem}>
                          <Menu.CheckboxItemIndicator
                            className={classes.CheckboxItemIndicator}
                          >
                            <CheckIcon
                              className={classes.CheckboxItemIndicatorIcon}
                            />
                          </Menu.CheckboxItemIndicator>
                          <span className={classes.CheckboxItemText}>Option B</span>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem
                          className={classes.CheckboxItem}
                          closeOnClick
                        >
                          <Menu.CheckboxItemIndicator
                            className={classes.CheckboxItemIndicator}
                          >
                            <CheckIcon
                              className={classes.CheckboxItemIndicatorIcon}
                            />
                          </Menu.CheckboxItemIndicator>
                          <span className={classes.CheckboxItemText}>
                            Option C (close on click)
                          </span>
                        </Menu.CheckboxItem>
                      </Menu.Group>

                      <Menu.Separator className={classes.Separator} />

                      <Menu.Root>
                        <Menu.SubmenuTrigger className={classes.SubmenuTrigger}>
                          Nested menu
                          <ChevronRightIcon />
                        </Menu.SubmenuTrigger>
                        <Menu.Portal>
                          <Menu.Positioner
                            className={classes.Positioner}
                            sideOffset={8}
                          >
                            <Menu.Popup className={classes.Popup}>
                              <Menu.Item className={classes.Item}>
                                Submenu item
                              </Menu.Item>
                              <Menu.Item className={classes.Item}>
                                Submenu item
                              </Menu.Item>
                              <Menu.Item className={classes.Item}>
                                Submenu item
                              </Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {options.customAnchor && (
        <div className={classes.CustomAnchor} ref={anchorRef}>
          Menu will be anchored here
        </div>
      )}

      <OptionsPanel settings={settings} onChange={setOptions} />
    </div>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
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

function ArrowIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={classes.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={classes.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={classes.ArrowInnerStroke}
      />
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
