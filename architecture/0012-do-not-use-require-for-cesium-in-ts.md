# 12. Using `imports` instead of `require` + type casting statements

Date: 2024-09-28

## Status

Proposed

## Context

A decision was made in [0002-require-instead-of-import](./0002-require-instead-of-import.md) to use non-exported terriajs-cesium features using `require` + type casting statements due to inability to augment namespace and enum imports.

Recently we found a new way to augment terriajs-cesium typescript definition in case of enums and namespaces. When we directly augment `terriajs-module` typescript will properly augment the namespaces and enums can be augmented as namespaces making everything works as should on type level.

```ts
declare module terriajs-cesium {
  namespace FeatureDetection {
    function isChrome(): boolean;
    function isEdge(): boolean;
    function isInternetExplorer(): boolean;
    function isFirefox(): boolean;
    function internetExplorerVersion(): number[];
    function chromeVersion(): number[];
  }

  namespace Axis {
    function fromName(name: string): number;
  }
}
```

## Decission

Augment `terriajs-cesium` type definition
