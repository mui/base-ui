# @base-ui/tailwindcss

A Tailwind CSS plugin for styling [Base UI](https://base-ui.com/) components using state-based utility variants.

## Installation

```sh
npm install @base-ui/tailwindcss
```

## Usage

Add the plugin to your `tailwind.config.js`:

```js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  plugins: [
    require('@base-ui/tailwindcss')
  ],
}
```

### With custom prefix

You can customize the prefix used for variants (default is `ui`):

```js
module.exports = {
  plugins: [
    require('@base-ui/tailwindcss')({ prefix: 'base' })
  ],
}
```

## Available Variants

The plugin provides state-based variants that correspond to Base UI's data attributes:

| Variant | Inverse variant | Description |
| --- | --- | --- |
| `ui-open` | `ui-not-open` | Element is in an open state |
| `ui-closed` | `ui-not-closed` | Element is in a closed state |
| `ui-checked` | `ui-not-checked` | Element is checked |
| `ui-unchecked` | `ui-not-unchecked` | Element is unchecked |
| `ui-indeterminate` | `ui-not-indeterminate` | Element is in an indeterminate state |
| `ui-disabled` | `ui-not-disabled` | Element is disabled |
| `ui-readonly` | `ui-not-readonly` | Element is readonly |
| `ui-required` | `ui-not-required` | Element is required |
| `ui-valid` | `ui-not-valid` | Element has valid value |
| `ui-invalid` | `ui-not-invalid` | Element has invalid value |
| `ui-touched` | `ui-not-touched` | Element has been touched |
| `ui-dirty` | `ui-not-dirty` | Element value has changed |
| `ui-filled` | `ui-not-filled` | Element has a value |
| `ui-focused` | `ui-not-focused` | Element is focused |
| `ui-selected` | `ui-not-selected` | Element is selected |
| `ui-highlighted` | `ui-not-highlighted` | Element is highlighted |
| `ui-active` | `ui-not-active` | Element is active |
| `ui-pressed` | `ui-not-pressed` | Element is pressed |
| `ui-dragging` | `ui-not-dragging` | Element is being dragged |
| `ui-scrubbing` | `ui-not-scrubbing` | Element is being scrubbed |
| `ui-nested` | `ui-not-nested` | Element is nested |
| `ui-expanded` | `ui-not-expanded` | Element is expanded |
| `ui-hidden` | `ui-not-hidden` | Element is hidden |
| `ui-panel-open` | `ui-not-panel-open` | Panel is open |

### Special Variants

| Variant | Description |
| --- | --- |
| `ui-starting-style` | Applied during enter transitions |
| `ui-ending-style` | Applied during exit transitions |
| `ui-popup-open` | Popup is open |
| `ui-anchor-hidden` | Anchor is hidden |
| `ui-nested-dialog-open` | Nested dialog is open |

## Examples

### Checkbox

```jsx
import { Checkbox } from '@base-ui/react/checkbox';

<Checkbox.Root
  className="
    flex items-center justify-center
    size-5 rounded
    border border-gray-300
    ui-checked:bg-blue-500
    ui-checked:border-blue-500
    ui-disabled:opacity-50
    ui-disabled:cursor-not-allowed
  "
>
  <Checkbox.Indicator
    className="
      text-white
      ui-unchecked:hidden
    "
  >
    <CheckIcon />
  </Checkbox.Indicator>
</Checkbox.Root>
```

### Select

```jsx
import { Select } from '@base-ui/react/select';

<Select.Item
  value="apple"
  className="
    px-3 py-2
    cursor-pointer
    ui-selected:bg-blue-100
    ui-selected:text-blue-900
    ui-highlighted:bg-gray-100
    ui-disabled:opacity-50
    ui-disabled:cursor-not-allowed
  "
>
  Apple
</Select.Item>
```

### Popover

```jsx
import { Popover } from '@base-ui/react/popover';

<Popover.Popup
  className="
    rounded-lg shadow-lg
    bg-white p-4
    transition-all duration-200
    ui-starting-style:opacity-0
    ui-starting-style:scale-95
    ui-ending-style:opacity-0
    ui-ending-style:scale-95
  "
>
  Popover content
</Popover.Popup>
```

### Collapsible

```jsx
import { Collapsible } from '@base-ui/react/collapsible';

<Collapsible.Panel
  className="
    overflow-hidden
    transition-all
    ui-open:animate-slideDown
    ui-closed:animate-slideUp
  "
>
  Panel content
</Collapsible.Panel>
```

### Switch

```jsx
import { Switch } from '@base-ui/react/switch';

<Switch.Root
  className="
    relative inline-flex h-6 w-11
    items-center rounded-full
    transition-colors
    ui-checked:bg-blue-500
    ui-unchecked:bg-gray-200
    ui-disabled:opacity-50
  "
>
  <Switch.Thumb
    className="
      inline-block h-4 w-4
      transform rounded-full bg-white
      transition-transform
      ui-checked:translate-x-6
      ui-unchecked:translate-x-1
    "
  />
</Switch.Root>
```

### Number Field with Scrubbing

```jsx
import { NumberField } from '@base-ui/react/number-field';

<NumberField.ScrubArea
  className="
    cursor-ew-resize
    ui-scrubbing:cursor-grabbing
    ui-scrubbing:bg-blue-50
  "
>
  <NumberField.Input
    className="
      px-3 py-2
      border rounded
      ui-scrubbing:border-blue-500
      ui-invalid:border-red-500
      ui-disabled:opacity-50
    "
  />
</NumberField.ScrubArea>
```

## Comparison with slotProps

**Before** (using slotProps):

```jsx
<Select.Item
  value="apple"
  slotProps={{
    root: ({ selected, highlighted }) => ({
      className: `px-3 py-2 cursor-pointer ${
        selected ? 'bg-blue-100 text-blue-900' : ''
      } ${
        highlighted ? 'bg-gray-100' : ''
      }`,
    }),
  }}
>
  Apple
</Select.Item>
```

**After** (using Tailwind variants):

```jsx
<Select.Item
  value="apple"
  className="
    px-3 py-2 cursor-pointer
    ui-selected:bg-blue-100 ui-selected:text-blue-900
    ui-highlighted:bg-gray-100
  "
>
  Apple
</Select.Item>
```

## TypeScript

This package includes TypeScript definitions out of the box.

## License

MIT
