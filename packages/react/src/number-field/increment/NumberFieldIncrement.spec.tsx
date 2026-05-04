import { NumberField } from '@base-ui/react/number-field';

<NumberField.Increment />;
<NumberField.Increment type="button" />;
<NumberField.Increment nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<NumberField.Increment nativeButton={false} type="button" />;
