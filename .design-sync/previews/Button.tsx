import * as React from 'react';
import { Button } from '@base-ui/react';
import './Button.css';

export const Basic = () => <Button className="Button">Submit</Button>;

export const Disabled = () => (
  <Button className="Button" disabled>
    Submit
  </Button>
);
