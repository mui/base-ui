import * as React from 'react';
import { expect } from 'chai';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import userEvent from '@testing-library/user-event';
import { flushMicrotasks } from '@mui/internal-test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { describeConformance, createRenderer } from '#test-utils';
import { MenuRootContext } from '../root/MenuRootContext';

const testRootContext: MenuRootContext = {
  floatingRootContext: undefined as unknown as FloatingRootContext,
  getPopupProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: undefined,
  nested: false,
  setTriggerElement: () => {},
  setPositionerElement: () => {},
  activeIndex: null,
  disabled: false,
  itemDomElements: { current: [] },
  itemLabels: { current: [] },
  open: true,
  setOpen: () => {},
  popupRef: { current: null },
  mounted: true,
  transitionStatus: undefined,
  typingRef: { current: false },
  modal: false,
  positionerRef: { current: null },
  allowMouseUpTriggerRef: { current: false },
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
    it('should be placed near the specified element when a ref is passed', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      function TestComponent() {
        const anchor = React.useRef<HTMLDivElement | null>(null);

        return (
          <div style={{ margin: '50px' }}>
            <Menu.Root open>
              <Menu.Positioner
                side="bottom"
                align="start"
                anchor={anchor}
                arrowPadding={0}
                data-testid="positioner"
              >
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

      const { getByTestId } = await render(<TestComponent />);

      const positioner = getByTestId('positioner');
      const anchor = getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await flushMicrotasks();

      expect(positioner.style.getPropertyValue('transform')).to.equal(
        `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
      );
    });

    it('should be placed near the specified element when an element is passed', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      function TestComponent() {
        const [anchor, setAnchor] = React.useState<HTMLDivElement | null>(null);
        const handleRef = React.useCallback((element: HTMLDivElement | null) => {
          setAnchor(element);
        }, []);

        return (
          <div style={{ margin: '50px' }}>
            <Menu.Root open>
              <Menu.Positioner
                side="bottom"
                align="start"
                anchor={anchor}
                arrowPadding={0}
                data-testid="positioner"
              >
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                  <Menu.Item>2</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Root>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={handleRef} />
          </div>
        );
      }

      const { getByTestId } = await render(<TestComponent />);

      const positioner = getByTestId('positioner');
      const anchor = getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await flushMicrotasks();

      expect(positioner.style.getPropertyValue('transform')).to.equal(
        `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
      );
    });

    it('should be placed near the specified element when a function returning an element is passed', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      function TestComponent() {
        const [anchor, setAnchor] = React.useState<HTMLDivElement | null>(null);
        const handleRef = React.useCallback((element: HTMLDivElement | null) => {
          setAnchor(element);
        }, []);

        const getAnchor = React.useCallback(() => anchor, [anchor]);

        return (
          <div style={{ margin: '50px' }}>
            <Menu.Root open>
              <Menu.Positioner
                side="bottom"
                align="start"
                anchor={getAnchor}
                arrowPadding={0}
                data-testid="positioner"
              >
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                  <Menu.Item>2</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Root>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={handleRef} />
          </div>
        );
      }

      const { getByTestId } = await render(<TestComponent />);

      const positioner = getByTestId('positioner');
      const anchor = getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await flushMicrotasks();

      expect(positioner.style.getPropertyValue('transform')).to.equal(
        `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
      );
    });

    it('should be placed at the specified position', async function test(t = {}) {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
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

      const { getByTestId } = await render(
        <Menu.Root open>
          <Menu.Positioner
            side="bottom"
            align="start"
            anchor={virtualElement}
            arrowPadding={0}
            data-testid="positioner"
          >
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Item>2</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const positioner = getByTestId('positioner');
      expect(positioner.style.getPropertyValue('transform')).to.equal(`translate(200px, 100px)`);
    });
  });

  describe('prop: keepMounted', () => {
    const user = userEvent.setup();

    it('when keepMounted=true, should keep the content mounted when closed', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
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
        <Menu.Root>
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
