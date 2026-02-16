import * as React from 'react';
import { waitFor } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Combobox.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Portal>{node}</Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  describe.skipIf(isJSDOM)('default anchor', () => {
    it('uses the input group when present', async () => {
      const inputGroupWidth = 240;
      const inputWidth = 120;
      let anchorWidth = 0;

      await render(
        <Combobox.Root open>
          <Combobox.InputGroup style={{ width: inputGroupWidth }}>
            <Combobox.Input style={{ width: inputWidth }} />
            <Combobox.Trigger>Open</Combobox.Trigger>
          </Combobox.InputGroup>
          <Combobox.Portal>
            <Combobox.Positioner
              sideOffset={(data) => {
                anchorWidth = data.anchor.width;
                return 0;
              }}
            >
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="One">One</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      await waitFor(() => {
        expect(anchorWidth).toBeCloseTo(inputGroupWidth, 0);
      });
    });
  });
});
