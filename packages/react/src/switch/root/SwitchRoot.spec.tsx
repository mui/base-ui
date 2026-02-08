import { Switch } from '@base-ui/react/switch';

<Switch.Root />;
<Switch.Root nativeButton />;
<Switch.Root nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Switch.Root type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Switch.Root nativeButton={false} type="button" />;
