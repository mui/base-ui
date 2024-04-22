---
title: Overview
---

# Base UI - Overview

<p class="description">Base UI is a library of headless ("unstyled") React components and low-level hooks. You gain complete control over your app's CSS and accessibility features.</p>

## Introduction

Base UI is a library of unstyled React UI components and hooks.
These components were extracted from [Material UI](https://mui.com/material-ui/), and are now available as a standalone package.
They feature the same robust engineering but without implementing Material Design.

Base UI includes prebuilt components with production-ready functionality, along with low-level hooks for transferring that functionality to other components.

With Base UI, you can rapidly build on top of our foundational components using any styling solution you choose—no need to override any default style engine or theme.

:::info
Base UI is currently in alpha.

We're adding new components and features regularly, and you're welcome to contribute!

Look for the [open issues](https://github.com/mui/base-ui/issues) and [pull requests](https://github.com/mui/base-ui/pulls) in the `mui/base-ui` repository on GitHub to see what other community members are working on, and feel free to submit your own.
:::

## Advantages of Base UI

- **Ship faster:** Base UI gives you the foundational building blocks you need to assemble a sleek and sophisticated user interface in a fraction of the time that it would take to do it all from scratch.
- **You own the CSS:** unlike Material UI, which uses Emotion as a default style engine, Base UI has no built-in styling solution.
  This means you have complete control over your app's CSS.
- **Accessibility:** Base UI components are built with accessibility in mind.
  We do our best to make all components screen reader-friendly, and offer suggestions for optimizing accessibility throughout our documentation.

## Base UI vs. Material UI

Base UI features many of the same components as [Material UI](https://mui.com/material-ui/getting-started/), but without the Material Design implementation.

Base UI is not packaged with any default theme or built-in style engine.
This makes it a great choice if you need complete control over how your app's CSS is implemented.

You could think of Base UI as the "skeletal" or "headless" version of Material UI—in fact, future versions of Material UI will gradually adopt these components and hooks for their foundational structure.
