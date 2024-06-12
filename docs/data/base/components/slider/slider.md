---
productId: base-ui
title: React Slider components
components: Slider, SliderRoot, SliderOutput, SliderThumb, SliderTrack
hooks: useSlider, useSliderRoot, useSliderOutput, useSliderThumb, useSliderTrack
githubLabel: 'component: slider'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
packageName: '@base_ui/react'
---

# Slider

<p class="description">The Slider component provides users with an input for a one or more numerical values within a given range.
</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledSliderIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Installation

Base UI components are all available as a single package.

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

```jsx
import * as Slider from '@base_ui/react/Slider';
```

### Anatomy

Sliders are implemented using a collection of related components:

- `<Slider.Root />` is a top-level component that wraps the other components.
- `<Slider.Output />` renders the value of the slider.
- `<Slider.Track />` renders the track area along which the thumb(s) can be moved.
- `<Slider.Thumb />` renders the element that can be moved along the track to change the value.

```tsx
<Slider.Root>
  <Slider.Output />
  <Slider.Track>
    <Slider.Thumb />
  </Slider.Track>
</Slider.Root>
```

## Value

### Default value

When Slider is uncontrolled, the `defaultValue` prop sets the initial value of the component.

```tsx
function App() {
  return (
    <Slider.Root defaultValue={50}>
      <Slider.Output />
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
    </Slider.Root>
  );
}
```

### Controlled

When Slider is uncontrolled, the `value` prop holds the numerical value(s), and two callbacks are provided for when the value changes:

- `onValueChange` is called when the value is changing while the thumb is being moved along the track
- `onValueCommitted` is called when thumb stops moving and `pointerup` is triggered

```tsx
function App() {
  const [value, setValue] = useState(50);
  return (
    <Slider.Root value={value} onValueChange={setValue}>
      <Slider.Output />
      <Slider.Track>
        <Slider.Thumb />
      </Slider.Track>
    </Slider.Root>
  );
}
```

## Validation

### Min and max

The `min` and `max` props can be used to restrict the value(s) within a range.

```tsx
<Slider.Root min={1} max={9}>
  <Slider.Output />
  <Slider.Track>
    <Slider.Thumb />
  </Slider.Track>
</Slider.Root>
```

### Step

The `step` prop snaps the each value to multiples of the given number. In the below example, the input value snaps to increments of `4` starting from the initial `defaultValue`: `3`, `7`, `11`, `15`, and so on.

```tsx
<Slider.Root step={4} defaultValue={3}>
  <Slider.Output />
  <Slider.Track>
    <Slider.Thumb />
  </Slider.Track>
</Slider.Root>
```

You can specify the `largeStep` prop to change the step when the user holds the <kbd>shift</kbd> key, snapping to multiples of 10 by default.

## Range Sliders

To let users set the start and end of a range on a Slider, provide an array of values to the `value` or `defaultValue` prop, and place a `<Slider.Thumb />` for each value in the array:

```tsx
<Slider.Root defaultValue={[45, 70]}>
  <Slider.Output />
  <Slider.Track>
    <Slider.Thumb />
    <Slider.Thumb />
  </Slider.Track>
</Slider.Root>
```

{{"demo": "RangeSlider.js"}}

### Overlapping values

The `minDifferenceBetweenValues` prop can be used to to set the mininum difference between values in a range slider, so thumbs do not overlap in the same position. In the below example, the thumbs cannot be moved further towards each other as the difference between values would exceed `minDifferenceBetweenValues`:

```tsx
<Slider.Root minDifferenceBetweenValues={5} defaultValue={[15, 20]}>
  <Slider.Track>
    <Slider.Thumb />
    <Slider.Thumb />
  </Slider.Track>
</Slider.Root>
```

## Vertical

To create vertical sliders, set the `orientation` prop to `"vertical"`. This will track thumb movements vertically instead of horizontally.

```jsx
<Slider.Root orientation="vertical">{/* Subcomponents */}</Slider.Root>
```

{{"demo": "VerticalSlider.js"}}

## RTL

Use the `isRtl` prop to set the slider's direction to RTL:

```jsx
<Slider.Root isRtl>{/* Subcomponents */}</Slider.Root>
```

In a RTL Slider, <kbd class="key">Left Arrow</kbd> increases the value while <kbd class="key">Right Arrow</kbd> decreases the value.

{{"demo": "RtlSlider.js"}}

## Overriding default components

Use the `render` prop to override the rendered elements with your own components.

```jsx
<Slider.Track render={(props) => <MyCustomTrack {...props} />}> />
```

All subcomponents accept the `render` prop.

The `Slider.Thumb` component's `render` prop contains an additional `inputProps` argument for rendering an `input` element attached to the thumb:

```jsx
<Slider.Thumb
  render={(props, inputProps) => {
    const { children, ...rest } = props;
    return (
      <MyCustomThumb {...rest}>
        {children}
        <input {...inputProps}>
      <MyCustomThumb/>
    )
  }}>
/>
```

## Accessibility

See the [WAI-ARIA guide on the Slider (Multi-Thumb) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/) for complete details on accessibility best practices.

The component handles most of the work necessary to make it accessible.
However, you need to make sure that:

- Each thumb has a user-friendly label (`aria-label`, `aria-labelledby` or `getAriaLabel` prop).
- Each thumb has a user-friendly text for its current value.
  This is not required if the value matches the semantics of the label.
  You can change the name with the `getAriaValueText` or `aria-valuetext` prop.
