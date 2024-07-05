import * as React from 'react';
import { expect } from 'chai';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '../../../test';

const testRootContext: MenuRootContext = {
  floatingRootContext: {} as FloatingRootContext,
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
        const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

        return (
          <div>
            <Menu.Root open>
              <Menu.Positioner side="bottom" alignment="start" anchor={anchor}>
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                  <Menu.Item>2</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Root>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={setAnchor} />
          </div>
        );
      }

      const { getByTestId } = await render(<TestComponent />);

      const popup = getByTestId('popup');
      const anchor = getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await new Promise<void>((resolve) => {
        // position gets updated in the next frame
        requestAnimationFrame(() => {
          expect(popup.style.getPropertyValue('transform')).to.equal(
            `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
          );
          resolve();
        });
      });
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

      const { getByTestId } = await render(
        <Menu.Root open>
          <Menu.Positioner side="bottom" alignment="start" anchor={virtualElement}>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Item>2</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );
      const popup = getByTestId('popup');

      await new Promise<void>((resolve) => {
        // position gets updated in the next frame
        requestAnimationFrame(() => {
          expect(popup.style.getPropertyValue('transform')).to.equal(`translate(200px, 100px)`);
          resolve();
        });
      });
    });
  });
});
