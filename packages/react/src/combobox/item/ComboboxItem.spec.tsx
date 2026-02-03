import { Combobox } from '@base-ui/react/combobox';

<Combobox.Item value="one" />;
<Combobox.Item value="one" nativeButton />;
<Combobox.Item value="one" nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Combobox.Item value="one" type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Combobox.Item value="one" nativeButton={false} type="button" />;
