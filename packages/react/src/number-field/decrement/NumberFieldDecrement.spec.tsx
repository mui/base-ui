import { NumberField } from '@base-ui/react/number-field';

<NumberField.Decrement />;
<NumberField.Decrement type="button" />;
<NumberField.Decrement nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<NumberField.Decrement nativeButton={false} type="button" />;
