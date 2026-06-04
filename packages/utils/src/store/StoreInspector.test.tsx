import { expect } from 'vitest';
import * as React from 'react';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { ReactStore } from './ReactStore';
import { StoreInspectorPanel } from './StoreInspector';

describe('StoreInspector', () => {
  const { render } = createRenderer();

  it('renders circular Map values', () => {
    const store = new ReactStore({ open: false });
    const circularMap = new Map<string, unknown>();

    circularMap.set('self', circularMap);

    expect(() => {
      render(
        <StoreInspectorPanel
          anchorElement={null}
          store={store}
          additionalData={circularMap}
          open
        />,
      );
    }).not.toThrow();

    expect(screen.getByText(/\[circular reference\]/)).toBeInTheDocument();
  });
});
