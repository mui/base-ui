import { Radio } from '@base-ui/react/radio';

const value = 'a';

<Radio.Root value={value} />;
<Radio.Root value="a" />;
<Radio.Root value={1} />;
<Radio.Root value={null} />;

<Radio.Root<string | null> value={null} />;
<Radio.Root value="a" nativeButton />;
<Radio.Root value="a" nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Radio.Root value="a" type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Radio.Root value="a" nativeButton={false} type="button" />;
// @ts-expect-error value must match explicit generic type
<Radio.Root<'a' | 'b'> value="c" />;
