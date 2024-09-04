---
productId: base-ui
title: React Progress components
components: ProgressRoot, ProgressTrack, ProgressIndicator
hooks: useProgressRoot, useProgressIndicator
githubLabel: 'component: progress'
waiAria: https://www.w3.org/TR/wai-aria-1.2/#progressbar
packageName: '@base_ui/react'
---

# Progress

<p class="description">The Progress component displays the status of a task or operation over time.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "UnstyledProgressIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Progress from '@base_ui/react/Progress';
```

### Anatomy

Progress

- `<Progress.Root />` is a top-level component that wraps the other components.
- `<Progress.Track />` renders the rail that represents the total length or duration of progress.
- `<Progress.Indicator />` renders the filled portion of the track.

```tsx
<Progress.Root>
  <Progress.Track>
    <Progress.Indicator />
  </Progress.Track>
</Progress.Root>
```

## Value

### Determinate

The `value` prop represents the percentage value of the Progress component. The default minimum and maximum values are `0` and `100`, and can be changed with the `min` and `max` props. When progress is determinate the `data-state` attribute is initially `'progressing'`, changing to `'complete'` when `value` equals `max`.

```tsx
function App() {
  const [progressValue] = React.useState(25);
  return (
    <Progress.Root value={progressValue} min={0} max={100}>
      <Progress.Track>
        <Progress.Indicator />
      </Progress.Track>
    </Progress.Root>
  );
}
```

### Indeterminate

Set `value` to `null` to configure an indeterminate progress bar. The `data-state` attribute will be set to `indeterminate`.

```tsx
<Progress.Root value={null}>
  <Progress.Track>
    <Progress.Indicator />
  </Progress.Track>
</Progress.Root>
```

{{"demo": "IndeterminateProgress.js"}}

## RTL

Set the `direction` prop to `'rtl'` to change the direction that the `Indicator` fills towards for right-to-left languages:

```jsx
<Progress.Root direction="rtl">{/* Subcomponents */}</Progress.Root>
```

{{"demo": "RtlProgress.js"}}

## Overriding default components

Use the `render` prop to override the rendered element for all subcomponents:

```jsx
<Progress.Indicator render={<MyCustomIndicator />} />
// or
<Progress.Indicator render={(props) => <MyCustomIndicator {...props} />} />
```

## Accessibility

The Progress component implements the [ARIA progressbar specification](https://www.w3.org/TR/wai-aria-1.2/#progressbar).

When using Progress, ensure that it has a human-readable text label by using either the `aria-label`, `aria-labelledby`, or `getAriaLabel` prop:

```tsx
<Progress.Root aria-labelledby="MyCustomLabel">
  <MyCustomLabel id="MyCustomLabel">Loading progress<MyCustomLabel/>
  <Progress.Track>
    <Progress.Indicator />
  </Progress.Track>
</Progress.Root>

// or

<Progress.Root aria-label="Loading progress">
  <Progress.Track>
    <Progress.Indicator />
  </Progress.Track>
</Progress.Root>
```
