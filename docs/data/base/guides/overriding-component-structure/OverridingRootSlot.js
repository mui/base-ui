import * as React from 'react';
import { Button } from '@base_ui/react/Button';

export default function OverridingRootSlot() {
  return <Button slots={{ root: 'div' }}>Button</Button>;
}
