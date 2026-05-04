import { Tabs } from '@base-ui/react/tabs';

<Tabs.Tab value="one" />;
<Tabs.Tab value="one" type="button" />;
<Tabs.Tab value="one" nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Tabs.Tab value="one" nativeButton={false} type="button" />;
