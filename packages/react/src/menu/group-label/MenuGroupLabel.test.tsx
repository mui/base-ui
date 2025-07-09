import * as React from 'react';
import { expect } from 'vitest';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';
import { MenuGroupContext } from '../group/MenuGroupContext';

const testContext: MenuGroupContext = {
  setLabelId: () => {},
};

describe('<Menu.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.GroupLabel />, () => ({
    render: (node) => {
      return render(
        <MenuGroupContext.Provider value={testContext}>{node}</MenuGroupContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe('a11y attributes', () => {
    it('should have the role `presentation`', async () => {
      const { getByText } = await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const groupLabel = getByText('Test group');
      expect(groupLabel).to.have.attribute('role', 'presentation');
    });

    it("should reference the generated id in Group's `aria-labelledby`", async () => {
      const { getByText, getByRole } = await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const group = getByRole('group');
      const groupLabel = getByText('Test group');

      expect(group).to.have.attribute('aria-labelledby', groupLabel.id);
    });

    it("should reference the provided id in Group's `aria-labelledby`", async () => {
      const { getByRole } = await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel id="test-group">Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const group = getByRole('group');
      expect(group).to.have.attribute('aria-labelledby', 'test-group');
    });
  });
});
