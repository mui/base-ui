export interface Release {
  version: string;
  versionSlug: string;
  date: string;
  highlights: string[];
}

export const releases: Release[] = [
  {
    version: 'v1.1.0',
    versionSlug: 'v1-1-0',
    date: '2026-01-15',
    highlights: [
      'New CSP Provider component for Content Security Policy support',
      'Added loopFocus prop to Autocomplete and Combobox',
      'Fixed multiple accessibility and form integration issues',
      'Improved popup state attributes and detached trigger handling',
    ],
  },
  {
    version: 'v1.0.0',
    versionSlug: 'v1-0-0',
    date: '2025-12-11',
    highlights: [
      'Renamed packages to use the @base-ui org',
      'Fixed focus and transition issues across multiple components',
      'Improved accessibility and form submission handling',
    ],
  },
  {
    version: 'v1.0.0-rc.2',
    versionSlug: 'v1-0-0-rc-2',
    date: '2025-12-11',
    highlights: ['Same code as v1.0.0'],
  },
  {
    version: 'v1.0.0-rc.1',
    versionSlug: 'v1-0-0-rc-1',
    date: '2025-12-11',
    highlights: ['Same code as v1.0.0'],
  },
  {
    version: 'v1.0.0-rc.0',
    versionSlug: 'v1-0-0-rc-0',
    date: '2025-12-04',
    highlights: [
      'Fixed missing "use client" directives',
      'Breaking change: Match native unchecked state in Checkbox and Switch form submission',
      'Breaking change: Fixed Panel keepMounted behavior in Tabs',
      'Improved Number Field parsing and validation',
    ],
  },
  {
    version: 'v1.0.0-beta.7',
    versionSlug: 'v1-0-0-beta-7',
    date: '2025-11-27',
    highlights: [
      'Fixed error about props.ref access in React <=18',
      'Improved performance when detached triggers are used',
      'Fixed iOS VoiceOver voice control accessibility',
      'Improved popups anchoring and auto-focus behavior',
    ],
  },
  {
    version: 'v1.0.0-beta.6',
    versionSlug: 'v1-0-0-beta-6',
    date: '2025-11-17',
    highlights: [
      'Hotfix for Alert Dialog, Dialog, Menu, Popover, and Tooltip in React Server Components',
      'Fixed refs types in Checkbox, Switch and Radio components',
    ],
  },
  {
    version: 'v1.0.0-beta.5',
    versionSlug: 'v1-0-0-beta-5',
    date: '2025-11-17',
    highlights: [
      'Breaking change: Replaced trackAnchor with disableAnchorTracking',
      'Breaking change: Renamed loop to loopFocus',
      'New Button component',
      'Support for detached triggers in multiple components',
      'Improved form handling and validation',
    ],
  },
  {
    version: 'v1.0.0-beta.4',
    versionSlug: 'v1-0-0-beta-4',
    date: '2025-10-01',
    highlights: [
      'Breaking change: Generic event details API',
      'Improved Combobox with support for object values',
      'Enhanced Select with item anchoring improvements',
      'Better Toast stacking with variable height support',
    ],
  },
  {
    version: 'v1.0.0-beta.3',
    versionSlug: 'v1-0-0-beta-3',
    date: '2025-09-03',
    highlights: [
      'Breaking change: Base UI event details standardization',
      'New Autocomplete component',
      'New Combobox component',
      'Support for initialFocus and finalFocus functions',
    ],
  },
  {
    version: 'v1.0.0-beta.2',
    versionSlug: 'v1-0-0-beta-2',
    date: '2025-07-30',
    highlights: [
      'Breaking change: Navigation Menu semantic element structure',
      'Added multiple prop to Select',
      'Improved outside press behavior with touch input',
      'Better ShadowRoot container support',
    ],
  },
  {
    version: 'v1.0.0-beta.1',
    versionSlug: 'v1-0-0-beta-1',
    date: '2025-07-01',
    highlights: [
      'Breaking change: Support implicit Field.Label',
      'Context Menu SubmenuRoot part added',
      'Enable custom validation based on other form values',
      'Improved Accordion and Collapsible content resizing',
    ],
  },
  {
    version: 'v1.0.0-beta.0',
    versionSlug: 'v1-0-0-beta-0',
    date: '2025-05-29',
    highlights: [
      'New Context Menu component',
      'New Menubar component',
      'New Navigation Menu component',
      'Checkbox Group value submission improvements',
      'Major refinements to OpenChangeReason',
    ],
  },
  {
    version: 'v1.0.0-alpha.8',
    versionSlug: 'v1-0-0-alpha-8',
    date: '2025-04-17',
    highlights: [
      'New Meter component',
      'New Toast component',
      'Reworked animations and transitions for Accordion and Collapsible',
      'Improved NumberField with snapOnStep prop',
    ],
  },
  {
    version: 'v1.0.0-alpha.7',
    versionSlug: 'v1-0-0-alpha-7',
    date: '2025-03-20',
    highlights: [
      'New Toolbar component',
      'Avatar component support',
      'NumberField locale support and parsing improvements',
      'Better focus restoration and modal handling',
    ],
  },
  {
    version: 'v1.0.0-alpha.6',
    versionSlug: 'v1-0-0-alpha-6',
    date: '2025-02-06',
    highlights: [
      'Added onOpenChangeComplete prop to multiple components',
      'Progress component Value part and format prop',
      'Field filled and focused style hooks',
      'Support for submenus with openOnHover prop',
    ],
  },
  {
    version: 'v1.0.0-alpha.5',
    versionSlug: 'v1-0-0-alpha-5',
    date: '2025-01-10',
    highlights: [
      'Breaking change: Portal part required for dialogs and popups',
      'Improved nested dialog handling',
      'ScrollArea RTL support and orientation improvements',
      'Slider thumb positioning improvements',
    ],
  },
  {
    version: 'v1.0.0-alpha.4',
    versionSlug: 'v1-0-0-alpha-4',
    date: '2024-12-17',
    highlights: ['Public alpha launch 🐣'],
  },
];
