import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';
import { createRenderer, describeConformance } from '#test-utils';

const toast = {
  id: 'test',
  title: 'Toast title',
};

describe('<Toast.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Content />, () => ({
    refInstanceof: window.HTMLDivElement,
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
