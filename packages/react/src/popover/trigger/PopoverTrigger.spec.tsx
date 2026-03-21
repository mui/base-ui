import * as React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

function TriggerWithElementRef() {
  const triggerRef = React.useRef<HTMLElement>(null);

  return <BasePopover.Trigger ref={triggerRef} />;
}

const ForwardRefWrapper = React.forwardRef<HTMLElement, BasePopover.Trigger.Props>((props, ref) => (
  <BasePopover.Trigger {...props} ref={ref} />
));

<TriggerWithElementRef />;
<ForwardRefWrapper />;
