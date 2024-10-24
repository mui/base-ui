'use client';
import * as React from 'react';
import { TextArea as TextAreaPrimitive } from '@base_ui/react/TextArea';
import { styled } from '@mui/system';

export default function TextAreaIntroduction() {
  return <TextArea />;
}

const TextArea = styled(TextAreaPrimitive)`
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  font-size: 16px;
  width: 200px;
  field-sizing: content;

  &:focus {
    outline: 0;
    border-color: #0070f3;
  }
`;
