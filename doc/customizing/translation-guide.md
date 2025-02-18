# TerriaJS translation guide

This document describes how to work with languages and translation in the TerriaJS and TerriaMap.

## Introduction

### Technology

For the translations TerriaJS uses [react-i18next](https://react.i18next.com/) technology, react implementation of famous [i18next](https://i18next.com) ecosystem.
If you are an advanced user or expert, we recommend reading the short and concise react-i18next documentation.

The following i18next plugins are used:

- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector) to detect the browser language, use the localStorage and react to URL query
- [i18next-http-backend](https://github.com/i18next/i18next-http-backend) to enable loading translations from editable language files

### Languages

Currently, the only available language is English, and it is configured as the default fallback language. Default fallback language can be changed in the [`config.json`] file.

**List of available languages**

| Abbreviation | Language |
| ------------ | -------- |
| en           | english  |

### Configuration

Language configuration is done within [`config.json`]. See the [config.json documentation](../customizing/client-side-config.md#LanguageConfiguration) for details on configuration.

## Language files

Language files are translation core. To add an additional language, a separate language file is needed for it. Translations can be provided using two files:

1. translation
2. languageOverrides
3. TinyMCE translations

### Translation language file - `translation.json`

The translation language file contains all translations used throughout the TerriaJS. This file is located in TerriaJS source code, and changes to it require a rebuild of the application. A namespace for this translation file is `translation`.

### Language overrides language file - `languageOverrides.json`

The languageOverrides language file is used to override the translation language file's translations without rebuilding the application and specifying the additional translations needed. This file is located in `/wwwroot/languages/{abbreviation}/languageOverrides.json` inside the root folder of TerriaMap (where the abbreviation is a short name of the language specified in the config). A namespace for this translation file is `languageOverrides`.

Note the base URL to overrides language files can be changed by setting `LanguageConfiguration.overridesBaseUrl`. See [config.json documentation](../customizing/client-side-config.md#LanguageConfiguration)

### TinyMCE translations

The TinyMCE translations is used to internationalize story editor which uses external library with its own internationalization support. Those files are located at `wwwroot/languages/tinymce/{abbreviation}.js` inside the root folder of TerriaMap (where the abbreviation is a short name of the language specified in the config and it should be the same under language is registered in tinymce `tinymce.addI18n("{abbreviation}",...`).

## Best practice

This section describes how to use i18next to provide a translation of TerriaJS.

### Translation of configurable elements

To translate configurable elements, the value itself must be formatted correctly (it is called a translation key). The formatted value must then be added to the translation files with the corresponding translation. If the part of the config.json is considered for translations by the TerriaJS, the translation will take place. Elements that are available for translation are `helpContent`, and `helpContentTerms`.
The translation key must be prefixed with `"translate#"`, so the structure of the key is `translate#[path.to.key]`, resulting in e.g. `translate#help.gettingstarted.content`

**Translation file**

```json
{
  "help": {
    "gettingstarted": {
      "title": "Getting started with the map",
      "content": "",
      "video": "https://...",
      "image": "https://..."
    }
  }
}
```

**Translateable content**

```json
"helpContent": [
  {
    "title": "translate#help.gettingstarted.title",
    "itemName": "gettingstarted",
    "paneMode": "videoAndContent",
    "markdownText": "translate#help.gettingstarted.content",
    "icon": "video",
    "videoUrl": "translate#help.gettingstarted.video",
    "placeholderImage": "translate#help.gettingstarted.image"
  }
]
```

### Overriding translation

To override the translation of an already translated element you need to override its translation in the language overrides language file. This is done by specifying the new translation for its key.

**Example**
Button MapSetting has a name specified using key `settingPanel.btnText`:

```json5
"settingPanel": {
  "btnText": "Map Settings",
  ...
}
```

Defining the following in the language overrides language file will override the name of the map settings button and it will be named _Map Configuration_:

```json5
"settingPanel": {
  "btnText": "Map Configuration"
}
```
