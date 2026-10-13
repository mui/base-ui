import * as React from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Avatar } from '@base-ui/react/avatar';
import { Button } from '@base-ui/react/button';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Collapsible } from '@base-ui/react/collapsible';
import { Combobox } from '@base-ui/react/combobox';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { Form } from '@base-ui/react/form';
import { Input } from '@base-ui/react/input';
import { Menu } from '@base-ui/react/menu';
import { Menubar } from '@base-ui/react/menubar';
import { Meter } from '@base-ui/react/meter';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { NumberField } from '@base-ui/react/number-field';
import { OTPField } from '@base-ui/react/otp-field';
import { Popover } from '@base-ui/react/popover';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Progress } from '@base-ui/react/progress';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Select } from '@base-ui/react/select';
import { Separator } from '@base-ui/react/separator';
import { Slider } from '@base-ui/react/slider';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import { Toast } from '@base-ui/react/toast';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { Tooltip } from '@base-ui/react/tooltip';
import { reactBenchmark } from '@mui/internal-benchmark/page';
import { createRows } from '../shared';

// One small benchmark per component, all in one file: the runner loads the file's page once per
// round and samples each of them there, which keeps the page loads few and each mount small.

// The real cursor persists across samples and can come to rest over a tooltip trigger, opening a
// tooltip mid-sample, which only some samples would then pay for. Blocked on the container, so
// React writes no inline style onto every trigger inside the path being timed.
const INERT_TO_POINTER: React.CSSProperties = { pointerEvents: 'none' };
const SCROLL_AREA_STYLE: React.CSSProperties = {
  width: 120,
  height: 120,
  overflow: 'hidden',
  position: 'relative',
};
// A round of the whole file is long, so a minute fits few rounds; sampling longer buys precision.
const SMOKE_SAMPLING = { timeout: 3 };
const options = createRows(5, 'Option');
const accordionRows = createRows(20, 'Accordion');
const alertDialogRows = createRows(40, 'Alert dialog');
const autocompleteRows = createRows(30, 'Autocomplete');
const avatarRows = createRows(60, 'Avatar');
const buttonRows = createRows(100, 'Button');
const checkboxRows = createRows(100, 'Checkbox');
const checkboxGroupRows = createRows(20, 'Checkbox group');
const collapsibleRows = createRows(60, 'Collapsible');
const comboboxRows = createRows(30, 'Combobox');
const contextMenuRows = createRows(40, 'Context menu');
const dialogRows = createRows(60, 'Dialog');
const drawerRows = createRows(40, 'Drawer');
const fieldRows = createRows(40, 'Field');
const fieldsetRows = createRows(20, 'Fieldset');
const formRows = createRows(20, 'Form');
const inputRows = createRows(100, 'Input');
const menuRows = createRows(60, 'Menu');
const menubarRows = createRows(20, 'Menubar');
const meterRows = createRows(60, 'Meter');
const navigationMenuRows = createRows(20, 'Navigation menu');
const numberFieldRows = createRows(40, 'Number field');
const oTPFieldRows = createRows(20, 'OTP field');
const popoverRows = createRows(60, 'Popover');
const previewCardRows = createRows(40, 'Preview card');
const progressRows = createRows(60, 'Progress');
const radioGroupRows = createRows(20, 'Radio group');
const scrollAreaRows = createRows(60, 'Scroll area');
const selectRows = createRows(40, 'Select');
const separatorRows = createRows(100, 'Separator');
const sliderRows = createRows(60, 'Slider');
const switchRows = createRows(60, 'Switch');
const tabsRows = createRows(40, 'Tabs');
const toggleGroupRows = createRows(20, 'Toggle group');
const toolbarRows = createRows(20, 'Toolbar');
const tooltipRows = createRows(60, 'Tooltip');
const optionLabels = options.map((option) => option.label);
const tabValues = ['overview', 'details', 'activity'] as const;

/** Toasts only arrive through the manager, so they are added as the benchmark mounts. */
function Toasts(props: { count: number }) {
  const { count } = props;
  const toastManager = Toast.useToastManager();
  const addedRef = React.useRef(false);
  React.useLayoutEffect(() => {
    if (addedRef.current) {
      return;
    }
    addedRef.current = true;
    for (let index = 1; index <= count; index += 1) {
      toastManager.add({ title: `Toast ${index}`, description: 'Toast content' });
    }
  }, [count, toastManager]);
  return toastManager.toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content>
        <Toast.Title />
        <Toast.Description />
        <Toast.Close>Close</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

reactBenchmark(
  'Smoke · Accordion',
  () => (
    <React.Fragment>
      {accordionRows.map((row) => (
        <Accordion.Root key={row.id}>
          {options.map((option) => (
            <Accordion.Item key={option.id} value={option.value}>
              <Accordion.Header>
                <Accordion.Trigger>{option.label}</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{row.label}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · AlertDialog',
  () => (
    <React.Fragment>
      {alertDialogRows.map((row) => (
        <AlertDialog.Root key={row.id}>
          <AlertDialog.Trigger>{row.label}</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop />
            <AlertDialog.Popup>
              <AlertDialog.Title>{row.label}</AlertDialog.Title>
              <AlertDialog.Description>Alert dialog content</AlertDialog.Description>
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Autocomplete',
  () => (
    <React.Fragment>
      {autocompleteRows.map((row) => (
        <Autocomplete.Root key={row.id} items={optionLabels}>
          <Autocomplete.Input aria-label={row.label} />
          <Autocomplete.Portal>
            <Autocomplete.Positioner sideOffset={8}>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Avatar',
  () => (
    <React.Fragment>
      {avatarRows.map((row) => (
        <Avatar.Root key={row.id}>
          <Avatar.Image alt={row.label} />
          <Avatar.Fallback>{row.label.slice(0, 2)}</Avatar.Fallback>
        </Avatar.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Button',
  () => (
    <React.Fragment>
      {buttonRows.map((row) => (
        <Button key={row.id}>{row.label}</Button>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Checkbox',
  () => (
    <React.Fragment>
      {checkboxRows.map((row) => (
        <Checkbox.Root key={row.id} aria-label={row.label}>
          <Checkbox.Indicator />
        </Checkbox.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · CheckboxGroup',
  () => (
    <React.Fragment>
      {checkboxGroupRows.map((row) => (
        <CheckboxGroup key={row.id} aria-label={row.label} defaultValue={[options[0].value]}>
          {options.map((option) => (
            <Checkbox.Root key={option.id} value={option.value} aria-label={option.label}>
              <Checkbox.Indicator />
            </Checkbox.Root>
          ))}
        </CheckboxGroup>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Collapsible',
  () => (
    <React.Fragment>
      {collapsibleRows.map((row) => (
        <Collapsible.Root key={row.id}>
          <Collapsible.Trigger>{row.label}</Collapsible.Trigger>
          <Collapsible.Panel>Collapsible content</Collapsible.Panel>
        </Collapsible.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Combobox',
  () => (
    <React.Fragment>
      {comboboxRows.map((row) => (
        <Combobox.Root key={row.id} items={options}>
          <Combobox.Input aria-label={row.label} />
          <Combobox.Portal>
            <Combobox.Positioner sideOffset={8}>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: (typeof options)[number]) => (
                    <Combobox.Item key={item.id} value={item}>
                      {item.label}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · ContextMenu',
  () => (
    <React.Fragment>
      {contextMenuRows.map((row) => (
        <ContextMenu.Root key={row.id}>
          <ContextMenu.Trigger>{row.label}</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>
                {options.map((option) => (
                  <ContextMenu.Item key={option.id}>{option.label}</ContextMenu.Item>
                ))}
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Dialog',
  () => (
    <React.Fragment>
      {dialogRows.map((row) => (
        <Dialog.Root key={row.id}>
          <Dialog.Trigger>{row.label}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>{row.label}</Dialog.Title>
              <Dialog.Description>Dialog content</Dialog.Description>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Drawer',
  () => (
    <React.Fragment>
      {drawerRows.map((row) => (
        <Drawer.Root key={row.id}>
          <Drawer.Trigger>{row.label}</Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Backdrop />
            <Drawer.Viewport>
              <Drawer.Popup>
                <Drawer.Content>
                  <Drawer.Title>{row.label}</Drawer.Title>
                  <Drawer.Description>Drawer content</Drawer.Description>
                  <Drawer.Close>Close</Drawer.Close>
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Field',
  () => (
    <React.Fragment>
      {fieldRows.map((row) => (
        <Field.Root key={row.id}>
          <Field.Label>{row.label}</Field.Label>
          <Field.Control />
          <Field.Description>Field description</Field.Description>
          <Field.Error />
        </Field.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Fieldset',
  () => (
    <React.Fragment>
      {fieldsetRows.map((row) => (
        <Fieldset.Root key={row.id}>
          <Fieldset.Legend>{row.label}</Fieldset.Legend>
          <Field.Root>
            <Field.Label>First</Field.Label>
            <Field.Control />
          </Field.Root>
          <Field.Root>
            <Field.Label>Second</Field.Label>
            <Field.Control />
          </Field.Root>
        </Fieldset.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Form',
  () => (
    <React.Fragment>
      {formRows.map((row) => (
        <Form key={row.id}>
          <Field.Root name="name">
            <Field.Label>{row.label}</Field.Label>
            <Field.Control required />
            <Field.Error />
          </Field.Root>
          <Button type="submit">Submit</Button>
        </Form>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Input',
  () => (
    <React.Fragment>
      {inputRows.map((row) => (
        <Input key={row.id} aria-label={row.label} />
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Menu',
  () => (
    <React.Fragment>
      {menuRows.map((row) => (
        <Menu.Root key={row.id}>
          <Menu.Trigger>{row.label}</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={8}>
              <Menu.Popup>
                {options.map((option) => (
                  <Menu.Item key={option.id}>{option.label}</Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Menubar',
  () => (
    <React.Fragment>
      {menubarRows.map((row) => (
        <Menubar key={row.id}>
          {['File', 'Edit', 'View'].map((menu) => (
            <Menu.Root key={menu}>
              <Menu.Trigger>{menu}</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    {options.map((option) => (
                      <Menu.Item key={option.id}>{option.label}</Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          ))}
        </Menubar>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Meter',
  () => (
    <React.Fragment>
      {meterRows.map((row) => (
        <Meter.Root key={row.id} value={40}>
          <Meter.Label>{row.label}</Meter.Label>
          <Meter.Value />
          <Meter.Track>
            <Meter.Indicator />
          </Meter.Track>
        </Meter.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · NavigationMenu',
  () => (
    <React.Fragment>
      {navigationMenuRows.map((row) => (
        <NavigationMenu.Root key={row.id} aria-label={row.label}>
          <NavigationMenu.List>
            {['Overview', 'Handbook'].map((item) => (
              <NavigationMenu.Item key={item}>
                <NavigationMenu.Trigger>{item}</NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  {options.map((option) => (
                    <NavigationMenu.Link key={option.id} href={`#${option.value}`}>
                      {option.label}
                    </NavigationMenu.Link>
                  ))}
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            ))}
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#github">GitHub</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner sideOffset={8}>
              <NavigationMenu.Popup>
                <NavigationMenu.Viewport />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · NumberField',
  () => (
    <React.Fragment>
      {numberFieldRows.map((row) => (
        <NumberField.Root key={row.id} defaultValue={row.id}>
          <NumberField.Group>
            <NumberField.Decrement>-</NumberField.Decrement>
            <NumberField.Input aria-label={row.label} />
            <NumberField.Increment>+</NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · OTPField',
  () => (
    <React.Fragment>
      {oTPFieldRows.map((row) => (
        <OTPField.Root key={row.id} length={6} aria-label={row.label}>
          {Array.from({ length: 6 }, (_, index) => (
            <OTPField.Input key={index} aria-label={`Character ${index + 1} of 6`} />
          ))}
        </OTPField.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Popover',
  () => (
    <React.Fragment>
      {popoverRows.map((row) => (
        <Popover.Root key={row.id}>
          <Popover.Trigger>{row.label}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup>
                <Popover.Title>{row.label}</Popover.Title>
                <Popover.Description>Popover content</Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · PreviewCard',
  () => (
    <React.Fragment>
      {previewCardRows.map((row) => (
        <PreviewCard.Root key={row.id}>
          <PreviewCard.Trigger href={`#${row.value}`}>{row.label}</PreviewCard.Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner sideOffset={8}>
              <PreviewCard.Popup>Preview of {row.label}</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Progress',
  () => (
    <React.Fragment>
      {progressRows.map((row) => (
        <Progress.Root key={row.id} value={40}>
          <Progress.Label>{row.label}</Progress.Label>
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · RadioGroup',
  () => (
    <React.Fragment>
      {radioGroupRows.map((row) => (
        <RadioGroup key={row.id} aria-label={row.label} defaultValue={options[0].value}>
          {options.map((option) => (
            <Radio.Root key={option.id} value={option.value} aria-label={option.label}>
              <Radio.Indicator />
            </Radio.Root>
          ))}
        </RadioGroup>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · ScrollArea',
  () => (
    <React.Fragment>
      {scrollAreaRows.map((row) => (
        <ScrollArea.Root key={row.id} style={SCROLL_AREA_STYLE}>
          <ScrollArea.Viewport>
            <ScrollArea.Content>
              <div style={{ width: 240, height: 240 }}>{row.label}</div>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar>
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
          <ScrollArea.Corner />
        </ScrollArea.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Select',
  () => (
    <React.Fragment>
      {selectRows.map((row) => (
        <Select.Root key={row.id} items={options}>
          <Select.Trigger aria-label={row.label}>
            <Select.Value placeholder={row.label} />
            <Select.Icon>v</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={8}>
              <Select.Popup>
                <Select.List>
                  {options.map((option) => (
                    <Select.Item key={option.id} value={option.value}>
                      <Select.ItemIndicator />
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Separator',
  () => (
    <React.Fragment>
      {separatorRows.map((row) => (
        <Separator key={row.id} />
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Slider',
  () => (
    <React.Fragment>
      {sliderRows.map((row) => (
        <Slider.Root key={row.id} defaultValue={50}>
          <Slider.Value />
          <Slider.Control aria-label={row.label}>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Switch',
  () => (
    <React.Fragment>
      {switchRows.map((row) => (
        <Switch.Root key={row.id} aria-label={row.label}>
          <Switch.Thumb />
        </Switch.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Tabs',
  () => (
    <React.Fragment>
      {tabsRows.map((row) => (
        <Tabs.Root key={row.id} defaultValue={tabValues[0]}>
          <Tabs.List aria-label={row.label}>
            {tabValues.map((value) => (
              <Tabs.Tab key={value} value={value}>
                {value}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {tabValues.map((value) => (
            <Tabs.Panel key={value} value={value}>
              {row.label} {value}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Toast',
  () => (
    <Toast.Provider limit={20}>
      <Toast.Portal>
        <Toast.Viewport>
          <Toasts count={20} />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · ToggleGroup',
  () => (
    <React.Fragment>
      {toggleGroupRows.map((row) => (
        <ToggleGroup key={row.id} aria-label={row.label} defaultValue={[options[0].value]}>
          {options.map((option) => (
            <Toggle key={option.id} value={option.value}>
              {option.label}
            </Toggle>
          ))}
        </ToggleGroup>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Toolbar',
  () => (
    <React.Fragment>
      {toolbarRows.map((row) => (
        <Toolbar.Root key={row.id} aria-label={row.label}>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Button>Italic</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Group>
            <Toolbar.Button>Left</Toolbar.Button>
            <Toolbar.Button>Right</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Link href={`#${row.value}`}>Help</Toolbar.Link>
          <Toolbar.Input aria-label="Search" />
        </Toolbar.Root>
      ))}
    </React.Fragment>
  ),
  SMOKE_SAMPLING,
);

reactBenchmark(
  'Smoke · Tooltip',
  () => (
    <div style={INERT_TO_POINTER}>
      {tooltipRows.map((row) => (
        <Tooltip.Root key={row.id}>
          <Tooltip.Trigger aria-label={`Show ${row.label}`}>{row.label}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup>Tooltip for {row.label}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ))}
    </div>
  ),
  SMOKE_SAMPLING,
);
