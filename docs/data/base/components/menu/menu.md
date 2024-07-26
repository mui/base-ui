---
productId: base-ui
title: React Menu components and hooks
components: MenuItem, MenuPositioner, MenuPopup, MenuRoot, MenuTrigger, SubmenuTrigger, MenuArrow
githubLabel: 'component: menu'
waiAria: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
---

# Menu

<p class="description">The Menu component provide end users with a list of options on temporary surfaces.</p>

{{"component": "@mui/docs/ComponentLinkHeader", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

{{"demo": "MenuIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

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
import * as Menu from '@base_ui/react/Menu';
```

## Anatomy

Menus are implemented using a collection of related components:

- `<Menu.Root />` is a top-level component that facilitates communication between other components. It does not render to the DOM.
- `<Menu.Trigger />` is an optional component (a button by default) that, when clicked, shows the menu. When not used, menu can be shown programmatically using the `open` prop.
- `<Menu.Positioner />` renders the element responsible for positioning the popup.
- `<Menu.Popup />` is the menu popup.
- `<Menu.Item />` is the menu item.
- `<Popover.Arrow />` renders an optional pointing arrow, placed inside the popup.
- `<Menu.SubmenuTrigger />` is a menu item that opens a submenu. See [Nested menu](#nested-menu) for more details.

```tsx
<Menu.Root>
  <Menu.Trigger />

  <Menu.Positioner>
    <Menu.Popup>
      <Menu.Item />
      <Menu.Item />

      <Menu.Root>
        <Menu.SubmenuTrigger />

        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Arrow />
            <Menu.Item />
            <Menu.Item />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Root>
    </Menu.Popup>
  </Menu.Positioner>
</Menu.Root>
```

## Placement

By default, the menu is placed on the bottom side of its trigger, the default anchor. To change this, use the `side` prop:

```jsx
<Menu.Root>
  <Menu.Trigger />
  <Menu.Positioner side="right">
    <Menu.Popup>
      <Menu.Item>Item 1</Menu.Item>
    </Menu.Popup>
  </Menu.Positioner>
</Menu.Root>
```

You can also change the alignment of the menu in relation to its anchor. By default, aligned to the leading edge of an anchor, but it can be configured otherwise using the `alignment` prop:

```jsx
<Menu.Root>
  <Menu.Trigger />
  <Menu.Positioner side="right" alignment="end">
    <Menu.Popup>
      <Menu.Item>Item 1</Menu.Item>
    </Menu.Popup>
  </Menu.Positioner>
</Menu.Root>
```

Due to collision detection, the menu may change its placement to avoid overflow. Therefore, your explicitly specified `side` and `alignment` props act as "ideal", or preferred, values.

To access the true rendered values, which may change as the result of a collision, the menu element receives data attributes:

```jsx
// Rendered HTML (simplified)
<div>
  <div data-side="left" data-alignment="end">
    <div>Item 1</div>
  </div>
</div>
```

This allows you to conditionally style the menu based on its rendered side or alignment.

## Offset

The `sideOffset` prop creates a gap between the anchor and menu popup, while `alignmentOffset` slides the menu popup from its alignment, acting logically for `start` and `end` alignments.

```jsx
<Menu.Positioner sideOffset={10} alignmentOffset={10}>
```

## Orientation

By default, menus are vertical, so the up/down arrow keys navigate through options and left/right keys open and close submenus.
You can change this with the `orientation` prop"

```jsx
<Menu.Root orientation="horizontal">
  <Menu.Trigger />
  <Menu.Positioner>
    <Menu.Popup>
      <Menu.Item>Item 1</Menu.Item>
    </Menu.Popup>
  </Menu.Positioner>
</Menu.Root>
```

## Hover

To open the Menu on hover, add the `openOnHover` prop:

```jsx
<Menu.Root openOnHover>
```

By default submenus are opened on hover, but top-level menus aren't.

### Delay

To change how long the menu waits until it opens or closes when `openOnHover` is enabled, use the `delay` prop, which represent how long the Menu waits after the cursor enters the trigger, in milliseconds:

```jsx
<Menu.Root openOnHover delay={200}>
```

## Nested menu

Menu items can open submenus.
To make this happen, place the `<Menu.Root>` with all its required children where a submenu trigger has to be placed, but instead of `<Menu.Trigger>`, use `<Menu.SubitemTrigger>`, as on the demo below.

{{"demo": "NestedMenu.js"}}

### Escape key behavior

You can control if pressing the <kbd class="key">Escape</kbd> key closes just the current submenu or the whole tree.
By default, the whole menu closes, but setting the `closeParentOnEsc` prop modifies this behavior:

```jsx
<Menu.Root>
  <Menu.Trigger />
  <Menu.Positioner>
    <Menu.Popup>
      <Menu.Item>Item 1</Menu.Item>
      <Menu.Root closeParentOnEsc={false}>
        <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>

        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item>Submenu item 1</Menu.Item>
            <Menu.Item>Submenu item 2</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Root>
    </Menu.Popup>
  </Menu.Positioner>
</Menu.Root>
```

## Arrow

To add an arrow (caret or triangle) inside the menu popup that points toward the center of the anchor element, use the `Menu.Arrow` component:

```jsx
<Menu.Positioner>
  <Menu.Popup>
    <Menu.Arrow />
    <Menu.Item>Item 1</Menu.Item>
    <Menu.Item>Item 2</Menu.Item>
  </Menu.Popup>
</Menu.Positioner>
```

It automatically positions a wrapper element that can be styled or contain a custom SVG shape.

## Animations

The menu can animate when opening or closing with either:

- CSS transitions
- CSS animations
- JavaScript animations

### CSS transitions

Here is an example of how to apply a symmetric scale and fade transition with the default conditionally-rendered behavior:

```jsx
<Menu.Popup className="MenuPopup">
  <Menu.Item>Item 1</Menu.Item>
</Menu.Popup>
```

```css
.MenuPopup {
  transform-origin: var(--transform-origin);
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  /* Represents the final styles once exited */
  opacity: 0;
  transform: scale(0.9);
}

/* Represents the final styles once entered */
.MenuPopup[data-state='open'] {
  opacity: 1;
  transform: scale(1);
}

/* Represents the initial styles when entering */
.MenuPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}
```

Styles need to be applied in three states:

- The exiting styles, placed on the base element class
- The open styles, placed on the base element class with `[data-state="open"]`
- The entering styles, placed on the base element class with `[data-entering]`

In newer browsers, there is a feature called `@starting-style` which allows transitions to occur on open for conditionally-mounted components:

```css
/* Base UI API - Polyfill */
.MenuPopup[data-entering] {
  opacity: 0;
  transform: scale(0.9);
}

/* Official Browser API - no Firefox support as of May 2024 */
@starting-style {
  .MenuPopup[data-state='open'] {
    opacity: 0;
    transform: scale(0.9);
  }
}
```

### CSS animations

CSS animations can also be used, requiring only two separate declarations:

```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}

@keyframes scale-out {
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

.MenuPopup {
  animation: scale-in 0.2s forwards;
}

.MenuPopup[data-exiting] {
  animation: scale-out 0.2s forwards;
}
```

### JavaScript animations

The `keepMounted` prop lets an external library control the mounting, for example `framer-motion`'s `AnimatePresence` component.

```js
function App() {
  const [open, setOpen] = useState(false);
  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger>Trigger</Menu.Trigger>
      <AnimatePresence>
        {open && (
          <Menu.Positioner keepMounted>
            <Menu.Popup
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              }
            >
              <Menu.Item>Item 1</Menu.Item>
              <Menu.Item>Item 2</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        )}
      </AnimatePresence>
    </Menu.Root>
  );
}
```

### Animation states

Four states are available as data attributes to animate the popup, which enables full control depending on whether the popup is being animated with CSS transitions or animations, JavaScript, or is using the `keepMounted` prop.

- `[data-state="open"]` - `open` state is `true`.
- `[data-state="closed"]` - `open` state is `false`. Can still be mounted to the DOM if closing.
- `[data-entering]` - the popup was just inserted to the DOM. The attribute is removed 1 animation frame later. Enables "starting styles" upon insertion for conditional rendering.
- `[data-exiting]` - the popup is in the process of being removed from the DOM, but is still mounted.

## Overriding default components

Use the `render` prop to override the rendered elements with your own components.

```jsx
// Element shorthand
<Menu.Popup render={<MyMenuPopup />} />
```

```jsx
// Function
<Menu.Popup render={(props) => <MyMenuPopup {...props} />} />
```
