/* eslint-disable react/no-danger */
import * as React from 'react';
import PropTypes from 'prop-types';
import kebabCase from 'lodash/kebabCase';
import { useRouter } from 'next/router';
import { exactProp } from '@mui/utils';
import { useTranslate, useUserLanguage } from '@mui/docs/i18n';
import HighlightedCode from 'docs/src/modules/components/HighlightedCode';
import MarkdownElement from 'docs/src/modules/components/MarkdownElement';
import PropertiesSection from 'docs/src/modules/components/ApiPage/sections/PropertiesSection';
import ClassesSection from 'docs/src/modules/components/ApiPage/sections/ClassesSection';
import SlotsSection from 'docs/src/modules/components/ApiPage/sections/SlotsSection';
import { DEFAULT_API_LAYOUT_STORAGE_KEYS } from 'docs/src/modules/components/ApiPage/sections/ToggleDisplayOption';

function getTranslatedHeader(t, header, text) {
  const translations = {
    demos: t('api-docs.demos'),
    import: t('api-docs.import'),
    props: t('api-docs.props'),
    'theme-default-props': t('api-docs.themeDefaultProps'),
    inheritance: t('api-docs.inheritance'),
    slots: t('api-docs.slots'),
    classes: t('api-docs.classes'),
    css: t('api-docs.css'),
  };

  return translations[header] || translations[text] || text || header;
}

function Heading(props) {
  const { hash, text, level: Level = 'h2' } = props;
  const t = useTranslate();

  return (
    <Level id={hash}>
      {getTranslatedHeader(t, hash, text)}
      <a aria-labelledby={hash} className="anchor-link" href={`#${hash}`} tabIndex={-1}>
        <svg>
          <use xlinkHref="#anchor-link-icon" />
        </svg>
      </a>
    </Level>
  );
}

Heading.propTypes = {
  hash: PropTypes.string.isRequired,
  level: PropTypes.string,
  text: PropTypes.string,
};

export default function ComponentsApiContent(props) {
  const {
    descriptions,
    pageContents,
    defaultLayout = 'table',
    layoutStorageKey = DEFAULT_API_LAYOUT_STORAGE_KEYS,
  } = props;
  const t = useTranslate();
  const userLanguage = useUserLanguage();
  const router = useRouter();

  // There are legacy links where the the components had the Unstyled suffix
  // This effects makes sure that the anchors will be correct wtih the renames
  React.useEffect(() => {
    const anchor = router.asPath.indexOf('#') >= 0 ? router.asPath.split('#')[1] : null;
    if (router.isReady && anchor && anchor.indexOf('-unstyled') >= 0) {
      router.replace(
        {
          hash: `${anchor.replace('-unstyled', '')}`,
        },
        null,
        {
          shallow: true,
        },
      );
    }
  }, [router]);

  const components = Object.keys(pageContents);

  return components.map((key) => {
    const pageContent = pageContents[key];
    const {
      cssComponent,
      filename,
      forwardsRefTo,
      inheritance,
      name: componentName,
      props: componentProps,
      spread,
      slots: componentSlots,
      classes,
      imports,
    } = pageContent;

    const componentClasses = [...classes].sort((c1, c2) =>
      c1.className.localeCompare(c2.className),
    );

    const { classDescriptions, propDescriptions, slotDescriptions } =
      descriptions[key][userLanguage];

    const isJoyComponent = filename.includes('mui-joy');
    const isBaseComponent = filename.includes('mui-base');
    const defaultPropsLink = isJoyComponent
      ? '/joy-ui/customization/themed-components/#theme-default-props'
      : '/material-ui/customization/theme-components/#theme-default-props';
    let slotGuideLink = '';
    if (isJoyComponent) {
      slotGuideLink = '/joy-ui/customization/overriding-component-structure/';
    } else if (isBaseComponent) {
      slotGuideLink = '/base-ui/guides/overriding-component-structure/';
    }

    // The `ref` is forwarded to the root element.
    let refHint = t('api-docs.refRootElement');
    if (forwardsRefTo == null) {
      // The component cannot hold a ref.
      refHint = t('api-docs.refNotHeld');
    }

    let spreadHint = '';
    if (spread) {
      // Any other props supplied will be provided to the root element ({{spreadHintElement}}).
      spreadHint = t('api-docs.spreadHint').replace(
        /{{spreadHintElement}}/,
        inheritance
          ? `<a href="${inheritance.pathname}">${inheritance.component}</a>`
          : t('api-docs.nativeElement'),
      );
    }

    let inheritanceSuffix = '';
    if (inheritance && inheritance.component === 'Transition') {
      inheritanceSuffix = t('api-docs.inheritanceSuffixTransition');
    }

    const componentNameKebabCase = kebabCase(componentName);

    const importInstructions = imports.join(`
// ${t('or')}
`);

    return (
      <React.Fragment key={`component-api-${key}`}>
        <MarkdownElement>
          <Heading hash={componentNameKebabCase} text={`${componentName} API`} />
          <Heading text="import" hash={`${componentNameKebabCase}-import`} level="h3" />
          <HighlightedCode code={importInstructions} language="jsx" />
          <span dangerouslySetInnerHTML={{ __html: t('api-docs.importDifference') }} />
          <PropertiesSection
            properties={componentProps}
            propertiesDescriptions={propDescriptions}
            componentName={componentName}
            spreadHint={spreadHint}
            level="h3"
            titleHash={`${componentNameKebabCase}-props`}
            defaultLayout={defaultLayout}
            layoutStorageKey={layoutStorageKey.props}
          />
          <br />
          {cssComponent && (
            <React.Fragment>
              <span
                dangerouslySetInnerHTML={{
                  __html: t('api-docs.cssComponent').replace(/{{name}}/, pageContent.name),
                }}
              />
              <br />
              <br />
            </React.Fragment>
          )}
          <div
            className="MuiCallout-root MuiCallout-info"
            dangerouslySetInnerHTML={{ __html: refHint }}
            style={{
              alignItems: 'baseline',
              gap: '4px',
              marginTop: 0,
            }}
          />
          {inheritance && (
            <React.Fragment>
              <Heading
                text="inheritance"
                hash={`${componentNameKebabCase}-inheritance`}
                level="h3"
              />
              <span
                dangerouslySetInnerHTML={{
                  __html: t('api-docs.inheritanceDescription')
                    .replace(/{{component}}/, inheritance.component)
                    .replace(/{{pathname}}/, inheritance.pathname)
                    .replace(/{{suffix}}/, inheritanceSuffix)
                    .replace(/{{name}}/, pageContent.name),
                }}
              />
            </React.Fragment>
          )}
          {pageContent.themeDefaultProps && (
            <React.Fragment>
              <Heading
                text="theme-default-props"
                hash={`${componentName}-theme-default-props`}
                level="h4"
              />
              <span
                dangerouslySetInnerHTML={{
                  __html: t('api-docs.themeDefaultPropsDescription')
                    .replace(/{{muiName}}/, pageContent.muiName)
                    .replace(/{{defaultPropsLink}}/, defaultPropsLink),
                }}
              />
            </React.Fragment>
          )}
          <SlotsSection
            componentSlots={componentSlots}
            slotDescriptions={slotDescriptions}
            componentName={componentName}
            titleHash={`${componentNameKebabCase}-slots`}
            level="h3"
            spreadHint={
              slotGuideLink &&
              t('api-docs.slotDescription').replace(/{{slotGuideLink}}/, slotGuideLink)
            }
            defaultLayout={defaultLayout}
            layoutStorageKey={layoutStorageKey.slots}
          />
          <ClassesSection
            componentClasses={componentClasses}
            componentName={pageContent.name}
            classDescriptions={classDescriptions}
            spreadHint={t('api-docs.classesDescription')}
            titleHash={`${componentNameKebabCase}-classes`}
            level="h3"
            defaultLayout={defaultLayout}
            layoutStorageKey={layoutStorageKey.classes}
          />
        </MarkdownElement>
        <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <symbol id="anchor-link-icon" viewBox="0 0 16 16">
            <path d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z" />
          </symbol>
        </svg>
      </React.Fragment>
    );
  });
}

ComponentsApiContent.propTypes = {
  defaultLayout: PropTypes.oneOf(['collapsed', 'expanded', 'table']),
  descriptions: PropTypes.object.isRequired,
  layoutStorageKey: PropTypes.shape({
    classes: PropTypes.string,
    props: PropTypes.string,
    slots: PropTypes.string,
  }),
  pageContents: PropTypes.object.isRequired,
};

if (process.env.NODE_ENV !== 'production') {
  ComponentsApiContent.propTypes = exactProp(ComponentsApiContent.propTypes);
}
