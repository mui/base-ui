'use client';
import * as React from 'react';
import { Separator } from '@base-ui-components/react/separator';
import { styled } from '@mui/system';

export default function SeparatorIntroduction() {
  return (
    <div>
      <Link href=".">Previous</Link>
      <StyledSeparator />
      <Link href=".">Next</Link>
    </div>
  );
}

const StyledSeparator = styled(Separator.Root)`
  display: inline-block;
  height: 16px;
  width: 1px;
  background-color: #ccc;
  margin: 0 12px;
  vertical-align: middle;
`;

const Link = styled('a')`
  all: unset;
  position: relative;
  display: inline-block;
  padding: 8px;
  background: 1px solid #ddd;
  cursor: pointer;
`;
