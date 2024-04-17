import * as React from 'react';
import Divider from '@mui/material/Divider';
import Head from 'docs-base/src/modules/components/Head';
import BrandingCssVarsProvider from 'docs-base/src/BrandingCssVarsProvider';
import AppHeader from 'docs-base/src/layouts/AppHeader';
import AppFooter from 'docs-base/src/layouts/AppFooter';
import AppHeaderBanner from 'docs/src/components/banner/AppHeaderBanner';
import NotFoundHero from 'docs-base/src/components/NotFoundHero';

export default function Custom404() {
  return (
    <BrandingCssVarsProvider>
      <Head title="404: This page could not be found - MUI" description="" />
      <AppHeaderBanner />
      <AppHeader />
      <main id="main-content">
        <NotFoundHero />
        <Divider />
      </main>
      <AppFooter />
    </BrandingCssVarsProvider>
  );
}
