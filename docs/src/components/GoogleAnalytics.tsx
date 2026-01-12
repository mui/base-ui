'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { DemoVariantSelectorContext } from './Demo/DemoVariantSelectorProvider';
import { PackageManagerSnippetContext } from '../blocks/PackageManagerSnippet/PackageManagerSnippetProvider';
import { GoogleAnalytics as BaseGoogleAnalytics } from '../blocks/GoogleAnalytics';
import { GoogleTagManager } from '../blocks/GoogleTagManager';

const PRODUCTION_GA =
  process.env.DEPLOY_ENV === 'production' || process.env.DEPLOY_ENV === 'staging';
const GOOGLE_ANALYTICS_ID_V4 = PRODUCTION_GA ? 'G-FE5XQBD0BH' : 'G-LSE9X5R2CN';

export function GoogleAnalytics() {
  const currentRoute = usePathname();
  const demoVariantSelectorContext = React.useContext(DemoVariantSelectorContext);
  const packageManagerSnippetContext = React.useContext(PackageManagerSnippetContext);

  return (
    <React.Fragment>
      <GoogleTagManager id={GOOGLE_ANALYTICS_ID_V4} />
      <BaseGoogleAnalytics
        productId="base-ui"
        productCategoryId="core"
        currentRoute={currentRoute}
        codeLanguage={demoVariantSelectorContext?.selectedLanguage ?? 'ts'}
        codeStylingVariant={demoVariantSelectorContext?.selectedVariant ?? null}
        packageManager={packageManagerSnippetContext?.packageManager ?? 'npm'}
        userLanguage="en"
      />
    </React.Fragment>
  );
}
