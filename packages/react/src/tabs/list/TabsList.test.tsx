import { expect } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Tabs } from '@base-ui/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tabs.List />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.List />, () => ({
    render: (node) => render(<Tabs.Root>{node}</Tabs.Root>),
    refInstanceof: window.HTMLDivElement,
  }));

  describe('accessibility attributes', () => {
    it('sets the aria-selected attribute on the active tab', async () => {
      await render(
        <Tabs.Root defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>,
      );

      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');
      const tab3 = screen.getByText('Tab 3');

      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
      expect(tab3).toHaveAttribute('aria-selected', 'false');

      await act(async () => {
        tab2.click();
      });

      expect(tab1).toHaveAttribute('aria-selected', 'false');
      expect(tab2).toHaveAttribute('aria-selected', 'true');
      expect(tab3).toHaveAttribute('aria-selected', 'false');

      await act(async () => {
        tab3.click();
      });

      expect(tab1).toHaveAttribute('aria-selected', 'false');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
      expect(tab3).toHaveAttribute('aria-selected', 'true');

      await act(async () => {
        tab1.click();
      });

      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
      expect(tab3).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('prop: loopFocus', () => {
    it('does not wrap focus past the first tab when `loopFocus` is false', async () => {
      await render(
        <Tabs.Root value={0}>
          <Tabs.List loopFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>,
      );

      const [firstTab, , lastTab] = screen.getAllByRole('tab');
      await act(async () => {
        firstTab.focus();
      });

      fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
      await flushMicrotasks();

      expect(firstTab).toHaveFocus();
      expect(lastTab).not.toHaveFocus();
    });

    it('does not wrap focus past the last tab when `loopFocus` is false', async () => {
      await render(
        <Tabs.Root value={2}>
          <Tabs.List loopFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>,
      );

      const [firstTab, , lastTab] = screen.getAllByRole('tab');
      await act(async () => {
        lastTab.focus();
      });

      fireEvent.keyDown(lastTab, { key: 'ArrowRight' });
      await flushMicrotasks();

      expect(lastTab).toHaveFocus();
      expect(firstTab).not.toHaveFocus();
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus to a tab disabled with the `disabled` prop', async () => {
      await render(
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} disabled />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>,
      );

      const [firstTab, disabledTab] = screen.getAllByRole('tab');
      await act(async () => {
        firstTab.focus();
      });

      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      await flushMicrotasks();

      expect(disabledTab).toHaveFocus();
    });

    it('skips a natively disabled tab in a single keypress', async () => {
      await render(
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} render={<button type="button" disabled />} />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>,
      );

      const [firstTab, , lastTab] = screen.getAllByRole('tab');
      await act(async () => {
        firstTab.focus();
      });

      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      await flushMicrotasks();

      expect(lastTab).toHaveFocus();

      fireEvent.keyDown(lastTab, { key: 'ArrowLeft' });
      await flushMicrotasks();

      expect(firstTab).toHaveFocus();
    });
  });

  describe('roving focus after tab removal', () => {
    it('moves the tab stop off a hidden successor when the highlighted tab is removed', async () => {
      function TestComponent({ showMiddleTab }: { showMiddleTab: boolean }) {
        return (
          <Tabs.Root defaultValue={0}>
            <Tabs.List>
              <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
              {showMiddleTab && <Tabs.Tab value={1}>Tab 1</Tabs.Tab>}
              <Tabs.Tab value={2} hidden>
                Tab 2
              </Tabs.Tab>
              <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
        );
      }

      const { setProps } = await render(<TestComponent showMiddleTab />);

      const selectedTab = screen.getByText('Tab 0');
      await act(async () => selectedTab.focus());
      fireEvent.keyDown(selectedTab, { key: 'ArrowRight' });
      await flushMicrotasks();

      await setProps({ showMiddleTab: false });

      const tabs = screen.getAllByRole('tab', { hidden: true });
      expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    });

    it('can fall back to a tab that is focusable when disabled', async () => {
      function TestComponent({ showSelectedTab }: { showSelectedTab: boolean }) {
        return (
          <Tabs.Root value={2}>
            <Tabs.List>
              <Tabs.Tab value={0} disabled>
                Tab 0
              </Tabs.Tab>
              <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
              {showSelectedTab && <Tabs.Tab value={2}>Tab 2</Tabs.Tab>}
            </Tabs.List>
          </Tabs.Root>
        );
      }

      const { setProps } = await render(<TestComponent showSelectedTab />);

      await setProps({ showSelectedTab: false });

      expect(screen.getByText('Tab 0')).toHaveAttribute('tabindex', '0');
      expect(screen.getByText('Tab 1')).toHaveAttribute('tabindex', '-1');
    });

    it('keeps the tab stop on the selected tab when focus is inside the list', async () => {
      function TestComponent({ showFirstTab }: { showFirstTab: boolean }) {
        return (
          <Tabs.Root value={2}>
            <Tabs.List>
              {showFirstTab && <Tabs.Tab value={0}>Tab 0</Tabs.Tab>}
              <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
              <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
        );
      }

      const { setProps } = await render(<TestComponent showFirstTab />);

      const selectedTab = screen.getByText('Tab 2');
      await act(async () => {
        selectedTab.focus();
      });

      await setProps({ showFirstTab: false });

      const [unselectedTab] = screen.getAllByRole('tab');

      expect([unselectedTab.tabIndex, selectedTab.tabIndex]).toEqual([-1, 0]);
    });

    it('keeps tracking a successor through subsequent removals', async () => {
      function TestComponent(props: { showFirstTab: boolean; showSelectedTab: boolean }) {
        return (
          <Tabs.Root value={1}>
            <Tabs.List>
              {props.showFirstTab && <Tabs.Tab value={0}>Tab 0</Tabs.Tab>}
              {props.showSelectedTab && <Tabs.Tab value={1}>Tab 1</Tabs.Tab>}
              <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
              <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
        );
      }

      const { setProps } = await render(<TestComponent showFirstTab showSelectedTab />);

      await setProps({ showFirstTab: true, showSelectedTab: false });

      expect(screen.getByText('Tab 2')).toHaveAttribute('tabindex', '0');

      await setProps({ showFirstTab: false, showSelectedTab: false });

      expect(screen.getByText('Tab 2')).toHaveAttribute('tabindex', '0');
      expect(screen.getByText('Tab 3')).toHaveAttribute('tabindex', '-1');
    });
  });

  it('can be named via `aria-label`', async () => {
    await render(
      <Tabs.Root defaultValue={0}>
        <Tabs.List aria-label="string label">
          <Tabs.Tab value={0} />
        </Tabs.List>
      </Tabs.Root>,
    );

    expect(screen.getByRole('tablist')).toHaveAccessibleName('string label');
  });

  it('can be named via `aria-labelledby`', async () => {
    await render(
      <React.Fragment>
        <h3 id="label-id">complex name</h3>
        <Tabs.Root defaultValue={0}>
          <Tabs.List aria-labelledby="label-id">
            <Tabs.Tab value={0} />
          </Tabs.List>
        </Tabs.Root>
      </React.Fragment>,
    );

    expect(screen.getByRole('tablist')).toHaveAccessibleName('complex name');
  });
});
