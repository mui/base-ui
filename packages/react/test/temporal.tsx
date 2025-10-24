import * as React from 'react';
import { UnstableTemporalAdapterProvider as TemporalAdapterProvider } from '@base-ui-components/react/temporal-adapter-provider';
import { UnstableTemporalAdapterDateFns as TemporalAdapterDateFns } from '@base-ui-components/react/temporal-adapter-date-fns';
import { TemporalAdapter } from '@base-ui-components/react/types';
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
    adapter = new TemporalAdapterDateFns(),
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
     * @default new TemporalAdapterDateFns()
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
