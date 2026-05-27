'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { Tooltip } from '@base-ui/react/tooltip';
import { Popover } from '@base-ui/react/popover';
import { Dialog } from '@base-ui/react/dialog';
import {
  DropdownMenu as RadixDropdownMenu,
  Tooltip as RadixTooltip,
  Popover as RadixPopover,
  Dialog as RadixDialog,
} from 'radix-ui';
import {
  SettingsMetadata,
  useExperimentSettings,
} from 'docs/src/components/Experiments/SettingsPanel';
import menuDemoStyles from 'docs/src/app/(public)/(content)/react/components/menu/demos/submenu/css-modules/index.module.css';
import tooltipDemoStyles from 'docs/src/app/(public)/(content)/react/components/tooltip/demos/hero/css-modules/index.module.css';
import popoverDemoStyles from 'docs/src/app/(public)/(content)/react/components/popover/demos/_index.module.css';
import dialogDemoStyles from 'docs/src/app/(public)/(content)/react/components/dialog/demos/_index.module.css';
import PerformanceBenchmark, { BenchmarkVariant } from './utils/benchmark';
import styles from './performance.module.css';

interface Settings {
  renderDialog: boolean;
  renderMenu: boolean;
  renderPopover: boolean;
  renderTooltip: boolean;
}

interface RowData {
  label: string;
  index: number;
}

const ROW_COUNT = 500;
const MENU_ITEM_COUNT = 50;

const rows: RowData[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
  label: `Row ${i + 1}`,
  index: i + 1,
}));

const menuItems = Array.from({ length: MENU_ITEM_COUNT }, (_, i) => ({
  label: `Menu Item ${i + 1}`,
  index: i + 1,
}));

const rowMenuHandle = Menu.createHandle<RowData>();
const rowTooltipHandle = Tooltip.createHandle<RowData>();
const rowPopoverHandle = Popover.createHandle<RowData>();
const rowDialogHandle = Dialog.createHandle<RowData>();

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={menuDemoStyles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={menuDemoStyles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={menuDemoStyles.ArrowInnerStroke}
      />
    </svg>
  );
}

/* -----------------------------------------------------------------
 * Base UI — contained triggers (a Root per row)
 * ----------------------------------------------------------------- */

function ContainedRowMenu({ rowData }: { rowData: RowData }) {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.TriggerButton}>Menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} className={menuDemoStyles.Positioner}>
          <Menu.Popup className={menuDemoStyles.Popup}>
            <Menu.Arrow className={menuDemoStyles.Arrow}>
              <ArrowSvg />
            </Menu.Arrow>
            {menuItems.map((item) => (
              <Menu.Item
                key={item.index}
                onClick={() => console.log(`Clicked ${item.label} for ${rowData.label}`)}
                className={menuDemoStyles.Item}
              >
                {item.label} for {rowData.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ContainedRowPopover({ rowData }: { rowData: RowData }) {
  return (
    <Popover.Root>
      <Popover.Trigger className={styles.TriggerButton}>Popover</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className={popoverDemoStyles.Positioner}>
          <Popover.Popup className={popoverDemoStyles.Popup}>
            <Popover.Arrow className={popoverDemoStyles.Arrow}>
              <ArrowSvg />
            </Popover.Arrow>
            <div>Popover for {rowData.label}</div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ContainedRowTooltip({ rowData }: { rowData: RowData }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger className={styles.TriggerButton}>Tooltip</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={10}>
          <Tooltip.Popup className={tooltipDemoStyles.Popup}>
            <Tooltip.Arrow className={tooltipDemoStyles.Arrow}>
              <ArrowSvg />
            </Tooltip.Arrow>
            Tooltip for {rowData.label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function ContainedRowDialog({ rowData }: { rowData: RowData }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.TriggerButton}>Dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogDemoStyles.Backdrop} />
        <Dialog.Popup className={dialogDemoStyles.Popup}>
          <Dialog.Title className={dialogDemoStyles.Title}>Dialog</Dialog.Title>
          <Dialog.Description className={dialogDemoStyles.Description}>
            Dialog content for {rowData.label}
          </Dialog.Description>
          <div className={dialogDemoStyles.Actions}>
            <Dialog.Close className={dialogDemoStyles.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ContainedTriggers() {
  const { settings } = useExperimentSettings<Settings>();
  const { renderMenu, renderTooltip, renderPopover, renderDialog } = settings;
  return (
    <div className={styles.Rows}>
      {rows.map((row) => (
        <div key={row.index} className={styles.Row}>
          <span className={styles.RowLabel}>{row.label}</span>
          <span className={styles.Actions}>
            {renderDialog && <ContainedRowDialog rowData={row} />}
            {renderMenu && <ContainedRowMenu rowData={row} />}
            {renderPopover && <ContainedRowPopover rowData={row} />}
            {renderTooltip && <ContainedRowTooltip rowData={row} />}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -----------------------------------------------------------------
 * Base UI — detached triggers (single Root + handles)
 * ----------------------------------------------------------------- */

function DetachedMenuPopup() {
  return (
    <Menu.Root handle={rowMenuHandle}>
      {({ payload: rowData }) => (
        <Menu.Portal>
          <Menu.Positioner sideOffset={8} className={menuDemoStyles.Positioner}>
            <Menu.Popup className={menuDemoStyles.Popup}>
              <Menu.Arrow className={menuDemoStyles.Arrow}>
                <ArrowSvg />
              </Menu.Arrow>
              {rowData &&
                menuItems.map((item) => (
                  <Menu.Item
                    key={item.index}
                    onClick={() => console.log(`Clicked ${item.label} for ${rowData.label}`)}
                    className={menuDemoStyles.Item}
                  >
                    {item.label} for {rowData.label}
                  </Menu.Item>
                ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      )}
    </Menu.Root>
  );
}

function DetachedTooltipPopup() {
  return (
    <Tooltip.Root handle={rowTooltipHandle}>
      {({ payload: rowData }) =>
        rowData ? (
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10}>
              <Tooltip.Popup className={tooltipDemoStyles.Popup}>
                <Tooltip.Arrow className={tooltipDemoStyles.Arrow}>
                  <ArrowSvg />
                </Tooltip.Arrow>
                Tooltip for {rowData.label}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        ) : null
      }
    </Tooltip.Root>
  );
}

function DetachedPopoverPopup() {
  return (
    <Popover.Root handle={rowPopoverHandle}>
      {({ payload: rowData }) => (
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} className={popoverDemoStyles.Positioner}>
            <Popover.Popup className={popoverDemoStyles.Popup}>
              <Popover.Arrow className={popoverDemoStyles.Arrow}>
                <ArrowSvg />
              </Popover.Arrow>
              {rowData && <div>Popover for {rowData.label}</div>}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
}

function DetachedDialogPopup() {
  return (
    <Dialog.Root handle={rowDialogHandle}>
      {({ payload: rowData }) =>
        rowData ? (
          <Dialog.Portal>
            <Dialog.Backdrop className={dialogDemoStyles.Backdrop} />
            <Dialog.Popup className={dialogDemoStyles.Popup}>
              <Dialog.Title className={dialogDemoStyles.Title}>Dialog</Dialog.Title>
              <Dialog.Description className={dialogDemoStyles.Description}>
                Dialog content for {rowData.label}
              </Dialog.Description>
              <div className={dialogDemoStyles.Actions}>
                <Dialog.Close className={dialogDemoStyles.Button}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        ) : null
      }
    </Dialog.Root>
  );
}

function DetachedTriggers() {
  const { settings } = useExperimentSettings<Settings>();
  const { renderMenu, renderTooltip, renderPopover, renderDialog } = settings;
  return (
    <React.Fragment>
      <div className={styles.Rows}>
        {rows.map((row) => (
          <div key={row.index} className={styles.Row}>
            <span className={styles.RowLabel}>{row.label}</span>
            <span className={styles.Actions}>
              {renderDialog && (
                <Dialog.Trigger
                  handle={rowDialogHandle}
                  payload={row}
                  className={styles.TriggerButton}
                >
                  Dialog
                </Dialog.Trigger>
              )}
              {renderMenu && (
                <Menu.Trigger handle={rowMenuHandle} payload={row} className={styles.TriggerButton}>
                  Menu
                </Menu.Trigger>
              )}
              {renderPopover && (
                <Popover.Trigger
                  handle={rowPopoverHandle}
                  payload={row}
                  className={styles.TriggerButton}
                >
                  Popover
                </Popover.Trigger>
              )}
              {renderTooltip && (
                <Tooltip.Trigger
                  handle={rowTooltipHandle}
                  payload={row}
                  className={styles.TriggerButton}
                >
                  Tooltip
                </Tooltip.Trigger>
              )}
            </span>
          </div>
        ))}
      </div>
      {renderDialog && <DetachedDialogPopup />}
      {renderMenu && <DetachedMenuPopup />}
      {renderPopover && <DetachedPopoverPopup />}
      {renderTooltip && <DetachedTooltipPopup />}
    </React.Fragment>
  );
}

/* -----------------------------------------------------------------
 * Radix — baseline
 * ----------------------------------------------------------------- */

function RadixRowMenu({ rowData }: { rowData: RowData }) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger className={styles.TriggerButton}>Menu</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content sideOffset={8} className={menuDemoStyles.Popup}>
          <RadixDropdownMenu.Arrow asChild className={menuDemoStyles.Arrow}>
            <ArrowSvg />
          </RadixDropdownMenu.Arrow>
          {menuItems.map((item) => (
            <RadixDropdownMenu.Item
              key={item.index}
              onSelect={() => console.log(`Clicked ${item.label} for ${rowData.label}`)}
              className={menuDemoStyles.Item}
            >
              {item.label} for {rowData.label}
            </RadixDropdownMenu.Item>
          ))}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}

function RadixRowPopover({ rowData }: { rowData: RowData }) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger className={styles.TriggerButton}>Popover</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content sideOffset={8} className={popoverDemoStyles.Popup}>
          <RadixPopover.Arrow asChild className={popoverDemoStyles.Arrow}>
            <ArrowSvg />
          </RadixPopover.Arrow>
          <div>Details for {rowData.label}</div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

function RadixRowTooltip({ rowData }: { rowData: RowData }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger className={styles.TriggerButton}>Tooltip</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content sideOffset={10} className={tooltipDemoStyles.Popup}>
          <RadixTooltip.Arrow asChild className={tooltipDemoStyles.Arrow}>
            <ArrowSvg />
          </RadixTooltip.Arrow>
          Tooltip for {rowData.label}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

function RadixRowDialog({ rowData }: { rowData: RowData }) {
  return (
    <RadixDialog.Root>
      <RadixDialog.Trigger className={styles.TriggerButton}>Dialog</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={dialogDemoStyles.Backdrop} />
        <RadixDialog.Content className={dialogDemoStyles.Popup}>
          <RadixDialog.Title className={dialogDemoStyles.Title}>Dialog</RadixDialog.Title>
          <RadixDialog.Description className={dialogDemoStyles.Description}>
            Dialog content for {rowData.label}
          </RadixDialog.Description>
          <div className={dialogDemoStyles.Actions}>
            <RadixDialog.Close className={dialogDemoStyles.Button}>Close</RadixDialog.Close>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function RadixTriggers() {
  const { settings } = useExperimentSettings<Settings>();
  const { renderMenu, renderTooltip, renderPopover, renderDialog } = settings;
  return (
    <RadixTooltip.Provider>
      <div className={styles.Rows}>
        {rows.map((row) => (
          <div key={row.index} className={styles.Row}>
            <span className={styles.RowLabel}>{row.label}</span>
            <span className={styles.Actions}>
              {renderDialog && <RadixRowDialog rowData={row} />}
              {renderMenu && <RadixRowMenu rowData={row} />}
              {renderPopover && <RadixRowPopover rowData={row} />}
              {renderTooltip && <RadixRowTooltip rowData={row} />}
            </span>
          </div>
        ))}
      </div>
    </RadixTooltip.Provider>
  );
}

/* -----------------------------------------------------------------
 * Page
 * ----------------------------------------------------------------- */

const variants: BenchmarkVariant[] = [
  {
    key: 'base-contained',
    label: 'Base UI — contained triggers',
    render: () => <ContainedTriggers />,
  },
  {
    key: 'base-detached',
    label: 'Base UI — detached triggers',
    render: () => <DetachedTriggers />,
  },
  { key: 'radix', label: 'Radix', render: () => <RadixTriggers /> },
];

export default function TriggersPerfExperiment() {
  return (
    <div className={styles.Container}>
      <h1>Trigger rendering performance</h1>
      <p>
        Each variant renders {ROW_COUNT} rows × up to 4 components (Menu / Tooltip / Popover /
        Dialog). Use the sidebar settings to toggle which components are rendered across all
        variants.
      </p>
      <PerformanceBenchmark variants={variants} />
    </div>
  );
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  renderDialog: {
    type: 'boolean',
    default: true,
    label: 'Render Dialog',
  },
  renderMenu: {
    type: 'boolean',
    default: true,
    label: 'Render Menu',
  },
  renderPopover: {
    type: 'boolean',
    default: true,
    label: 'Render Popover',
  },
  renderTooltip: {
    type: 'boolean',
    default: true,
    label: 'Render Tooltip',
  },
};
