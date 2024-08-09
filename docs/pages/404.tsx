import * as React from 'react';
import { MasterLayout } from 'docs-base/src/layout/MasterLayout';

export default function Custom404() {
  return <h1>Page not found</h1>;
}

Custom404.getLayout = function getLayout(page: React.ReactNode) {
  return <MasterLayout>{page}</MasterLayout>;
};
