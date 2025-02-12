'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Select } from '@base-ui-components/react/select';
import { Menu } from '@base-ui-components/react/menu';
import {
  SettingsMetadata,
  useExperimentSettings,
} from '../../../../components/Experiments/SettingsPanel';
import toolbarClasses from './toolbar.module.css';
import selectClasses from '../../../(public)/(content)/react/components/select/demos/hero/css-modules/index.module.css';
import tooltipClasses from '../../../(public)/(content)/react/components/tooltip/demos/hero/css-modules/index.module.css';
import menuClasses from '../../../(public)/(content)/react/components/menu/demos/submenu/css-modules/index.module.css';
import '../../../../demo-theme.css';
import {
  BoldIcon,
  ItalicsIcon,
  UnderlineIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  ArrowSvg,
  ChevronUpDownIcon,
  CheckIcon,
  MoreHorizontalIcon,
  ChevronRightIcon,
} from './_icons';

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  selectDisabled: {
    type: 'boolean',
    label: 'Select disabled',
  },
  boldDisabled: {
    type: 'boolean',
    label: 'Bold disabled',
  },
  italicsDisabled: {
    type: 'boolean',
    label: 'Italics disabled',
  },
  underlineDisabled: {
    type: 'boolean',
    label: 'Underline disabled',
  },
  menuDisabled: {
    type: 'boolean',
    label: 'Menu disabled',
  },
  toolbarDisabled: {
    type: 'boolean',
    label: 'Everything disabled',
  },
};

const TEXT = `This demo uses the render prop to render Toolbar parts as other things:
- Toolbar.Button renders Toggles, Select.Trigger, Menu.Trigger
- Toolbar.Group is used to render ToggleGroup
- The toggle buttons stack the render prop multiple times: Tooltip.Trigger > Toolbar.Button > Toggle
`;

const styles = {
  toolbar: toolbarClasses,
  tooltip: tooltipClasses,
  select: selectClasses,
  menu: menuClasses,
};

function classNames(...c: Array<string | undefined | null | false>) {
  return c.filter(Boolean).join(' ');
}

function renderToggleWithTooltip(args: {
  key: string;
  label: string;
  icon: (props: React.ComponentProps<'svg'>) => React.JSX.Element;
  disabled?: boolean;
}) {
  const { key, label, icon: Icon, disabled = false } = args;
  return (
    <Tooltip.Root key={key}>
      <Tooltip.Trigger
        render={
          <Toolbar.Button
            render={<Toggle disabled={disabled} />}
            aria-label={label}
            value={key}
            className={styles.toolbar.Toggle}
            disabled={disabled}
          >
            <Icon className={styles.toolbar.Icon} />
          </Toolbar.Button>
        }
      />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={10}>
          <Tooltip.Popup className={styles.tooltip.Popup}>
            <Tooltip.Arrow
              className={classNames(
                styles.tooltip.Arrow,
                styles.toolbar.TooltipArrow,
              )}
            >
              <ArrowSvg className={styles.toolbar.ArrowSvg} />
            </Tooltip.Arrow>
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function App() {
  const { settings } = useExperimentSettings<Settings>();
  return (
    <React.Fragment>
      <a
        className={styles.toolbar.a}
        href="https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/"
        target="_blank"
        rel="noreferrer"
      >
        <h3 className={styles.toolbar.h3}>Toolbar pattern</h3>
      </a>
      <div className={styles.toolbar.Wrapper}>
        <Tooltip.Provider>
          <Toolbar.Root className={styles.toolbar.Root}>
            <Select.Root
              defaultValue="sans"
              disabled={settings.toolbarDisabled || settings.selectDisabled}
            >
              <Toolbar.Button
                disabled={settings.toolbarDisabled || settings.selectDisabled}
                render={<Select.Trigger />}
                className={styles.select.Select}
              >
                <Select.Value placeholder="Sans-serif" />
                <Select.Icon className={styles.select.SelectIcon}>
                  <ChevronUpDownIcon />
                </Select.Icon>
              </Toolbar.Button>
              <Select.Portal>
                <Select.Positioner
                  className={styles.select.Positioner}
                  sideOffset={8}
                >
                  <Select.Popup
                    className={styles.select.Popup}
                    style={{ backgroundColor: 'var(--color-gray-50)' }}
                  >
                    <Select.Arrow className={styles.select.Arrow}>
                      <ArrowSvg className={styles.toolbar.ArrowSvg} />
                    </Select.Arrow>
                    <Select.Item className={styles.select.Item} value="sans">
                      <Select.ItemIndicator className={styles.select.ItemIndicator}>
                        <CheckIcon className={styles.select.ItemIndicatorIcon} />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.select.ItemText}>
                        Sans-serif
                      </Select.ItemText>
                    </Select.Item>
                    <Select.Item className={styles.select.Item} value="serif">
                      <Select.ItemIndicator className={styles.select.ItemIndicator}>
                        <CheckIcon className={styles.select.ItemIndicatorIcon} />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.select.ItemText}>
                        Serif
                      </Select.ItemText>
                    </Select.Item>
                    <Select.Item className={styles.select.Item} value="mono">
                      <Select.ItemIndicator className={styles.select.ItemIndicator}>
                        <CheckIcon className={styles.select.ItemIndicatorIcon} />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.select.ItemText}>
                        Monospace
                      </Select.ItemText>
                    </Select.Item>
                    <Select.Item className={styles.select.Item} value="cursive">
                      <Select.ItemIndicator className={styles.select.ItemIndicator}>
                        <CheckIcon className={styles.select.ItemIndicatorIcon} />
                      </Select.ItemIndicator>
                      <Select.ItemText className={styles.select.ItemText}>
                        Cursive
                      </Select.ItemText>
                    </Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>

            <Toolbar.Separator className={styles.toolbar.Separator} />

            <ToggleGroup
              toggleMultiple
              defaultValue={[]}
              className={styles.toolbar.ToggleGroup}
            >
              {[
                {
                  key: 'bold',
                  label: 'Bold',
                  icon: BoldIcon,
                  disabled: settings.toolbarDisabled || settings.boldDisabled,
                },
                {
                  key: 'italics',
                  label: 'Italics',
                  icon: ItalicsIcon,
                  disabled: settings.toolbarDisabled || settings.italicsDisabled,
                },
                {
                  key: 'underline',
                  label: 'Underline',
                  icon: UnderlineIcon,
                  disabled: settings.toolbarDisabled || settings.underlineDisabled,
                },
              ].map(renderToggleWithTooltip)}
            </ToggleGroup>

            <Toolbar.Separator className={styles.toolbar.Separator} />

            <ToggleGroup
              defaultValue={['left']}
              className={styles.toolbar.ToggleGroup}
              disabled={settings.toolbarDisabled}
            >
              {[
                {
                  key: 'left',
                  label: 'Align left',
                  icon: AlignLeftIcon,
                  disabled: settings.toolbarDisabled,
                },
                {
                  key: 'center',
                  label: 'Align center',
                  icon: AlignCenterIcon,
                  disabled: settings.toolbarDisabled,
                },
                {
                  key: 'right',
                  label: 'Align right',
                  icon: AlignRightIcon,
                  disabled: settings.toolbarDisabled,
                },
              ].map(renderToggleWithTooltip)}
            </ToggleGroup>

            <Toolbar.Separator className={styles.toolbar.Separator} />

            <Menu.Root>
              <Toolbar.Button
                disabled={settings.toolbarDisabled || settings.menuDisabled}
                render={
                  <Menu.Trigger
                    disabled={settings.toolbarDisabled || settings.menuDisabled}
                  />
                }
                className={styles.toolbar.More}
              >
                <MoreHorizontalIcon className={styles.toolbar.Icon} />
              </Toolbar.Button>
              <Menu.Portal>
                <Menu.Positioner
                  className={styles.menu.Positioner}
                  align="start"
                  side="inline-end"
                  sideOffset={8}
                >
                  <Menu.Popup
                    className={styles.menu.Popup}
                    style={{ backgroundColor: 'canvas' }}
                  >
                    <Menu.Arrow
                      className={styles.menu.Arrow}
                      style={{
                        color: 'canvas',
                        transform: 'rotate(-90deg) translateY(-124%)',
                      }}
                    >
                      <ArrowSvg className={styles.toolbar.ArrowSvg} />
                    </Menu.Arrow>
                    <Menu.Item className={styles.menu.Item}>Help</Menu.Item>
                    <Menu.Item className={styles.menu.Item}>
                      Keyboard Shortcuts
                    </Menu.Item>
                    <Menu.Item className={styles.menu.Item}>Release Notes</Menu.Item>
                    <Menu.Separator className={styles.menu.Separator} />
                    <Menu.Root>
                      <Menu.SubmenuTrigger className={styles.menu.SubmenuTrigger}>
                        Debug
                        <ChevronRightIcon />
                      </Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner
                          className={styles.menu.Positioner}
                          alignOffset={-4}
                          sideOffset={-4}
                        >
                          <Menu.Popup className={styles.menu.Popup}>
                            <Menu.Item className={styles.menu.Item}>
                              Show debug log
                            </Menu.Item>
                            <Menu.Item className={styles.menu.Item}>
                              Show network log
                            </Menu.Item>
                            <Menu.Item className={styles.menu.Item}>
                              Show all logs
                            </Menu.Item>
                            <Menu.Separator className={styles.menu.Separator} />
                            <Menu.Item className={styles.menu.Item}>
                              Clear cache
                            </Menu.Item>
                            <Menu.Item className={styles.menu.Item}>
                              Clear local storage
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                    <Menu.Separator className={styles.menu.Separator} />
                    <Menu.Item className={styles.menu.Item}>Log Out</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Toolbar.Root>
        </Tooltip.Provider>
        <textarea
          className={styles.toolbar.Textarea}
          name=""
          id=""
          rows={10}
          defaultValue={TEXT}
        />
      </div>
    </React.Fragment>
  );
}
