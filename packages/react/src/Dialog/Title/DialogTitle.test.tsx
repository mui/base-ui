import * as React from 'react';
import { Dialog } from '@base-ui-components/react/Dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Title />, () => ({
    refInstanceof: window.HTMLHeadingElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false} animated={false}>
          <Dialog.Popup>{node}</Dialog.Popup>
        </Dialog.Root>,
      );
    },
  }));
});
