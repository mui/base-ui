import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Dialog from '@base_ui/react/Dialog';
import { describeConformance } from '../../../test/describeConformance';

describe('<Dialog.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          <Dialog.Popup animated={false}>{node}</Dialog.Popup>
        </Dialog.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
