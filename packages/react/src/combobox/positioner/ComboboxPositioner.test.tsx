import { expect } from 'vitest';
import * as React from 'react';
import { waitFor } from '@mui/internal-test-utils';
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
    it('uses the input when input group is absent', async () => {
      const inputWidth = 120;
      const triggerWidth = 240;
      let anchorWidth = 0;
      const inputRef = React.createRef<HTMLInputElement>();

      await render(
        <Combobox.Root open>
          <Combobox.Input ref={inputRef} style={{ width: inputWidth }} />
          <Combobox.Trigger style={{ width: triggerWidth }}>Open</Combobox.Trigger>
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
        expect(anchorWidth).toBeCloseTo(inputRef.current!.getBoundingClientRect().width, 0);
        expect(anchorWidth).not.toBeCloseTo(triggerWidth, 0);
      });
    });

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
