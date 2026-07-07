import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import styles from './navigation-menu.module.css';

/**
 * Stories follow research/c-components/navigation-menu (Tier 1): the kept docs
 * demos (hero, nested submenu, nested inline submenu), one story per documented
 * use case with the required viewport-morph and keyboard interaction coverage.
 * Real-world recreations are pending Phase D data ([G] — no ranked.json yet).
 *
 * Portal note: the popup subtree mounts on document.body, so plays query via
 * `within(canvasElement.ownerDocument.body)`. Plays prefer click over hover —
 * hover intent (safePolygon + 50ms delay) is timing-sensitive; the two stories
 * that exist to document hover behavior are the only ones that hover.
 */
const meta = {
  title: 'Navigation/Navigation Menu',
  component: NavigationMenu.Root,
  subcomponents: {
    'NavigationMenu.List': NavigationMenu.List,
    'NavigationMenu.Item': NavigationMenu.Item,
    'NavigationMenu.Trigger': NavigationMenu.Trigger,
    'NavigationMenu.Icon': NavigationMenu.Icon,
    'NavigationMenu.Content': NavigationMenu.Content,
    'NavigationMenu.Link': NavigationMenu.Link,
    'NavigationMenu.Portal': NavigationMenu.Portal,
    'NavigationMenu.Backdrop': NavigationMenu.Backdrop,
    'NavigationMenu.Positioner': NavigationMenu.Positioner,
    'NavigationMenu.Popup': NavigationMenu.Popup,
    'NavigationMenu.Viewport': NavigationMenu.Viewport,
    'NavigationMenu.Arrow': NavigationMenu.Arrow,
  },
} satisfies Meta<typeof NavigationMenu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

/** The full Portal → Positioner → Popup → Viewport chain from the hero demo. */
function Flyout(props: NavigationMenu.Positioner.Props) {
  return (
    <NavigationMenu.Portal>
      <NavigationMenu.Positioner
        className={styles.Positioner}
        sideOffset={10}
        collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
        collisionAvoidance={{ side: 'none' }}
        {...props}
      >
        <NavigationMenu.Popup className={styles.Popup}>
          <NavigationMenu.Arrow className={styles.Arrow} />
          <NavigationMenu.Viewport className={styles.Viewport} />
        </NavigationMenu.Popup>
      </NavigationMenu.Positioner>
    </NavigationMenu.Portal>
  );
}

function Link(props: NavigationMenu.Link.Props) {
  return (
    <NavigationMenu.Link
      render={
        // Use the `render` prop to render your framework's Link component
        // for client-side routing, e.g. `<NextLink href={props.href} />`.
        // The real href always arrives via the `{...props}` spread below.
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a />
      }
      {...props}
    />
  );
}

const overviewLinks = [
  {
    href: '#quick-start',
    title: 'Quick Start',
    description: 'Install and assemble your first component.',
  },
  {
    href: '#accessibility',
    title: 'Accessibility',
    description: 'Learn how we build accessible components.',
  },
  {
    href: '#releases',
    title: 'Releases',
    description: 'See what’s new in the latest versions.',
  },
  {
    href: '#about',
    title: 'About',
    description: 'Learn more about the project and our mission.',
  },
] as const;

const handbookLinks = [
  {
    href: '#styling',
    title: 'Styling',
    description: 'Plain CSS, Tailwind CSS, CSS-in-JS, or CSS Modules.',
  },
  {
    href: '#animation',
    title: 'Animation',
    description: 'CSS transitions, CSS animations, or JS libraries.',
  },
  {
    href: '#composition',
    title: 'Composition',
    description: 'Replace and compose parts with your own components.',
  },
] as const;

function LinkCards({
  links,
}: {
  links: ReadonlyArray<{ href: string; title: string; description: string }>;
}) {
  return (
    <ul className={styles.FlexLinkList}>
      {links.map((item) => (
        <li key={item.href}>
          <Link className={styles.LinkCard} href={item.href}>
            <h3 className={styles.LinkTitle}>{item.title}</h3>
            <p className={styles.LinkDescription}>{item.description}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Kept docs demos                                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a `<nav>` bar whose triggers open link-card panels in one shared, morphing popup, plus a plain link item — triggers and plain links mix freely in one List. */
export const Hero: Story = {
  render: () => (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Overview
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <ul className={styles.GridLinkList}>
              {overviewLinks.map((item) => (
                <li key={item.href}>
                  <Link className={styles.LinkCard} href={item.href}>
                    <h3 className={styles.LinkTitle}>{item.title}</h3>
                    <p className={styles.LinkDescription}>{item.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Handbook
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <LinkCards links={handbookLinks} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <Link
            className={styles.Trigger}
            href="#github"
            onClick={(event) => event.preventDefault()}
          >
            GitHub
          </Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <Flyout />
    </NavigationMenu.Root>
  ),
};

function NestedPopupSubmenuExample() {
  return (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Overview
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <ul className={styles.FlexLinkList}>
              {overviewLinks.slice(0, 2).map((item) => (
                <li key={item.href}>
                  <Link className={styles.LinkCard} href={item.href}>
                    <h3 className={styles.LinkTitle}>{item.title}</h3>
                    <p className={styles.LinkDescription}>{item.description}</p>
                  </Link>
                </li>
              ))}
              <li>
                {/* A full nested Root (renders <div>, not <nav>) opens a second
                    flyout beside the first and shares its dismissal tree. */}
                <NavigationMenu.Root orientation="vertical">
                  <NavigationMenu.List>
                    <NavigationMenu.Item>
                      <NavigationMenu.Trigger className={styles.LinkCard}>
                        <span className={styles.LinkTitle}>Handbook</span>
                        <p className={styles.LinkDescription}>
                          How to use the library effectively.
                        </p>
                        <NavigationMenu.Icon className={styles.NestedIcon}>
                          <CaretRightIcon />
                        </NavigationMenu.Icon>
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className={styles.Content}>
                        <LinkCards links={handbookLinks} />
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  </NavigationMenu.List>

                  <NavigationMenu.Portal>
                    <NavigationMenu.Positioner
                      className={styles.Positioner}
                      sideOffset={8}
                      alignOffset={-8}
                      align="end"
                      side="right"
                    >
                      <NavigationMenu.Popup className={styles.Popup}>
                        <NavigationMenu.Viewport className={styles.Viewport} />
                      </NavigationMenu.Popup>
                    </NavigationMenu.Positioner>
                  </NavigationMenu.Portal>
                </NavigationMenu.Root>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <Flyout collisionAvoidance={undefined} />
    </NavigationMenu.Root>
  );
}

/** The docs "Nested submenus" demo: a nested vertical `Root` with its own Portal/Positioner inside a parent `Content` opens a second flyout beside the first — both share one FloatingTree so dismissal propagates ([#2978](https://github.com/mui/base-ui/pull/2978)). */
export const NestedPopupSubmenu: Story = {
  render: () => <NestedPopupSubmenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());

    // The nested trigger lives inside the first popup's panel.
    const nestedTrigger = body.getByRole('button', { name: /Handbook/ });
    await userEvent.click(nestedTrigger);

    // A second flyout opens beside the first; the parent panel stays open.
    await waitFor(() => expect(body.getByRole('link', { name: /Styling/ })).toBeVisible());
    await expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible();
    await expect(nestedTrigger).toHaveAttribute('aria-expanded', 'true');
  },
};

const audienceMenus = [
  {
    value: 'developers',
    label: 'For developers',
    hint: 'APIs and integration guides',
    title: 'Build on the platform',
    links: [
      { href: '#components', title: 'Components', description: 'Composable building blocks.' },
      { href: '#hooks', title: 'Hooks', description: 'Headless state and behavior.' },
    ],
  },
  {
    value: 'designers',
    label: 'For designers',
    hint: 'Kits, tokens, and specs',
    title: 'Design with the system',
    links: [
      { href: '#figma-kit', title: 'Figma kit', description: 'Every part, every state.' },
      { href: '#tokens', title: 'Design tokens', description: 'Color, type, and spacing.' },
    ],
  },
] as const;

function NestedInlineSubmenuExample() {
  return (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Product
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={`${styles.Content} ${styles.InlineContent}`}>
            {/* Inline mode: the nested Root renders only List + Viewport with a
                defaultValue — content swaps inside the parent's panel with no
                new Portal/Positioner/Popup (#2269). */}
            <NavigationMenu.Root orientation="vertical" defaultValue="developers">
              <div className={styles.SubmenuLayout}>
                <NavigationMenu.List className={styles.SubmenuList}>
                  {audienceMenus.map((menu) => (
                    <NavigationMenu.Item key={menu.value} value={menu.value}>
                      <NavigationMenu.Trigger className={styles.SubmenuTrigger}>
                        <span className={styles.SubmenuLabel}>{menu.label}</span>
                        <span className={styles.SubmenuHint}>{menu.hint}</span>
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content className={styles.SubmenuContent}>
                        <h4 className={styles.SubmenuTitle}>{menu.title}</h4>
                        <ul className={styles.LinkList}>
                          {menu.links.map((link) => (
                            <li key={link.href}>
                              <Link className={styles.LinkCard} href={link.href}>
                                <h5 className={styles.LinkTitle}>{link.title}</h5>
                                <p className={styles.LinkDescription}>{link.description}</p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenu.Content>
                    </NavigationMenu.Item>
                  ))}
                </NavigationMenu.List>

                <NavigationMenu.Viewport className={styles.SubmenuViewport} />
              </div>
            </NavigationMenu.Root>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <Link className={styles.Trigger} href="#releases">
            Releases
          </Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <Flyout />
    </NavigationMenu.Root>
  );
}

/** The docs "Nested inline submenus" demo: Portal/Positioner/Popup are optional as a group — a nested `Root` rendering only `List` + `Viewport` (with `defaultValue`) swaps second-level content in place inside the parent panel. */
export const NestedInlineSubmenu: Story = {
  render: () => <NestedInlineSubmenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Product' }));
    // defaultValue renders the developers panel immediately.
    await waitFor(() => expect(body.getByRole('link', { name: /Components/ })).toBeVisible());

    // Exactly two <nav> landmarks: the Root bar and the portalled Popup.
    // The inline nested Root renders a <div> and adds no popup.
    const navCountWhileOpen = doc.querySelectorAll('nav').length;
    await expect(navCountWhileOpen).toBe(2);

    // Switching to the second inline trigger swaps content in place.
    await userEvent.click(body.getByRole('button', { name: /For designers/ }));
    await waitFor(() => expect(body.getByRole('link', { name: /Figma kit/ })).toBeVisible());
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Components/ })).not.toBeInTheDocument(),
    );
    await expect(doc.querySelectorAll('nav').length).toBe(navCountWhileOpen);
  },
};

/* ------------------------------------------------------------------ */
/* Behavior stories (one per documented use case)                      */
/* ------------------------------------------------------------------ */

function MorphExample() {
  return (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Overview
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={`${styles.Content} ${styles.ContentNarrow}`}>
            <LinkCards links={overviewLinks.slice(0, 2)} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Handbook
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={`${styles.Content} ${styles.ContentWide}`}>
            <LinkCards links={handbookLinks} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          className={styles.Positioner}
          sideOffset={10}
          collisionAvoidance={{ side: 'none' }}
        >
          <NavigationMenu.Popup className={styles.Popup} data-testid="morph-popup">
            <NavigationMenu.Arrow className={styles.Arrow} />
            <NavigationMenu.Viewport className={styles.Viewport} />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

/** The founding [#1741](https://github.com/mui/base-ui/pull/1741) behavior: all triggers feed ONE popup. Switching triggers re-anchors and resizes it via `--popup-width/height` + `--positioner-width/height` while Content cross-fades directionally (`data-activation-direction`) — no close/reopen flicker. */
export const FlyoutViewportMorph: Story = {
  render: () => <MorphExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger1 = canvas.getByRole('button', { name: 'Overview' });
    const trigger2 = canvas.getByRole('button', { name: 'Handbook' });

    // Click-open trigger 1: content 1 mounts in the shared viewport.
    await userEvent.click(trigger1);
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true');

    const popup = body.getByTestId('morph-popup');
    // The sizing engine wrote the morph variables the popup CSS consumes.
    await expect(popup.style.getPropertyValue('--popup-width')).not.toBe('');

    // Click trigger 2: the SAME popup node morphs — never unmounted.
    // (`fireEvent.click` — a real user's second click lands directly on
    // trigger 2 without userEvent's synthetic pointer travel/hover pass
    // over it first, which is what the exempted-trigger click-switch path
    // expects; see NavigationMenuRoot.test.tsx "does not close menu when
    // clicking a different trigger with mouse".)
    fireEvent.click(trigger2);
    await waitFor(() => expect(body.getByRole('link', { name: /Styling/ })).toBeVisible());
    await expect(body.getByTestId('morph-popup')).toBe(popup);
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false');

    // The incoming content is tagged with the direction the new trigger lies
    // in relative to the previous one (trigger 2 is to the right).
    const content2 = body
      .getByRole('link', { name: /Styling/ })
      .closest('[data-activation-direction]');
    await expect(content2).toHaveAttribute('data-activation-direction', 'right');

    // The outgoing content leaves after its exit transition.
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
  },
};

function KeyboardExample() {
  return (
    <div className={styles.Stack}>
      <NavigationMenu.Root className={styles.Root} aria-label="Main">
        <NavigationMenu.List className={styles.List}>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={styles.Trigger}>
              Overview
              <NavigationMenu.Icon className={styles.Icon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={styles.Content}>
              <LinkCards links={overviewLinks.slice(0, 2)} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={styles.Trigger}>
              Handbook
              <NavigationMenu.Icon className={styles.Icon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={styles.Content}>
              <LinkCards links={handbookLinks} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <Flyout />
      </NavigationMenu.Root>
      <button type="button" className={styles.PlainButton}>
        After the nav
      </button>
    </div>
  );
}

/** The disclosure-navigation keyboard contract: arrow keys rove focus between top-level items WITHOUT opening (no open-on-focus — WCAG 3.2.1, [#4186](https://github.com/mui/base-ui/issues/4186)); `ArrowDown` opens and moves focus in; `Tab` walks through panel links and closes on the way out; `Escape` closes and refocuses the trigger. */
export const KeyboardNavigation: Story = {
  render: () => <KeyboardExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger1 = canvas.getByRole('button', { name: 'Overview' });
    const trigger2 = canvas.getByRole('button', { name: 'Handbook' });

    // ArrowRight roves focus between top-level items without opening a panel.
    trigger1.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(trigger2).toHaveFocus());
    await expect(body.queryByRole('link', { name: /Styling/ })).not.toBeInTheDocument();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(trigger1).toHaveFocus());

    // ArrowDown opens the focused item's panel and moves focus into it
    // (reason `list-navigation`, #2060).
    await userEvent.keyboard('{ArrowDown}');
    const quickStart = await body.findByRole('link', { name: /Quick Start/ });
    await waitFor(() => expect(quickStart).toHaveFocus());

    // Escape closes and returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger1).toHaveFocus());

    // Tab is sequential: from an open panel's last link it reaches the next
    // trigger, and leaving the whole menu closes it (`focus-out`).
    await userEvent.click(trigger1);
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());
    await userEvent.tab(); // Quick Start
    await userEvent.tab(); // Accessibility
    await userEvent.tab(); // trigger 2
    await waitFor(() => expect(trigger2).toHaveFocus());
    await userEvent.tab(); // leaves the menu entirely
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'After the nav' })).toHaveFocus(),
    );
  },
};

/* A minimal client-router stand-in: in a real app this recipe is
   `render={<NextLink href={…}/>}` — `NavigationMenu.Link render` composes
   any framework Link. Here the soft-navigate handler is wired as a direct
   `href`/`onClick` pair on `NavigationMenu.Link` itself (rather than via a
   separate `render`-composed component) — clicking through a composed
   custom component's own `onClick` is unreliable in this Chromium test
   runner, so the plays below exercise the equivalent direct-prop form. */
const RouterContext = React.createContext<{
  route: string;
  navigate: (to: string) => void;
}>({ route: '', navigate: () => {} });

function routerLinkProps(navigate: (to: string) => void, to: string) {
  return {
    href: to,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault(); // soft navigation, like a framework Link
      navigate(to);
    },
  };
}

const productRoutes = [
  { to: '#/features', label: 'Features', description: 'Everything the product does.' },
  { to: '#/changelog', label: 'Changelog', description: 'What shipped recently.' },
] as const;

function ClientRouterExample() {
  const [route, setRoute] = React.useState('#/home');
  const context = React.useMemo(() => ({ route, navigate: setRoute }), [route]);
  return (
    <RouterContext.Provider value={context}>
      <div className={styles.Stack}>
        <NavigationMenu.Root className={styles.Root}>
          <NavigationMenu.List className={styles.List}>
            <NavigationMenu.Item>
              <NavigationMenu.Link
                className={styles.Trigger}
                active={route === '#/home'}
                {...routerLinkProps(setRoute, '#/home')}
              >
                Home
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger className={styles.Trigger}>
                Product
                <NavigationMenu.Icon className={styles.Icon}>
                  <CaretDownIcon />
                </NavigationMenu.Icon>
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className={styles.Content}>
                <ul className={styles.FlexLinkList}>
                  {productRoutes.map((item) => (
                    <li key={item.to}>
                      <NavigationMenu.Link
                        className={styles.LinkCard}
                        active={route === item.to}
                        {...routerLinkProps(setRoute, item.to)}
                      >
                        <h3 className={styles.LinkTitle}>{item.label}</h3>
                        <p className={styles.LinkDescription}>{item.description}</p>
                      </NavigationMenu.Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link
                className={styles.Trigger}
                active={route === '#/pricing'}
                {...routerLinkProps(setRoute, '#/pricing')}
              >
                Pricing
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <Flyout />
        </NavigationMenu.Root>
        <output className={styles.Output}>current route: {route}</output>
      </div>
    </RouterContext.Provider>
  );
}

/** Every `Link` composes a client router — the docs "Custom links" recipe is `render={<NextLink href={…}/>}`; this demo wires the equivalent `href`/`onClick` pair directly (a router `render` target is a real component with its own event handlers, which this Chromium test runner doesn't reliably click through). `active` marks the current page with `aria-current="page"` + `data-active`. Panel links keep the menu open by default (`closeOnClick={false}` — [#2740](https://github.com/mui/base-ui/pull/2740)). */
export const LinkWithRenderClientRouter: Story = {
  render: () => <ClientRouterExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const homeLink = canvas.getByRole('link', { name: 'Home' });
    await expect(homeLink).toHaveAttribute('aria-current', 'page');

    // Soft-navigate through a top-level rendered router link.
    await userEvent.click(canvas.getByRole('link', { name: 'Pricing' }));
    await expect(await canvas.findByText('current route: #/pricing')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(homeLink).not.toHaveAttribute('aria-current');

    // Panel links compose the router too; without closeOnClick the menu stays
    // open after navigating (the Stripe/Apple behavior, #2740).
    await userEvent.click(canvas.getByRole('button', { name: 'Product' }));
    const features = await body.findByRole('link', { name: /Features/ });
    await userEvent.click(features);
    await expect(await canvas.findByText('current route: #/features')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Product' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
};

/** Positioner props are the standard anchored-positioning set: `side`/`align`/`sideOffset` plus collision config; the Popup and Arrow expose the resolved placement via `data-side`/`data-align`. The hero uses `collisionAvoidance={{ side: 'none' }}` so a header popup never flips above the bar mid-morph. */
export const PositioningSideAlign: Story = {
  render: () => (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Resources
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <LinkCards links={handbookLinks} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          className={styles.Positioner}
          side="bottom"
          align="start"
          sideOffset={12}
          collisionPadding={5}
        >
          <NavigationMenu.Popup className={styles.Popup} data-testid="positioned-popup">
            <NavigationMenu.Arrow className={styles.Arrow} />
            <NavigationMenu.Viewport className={styles.Viewport} />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Resources' }));
    const popup = await body.findByTestId('positioned-popup');
    await waitFor(() => expect(popup).toBeVisible());
    await expect(popup).toHaveAttribute('data-side', 'bottom');
    await expect(popup).toHaveAttribute('data-align', 'start');
  },
};

/** Click toggles only the active item (`trigger-press`), and clicking a *different* trigger switches panels without a flicker-close — presses on other nav triggers are exempt from outside-press dismissal via a trigger marker attribute. */
export const ClickToggleActivation: Story = {
  render: () => <MorphExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger1 = canvas.getByRole('button', { name: 'Overview' });
    const trigger2 = canvas.getByRole('button', { name: 'Handbook' });

    // Click opens…
    await userEvent.click(trigger1);
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());

    // …clicking another trigger switches (no close/reopen). `fireEvent.click`
    // here (not `userEvent.click`): a real second click lands on trigger 2
    // directly, without userEvent's synthetic pointer-travel/hover pass over
    // it first (see NavigationMenuRoot.test.tsx "does not close menu when
    // clicking a different trigger with mouse").
    fireEvent.click(trigger2);
    await waitFor(() => expect(body.getByRole('link', { name: /Styling/ })).toBeVisible());
    await expect(trigger2).toHaveAttribute('data-popup-open');

    // …and clicking the active trigger again toggles the menu shut.
    await userEvent.click(trigger2);
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Styling/ })).not.toBeInTheDocument(),
    );
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false');
  },
};

/** The "patient click" threshold: for 500ms after a hover-open, clicking the trigger will NOT toggle it shut — preventing the accidental open-then-instantly-close double take when users hover and click near-simultaneously. */
export const PatientClickThreshold: Story = {
  render: () => <MorphExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Overview' });

    // Hover-open (default delay: 50ms).
    await userEvent.hover(trigger);
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());

    // An "impatient" click within 500ms of the hover-open does not close.
    await userEvent.click(trigger);
    await expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Escape still closes normally.
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
  },
};

function ControlledExample() {
  const [value, setValue] = React.useState<string | null>(null);
  const [reasons, setReasons] = React.useState<string[]>([]);

  const handleValueChange = (
    nextValue: string | null,
    eventDetails: NavigationMenu.Root.ChangeEventDetails,
  ) => {
    setValue(nextValue);
    setReasons((previous) => [...previous, eventDetails.reason]);
  };

  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <button type="button" className={styles.PlainButton} onClick={() => setValue('handbook')}>
          Open handbook panel
        </button>
        <button type="button" className={styles.PlainButton} onClick={() => setValue(null)}>
          Close
        </button>
      </div>
      <NavigationMenu.Root className={styles.Root} value={value} onValueChange={handleValueChange}>
        <NavigationMenu.List className={styles.List}>
          <NavigationMenu.Item value="overview">
            <NavigationMenu.Trigger className={styles.Trigger}>
              Overview
              <NavigationMenu.Icon className={styles.Icon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={styles.Content}>
              <LinkCards links={overviewLinks.slice(0, 2)} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="handbook">
            <NavigationMenu.Trigger className={styles.Trigger}>
              Handbook
              <NavigationMenu.Icon className={styles.Icon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={styles.Content}>
              <LinkCards links={handbookLinks} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <Flyout />
      </NavigationMenu.Root>
      <output className={styles.Output}>
        value: {value ?? 'null'} · reasons: {reasons.length > 0 ? reasons.join(', ') : 'none'}
      </output>
    </div>
  );
}

/** Open state is value-driven, not boolean: `value` names WHICH item is open (`open === value != null`). Control it with `value` + `onValueChange(value, eventDetails)` — every close path carries a typed `reason` (`trigger-press`, `escape-key`, `outside-press`, `link-press`, …). Give `Item`s explicit `value`s when controlling. */
export const ControlledValueWithEventDetails: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Programmatic open: setting `value` externally opens that item's panel.
    await userEvent.click(canvas.getByRole('button', { name: 'Open handbook panel' }));
    await waitFor(() => expect(body.getByRole('link', { name: /Styling/ })).toBeVisible());
    await waitFor(() => expect(canvas.getByText(/value: handbook/)).toBeVisible());

    // Escape reports its reason through eventDetails.
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Styling/ })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(canvas.getByText(/escape-key/)).toBeVisible());

    // Clicking a trigger reports `trigger-press`. `fireEvent.click` (not
    // `userEvent.click`): a Trigger has hover-intent listeners, and
    // userEvent's realistic pointer travel onto the button before the click
    // crosses the 50ms hover delay first, attributing the open to
    // `trigger-hover` instead of the click itself.
    fireEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());
    await waitFor(() => expect(canvas.getByText(/trigger-press/)).toBeVisible());
  },
};

function CloseOnClickExample() {
  return (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Docs
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <ul className={styles.FlexLinkList}>
              <li>
                {/* preventDefault: a real click in the Chromium test runner
                    would otherwise follow the hash href and navigate the
                    preview document, which the play below doesn't want. */}
                <Link
                  className={styles.LinkCard}
                  href="#getting-started"
                  closeOnClick
                  onClick={(event) => event.preventDefault()}
                >
                  <h3 className={styles.LinkTitle}>Getting started</h3>
                  <p className={styles.LinkDescription}>Soft-navigates and closes the menu.</p>
                </Link>
              </li>
              <li>
                <Link
                  className={styles.LinkCard}
                  href="#community"
                  onClick={(event) => event.preventDefault()}
                >
                  <h3 className={styles.LinkTitle}>Community</h3>
                  <p className={styles.LinkDescription}>External link — menu stays open.</p>
                </Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <Flyout />
    </NavigationMenu.Root>
  );
}

/** `Link closeOnClick` defaults to `false` after a deliberate reversal ([#2535](https://github.com/mui/base-ui/pull/2535) → [#2740](https://github.com/mui/base-ui/pull/2740)): "Stripe and Apple leave theirs open as they act as external links". Opt in per link for client-side navigations within a persistent layout (`link-press` reason). */
export const CloseOnClickLinks: Story = {
  render: () => <CloseOnClickExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Docs' });

    // A closeOnClick link closes the menu on activation.
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('link', { name: /Getting started/ }));
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Community/ })).not.toBeInTheDocument(),
    );

    // The default (closeOnClick={false}) keeps the menu open.
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole('link', { name: /Community/ }));
    await expect(body.getByRole('link', { name: /Community/ })).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

function VerticalExample() {
  return (
    <NavigationMenu.Root className={styles.Root} orientation="vertical">
      <NavigationMenu.List className={`${styles.List} ${styles.VerticalList}`}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Dashboards
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon style={{ transform: 'rotate(-90deg)' }} />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <LinkCards links={overviewLinks.slice(0, 2)} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Reports
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon style={{ transform: 'rotate(-90deg)' }} />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <LinkCards links={handbookLinks} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner className={styles.Positioner} side="right" sideOffset={10}>
          <NavigationMenu.Popup className={styles.Popup}>
            <NavigationMenu.Arrow className={styles.Arrow} />
            <NavigationMenu.Viewport className={styles.Viewport} />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

/** `orientation="vertical"` turns the bar into a side rail: `ArrowDown`/`ArrowUp` rove focus along the rail, and the open key becomes `ArrowRight` (`ArrowLeft` in RTL) — pair it with `Positioner side="right"` so panels fly out beside the rail. */
export const VerticalOrientation: Story = {
  render: () => <VerticalExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger1 = canvas.getByRole('button', { name: 'Dashboards' });
    const trigger2 = canvas.getByRole('button', { name: 'Reports' });

    // Vertical composite: ArrowDown roves focus down the rail without opening.
    trigger1.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(trigger2).toHaveFocus());
    await expect(body.queryByRole('link', { name: /Styling/ })).not.toBeInTheDocument();

    // The open key is mirrored to the orientation: ArrowRight (LTR) opens.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(body.getByRole('link', { name: /Styling/ })).toBeVisible());
  },
};

/** There is no click-only prop yet ([#2254](https://github.com/mui/base-ui/issues/2254), open) — the documented approximation is a very large `delay` so hover effectively never opens, while click and keyboard still work (`delay` only applies to hover events). */
export const DelayTuningClickOnlyApprox: Story = {
  render: () => (
    <NavigationMenu.Root className={styles.Root} delay={600000}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Overview
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <LinkCards links={overviewLinks.slice(0, 2)} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <Flyout />
    </NavigationMenu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Overview' });

    // Hovering does not open within any human timeframe (delay is 10 minutes).
    await userEvent.hover(trigger);
    await expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument();

    // Click bypasses the hover delay entirely.
    await userEvent.click(trigger);
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());
  },
};

/** `Content keepMounted` server-renders the panel as hidden inline HTML so crawlers see it before any interaction ([#3794](https://github.com/mui/base-ui/pull/3794) — "the content is crawlable"); on first open it moves into the popup permanently. `Portal keepMounted` is NOT needed for SEO. */
export const KeepMountedSEOContent: Story = {
  render: () => (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Overview
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content} keepMounted data-testid="seo-content">
            <LinkCards links={overviewLinks.slice(0, 2)} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <Flyout />
    </NavigationMenu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Before any interaction the content exists in the DOM (hidden inline) —
    // that's the crawlable SSR HTML.
    const content = body.getByTestId('seo-content');
    await expect(content).not.toBeVisible();
    await expect(body.getByText('Quick Start')).not.toBeVisible();

    // First open teleports it into the popup and reveals it.
    await userEvent.click(canvas.getByRole('button', { name: 'Overview' }));
    await waitFor(() => expect(body.getByTestId('seo-content')).toBeVisible());
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());
  },
};

/** Touch never hover-opens (`pointerType === 'touch'` is guarded out) — a tap opens, a tap outside closes. There is no separate mobile presentation mode; for hamburger-style small-screen navigation reach for a drawer instead. */
export const TouchTapToOpen: Story = {
  render: () => (
    <div className={styles.Stack}>
      <MorphExample />
      <p className={styles.Output}>Outside content</p>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Overview' });

    // A touch tap opens immediately (no hover phase).
    await userEvent.pointer({ keys: '[TouchA]', target: trigger });
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());

    // Tapping outside dismisses.
    await userEvent.pointer({ keys: '[TouchA]', target: canvas.getByText('Outside content') });
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
  },
};

function AnimatedExample() {
  const [exitCount, setExitCount] = React.useState(0);
  return (
    <div className={styles.Stack}>
      <NavigationMenu.Root
        className={styles.Root}
        onOpenChangeComplete={(open) => {
          if (!open) {
            setExitCount((count) => count + 1);
          }
        }}
      >
        <NavigationMenu.List className={styles.List}>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={styles.Trigger}>
              Overview
              <NavigationMenu.Icon className={styles.Icon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={`${styles.Content} ${styles.ContentNarrow}`}>
              <LinkCards links={overviewLinks.slice(0, 2)} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className={styles.Trigger}>
              Handbook
              <NavigationMenu.Icon className={styles.Icon}>
                <CaretDownIcon />
              </NavigationMenu.Icon>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className={`${styles.Content} ${styles.ContentWide}`}>
              <LinkCards links={handbookLinks} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <Flyout />
      </NavigationMenu.Root>
      <output className={styles.Output}>exit transitions completed: {exitCount}</output>
    </div>
  );
}

/** The animation contract: Popup/Content expose `data-open`/`data-starting-style`/`data-ending-style` (+ `data-activation-direction` on Content, `data-instant` on the Positioner), the popup CSS transitions the size variables, and `onOpenChangeComplete(false)` fires only after the exit transition settles. */
export const AnimatedMorphTransition: Story = {
  render: () => <AnimatedExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Overview' });

    await userEvent.click(trigger);
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());
    await expect(canvas.getByText('exit transitions completed: 0')).toBeVisible();

    // Escape starts the exit transition; completion is reported asynchronously
    // after CSS transitions finish, then the popup unmounts.
    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('exit transitions completed: 1')).toBeVisible();
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
  },
};

function SplitPatternExample() {
  const [route, setRoute] = React.useState('#/home');
  const context = React.useMemo(() => ({ route, navigate: setRoute }), [route]);
  return (
    <RouterContext.Provider value={context}>
      <div className={styles.Stack}>
        <NavigationMenu.Root className={styles.Root}>
          <NavigationMenu.List className={styles.List}>
            <NavigationMenu.Item>
              {/* Apple.com split pattern: the label is a plain Link that
                  navigates; a separate, keyboard-visible chevron Trigger
                  opens the panel. Never overload one element with both. */}
              <div className={styles.Row}>
                <NavigationMenu.Link
                  className={styles.Trigger}
                  active={route === '#/analytics'}
                  {...routerLinkProps(setRoute, '#/analytics')}
                >
                  Analytics
                </NavigationMenu.Link>
                <NavigationMenu.Trigger
                  className={`${styles.Trigger} ${styles.ChevronTrigger}`}
                  aria-label="Analytics submenu"
                >
                  <NavigationMenu.Icon className={styles.Icon}>
                    <CaretDownIcon />
                  </NavigationMenu.Icon>
                </NavigationMenu.Trigger>
              </div>
              <NavigationMenu.Content className={styles.Content}>
                <ul className={styles.FlexLinkList}>
                  <li>
                    <NavigationMenu.Link
                      className={styles.LinkCard}
                      active={route === '#/analytics/funnels'}
                      {...routerLinkProps(setRoute, '#/analytics/funnels')}
                    >
                      <h3 className={styles.LinkTitle}>Funnels</h3>
                      <p className={styles.LinkDescription}>Conversion steps over time.</p>
                    </NavigationMenu.Link>
                  </li>
                  <li>
                    <NavigationMenu.Link
                      className={styles.LinkCard}
                      active={route === '#/analytics/retention'}
                      {...routerLinkProps(setRoute, '#/analytics/retention')}
                    >
                      <h3 className={styles.LinkTitle}>Retention</h3>
                      <p className={styles.LinkDescription}>Cohorts that come back.</p>
                    </NavigationMenu.Link>
                  </li>
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <Flyout />
        </NavigationMenu.Root>
        <output className={styles.Output}>current route: {route}</output>
      </div>
    </RouterContext.Provider>
  );
}

/** A top-level item that is BOTH a link and a trigger breaks keyboard flow if you overload one element. The recommended pattern ([#4186](https://github.com/mui/base-ui/issues/4186)) is Apple.com's split: a plain `Link` label plus a separate keyboard-visible chevron `Trigger` for the panel. */
export const TriggerAndLinkSplitPattern: Story = {
  render: () => <SplitPatternExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Clicking the label navigates — it does not open the panel.
    await userEvent.click(canvas.getByRole('link', { name: 'Analytics' }));
    await expect(await canvas.findByText('current route: #/analytics')).toBeVisible();
    await expect(body.queryByRole('link', { name: /Funnels/ })).not.toBeInTheDocument();

    // The separate chevron trigger opens the panel without navigating away
    // from the route the label already set.
    await userEvent.click(canvas.getByRole('button', { name: 'Analytics submenu' }));
    await waitFor(() => expect(body.getByRole('link', { name: /Funnels/ })).toBeVisible());
    await expect(canvas.getByText('current route: #/analytics')).toBeVisible();

    // Panel links compose the router too.
    await userEvent.click(body.getByRole('link', { name: /Funnels/ }));
    await expect(await canvas.findByText('current route: #/analytics/funnels')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/navigation-menu) */
/* ------------------------------------------------------------------ */

/** Same Portal → Positioner → Popup → Viewport chain as `Flyout`, plus the
 * `Backdrop` part the hero demo omits. */
function FlyoutWithBackdrop(props: NavigationMenu.Positioner.Props) {
  return (
    <NavigationMenu.Portal>
      <NavigationMenu.Backdrop className={styles.Backdrop} data-testid="nav-backdrop" />
      <NavigationMenu.Positioner
        className={styles.Positioner}
        sideOffset={10}
        collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
        collisionAvoidance={{ side: 'none' }}
        {...props}
      >
        <NavigationMenu.Popup className={styles.Popup}>
          <NavigationMenu.Arrow className={styles.Arrow} />
          <NavigationMenu.Viewport className={styles.Viewport} />
        </NavigationMenu.Popup>
      </NavigationMenu.Positioner>
    </NavigationMenu.Portal>
  );
}

function AnatomyTourExample() {
  return (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.Trigger}>
            Products
            <NavigationMenu.Icon className={styles.Icon}>
              <CaretDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.Content}>
            <LinkCards links={overviewLinks} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <Link
            className={styles.Trigger}
            href="#pricing"
            onClick={(event) => event.preventDefault()}
          >
            Pricing
          </Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <FlyoutWithBackdrop />
    </NavigationMenu.Root>
  );
}

/**
 * Recreation of the fullest-anatomy composition from patrick-xin/lumi-ui
 * `navigation-menu.tsx` (MIT, code-ok,
 * research/d-real-world-usage/navigation-menu/ranked.json #4) — the only registry
 * found combining `NavigationMenu.Backdrop` with `NavigationMenu.Arrow` alongside
 * the full Portal/Positioner/Popup/Viewport stack. `Backdrop` is purely visual
 * ([G] the component is never modal) — it dims the page while a panel is open.
 */
export const RealWorldAnatomyTourWithBackdrop: Story = {
  tags: ['recreation'],
  render: () => <AnatomyTourExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.queryByTestId('nav-backdrop')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Products' }));
    const backdrop = await body.findByTestId('nav-backdrop');
    await expect(backdrop).toHaveAttribute('role', 'presentation');
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());

    // The plain "Pricing" link is a real link, not a Trigger — no panel to open.
    await expect(canvas.getByRole('link', { name: 'Pricing' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByTestId('nav-backdrop')).not.toBeInTheDocument());
  },
};

type CmsNavEntry =
  | { type: 'link'; label: string; href: string }
  | {
      type: 'group';
      label: string;
      items: ReadonlyArray<{ href: string; title: string; description: string }>;
    };

const cmsNavEntries: readonly CmsNavEntry[] = [
  {
    type: 'group',
    label: 'Products',
    items: overviewLinks,
  },
  {
    type: 'group',
    label: 'Resources',
    items: handbookLinks,
  },
  { type: 'link', label: 'Pricing', href: '#pricing' },
  { type: 'link', label: 'Blog', href: '#blog' },
];

function CmsDrivenNavExample() {
  return (
    <NavigationMenu.Root className={styles.Root}>
      <NavigationMenu.List className={styles.List}>
        {cmsNavEntries.map((entry) =>
          entry.type === 'link' ? (
            <NavigationMenu.Item key={entry.href}>
              <Link
                className={styles.Trigger}
                href={entry.href}
                onClick={(event) => event.preventDefault()}
              >
                {entry.label}
              </Link>
            </NavigationMenu.Item>
          ) : (
            <NavigationMenu.Item key={entry.label}>
              <NavigationMenu.Trigger className={styles.Trigger}>
                {entry.label}
                <NavigationMenu.Icon className={styles.Icon}>
                  <CaretDownIcon />
                </NavigationMenu.Icon>
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className={styles.Content}>
                <LinkCards links={entry.items} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          ),
        )}
      </NavigationMenu.List>
      <Flyout />
    </NavigationMenu.Root>
  );
}

/**
 * Recreation of the CMS-driven nav-structure pattern from
 * robotostudio/turbo-start-sanity `navigation-menu.tsx` (MIT, code-ok,
 * research/d-real-world-usage/navigation-menu/ranked.json #9) — the only starter
 * template found deriving its nav structure from CMS content: the whole
 * `List`/`Item`/`Trigger`-vs-`Link` shape is mapped from one heterogeneous data
 * array (mixing dropdown groups and plain links) instead of hand-authored JSX per
 * item, the shape a page-builder CMS would hand you.
 */
export const RealWorldCmsDrivenNav: Story = {
  tags: ['recreation'],
  render: () => <CmsDrivenNavExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Plain data entries render as real links, not triggers.
    await expect(canvas.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Blog' })).toBeVisible();
    await expect(canvas.queryByRole('button', { name: 'Pricing' })).not.toBeInTheDocument();

    // Group entries open a panel built from their own `items` array.
    await userEvent.click(canvas.getByRole('button', { name: 'Products' }));
    await waitFor(() => expect(body.getByRole('link', { name: /Quick Start/ })).toBeVisible());

    // Switching groups morphs the panel to the other entry's items. A real
    // second click lands directly on the new trigger without userEvent's
    // synthetic hover pass first — see FlyoutViewportMorph above.
    fireEvent.click(canvas.getByRole('button', { name: 'Resources' }));
    await waitFor(() => expect(body.getByRole('link', { name: /Styling/ })).toBeVisible());
    await waitFor(() =>
      expect(body.queryByRole('link', { name: /Quick Start/ })).not.toBeInTheDocument(),
    );
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

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

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}
