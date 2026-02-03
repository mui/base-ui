import { Collapsible } from '@base-ui/react/collapsible';

<Collapsible.Trigger />;
<Collapsible.Trigger type="button" />;
<Collapsible.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Collapsible.Trigger nativeButton={false} type="button" />;
