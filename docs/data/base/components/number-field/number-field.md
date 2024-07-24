---
productId: base-ui
title: React NumberField component and hook
githubLabel: 'component: number-field'
components: NumberFieldRoot, NumberFieldGroup, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement, NumberFieldScrubArea, NumberFieldScrubAreaCursor
hooks: useNumberFieldRoot
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
packageName: '@base_ui/react'
---

# Number Field

<p class="description">Number Field provides users with a numeric input, with buttons and a scrub area to increment or decrement its value.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledNumberFieldIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

<codeblock storageKey="package-manager">

```bash npm
npm install @base_ui/react
```

```bash yarn
yarn add @base_ui/react
```

```bash pnpm
pnpm add @base_ui/react
```

</codeblock>

Once you have the package installed, import the component.

```ts
import * as NumberField from '@base_ui/react/NumberField';
```

## Anatomy

Number Field is implemented using a collection of related components:

- `<NumberField.Root />` is a top-level component that wraps all other components.
- `<NumberField.Group />` semantically groups the input with the buttons.
- `<NumberField.Input />` is the input itself.
- `<NumberField.Increment />` is an optional button for incrementing the input value.
- `<NumberField.Decrement />` is an optional button for decrementing the input value.
- `<NumberField.ScrubArea />` can wrap an area, icon, or `<label/>` to make it scrubbable.
- `<NumberField.ScrubAreaCursor />` is an optional component for rendering a virtual cursor while scrubbing.

```tsx
<NumberField.Root>
  <NumberField.Group>
    <NumberField.Decrement />
    <NumberField.Input />
    <NumberField.Increment />
    <NumberField.ScrubArea>
      <NumberField.ScrubAreaCursor />
    </NumberField.ScrubArea>
  </NumberField.Group>
</NumberField.Root>
```

## Value

### Default value

When Number Field is uncontrolled, the `defaultValue` prop sets the initial value of the input.

```jsx
<NumberField.Root defaultValue={10}>
  <NumberField.Group>
    <NumberField.Decrement>&minus;</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

### Controlled

The `value` prop holds the number value, and `onValueChange` is called when it updates.

```jsx
function App() {
  const [value, setValue] = useState(0);
  return (
    <NumberField.Root value={value} onValueChange={setValue}>
      <NumberField.Group>
        <NumberField.Decrement>&minus;</NumberField.Decrement>
        <NumberField.Input />
        <NumberField.Increment>+</NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}
```

## Validation

### Min and max

The `min` and `max` props can be used to prevent the value from going above or below a certain range.

```jsx
<NumberField.Root min={0} max={100}>
  <NumberField.Group>
    <NumberField.Decrement>&minus;</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

### Step

The `step` prop snaps the input value to multiples of the given number. In the below example, the input value snaps to multiples of `step` starting from the `min` value: `2`, `7`, `12`, `17`, and so on.

```jsx
<NumberField.Root step={5} min={2}>
  <NumberField.Group>
    <NumberField.Decrement>&minus;</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

You can specify the `largeStep` and `smallStep` props to change the step when the user holds a modifier key:

- `largeStep` applies when <kbd>shift</kbd> is held, snapping to multiples of 10 by default.
- `smallStep` applies when <kbd>alt</kbd> is held, snapping to multiples of 0.1 by default.

```jsx
<NumberField.Root step={5} largeStep={50} smallStep={0.5}>
  <NumberField.Group>
    <NumberField.Decrement>&minus;</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

## Format

The `format` prop accepts [`Intl.NumberFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) to customize the formatting of the input value:

{{"demo": "UnstyledNumberFieldFormat.js"}}

## Scrubbing

The `NumberField.ScrubArea` subcomponent lets users increment/decrement the value via a click+drag interaction with pointer, as a faster alternative to the stepper buttons. This is useful in high-density UIs, such as an image editor that changes the width, height, or location of a layer. You could wrap an icon or a `<label/>` in the `NumberField.ScrubArea` component.

{{"demo": "UnstyledNumberFieldScrub.js"}}

The pointer is locked while scrubbing, allowing the user to scrub infinitely without hitting the window boundary. Since this hides the cursor, you can add a virtual cursor asset using the `<NumberField.ScrubAreaCursor />` subcomponent, which automatically loops around the boundary.

```jsx
<NumberField.ScrubArea direction="horizontal" style={{ cursor: 'ew-resize' }}>
  <label htmlFor={id} style={{ cursor: 'unset' }}>
    Scrub
  </label>
  <NumberField.ScrubAreaCursor>
    <span style={{ filter: 'drop-shadow(2px 0 2px rgb(0 0 0 / 0.3))' }}>
      <svg
        width="26"
        height="14"
        viewBox="0 0 24 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        <path
          d="M19.3382 3.00223V5.40757L13.0684 5.40757L13.0683 5.40757L6.59302 5.40964V3V1.81225L5.74356 2.64241L1.65053 6.64241L1.28462 7L1.65053 7.35759L5.74356 11.3576L6.59302 12.1878V11L6.59302 8.61585L13.0684 8.61585H19.3382V11V12.1741L20.1847 11.3605L24.3465 7.36049L24.7217 6.9999L24.3464 6.63941L20.1846 2.64164L19.3382 1.82862V3.00223Z"
          fill="black"
          stroke="white"
        />
      </svg>
    </span>
    )}
  </NumberField.ScrubAreaCursor>
</NumberField.ScrubArea>
```

In your CSS, ensure any `<label>` elements inside `<ScrubArea />` specify `cursor: unset`. You can rotate the above macOS-style cursor 90 degrees using a `transform` style.

:::info
In Safari, the pointer is not locked. However, this doesn't affect the ability to scrub infinitely.
:::

### Teleport distance

Rather than teleporting the virtual cursor at the viewport boundary, you can use the `teleportDistance` prop to teleport the cursor at a custom boundary.

```js
<NumberField.ScrubArea teleportDistance={200}>
  <NumberField.ScrubAreaCursor />
</NumberField.ScrubArea>
```

This specifies the `px` distance the cursor can travel from the center of the scrub area element before it loops back around.

### Wheel scrubbing

To allow the input to be scrubbed using the mouse wheel, add the `allowWheelScrub` prop. The input must be focused and the pointer must be hovering over it.

{{"demo": "UnstyledNumberFieldWheelScrub.js"}}

## Overriding default components

Use the `render` prop to override the rendered elements with your own components.

```jsx
<NumberField.Input render={(props) => <MyCustomInput {...props} />}> />
```

All subcomponents accept the `render` prop.

## Accessibility

Ensure the Number Field has an accessible name via a `<label>` element.
