import * as React from 'react';
import { MasterLayout } from 'docs-base/src/layout/MasterLayout';

export default function Index() {
  return (
    <div>
      <h1>Base UI</h1>
    </div>
  );
}

Index.getLayout = function getLayout(page: React.ReactNode) {
  return <MasterLayout>{page}</MasterLayout>;
};
