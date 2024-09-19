'use client';
import * as React from 'react';
import { styled } from '@mui/system';
import { NoSsr } from '@base_ui/react/NoSsr';

export default function SimpleNoSsr() {
  return (
    <Demo>
      <Panel>Server and Client</Panel>
      <NoSsr>
        <Panel>Client only</Panel>
      </NoSsr>
    </Demo>
  );
}

const Demo = styled('div')`
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: auto;
  padding: 8px;
`;

const Panel = styled('div')`
  padding: var(--space-2);
  margin-bottom: var(--space-1);
  background-color: var(--gray-100);
`;
