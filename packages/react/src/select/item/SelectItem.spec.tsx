import * as React from 'react';
import { Select } from '@base-ui/react/select';

// `render` can swap the rendered element, so the public ref stays widened to `HTMLElement`
// rather than the default element type.
export function CustomRenderRefs() {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const anchorRef = React.useRef<HTMLAnchorElement>(null);

  return (
    <Select.Root>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              <Select.Item
                ref={buttonRef}
                render={<button type="button" aria-label="Apple" />}
                value="a"
              >
                Apple
              </Select.Item>
              <Select.Item ref={anchorRef} render={<a href="#a" aria-label="Banana" />} value="b">
                Banana
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
