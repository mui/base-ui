'use client';
import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui-components/react/input';
import { styled } from '@mui/system';

export default function InputIntroduction() {
  return <Input />;
}

const Input = styled(InputPrimitive)`
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  font-size: 16px;
  width: 200px;

  &:focus {
    outline: 0;
    border-color: #0070f3;
  }
`;
