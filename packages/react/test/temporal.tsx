import * as React from 'react';
import { TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { TemporalAdapter } from '@base-ui-components/react/models';
import {
  createRenderer,
  CreateRendererOptions,
  MuiRenderResult,
  RenderOptions,
} from '@mui/internal-test-utils/createRenderer';

/**
 * Returns a function to render a temporal component, wrapped with TemporalAdapterProvider.
 */
export function createTemporalRenderer(
  parameters: createTemporalRenderer.Parameters = {},
): createTemporalRenderer.ReturnValue {
  const {
    adapter = new TemporalAdapterLuxon(),
    clockConfig,
    ...createRendererOptions
  } = parameters;

  const { render: clientRender } = createRenderer({
    ...createRendererOptions,
  });
  beforeEach(() => {
    if (clockConfig) {
      vi.setSystemTime(clockConfig);
    }
  });
  afterEach(() => {
    if (clockConfig) {
      vi.useRealTimers();
    }
  });

  function Wrapper({ children }: { children?: React.ReactNode }) {
    return <TemporalAdapterProvider adapter={adapter}>{children}</TemporalAdapterProvider>;
  }

  return {
    render(element, options) {
      return clientRender(element, { ...options, wrapper: Wrapper });
    },
    adapter,
  };
}

export namespace createTemporalRenderer {
  export interface Parameters extends Omit<CreateRendererOptions, 'clock' | 'clockOptions'> {
    /**
     * Adapter to use for the tests.
     * @default new TemporalAdapterLuxon()
     */
    adapter?: TemporalAdapter;
  }

  export interface ReturnValue {
    render(
      node: React.ReactElement<DataAttributes>,
      options?: Omit<RenderOptions, 'wrapper'>,
    ): MuiRenderResult;
    adapter: TemporalAdapter;
  }
}

interface DataAttributes {
  [key: `data-${string}`]: string;
}
