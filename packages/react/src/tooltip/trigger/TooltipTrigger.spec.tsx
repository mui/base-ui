import { Tooltip } from '@base-ui-components/react/tooltip';

// `props: any` will error
<Tooltip.Trigger render={(props) => <button {...props} />} />;
<Tooltip.Trigger render={(props) => <input {...props} />} />;
