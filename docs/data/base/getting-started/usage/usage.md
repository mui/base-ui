# Usage

<p class="description">Learn the basics of working with Base UI components.</p>

## Responsive meta tag

Base UI is a _mobile-first_ component library—we write code for mobile devices first, and then scale up the components as necessary using CSS media queries.

To ensure proper rendering and touch zooming for all devices, add the responsive viewport meta tag to your `<head>` element:

```html
<meta name="viewport" content="initial-scale=1, width=device-width" />
```

## Shared props

Base components are self-supporting and fully functional in isolation.

Each component has its own unique API, but all _non-utility_ components accept the following shared props:

### render

The `render` prop lets you override the rendered element of the component.

For example, the Base UI Switch component renders a `<button>` by default.
The code snippet below shows how to use a custom component instead.

```jsx
<Switch.Root render={<MyFancyButton />} />
```

The custom component must forward a ref to its underlying DOM node and it must spread all the received props.

The `render` prop comes in two variants: the element one (as shown above) and the function one.
Using a function gives you complete control over spreading props and allows you to render different content based on the component's state.

```jsx
<Switch.Thumb
  render={(props, internalState) => (
    <span {...props}>
      {internalState.checked ? <CheckedIcon /> : <UncheckedIcon />}
    </span>
  )}
/>
```

### className

The `className` prop, in addition to accepting a string, can be defined as a function that takes a component state as an argument:

```jsx
<Switch.Thumb className={(state) => (state.checked ? 'checked' : 'unchecked')} />
```

## Components vs. hooks

Base UI includes two kinds of building blocks: **components** and **hooks**.

:::info
Hooks encapsulate _logic_; components provide _structure_.
:::

Many Base UI components are implemented with the help of [React hooks](https://react.dev/reference/react/hooks).
You can use components or hooks—or a combination of both—when building custom components.

In general, we recommend that you begin building with the component, and if you find that you are too limited by the customization options available, then consider refactoring your component to use the corresponding hook instead.
