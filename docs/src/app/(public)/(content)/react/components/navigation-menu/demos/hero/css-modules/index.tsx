import * as React from 'react';
import Link from 'next/link';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import styles from './index.module.css';

export default function ExampleNavigationMenu() {
  return (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Overview
            <ChevronDownIcon className={styles.Icon} />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <ul className={styles.GridLinkList}>
              <li>
                <NavigationMenu.Link
                  className={styles.LinkCard}
                  render={<Link href="/react/overview/quick-start" />}
                >
                  <div>
                    <p className={styles.LinkTitle}>Quick Start</p>
                    <p className={styles.LinkDescription}>
                      Install and assemble your first component.
                    </p>
                  </div>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  className={styles.LinkCard}
                  render={<Link href="/react/overview/accessibility" />}
                >
                  <div>
                    <p className={styles.LinkTitle}>Accessibility</p>
                    <p className={styles.LinkDescription}>
                      Learn how we build accessible components.
                    </p>
                  </div>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  className={styles.LinkCard}
                  render={<Link href="/react/overview/releases" />}
                >
                  <div>
                    <p className={styles.LinkTitle}>Releases</p>
                    <p className={styles.LinkDescription}>
                      See what’s new in the latest versions.
                    </p>
                  </div>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  className={styles.LinkCard}
                  render={<Link href="/react/overview/about" />}
                >
                  <div>
                    <p className={styles.LinkTitle}>About</p>
                    <p className={styles.LinkDescription}>
                      Learn more about Base UI and our mission.
                    </p>
                  </div>
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Handbook
            <ChevronDownIcon className={styles.Icon} />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <ul className={styles.FlexLinkList}>
              <li>
                <NavigationMenu.Link
                  className={styles.LinkCard}
                  render={<Link href="/react/handbook/styling" />}
                >
                  <div>
                    <p className={styles.LinkTitle}>Styling</p>
                    <p className={styles.LinkDescription}>
                      Base UI components can be styled with plain CSS, Tailwind CSS,
                      CSS-in-JS, or CSS Modules.
                    </p>
                  </div>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  className={styles.LinkCard}
                  render={<Link href="/react/handbook/animation" />}
                >
                  <div>
                    <p className={styles.LinkTitle}>Animation</p>
                    <p className={styles.LinkDescription}>
                      Base UI components can be animated with CSS transitions, CSS
                      animations, or JavaScript libraries.
                    </p>
                  </div>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  className={styles.LinkCard}
                  render={<Link href="/react/handbook/composition" />}
                >
                  <div>
                    <p className={styles.LinkTitle}>Composition</p>
                    <p className={styles.LinkDescription}>
                      Base UI components can be replaced and composed with your own
                      existing components.
                    </p>
                  </div>
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link
            className={styles.Trigger}
            render={<Link href="/careers/design-engineer" />}
          >
            Careers
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner className={styles.Positioner} sideOffset={5}>
          <NavigationMenu.Popup className={styles.Popup}>
            <NavigationMenu.Arrow className={styles.Arrow}>
              <ArrowSvg />
            </NavigationMenu.Arrow>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
}
