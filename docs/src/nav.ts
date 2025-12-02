export interface NavItemn {
  label: string;
  href: string;
  external?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  label: string;
  links: NavItemn[];
}

export const nav: NavGroup[] = [
  {
    label: 'Overview',
    links: [
      {
        label: 'Quick start',
        href: '/react/overview/quick-start',
      },
      {
        label: 'Accessibility',
        href: '/react/overview/accessibility',
      },
      {
        label: 'Releases',
        href: '/react/overview/releases',
      },
      {
        label: 'About',
        href: '/react/overview/about',
      },
    ],
  },
  {
    label: 'Handbook',
    links: [
      {
        label: 'Styling',
        href: '/react/handbook/styling',
      },
      {
        label: 'Animation',
        href: '/react/handbook/animation',
      },
      {
        label: 'Composition',
        href: '/react/handbook/composition',
      },
      {
        label: 'Customization',
        href: '/react/handbook/customization',
      },
      {
        label: 'Forms',
        href: '/react/handbook/forms',
        isNew: true,
      },
      {
        label: 'TypeScript',
        href: '/react/handbook/typescript',
      },
      {
        label: 'llms.txt',
        external: true,
        href: '/llms.txt',
      },
    ],
  },
  {
    label: 'Components',
    links: [
      {
        label: 'Accordion',
        href: '/react/components/accordion',
      },
      {
        label: 'Alert Dialog',
        href: '/react/components/alert-dialog',
      },
      {
        label: 'Autocomplete',
        href: '/react/components/autocomplete',
      },
      {
        label: 'Avatar',
        href: '/react/components/avatar',
      },
      {
        label: 'Button',
        href: '/react/components/button',
        isNew: true,
      },
      {
        label: 'Checkbox',
        href: '/react/components/checkbox',
      },
      {
        label: 'Checkbox Group',
        href: '/react/components/checkbox-group',
      },
      {
        label: 'Collapsible',
        href: '/react/components/collapsible',
      },
      {
        label: 'Combobox',
        href: '/react/components/combobox',
      },
      {
        label: 'Context Menu',
        href: '/react/components/context-menu',
      },
      {
        label: 'Dialog',
        href: '/react/components/dialog',
      },
      {
        label: 'Field',
        href: '/react/components/field',
      },
      {
        label: 'Fieldset',
        href: '/react/components/fieldset',
      },
      {
        label: 'Form',
        href: '/react/components/form',
      },
      {
        label: 'Input',
        href: '/react/components/input',
      },
      {
        label: 'Menu',
        href: '/react/components/menu',
      },
      {
        label: 'Menubar',
        href: '/react/components/menubar',
      },
      {
        label: 'Meter',
        href: '/react/components/meter',
      },
      {
        label: 'Navigation Menu',
        href: '/react/components/navigation-menu',
      },
      {
        label: 'Number Field',
        href: '/react/components/number-field',
      },
      {
        label: 'Popover',
        href: '/react/components/popover',
      },
      {
        label: 'Preview Card',
        href: '/react/components/preview-card',
      },
      {
        label: 'Progress',
        href: '/react/components/progress',
      },
      {
        label: 'Radio',
        href: '/react/components/radio',
      },
      {
        label: 'Scroll Area',
        href: '/react/components/scroll-area',
      },
      {
        label: 'Select',
        href: '/react/components/select',
      },
      {
        label: 'Separator',
        href: '/react/components/separator',
      },
      {
        label: 'Slider',
        href: '/react/components/slider',
      },
      {
        label: 'Switch',
        href: '/react/components/switch',
      },
      {
        label: 'Tabs',
        href: '/react/components/tabs',
      },
      {
        label: 'Toast',
        href: '/react/components/toast',
      },
      {
        label: 'Toggle',
        href: '/react/components/toggle',
      },
      {
        label: 'Toggle Group',
        href: '/react/components/toggle-group',
      },
      {
        label: 'Toolbar',
        href: '/react/components/toolbar',
      },
      {
        label: 'Tooltip',
        href: '/react/components/tooltip',
      },
    ],
  },
  {
    label: 'Utilities',
    links: [
      {
        label: 'Direction Provider',
        href: '/react/utils/direction-provider',
      },
      {
        label: 'useRender',
        href: '/react/utils/use-render',
      },
    ],
  },
];
