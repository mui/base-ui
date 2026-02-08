import { Radio } from '@base-ui/react/radio';

<Radio.Root value="a" />;
<Radio.Root value="a" nativeButton />;
<Radio.Root value="a" nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Radio.Root value="a" type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Radio.Root value="a" nativeButton={false} type="button" />;
