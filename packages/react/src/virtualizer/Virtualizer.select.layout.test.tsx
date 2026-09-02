import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { Select } from '@base-ui/react/select';
import { Virtualizer } from '@base-ui/react/virtualizer';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';

/**
 * Real-layout coverage of a Select windowed by `<Virtualizer>`. The rest of the Select suite mocks
 * `getBoundingClientRect`, which cannot exercise the scrollport geometry these cases depend on.
 */

interface Country {
  code: string;
  name: string;
}

const ITEMS: Country[] = Array.from({ length: 10000 }, (_, index) => ({
  code: `c-${index}`,
  name: `Country ${index}`,
}));
const getLabel = (item: Country) => item.name;

// The styles the Select documentation recommends: the virtualizer is the scroll container, sized
// by the virtual content and capped by the available height.
const STYLES = `
.Scroller { height: min(20rem, var(--total-size)); max-height: calc(var(--available-height) - 1rem); padding-block: 0.25rem; scroll-padding-block: 24px; }
.Item { box-sizing: border-box; height: 40px; }
.Item[data-tall] { height: 64px; }
.List { width: 300px; }
.Arrow { height: 16px; width: 100%; }
.Arrow[data-direction="up"] { top: 0; }
.Arrow[data-direction="down"] { bottom: 0; }
`;

function getScroller() {
  return screen.getByRole('listbox').firstElementChild as HTMLElement;
}

function getStickyViewport() {
  return getScroller().querySelector<HTMLElement>('[style*="sticky"]')!;
}

function getOption(name: string) {
  return screen.getAllByRole('option').find((option) => option.textContent?.trim() === name);
}

/** How much of the scrollport's visible box no rendered row covers. */
function getUncoveredHeight() {
  const scrollport = getScroller().getBoundingClientRect();
  const rects = screen
    .getAllByRole('option')
    .map((option) => option.getBoundingClientRect())
    .filter((rect) => rect.height > 0)
    .sort((a, b) => a.top - b.top);
  let covered = scrollport.top;
  let uncovered = 0;
  for (const rect of rects) {
    if (rect.top > covered + 0.5 && rect.top < scrollport.bottom) {
      uncovered += Math.min(rect.top, scrollport.bottom) - covered;
    }
    covered = Math.max(covered, rect.bottom);
  }
  if (covered < scrollport.bottom - 0.5) {
    uncovered += scrollport.bottom - covered;
  }
  return uncovered;
}

/**
 * Lets the browser run `count` frames — resize observations and the hydration they schedule —
 * with the state updates they cause wrapped for React.
 */
function nextFrames(count: number) {
  return act(
    () =>
      new Promise<void>((resolve) => {
        let remaining = count;
        const step = () => {
          remaining -= 1;
          if (remaining <= 0) {
            resolve();
          } else {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      }),
  );
}

function isInsideScrollport(element: HTMLElement) {
  const scrollport = getScroller().getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return rect.top >= scrollport.top - 0.5 && rect.bottom <= scrollport.bottom + 0.5;
}

function CountrySelect(props: { variableHeight?: boolean; value?: Country | null }) {
  const { variableHeight = false, value } = props;
  return (
    <React.Fragment>
      <style>{STYLES}</style>
      <Select.Root
        items={ITEMS}
        itemToStringLabel={getLabel}
        value={value}
        onValueChange={() => {}}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Select a country" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={8}>
            <Select.ScrollUpArrow className="Arrow" />
            <Select.Popup>
              <Select.List className="List">
                <Virtualizer<Country>
                  className="Scroller"
                  getItemKey={(item) => item.code}
                  estimatedItemHeight={variableHeight ? 40 : 32}
                >
                  {(item, index) => (
                    <Select.Item
                      className="Item"
                      value={item}
                      data-tall={variableHeight && index % 3 === 0 ? '' : undefined}
                    >
                      <Select.ItemText>{item.name}</Select.ItemText>
                    </Select.Item>
                  )}
                </Virtualizer>
              </Select.List>
            </Select.Popup>
            <Select.ScrollDownArrow className="Arrow" data-testid="down-arrow" />
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </React.Fragment>
  );
}

describe.skipIf(isJSDOM)('<Virtualizer /> inside Select — real layout', () => {
  const { render } = createRenderer();

  it('keeps its rows through an estimate change made while the popup is closed', async () => {
    // Select keeps the popup mounted but hidden after it closes. Rows measured under
    // `display: none` report zero, and a zero must not become a row height or an estimate — with
    // the documented `height: min(20rem, var(--total-size))`, a zero total collapses the
    // scrollport, and a collapsed scrollport renders nothing to measure again.
    const { user, setProps } = await render(<CountrySelect />);
    const trigger = screen.getByTestId('trigger');

    await user.click(trigger);
    // Let the rows be measured and the running average replace the estimate, so the geometry is
    // the measured one a real session has when it closes.
    await waitFor(() => {
      expect(
        Number.parseFloat(getScroller().style.getPropertyValue('--total-size')),
      ).toBeGreaterThan(390000);
    });

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
    // The hidden rows report their collapse a frame later, and the hydration it schedules lands
    // the frame after that.
    await nextFrames(3);

    await setProps({ variableHeight: true });
    await nextFrames(3);
    await user.click(trigger);

    await waitFor(() => {
      expect(getOption('Country 0')!.getBoundingClientRect().height).toBeGreaterThan(0);
    });
    expect(Number.parseFloat(getScroller().style.getPropertyValue('--total-size'))).toBeGreaterThan(
      0,
    );
    expect(getUncoveredHeight()).toBeLessThan(8);
  });

  it('keeps the rows covering the scrollport when the selected item is focused on open', async () => {
    // The popup focuses the selected item without `preventScroll`, which scrolls every scrollable
    // ancestor — including the sticky viewport the rows are stacked in, if it is one.
    const { user } = await render(<CountrySelect value={ITEMS[111]} />);

    await user.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(getOption('Country 111')).not.toBe(undefined);
    });
    await waitFor(() => {
      expect(isInsideScrollport(getOption('Country 111')!)).toBe(true);
    });
    expect(getStickyViewport().scrollTop).toBe(0);
    expect(getUncoveredHeight()).toBe(0);
  });

  it('keeps a row it scrolled to clear of the scroll arrow that `scroll-padding` reserves', async () => {
    // The arrows overlay the scrollport's edges. As in a static list, the space they need is
    // declared with `scroll-padding` — on the virtualizer, since that is the scroll container —
    // and the engine's own scroll-into-view honors it.
    const { user } = await render(<CountrySelect value={ITEMS[111]} />);

    await user.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(getOption('Country 111')).not.toBe(undefined);
    });
    await waitFor(() => {
      expect(isInsideScrollport(getOption('Country 111')!)).toBe(true);
    });
    const arrow = screen.getByTestId('down-arrow');
    expect(arrow.getBoundingClientRect().height).toBe(16);
    expect(getOption('Country 111')!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      arrow.getBoundingClientRect().top + 0.5,
    );
  });

  it('brings a selected row into view when its first pass ran before the viewport was measured', async () => {
    // The engine learns the viewport a frame after the scrollport is laid out. A window computed
    // before that, for no viewport at all, stops short of the destination: the row mounts only as
    // the offscreen focus proxy, which is never measured, so the request that would correct the
    // position waits forever. The window has to be sized from the scrollport's real box instead.
    const { user } = await render(<CountrySelect value={ITEMS[111]} variableHeight />);

    await user.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(getOption('Country 111')).not.toBe(undefined);
    });
    await waitFor(() => {
      expect(isInsideScrollport(getOption('Country 111')!)).toBe(true);
    });
    expect(getUncoveredHeight()).toBe(0);
  });
});
