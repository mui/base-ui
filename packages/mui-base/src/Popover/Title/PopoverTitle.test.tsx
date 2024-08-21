import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Title />, () => ({
    refInstanceof: window.HTMLHeadingElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          <Popover.Positioner>
            <Popover.Popup>{node}</Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>,
      );
    },
  }));

  it('labels the popup element with its id', async () => {
    await render(
      <Popover.Root open animated={false}>
        <Popover.Positioner>
          <Popover.Popup>
            <Popover.Title>Title</Popover.Title>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>,
    );

    const id = document.querySelector('h2')?.id;
    expect(screen.getByRole('dialog')).to.have.attribute('aria-labelledby', id);
  });
});
