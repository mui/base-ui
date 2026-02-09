import { Popover } from '@base-ui/react/popover';

<Popover.Close />;
<Popover.Close type="button" />;
<Popover.Close nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Popover.Close nativeButton={false} type="button" />;
