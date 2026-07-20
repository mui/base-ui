import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { Tabs } from '@base-ui/react/tabs';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.Tab value="1" />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) =>
      render(
        <Tabs.Root>
          <Tabs.List>{node}</Tabs.List>
        </Tabs.Root>,
      ),
  }));

  describe('prop: nativeButton', () => {
    it('renders as an anchor and toggles selection when `nativeButton` is false', async () => {
      const { user } = await render(
        <Tabs.Root defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab nativeButton={false} render={<a href="#overview" />} value="overview">
              Overview
            </Tabs.Tab>
            <Tabs.Tab nativeButton={false} render={<a href="#details" />} value="details">
              Details
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>,
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0].tagName).toBe('A');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

      await user.click(tabs[1]);

      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('throws a descriptive error when rendered outside <Tabs.List>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Tabs.Root>
            <Tabs.Tab value="1" />
          </Tabs.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  describe('pointer interaction', () => {
    function TwoTabs(props: {
      onValueChange?: Tabs.Root.Props['onValueChange'];
      disabledSecond?: boolean;
    }) {
      return (
        <Tabs.Root defaultValue={0} onValueChange={props.onValueChange}>
          <Tabs.List activateOnFocus>
            <Tabs.Tab value={0}>One</Tabs.Tab>
            <Tabs.Tab value={1} disabled={props.disabledSecond}>
              Two
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      );
    }

    it('does not re-commit the value when the active tab is pressed', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(<TwoTabs onValueChange={handleValueChange} />);

      const [firstTab] = screen.getAllByRole('tab');
      await user.pointer({ keys: '[MouseLeft]', target: firstTab });

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('does not activate a disabled tab that is pressed and focused', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(<TwoTabs onValueChange={handleValueChange} disabledSecond />);

      const [firstTab, secondTab] = screen.getAllByRole('tab');
      await user.pointer({ keys: '[MouseLeft]', target: secondTab });
      // Disabled tabs stay focusable, and `activateOnFocus` must not select them.
      await act(async () => {
        secondTab.focus();
      });

      expect(secondTab).toHaveFocus();
      expect(handleValueChange).not.toHaveBeenCalled();
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
      expect(secondTab).toHaveAttribute('aria-selected', 'false');
    });

    it('does not activate a tab focused by a held secondary-button press', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(<TwoTabs onValueChange={handleValueChange} />);

      const [, secondTab] = screen.getAllByRole('tab');
      await user.pointer({ keys: '[MouseRight>]', target: secondTab });
      await act(async () => {
        secondTab.focus();
      });

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(secondTab).toHaveAttribute('aria-selected', 'false');
    });

    it('activates on focus again once a secondary-button press has ended', async () => {
      const handleValueChange = vi.fn();
      const { user } = await render(<TwoTabs onValueChange={handleValueChange} />);

      const [firstTab, secondTab] = screen.getAllByRole('tab');
      await user.pointer({ keys: '[MouseRight]', target: secondTab });

      expect(handleValueChange).not.toHaveBeenCalled();

      await act(async () => {
        firstTab.focus();
      });
      await user.keyboard('{ArrowRight}');

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('keyboard activation', () => {
    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('activates the focused tab with %s when `activateOnFocus` is false', async (_label, key) => {
      const { user } = await render(
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0}>One</Tabs.Tab>
            <Tabs.Tab value={1}>Two</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>,
      );

      const [firstTab, secondTab] = screen.getAllByRole('tab');
      await act(async () => {
        firstTab.focus();
      });
      await user.keyboard('{ArrowRight}');

      expect(secondTab).toHaveFocus();
      expect(secondTab).toHaveAttribute('aria-selected', 'false');

      await user.keyboard(key);

      expect(secondTab).toHaveAttribute('aria-selected', 'true');
      expect(firstTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('state', () => {
    it.skipIf(isJSDOM)('exposes tab activation direction through the render prop', async () => {
      const tabRenderMock = vi.fn();

      const { setProps } = await render(
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Tab
              value={0}
              render={(props, state) => {
                tabRenderMock({ value: 0, ...state });
                return <button {...props} />;
              }}
            >
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab
              value={1}
              render={(props, state) => {
                tabRenderMock({ value: 1, ...state });
                return <button {...props} />;
              }}
            >
              Tab 1
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>,
      );

      tabRenderMock.mockClear();

      await setProps({ value: 1 });

      expect(
        tabRenderMock.mock.calls.some(
          ([state]) =>
            state.value === 1 && state.active === true && state.tabActivationDirection === 'right',
        ),
      ).toBe(true);
    });
  });
});
