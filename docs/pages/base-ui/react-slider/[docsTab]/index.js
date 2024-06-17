import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/slider/slider.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import SliderApiJsonPageContent from '../../api/slider.json';
import SliderControlApiJsonPageContent from '../../api/slider-control.json';
import SliderIndicatorApiJsonPageContent from '../../api/slider-indicator.json';
import SliderOutputApiJsonPageContent from '../../api/slider-output.json';
import SliderRootApiJsonPageContent from '../../api/slider-root.json';
import SliderThumbApiJsonPageContent from '../../api/slider-thumb.json';
import useSliderApiJsonPageContent from '../../api/use-slider.json';
import useSliderControlApiJsonPageContent from '../../api/use-slider-control.json';
import useSliderIndicatorApiJsonPageContent from '../../api/use-slider-indicator.json';
import useSliderOutputApiJsonPageContent from '../../api/use-slider-output.json';
import useSliderRootApiJsonPageContent from '../../api/use-slider-root.json';
import useSliderThumbApiJsonPageContent from '../../api/use-slider-thumb.json';

export default function Page(props) {
  const { userLanguage, ...other } = props;
  return <MarkdownDocs {...pageProps} {...other} />;
}

Page.getLayout = (page) => {
  return <AppFrame>{page}</AppFrame>;
};

export const getStaticPaths = () => {
  return {
    paths: [{ params: { docsTab: 'components-api' } }, { params: { docsTab: 'hooks-api' } }],
    fallback: false, // can also be true or 'blocking'
  };
};

export const getStaticProps = () => {
  const SliderApiReq = require.context(
    'docs-base/translations/api-docs/slider',
    false,
    /\.\/slider.*.json$/,
  );
  const SliderApiDescriptions = mapApiPageTranslations(SliderApiReq);

  const SliderControlApiReq = require.context(
    'docs-base/translations/api-docs/slider-control',
    false,
    /\.\/slider-control.*.json$/,
  );
  const SliderControlApiDescriptions = mapApiPageTranslations(SliderControlApiReq);

  const SliderIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/slider-indicator',
    false,
    /\.\/slider-indicator.*.json$/,
  );
  const SliderIndicatorApiDescriptions = mapApiPageTranslations(SliderIndicatorApiReq);

  const SliderOutputApiReq = require.context(
    'docs-base/translations/api-docs/slider-output',
    false,
    /\.\/slider-output.*.json$/,
  );
  const SliderOutputApiDescriptions = mapApiPageTranslations(SliderOutputApiReq);

  const SliderRootApiReq = require.context(
    'docs-base/translations/api-docs/slider-root',
    false,
    /\.\/slider-root.*.json$/,
  );
  const SliderRootApiDescriptions = mapApiPageTranslations(SliderRootApiReq);

  const SliderThumbApiReq = require.context(
    'docs-base/translations/api-docs/slider-thumb',
    false,
    /\.\/slider-thumb.*.json$/,
  );
  const SliderThumbApiDescriptions = mapApiPageTranslations(SliderThumbApiReq);

  const useSliderApiReq = require.context(
    'docs-base/translations/api-docs/use-slider',
    false,
    /\.\/use-slider.*.json$/,
  );
  const useSliderApiDescriptions = mapApiPageTranslations(useSliderApiReq);

  const useSliderControlApiReq = require.context(
    'docs-base/translations/api-docs/use-slider-control',
    false,
    /\.\/use-slider-control.*.json$/,
  );
  const useSliderControlApiDescriptions = mapApiPageTranslations(useSliderControlApiReq);

  const useSliderIndicatorApiReq = require.context(
    'docs-base/translations/api-docs/use-slider-indicator',
    false,
    /\.\/use-slider-indicator.*.json$/,
  );
  const useSliderIndicatorApiDescriptions = mapApiPageTranslations(useSliderIndicatorApiReq);

  const useSliderOutputApiReq = require.context(
    'docs-base/translations/api-docs/use-slider-output',
    false,
    /\.\/use-slider-output.*.json$/,
  );
  const useSliderOutputApiDescriptions = mapApiPageTranslations(useSliderOutputApiReq);

  const useSliderRootApiReq = require.context(
    'docs-base/translations/api-docs/use-slider-root',
    false,
    /\.\/use-slider-root.*.json$/,
  );
  const useSliderRootApiDescriptions = mapApiPageTranslations(useSliderRootApiReq);

  const useSliderThumbApiReq = require.context(
    'docs-base/translations/api-docs/use-slider-thumb',
    false,
    /\.\/use-slider-thumb.*.json$/,
  );
  const useSliderThumbApiDescriptions = mapApiPageTranslations(useSliderThumbApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        Slider: SliderApiDescriptions,
        SliderControl: SliderControlApiDescriptions,
        SliderIndicator: SliderIndicatorApiDescriptions,
        SliderOutput: SliderOutputApiDescriptions,
        SliderRoot: SliderRootApiDescriptions,
        SliderThumb: SliderThumbApiDescriptions,
      },
      componentsApiPageContents: {
        Slider: SliderApiJsonPageContent,
        SliderControl: SliderControlApiJsonPageContent,
        SliderIndicator: SliderIndicatorApiJsonPageContent,
        SliderOutput: SliderOutputApiJsonPageContent,
        SliderRoot: SliderRootApiJsonPageContent,
        SliderThumb: SliderThumbApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useSlider: useSliderApiDescriptions,
        useSliderControl: useSliderControlApiDescriptions,
        useSliderIndicator: useSliderIndicatorApiDescriptions,
        useSliderOutput: useSliderOutputApiDescriptions,
        useSliderRoot: useSliderRootApiDescriptions,
        useSliderThumb: useSliderThumbApiDescriptions,
      },
      hooksApiPageContents: {
        useSlider: useSliderApiJsonPageContent,
        useSliderControl: useSliderControlApiJsonPageContent,
        useSliderIndicator: useSliderIndicatorApiJsonPageContent,
        useSliderOutput: useSliderOutputApiJsonPageContent,
        useSliderRoot: useSliderRootApiJsonPageContent,
        useSliderThumb: useSliderThumbApiJsonPageContent,
      },
    },
  };
};
