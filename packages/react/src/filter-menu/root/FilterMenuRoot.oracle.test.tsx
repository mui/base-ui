import * as React from 'react';
import { expect, vi } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { FilterMenu } from '@base-ui/react/filter-menu';
import { createRenderer, resetBrowserPointer } from '#test-utils';

// Keep the navigation contract deterministic across local operating systems.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      screenReader: { ...actual.platform.screenReader, voiceOver: false },
    },
  };
});

type Layout = 'list' | 'grid';
type IdMode = 'default' | 'prop' | 'render' | 'empty-render';

interface SurfaceConfig {
  autoHighlight: boolean | 'always';
  inline: boolean;
  layout: Layout;
  withInput: boolean;
}

const labels = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

const { render } = createRenderer();

function getList(layout: Layout) {
  return screen.getByRole(layout === 'grid' ? 'grid' : 'menu');
}

function getItems(layout: Layout) {
  return screen.getAllByRole(layout === 'grid' ? 'gridcell' : 'menuitem');
}

function expectActiveDescendantToBeValid(owner: HTMLElement, layout: Layout) {
  const activeId = owner.getAttribute('aria-activedescendant');
  const highlightedItems = getItems(layout).filter((item) => item.hasAttribute('data-highlighted'));

  expect(highlightedItems.length).toBeLessThanOrEqual(1);
  if (activeId === null) {
    expect(highlightedItems).toHaveLength(0);
    return;
  }

  const activeItem = document.getElementById(activeId);
  expect(activeItem).not.toBe(null);
  expect(activeItem).toBeVisible();
  expect(activeItem).toHaveAttribute('data-highlighted');
  expect(highlightedItems).toEqual([activeItem]);
}

function Items(props: { layout: Layout; onDeltaClick?: (() => void) | undefined }) {
  if (props.layout === 'grid') {
    return (
      <React.Fragment>
        <FilterMenu.Row>
          <FilterMenu.Item>Alpha</FilterMenu.Item>
          <FilterMenu.Item>Bravo</FilterMenu.Item>
        </FilterMenu.Row>
        <FilterMenu.Row>
          <FilterMenu.Item>Charlie</FilterMenu.Item>
          <FilterMenu.Item onClick={props.onDeltaClick}>Delta</FilterMenu.Item>
        </FilterMenu.Row>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <FilterMenu.Item>Alpha</FilterMenu.Item>
      <FilterMenu.Item>Bravo</FilterMenu.Item>
      <FilterMenu.Item>Charlie</FilterMenu.Item>
      <FilterMenu.Item onClick={props.onDeltaClick}>Delta</FilterMenu.Item>
    </React.Fragment>
  );
}

function Surface(props: SurfaceConfig & { onDeltaClick?: (() => void) | undefined }) {
  const content = (
    <React.Fragment>
      {props.withInput && <FilterMenu.Input aria-label="Filter actions" />}
      <FilterMenu.List>
        <Items layout={props.layout} onDeltaClick={props.onDeltaClick} />
      </FilterMenu.List>
    </React.Fragment>
  );

  if (props.inline) {
    return (
      <FilterMenu.Root
        inline
        open
        grid={props.layout === 'grid'}
        autoHighlight={props.autoHighlight}
      >
        {content}
      </FilterMenu.Root>
    );
  }

  return (
    <FilterMenu.Root open grid={props.layout === 'grid'} autoHighlight={props.autoHighlight}>
      <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner>
          <FilterMenu.Popup>{content}</FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

function getIdProps(mode: IdMode, name: string) {
  const renderElement =
    name === 'trigger' ? <button id={`${name}-render`} /> : <div id={`${name}-render`} />;
  const emptyRenderElement = name === 'trigger' ? <button id="" /> : <div id="" />;

  if (mode === 'prop') {
    return { id: `${name}-prop` };
  }
  if (mode === 'render') {
    return { render: renderElement };
  }
  if (mode === 'empty-render') {
    return { render: emptyRenderElement };
  }
  return {};
}

const idModes: IdMode[] = ['default', 'prop', 'render', 'empty-render'];
const idConfigurations = idModes.flatMap((trigger) =>
  idModes.flatMap((popup) => idModes.map((list) => ({ list, popup, trigger }))),
);

const openingMethods = [
  { name: 'pointer click', keys: null, opens: true },
  { name: 'Enter', keys: '[Enter]', opens: true },
  { name: 'Space', keys: '[Space]', opens: true },
  { name: 'ArrowDown', keys: '[ArrowDown]', opens: true },
  { name: 'ArrowUp', keys: '[ArrowUp]', opens: true },
  { name: 'ArrowLeft', keys: '[ArrowLeft]', opens: false },
  { name: 'ArrowRight', keys: '[ArrowRight]', opens: false },
] as const;

const openingConfigurations = (['list', 'grid'] as const).flatMap((layout) =>
  [false, true].flatMap((withInput) =>
    openingMethods.map((method) => ({ layout, method, withInput })),
  ),
);

const surfaceConfigurations: SurfaceConfig[] = (['list', 'grid'] as const).flatMap((layout) =>
  [false, true].flatMap((inline) => [
    { autoHighlight: false, inline, layout, withInput: false },
    { autoHighlight: false, inline, layout, withInput: true },
    { autoHighlight: true, inline, layout, withInput: true },
    { autoHighlight: 'always' as const, inline, layout, withInput: true },
  ]),
);

describe('<FilterMenu.Root /> interaction oracle', () => {
  beforeEach(resetBrowserPointer);

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  describe('id and ARIA relationship matrix', () => {
    it.each(idConfigurations)(
      'keeps relationships valid for trigger=$trigger popup=$popup list=$list',
      async ({ trigger: triggerMode, popup: popupMode, list: listMode }) => {
        await render(
          <FilterMenu.Root open>
            <FilterMenu.Trigger {...getIdProps(triggerMode, 'trigger')}>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup {...getIdProps(popupMode, 'popup')}>
                  <FilterMenu.Input aria-label="Filter actions" />
                  <FilterMenu.List {...getIdProps(listMode, 'list')}>
                    <FilterMenu.Item>Alpha</FilterMenu.Item>
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>,
        );

        const trigger = screen.getByRole('button', { name: 'Actions' });
        const popup = screen.getByRole('dialog');
        const input = screen.getByRole('searchbox', { name: 'Filter actions' });
        const list = screen.getByRole('menu');

        await waitFor(() => {
          if (popup.id) {
            expect(trigger).toHaveAttribute('aria-controls', popup.id);
          } else {
            expect(trigger).not.toHaveAttribute('aria-controls');
          }
        });

        if (trigger.id) {
          expect(popup).toHaveAttribute('aria-labelledby', trigger.id);
          expect(list).toHaveAttribute('aria-labelledby', trigger.id);
        } else {
          expect(popup).not.toHaveAttribute('aria-labelledby');
          expect(list).not.toHaveAttribute('aria-labelledby');
        }

        await waitFor(() => {
          if (list.id) {
            expect(input).toHaveAttribute('aria-controls', list.id);
          } else {
            expect(input).not.toHaveAttribute('aria-controls');
          }
        });

        const item = screen.getByRole('menuitem', { name: 'Alpha' });
        if (popup.id) {
          expect(item.id).not.toBe('');
          expect(item.id.startsWith(`${popup.id}-`)).toBe(true);
        } else {
          expect(item.id).toBe('');
        }
      },
    );
  });

  describe('opening matrix', () => {
    it.each(openingConfigurations)(
      '$layout withInput=$withInput opens=$method.opens using $method.name',
      async ({ layout, method, withInput }) => {
        const { user } = await render(
          <FilterMenu.Root grid={layout === 'grid'}>
            <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
            <FilterMenu.Portal>
              <FilterMenu.Positioner>
                <FilterMenu.Popup>
                  {withInput && <FilterMenu.Input aria-label="Filter actions" />}
                  <FilterMenu.List>
                    <Items layout={layout} />
                  </FilterMenu.List>
                </FilterMenu.Popup>
              </FilterMenu.Positioner>
            </FilterMenu.Portal>
          </FilterMenu.Root>,
        );

        const trigger = screen.getByRole('button', { name: 'Actions' });
        if (method.keys === null) {
          await user.click(trigger);
        } else {
          await act(async () => {
            trigger.focus();
          });
          await user.keyboard(method.keys);
        }

        const listRole = layout === 'grid' ? 'grid' : 'menu';
        if (!method.opens) {
          expect(screen.queryByRole(listRole)).toBe(null);
          expect(trigger).toHaveAttribute('aria-expanded', 'false');
          return;
        }

        const list = await screen.findByRole(listRole);
        const popup = screen.getByRole('dialog');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveAttribute('aria-controls', popup.id);

        if (withInput) {
          const input = screen.getByRole('searchbox', { name: 'Filter actions' });
          await waitFor(() => {
            expect(input).toHaveFocus();
          });
          expect(input).toHaveAttribute('aria-controls', list.id);
        }
      },
    );

    it('rejects pointer and keyboard opening while disabled', async () => {
      const { user } = await render(
        <FilterMenu.Root disabled>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Alpha</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Actions' });
      expect(trigger).toBeDisabled();

      await user.click(trigger);
      await user.keyboard('[Enter][Space][ArrowDown][ArrowUp]');

      expect(screen.queryByRole('menu')).toBe(null);
    });
  });

  describe('navigation, filtering, pointer, and activation matrix', () => {
    it.each(surfaceConfigurations)(
      '$layout inline=$inline withInput=$withInput autoHighlight=$autoHighlight',
      async (config) => {
        const onDeltaClick = vi.fn();
        const { user } = await render(<Surface {...config} onDeltaClick={onDeltaClick} />);
        const list = getList(config.layout);
        const owner = config.withInput
          ? screen.getByRole('searchbox', { name: 'Filter actions' })
          : list;

        await act(async () => {
          owner.focus();
        });

        expect(new Set(getItems(config.layout).map((item) => item.id)).size).toBe(labels.length);
        expect(getItems(config.layout).every((item) => item.id !== '')).toBe(true);

        if (config.inline) {
          expect(screen.queryByRole('dialog')).toBe(null);
          expect(list).not.toHaveAttribute('aria-labelledby');
        } else {
          const trigger = screen.getByRole('button', { name: 'Actions' });
          const popup = screen.getByRole('dialog');
          expect(popup).toHaveAttribute('aria-labelledby', trigger.id);
          expect(list).toHaveAttribute('aria-labelledby', trigger.id);
        }

        if (config.withInput) {
          const input = owner as HTMLInputElement;
          expect(input).toHaveAttribute('aria-controls', list.id);

          await user.type(input, 'br');
          await waitFor(() => {
            expect(getItems(config.layout)).toHaveLength(1);
          });
          expect(getItems(config.layout)[0]).toHaveTextContent('Bravo');
          expectActiveDescendantToBeValid(owner, config.layout);

          await user.clear(input);
          await waitFor(() => {
            expect(getItems(config.layout)).toHaveLength(labels.length);
          });
        } else {
          await user.keyboard('c');
          await waitFor(() => {
            expect(screen.getByText('Charlie')).toHaveAttribute('data-highlighted');
          });
        }

        expectActiveDescendantToBeValid(owner, config.layout);

        await user.keyboard('[ArrowDown]');
        expectActiveDescendantToBeValid(owner, config.layout);

        if (config.layout === 'grid') {
          await user.keyboard('[ArrowRight][ArrowDown][ArrowLeft][ArrowUp]');
        } else {
          await user.keyboard('[ArrowDown][Home][End]');
        }
        expectActiveDescendantToBeValid(owner, config.layout);

        const delta = screen.getByText('Delta');
        await user.hover(delta);
        expect(delta).toHaveAttribute('data-highlighted');
        expectActiveDescendantToBeValid(owner, config.layout);

        await user.click(delta);
        expect(onDeltaClick).toHaveBeenCalledOnce();
      },
    );
  });

  describe('item state journey', () => {
    it('preserves and mutates each item variant through filtering and activation', async () => {
      const onRegularClick = vi.fn();
      const onDisabledClick = vi.fn();
      const onLinkClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
      const { user } = await render(
        <FilterMenu.Root inline open>
          <FilterMenu.Input aria-label="Filter commands" />
          <FilterMenu.List>
            <FilterMenu.Item onClick={onRegularClick}>Rename</FilterMenu.Item>
            <FilterMenu.CheckboxItem closeOnClick={false} defaultChecked>
              Show hidden
            </FilterMenu.CheckboxItem>
            <FilterMenu.RadioGroup defaultValue="name">
              <FilterMenu.RadioItem closeOnClick={false} value="name">
                Sort by name
              </FilterMenu.RadioItem>
              <FilterMenu.RadioItem closeOnClick={false} value="date">
                Sort by date
              </FilterMenu.RadioItem>
            </FilterMenu.RadioGroup>
            <FilterMenu.LinkItem href="#archive" onClick={onLinkClick}>
              Archive
            </FilterMenu.LinkItem>
            <FilterMenu.Item disabled onClick={onDisabledClick}>
              Delete permanently
            </FilterMenu.Item>
          </FilterMenu.List>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter commands' });
      const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Show hidden' });
      const nameRadio = screen.getByRole('menuitemradio', { name: 'Sort by name' });
      const dateRadio = screen.getByRole('menuitemradio', { name: 'Sort by date' });

      expect(checkbox).toHaveAttribute('aria-checked', 'true');
      expect(nameRadio).toHaveAttribute('aria-checked', 'true');
      expect(dateRadio).toHaveAttribute('aria-checked', 'false');

      await user.click(checkbox);
      await user.click(dateRadio);
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
      expect(nameRadio).toHaveAttribute('aria-checked', 'false');
      expect(dateRadio).toHaveAttribute('aria-checked', 'true');

      await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
      await user.click(screen.getByRole('menuitem', { name: 'Delete permanently' }));
      expect(onLinkClick).toHaveBeenCalledOnce();
      expect(onDisabledClick).not.toHaveBeenCalled();

      await user.type(input, 'rename');
      expect(screen.getAllByRole('menuitem')).toHaveLength(1);
      await user.keyboard('[ArrowDown][Enter]');
      expect(onRegularClick).toHaveBeenCalledOnce();

      await user.clear(input);
      expect(screen.getByRole('menuitemcheckbox', { name: 'Show hidden' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
      expect(screen.getByRole('menuitemradio', { name: 'Sort by date' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });
  });

  describe('submenu ownership matrix', () => {
    const configurations = (['ltr', 'rtl'] as const).flatMap((direction) =>
      [false, true].flatMap((parentInput) =>
        [false, true].map((childInput) => ({ childInput, direction, parentInput })),
      ),
    );

    it.each(configurations)(
      '$direction parentInput=$parentInput childInput=$childInput',
      async ({ childInput, direction, parentInput }) => {
        const { user } = await render(
          <DirectionProvider direction={direction}>
            <FilterMenu.Root open>
              <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
              <FilterMenu.Portal>
                <FilterMenu.Positioner>
                  <FilterMenu.Popup>
                    {parentInput && <FilterMenu.Input aria-label="Filter actions" />}
                    <FilterMenu.List data-testid="parent-list">
                      <FilterMenu.Item>Before</FilterMenu.Item>
                      <FilterMenu.SubmenuRoot>
                        <FilterMenu.SubmenuTrigger delay={0}>Move to</FilterMenu.SubmenuTrigger>
                        <FilterMenu.Portal>
                          <FilterMenu.Positioner>
                            <FilterMenu.Popup>
                              {childInput && <FilterMenu.Input aria-label="Filter destinations" />}
                              <FilterMenu.List data-testid="child-list">
                                <FilterMenu.Item>Documents</FilterMenu.Item>
                                <FilterMenu.Item>Downloads</FilterMenu.Item>
                              </FilterMenu.List>
                            </FilterMenu.Popup>
                          </FilterMenu.Positioner>
                        </FilterMenu.Portal>
                      </FilterMenu.SubmenuRoot>
                      <FilterMenu.Item>After</FilterMenu.Item>
                    </FilterMenu.List>
                  </FilterMenu.Popup>
                </FilterMenu.Positioner>
              </FilterMenu.Portal>
            </FilterMenu.Root>
          </DirectionProvider>,
        );

        const parentOwner = parentInput
          ? screen.getByRole('searchbox', { name: 'Filter actions' })
          : screen.getByTestId('parent-list');
        await act(async () => {
          parentOwner.focus();
        });
        const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to' });
        await user.hover(submenuTrigger);
        expect(parentOwner).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

        await user.keyboard(direction === 'rtl' ? '[ArrowLeft]' : '[ArrowRight]');
        const childList = await screen.findByTestId('child-list');
        const childOwner = childInput
          ? screen.getByRole('searchbox', { name: 'Filter destinations' })
          : childList;

        await waitFor(() => {
          expect(childOwner).toHaveFocus();
        });
        expect(screen.getAllByRole('dialog')).toHaveLength(2);

        if (!childOwner.hasAttribute('aria-activedescendant')) {
          await user.keyboard('[ArrowDown]');
        }
        expect(childOwner).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('menuitem', { name: 'Documents' }).id,
        );

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expect(screen.queryByTestId('child-list')).toBe(null);
        });
        expect(parentOwner).toHaveFocus();
        expect(parentOwner).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
      },
    );
  });
});
