import { Dialog } from '@base-ui/react/dialog';
import { ignoreActWarnings } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Dialog.Description />', () => {
  beforeEach(() => {
    if (!isJSDOM) {
      ignoreActWarnings();
    }
  });

  const { render } = createRenderer();

  describeConformance(<Dialog.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>{node}</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
    },
  }));
});
