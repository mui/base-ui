import * as React from 'react';
import { Separator } from '@base-ui/react';
import './Separator.css';

export const Horizontal = () => (
  <div className="VerticalContainer">
    <span className="Link">Section one</span>
    <Separator orientation="horizontal" className="SeparatorHorizontal" />
    <span className="Link">Section two</span>
  </div>
);

export const Vertical = () => (
  <div className="Container">
    <a href="#" className="Link">
      Home
    </a>
    <a href="#" className="Link">
      Pricing
    </a>
    <a href="#" className="Link">
      Blog
    </a>
    <a href="#" className="Link">
      Support
    </a>

    <Separator orientation="vertical" className="Separator" />

    <a href="#" className="Link">
      Log in
    </a>
    <a href="#" className="Link">
      Sign up
    </a>
  </div>
);
