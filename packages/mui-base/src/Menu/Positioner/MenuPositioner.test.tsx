import * as React from 'react';
import { expect } from 'chai';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import userEvent from '@testing-library/user-event';
import { flushMicrotasks } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '#test-utils';

const testRootContext: MenuRootContext = {
  floatingRootContext: undefined as unknown as FloatingRootContext,
  getPositionerProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: null,
  nested: false,
  triggerElement: null,
  setTriggerElement: () => {},
  setPositionerElement: () => {},
  activeIndex: null,
  disabled: false,
  itemDomElements: { current: [] },
  itemLabels: { current: [] },
  open: true,
  setOpen: () => {},
  clickAndDragEnabled: false,
  setClickAndDragEnabled: () => {},
  popupRef: { current: null },
  mounted: true,
  transitionStatus: undefined,
};

describe('<Menu.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Positioner />, () => ({
    render: (node) => {
      return render(
        <FloatingTree>
          <MenuRootContext.Provider value={testRootContext}>{node}</MenuRootContext.Provider>
        </FloatingTree>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe('prop: anchor', () => {
    it('should be placed near the specified element', async function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      function TestComponent() {
        const anchor = React.useRef<HTMLDivElement | null>(null);

        return (
          <div>
            <Menu.Root open animated={false}>
              <Menu.Positioner side="bottom" alignment="start" anchor={anchor} arrowPadding={0}>
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                  <Menu.Item>2</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Root>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={anchor} />
          </div>
        );
      }

      const { getByRole, getByTestId } = await render(<TestComponent />);

      const popup = getByRole('menu');
      const anchor = getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await flushMicrotasks();

      expect(popup.style.getPropertyValue('transform')).to.equal(
        `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
      );
    });

    it('should be placed at the specified position', async function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      const boundingRect = {
        x: 200,
        y: 100,
        top: 100,
        left: 200,
        bottom: 100,
        right: 200,
        height: 0,
        width: 0,
        toJSON: () => {},
      };

      const virtualElement = { getBoundingClientRect: () => boundingRect };

      const { getByRole } = await render(
        <Menu.Root open animated={false}>
          <Menu.Positioner side="bottom" alignment="start" anchor={virtualElement} arrowPadding={0}>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Item>2</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const popup = getByRole('menu');
      expect(popup.style.getPropertyValue('transform')).to.equal(`translate(200px, 100px)`);
    });
  });

  describe('prop: keepMounted', () => {
    const user = userEvent.setup();

    it('when keepMounted=true, should keep the content mounted when closed', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Positioner keepMounted>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Item>2</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });

      expect(queryByRole('menu', { hidden: true })).not.to.equal(null);
      expect(queryByRole('menu', { hidden: true })).toBeInaccessible();

      await user.click(trigger);
      await flushMicrotasks();
      expect(queryByRole('menu', { hidden: false })).not.to.equal(null);
      expect(queryByRole('menu', { hidden: false })).not.toBeInaccessible();

      await user.click(trigger);
      expect(queryByRole('menu', { hidden: true })).not.to.equal(null);
      expect(queryByRole('menu', { hidden: true })).toBeInaccessible();
    });

    it('when keepMounted=false, should unmount the content when closed', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Positioner keepMounted={false}>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Item>2</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });

      expect(queryByRole('menu', { hidden: true })).to.equal(null);

      await user.click(trigger);
      await flushMicrotasks();
      expect(queryByRole('menu', { hidden: false })).not.to.equal(null);
      expect(queryByRole('menu', { hidden: false })).not.toBeInaccessible();

      await user.click(trigger);
      expect(queryByRole('menu', { hidden: true })).to.equal(null);
    });
  });
});
