import { Select } from '@base-ui/react/select';
import { ignoreActWarnings } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Select.ItemIndicator />', () => {
  beforeEach(() => {
    if (!isJSDOM) {
      ignoreActWarnings();
    }
  });

  const { render } = createRenderer();

  describeConformance(<Select.ItemIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Item>{node}</Select.Item>
          </Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
