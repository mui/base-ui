# @babel-plugin-display-name

Forked from: https://github.com/zendesk/babel-plugin-react-displayname

## What does it do?

This plugin converts the following:

```tsx
const Linebreak = React.memo(() => {
  return <br />;
});

const Img = function () {
  return <img />;
};
```

into:

```tsx
const Linebreak = React.memo(function _Linebreak() {
  return <br />;
});
Linebreak.displayName = 'Linebreak';

const Img = function () {
  return <img />;
};
Img.displayName = 'Img';
```

## Options

### `allowedCallees`

`Object.<string, string[]>`, defaults to `{ "react": ["createContext"] }`

Enables generation of displayNames for certain called functions.

```json
{
  "plugins": [
    "@probablyup/babel-plugin-react-displayname",
    {
      "allowedCallees": {
        "react": ["createComponent"]
      }
    }
  ]
}
```
