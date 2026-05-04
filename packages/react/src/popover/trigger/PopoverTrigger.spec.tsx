import { expectType } from '#test-utils';
import { Popover } from '@base-ui/react/popover';

<Popover.Trigger />;
<Popover.Trigger type="button" />;
<Popover.Trigger
  nativeButton={false}
  render={<span />}
  ref={(node) => {
    expectType<HTMLElement | null, typeof node>(node);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Popover.Trigger nativeButton={false} type="button" />;
