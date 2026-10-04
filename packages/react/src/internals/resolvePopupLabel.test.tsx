import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { reactMajor } from '@mui/internal-test-utils';
import { resolvePopupLabel } from './resolvePopupLabel';

describe('resolvePopupLabel', () => {
  it('falls back to the trigger id', () => {
    expect(resolvePopupLabel({}, null, 'trigger')).toBe('trigger');
  });

  it("uses a render element's own label instead of the trigger", () => {
    expect(resolvePopupLabel({ render: <div aria-label="Commands" /> }, null, 'trigger')).toBe(
      undefined,
    );
  });

  it.skipIf(reactMajor < 19)("reads a server-created render element's label", () => {
    // A Server Component's render element reaches the client as a `react.lazy` wrapper.
    const render = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: <div aria-label="Commands" />,
      _init: (payload: unknown) => payload,
    };

    expect(resolvePopupLabel({ render }, null, 'trigger')).toBe(undefined);
  });
});
