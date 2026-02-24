import * as React from 'react';
import { Locale } from 'date-fns/locale';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { TemporalAdapter } from '@base-ui/react/types';
import {
  createRenderer,
  CreateRendererOptions,
  MuiRenderResult,
  RenderOptions,
} from '@mui/internal-test-utils/createRenderer';
import { TemporalAdapterDateFns } from '../../react/src/temporal-adapter-date-fns/TemporalAdapterDateFns';

/**
 * Returns a function to render a temporal component, wrapped with LocalizationProvider.
 */
export function createTemporalRenderer(
  parameters: createTemporalRenderer.Parameters = {},
): createTemporalRenderer.ReturnValue {
  const { locale, clockConfig, ...createRendererOptions } = parameters;

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
    return <LocalizationProvider temporalLocale={locale}>{children}</LocalizationProvider>;
  }

  return {
    render(element, options) {
      return clientRender(element, { ...options, wrapper: Wrapper });
    },
    adapter: new TemporalAdapterDateFns({ locale }),
  };
}

export namespace createTemporalRenderer {
  export interface Parameters extends Omit<CreateRendererOptions, 'clock' | 'clockOptions'> {
    /**
     * The locale to use for the tests.
     * @default en-US
     */
    locale?: Locale;
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
