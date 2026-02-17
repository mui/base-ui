import { DrawerPreview as Drawer } from '@base-ui/react/drawer';
import { screen } from '@mui/internal-test-utils';
import { describe, expect, it } from 'vitest';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Drawer.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<Drawer.Content />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Drawer.Root open>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>{node}</Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );
    },
  }));

  it('adds data-swipe-ignore', async () => {
    await render(
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup>
              <Drawer.Content data-testid="content">Content</Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    expect(screen.getByTestId('content').getAttribute('data-swipe-ignore')).toBe('');
  });
});
