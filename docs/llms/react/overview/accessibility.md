---
title: Accessibility
subtitle: Learn how to make the most of Base UI's accessibility features and guidelines.
description: Learn how to make the most of Base UI's accessibility features and guidelines.
---
# Accessibility

Learn how to make the most of Base UI's accessibility features and guidelines.

Accessibility is a top priority for Base UI.
Base UI components handle many complex accessibility details including ARIA attributes, role attributes, pointer interactions, keyboard navigation, and focus management.
The goal is to provide an accessible user experience out of the box, with intuitive APIs for configuration.

This page highlights some of the key accessibility features of Base UI, as well as some ways you will need to augment the library, in order to ensure that your application is accessible to everyone.

## Keyboard navigation

Base UI components adhere to the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) to provide basic keyboard accessibility out of the box.
This is critical for users who have difficulty using a pointer device, but it's also important for users who prefer navigating with a keyboard or other input mode.

Many components provide support for arrow keys, alphanumeric keys, , , , and .

## Focus management

Base UI components manage focus automatically following a user interaction.
Additionally, some components provide props like `initialFocus` and `finalFocus`, to configure focus management.

While Base UI components manage focus, it's the developer's responsibility to visually indicate focus.
This is typically handled by styling the `:focus` or `:focus-visible` CSS pseudo-classes.
WCAG provides [guidelines on focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance).

## Color contrast

When styling elements, it's important to meet the minimum requirements for color contrast between each foreground element and its corresponding background element. Unless your application has strict requirements around compliance with current standards, consider adhering to [APCA](https://www.myndex.com/APCA/), which is slated to become the new standard in WCAG 3.

## Accessible labels

Base UI provides components like Form, Input, Field, Fieldset to automatically associate form controls. Additionally, you can use the native HTML `<label>` element to provide context to corresponding inputs.

Most applications will present custom controls that require accessible names provided by markup features such as `alt`, `aria-label` or `aria-labelledby`.
WAI-ARIA provides guidelines on [providing accessible names](https://www.w3.org/TR/wai-aria-1.2/#namecalculation) to custom controls.

## Testing

Base UI components are tested on a broad spectrum of browsers, devices, platforms, screen readers, and environments.
