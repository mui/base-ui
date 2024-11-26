'use client';
import * as React from 'react';
import { TextInput as TextInputPrimitive } from '@base-ui-components/react/text-input';
import { styled } from '@mui/system';

export default function TextFieldIntroduction() {
  return <TextInput />;
}

const TextInput = styled(TextInputPrimitive)`
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
