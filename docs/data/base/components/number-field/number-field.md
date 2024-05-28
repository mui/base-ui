---
productId: base-ui
title: React NumberField component and hook
githubLabel: 'component: number-field'
components: NumberFieldRoot, NumberFieldGroup, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement, NumberFieldScrubArea, NumberFieldScrubAreaCursor
hooks: useNumberFieldRoot
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
---

# Number Field

<p class="description">The Number Field component provides users with a field for number values, with stepper buttons and a scrub area to increment or decrement the value.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

A number field is a UI element that accepts numeric values from the user. `NumberField` is a customizable replacement for the native HTML `<input type="number">` that solves some usability and visual issues while enhancing its functionality.

{{"demo": "UnstyledNumberFieldIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Component

```jsx
import * as NumberField from '@base_ui/react/NumberField';
```

### Anatomy

The `NumberField` component is composed of a root component and a group component which contains an input, and optionally, an increment button, decrement button, and a scrub area with a virtual cursor:

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

### Custom structure

Use the `render` prop to override the rendered elements with your own components:

```jsx
<NumberField.Root render={(props) => <MyNumberField {...props} />}>
  {/* Subcomponents */}
</NumberField.Root>
```

All subcomponents accept the `render` prop.

To ensure behavior works as expected:

- **Forward all props**: Your component should spread all props to the underlying element.
- **Forward the `ref`**: Your component should use [`forwardRef`](https://react.dev/reference/react/forwardRef) to ensure the Number Field components can access the element via a ref.

A custom component that adheres to these two principles looks like this:

```jsx
const MyNumberField = React.forwardRef(function MyNumberField(props, ref) {
  return <div ref={ref} {...props} />;
});
```

### Value

The `value` prop holds the number value, and `onChange` is called when it updates:

```jsx
function App() {
  const [value, setValue] = useState(0);
  return (
    <NumberField.Root value={value} onChange={setValue}>
      <NumberField.Group>
        <NumberField.Decrement>&minus;</NumberField.Decrement>
        <NumberField.Input />
        <NumberField.Increment>+</NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
}
```

This is the controlled way of handling the number field.

### Default value

When the number field is uncontrolled, the `defaultValue` prop sets the initial value of the input:

```jsx
<NumberField.Root defaultValue={10}>
  <NumberField.Group>
    <NumberField.Decrement>&minus;</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

### Min and max values

To prevent the value from going below or above a certain amount, the `min` and `max` props can be used:

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

The `step` prop snaps values of the input to ones that are multiples of the given number, affecting how the stepper buttons change the value:

```jsx
<NumberField.Root step={5} min={2}>
  <NumberField.Group>
    <NumberField.Decrement>&minus;</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

In the above example, the numbers are snapped to multiples of `step` starting from the `min` value: `2`, `7`, `12`, `17` and so on.

The `largeStep` and `smallStep` props can be specified to change the step when a modifier key is held:

- `largeStep` is used when <kbd>shift</kbd> is held, incrementing and snapping to multiples of `10`.
- `smallStep` is used when <kbd>alt</kbd> is held, incrementing and snapping to multiples of `0.1`.

```jsx
<NumberField.Root step={5} largeStep={50} smallStep={0.5}>
  <NumberField.Group>
    <NumberField.Decrement>&minus;</NumberField.Decrement>
    <NumberField.Input />
    <NumberField.Increment>+</NumberField.Increment>
  </NumberField.Group>
</NumberField.Root>
```

### Format

The `format` prop accepts [`Intl.NumberFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) to customize the formatting of the input value:

{{"demo": "UnstyledNumberFieldFormat.js"}}

### Scrubbing

The `ScrubArea` subcomponent lets users scrub the value with their pointer as a faster alternative to the stepper buttons. This is useful in high-density UIs, such as an image editor that changes the width, height, or location of a layer:

{{"demo": "UnstyledNumberFieldScrub.js"}}

The pointer is locked while scrubbing, allowing the user to scrub infinitely without hitting the window boundary. Since this hides the cursor, you can add a virtual cursor asset using the `NumberField.ScrubAreaCursor` subcomponent, which automatically loops around the boundary:

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

In your CSS, ensure any `label` elements inside the `ScrubArea` specify `cursor: unset`. You can rotate the above macOS-style cursor 90 degrees using a `transform` style.

:::info
In Safari, the pointer is not locked. However, this doesn't affect the ability to scrub infinitely.
:::

#### Teleport distance

To teleport the virtual cursor closer to the input rather than the entire viewport, use the `teleportDistance` prop:

```js
<NumberField.ScrubArea teleportDistance={200}>
  <NumberField.ScrubAreaCursor />
</NumberField.ScrubArea>
```

This specifies in pixels the distance the cursor can travel around the center of the scrub area element before it loops back around.

#### Wheel scrubbing

To allow the input to be scrubbed using the mouse wheel, add the `allowWheelScrub` prop:

{{"demo": "UnstyledNumberFieldWheelScrub.js"}}

## Hook

```js
import { useNumberField } from '@base_ui/react/useNumberField';
```

The `useNumberField` hook lets you apply the functionality of a Number Field to a fully custom component.
It returns props to be placed on the custom component, along with fields representing the component's internal state.

:::info
Hooks give you the most room for customization, but require more work to implement.
With hooks, you can take full control over how your component is rendered, and define all the custom props and CSS classes you need.

You may not need to use hooks unless you find that you're limited by the customization options of their component counterparts—for instance, if your component requires significantly different [HTML structure](#anatomy).
:::

## Accessibility

Ensure the number field has an accessible name via a `label` element.
