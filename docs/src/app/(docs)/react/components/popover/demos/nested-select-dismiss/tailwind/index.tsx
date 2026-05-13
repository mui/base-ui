import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Select } from '@base-ui/react/select';

/**
 * Reproduces a dismissal bug: when a `Select` is nested inside a
 * `Popover`, clicking outside the Popover requires TWO clicks to
 * dismiss it instead of one.
 *
 * Test:
 *   1. Click the trigger to open the Popover.
 *   2. Click anywhere outside the Popover WITHOUT interacting with
 *      the Select inside.
 *   3. Observed: the Popover stays open. A second outside click is
 *      required to dismiss it.
 *   4. Expected: a single outside click dismisses the Popover, the
 *      same behavior you get when the Popover has no nested Select.
 *
 * The bug reproduces even though the Select dropdown has never been
 * opened — the mere presence of the Select inside the Popover is
 * enough to break dismissal.
 */
export default function ExampleNestedSelectDismiss() {
  return (
    <Popover.Root>
      <Popover.Trigger>Open popover</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup>
            <Select.Root>
              <Select.Trigger>
                <Select.Value>Pick one</Select.Value>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner sideOffset={8}>
                  <Select.Popup>
                    <Select.Item value="a">Alpha</Select.Item>
                    <Select.Item value="b">Bravo</Select.Item>
                    <Select.Item value="c">Charlie</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
