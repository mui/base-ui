import { Accordion } from '@base-ui/react/accordion';

<Accordion.Trigger />;
<Accordion.Trigger type="submit" />;
<Accordion.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Accordion.Trigger nativeButton={false} type="submit" />;
