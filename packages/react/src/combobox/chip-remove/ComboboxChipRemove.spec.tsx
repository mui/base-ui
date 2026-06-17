import { Combobox } from '@base-ui/react/combobox';

<Combobox.ChipRemove />;
<Combobox.ChipRemove type="button" />;
<Combobox.ChipRemove nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Combobox.ChipRemove nativeButton={false} type="button" />;
