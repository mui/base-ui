'use client';
import * as React from 'react';
import { TextField as TextFieldPrimitive } from '@base_ui/react/TextField';
import { styled } from '@mui/system';

export default function TextFieldIntroduction() {
  return <TextField />;
}

const TextField = styled(TextFieldPrimitive)`
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
