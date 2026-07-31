import * as React from 'react';
import { expect } from 'vitest';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes';

// The default state serializer derives this attribute name without referencing
// `ToggleGroupDataAttributes`, so re-link the runtime output to the public enum
// in tests. Test-only imports add no production bytes.
describe('Toggle Group enum sync', () => {
  const { render } = createRenderer();

  it('names the multiple data-attribute per ToggleGroupDataAttributes', async () => {
    await render(<ToggleGroup multiple data-testid="group" />);

    expect(screen.getByTestId('group')).toHaveAttribute(ToggleGroupDataAttributes.multiple);
  });
});
