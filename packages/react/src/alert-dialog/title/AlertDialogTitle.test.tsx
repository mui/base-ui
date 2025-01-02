import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Title />, () => ({
    refInstanceof: window.HTMLHeadingElement,
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
