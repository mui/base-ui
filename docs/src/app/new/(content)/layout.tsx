import * as React from 'react';
import * as SideNav from 'docs/src/components/SideNav';
import * as QuickNav from 'docs/src/components/quick-nav/QuickNav';
import './layout.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="ContentLayoutRoot">
      <SideNav.Root>
        {nav.map((section) => (
          <SideNav.Section key={section.label}>
            <SideNav.Heading>{section.label}</SideNav.Heading>
            <SideNav.List>
              {section.links.map((link) => (
                <SideNav.Item key={link.href} href={link.href}>
                  {link.label}
                </SideNav.Item>
              ))}
            </SideNav.List>
          </SideNav.Section>
        ))}
      </SideNav.Root>

      <main className="ContentLayoutMain">
        <QuickNav.Container>{children}</QuickNav.Container>
      </main>
    </div>
  );
}

const nav = [
  {
    label: 'Overview',
    links: [
      {
        label: 'Quick start',
        href: '/new/overview/quick-start',
      },
      {
        label: 'Accessibility',
        href: '/new/overview/accessibility',
      },
      {
        label: 'Releases',
        href: '/new/overview/releases',
      },
      {
        label: 'About',
        href: '/new/overview/about',
      },
    ],
  },
  {
    label: 'Handbook',
    links: [
      {
        label: 'Styling',
        href: '/new/handbook/styling',
      },
      {
        label: 'Animation',
        href: '/new/handbook/animation',
      },
      {
        label: 'Composition',
        href: '/new/handbook/composition',
      },
      {
        label: 'Migrating from Radix',
        href: '/new/handbook/migrating-from-radix',
      },
    ],
  },
  {
    label: 'Components',
    links: [
      {
        label: 'Alert Dialog',
        href: '/new/components/alert-dialog',
      },
      {
        label: 'Checkbox',
        href: '/new/components/checkbox',
      },
      {
        label: 'Checkbox Group',
        href: '/new/components/checkbox group',
      },
      {
        label: 'Collapsible',
        href: '/new/components/collapsible',
      },
      {
        label: 'Combobox',
        href: '/new/components/combobox',
      },
      {
        label: 'Datepicker',
        href: '/new/components/datepicker',
      },
      {
        label: 'Dialog',
        href: '/new/components/dialog',
      },
      {
        label: 'Field',
        href: '/new/components/field',
      },
      {
        label: 'Fieldset',
        href: '/new/components/fieldset',
      },
      {
        label: 'Form',
        href: '/new/components/form',
      },
      {
        label: 'Menu',
        href: '/new/components/menu',
      },
      {
        label: 'Number Field',
        href: '/new/components/number-field',
      },
      {
        label: 'Popover',
        href: '/new/components/popover',
      },
      {
        label: 'Preview Card',
        href: '/new/components/preview-card',
      },
      {
        label: 'Progress',
        href: '/new/components/progress',
      },
      {
        label: 'Radio Group',
        href: '/new/components/radio-group',
      },
      {
        label: 'Separator',
        href: '/new/components/separator',
      },
      {
        label: 'Slider',
        href: '/new/components/slider',
      },
      {
        label: 'Switch',
        href: '/new/components/switch',
      },
      {
        label: 'Tabs',
        href: '/new/components/tabs',
      },
      {
        label: 'Tooltip',
        href: '/new/components/tooltip',
      },
    ],
  },
];
