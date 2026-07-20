import { afterEach, expect } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';
import { MenuGroupContext } from '../group/MenuGroupContext';

const testContext: MenuGroupContext = () => {};

describe('<Menu.GroupLabel />', () => {
  const { render } = createRenderer();

  afterEach(async () => {
    await act(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        }),
    );
  });

  describeConformance(<Menu.GroupLabel />, () => ({
    render: (node) => {
      return render(
        <MenuGroupContext.Provider value={testContext}>{node}</MenuGroupContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('throws when rendered outside Menu.Group or Menu.RadioGroup', async () => {
    await expect(render(<Menu.GroupLabel />)).rejects.toThrow(
      'Base UI: MenuGroupContext is missing. Menu group parts must be used within <Menu.Group> or <Menu.RadioGroup>.',
    );
  });

  describe('a11y attributes', () => {
    it('should have the role `presentation`', async () => {
      await render(
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

      const groupLabel = screen.getByText('Test group');
      expect(groupLabel).toHaveAttribute('role', 'presentation');
    });

    it("should reference the generated id in Group's `aria-labelledby`", async () => {
      await render(
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

      const group = screen.getByRole('group');
      const groupLabel = screen.getByText('Test group');

      expect(group).toHaveAttribute('aria-labelledby', groupLabel.id);
    });

    it("should reference the provided id in Group's `aria-labelledby`", async () => {
      await render(
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

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'test-group');
    });

    it("should reference the generated id in RadioGroup's `aria-labelledby`", async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.RadioGroup>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.RadioGroup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const radioGroup = screen.getByRole('group');
      const groupLabel = screen.getByText('Test group');

      expect(radioGroup).toHaveAttribute('aria-labelledby', groupLabel.id);
    });

    it("should reference the provided id in RadioGroup's `aria-labelledby`", async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.RadioGroup>
                  <Menu.GroupLabel id="test-group">Test group</Menu.GroupLabel>
                </Menu.RadioGroup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const radioGroup = screen.getByRole('group');
      expect(radioGroup).toHaveAttribute('aria-labelledby', 'test-group');
    });

    it('should support GroupLabel when RadioGroup is rendered as Group', async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group render={<Menu.RadioGroup />}>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const radioGroup = screen.getByRole('group');
      const groupLabel = screen.getByText('Test group');

      expect(radioGroup).toHaveAttribute('aria-labelledby', groupLabel.id);
    });
  });
});
