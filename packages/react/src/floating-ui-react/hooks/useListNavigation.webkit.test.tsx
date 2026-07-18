import { vi, it, describe, expect } from 'vitest';
import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useTestInteractions } from '#test-utils';
import { useClick, useFloating, useListNavigation } from '../index';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    ...actual,
    platform: {
      ...actual.platform,
      engine: { ...actual.platform.engine, webkit: true },
    },
  };
});

function App() {
  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<Array<HTMLLIElement | null>>([]);
  const [activeIndex, setActiveIndex] = React.useState<null | number>(null);
  const { refs, context } = useFloating({
    open,
    onOpenChange: setOpen,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useTestInteractions([
    useClick(context),
    useListNavigation(context, {
      listRef,
      activeIndex,
      onNavigate: setActiveIndex,
    }),
  ]);

  return (
    <React.Fragment>
      <button {...getReferenceProps({ ref: refs.setReference })} />
      {open && (
        <div role="menu" {...getFloatingProps({ ref: refs.setFloating })}>
          <ul>
            {['one', 'two', 'three'].map((string, index) => (
              // eslint-disable-next-line jsx-a11y/role-supports-aria-props
              <li
                data-testid={`item-${index}`}
                aria-selected={activeIndex === index}
                key={string}
                tabIndex={-1}
                {...getItemProps({
                  ref(node: HTMLLIElement) {
                    listRef.current[index] = node;
                  },
                })}
              >
                {string}
              </li>
            ))}
          </ul>
        </div>
      )}
    </React.Fragment>
  );
}

describe('useListNavigation (WebKit)', () => {
  it('ignores stationary mousemove events fired when the list scrolls beneath the pointer', async () => {
    render(<App />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });

    // WebKit fires a `mousemove` event with zero movement deltas on the item
    // that moves under the stationary pointer during a keyboard-driven scroll.
    fireEvent.mouseMove(screen.getByTestId('item-1'));
    expect(screen.getByTestId('item-0')).toHaveFocus();
    expect(screen.getByTestId('item-1')).toHaveAttribute('aria-selected', 'false');

    // An actual pointer movement still moves the highlight.
    fireEvent.mouseMove(screen.getByTestId('item-1'), { movementX: 10, movementY: 10 });
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });
    expect(screen.getByTestId('item-1')).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps keyboard modality when a stationary pointermove fires on the floating element', async () => {
    render(<App />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toHaveFocus();
    });

    // The stationary sequence bubbles a `pointermove` through the floating
    // element before the item receives the `mousemove`.
    fireEvent.pointerMove(screen.getByRole('menu'), { pointerType: 'mouse' });
    fireEvent.mouseMove(screen.getByTestId('item-1'));
    expect(screen.getByTestId('item-0')).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toHaveFocus();
    });
  });
});
