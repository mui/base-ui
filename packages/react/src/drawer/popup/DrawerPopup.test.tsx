import { Drawer } from '@base-ui/react/drawer';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Drawer.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Drawer.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Drawer.Root open>
          <Drawer.Portal>{node}</Drawer.Portal>
        </Drawer.Root>,
      );
    },
  }));
});
