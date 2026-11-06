import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { Popover } from '@base-ui/react/popover';
import { createRenderer, isJSDOM } from '#test-utils';

const styleReads = vi.hoisted(() => ({ count: 0 }));

// `FocusGuard` has no render prop to count with, but reads this export once per render.
vi.mock('@base-ui/utils/visuallyHidden', async () => {
  const actual = await vi.importActual<typeof import('@base-ui/utils/visuallyHidden')>(
    '@base-ui/utils/visuallyHidden',
  );

  return {
    ...actual,
    get visuallyHidden() {
      styleReads.count += 1;
      return actual.visuallyHidden;
    },
  };
});

interface ExampleProps {
  label: string;
}

function PopoverExample({ label }: ExampleProps) {
  return (
    <Popover.Root defaultOpen modal={false}>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup>
            <button>{label}</button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function DialogExample({ label }: ExampleProps) {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup>
          <button>{label}</button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MenuExample({ label }: ExampleProps) {
  return (
    <Menu.Root defaultOpen modal={false}>
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item>{label}</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

// The browser build copies the mocked exports once when the module loads, so the getter doesn't
// run on each render there.
describe.skipIf(!isJSDOM)('FocusGuard', () => {
  const { render } = createRenderer();

  it.each([
    { name: 'a non-modal Popover', Example: PopoverExample },
    { name: 'a Dialog', Example: DialogExample },
    { name: 'a non-modal Menu', Example: MenuExample },
  ])('does not re-render when $name re-renders', async ({ Example }) => {
    const { rerender } = await render(<Example label="before" />);

    expect(document.querySelectorAll('[data-base-ui-focus-guard]').length).toBeGreaterThan(0);
    expect(styleReads.count).toBeGreaterThan(0);

    styleReads.count = 0;
    await rerender(<Example label="after" />);

    expect(screen.getByText('after')).toBeVisible();
    expect(styleReads.count).toBe(0);
  });
});
