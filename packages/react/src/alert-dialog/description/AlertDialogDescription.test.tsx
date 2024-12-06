import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render: (node) => {
      return render(
        <AlertDialog.Root open>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>{node}</AlertDialog.Popup>
        </AlertDialog.Root>,
      );
    },
  }));
});
