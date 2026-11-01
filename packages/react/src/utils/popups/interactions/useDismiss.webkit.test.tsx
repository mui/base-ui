import { vi, expect, describe, test } from 'vitest';
import * as React from 'react';
import { fireEvent, flushMicrotasks, render, screen } from '@mui/internal-test-utils';
import { isJSDOM, useTestInteractions } from '#test-utils';
import { useDismiss } from './useDismiss';
import { useFloating } from '../../../../test/floating-ui-tests/useFloating';

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

function PersistentDismiss() {
  const [open, setOpen] = React.useState(true);
  const { refs, context } = useFloating({ open, onOpenChange: setOpen });
  const { getReferenceProps, getFloatingProps } = useTestInteractions([
    useDismiss(context.rootStore),
  ]);

  return (
    <React.Fragment>
      <button {...getReferenceProps({ ref: refs.setReference })} />
      <button onClick={() => setOpen(true)}>open</button>
      <button onClick={() => setOpen(false)}>close</button>
      {open && <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />}
    </React.Fragment>
  );
}

describe.skipIf(!isJSDOM)('useDismiss in WebKit', () => {
  test('does not dismiss with the escape key that ends a composition spanning a reopen', async () => {
    render(<PersistentDismiss />);

    fireEvent.compositionStart(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    fireEvent.click(screen.getByRole('button', { name: 'open' }));

    // Safari fires `compositionend` before the `keydown` that ends the composition.
    fireEvent.compositionEnd(document.body);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    await flushMicrotasks();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
