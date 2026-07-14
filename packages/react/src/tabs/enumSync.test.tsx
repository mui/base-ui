import * as React from 'react';
import { expect } from 'vitest';
import { Tabs } from '@base-ui/react/tabs';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { tabsStateAttributesMapping } from './root/stateAttributesMapping';
import { TabsRootDataAttributes } from './root/TabsRootDataAttributes';
import { TabsPanelDataAttributes } from './panel/TabsPanelDataAttributes';
import { TabsIndicatorCssVars } from './indicator/TabsIndicatorCssVars';

// The parts inline these enums' values instead of referencing the members, so
// nothing links the docs enums to runtime behavior. These tests re-link every
// inlined member so a rename to only one side fails CI. Test-only imports ship no
// production bytes.
describe('Tabs enum sync', () => {
  const { render } = createRenderer();

  it('names the activation-direction attribute per TabsRootDataAttributes', () => {
    const emitted = tabsStateAttributesMapping.tabActivationDirection!('none');
    expect(Object.keys(emitted!)[0]).toBe(TabsRootDataAttributes.activationDirection);
  });

  it('names the panel index attribute per TabsPanelDataAttributes', async () => {
    await render(
      <Tabs.Root defaultValue={0}>
        <Tabs.List>
          <Tabs.Tab value={0} />
        </Tabs.List>
        <Tabs.Panel value={0} data-testid="panel" />
      </Tabs.Root>,
    );

    expect(screen.getByTestId('panel')).toHaveAttribute(TabsPanelDataAttributes.index);
  });

  it('names the indicator CSS variables per TabsIndicatorCssVars', async () => {
    await render(
      <Tabs.Root defaultValue={0}>
        <Tabs.List>
          <Tabs.Tab value={0} />
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>,
    );

    // The indicator writes every variable through the `style` prop whenever a tab
    // is selected, so the inline style carries them even without layout measurement.
    const indicator = screen.getByTestId('indicator');
    const vars = [
      TabsIndicatorCssVars.activeTabLeft,
      TabsIndicatorCssVars.activeTabRight,
      TabsIndicatorCssVars.activeTabTop,
      TabsIndicatorCssVars.activeTabBottom,
      TabsIndicatorCssVars.activeTabWidth,
      TabsIndicatorCssVars.activeTabHeight,
    ] as const;

    for (const cssVar of vars) {
      expect(indicator.style.getPropertyValue(cssVar)).not.toBe('');
    }
  });
});
