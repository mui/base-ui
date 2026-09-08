import * as React from 'react';
import { Avatar } from '@base-ui/react';
import './Avatar.css';

export const Basic = () => (
  <div className="Row">
    <Avatar.Root className="Root">
      <Avatar.Image
        src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23c98ee0'/%3E%3Ccircle cx='32' cy='24' r='12' fill='%23ffffff'/%3E%3Cellipse cx='32' cy='56' rx='20' ry='16' fill='%23ffffff'/%3E%3C/svg%3E"
        width="48"
        height="48"
        className="Image"
      />
      <Avatar.Fallback className="Fallback">LT</Avatar.Fallback>
    </Avatar.Root>
    <Avatar.Root className="Root">LT</Avatar.Root>
  </div>
);

export const Fallback = () => (
  <Avatar.Root className="Root">
    <Avatar.Image src="data:," className="Image" />
    <Avatar.Fallback className="Fallback">JD</Avatar.Fallback>
  </Avatar.Root>
);
