import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          <AlertDialog.Portal>
            <AlertDialog.Popup>{node}</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );
    },
  }));
});
