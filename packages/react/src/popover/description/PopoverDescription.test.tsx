import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Positioner>
            <Popover.Popup>{node}</Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>,
      );
    },
  }));

  it('describes the popup element with its id', async () => {
    await render(
      <Popover.Root open>
        <Popover.Positioner>
          <Popover.Popup>
            <Popover.Description>Title</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>,
    );

    const id = document.querySelector('p')?.id;
    expect(screen.getByRole('dialog')).to.have.attribute('aria-describedby', id);
  });
});
