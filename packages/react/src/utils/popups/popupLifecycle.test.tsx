import { beforeEach, describe, expect, it } from 'vitest';
import * as React from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Drawer } from '@base-ui/react/drawer';
import { Menu } from '@base-ui/react/menu';
import { Tooltip } from '@base-ui/react/tooltip';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Select } from '@base-ui/react/select';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer } from '#test-utils';

const cases: Array<{
  name: string;
  renderPopup: (open: boolean, ref: React.Ref<HTMLDivElement>) => React.JSX.Element;
}> = [
  {
    name: 'AlertDialog',
    renderPopup: (open, ref) => (
      <AlertDialog.Root open={open}>
        <AlertDialog.Portal keepMounted>
          {open && <AlertDialog.Popup ref={ref}>Content</AlertDialog.Popup>}
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ),
  },
  {
    name: 'Drawer',
    renderPopup: (open, ref) => (
      <Drawer.Root open={open}>
        <Drawer.Portal keepMounted>
          {open && (
            <Drawer.Viewport>
              <Drawer.Popup ref={ref}>Content</Drawer.Popup>
            </Drawer.Viewport>
          )}
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  {
    name: 'Menu',
    renderPopup: (open, ref) => (
      <Menu.Root open={open}>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal keepMounted>
          {open && (
            <Menu.Positioner ref={ref}>
              <Menu.Popup>
                <Menu.Item>Content</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          )}
        </Menu.Portal>
      </Menu.Root>
    ),
  },
  {
    name: 'Tooltip',
    renderPopup: (open, ref) => (
      <Tooltip.Root open={open}>
        <Tooltip.Trigger>Open</Tooltip.Trigger>
        <Tooltip.Portal keepMounted>
          {open && (
            <Tooltip.Positioner ref={ref}>
              <Tooltip.Popup>Content</Tooltip.Popup>
            </Tooltip.Positioner>
          )}
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
  },
  {
    name: 'PreviewCard',
    renderPopup: (open, ref) => (
      <PreviewCard.Root open={open}>
        <PreviewCard.Trigger href="#">Open</PreviewCard.Trigger>
        <PreviewCard.Portal keepMounted>
          {open && (
            <PreviewCard.Positioner ref={ref}>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          )}
        </PreviewCard.Portal>
      </PreviewCard.Root>
    ),
  },
  {
    name: 'Select',
    // Select.Portal mounts lazily. Render inline to inspect the positioner's opening commit.
    renderPopup: (open, ref) => (
      <Select.Root open={open}>
        <Select.Trigger>Open</Select.Trigger>
        {open && (
          <Select.Positioner ref={ref}>
            <Select.Popup>
              <Select.Item value="one">Content</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        )}
      </Select.Root>
    ),
  },
  {
    name: 'Combobox',
    renderPopup: (open, ref) => (
      <Combobox.Root open={open}>
        <Combobox.Input />
        <Combobox.Portal keepMounted>
          {open && (
            <Combobox.Positioner ref={ref}>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="one">Content</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          )}
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
];

describe('popup lifecycle rendering', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  it.for(cases)('$name removes hidden in the opening commit', async ({ renderPopup }) => {
    const commits: boolean[] = [];
    function recordCommit(element: HTMLDivElement | null) {
      if (element) {
        commits.push(element.hasAttribute('hidden'));
      }
    }

    const { rerender } = await render(renderPopup(false, recordCommit));
    await rerender(renderPopup(true, recordCommit));

    expect(commits[0]).toBe(false);
  });
});
