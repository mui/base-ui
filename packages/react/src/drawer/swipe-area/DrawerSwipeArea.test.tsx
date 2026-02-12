import * as DrawerModule from '@base-ui/react/drawer';
import { describe, expect, it } from 'vitest';

describe('<Drawer.SwipeArea />', () => {
  it('is not part of the public DrawerPreview API', () => {
    expect('SwipeArea' in DrawerModule.DrawerPreview).toBe(false);
  });

  it('is not exported from @base-ui/react/drawer', () => {
    expect('DrawerSwipeArea' in DrawerModule).toBe(false);
  });
});
