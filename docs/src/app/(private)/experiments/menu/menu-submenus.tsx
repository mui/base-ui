'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import '../../../../demo-data/theme/css-modules/theme.css';
import classes from './menu.module.css';

interface Settings {
  customAnchor: boolean;
  modal: boolean;
  openOnHover: boolean;
  disabled: boolean;
  customTriggerElement: boolean;
  side: Menu.Positioner.Props['side'];
  align: Menu.Positioner.Props['align'];
}

type MenuPopupPropsWithDataAttributes = React.ComponentProps<typeof Menu.Popup> &
  Partial<Record<`data-${string}`, string | undefined>>;

export default function MenuSubmenus() {
  const { settings } = useExperimentSettings<Settings>();

  const anchorRef = React.useRef<HTMLDivElement>(null);

  const triggerRender = React.useMemo(
    () => (settings.customTriggerElement ? <span /> : undefined),
    [settings.customTriggerElement],
  );

  const handleItemClick = useStableCallback((event: React.MouseEvent<HTMLDivElement>) => {
    console.log(`${event.currentTarget.textContent} clicked`);
  });

  const renderMenu = (
    label: string,
    submenuTriggerDelay?: Menu.SubmenuTrigger.Props['delay'],
    submenuTriggerClassName: string = classes.SubmenuTrigger,
    popupClassName: string = classes.Popup,
    popupProps: MenuPopupPropsWithDataAttributes = {},
  ) => (
    <Menu.Root modal={settings.modal} disabled={settings.disabled}>
      <Menu.Trigger
        className={classes.Button}
        render={triggerRender}
        nativeButton={triggerRender === undefined}
        openOnHover={settings.openOnHover}
      >
        {label} <ChevronDownIcon className={classes.ButtonIcon} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={classes.Positioner}
          sideOffset={8}
          anchor={settings.customAnchor ? anchorRef : undefined}
          side={settings.side}
          align={settings.align}
        >
          <Menu.Popup
            className={popupClassName}
            style={{ maxHeight: 'var(--available-height)', overflowY: 'scroll' }}
            {...popupProps}
          >
            {Array.from({ length: 50 }).map((_, submenuIndex) => (
              <Menu.SubmenuRoot key={submenuIndex}>
                <Menu.SubmenuTrigger
                  className={submenuTriggerClassName}
                  delay={submenuTriggerDelay}
                >
                  Submenu test index {submenuIndex + 1}
                  <ChevronRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={classes.Positioner} sideOffset={8}>
                    <Menu.Popup className={popupClassName}>
                      {Array.from({ length: 12 }).map((__, itemIndex) => (
                        <Menu.SubmenuRoot key={itemIndex}>
                          <Menu.SubmenuTrigger
                            className={submenuTriggerClassName}
                            delay={submenuTriggerDelay}
                          >
                            Submenu test index {submenuIndex + 1} - Item {itemIndex + 1}
                            <ChevronRightIcon />
                          </Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner className={classes.Positioner} sideOffset={8}>
                              <Menu.Popup className={popupClassName}>
                                {Array.from({ length: 8 }).map((___, nestedIndex) => (
                                  <Menu.Item
                                    key={nestedIndex}
                                    className={classes.Item}
                                    onClick={handleItemClick}
                                  >
                                    Nested submenu {submenuIndex + 1}.{itemIndex + 1} - Item{' '}
                                    {nestedIndex + 1}
                                  </Menu.Item>
                                ))}
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      ))}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );

  return (
    <div>
      <style>
        {`
          [data-ending-style-popup] {
            transition:
              transform 440ms cubic-bezier(0.2, 0.8, 0.2, 1),
              opacity 440ms cubic-bezier(0.2, 0.8, 0.2, 1);
          }

          [data-ending-style-popup][data-starting-style] {
            opacity: 0;
            transform: translateX(-48px) scale(0.96);
          }

          [data-ending-style-popup][data-ending-style] {
            opacity: 0;
            transform: translateX(48px) scale(0.96);
          }
        `}
      </style>
      <h1>Many adjacent submenus</h1>
      <div className={classes.TriggerRow}>
        {renderMenu('Menu')}
        {renderMenu(
          'Menu (submenu delay=0)',
          0,
          `${classes.SubmenuTrigger} ${classes.PopupOpenAsHighlighted}`,
          `${classes.Popup} ${classes.PopupNoAnimation}`,
        )}
        {renderMenu('Menu (ending style)', undefined, classes.SubmenuTrigger, classes.Popup, {
          'data-ending-style-popup': '',
        })}
      </div>

      {settings.customAnchor && (
        <div className={classes.CustomAnchor} ref={anchorRef}>
          Menu will be anchored here
        </div>
      )}
    </div>
  );
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  customAnchor: {
    type: 'boolean',
    label: 'Custom anchor',
  },
  modal: {
    type: 'boolean',
    label: 'Modal',
    default: true,
  },
  openOnHover: {
    type: 'boolean',
    label: 'Open on hover',
  },
  disabled: {
    type: 'boolean',
    label: 'Disabled',
  },
  customTriggerElement: {
    type: 'boolean',
    label: 'Trigger as <span>',
  },
  side: {
    type: 'string',
    label: 'Side',
    options: ['top', 'right', 'bottom', 'left'],
    default: 'bottom',
  },
  align: {
    type: 'string',
    label: 'Align',
    options: ['start', 'center', 'end'],
    default: 'center',
  },
};

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
