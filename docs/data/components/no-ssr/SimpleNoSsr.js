'use client';

import * as React from 'react';
import { styled } from '@mui/system';
import { NoSsr } from '@base_ui/react/NoSsr';

export default function SimpleNoSsr() {
  return (
    <div>
      <Panel>Server and Client</Panel>
      <NoSsr>
        <Panel>Client only</Panel>
      </NoSsr>
    </div>
  );
}

const Panel = styled('div')`
  padding: 16px;
`;
