import { Select } from '@base-ui/react/select';

<Select.Item value="one" />;
<Select.Item value="one" nativeButton />;
<Select.Item value="one" nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Select.Item value="one" type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Select.Item value="one" nativeButton={false} type="button" />;
