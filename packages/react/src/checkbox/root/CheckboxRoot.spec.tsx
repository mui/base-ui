import { Checkbox } from '@base-ui/react/checkbox';

<Checkbox.Root />;
<Checkbox.Root nativeButton />;
<Checkbox.Root nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Checkbox.Root type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Checkbox.Root nativeButton={false} type="button" />;
