---
productId: base-ui
title: React Textarea component
components: Textarea, TextareaAutosize
githubLabel: 'component: TextareaAutosize'
---

# Textarea

<p class="description">The Textarea component gives you a textarea HTML element that automatically adjusts its height to match the length of the content within.</p>

{{"component": "modules/components/ComponentLinkHeader.js", "design": false}}

{{"component": "modules/components/ComponentPageTabs.js"}}

## Introduction

Textarea is a component that replaces the native `<textarea>` HTML.

The height of the component automatically adjusts as a response to keyboard inputs and window resizing events.

{{"demo": "TextareaIntroduction", "defaultCodeOpen": false, "bg": "gradient"}}

## Component

```jsx
import { Textarea } from '@mui/base/Textarea';
```

Textarea behaves similarly to the native HTML`<textarea>`.
By default, an empty Textarea component renders as a single row, as shown in the following demo:

{{"demo": "UnstyledTextarea", "defaultCodeOpen": false}}

## Customization

### Minimum height

Use the `minRows` prop to define the minimum height of the component:

{{"demo": "MinHeightTextarea.js"}}

### Maximum height

Use the `maxRows` prop to define the maximum height of the component:

{{"demo": "MaxHeightTextarea.js"}}
