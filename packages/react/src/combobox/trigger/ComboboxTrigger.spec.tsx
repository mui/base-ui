import { Combobox } from '@base-ui/react/combobox';

<Combobox.Trigger />;
<Combobox.Trigger type="button" />;
<Combobox.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Combobox.Trigger nativeButton={false} type="button" />;
