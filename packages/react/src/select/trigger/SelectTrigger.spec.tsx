import { Select } from '@base-ui/react/select';

<Select.Trigger>Open</Select.Trigger>;
<Select.Trigger type="button">Open</Select.Trigger>;
<Select.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Select.Trigger nativeButton={false} type="button">
  Open
</Select.Trigger>;
