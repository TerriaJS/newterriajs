# Development translation guide

Before reading this read the [user translation guide](../customizing/translation-guide.md), to get familiar with all possible translation options.

## Development

All the string visible to the user should be translated using the below explained mechanisms.

### useTranslation (hook)

It gets the `t` function and `i18n` instance inside your **functional components**.

**Usage**

```js
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t, i18n } = useTranslation();
  // or const [t, i18n] = useTranslation();

  return <p>{t('key')}</p> //returns corresponding translated text from translation files
}
```

See the [useTranslation documentation](https://react.i18next.com/latest/usetranslation-hook#what-it-does) for more details.

### withTranslation (HOC)

The `withTranslation` is a classic HOC (higher order component) and gets the `t` function and `i18n` instance inside your component via props.

**Usage**

```js
import { withTranslation } from 'react-i18next';

function MyComponent({ t, i18n }) {
  return <p>{t('my translated text')}</p>
}

export default withTranslation()(MyComponent);
```

See the [withTranslation documentation](https://react.i18next.com/latest/withtranslation-hoc#what-it-does) for more details.


### Trans component

While the Trans component gives you a lot of power by letting you interpolate or translate complex react elements - the truth is - in most cases you won't need it.

As long you have no react nodes you like to be integrated into a translated text (text formatting, like strong, i, ...) or adding some link component - you won't need it - most can be done by using the good old t function.

```js
import { Trans, useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation('myNamespace');

  return <Trans t={t} key="keyHelloWorld">Hello World</Trans>;
}

```

See the [withTranslation documentation](https://react.i18next.com/latest/trans-component) for more details.


### Interesting functions

#### Interpolation

Use dynamic values in translations.
```json
{
  "key": "{{what}} is {{how}}"
}
```
Sample
```js
i18next.t('key', { what: 'i18next', how: 'great' });
// -> "i18next is great"
```
See the [i18next interpolation documentation](https://www.i18next.com/translation-function/interpolation#basic) for further details.

#### Singular / Plural

i18next features automatic recognition of singular and plural forms.
> The variable name must be `count`!

**Keys**

```json
{
  "key": "item",
  "key_plural": "items",
  "keyWithCount": "{{count}} item",
  "keyWithCount_plural": "{{count}} items"
}
```

**Example**

```js
i18next.t('key', {count: 0}); // -> "items"
i18next.t('key', {count: 1}); // -> "item"
i18next.t('key', {count: 5}); // -> "items"
i18next.t('key', {count: 100}); // -> "items"
i18next.t('keyWithCount', {count: 0}); // -> "0 items"
i18next.t('keyWithCount', {count: 1}); // -> "1 item"
i18next.t('keyWithCount', {count: 5}); // -> "5 items"
i18next.t('keyWithCount', {count: 100}); // -> "100 items"
```

See the [i18next singular-plural documentation](https://www.i18next.com/translation-function/plurals#singular-plural) for more details.

#### Nesting

Nesting allows you to reference other keys in a translation.

**Keys**

```json
{
  "nesting1": "1 $t(nesting2)",
  "nesting2": "2 $t(nesting3)",
  "nesting3": "3",
}
```

**Example**

```js
i18next.t('nesting1'); // -> "1 2 3"
```

See the [i18next nesting documentation](https://www.i18next.com/translation-function/nesting#basic) for more details.

#### Context

By providing a context you can differ translations.

**Keys**

```json
{
  "friend": "A friend",
  "friend_male": "A boyfriend",
  "friend_female": "A girlfriend"
}
```

**Example**

```js
  i18next.t('friend'); // -> "A friend"
  i18next.t('friend', { context: 'male' }); // -> "A boyfriend"
  i18next.t('friend', { context: 'female' }); // -> "A girlfriend"
```
See the [react-i18next context documentation](https://www.i18next.com/translation-function/context) for more details.


## Future work

* Support internationalization of catalog content.