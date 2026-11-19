import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { reactMajor } from '@mui/internal-test-utils';
import { resolveRenderedAriaLabel } from './resolveRenderedAriaLabel';

describe('resolveRenderedAriaLabel', () => {
  it('returns undefined when nothing is given', () => {
    expect(resolveRenderedAriaLabel({})).toBe(undefined);
  });

  it('uses the aria-label prop', () => {
    expect(resolveRenderedAriaLabel({ 'aria-label': 'Prop' })).toBe('Prop');
  });

  it("prefers a render element's own aria-label", () => {
    expect(
      resolveRenderedAriaLabel({ 'aria-label': 'Prop', render: <span aria-label="Rendered" /> }),
    ).toBe('Rendered');
  });

  it('treats an undefined aria-label on a render element as no aria-label', () => {
    expect(
      resolveRenderedAriaLabel({ 'aria-label': 'Prop', render: <span aria-label={undefined} /> }),
    ).toBe(undefined);
  });

  it.skipIf(reactMajor < 19)("reads a server-created render element's aria-label", () => {
    expect(
      resolveRenderedAriaLabel({ render: serverElement(<span aria-label="Rendered" />) }),
    ).toBe('Rendered');
  });

  it('ignores a render element that does not set an aria-label', () => {
    expect(resolveRenderedAriaLabel({ 'aria-label': 'Prop', render: <span /> })).toBe('Prop');
  });

  it('cannot see an aria-label applied by a render function', () => {
    expect(
      resolveRenderedAriaLabel({
        render: (props: React.HTMLAttributes<HTMLSpanElement>) => (
          <span {...props} aria-label="Rendered" />
        ),
      }),
    ).toBe(undefined);
  });
});

function serverElement(element: React.ReactElement) {
  return {
    $$typeof: Symbol.for('react.lazy'),
    _payload: element,
    _init: (payload: unknown) => payload,
  } as unknown as React.ReactElement;
}
