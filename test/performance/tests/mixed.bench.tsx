import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Select } from '@base-ui/react/select';
import { Slider } from '@base-ui/react/slider';
import { Tabs } from '@base-ui/react/tabs';
import { Tooltip } from '@base-ui/react/tooltip';
import { benchmark } from '@mui/internal-benchmark';
import { createRows } from './shared';
import checkboxStyles from './styles/checkbox.module.css';
import dialogStyles from './styles/dialog.module.css';
import menuStyles from './styles/menu.module.css';
import popoverStyles from './styles/popover.module.css';
import scrollAreaStyles from './styles/scroll-area.module.css';
import selectStyles from './styles/select.module.css';
import sliderStyles from './styles/slider.module.css';
import tabsStyles from './styles/tabs.module.css';
import tooltipStyles from './styles/tooltip.module.css';

const tooltipRows = createRows(200, 'Tooltip');
const checkboxRows = createRows(40, 'Checkbox');
const menuRows = createRows(24, 'Menu');
const popoverRows = createRows(16, 'Popover');
const selectRows = createRows(12, 'Select');
const dialogRows = createRows(8, 'Dialog');
const tabsRows = createRows(8, 'Tabs');
const sliderRows = createRows(12, 'Slider');
const scrollAreaRows = createRows(10, 'Scroll area');
const listItems = createRows(5, 'Option');
const tabValues = ['overview', 'details', 'activity'] as const;

function MixedSurface() {
  return (
    <div>
      <section>
        {tooltipRows.map((row) => (
          <Tooltip.Root key={`tooltip-${row.id}`}>
            <Tooltip.Trigger
              delay={0}
              aria-label={`Open tooltip ${row.id}`}
              className={tooltipStyles.Button}
            >
              {row.label}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={8}>
                <Tooltip.Popup className={tooltipStyles.Popup}>
                  Tooltip for {row.label}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </section>

      <section>
        {menuRows.map((row) => (
          <Menu.Root key={`menu-${row.id}`}>
            <Menu.Trigger aria-label={`Open menu ${row.id}`} className={menuStyles.Button}>
              {row.label}
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={8} className={menuStyles.Positioner}>
                <Menu.Popup className={menuStyles.Popup}>
                  {listItems.map((item) => (
                    <Menu.Item key={item.id} className={menuStyles.Item}>
                      {item.label}
                    </Menu.Item>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ))}

        {popoverRows.map((row) => (
          <Popover.Root key={`popover-${row.id}`}>
            <Popover.Trigger
              aria-label={`Open popover ${row.id}`}
              className={popoverStyles.IconButton}
            >
              {row.label}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner sideOffset={8} className={popoverStyles.Positioner}>
                <Popover.Popup className={popoverStyles.Popup}>
                  <Popover.Title className={popoverStyles.Title}>{row.label}</Popover.Title>
                  <Popover.Description className={popoverStyles.Description}>
                    Popover content
                  </Popover.Description>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ))}

        {selectRows.map((row) => (
          <Select.Root key={`select-${row.id}`} items={listItems}>
            <Select.Trigger aria-label={`Open select ${row.id}`} className={selectStyles.Select}>
              <Select.Value placeholder={row.label} className={selectStyles.Value} />
              <Select.Icon className={selectStyles.SelectIcon}>v</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner sideOffset={8} className={selectStyles.Positioner}>
                <Select.Popup className={selectStyles.Popup}>
                  <Select.List className={selectStyles.List}>
                    {listItems.map((item) => (
                      <Select.Item key={item.id} value={item.value} className={selectStyles.Item}>
                        <Select.ItemIndicator className={selectStyles.ItemIndicator} />
                        <Select.ItemText className={selectStyles.ItemText}>
                          {item.label}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        ))}

        {dialogRows.map((row) => (
          <Dialog.Root key={`dialog-${row.id}`}>
            <Dialog.Trigger aria-label={`Open dialog ${row.id}`} className={dialogStyles.Button}>
              {row.label}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className={dialogStyles.Backdrop} />
              <Dialog.Popup className={dialogStyles.Popup}>
                <Dialog.Title className={dialogStyles.Title}>{row.label}</Dialog.Title>
                <Dialog.Description className={dialogStyles.Description}>
                  Dialog content
                </Dialog.Description>
                <div className={dialogStyles.Actions}>
                  <Dialog.Close className={dialogStyles.Button}>Close</Dialog.Close>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ))}
      </section>

      <section>
        {tabsRows.map((row) => (
          <Tabs.Root key={`tabs-${row.id}`} defaultValue={tabValues[0]} className={tabsStyles.Tabs}>
            <Tabs.List aria-label={row.label} className={tabsStyles.List}>
              {tabValues.map((value) => (
                <Tabs.Tab key={value} value={value} className={tabsStyles.Tab}>
                  {value}
                </Tabs.Tab>
              ))}
              <Tabs.Indicator className={tabsStyles.Indicator} />
            </Tabs.List>
            {tabValues.map((value) => (
              <Tabs.Panel key={value} value={value} className={tabsStyles.Panel}>
                {row.label} {value}
              </Tabs.Panel>
            ))}
          </Tabs.Root>
        ))}

        {sliderRows.map((row) => (
          <Slider.Root key={`slider-${row.id}`} defaultValue={50}>
            <Slider.Value />
            <Slider.Control aria-label={row.label} className={sliderStyles.Control}>
              <Slider.Track className={sliderStyles.Track}>
                <Slider.Indicator className={sliderStyles.Indicator} />
                <Slider.Thumb className={sliderStyles.Thumb} />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        ))}

        {scrollAreaRows.map((row) => (
          <ScrollArea.Root
            key={`scroll-area-${row.id}`}
            className={scrollAreaStyles.ScrollArea}
            style={{ width: 120, height: 120, overflow: 'hidden', position: 'relative' }}
          >
            <ScrollArea.Viewport className={scrollAreaStyles.Viewport}>
              <ScrollArea.Content className={scrollAreaStyles.Content}>
                <div style={{ width: 240, height: 240 }}>{row.label}</div>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className={scrollAreaStyles.Scrollbar}>
              <ScrollArea.Thumb className={scrollAreaStyles.Thumb} />
            </ScrollArea.Scrollbar>
            <ScrollArea.Scrollbar orientation="horizontal" className={scrollAreaStyles.Scrollbar}>
              <ScrollArea.Thumb className={scrollAreaStyles.Thumb} />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner />
          </ScrollArea.Root>
        ))}

        {checkboxRows.map((row) => (
          <Checkbox.Root
            key={`checkbox-${row.id}`}
            aria-label={row.label}
            className={checkboxStyles.Checkbox}
          >
            <Checkbox.Indicator className={checkboxStyles.Indicator} />
          </Checkbox.Root>
        ))}
      </section>
    </div>
  );
}

benchmark('Mixed surface mount (app-like density)', () => <MixedSurface />);
