import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocsV2';
import AppFrame from 'docs/src/modules/components/AppFrame';
import * as pageProps from 'docs-base/data/base/components/slider/slider.md?@mui/markdown';
import mapApiPageTranslations from 'docs/src/modules/utils/mapApiPageTranslations';
import SliderApiJsonPageContent from '../../api/slider.json';
import SliderOutputApiJsonPageContent from '../../api/slider-output.json';
import SliderRootApiJsonPageContent from '../../api/slider-root.json';
import SliderThumbApiJsonPageContent from '../../api/slider-thumb.json';
import SliderTrackApiJsonPageContent from '../../api/slider-track.json';
import useSliderApiJsonPageContent from '../../api/use-slider.json';
import useSliderOutputApiJsonPageContent from '../../api/use-slider-output.json';
import useSliderRootApiJsonPageContent from '../../api/use-slider-root.json';
import useSliderThumbApiJsonPageContent from '../../api/use-slider-thumb.json';
import useSliderTrackApiJsonPageContent from '../../api/use-slider-track.json';

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

  const SliderTrackApiReq = require.context(
    'docs-base/translations/api-docs/slider-track',
    false,
    /\.\/slider-track.*.json$/,
  );
  const SliderTrackApiDescriptions = mapApiPageTranslations(SliderTrackApiReq);

  const useSliderApiReq = require.context(
    'docs-base/translations/api-docs/use-slider',
    false,
    /\.\/use-slider.*.json$/,
  );
  const useSliderApiDescriptions = mapApiPageTranslations(useSliderApiReq);

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

  const useSliderTrackApiReq = require.context(
    'docs-base/translations/api-docs/use-slider-track',
    false,
    /\.\/use-slider-track.*.json$/,
  );
  const useSliderTrackApiDescriptions = mapApiPageTranslations(useSliderTrackApiReq);

  return {
    props: {
      componentsApiDescriptions: {
        Slider: SliderApiDescriptions,
        SliderOutput: SliderOutputApiDescriptions,
        SliderRoot: SliderRootApiDescriptions,
        SliderThumb: SliderThumbApiDescriptions,
        SliderTrack: SliderTrackApiDescriptions,
      },
      componentsApiPageContents: {
        Slider: SliderApiJsonPageContent,
        SliderOutput: SliderOutputApiJsonPageContent,
        SliderRoot: SliderRootApiJsonPageContent,
        SliderThumb: SliderThumbApiJsonPageContent,
        SliderTrack: SliderTrackApiJsonPageContent,
      },
      hooksApiDescriptions: {
        useSlider: useSliderApiDescriptions,
        useSliderOutput: useSliderOutputApiDescriptions,
        useSliderRoot: useSliderRootApiDescriptions,
        useSliderThumb: useSliderThumbApiDescriptions,
        useSliderTrack: useSliderTrackApiDescriptions,
      },
      hooksApiPageContents: {
        useSlider: useSliderApiJsonPageContent,
        useSliderOutput: useSliderOutputApiJsonPageContent,
        useSliderRoot: useSliderRootApiJsonPageContent,
        useSliderThumb: useSliderThumbApiJsonPageContent,
        useSliderTrack: useSliderTrackApiJsonPageContent,
      },
    },
  };
};
