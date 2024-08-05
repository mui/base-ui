import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import { createRenderer, describeConformance } from '../../../test';

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
