# Quickstart

<p class="description">Get started with Base UI, a library of headless ("unstyled") React UI components and low-level hooks.</p>

:::info
If you're using Next.js 13.4 or later, check out the [Next.js App Router guide](/base-ui/guides/next-js-app-router/).
:::

## Installation

`@base_ui/react` is completely standalone – run one of the following commands to add Base UI to your React project:

<codeblock storageKey="package-manager">

```bash npm
npm install @base_ui/react
```

```bash yarn
yarn add @base_ui/react
```

```bash pnpm
pnpm add @base_ui/react
```

</codeblock>

### Peer dependencies

<!-- #react-peer-version -->

Please note that [react](https://www.npmjs.com/package/react) and [react-dom](https://www.npmjs.com/package/react-dom) are peer dependencies, meaning you should ensure they are installed before installing Base UI.

```json
"peerDependencies": {
  "react": "^17.0.0 || ^18.0.0",
  "react-dom": "^17.0.0 || ^18.0.0"
},
```
