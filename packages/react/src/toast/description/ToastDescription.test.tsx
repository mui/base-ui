import { describe } from 'vitest';
import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance } from '#test-utils';

const toast: Toast.Root.ToastObject = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Description>description</Toast.Description>, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast.Root toast={toast}>{node}</Toast.Root>
          </Toast.Viewport>
        </Toast.Provider>,
      );
    },
  }));
});
