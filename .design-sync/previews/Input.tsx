import * as React from 'react';
import { Input } from '@base-ui/react';
import './Input.css';

export const Basic = () => (
  <label className="Label">
    Name
    <Input placeholder="e.g. Colm Tuite" className="Input" />
  </label>
);

export const WithValue = () => (
  <label className="Label">
    Email
    <Input type="email" defaultValue="colm@example.com" className="Input" />
  </label>
);

export const Disabled = () => (
  <label className="Label">
    Company
    <Input disabled defaultValue="Acme Inc." className="Input" />
  </label>
);
