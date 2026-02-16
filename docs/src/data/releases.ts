export interface Release {
  version: string;
  versionSlug: string;
  date: string;
  highlights: string[];
  latest?: true;
}

export const releases: Release[] = [
  {
    latest: true,
    version: 'v1.2.0',
    versionSlug: 'v1-2-0',
    date: '2026-02-12',
    highlights: [
      'New `Drawer` component (preview).',
      'New `useFilteredItems` hook for `Autocomplete` and `Combobox`.',
      'Support lazy element in `render`.',
      'Tons of `Combobox` and `Autocomplete` improvements.',
      'Support `keepMounted` on `NavigationMenu`.',
      'Support `finalFocus` on `Select`.',
    ],
  },
  {
    version: 'v1.1.0',
    versionSlug: 'v1-1-0',
    date: '2026-01-15',
    highlights: [
      '`loopFocus` support for `Autocomplete` + `Combobox`.',
      'New state attributes for `Autocomplete` + `Combobox`.',
      'New `placeholder` prop for `Combobox` + `Select`.',
      'New `CSPProvider` for configuring CSP behaviour.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0',
    versionSlug: 'v1-0-0',
    date: '2025-12-11',
    highlights: [
      'Stable 🎉',
      '35 unstyled UI components.',
      'New `@base-ui/react` npm package.',
      'New website.',
      'Fixed focus and transition issues across multiple components.',
      'Improved accessibility and form submission handling.',
    ],
  },
  {
    version: 'v1.0.0-rc.2',
    versionSlug: 'v1-0-0-rc-2',
    date: '2025-12-11',
    highlights: ['Same code as v1.0.0.'],
  },
  {
    version: 'v1.0.0-rc.1',
    versionSlug: 'v1-0-0-rc-1',
    date: '2025-12-11',
    highlights: ['Same code as v1.0.0.'],
  },
  {
    version: 'v1.0.0-rc.0',
    versionSlug: 'v1-0-0-rc-0',
    date: '2025-12-04',
    highlights: [
      "Fixed missing `'use client'` directives.",
      'Breaking change: Match native unchecked state in `Checkbox` and `Switch`.',
      'Breaking change: Fixed `Panel` `keepMounted` behavior in `Tabs`.',
      'Breaking change: Removed the `keepHighlight` prop from `Combobox`.',
      'New `highlightItemOnHover` prop for `Menu` and `Select`.',
      'Improved `NumberField` parsing and validation.',
      'Fixed `Dialog` and `Popover` closing behavior.',
    ],
  },
  {
    version: 'v1.0.0-beta.7',
    versionSlug: 'v1-0-0-beta-7',
    date: '2025-11-27',
    highlights: [
      'Fixed error about `props.ref` access in React <=18.',
      'Improved performance when detached triggers are used.',
      'Fixed iOS VoiceOver voice control accessibility.',
      'Improved popups anchoring and auto-focus behavior.',
    ],
  },
  {
    version: 'v1.0.0-beta.6',
    versionSlug: 'v1-0-0-beta-6',
    date: '2025-11-17',
    highlights: [
      'Hotfix for `AlertDialog`, `Dialog`, `Menu`, `Popover`, and `Tooltip` in React Server Components.',
      'Fixed refs types in `Checkbox`, `Switch` and `Radio` components.',
    ],
  },
  {
    version: 'v1.0.0-beta.5',
    versionSlug: 'v1-0-0-beta-5',
    date: '2025-11-17',
    highlights: [
      'New `Button` component.',
      'Detachable triggers for popup components.',
      'Improved scrollbar support for popups.',
      'Huge `Autocomplete` + `Combobox` improvements.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-beta.4',
    versionSlug: 'v1-0-0-beta-4',
    date: '2025-10-01',
    highlights: [
      'New `autoHighlight` prop on `Combobox`.',
      '`openMultiple` + `toggleMultiple` renamed to `multiple`.',
      'New `Select.List` component.',
      'New `thumbAlignment` prop on `Slider`.',
      'Support for variable height `Toast`.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-beta.3',
    versionSlug: 'v1-0-0-beta-3',
    date: '2025-09-03',
    highlights: [
      'New `Combobox` + `Autocomplete` components.',
      '`initialFocus` + `finalFocus` now accept functions.',
      '`useRender` hook enhancements.',
      'Improved SSR support.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-beta.2',
    versionSlug: 'v1-0-0-beta-2',
    date: '2025-07-30',
    highlights: [
      'New `multiple` prop on `Select` to create a multi-select.',
      'New `llms.txt` and markdown links for AI.',
    ],
  },
  {
    version: 'v1.0.0-beta.1',
    versionSlug: 'v1-0-0-beta-1',
    date: '2025-07-01',
    highlights: [
      'New `SubmenuRoot` part for menus.',
      'Fixes for `Accordion` + `Collapsible` resizing.',
      'Perf enhancements for `Select`.',
      'Many small fixes for menus.',
      '`useRender` now RSC compatible.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-beta.0',
    versionSlug: 'v1-0-0-beta-0',
    date: '2025-05-29',
    highlights: [
      'New `Menubar` component.',
      'New `NavigationMenu` component.',
      'New `ContextMenu` component.',
      'Improved performance.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-alpha.8',
    versionSlug: 'v1-0-0-alpha-8',
    date: '2025-04-17',
    highlights: [
      'New `Toast` component.',
      'New `Meter` component.',
      'Composable popup modality.',
      'Configurable `NumberField` snapping.',
      'New `Content` part for `ScrollArea`.',
      'New `Label` part for `Progress`.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-alpha.7',
    versionSlug: 'v1-0-0-alpha-7',
    date: '2025-03-20',
    highlights: [
      'New `Toolbar` component.',
      'New `useRender` hook.',
      'New `modal` prop on `Popover`.',
      'New `actionsRef` prop on popups.',
      'New `locale` prop on `NumberField`.',
    ],
  },
  {
    version: 'v1.0.0-alpha.6',
    versionSlug: 'v1-0-0-alpha-6',
    date: '2025-02-06',
    highlights: [
      'New `Avatar` component.',
      'New `filled` and `focused` style hooks for `Field`.',
      'New `Value` part for `Progress`.',
      'Support submenus when `openOnHover` is present.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-alpha.5',
    versionSlug: 'v1-0-0-alpha-5',
    date: '2025-01-10',
    highlights: [
      'New `Portal` part for popup components.',
      'Improved modality of popup components.',
      'Fixed `openOnHover` issues for popup components.',
      'Fixed Enter key bug when rendering menuitem as `<a>`.',
      'Many a11y and bug fixes.',
    ],
  },
  {
    version: 'v1.0.0-alpha.4',
    versionSlug: 'v1-0-0-alpha-4',
    date: '2024-12-17',
    highlights: [
      '25 accessible UI components.',
      'Unstyled. Compatible with any styling engine.',
      'Fully composable with an open API.',
    ],
  },
];
