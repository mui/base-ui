import { Popover } from '@base-ui/react/popover';

<Popover.Trigger />;
<Popover.Trigger type="button" />;
<Popover.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Popover.Trigger nativeButton={false} type="button" />;
