import { Toast } from '@base-ui/react/toast';

<Toast.Action>Undo</Toast.Action>;
<Toast.Action type="button">Undo</Toast.Action>;
<Toast.Action nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Toast.Action nativeButton={false} type="button">
  Undo
</Toast.Action>;
