import { Combobox } from '@base-ui/react/combobox';

<Combobox.Clear />;
<Combobox.Clear type="button" />;
<Combobox.Clear nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Combobox.Clear nativeButton={false} type="button" />;
