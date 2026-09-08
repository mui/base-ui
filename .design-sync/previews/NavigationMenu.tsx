import * as React from 'react';
import { NavigationMenu } from '@base-ui/react';
import './NavigationMenu.css';

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

const overviewLinks = [
  {
    href: '/react/overview/quick-start',
    title: 'Quick Start',
    description: 'Install and assemble your first component.',
  },
  {
    href: '/react/overview/accessibility',
    title: 'Accessibility',
    description: 'Learn how we build accessible components.',
  },
  {
    href: '/react/overview/releases',
    title: 'Releases',
    description: 'See what’s new in the latest Base UI versions.',
  },
  {
    href: '/react/overview/about',
    title: 'About',
    description: 'Learn more about Base UI and our mission.',
  },
] as const;

const handbookLinks = [
  {
    href: '/react/handbook/styling',
    title: 'Styling',
    description:
      'Base UI components can be styled with plain CSS, Tailwind CSS, CSS-in-JS, or CSS Modules.',
  },
  {
    href: '/react/handbook/animation',
    title: 'Animation',
    description:
      'Base UI components can be animated with CSS transitions, CSS animations, or JavaScript libraries.',
  },
  {
    href: '/react/handbook/composition',
    title: 'Composition',
    description:
      'Base UI components can be replaced and composed with your own existing components.',
  },
] as const;

export const Basic = () => (
  <NavigationMenu.Root className="Root" defaultValue="overview">
    <NavigationMenu.List className="List">
      <NavigationMenu.Item value="overview">
        <NavigationMenu.Trigger className="Trigger">
          Overview
          <NavigationMenu.Icon className="Icon">
            <CaretDownIcon />
          </NavigationMenu.Icon>
        </NavigationMenu.Trigger>
        <NavigationMenu.Content className="Content">
          <ul className="GridLinkList">
            {overviewLinks.map((item) => (
              <li key={item.href}>
                <NavigationMenu.Link className="LinkCard" href={item.href}>
                  <h3 className="LinkTitle">{item.title}</h3>
                  <p className="LinkDescription">{item.description}</p>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </NavigationMenu.Content>
      </NavigationMenu.Item>

      <NavigationMenu.Item value="handbook">
        <NavigationMenu.Trigger className="Trigger">
          Handbook
          <NavigationMenu.Icon className="Icon">
            <CaretDownIcon />
          </NavigationMenu.Icon>
        </NavigationMenu.Trigger>
        <NavigationMenu.Content className="Content">
          <ul className="FlexLinkList">
            {handbookLinks.map((item) => (
              <li key={item.href}>
                <NavigationMenu.Link className="LinkCard" href={item.href}>
                  <h3 className="LinkTitle">{item.title}</h3>
                  <p className="LinkDescription">{item.description}</p>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </NavigationMenu.Content>
      </NavigationMenu.Item>

      <NavigationMenu.Item>
        <NavigationMenu.Link className="Trigger" href="https://github.com/mui/base-ui">
          GitHub
        </NavigationMenu.Link>
      </NavigationMenu.Item>
    </NavigationMenu.List>

    <NavigationMenu.Portal>
      <NavigationMenu.Positioner
        className="Positioner"
        sideOffset={10}
        collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
        collisionAvoidance={{ side: 'none' }}
      >
        <NavigationMenu.Popup className="Popup">
          <NavigationMenu.Arrow className="Arrow" />
          <NavigationMenu.Viewport className="Viewport" />
        </NavigationMenu.Popup>
      </NavigationMenu.Positioner>
    </NavigationMenu.Portal>
  </NavigationMenu.Root>
);
