import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<AlertDialog.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Portal />, () => ({
    refInstanceof: null,
    render(node) {
      return render(
        <AlertDialog.Root open animated={false}>
          {node}
        </AlertDialog.Root>,
      );
    },
  }));
});
