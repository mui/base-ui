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
import type { BenchmarkRow } from '../shared';

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
const SCROLL_AREA_CONTENT_STYLE: React.CSSProperties = { width: 240, height: 240 };
// A round of the whole file is long, so a minute fits few rounds; sampling longer buys precision.
const SMOKE_SAMPLING = { timeout: 3 };
const options = createRows(5, 'Option');
const tooltipRows = createRows(60, 'Tooltip');
const optionLabels = options.map((option) => option.label);
const tabValues = ['overview', 'details', 'activity'] as const;

/**
 * A smoke benchmark mounting `count` instances of a component, each as `renderRow` renders it. The
 * rows are created here, once per page load, so a sample only renders them.
 */
function smokeBenchmark(
  name: string,
  count: number,
  renderRow: (row: BenchmarkRow) => React.ReactNode,
) {
  const rows = createRows(count, name);
  reactBenchmark(
    `Smoke · ${name}`,
    () => <React.Fragment>{rows.map(renderRow)}</React.Fragment>,
    SMOKE_SAMPLING,
  );
}

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

smokeBenchmark('Accordion', 20, (row) => (
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
));

smokeBenchmark('AlertDialog', 40, (row) => (
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
));

smokeBenchmark('Autocomplete', 30, (row) => (
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
));

smokeBenchmark('Avatar', 60, (row) => (
  <Avatar.Root key={row.id}>
    <Avatar.Image alt={row.label} />
    <Avatar.Fallback>{row.label.slice(0, 2)}</Avatar.Fallback>
  </Avatar.Root>
));

smokeBenchmark('Button', 100, (row) => <Button key={row.id}>{row.label}</Button>);

smokeBenchmark('Checkbox', 100, (row) => (
  <Checkbox.Root key={row.id} aria-label={row.label}>
    <Checkbox.Indicator />
  </Checkbox.Root>
));

smokeBenchmark('CheckboxGroup', 20, (row) => (
  <CheckboxGroup key={row.id} aria-label={row.label} defaultValue={[options[0].value]}>
    {options.map((option) => (
      <Checkbox.Root key={option.id} value={option.value} aria-label={option.label}>
        <Checkbox.Indicator />
      </Checkbox.Root>
    ))}
  </CheckboxGroup>
));

smokeBenchmark('Collapsible', 60, (row) => (
  <Collapsible.Root key={row.id}>
    <Collapsible.Trigger>{row.label}</Collapsible.Trigger>
    <Collapsible.Panel>Collapsible content</Collapsible.Panel>
  </Collapsible.Root>
));

smokeBenchmark('Combobox', 30, (row) => (
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
));

smokeBenchmark('ContextMenu', 40, (row) => (
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
));

smokeBenchmark('Dialog', 60, (row) => (
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
));

smokeBenchmark('Drawer', 40, (row) => (
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
));

smokeBenchmark('Field', 40, (row) => (
  <Field.Root key={row.id}>
    <Field.Label>{row.label}</Field.Label>
    <Field.Control />
    <Field.Description>Field description</Field.Description>
    <Field.Error />
  </Field.Root>
));

smokeBenchmark('Fieldset', 20, (row) => (
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
));

smokeBenchmark('Form', 20, (row) => (
  <Form key={row.id}>
    <Field.Root name="name">
      <Field.Label>{row.label}</Field.Label>
      <Field.Control required />
      <Field.Error />
    </Field.Root>
    <Button type="submit">Submit</Button>
  </Form>
));

smokeBenchmark('Input', 100, (row) => <Input key={row.id} aria-label={row.label} />);

smokeBenchmark('Menu', 60, (row) => (
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
));

smokeBenchmark('Menubar', 20, (row) => (
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
));

smokeBenchmark('Meter', 60, (row) => (
  <Meter.Root key={row.id} value={40}>
    <Meter.Label>{row.label}</Meter.Label>
    <Meter.Value />
    <Meter.Track>
      <Meter.Indicator />
    </Meter.Track>
  </Meter.Root>
));

smokeBenchmark('NavigationMenu', 20, (row) => (
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
));

smokeBenchmark('NumberField', 40, (row) => (
  <NumberField.Root key={row.id} defaultValue={row.id}>
    <NumberField.Group>
      <NumberField.Decrement>-</NumberField.Decrement>
      <NumberField.Input aria-label={row.label} />
      <NumberField.Increment>+</NumberField.Increment>
    </NumberField.Group>
  </NumberField.Root>
));

smokeBenchmark('OTPField', 20, (row) => (
  <OTPField.Root key={row.id} length={6} aria-label={row.label}>
    {Array.from({ length: 6 }, (_, index) => (
      <OTPField.Input key={index} aria-label={`Character ${index + 1} of 6`} />
    ))}
  </OTPField.Root>
));

smokeBenchmark('Popover', 60, (row) => (
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
));

smokeBenchmark('PreviewCard', 40, (row) => (
  <PreviewCard.Root key={row.id}>
    <PreviewCard.Trigger href={`#${row.value}`}>{row.label}</PreviewCard.Trigger>
    <PreviewCard.Portal>
      <PreviewCard.Positioner sideOffset={8}>
        <PreviewCard.Popup>Preview of {row.label}</PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  </PreviewCard.Root>
));

smokeBenchmark('Progress', 60, (row) => (
  <Progress.Root key={row.id} value={40}>
    <Progress.Label>{row.label}</Progress.Label>
    <Progress.Value />
    <Progress.Track>
      <Progress.Indicator />
    </Progress.Track>
  </Progress.Root>
));

smokeBenchmark('RadioGroup', 20, (row) => (
  <RadioGroup key={row.id} aria-label={row.label} defaultValue={options[0].value}>
    {options.map((option) => (
      <Radio.Root key={option.id} value={option.value} aria-label={option.label}>
        <Radio.Indicator />
      </Radio.Root>
    ))}
  </RadioGroup>
));

smokeBenchmark('ScrollArea', 60, (row) => (
  <ScrollArea.Root key={row.id} style={SCROLL_AREA_STYLE}>
    <ScrollArea.Viewport>
      <ScrollArea.Content>
        <div style={SCROLL_AREA_CONTENT_STYLE}>{row.label}</div>
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
));

smokeBenchmark('Select', 40, (row) => (
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
));

smokeBenchmark('Separator', 100, (row) => <Separator key={row.id} />);

smokeBenchmark('Slider', 60, (row) => (
  <Slider.Root key={row.id} defaultValue={50}>
    <Slider.Value />
    <Slider.Control aria-label={row.label}>
      <Slider.Track>
        <Slider.Indicator />
        <Slider.Thumb />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
));

smokeBenchmark('Switch', 60, (row) => (
  <Switch.Root key={row.id} aria-label={row.label}>
    <Switch.Thumb />
  </Switch.Root>
));

smokeBenchmark('Tabs', 40, (row) => (
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
));

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

smokeBenchmark('ToggleGroup', 20, (row) => (
  <ToggleGroup key={row.id} aria-label={row.label} defaultValue={[options[0].value]}>
    {options.map((option) => (
      <Toggle key={option.id} value={option.value}>
        {option.label}
      </Toggle>
    ))}
  </ToggleGroup>
));

smokeBenchmark('Toolbar', 20, (row) => (
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
));

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
