Change Log
==========

#### next release (8.1.1)

* Tsifyied and refactored `RegionProvider` and `RegionProviderList`, and re-enabled `loadRegionIDs`
* `TableColorMap` `minimumValue` and `maximumValue` will now take into account valid regions.
* `tableMixin.loadRegionProviderList()` is now called in `tableMixin.forceLoadMapItems()` instead of `mappableMixin.loadMapItems()`
* Add TableColumn and TableStyle `ready` computed property. Columns will only be rendered if `ready` is `true`. At the moment it is only used to wait until `loadRegionIDs` has finished.
* Moved region mapping `ImageryProvider` code to `lib/Table/createRegionMappedImageryProvider.ts`
* Fix `ChartPanel` import `Result` bug.
* Improve handling of featureInfoTemplate for composite catalog items.
* Fixed the layout of items in mobile navigation
* Fixed `withControlledVisibility` method to inherit `propTypes` of its wrapped component.
* Added `MinMaxLevelMixin` and `MinMaxLevelTraits` to handle defining min and max scale denominator for layers.
* Extracted function `scaleToDenominator` to core - for conversion of scale to zoom level.
* Share/start data conversion will now only occur if `version` property is `0.x.x`. Previously, it was `version` property is **not** `8.x.x`
* [The next improvement]

#### 8.1.0

- **Breaking changes:**
  * Overhaul of map navigation: items no longer added inside UserInterface using <Nav> jsx.

* New version of map navigation ([#5062](https://github.com/TerriaJS/terriajs/pull/5062))
  - It consists of 
    - a high level api `MapNavigationModel` for managing the navigation items, which is responsible for managing the state of navigation items. It is passing commands to invidual item controller.
    - a `MapNavigationItemController` that holds and control the state of navigation item. When new navigation item is created it should extend controller and provide the definition on how it state should be updated.
  - Terria exposes instance of navigation model to the world.
  - Converted all existing navigation items to utilise new navigation model, and registered them in terria navigation model (`registerMapNavigations.tsx`).
  - Resolved issue with some navigation items not being clickable on mobile due to overlap from others.
* Fixed a bug in Difference tool where difference image was showing with zero opacity in some situations.
* Fixed `CzmlCatalogItem` to react correctly to input data changes.
* Adjusted styling of x-axis labels in feature info panel to prevent its clipping.
* When expanding charts from the same catalog item, we now create a new item if the expanded chart has a different title from the previously expanded chart for the same item. This behavior matches the behavior in `v7`.
* Improve status message when feature info panel chart is loading
* Fix broken chart panel download button.
* Changed @vx/* dependencies to @visx/* which is the new home of the chart library
* The glyph style used for chart points can now be customized.
* Added `TerriaReference` item, useful for mounting a catalog tree from an external init file at any position in the current map's catalog tree.
* Changed @vx/* dependencies to @visx/* which is the new home of the chart library
* The glyph style used for chart points can now be customized.
* Chart tooltip and legend bar can now fit more legends gracefully.

#### 8.0.1

* Added `catalog-converter` support for v7 `#start` data.
* add french Help button translation
* Enable FeatureInfoSectionSpec tests
* Add `itemProperties` to `ArcGisMapServerCatalogGroupTraits` so that `ArcGisMapServerCatalogGroup` can override relevant traits of its layers.
* Add `feature` object to `FeatureInfoSection.getTemplateData`
* Add a way to replace text in feature info templates. See [Replace text](doc/connecting-to-data/customizing-data-appearance/feature-info-template.md) for details.
* Fixed unnecessary model reloads or recomputing of `mapItems` when switching between story scenes.
* Fixed story reset button.
* Moved help button to the top menu

#### 8.0.0

- **Breaking changes**:
  - Require `translate#` in front of translatable content id in `config.json` (i.e. `helpContent`).
  - `colorPalette` no longer supports a list of CSS colors (eg `rgb(0,0,255)-rgb(0,255,0)-rgb(255,0,0)`). Instead please use `binColors`.
  - Organise `Traits` folder into `Traits/Decorators` and `Traits/TraitsClasses`
  - Renamed all mixin instance type definitions to `XMixin.Instance`.
  - Basemaps are now defined as `baseMaps` object
    - list of available basemaps is defined in `baseMaps.init`. This list is combined with default base maps so it's possible to override defaults
    - definition of `initBaseMapId` and `initBaseMapName` are moved to `baseMaps.defaultBaseMapId` and `baseMaps.defaultBaseMapName`
    - `previewBaseMapId` is moved to `baseMaps.previewBaseMapId`
    - implemented `baseMaps.enabledBaseMaps` array of base map ids to define a list of baseMaps available to user
    - updated docs for `baseMaps`
  - `$color-splitter` and `theme.colorSplitter` has been replaced with `$color-secondary` and `theme.colorSecondary`
  - `canZoomTo` has bee replaced with `disableZoomTo` in `MappableTraits`
  - `showsInfo` has been replaced with `disableAboutData` in `CatalogMemberTraits`
  - `AsyncLoader` loadXXX methods now return `Result` with `errors` **they no longer throw errors** - if you need errors to be thrown you can use `(await loadXX).throwIfError()`.
  - Removed `openGroup()` - it is replaced by `viewState.viewCatalogMember`
  - Renamed `ReferenceMixin.is` to `ReferenceMixin.isMixedInto`

* Fixed a bug with numeric item search where it sometimes fails to return all matching values.
* Respect order of objects from lower strata in `objectArrayTrait`.
* Fix datetime button margin with scroll in workbench.
* Fix checkbox when click happen on svg icon. (#5550)
* Added progress indicator when loading item search tool.
* Add `nullColor` to `ConstantColorMap` - used when `colorColumn` is of type `region` to hide regions where rows don't exist.
* `TableStyles` will only be created for `text` columns if there are no columns of type `scalar`, `enum` or `region`.
* Moved `TableStyle.colorMap` into `TableColorMap`
* Replaced `colorbrewer.json` with `d3-scale-chromatic` - we now support d3 color scales (in addition to color brewer) -  see https://github.com/d3/d3-scale-chromatic
* Added `ContinuousColorMap` - it will now be used by default for `scalar` columns
  * To use `DiscreteColorMap` - you will need to set `numberOfBins` to something other than `0`.
* `TableColorMap` default color palette for `scalar` columns is not `Reds` instead of `RdYlOr`
* Legends for `scalar` columns will now calculate optimal `numberFormatOptions.maximumFractionDigits` and  `numberFormatOptions.minimumFractionDigits`
* Fix sharing user added data of type "Auto-detect".
* #5605 tidy up format string used in `MagdaReference`
* Fix wms feature info returning only one feature
* `WebMapServiceCatalogGroup` will now create layer auto-IDs using `Name` field to avoid ID clashes.
* Added `GroupMixin` `shareKey` generation for members - if the group has `shareKeys`.
* Organise `Traits` folder into `Traits/Decorators` and `Traits/TraitsClasses 
* Organise `Traits` folder into `Traits/Decorators` and `Traits/TraitsClasses`
* I18n-ify shadow options in 3DTiles and some strings in feature info panel.
* Fix `StyledIcon` css `display` clash
* Limit `SelectableDimension` options to 1000 values
* Added support for `SocrataCatalogGroup` and `SocrataMapViewCatalogGroup`
  * Notes on v7 to v8 Socrata integration:
    * Share links are not preserved
    * Added basic support for dataset resources
* Organise `Models` directory into multiple sub-directories (#5626)
  * New model related classes are moved to `Models/Definition`
  * Catalog related files are moved to `Models/Catalog`
    * ESRI, OWS, GTFS and CKAN related files are moved to their own sub-directories in `Models/Catalog/`
    * Other Catalog items related files are moved to `Models/Catalog/CatalogItems`
    * Other Catalog items related files are moved to `Models/Catalog/CatalogGroups`
    * Catalog functions related files are moved to `Models/Catalog/CatalogFunction`
  * Removed unused Models files
* Modified BadgeBar to be more tolerant to longer strings
* Added `MapboxMapCatalogItem`.
* Added `MapboxStyleCatalogItem`.
* Fix splitter thumb icon vertical position
* Renamed all mixin instance type definitions to `XMixin.Instance`.
* Clean up `ViewControl` colors
  * `$color-splitter` and `theme.colorSplitter` has been replaced with `$color-secondary` and `theme.colorSecondary`
* Clean up `SplitterTraits`
  * `SplitterTraits` is now included in `RasterLayerTraits`
  * Removed `supportsSplitter` variable
  * Added `disableSplitter` trait
* Clean up `canZoomTo`
  * Replaced with `disableZoomTo` in `MappableTraits`
* Clean up `showsInfo`
  * Replaced with `disableAboutData` in `CatalogMemberTraits`
* Add `TerriaErrorSeverity` enum, values can be `Error` or `Warning`.
  * Errors with severity `Error` are presented to the user. `Warning` will just be printed to console.
  * By default, errors will use `Error`
  * `TerriaErrorSeverity` will be copied through nested `TerriaErrors` on creation (eg if you call `TerriaError.from()` on a `Warning` then the parent error will also be `Warning`)
  * Loading models from share links or stories will use `Warning` if the model is **not in the workbench**, otherwise it will use `Error`.
* In `terriaErrorNotification` - show `error.message` (as well as `error.stack`) if `error.stack` is defined
* `AsyncLoader` now has an observable `result` property.
* `viewState.viewCatalogMember()` now handles loading catalog members, opening groups and showing "Add Data" window.
* Fix `MagdaReference` `forceLoadReference` bug.
* Clean up `CkanCatalogGroup` loading - errors are no-longer swallowed.
* Clean up `3dTilesMixin` loading - errors are no-longer swallowed.
* Fix `DataPreviewSections` info section bug.
* Move `FeedbackForm` `z-index` to same as `Notification` - this is so it will appear above Data catalog.
* Added `result.raiseError()`, `result.pushErrorTo()` and `result.clone()` helper methods - and `Result.combine()` convenience function
* Renamed `ReferenceMixin.is` to `ReferenceMixin.isMixedInto`
* Added support for logging to external error service and configuring it via config parameters. See `errorService` in [client configuration](doc/customizing/client-side-config.md).
* Fix `DiscreteColorMap` bug with `binColors` and added warning message if `colorPalette` is invalid.
* Fix `EnumColorMap` bug with `binColors`
* Moved d3-scale-chromatic code into `tableColorMap.colorScaleCategorical()` and `tableColorMap.colorScaleContinuous()`
* Disabled welcome popup for shared stories
* Add WMS support for default value of time dimension.
* Make CompositeCatalogItem sync visibility to its members.
* Add `description` and `example` static properties to `Trait`, and added `@traitClass` decorator.
* Add `parent` property to `Trait`, which contains parent `TraitClass`.
* New model-generated documentation in `generateDocs.ts`
* Refactored some `Traits` classes so they use `mixTraits` instead of extending other `Traits` classes.
* Allow translation of some components.
* Fixed a bug which prevented adding any reference catalog item while the story is playing.
* Bumped terriajs-server to ^3.3.3

#### 8.0.0-alpha.87

* Re-add basemap images to terriajs rather than requiring all TerriaMaps to have those basemap images. Default basemaps will use those images.
* Data from TableMixin always overrides other feature information (e.g. from vector tiles in region mapping) by column name and title for feature info templating (consistent with v7).
* Fixed point entity creation for TableMixin where different columns are used for point size and colour.
* Changed MappableMixin's initialMessage to show while map items are loaded. Map items could be displayed behind the disclaimer before a user accepts the disclaimer.
* Fixed a cyclic dependency between initialMessage and app spinner (globe gif greysreen) that caused the app spinner to be present forever when loading a share link.
* Removed hardcoded credit links and made it configurable via terria config parameters.
* Disable `TableMixin` time column if only one unique time interval

#### 8.0.0-alpha.86

- **Breaking changes**:
  - `EnumColorMap` will only be used for enum `TableColumns` with number of unique values <= number of bins 

* Add `options` to CSV papaparsing
* `TableMixin` will now only show points **or** region mapping - not both
* Add `FeatureInfoMixin` support for 2D vector features (in Cesium only)
* `TableStyles` are now hidden from the "Display Variable" selector if the number of colors (enumColors or numberOfBins) is less than 2. As a ColorMap with a single color isn't super useful.
* Improved default `TableColumn.isSampled` - it will be false if a binary column is detected (0 or 1)
* Improved default Table charting - now a time column will be used for xAxis by default
* Added `spreadFinishTime` - which works same way as `spreadStartTime` - if `true`, finish time of feature will be "spread" so that all features are displayed at the latest time step.
* Added support for `OpenDataSoft` - only point or region based features + timeseries
* `GeoJsonMixin`-based catalog items with polygon features can be extruded if a `heightProperty` is specified.
* Bugfix to make time-based geojson work when there are multiple features with the same time property value.
* Add `czmlTemplate` to `GeoJsonTraits` - it can be used to replace GeoJSON Point features with a CZML packet.
* Made the moment points in the chart optionally clickable.

#### 8.0.0-alpha.85

- **Breaking changes**:
  - Removed `registerAnalytics.js`
  - Removed `HelpMenuPanel.jsx`

* Added analytic events related to story, share and help menu items, Also refactored events to use category and action enums.
* Remove table style `SelectableDimension` from SDMX
* Upgrade to react v17. (#5549)
* Upgrade to documentationjs 13, and fix configuration issue. (#5549)
* Remove unused dependencies `class-list`, `d3-axis`, `d3-dispatch`, `simple-statistics` and `ts-loader`. (#5549)
* [The next improvement]
* `GyroscopeGuidance` can now be translated.
* Wraps tool title bar text using `...`.

#### 8.0.0-alpha.84

* Fix `ArcGisMapServerCatalogGroup` infinite loading by removing the cycle of calling `loadMembers` that was present in the `DataCatalogGroup` React component. However calling `loadMembers` is still not cached as it should for `ArcGisMapServerCatalogGroup`, and the infinite loading bug could return.
* Fix bug `selectableDimensions` bug in `Cesium3dTilesMixin` and `GltfCatalogItem`.

#### 8.0.0-alpha.83

* Add `modelDimensions` to `CatalogMemberMixin` - this can be used to apply model stratum with a `SelectableDimension` (i.e. a drop-down menu).
* `GeoJsonMixin`-based catalog items can now be styled based on to their properties through traits.
* `GeoJsonMixin`-based catalog items can now vary over time if a `timeProperty` is specified.

#### 8.0.0-alpha.82

- **Breaking changes**:
  - IndexedItemSearchProvider: (bounding) `radius` option is no longer supported in `resultsData.csv` of search indexes.

* Show a toast and spinner icon in the "Ideal zoom" button when the map is zooming.
* `zoomTo()` will return a promise that resolves when the zoom animation is complete.
* Modifies `IndexedItemSearchProvider` to reflect changes to `terriajs-indexer` file format.
* Move feature info timeseries chart funtion to `lib\Table\getChartDetailsFn.ts`
* Fix feature info timeseries chart for point (lat/long) timeseries
* Feature info chart x-values are now be sorted in acending order
* Remove merging rows by ID for `PER_ROW` data in `ApiTableCatalogItem`
* Make `ApiTableCatalogItem` more compatible with Table `Traits`
  * `keyToColumnMapping` has been removed, now columns must be defined in `columns` `TableColumnTraits` to be copied from API responses.
* Move notification state change logic from ViewState into new class `NotificationState`
* Catalog items can now show a disclaimer or message before loading through specifying `InitialMessageTraits`
* Added Leaflet hack to remove white-gaps between tiles (https://github.com/Leaflet/Leaflet/issues/3575#issuecomment-688644225)
* Disabled pedestrian mode in mobile view.
* Pedestrian mode will no longer respond to "wasd" keys when the user is typing in some input field.
* Fix references to old `viewState.notification`.
* wiring changeLanguage button to useTranslation hook so that it can be detected in client maps
* Add `canZoomTo` to `TableMixin`
* SDMX changes:
  * Add better SDMX server error messages
  * `conceptOverrides` is now `modelOverrides` - as dataflow dimension traits can now be overridden by codelist ID (which is higher priortiy than concept ID)
  * Added `regionTypeReplacements` to `modelOverride`- to manually override detected regionTypes
  * `modelOverrides` are created for SDMX common concepts `UNIT_MEASURE`, `UNIT_MULT` and `FREQ`
    * `UNIT_MEASURE` will be displayed on legends and charts
    * `UNIT_MULT` will be used to multiple the primary measure by `10^x`
    * `FREQ` will be displayed as "units" in Legends and charts (eg "Monthly")
  * Single values will now be displayed in `ShortReportSections`
  * Custom feature info template to show proper dimension names + time-series chart
  * Smarter region-mapping
  * Removed `viewMode` - not needed now due to better handling of time-series
* Fix `DimensionSelector` Select duplicate ids.
* Add Leaflet splitter support for region mapping
* Fix Leaflet splitter while zooming and panning map
* Split `TableMixin` region mapping `ImageryParts` and `ImageryProvider` to improve opacity/show performance
* Removed `useClipUpdateWorkaround` from Mapbox/Cesium TileLayers (for Leaflet) - because we no longer support IE
* Fix overwriting `previewBaseMapId` with `initBaseMapId` by multiple `initData`.
* GeoJSON Mixin based catalog items can now call an API to retrieve their data as well as fetching it from a url.
* Changes to loadJson and loadJsonBlob to POST a request body rather than always make a GET request.
* Added ApiRequestTraits, and refactor ApiTableCatalogItemTraits to use it. `apiUrl` is now `url`.

#### 8.0.0-alpha.81

* Fix invalid HTML in `DataPreviewSections`.
* Fix pluralisation of mapDataState to support other languages.
* Fix CSW `Stratum` name bug.
* Add `#configUrl` hash parameter for **dev environment only**. It can be used to overwrite Terria config URL.

#### 8.0.0-alpha.80

* Removed `Disclaimer` deny or cancel button when there is no `denyAction` associated with it.

#### 8.0.0-alpha.79

* Make `InfoSections` collapsible in `DataPreview`. This adds `show` property to `InfoSectionTraits`.
  * `WebMapServiceCatalogItem` service description and data description are now collapsed by default.
* Revert commit https://github.com/TerriaJS/terriajs/commit/668ee565004766b64184cd2941bbd53e05068ebb which added `enzyme` devDependency.
* Aliases `lodash` to `lodash-es` and use `babel-plugin-lodash` reducing bundle size by around 1.09MB.
* Fix CkanCatalogGroup filterQuery issue. [#5332](https://github.com/TerriaJS/terriajs/pull/5332)
* Add `cesiumTerrainAssetId` to config.json to allow configuring default terrain.
* Added in language toggle and first draft of french translation.json
  * This is enabled via language languageConfiguration.enabled inside config.json and relies on the language being both enumerated inside languageConfiguration.langagues and availble under {code}/translation.json
* Updated to terriajs-cesium 1.81
* Create the Checkbox component with accessibility in mind.
* Convert `FeedbackForm` to typescript.

#### 8.0.0-alpha.78

* Add `ignoreErrors` url parameter.

#### 8.0.0-alpha.77

- **Breaking changes**:
  - `terria.error.raiseEvent` and `./raiseErrorToUser.ts` have been replaced with `terria.raiseErrorToUser`.
  - `terria.error.addEventListener` has been replaced with `terria.addErrorEventListener`

* New Error handling using `Result` and `TerriaError` now applied to initial loading, `updateModelFromJson()`, `upsertModelFromJson()` and `Traits.fromJson()`. This means errors will propagate through these functions, and a stacktrace will be displayed.
  * `Result` and the new features of `TerriaError` should be considered unstable and may be extensively modified or removed in future 8.0.0-alpha.n releases
* New `terriaErrorNotification()` function, which wraps up error messages.
* `TerriaError` can now contain "child" errors - this includes a few new methods: `flatten()` and `createParentError()`. It also has a few new convenience functions: `TerriaError.from()` and `TerriaError.combine()`.
* Convert `Branding.jsx` to `.tsx`
* Added `configParams.brandBarSmallElements` to set Branding elements for small screen (also added theme props)
* Add `font` variables and `fontImports` to theme - this can be used to import CSS fonts.
* Convert `lib/Styled` `.jsx` files to `.tsx` (including Box, Icon, Text). The most significant changes to these interfaces are:
  * `Box` no longer accepts `<Box positionAbsolute/>` and this should now be passed as `<Box position="absolute"/>`.
  * `Text`'s `styledSize` has been removed. Use the `styledFontSize` prop.
  * `ButtonAsLabel` no longer accepts `dark`. A dark background is now used when `light` is false (or undefined).
* Fixes CZML catalog item so that it appears on the timeline.
* Enable `theme` config parameter. This can now be used to override theme properties.

#### 8.0.0-alpha.76

* Added support for setting custom concurrent request limits per domain through `configParameters.customRequestSchedulerLimits`.
* Added `momentChart` to region-mapped timeseries
* Add time-series chart (in FeatureInfo) for region-mapped timeseries
* Only show `TableMixin` chart if it has more than one
* Add `TableChartStyle` name trait.

#### 8.0.0-alpha.75

* Fix `NotificationWindow` bug with `message`.
* Re-add `loadInitSources` to `Terria.updateApplicationUrl()`
* Added support for `elements` object in catalogue files (aka init files).
  * Using this object you can hide/show most UI elements individually.
  * See https://github.com/TerriaJS/terriajs/pull/5131. More in-depth docs to come.

#### 8.0.0-alpha.74

* Fix JS imports of `TerriaError`

#### 8.0.0-alpha.73

* Add `title` parameter in `raiseErrorToUser` to overwrite error title.
* Added some error handling in `Terria.ts` to deal with loading init sources.
* TSify `updateApplicationOnHashChange` + remove `loadInitSources` from `Terria.updateApplicationUrl()`

#### 8.0.0-alpha.72

- **Breaking changes**:
  - Added clippingRectangle to ImageryParts.
  - Any item that produces ImageryParts in mapItems (any raster items) must now also provide a clippingRectangle.
  - This clippingRectangle should be derived from this.cesiumRectangle (a new computed property) & this.clipToRectangle as demonstrated in many raster catalog items (e.g. OpenStreetMapCatalogItem.ts).

* Adds experimental ApiTableCatalogItem.
* Fixes a bug where FeatureInfoDownload tries to serialize a circular object
* Added `removeDuplicateRows` to `TableTraits`
* `forceLoadTableData` can now return undefined - which will leave `dataColumnMajor` unchanged
* Fix sharing preview item.
* Added z-index to right button group in mobile header menu
* Added cesiumRectangle computed property to MappableMixin. This is computed from the `rectangle` Trait.
* Fixed a Cesium render crash that occured when a capabilities document specified larger bounds than the tiling scheme's supported extent (bug occured with esri-mapServer but wms was probably also affected).
* In fixing Cesium render crash above clipping rectangles are now added to Cesium ImageryLayer (or Leaflet CesiumTileLayer) rather than being included in the ImageryProvider. ImageryParts has been updated to allow passing the clipping rectangle through to Cesium.ts and Leaflet.ts where ImageryLayer/CesiumTileLayer objects are created.

#### 8.0.0-alpha.71
* Fix accidental translation string change in 8.0.0-alpha.70

#### 8.0.0-alpha.70

- **Breaking changes**: 
  - Merge `Chartable` and `AsyncChartableMixin` into new **`ChartableMixin`** + `loadChartItems` has been replaced by `loadMapItems`.
  - To set base map use `terriaViewer.setBaseMap()` instead of `terriaViewer.basemap = ...`
  - Incorrect usage of `AsyncLoader` **will now throw errors**

* Add `hideInBaseMapMenu` option to `BaseMapModel`.
* Change default basemap images to relative paths.
* Add `tileWidth` and `tileHeight` traits to `WebMapServiceCatalogItem`.
* Add docs about `AsyncLoader`
* Remove interactions between AsyncLoaders (eg calling `loadMetadata` from `forceLoadMapItems`)
* ... Instead, `loadMapItems` will call `loadMetadata` before triggering its own `AsyncLoader`
* Add `isLoading` to `CatalogMemberMixin` (combines `isLoading` from all the different `AsyncLoader`)
* Move `Loader` (spinner) from `Legend` to `WorkbenchItem`.
* Merge `Chartable` and `AsyncChartableMixin` into **`ChartableMixin`** + remove `AsyncLoader` functionality from `ChartableMixin` - it is now all handled by `loadMapItems`.
* Removed `AsyncLoader` functionality from `TableMixin` - it is now handled by `loadMapItems`.
  * `TableMixin.loadRegionProviderList()` is now called in `MappableMixin.loadMapItems()`
* Added `TerriaViewer.setBaseMap()` function, this now calls `loadMapItems` on basemaps
* Fix load of persisted basemap
* Fix sharing of base map
* Added backward compatibility for `baseMapName` in `initData` (eg share links)
* Add `WebMapService` support for WGS84 tiling scheme

#### 8.0.0-alpha.69

- **Breaking changes**: 
  - Basemaps are now configured through catalog JSON instead of TerriaMap - see https://github.com/TerriaJS/terriajs/blob/13362e8b6e2a573b26e1697d9cfa5bae328f7cff/doc/customizing/initialization-files.md#basemaps 
  
* Updated terriajs-cesium to version 1.79.1
* Make base maps configurable from init files and update documentation for init files [#5140](https://github.com/TerriaJS/terriajs/pull/5140).

#### 8.0.0-alpha.68
* Remove points from rectangle `UserDrawing`
* Fix clipboard typing error. 
* Ported `WebProcessingServiceCatalogGroup`.
* Add CSW Group support
* Revert "remove wmts interfaces from ows interfaces" (873aa70)
* Add `math-expression-evaluator` library and `ColumnTransformationTraits`. This allows expressions to be used to transform column values (for example `x+10` to add 10 to all values).
* Fix bug in `TableColumn.title` getter.
* Add support for TableColumn quarterly dates in the format yyyy-Qx (eg 2020-Q1).
* Fix region mapping feature highlighting.
* Update clipboard to fix clipboard typing error.
* Added direction indicator to the pedestrian mode minimap.
* Limit up/down look angle in pedestrian mode.
* Automatically disable pedestrian mode when map zooms to a different location.
* Add support for time on `ArcGisMapServerCatalogItem`
* Merge `Mappable` and `AsyncMappableMixin` into **`MappableMixin`**.
* Fixed a issue when multiple filters are set to Cesium3DTilesCatalogItem
* Async/Awaitify `Terria.ts` + fix share links loading after `loadInitSources`.
* Tsified `TerriaError` + added support for "un-rendered" `I18nTranslateString`
* Tsified `raiseErrorToUser` + added `wrapErrorMessage()` to wrap error message in something more user friendly (using `models.raiseError.errorMessage` translation string).

#### 8.0.0-alpha.67
* TSify `Loader` function.
* Added walking mode to pedestrian mode which clamps the pedestrain to a fixed height above the surface.
* Upgraded catalog-converter to fix dependency version problem and ensure that all imports are async to reduce main bundle size.

#### 8.0.0-alpha.66

- **Breaking changes**: 
  - Changed merging behaviour of Trait legends (of type `LegendTraits`) in `CatalogMemberTraits`. This affects legends on all `CatalogMember` models. Legend objects in higher strata now replace values in lower strata that match by index, rather than merging properties with them.

* Add `MetadataUrlTraits` to `CatalogMemberTraits.metadataUrls`. It contains an array of metadata URLS (with optional `title` which will render a button)
* Restore `cesiumTerrainUrl` config parameter. [#5124](https://github.com/TerriaJS/terriajs/pull/5124)
* I18n-ify strings in settings panel. [#5124](https://github.com/TerriaJS/terriajs/pull/5124)
* Moved `DataCustodianTraits` into `CatalogMemberTraits` and `CatalogMemberReferenceTraits`.
* `TableMixin` styles ("Display variables") will now look for column title if style title is undefined
* Add fallback colours when Color.fromCssColorString is used.
* Allow nullable `timeColumn` in table styles. Useful for turning off auto-detection of time columns.
* Added tool for searching inside catalog items. Initial implementation works for indexed 3d tilesets.
* Added support for shapefile with `ShapefileCatalogItem`
* Added `GeoJsonMixin` for handling the loading of geojson data.
* Extended the `GeoJsonCatalogItem` to support loading of zip files.
* Fixed broken feature highlighting for raster layers.
* Show a top angle view when zooming to a small feature/building from the item search result.
* Fix `TableTimeStyleTraits.idColumns` trait type.
* Added a new `lineAndPoint` chart type
* CustomChartComponent now has a "chart-type" attribute
* Fix `ArcGisMapServerCatalogItem` layer ID and legends bug
* Re-add region mapping `applyReplacements`.
* Added `SearchParameterTraits` to item search for setting a human readable `name` or passing index specific `queryOptions` for each parameter through the catalog.
* Added `AttributionTraits` to mappable and send it as property when creating Cesium's data sources and imagery providers. [#5167](https://github.com/TerriaJS/terriajs/pull/5167)
* Fixed an issue where a TerriaMap sometimes doesn't build because of typing issues with styled-components.
* Renamed `options` to `providerOptions` in `SearchableItemTraits`.
* Fix `CkanCatalogGroup.groupBy = "none"` members
* Fix `TableMixin` region mapping feature props and make Long/Lat features use column titles (if it exists) to match v7 behaviour.
* Add support for `CkanItemReference` `wms_layer` property
* Add support for `ArcGisMapServerCatalogGroup` to use `sublayerIds`.
* Added Pedestrian mode for easily navigating the map at street level.
* Clean up `LayerOrderingTraits`, remove `WorkbenchItem` interface, fix `keepOnTop` layer insert/re-ordering.
* Remove `wordBreak="break-all"` from Box surrounding DataPreview
* Re-added merging of csv row properties and vector tile feature properties for feature info (to match v7 behaviour).
* Fixes a bug in pedestrian mode where dropping the pedestrian in northern hemisphere will position the camera underground.
* Implement highlight/hide all actions for results of item search.
* Disable pickFeatures for WMS `_nextImageryParts`.
* Fix Leaflet `ImageryLayer` feature info sorting
* Fix hard-coded colour value in Story
* Use `configParameters.cesiumIonAccessToken` in `IonImageryCatalogItem`
* Added support for skipping comments in CSV files
* Fix WMS GetLegendGraphics request `style` parameter
* Loosen Legend `mimeType` check - so now it will treat the Legend URL as an image if the `mimeType` matches **OR** the file extension matches (previously, if `mimeType` was defined, then it wouldn't look at filetype extension)
* Fix `DiffTool` date-picker label `dateComparisonB`
* Fix app crash when switching different tools.
* Create `merge` `TraitsOption` for `objectArrayTrait`
* Move `Description` `metadataUrls` above `infoSections`.
* Upgraded i18next and i18next-http-backend to fix incompatibility.
* Added support for dd/mm/yyyy, dd-mm-yyyy and mm-dd-yyyy date formats.

#### 8.0.0-alpha.65
* Fixed SDMX-group nested categories
* SDMX-group will now remove top-level groups with only 1 child

#### 8.0.0-alpha.64
* Fixed WMS style selector bug.
* `layers` trait for `ArcGisMapServerCatalogItem` can now be a comma separated string of layer IDs or names. Names will be auto-converted to IDs when making the request.

#### 8.0.0-alpha.63
* Add `v7initializationUrls` to terria config. It will convert catalogs to v8 and print warning messages to console.
* Add `shareKeys` support for Madga map-config maps (through `terria` aspect)
* Revert WMS-group item ID generation to match v7
* Add `addShareKeysToMembers` to `GroupMixin` to generate `shareKeys` for dynamic groups (eg `wms-group)
* Added `InitDataPromise` to `InitSources`
* Add reverse `modelIdShareKeysMap` map - `model.id` -> `shareKeys`
* Upgraded `catalog-converter` to 0.0.2-alpha.4
* Reverted Legend use of `object` instead of `img` - sometimes it was showing html error responses
* Legend will now hide if an error is thrown
* Update youtube urls to nocookie version
* Share link conversion (through `catalog-converter`) is now done client-side
* Fix Geoserver legend font colour bug
* Remove legend broken image icon
* Added high-DPI legends for geoserver WMS (+ font size, label margin and a few other tweaks)
* `LegendTraits` is now part of `CatalogMemberTraits`
* Add `imageScaling` to `LegendTraits`
* WMS now `isGeoserver` if "geoserver` is in the URL
* Add WMS `supportsGetLegendRequest` trait
* Improved handling of WMS default styles

#### 8.0.0-alpha.62
* Fixed an issue with not loading the base map from init file and an issue with viewerMode from init files overriding the persisted viewerMode
* Fixed issues surrounding tabbed catalog mode
* Now uses `catalog-converter` to convert terriajs json in WPS response from v7 to v8.
* Fixed a bug in `UserDrawing` which caused points to not be plotted on the map.
* Fixed app crash when switching between different types of parameter in `GeoJsonParameterEditor`.
* Fixed errors when previewing an item in a group that is open by default (`isOpen: true` in init file).
* Fixed mobx warnings when loading geojson catalog items.
* Add `multiplierDefaultDeltaStep` Trait, which tries to calculate sensible multiplier for `DistrectelyTimeVarying` datasets. By default it is set to 2, which results in a new timestep being displayed every 2 seconds (on average) if timeline is playing.
* Hide info sections with empty content in the explorer preview.
* Port `shareKeys` from version 7
* Update/re-enable `GeoJsonCatalogItemSpec` for v8.
* add `DataCustodianTraits` to `WebMapServiceCatalogGroupTraits`
* Changed behaviour of `updateModelFromJson` such that catalog groups with the same id/name from different json files will be merged into one single group. 
* Fixed error when selecting an existing polygon in WPS input form.
* Upgraded `catalog-converter` to 0.0.2-alpha.3.

#### 8.0.0-alpha.61
* New `CatalogFunctionMixin` and `CatalogFunctionJobMixin`
* Tsified `FunctionParameters`
* New `YourDataYourRegions` `CatalogFunctionMixin`
* Added `inWorkbench` property
* Added `addModelToTerria` flag to `upsertModelFromJson` function
* Added `DataCustodianTraits` to `WebMapServiceCatalogItem`
* Added `disableDimensionSelectors` trait to `WebMapServiceCatalogItem`. Acheives the same effect of `disableUserChanges` in v7.
* Temporarily stopped using `papaparse` for fetching Csv urls till an upstream bug is fixed.
* Fix async bug with loading `ReferenceMixin` and then `Mappable` items in `initSources`
* Remove `addToWorkbench`, it has been replaced with `workbench.add`
* Improve handling of `ArcGisMapServerCatalogItem` when dealing with tiled layers.
* Ensure there aren't more bins than unique values for a `TableStyle`
* Add access control properties to items fetched from Esri Portal.
* Improves magda based root group mimic behaviour introdcued in 8.0.0-alpha.57 by adding `/` to `knownContainerUniqueIds` when `map-config*` is encountered
* Fixed broken chart disclaimers in shared views.
* Fixed a bug where chart disclaimers were shown even for chart items disabled in the workbench.
* Fixed a bug where charts with titles containing the text "lat" or "lon" were hidden from feature info panel.
* Fixed a bug that occurred when loading config from magda. `initializationUrls` are now applied even if `group` aspect is not set

#### 8.0.0-alpha.60
* Fix WMS legend for default styles.
* Request transparent legend from GeoServer.
* Reverted the following due to various issues with datasets:
    * Add basic routing support
    * Add better page titles when on various routes of the application
    * Add prerendering support on `/catalog/` routes (via `prerender-end` event & 
      allowing TerriaMap to hit certain routes)

#### 8.0.0-alpha.59
* Update magda error message
* Add a short report section if trying to view a `3d-tiles` item in a 2d map.
* Fix bug in `Terria.interpretStartData`.
* Add `ThreddsCatalogGroup` model.
* Port `supportsColorScaleRange`, `colorScaleMinimum` and `colorScaleMaximimum` from `master` to `WebMapServiceCatalogItem` model.
* Ported MapboxVectorTileCatalogItem ("mvt").
* When expanding a chart from the feature info panel, we now place a colored dot on the map where the chart was generated from.
* Add basic routing support
* Add better page titles when on various routes of the application
* Add prerendering support on `/catalog/` routes (via `prerender-end` event &
  allowing TerriaMap to hit certain routes)
* Update `WorkbenchButton` to allow for links rather than buttons, including
  changing About Data to a link

#### 8.0.0-alpha.58
* Add `FeatureInfoTraits` to `ArcGisMapServerCatalogItem`
* Fix zooming bug for datasets with invalid bounding boxes.
* Add new model for `ArcGisTerrainCatalogItem`.
* Add 3D Tiles to 'Add web data' dropdown.
* Fix naming of item in a `CkanCatalogGroup` when using an item naming scheme other than the default.

#### 8.0.0-alpha.57
* Fix memoization of `traitsClassToModelClass`.
* Chart expanded from feature info panel will now by default show only the first chart line.
* Chart component attribtues `column-titles` and `column-units` will now accept a simpler syntax like: "Time,Speed" or "ms,kmph"
* Fix presentation of the WMS Dimension metadata.
* Magda based maps now mimic "root group uniqueId === '/'" behaviour, so that mix and matching map init approaches behave more consistently
  
#### 8.0.0-alpha.56
* Add `itemProperties` trait to `WebMapMapCatalogGroup`.
* Add support for `formats` traits within `featureInfoTemplate` traits.
* Fix handling of `ArcGisPortalItemReference` for when a feature layer contains multiple sublayers.
* Implemented new compass design.

#### 8.0.0-alpha.55
* Upgraded to patched terriajs-cesium v1.73.1 to avoid build error on node 12 & 14.

#### 8.0.0-alpha.54
* Add a `infoAsObject` property to the `CatalogMemberMixin` for providing simpler access to `info` entries within templating
* Add a `contentAsObject` trait to `InfoSectionTraits` where a json object is more suitable than a string.
* Add `serviceDescription` and `dataDescription` to `WebMapServiceCatalogItem` info section.
* Extend `DataPreviewSections.jsx` to support Mustache templates with context provided by the catalog item.
* Add support for `initializationUrls` when loading configuration from Magda.
* Add `:only-child` styling for `menu-bar.scss` to ensure correctly rounded corners on isolated buttons.
* Improve Branding component for mobile header
* Add support for `displayOne` configuration parameter to choose which brand element to show in mobile view
* Update Carto basemaps URL and attribution.
* Add `clipToRectangle` trait to `RasterLayerTraits` and implement on `WebMapServiceCatalogItem`, `ArcGisMapServiceCatalogItem`, `CartoMapCatalogItem`, `WebMapTileServiceCatalogItem`.
* Allow Magda backed maps to use an inline `terria-init` catalog without it getting overwritten by map-config before it can be parsed
* Deprecated `proxyableDomainsUrl` configuration parameter in favour of `serverconfig` route
* Ported a support for `GpxCatalogItem`.
* Feature info is now shareable.
* Add option `canUnsetFeaturePickingState` to `applyInitData` for unsetting feature picking state if it is missing from `initData`. Useful for showing/hiding feature info panel when switching through story slides.
* Properly render for polygons with holes in Leaflet.
* Fixes a bug that showed the chart download button when there is no downloadable source.
* Add `hideWelcomeMessage` url parameter to allow the Welcome Message to be disabled for iframe embeds or sharing scenarios.
* Ensure the `chartDisclaimer` is passed from catalog items to derived chart items.
* Don't calculate a `rectangle` on a `ArcGisPortalReferenceItem` as they appear to contain less precision than the services they point to.
* Allow an `ArcGisPortalReferenceItem` to belong to multiple `CatalogGroup`'s.
* Fix argis reference bug.
* Made possible to internationalize tour contend.
* Added TileErrorHandlerMixin for handling raster layer tile errors.
* Fixed a bug that caused the feature info chart for SOS items to not load.
* SOS & CSV charts are now shareable.

#### 8.0.0-alpha.53
* Ported an implementation of CatalogSearchProvider and set it as the default
* Notification window & SatelliteImageryTimeFilterSection now uses theme colours
* Improved look and feel of `StyledHtml` parsing
* Fix `applyAriaId` on TooltipWrapper causing prop warnings
* Make share conversion notification more pretty (moved from `Terria.ts` to `shareConvertNotification.tsx`)
* Tsxify `Collapsible`
* `ShortReportSections` now uses `Collapsible`
* Add `onToggle`, `btnRight`, `btnStyle`, `titleTextProps` and `bodyBoxProps` props in `Collapsible`
* Add `Notification.message` support for `(viewState: ViewState) => React.ReactNode`
* Added splitting support to `WebMapTileServiceCatalogItem`.

#### 8.0.0-alpha.52
* Prevent duplicate loading of GetCapabilities
* Update the `GtfsCatalogItem` to use the `AutoRefreshingMixin`.
* Add a condition to the `AutoRefreshingMixin` to prevent unnecessary polling when an item is disabled in the workbench.
* Upgraded to Cesium v1.73.
* Removed any references to `BingMapsApi` (now deprecated).
* Add support for resolving `layers` parameter from `Title` and not just `Name` in `WebMapServiceCatalogItem`.
* Change TrainerBar to show all steps even if `markdownDescription` is not provided

#### 8.0.0-alpha.51
* Add WMTS group/item support
* Create `OwsInterfaces` to reduce duplicate code across OWS servies
* Fix story prompt being permanent/un-dismissable
* Fixed a bug that caused the feature info chart for SOS items to not load.

#### 8.0.0-alpha.50
* Support for searching WFS features with WebFeatureServiceSearchProvider
* WFS-based AustralianGazetteerSearchProvider
* Fixed a bug causing users to be brought back to the Data Catalogue tab when clicking on an auto-detected user added catalogue item.
* Fixed a bug causing Data Preview to not appear under the My Data tab.
* Fix WMS style `DimensionSelector` for layers with no styles
* Add WMS legend for items with no styles
* Add warning messages if catalog/share link has been converted by `terriajs-server`.
* Update the scroll style in `HelpVideoPanel` and `SidePanel` helpful hints.
* Updated leaflet attribution to match the style of cesium credits.
* Remove `@computed` props from `WebFeatureServiceCapabilities`
* Fixed bug causing the Related Maps dropdown to be clipped.
* Add SDMX-json support for groups and items (using SDMX-csv for data queries)
* `TableMixin` now uses `ExportableMixin` and `AsyncMappableMixin`
* Move region provider loading in `TableMixin` `forceLoadTableMixin` to `loadRegionProviderList`
* Added `TableAutomaticStylesStratum.stratumName` instead of hard-coded strings
* Added `Dimension` interface for `SelectableDimension` - which can be used for Traits
* Make `SelectableDimension.options` optional

#### 8.0.0-alpha.49
* WMS GetFeatureInfo fix to ensure `style=undefined` is not sent to server
* Add support for splitting CSVs (TableMixins) that are using region mapping.
* `addUserCatalogMember` will now call `addToWorkbench` instead of `workbench.add`.
* Replaces `ShadowSection` with `ShadowMixin` using `SelectableDimensions`
* Fix Webpack Windows path issue
* Updated icons for view and edit story in the hamburger menu.
* Implemented new design for story panel.

#### 8.0.0-alpha.48
* Allow `cacheDuration` to be set on `ArcGisPortalCatalogGroup` and `ArcGisPortalItemReference`.
* Set default `ArcGisPortalCatalogGroup` item sorting by title using REST API parameter.
* Call `registerCatalogMembers` before running tests and remove manual calls to `CatalogMemberFactory.register` and `UrlMapping.register` in various tests so that tests reflect the way the library is used.
* Updated stratum definitions which used hardcoded string to use `CommonStrata` values.

#### 8.0.0-alpha.47
* Removed hard coded senaps base url.
* Added option for manual Table region mapping with `enableManualRegionMapping` TableTrait. This provides `SelectableDimensions` for the region column and region type.
* Added WMS Dimensions (using `SelectableDimensions`)
* Added WMS multi-layer style, dimension and legend support.
* Merged the `StyleSelector` and `DimensionsSelector`, and created a `SelectableDimensions` interface.
* Added `chartColor` trait for DiscretelyTimeVarying items.
* Replaced all instances of `createInfoSection` and `newInfo` with calls to `createStratumInstance` using an initialisation object.
* Added trait `leafletUpdateInterval` to RasterLayerTraits.
* Fix styling of WFS and GeoRSS.
* Fixed a bug that caused re-rendering of xAxis of charts on mouse move. Chart cursor should be somewhat faster as a result of this fix.
* Fixed a bug that caused some catalogue items to remain on the map after clicking "Remove all" on the workbench.
* Deleted old `ChartDisclaimer.jsx`
* Moved `DiscretelyTimeVaryingMixin` from `TableAutomaticStylesStratum` to `TableMixin`
* Added basic region-mapping time support
* Add short report to `ArcGisFeatureServerItem` for exceeding the feature limit.
* Added shift-drag quick zoom

#### 8.0.0-alpha.46
* Fixed i18n initialisation for magda based configurations

#### 8.0.0-alpha.45
* Upgraded to Cesium v1.71.
* Change `ExportableData` interface to `ExportableMixin` and add `disableExport` trait.
* Add basic WFS support with `WebFeatureServiceCatalogGroup` and `WebFeatureServiceCatalogItem`
* Update style of diff tool close button to match new design
* Remove sass code from the `HelpPanel` component
* Added an option for translation override from TerriaMap
* Help content, trainer bar & help terms can use translation overrides
* Accepts `backend` options under a new `terria.start()` property, `i18nOptions`
* Use `wms_api_url` for CKAN resources where it exists
* Tsxified `DateTimePicker` and refactored `objectifiedDates` (moved to `DiscretelyTimeVaryingMixin`).
* Update style of 'Change dates' button in delta to be underlined
* Fix issue with delta 'Date comparison' shifting places when querying new location
* Shows a disabled splitter button when entering diff
* Make Drag & Drop work again (tsxify `DragDropFile.tsx` and refactor `addUserFiles.ts`)
* Add `TimeVarying.is` function

#### 8.0.0-alpha.44
* Pass `format` trait on `TableColumnTraits` down to `TableAutomaticStylesStratum` for generating legends
* Add `multipleTitles` and `maxMultipleTitlesShowed` to `LegendItemTraits`
* Aggregate legend items in `createLegendItemsFromEnumColorMap` by colour, that is merge legend items with the same colour (using `multipleTitles`)
* Only generate `tableStyles` for region columns if no other styles exist
* TableAutomaticStylesStratum & CsvCatalogItem only returns unique `discreteTimes`s now
* Specified specific terriajs config for ForkTsCheckerWebpackPlugin

#### 8.0.0-alpha.43
* Replace `@gov.au/page-alerts` dependency with our own warning box component. This removes all `pancake` processes which were sometimes problematic.

#### 8.0.0-alpha.42
* Added ArcGIS catalog support via ArcGisPortalItemReference

#### 8.0.0-alpha.41
* Add `cacheDuration` and `forceProxy` to `UrlTraits` and add `cacheDuration` defaults to various catalog models.
* Tsify `proxyCatalogItemUrl`.
* Simplified SidePanel React refs by removing the double wrapping of the `withTerriaRef()` HOC
* Merged `withTerriaRef()` HOC with `useRefForTerria()` hook logic
* Breadcrumbs are always shown instead of only when doing a catalog search

#### 8.0.0-alpha.40
* Improve info section of `WebMapServiceCatalogItem` with content from GetCapabilities
* Re-implement `infoSectionOrder` as `CatalogMember` trait.
* Add `infoWithoutSources` getter to `CatalogMemberMixin` to prevent app crash when using `hideSources`
* Add support for nested WMS groups
* Added breadcrumbs when clicking on a catalogue item from a catalogue search

#### 8.0.0-alpha.39
* Development builds sped up by 3~20x - ts-loader is now optional & TypeScript being transpiled by babel-loader, keeping type check safety on a separate thread

#### 8.0.0-alpha.38
* Add `show` to `ShortReportTraits` and Tsxify `ShortReport`
* Convert `ShortReport` to styled-components, add accordian-like UI
* 3D tiles support is now implemented as a Mixin.

#### 8.0.0-alpha.37
* Add `refreshEnabled` trait and `AsyncMappableMixin` to `AutoRefreshMixin`
* Ensure `CkanCatalogGroup` doesn't keep re-requesting data when opening and closing groups.
* Add `typeName` to `CatalogMemberMixin`
* Add `header` option to `loadText`
* Add `isMixtedInto` function for `AsyncMappableMixin` and `AsyncChartableMixin`
* Added file upload support for `GltfCatalogItem`. The supported extension is glb.
* Improve runtime themeing via styled components across main UI components
* Updated default welcome video defaults to a newer, slower video
* Difftool will now pick any existing marked location (like from a search result) and filter imagery for that location.
* Updated labelling & copy in Difftool to clarify workflow
* ChartCustomComponent now `abstract`, no longer specific to CSV catalog items. Implement it for custom feature info charts.
* Update date picker to use theme colours
* Removed some sass overrides on `Select` through `StyleSelectorSection`
* Update LeftRightSection to use theme colours
* Ported `GeoRssCatalogItem` to mobx, added support to skip entries without geometry.
* Update Difftool BottomPanel UI to clearer "area filter" and date pickers
* Update Difftool BottomPanel to load into Terria's BottomDock
* Rearrange MapButton layout in DOM to properly reflow with BottomDock
* Update Difftool MainPanel to not get clipped by BottomDock
* Rearrange MapDataCount to exist inside MapColumn for more correct DOM structure & behaviour
* Re-added chart disclaimer.

#### mobx-36
* Added `pointer-events` to `MapNavigation` and `MenuBar` elements, so the bar don't block mouse click outside of the button.
* Fixes "reminder pop-up" for help button being unclickable
* Use `useTranslation` instead of `withTranslation` in functional component (`MapDataCount`)
* Make welcome video url and placeholder configurable via configparameters
* Added `ExportableData` interface.
* Added `ExportData` component for data catalog.
* Added WCS "clip and ship" for WMS
* Added basic CSV export function
* Extend `UserDrawing` to handle rectangles
* Tsxify `MapInteractionMode`
* Changed default orientation for `GltfCatalogItem` to no rotation, instead of zero rotation wrt to terrain
* Added a title to welcome message video

#### mobx-35
* Add "Upload" to tour points
* Add tooltips anywhere required in UI via `parseCustomMarkdownToReactWithOptions` & customisable via `helpContentTerms` 
* Add "map state" map data count to highlight state of map data
* Add a reminder "pop-up" that shows the location of the help button
* Fix bug causing story pop-up to be off screen
* Fix bug causing helpful hints to be cut off on smaller screens
* Changed the `Tool` interface, now accepting prop `getToolComponent` instead of `toolComponent`
* Added `ToolButton` for loading/unloading a tool
* Added `TransformationTraits` that can be used to change position/rotation/scale of a model.
* Merge master into mobx. This includes:
  * Upgraded to Cesium v1.68.
  * Story related enhancements:
    * Added a title to story panel with ability to close story panel. 
    * Added a popup on remove all stories.
    * Added button for sharing stories.
    * Added a question popup on window close (if there are stories on the map so users don't lose their work).
* Added a new `editor` Icon
* Changed `ToolButton` to show the same icon in open/close state. Previously it showed a close icon in close state.

#### mobx-34
* Bug fix for `DatePicker` in `BottomDock` causing app crash
* Made changes to the video modals: close button has been added, pressing escape now closes the component and some basic unit tests created
* Updated the video modal for _Data Stories: Getting Started_ to use the new `VideoGuide` component
* Tweaked MyData/AddData tabs to make it possible to invoke them without using the `ExplorerWindow` component and also customize the extensions listed in the dropdown.
* Fix the timeline stack handling for when there are multiple time-enabled layers
* Ported timeseries tables.
* Extended the support for styles for ESRI ArcGis Feature Server. Line styles are supported for lines and polygon outlines in both Cesium and Leaflet viewer. #4405
* Fix polygon outline style bug.
* Add a unit test for polygon outline style.
* Add TrainerPane/TrainerBar "Terry the task trainer"
* Use `1.x.x` of `karma-sauce-launcher` to fix CI build failures
* Stop unknown icons specified in config.json from crashing UI
* Creates a `ShadowTraits` class that is shared by `GltfCatalogItem` and `Cesium3DTilesCatalogItem`.
* Fixed a bug where user added data was removed from catalogue when Remove from map button in data catalog is clicked.
* Fix leaflet zoom to work when bounding rectangle exists but doesn't have bounds defined

#### mobx-33
* Updated generic select so icon doesn't block click
* Re-added loading bar for leaflet & cesium viewers

#### mobx-32
* Made expanded SOS chart item shareable.
* Fixed a regression bug where the time filter is shown for all satellite imagery items
* Add unit tests for `WelcomeMessage` and `Disclaimer`
* Fixed minor UI errors in console
* Replaced helpful hints text with the new version
* Made the shapes of some of the workbench components rounded
* Add `clampToGround` property on to holes within polygons in `GeoJsonCatalogItem`
* Set default `clampToGround` trait to `true` for `GeoJsonCatalogItem`
* Fixed a bug where WMS items caused type errors in newer babel and typescript builds, due to mixed mixin methods on DiffableMixin & DiscretelyTimeVaryingMixin
* Fixed a bug where KmlCatalogItem did not use the proxy for any urls.
* Add support for `CkanCatalogGroup` and `CkanItemReference`.
* Added unit test to ensure getAncestors behaviour
* Hide the chart legend if there are more than four items to prevent things like FeatureInfo being pushed out of the view and the map resizing.
* Prevent addedByUser stack overflow
* Fixed a chart bug where moment points do not stick to the basis item when they are of different scale.
* Fixed a bug where the moment point selection highlight is lost when changing the satellite imagery date.
* Removed sass from Clipboard
* Updated LocationSearchResults to support multiple search providers
* Replaced lifesaver icon on the help button with a question mark button
* Fix handling of points and markers around the anti-meridian in the `LeafletVisualizer`.
* Fixed difference tool losing datepicker state by keeping it mounted
* Disabled unhelpful Help button when in `useSmallScreenInterface`
* Fixed a bug where a single incorrect catalog item in a group would prevent subsequent items from loading.
* Improved catalog parsing to include a stub (`StubCatalogItem`) when terriajs can't parse something

#### mobx-31
* Fixes broken time filter location picker when other features are present on the map.
* Fixes the feature info panel button to show imagery at the selected location.
* Added `hideSource` trait to `CatalogMemberTraits`. When set to true source URL won't be visible in the explorer window.
* Added `Title`, `ContactInformation`, `Fees` to the `CapabilitiesService` interface so they are pulled on metadata load.
* Resolved name issue of `WebMapServiceCapabilities`. Now it returns a name resolved from `capabilities` unless it is set by user.
* Added setting of `isOpenInWorkbench`, `isExperiencingIssues`, `hideLegendInWorkbench`, `hideSource` strats for `WebMapServiceCatalogItem` from `WebMapServiceCatalogGroup`.

#### mobx-30
* Ported welcome message to mobx with new designs
* Updated CI clientConfig values to include new help panel default
* Bumped explicit base typescript to 3.9.2
* Lock rollbar to 2.15.2
* Ported disclaimer to mobx with new designs
* Added diff tool for visualizing difference (delta) of images between 2 dates for services that support it.
* Updated workbench ViewingControls styles to line up with icons
* Prevent re-diff on workbench items that are already a diff
* Updated splitter to force trigger resizes so it catches up on any animation delays from the workbench
* Update workbench to trigger resize events onTransitionEnd on top of view-model-triggers
* Added satellite imagery to help panel
* Stop disclaimer clashing with welcome message by only loading WelcomeMessage after disclaimer is no longer visible
* Fixes a difftool bug where left/right items loose their split direction settings when the tool is reset
* Fixes a splitter bug where split direction is not applied to new layers.
* Re-added satellite guide prompt option via `showInAppGuides`
* Changed tour "go back 1 tour point" messaging from "previous" to "back"

#### mobx-29
* Fix handling of urls on `Cesium3DTilesCatalogItem` related to proxying and getting confused between Resource vs URL.
* Renamed `UrlReference.createUrlReferenceFromUrlReference` to `UrlReference.createCatalogMemberFromUrlReference`
* Moved url to catalog member mapping from `createUrlRefernceFromUrl.register` to `UrlToCatalogMemberMapping` (now in `UrlReference.ts` file) 
* Added in-app tour framework & base tour items
* Make the help panel customisable for different maps by modifying `config.json`
* Added generic styled select
* Remove maxZoom from leaflet map.
* Run & configure prettier on terriajs lib/ json files
* Changed most of the icons for the `MapNavigation` section (on the right hand side) of the screen
* Added a close button to story panel
* Made `MapIconButton` to animate when expanding
* Remove requirement for browser to render based on make half pixel calculations for the Compass & stop it jumping around when animating

#### mobx-28
* Fix SASS exports causing some build errors in certain webpack conditions

#### mobx-1 through mobx-27
* Fixed DragDropFile and `createCatalogItemFromFileOrUrl` which wasn't enabled/working in mobx, added tests for `createCatalogItemFromFileOrUrl` and renamed `createCatalogItemFromUrl` to `createUrlRefernceFromUrl`.
* Fixed bug in StratumOrder where `sortBottomToTop` would sort strata in the wrong order.
* Allow member re-ordering via GroupMixin's `moveMemberToIndex`
* Fixed a bug where `updateModelFromJson` would ignore its `replaceStratum` parameter.
* Re-added Measure Tool support
* Re-added `CartoMapCatalogItem`
* Re-implemented `addedByUser` to fix bug where previews of user added data would appear in the wrong tab.
* Added header options for loadJson5, & allow header overrides on MagdaReference loading
* Re-added some matcher-type mappings in `registerCatalogMembers`.
* Added `UrlReference` to represent catalog items created from a url with an auto-detected type.
* Modified `upsertModelFromJson` so that when no `id` is provided, the `uniqueId` generated from `localId` or `name` is incremented if necessary to make it unique.
* Re-enable search components if SearchProvider option provided
* Modified tests to not use any real servers.
* Fixed bug causing workbench items to be shared in the wrong order.
* Fix bug where urls in the feature info panel weren't turned into hyperlinks
* Fix preview map's base map and bounding rectangle size
* Fixed positioning of the buttons at the bottom and the timeline component on mobile
* Added `hasLocalData` property to indicate when a catalog item contains local data. This property is used to determine whether the item can be shared or not.
* Fixed bug causing user added data to not be shared. Note that user added catalog item urls are now set at the user stratum rather than the definition stratum.
* Added the ability to filter location search results by an app-wide bounding box configuration parameter
* Re-introduce UI elements for search when a catalogSearchProvider is provided
* Fix bug that prevented live transport data from being hidden
* Hide opacity control for point-table catalog items.
* Fixed bug where `Catalog` would sometimes end up with an undefined `userAddedDataGroup`.
* Show About Data for all items by default.
* Fixed translation strings for the descriptive text about WMS and WFS URLs in the data catalogue.
* Fix bug that throws an error when clicking on ArcGIS Map Service features
* Fix initialisation of `terria`'s `shareDataService`.
* Support Zoom to Data on `CsvCatalogItem` when data has lat-lon columns.
* Add a trait called `showShadowUi` to `Cesium3DTilesCatalogItem` which hide shadows on workbench item UI.
* Re-added `ArcGisFeatureServerCatalogItem` and `ArcGisFeatureServerCatalogGroup`
* Prevent TerriaMap from crashing when timeline is on and changing to 2D
* Rewrite charts using `vx` svg charting library.
* Fixed bug causing `ArcGisFeatureServerCatalogItem` to throw an error when a token is included in the proxy url.
* Fix a bug for zooming to `ArcGisMapServerCatalogItem` layers
* Modified creation of catalog item from urls to set the item name to be the url at the defaults stratum rather than the definition stratum. This prevents actual item names at load strata from being overridden by a definition stratum name which is just a url.
* Fixed a bug causing highlighting of features with `_cesium3DTileFeature` to sometimes stop working. Also changed highlight colour to make it more visible.
* Fixed bug causing user added data with an auto-detected data type to not be shared properly.
* Modified `addToWorkbench` so that when a catalog item fails to load it is removed from the workbench and an error message is displayed.
* Add support for feature picking on region mapped datasets
* Revamp map buttons at top to support two menu configuration
* Viewer (2d/3d/3d-non-terrain) & basemap preferences are persisted to local storage again, and loaded back at startup
* Dramatically simplified map button styling (pre-styled-components)
* Allow DropdownPanel(InnerPanel) to show centered instead of offset toward the left
* Added AccessControlMixin for tracking access control of a given MagdaReference
* Add a legend title trait
* Show private or public dataset status on data catalog UI via AccessControlMixin
* Added `pointSizeMap` to `TableStyle` to allow point size to be scaled by value
* Added `isExperiencingIssues` to `CatalogMemberTraits`. When set to true, an alert is displayed above the catalog item description.
* Add gyroscope guidance
* Enable StyleSelectorSection workbench control for `WebMapServiceCatalogItem`
* New-new ui
* Add WIP help panes
* Added "Split Screen Mode" into workbench
* Moved excess workbench viewing controls into menu
* Updated bottom attribution styling
* Begin styled components themeing
* Make `clampToGround` default to true for `ArcGisFeatureServerCatalogItemTraits` to stop things from floating
* Add fix for `WebMapServiceCatalogItem` in `styleSelector` to prevent crash.
* Revert changes to `StyleSelectorSelection` component and refactor `WebMapServiceCatalogItem` styleSelector getter.
* Added a temporary fix for bug where a single model failing to load in `applyInitData` in `Terria` would cause other models in the same `initData` object to not load as well.
* Change gyroscope focus/hover behaviour to move buttons on hover
* Stop showing previewed item when catalog is closed
* Prevent `StoryPanel.jsx` from reloading magda references on move through story.
* Add google analytics to mobx
* Fixed google analytics on story panel
* Fixed path event name undefined labelling
* Enable zoomTo and splitter on `CartoMapCatalogItem`.
* Added name to `MapServerStratum` in `ArcGisMapServerCatalogItem`.
* Readded basic `CompositeCatalogItem`.
* Ported Augmented Reality features
* Fixed bug causing "Terrain hides underground features" checkbox to sometimes become out of sync between `SettingPanel` and `WorkbenchSplitScreen`.
* Ports the Filter by Location" feature for Satellite imagery. The property name setting is renamed to `timeFilterPropertyName` from `featureTimesProperty`.
* Made split screen window in workbench hidden when viewer is changed to 3D Smooth and 2D
* Tidy Help UI code
* Added `allowFeatureInfoRequests` property to `Terria` and prevent unnecessary feature info requests when creating `UserDrawing`s.
* Tidied up analytics port, fixed `getAncestors` & added `getPath` helper
* Updated upload icon to point upwards
* Prevent catalog item names from overflowing and pushing the collapse button off the workbench
* Stopped analytics launch event sending bad label
* Add .tsx tests for UI components
* Provide a fallback name for an `ArcGisServerCatalogItem`
* Ensure `CesiumTileLayer.getTileUrl` returns a string.
* Polished help UI to match designs
* Adds methods `removeModelReferences` to Terria & ViewState for unregistering and removing models from different parts of the UI.
* Add basic support for various error provider services, implementing support for Rollbar. 
* Add trait to enabling hiding legends for a `CatalogMember` in the workbench.
* Added new help menu item on how to navigate 3d data
* Add traits to customize color blending and highlight color for `Cesium3DTilesCatalogItem`
* Reimplemented splitting using `SplitItemReference`.
* Fix bug that caused contents on the video panel of the help UI to overlay the actual video
* Overhauled location search to be a dropdown instead of list of results
* Fixed bug causing full app crash or viewer zoom refresh when using 3D view and changing settings or changing the terrain provider.
* Implements `SensorObservationServiceCatalogItem`.
* Add support for styling CSVs using a region mapped or text columns.
* Update Compass UI to include larger rotation target, remove sass from compass
* Link Compass "help" button to `navigation` HelpPanelItem (requires generalisation later down the track)
* Improve keyboard traversal through right-hand-side map icon buttons
* Link Compass Gyroscope guidance footer text to `navigation` HelpPanelItem (requires generalisation later down the track)
* Removed hardcoded workbench & Panel button colours
* Ensure CSV column names are trimmed of whitespace.
* Really stop analytics launch event sending bad & now empty & now finally the real label
* Re-added `ArcGisMapServerCatalogGroup` and `ArcGisServerGroup`.
* Tidy Compass UI animations, styles, titles
* Bumped mobx minor to 4.15.x, mobx-react major to 6.x.x
* Add `dateFormat` trait to `TimeVaryingTraits` to allowing formatting of datestrings in workbench and bottomdock.
* Tidy Gyroscope Guidance positioning
* Fixed FeatureInfoPanel using old class state
* Fixed MapIconButton & FeedbackButton proptypes being defined incorrectly
* Implement SenapsLocationsCatalogItem
* Update papaparse and improve handling for retrieveing CSVs via chunking that have no ContentLenth header


### v7.11.17

* Moved strings in DateTimeSelector and FeatureInfoPanel into i18next translation file.

### v7.11.16

* Fixed a bug where the timeline would not update properly when the timeline panel was resized.

### v7.11.15

* Fixed a bug when clicking the expand button on a chart in feature info when the clicked feature was a polygon.

### v7.11.14

* Update CARTO Basemaps CDN URL and attribution.
* Fixed issue with node 12 & 14 introduced in Cesium upgrade.

### v7.11.13

* Upgraded to Cesium v1.73.
* Removed any references to `BingMapsApi` (now deprecated).

### v7.11.12

* Fixed a crash with GeoJsonCatalogItem when you set a `stroke-opacity` in `styles`.

### v7.11.11

* If `showIEMessage` is `true` in config.json, warn IE11 users that support is ending.

### v7.11.10

* Remove caching from TerriaJsonCatalogFunction requests.
* Upgraded minimum node-sass version to one that has binaries for node v14.

### v7.11.9

* Update Geoscience Australia Topo basemap.
* Remove caching from WPS requests.
* Fix entity outline alpha value when de-selecting a feature.

### v7.11.8

* Upgraded to terriajs-cesium v1.71.3 which fixes a bug running gulp tasks on node v14.

### v7.11.7

* Add additional region mapping boundaries.

### v7.11.6

* Rework the handling of point datasets on the anti-meridian when using LeafletJS.
* Fix indices in some translation strings including strings for descriptions of WMS and WMS service.
* Upgraded to Cesium v1.71.

### v7.11.5

* Added `GeoRssCatalogItem` for displaying GeoRSS files comming from rss2 and atom feeds.
* Bug fix: Prevent geojson files from appearing twice in the workbench when dropped with the .json extension
* Story related enhancements:
  * Added a title to story panel with ability to close story panel. 
  * Added a popup on remove all stories.
  * Added button for sharing stories.
  * Added a question popup on window close (if there are stories on the map so users don't lose their work).
* Pinned `html-to-react` to version 1.3.4 to avoid IE11 incompatibility with newer version of deep dependency `entities`. See https://github.com/fb55/entities/issues/209
* Added a `MapboxStyleCatalogItem` for showing Mapbox styles.
* Add a `tileErrorThresholdBeforeDisabling` parameter to `ImageryLayerCatalogItem` to allow a threshold to set for allowed number of tile failures before disabling the layer.

### v7.11.4

* Add support for `classBreaks` renderer to `ArcGisFeatureServerCatalogItem`.
* Upgraded to Cesium v1.68.
* Replace `defineProperties` and `freezeObject` to `Object.defineProperties` and `Object.freeze` respectively.
* Bumped travis build environment to node 10.
* Upgraded to `generate-terriajs-schema` to v1.5.0.

### v7.11.3

* Added babel dynamic import plugin for webpack builds.
* `ignoreUnknownTileErrors` will now also ignore HTTP 200 responses that are not proper images.

### v7.11.2

* Pass minimumLevel, in Cesium, to minNativeZoom, in Leaflet.
* Upgraded to Cesium v1.66.

### v7.11.1

* Fix for color of markers on the map associated with chart items

### v7.11.0

* Fix draggable workbench/story items with translation HOC
* Added first revision of "delta feature" for change detection of WMS catalog items which indicate `supportsDeltaComparison`
* Improve menu bar button hover/focus states when interacting with its panel contents
* Add ability to set opacity on `GeoJsonCatalogItem`
* Expanded test cases to ensure WorkbenchItem & Story have the correct order of components composed
* Fix broken catalog functions when used with translation HOC
* Fix bug with momentPoints chart type when plotting against series with null values
* Make the default `Legend` width a little smaller to account for the workbench scrollbar
* Bug fix for expanding chart - avoid creating marker where no lat lon exists.
* Add a `ChartDisclaimer` component to display an additional disclaimer above the chart panel in the bottom dock.
* Add `allowFeatureInfoRequests` property to `Terria` and prevent unnecessary feature info requests when creating `UserDrawing`s.
* Removes unsupported data that is drag and dropped from the workbench and user catalog.
* Adjusted z-index values so that the explorer panel is on top of the side panel and the notification window appears at the very top layer.
* Allow `CkanCatalogItem` names to be constructed from dataset and resource names where multiple resources are available for a single dataset
* Set the name of ArcGis MapServer CatalogGroup and CatalogItem on load
* Improve autodetecting WFS format, naming of the WFS catalog group and retaining the zoomToExtent
* Remove unnecessary nbsp; from chart download and expand buttons introduced through internationalization.
* Fix story prompt flag not being set after dismissing story, if `showFeaturePrompts` has been enabled

### v7.10.0

* Added proper basic internationalisation beginnings via i18next & react-i18next
* Fixed a bug where calling `openAddData()` or `closeCatalog()` on ViewState did not correctly apply the relevant `mobileViewOptions` for mobile views.
* Fixed filter by available dates on ImageryLayerCatalogItem not copying to the clone when the item is split.
* Fixed an error in `regionMapping.json` that causes some states to be mismatched when using Australian state codes in a column labelled "state". It is still recommended to use "ste", "ste_code" or "ste_code_2016" over "state" for column labels when matching against Australian state codes.
* Fixed bug where "User data" catalog did not have add-buttons.
* Added ability to re-add "User data" CSV items once removed from workbench.
* Changed catalog item event labels to include the full catalog item path, rather than just the catalog item name.
* Added support for `openAddData` option in config.json.  If true, the "Add Data" dialog is automatically opened at startup.
* Welcome message, in-app guides & new feature prompts are now disabled by default. These can be re-enabled by setting the `showWelcomeMessage`, `showInAppGuides` & `showFeaturePrompts` options in config.json.
* Updated Welcome Message to pass its props to `WelcomeMessagePrimaryBtnClick` & `WelcomeMessageSecondaryBtnClick` overrides
* Welcome message, in-app guides & new feature prompts are now disabled by default. These can be re-enabled by setting the `showWelcomeMessage`, `showInAppGuides` & `showFeaturePrompts` options in config.json.
* Updated Welcome Message to pass its props to `WelcomeMessagePrimaryBtnClick` & `WelcomeMessageSecondaryBtnClick` overrides.
* Fixed a bug in anti-meridian handling causing excessive memory use.
* Handled coordinate conversion for GeoJson geometries with an empty `coordinates` array.
* Fixed height of My Data drag and drop box in Safari and IE.

### v7.9.0

* Upgraded to Cesium v1.63.1. This upgrade may cause more problems than usual because Cesium has switched from AMD to ES6 modules. If you run into problems, please contact us: https://terria.io/contact

### v7.8.0

* Added ability to do in-app, "static guides" through `<Guide />`s
* Added in-app Guide for time enabled WMS items
* Initial implementation of language overrides to support setting custom text throughout the application.
* Added ability to pass `leafletUpdateInterval` to an `ImageryLayerCatalogItem` to throttle the number of requests made to a server.

### v7.7.0

* Added a quality slider for the 3D map to the Map panel, allowing control of Cesium's maximumScreenSpaceError and resolutionScale properties.
* Allowed MapboxMapCatalogItems to be specified in catalog files using type `mapbox-map`.
* We now use styles derived from `drawingInfo` from Esri Feature Services.
* Chart related enhancements:
  * Added momentPoints chart type to plot points along an available line chart.
  * Added zooming and panning on the chart panel.
  * Various preventative fixes to prevent chart crashes.
* Increased the tolerance for intermittent tile failures from time-varying raster layers. More failures will now be allowed before the layer is disabled.
* Sensor Observation Service `GetFeatureOfInterest` requests no longer erroneously include `temporalFilters`. Also improved the generated request XML to be more compliant with the specification.
* Fixed a bug where differences in available dates for `ImageryLayerCatalogItem` from original list of dates vs a new list of dates, would cause an error.
* Improved support for layers rendered across the anti-meridian in 2D (Leaflet).
* Fixed a crash when splitting a layer with a `momentPoints` chart item.
* Fixed a crash when the specified Web Map Service (WMS) layer could not be found in the `GetCapabilities` document and an alternate legend was not explicitly specified.

### v7.6.11

* Added a workaround for a bug in Google Chrome v76 and v77 that caused problems with sizing of the bottom dock, such as cutting off the timeline and flickering on and off over the map.
* Set cesium rendering resolution to CSS pixel resolution. This is required because Cesium renders in native device resolution since 1.61.0.

### v7.6.10

* Fixed error when opening a URL shared from an explorer tab. #3614
* Resolve a bug with `SdmxJsonCatalogItem`'s v2.0 where they were being redrawn when dimensions we're changed. #3659
* Upgrades terriajs-cesium to 1.61.0

### v7.6.9

* Automatically set `linkedWcsCoverage` on a WebMapServiceCatalogItem.

### v7.6.8

* Added ability in TerriaJsonCatalogFunction to handle long requests via HTTP:202 Accepted.

### v7.6.7

* Fixed share disclaimer to warn only when user has added items that cannot be shared.

### v7.6.6

* Basemaps are now loaded before being enabled & showed

### v7.6.5

* Add the filename to a workbench item from a drag'n'dropped file so it isn't undisplayed as 'Unnamed item'.
* Fixed inability to share SOS items.
* Added an option to the mobile menu to allow a story to be resumed after it is closed.
* The "Introducing Data Stories" prompt now only needs to be dismissed once. Previously it would continue to appear on every load until you clicked the "Story" button.
* Fixed a crash that could occur when the feature info panel has a chart but the selected feature has no chart data.
* Fixed a bug where the feature info panel would show information on a vector tile region mapped dataset that had no match.

### v7.6.4

* Add scrollbar to dropdown boxes.
* Add support for SDMX version 2.1 to existing `SdmxJsonCatalogItem`.
* Add a warning when sharing a map describing datasets which will be missing.
* Enable the story panel to be ordered to the front.
* Disable the autocomplete on the title field when adding a new scene to a story.
* Fix SED codes for regionmapping

### v7.6.3

* Fixed a bug with picking features that cross the anti-meridian in 2D mode .
* Fixed a bug where `ArcGisMapServerCatalogItem` legends were being created during search.
* Fixed a bug where region mapping would not accurately reflect share link parameters.

### v7.6.2

* Fixed a bug that made some input boxes unreadable in some web browsers.

### v7.6.1

* Fixed a bug that prevented the "Feedback" button from working correctly.
* Fix a bug that could cause a lot of extra space to the left of a chart on the feature info panel.

### v7.6.0

* Added video intro to building a story
* Allow vector tiles for region mapping to return 404 for empty tiles.

### v7.5.2

* Upgraded to Cesium v1.58.1.
* Charts are now shared in share & story links

### v7.5.1

* Fixed a bug in Cesium that prevented the new Bing Maps "on demand" basemaps from working on `https` sites.

### v7.5.0

* Added the "Story" feature for building and sharing guided tours of maps and data.
* Added sharing within the data catalog to share a given catalog group or item
* Switched to using the new "on demand" versions of the Bing Maps aerial and roads basemaps. The previous versions are deprecated.

### v7.4.1

* Remove dangling comma in `regionMapping.json`.
* `WebMapServicCatalogItem` now includes the current `style` in generated `GetLegendGraphic` URLs.

### v7.4.0

* Upgraded to Cesium v1.57.
* Fixed a bug where all available styles were being retrieved from a `GetCapabilities` for each layer within a WMS Group resulting in memory crashes on WMSs with many layers.
* Support State Electoral Districts 2018 and 2016 (SED_Code_2018, SED_Code_2016, SED_Name_2018, SED_Name_2016)

### v7.3.0

* Added `GltfCatalogItem` for displaying [glTF](https://www.khronos.org/gltf/) models on the 3D scene.
* Fixed a bug where the Map settings '2D' button activated '3D Smooth' view when configured without support for '3D Terrain'.
* Added `clampToTerrain` property to `GeoJsonCatalogItem`.
* When clicking a polygon in 3D Terrain mode, the white outline is now correctly shown on the terrain surface. Note that Internet Explorer 11 and old GPU hardware cannot support drawing the highlight on terrain, so it will not be drawn at all in these environments.

### v7.2.1

* Removed an extra close curly brace from `regionMapping.json`.

### v7.2.0

* Added `hideLayerAfterMinScaleDenominator` property to `WebMapServiceCatalogItem`. When true, TerriaJS will show a message and display nothing rather than silently show a scaled-up version of the layer when the user zooms in past the layer's advertised `MinScaleDenominator`.
* Added `GeoJsonParameterEditor`.
* Fixed a bug that resulted in blank titles for catalog groups loaded from automatically detected (WMS) servers
* Fixed a bug that caused some chart "Expand" options to be hidden.
* Added `CED_CODE18` and `CED_NAME18` region types to `regionMapping.json`. These are now the default for CSV files that reference `ced`, `ced_code` and `ced_name` (previously the 2016 versions were used).
* Improved support for WMTS, setting a maximum level to request tiles at.

### v7.1.0

* Support displaying availability for imagery layers on charts, by adding `"showOnChart": true" or clicking a button in the UI.
* Added a `featureTimesProperty` property to all `ImageryLayerCatalogItem`s. This is useful for datasets that do not have data for all locations at all times, such as daily sensor swaths of near-real-time or historical satellite imagery. The property specifies the name of a property returned by the layer's feature information query that indicates the times when data is available at that particular location. When this property is set, TerriaJS will display an interface on the workbench to allow the user to filter the times to only those times where data is available at a particular location. It will also display a button at the bottom of the Feature Information panel allowing the user to filter for the selected location.
* Added `disablePreview` option to all catalog items. This is useful when the preview map in the catalog will be slow to load.
* When using the splitter, the feature info panel will now show only the features on the clicked side of the splitter.
* Vector polygons and polylines are now higlighted when clicked.
* Fixed a bug that prevented catalog item split state (left/right/both) from being shared for CSV layers.
* Fixed a bug where the 3D globe would not immediately refresh when toggling between the "Terrain" and "Smooth" viewer modes.
* Fixed a bug that could cause the chart panel at the bottom to flicker on and off rapidly when there is an error loading chart data.
* Fixed map tool button positioning on small-screen devices when viewing time series layers.

### v7.0.2

* Fixed a bug that prevented billboard images from working on the 2D map.
* Implemented "Zoom To" support for KML, CZML, and other vector data sources.
* Upgraded to Cesium v1.55.

### v7.0.1

* Breaking Changes:
  * TerriaJS no longer supports Internet Explorer 9 or 10.
  * An application-level polyfill suite is now highly recommended, and it is required for Internet Explorer 11 compatibility. The easiest approach is to add `<script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>` to the `<head>` element of your application's HTML page, which will deliver a polyfill suite tailored to the end-user's browser.
  * TerriaJS now requires Node.js v8.0 or later.
  * TerriaJS now requires Webpack v4.0 or later.
  * TerriaJS now uses Gulp v4.0. If you have Gulp 3 installed globally, you'll need to use `npm run gulp` to run TerriaJS gulp tasks, or upgrade your global Gulp to v4 with `npm install -g gulp@4`.
  * TerriaJS now uses Babel v7.0.
  * Removed `UrthecastCatalogItem`, `UrthecastCatalogGroup`, and `registerUrthcastCatalogItems`. The Urthecast functionality was dependent on an npm package that hadn't been updated in three years and had potential security vulnerabilities. Please [let us know](https://gitter.im/TerriaJS/terriajs) if you were using this functionality.

### v6.5.0

* Add support for rendering Mapbox Vector Tiles (MVT) layers. Currently, polygons are the only supported geometry type, and all polygons are drawn with the same outline and fill colors.
* `wwwroot/data/regionMapping.json` is now the default region mapping file (rather than a file provided by TerriaMap), and needs to be explicitly overridden by a `regionMappingDefinitionsUrl` setting in config.json.

### v6.4.0

* The Feature Info panel can now be moved by clicking and dragging it.
* The map tool buttons are now arranged horizontally instead of vertically on small-screen mobile devices.
* When using a Web Map Service (WMS) catalog item with the `linkedWcsUrl` and `linkedWcsCoverage` properties, we now pass the selected WMS style to the Web Coverage Service (WCS) so that it can optionally return different information based on the selected style.
* Added `stationIdWhitelist` and `stationIdBlacklist` properties to `SensorObservationServiceCatalogItem` to allow filtering certain monitoring stations in/out.
* Fixed a bug that caused a crash when attempting to use a `style` attribute on an `<a>` tag in Markdown+HTML strings such as feature info templates.
* Fixed a bug that displaced the chart dropdown list on mobile Safari.

### v6.3.7

* Upgraded to Cesium v1.53.

### v6.3.6

* Dragging/dropping files now displays a more subtle notification rather than opening the large Add Data / My Data panel.
* The `sendFeedback` function can now be used to send additional information if the server is configured to receive it (i.e. `devserverconfig.json`).
* Made custom feedback controls stay in the lower-right corner of the map.
* Improved the look of the toolbar icons in the top right, and added an icon for the About page.

### v6.3.5

* Changed the title text for the new button next to "Add Data" on the workbench to "Load local/web data".
* Fixed a bug that caused the area to the right of the Terria log on the 2D map to be registered as a click on the logo instead of a click on the map.
* Fixed a bug that caused the standard "Give Feedback" button to fail to open the feedback panel.
* Swapped the positions of the group expand/collapse icon and the "Remove from catalogue" icon on the My Data panel, for more consistent alignment.
* Made notifications honor the `width` and `height` properties. Previously, these values were ignored.

### v6.3.4

* Added the ability to add custom components to the feedback area (lower right) of the user interface.

### v6.3.3

* Upgraded to Cesium v1.51.

### v6.3.2

* Added "filterByProcedures" property to "sos" item (default: true). When false, the list of procedures is not passed as a filter to GetFeatureOfInterest request, which works better for BoM Water Data Online services.

### v6.3.1

* Fixed a bug that caused the compass control to be misaligned in Internet Explorer 11.

### v6.3.0

* Changed the "My Data" interface to be much more intuitive and tweaked the visual style of the catalog.
* Added `CartoMapCatalogItem` to connect to layers using the [Carto Maps API](https://carto.com/developers/maps-api/).

## v6.2.3

* Made it possible to configure the compass control's colors using CSS.

### v6.2.2

* Removed the Terria logo from the preview map and made the credit there smaller.
* Fall back to the style name in the workbench styles dropdown when no title is given for a style in WMS GetCapabilities.

### v6.2.1

* We now use Cesium Ion for the Bing Maps basemaps, unless a `bingMapsKey` is provided in [config.json](https://docs.terria.io/guide/customizing/client-side-config/#parameters). You can control this behavior with the `useCesiumIonBingImagery` property. Please note that if a `bingMapsKey` is not provided, the Bing Maps geocoder will always return no results.
* Added a Terria logo in the lower left of the map. It can be disabled by setting `"hideTerriaLogo": true` in `config.json`.
* Improved the credits display on the 2D map to be more similar to the 3D credits.
* Fixed a bug that caused some legends to be missing or incomplete in Apple Safari.

### v6.2.0

* Added a simple WCS "clip and ship" functionality for WMS layers with corresponding a WCS endpoint and coverage.
* Fixed problems canceling drag-and-drop when using some web browsers.
* Fixed a bug that created a time period where no data is shown at the end of a time-varying CSV.
* Fixed a bug that could cause endless tile requests with certain types of incorrect server responses.
* Fixed a bug that could cause endless region tile requests when loading a CSV with a time column where none of the column values could actually be interpreted as a time.
* Added automatic retry with jittered, exponential backoff for tile requests that result in a 5xx HTTP status code. This is especially useful for servers that return 503 or 504 under load. Previously, TerriaJS would frequently disable the layer and hit the user with an error message when accessing such servers.
* Updated British National Grid transform in `Proj4Definitions` to a more accurate (~2 m) 7 parameter version https://epsg.io/27700.
* Distinguished between 3D Terrain and 3D Smooth in share links and init files.
* Upgraded to Cesium v1.50.

### v6.1.4

* Fixed a bug that could cause the workbench to appear narrower than expected on some systems, and the map to be off-center when collapsing the workbench on all systems.

### v6.1.3

* When clicking a `Split` button on the workbench, the new catalog item will no longer be attached to the timeline even if the original was. This avoids a confusing situation where both catalog items would be locked to the same time.
* Added KMZ to the whitelisted formats for `MagdaCatalogItem`.
* Fixed a bug that caused a crash when switching to 2D with vector data already on the map, including when visiting a share link with vector data when the map ends up being 2D.
* The "Hide Workbench" button is now attached to the side of the Workbench, instead of on the opposite side of the screen from it.

### v6.1.2

* Fixed a bug that prevented `BingMapsSearchProviderViewModel` and other uses of `loadJsonp` from working correctly.

### v6.1.1

* Upgraded to terriajs-server v2.7.4.

### v6.1.0

* The previous default terrain provider, STK World Terrain, has been deprecated by its provider. *To continue using terrain in your deployed applications, you _must_ obtain a Cesium Ion key and add it to `config.json`*. See https://cesium.com/ to create an Ion account. New options are available in `config.json` to configure terrain from Cesium Ion or from another source. See https://terria.io/Documentation/guide/customizing/client-side-config/#parameters for configuration details.
* Upgraded to Cesium v1.48.
* Added `Cesium3DTilesCatalogItem` for visualizing [Cesium 3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles) datasets.
* Added `IonImageryCatalogItem` for accessing imagery assets on [Cesium Ion](https://cesium.com/).
* Added support for Cesium Ion terrain assets to `CesiumTerrainProvider`. To use an asset from Ion, specify the `ionAssetId` and optionally the `ionAccessToken` and `ionServer` properties instead of specifying a `url`.
* Fixed a bug that could cause legends to be missing from `WebMapServiceCatalogItems` that had `isEnabled` set to true.

### v6.0.5

* Added `rel="noreferrer noopener"` to all `target="_blank"` links. This prevents the target page from being able to navigate the source tab to a new page.
* Fixed a bug that caused the order of items on the Workbench to change when visiting a share link.

### v6.0.4

* Changed `CesiumSelectionIndicator` to no longer use Knockout binding. This will avoid a problem in some environments, such as when a Content Security Policy (CSP) is in place.

### v6.0.3

* Fixed a bug that prevented users from being able to enter coordinates directly into catalog function point parameter fields.

### v6.0.2

* Fixed a bug that prevented interaction with the 3D map when the splitter was active.

### v6.0.1

* Added `parameters` property to `ArcGisMapServerCatalogItem`, allowing arbitrary parameters to be passed in tile and feature info requests.

### v6.0.0

* Breaking Changes:
   * An application-level polyfill suite is now required for Internet Explorer 9 and 10 compatibility. The easiest approach is to add `<script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>` to the `<head>` element of your application's HTML page.
   * In TerriaJS v7.0.0 (the _next_ major release), a polyfill suite may be required for Internet Explorer 11 as well. Adopting the approach above now will ensure you don't need to worry about it then.
* Overhauled support for printing. There is now a Print button on the Share panel that will provide a much better printable form of the map than the browser's built-in print feature. If a user uses the browser's print button instead, a message at the top will suggest using the TerriaJS Print feature and open the Share panel. Calling `window.print` (e.g. on a TerriaJS instance inside an iframe) will invoke the new TerriaJS print feature directly.
* Fixed a bug that caused `Leaflet.captureScreenshot` to show all layers on both sides even with the splitter active.
* Fixed a bug that prevented some vector features from appearing in `Leaflet.captureScreenshot`.
* Added ability to move the splitter thumb position vertically so that users can move it to prevent occlusions.
* Added `TerriaJsonCatalogFunction`. This catalog function allows an arbitrary HTTP GET to be invoked with user-provided parameters and return TerriaJS catalog JSON.
* Fixed a bug that could cause the feature info panel to sometimes be nearly transparent in Internet Explorer 11.
* Fixed a bug that caused an expanded preview chart's workbench item to erroneously show the date picker.
* Updated `MagdaCatalogItem` to match Magda project

### 5.7.0

* Added `MagdaCatalogItem` to load details of a catalog item from [Magda](https://github.com/TerriaJS/magda).
* Fixed a bug that could cause a time-dynamic WMS layer to fail to ever show up on the map if the initial time on the timeline was outside the intervals where the layer had data.
* Fixed a bug which could cause a crash during load from share link when the layer default is to not `useOwnClock` but the share link has `useOwnClock` set.
* Fixed an issue that caused a 'This data source is already shown' error in particular circumstances.

### 5.6.4

* Fixed a bug causing an error message when adding tabular data to the workbench before it was loaded.

### 5.6.3

* Display of Lat Lon changed from 3 deciml places to 5 decimal places - just over 1m precision at equator.
* Fixed a bug that caused the timeline to appear when changing the time on the workbench for a layer not attached to the timeline.
* The workbench date/time picker is now available for time varying point and region CSVs.
* Fixed a bug that caused the workbench date picker controls to disappear when the item was attached to the timeline and the timeline's current time was outside the valid range for the item.

### 5.6.2

* Renamed search marker to location marker.
* Added the clicked coordinates to the bottom of the feature info panel. Clicking the marker icon will cause the location to be indicated on the map.
* The location marker is now included in shared map views.
* Fixed a bug that could cause split WMS layers to show the incorrect layer data for the date shown in the workbench.
* Refactored current time handling for `CatalogItem` to reduce the complexity and number of duplicated current time states.
* Fixed feature info updating when the time is changed from the workbench for `TableCatalogItem`.
* Change the workbench catalog item date picker so that updating the date does not disable the timeslider.
* Fix a bug that meant that, when the current time was updated on an `ImageryCatalogItem` while the layer wasn't shown, the old time was still shown when the layer was re-enabled.
* Added `{{terria.currentTime}}` to feature info template.
* Added a way to format times within a feature info tempate. E.g. `{{#terria.formatDateTime}}{"format": "dd-mm-yyyy HH:MM:ss"}{{terria.currentTime}}{{/terria.formatDateTime}}`.
* Fixed a bug that caused the selection indicator to float strangely when visiting a share link with a selected feature.
* Fixed a bug that caused a region to be selected even when clicking on a hole in that region.
* Fixed a bug that prevented the selection indicator from following moving features on the 2D map.
* Fixed a bug that caused Leaflet to stop rendering further points in a layer and throw errors when calculating extent when one point had invalid characters in the latitude or longitude field.
* We now default to `autoPlay: false` if it's not specified in `config.json`.
* Changed search box placeholders to more precisely reflect their functionality.
* CartoDB basemaps are now always loaded over HTTPS.

### 5.6.1

* Fixed a bug that could cause the workbench UI to hang when toggling concepts, particularly for an `SdmxJsonCatalogItem`.
* Added previous and next buttons to workbench catalog item date picker.

### 5.6.0

* Upgraded to Cesium 1.41.

### 5.5.7

* Added support for using tokens to access WMS layers, particularly using the WMS interface to ArcGIS servers.

### 5.5.6

* Tweaked the sizing of the feature info panel.
* Fixed a bug that caused `ArcGisMapServerCatalogItem` to always use the server's single fused map cache, if available. Now, if the `layers` property is specified, we request individual dynamic layers and ignore the fused map cache.

### 5.5.5

* Fixed a bug that caused the feature info panel to stop working after clicking on a location search marker.
* Added support for ArcGIS tokens on the 2D map. Previously, tokens only worked reliably in 3D.
* Improved handling of tile errors, making it more consistent between 2D and 3D.
* Fixed a bug that prevented the Add Data button from working Internet Explorer 9 unless the DevTools were also open.
* Improved the sizing of the feature info panel so it is less likely to completely obscure the map.

### 5.5.4

* Fixed a serious bug that prevented opening the Data Catalog in Internet Explorer.
* Fixed some problems with the Terria Spatial Analytics `CatalogFunctions`.

### 5.5.3

* Fixed a bug in SDMX-JSON when using `cannotSum`.

### 5.5.2

* Deprecated SDMX-JSON catalog items' `cannotDisplayPercentMap` in favour of `cannotSum`.
* Updated `cannotSum` so that it does not display a total in some cases, as well as suppressing the regional-percentage checkbox.  `cannotSum` can be either a mapping of concept ids to the values that prevent summing, or simply `true` to always prevent summing.
* Fixed a bug that caused an error when Splitting a layer that does not have a `clock`.

### 5.5.1

* Added `cannotDisplayPercentMap` to SDMX-JSON catalog items, to optionally turn off the "display as a percentage of regional total" checkbox when the data is not a count (eg. a rate or an average).

### 5.5.0

* Added the ability to split the screen into a left-side and right-side, and show raster and region mapped layers on only one side of the splitter.
* Added the ability to use a tabbed catalog in the explorer panel on desktop site. Setting `tabbedCatalog` parameter to `true` in `config.json` causes top-level groups in the catalog to list items in separate explorer panel tabs.
* Added the ability to use vector tile properties in feature info templates when using region mapping (data row attributes will overwrite vector tile properties with the same name)
* Properties available in feature info templates are now JSON parsed and replaced by their javascript object if they start with `[` or `{` and parse successfully
* Decreased flickering of time-varying region mapped layers by pre-rendering the next time interval.
* Fixed a bug in `WebMapServiceCatalogItem` that could cause a WMS time time dimension to be interpreted incorrectly if it was specified only using dates (not times) and with a periodicity of less than a day.

### 5.4.5

* Improved behaviour of SDMX-JSON items when no data is available.

### 5.4.4

* Added support for specifying namespaced layer names in the `WebMapServiceCatalogItem` `layers` property.
* Made TerriaJS tolerant of XML/HTML inside text elements in WMS GetCapabilities without being properly wrapped in `CDATA`.

### 5.4.3

* Fixed a build problem on case-sensitive file systems (e.g. most Linux systems).

### 5.4.2

* We no longer show the Zoom To button on the workbench when there is no rectangle to zoom to.

### 5.4.1

* Fixed a bug when sharing SDMX-JSON catalog items.
* Improved display of "Add Data" panel on small screens when Feedback and Feature Info panels are open.
* Added "search in data catalog" link to mobile search.
* Added a button to automatically copy share url into clipboard in share panel.
* Added `initFragmentPaths` property to the `parameters` section of `config.json`.  It can be used to specify an array of base paths for resolving init fragments in the URL.
* Modified `CkanCatalogItem` to exclude files that advertise themselves as KML files but have the file extension .ZIP.
* Removed "View full size image" link on the share panel.  Chrome 60 removed the ability to navigate to a data URI, and other browsers are expected to follow this lead.

### 5.4.0

* Breaking change: removed some old types that haven't been used since the new React-based user interface in v4.0.0, specifically `KnockoutHammerBinding`, `KnockoutMarkdownBinding`, `PopupMessageConfirmationViewModel`, `PopupMessageViewModel`, and `PopupViewModel`.
* Added the ability to use tokens from terriajs-server for layers requiring ESRI tokens.
* Catalog group items are now sorted by their in-catalog name

### 5.3.0

* Added the ability to use the analytics region picker with vector tile region mapping by specifiying a WMS server & layer for analytics only.
* Updated the client side validation to use the server-provided file size limit when drag/dropping a file requiring the conversion service.
* `zoomOnEnable` now works even for a catalog item that is initially enabled in the catalog.  Previously, it only worked for catalog items enabled via the user interface or otherwise outside of the load process.
* Added `initialTimeSource` property to `CsvCatalogItem` so it is possible to specify the value of the animation timeline at start from init files.
* Added to documentation for customizing data appearance.
* Added `CatalogShortcut` for creating tool items for linking to a `CatalogItem`.
* Renamed `ViewState.viewCatalogItem()` to `viewCatalogMember` to reflect that it can be used for all `CatalogMembers`, not just `CatalogItems`.
* Fixed a bug that could cause a crash when switching to 2D when the `initialView` was just a `Rectangle` instead of a `CameraView`.
* Fixed a bug that caused multiple layers with generated, gradient legends to all show the same legend on the Workbench.

### 5.2.11

* Pinned `urijs` to v1.18.10 to work around a breaking change in v1.18.11.

### 5.2.10

* Improved the conversion of Esri polygons to GeoJSON by `featureDataToGeoJson`.  It now correctly handles polygons with holes and with multiple outer rings.
* Added some fields to the dataset info page for `CkanCatalogItem`.
* Fixed a bug that could cause some layers, especially the Bing Maps basemap, to occasionally be missing from the 2D map.
* Fixed a bug that could cause the selected time to move to the end time when sharing a map with a time-dynamic layer.

### 5.2.9

* A catalog item's `cacheDuration` property now takes precedence over the cache duration specified by the code.  Previously, the `cacheDuration` would only override the default duration (2 weeks).

### 5.2.8

* Added option to expand the HTML embed code and toggle URL shorting for the share link.
* The Share feature now includes the current time selected on the timeline, so that anyone visiting a share link will see the map at the intended time.

### 5.2.7

* Added the Latitude and Longitude to the filename for the Feature Information file download.
* Added the time to the timeline labels when zoomed in to a single day. Previously, the label sometimes only showed the date.

### 5.2.6

* Added the ability to disable the conversion service so that no user data is sent outside of the client by setting `conversionServiceBaseUrl` to `false` in the `parameters` section of `config.json`.
* Added the ability to disable the location button by setting `disableMyLocation` to `true` in the `parameters` section of `config.json`.
* Fixed a bug that caused the share functionality to fail (both screenshot and share link) in 2d mode.
* Fixed a bug with explicitly styled enum columns in Internet Explorer.
* Fixed a bug that caused the selected column in a csv to be the second column when a time column is present.

### 5.2.5

* Fixed a bug with `forceProxy: true` which meant that vector tiles would try, and fail, to load over the proxy.
* Added documentation for customizing data appearance, and folded in existing but orphaned documentation for creating feature info templates.
* Changed the LocateMe button so that it toggles and continuously updates the location when Augmented Reality is enabled.
* Added the ability to set SDMX-JSON region names from a region type dimension, using a Mustache template. This was required so regions can be mapped to specific years, even if not specified by the SDMX-JSON server.
* Added `viewermode` to the users persistent local storage to remember the last `ViewerMode` used.
* Added the ability to customize the preamble text on the feedback form ("We would love to hear from you!") by setting `feedbackPreamble` in the `parameters` section of `config.json`.

### 5.2.4

* Fixed a bug that prevented error messages, such as when a dataset fails to load, from being shown to the user. Instead, the errors were silently ignored.

### 5.2.3

* Fixed a bug that gave expanded Sensor Observation Service charts poor names.
* Fixed a bug that prevented some table-based datasets from loading.

### 5.2.2

* Fixed download of selected dataset (as csv) so that quotes are handled in accordance with https://tools.ietf.org/html/rfc4180. As a result, more such downloads can be directly re-loaded in Terria by dragging and dropping them.

### 5.2.1

* Changed the default opacity for points from CSV files without a value column to 1.0 (previously it was 0.6).  This is a workaround for a Cesium bug (https://github.com/AnalyticalGraphicsInc/cesium/issues/5307) but really a better choice anyway.
* Fixed a bug which meant non-standard properties of some table data sources (eg. csv, SOS, SDMX-JSON) were missing in the feature info panel, because of a breaking change in Cesium 1.33.

### 5.2.0

* Fixed a bug that caused layer disclaimers to fail to appear when the layer was enabled via a share link.  Since the user was unable to accept the disclaimer, the layer also failed to appear.
* Added `AugmentedVirtuality` (user facing feature name Augmented Reality) to allow users to use their mobile device's orientation to set the camera view.
* Added the `showFeaturesAtAllTimes` option to Sensor Observation Service items. This improves the user experience if the server returns
  some features starting in 1990, say, and some starting in 1995, so that the latter still appear (as grey points with no data) in 1990.
* Fixed a bug that prevented preview charts in the feature info panel from updating when the user changed the Sensor Observation Service frequency.
* Fixed a bug that allowed the user to de-select all the display choices for Sensor Observation Service items.
* Improved the appearance of charts where all the y-values are null. (It now shows "No preview available".)
* Upgraded to Leaflet 1.0.3 for the 2D and preview maps.
* Upgraded to [Cesium 1.33](https://github.com/AnalyticalGraphicsInc/cesium/blob/1.33/CHANGES.md) for the 3D view.

### 5.1.1

* Fixed a bug that caused an 'added' and a 'shown' event for "Unnamed Item" to be logged to Google Analytics when previewing an item in the catalog.
* Added a 'preview' Google Analytics event when a catalog item is shown on the preview map in the catalog.
* Fixed a bug that prevented csv files with missing dates from loading.
* Fixed a bug that could cause an error when adding a layer without previewing it first.

### 5.1.0

* Fixed a bug that prevented `WebMapServiceCatalogItem` from acting as a time-dynamic layer when the time dimension was inherited from a parent layer.
* `WebMapServiceCatalogItem` now supports WMS 1.1.1 style dimensions (with an `Extent` element) in addition to the 1.3.0 style (`Dimension` only).
* `WebMapServiceCatalogItem` now passes dates only (rather than dates and times) to the server when the TIME dimension uses the `start/stop/period` form, `start` is a date only, and `period` does not include hours, minutes, or seconds.
* `WebMapServiceCatalogItem` now supports years and months (in addition to days, hours, minutes, and seconds) in the period specified of a TIME dimension.
* `WebMapServiceCatalogItem` now ignores [leap seconds](https://en.wikipedia.org/wiki/Leap_second) when evaluating ISO8601 periods in a time dimension.  As a result, 2 hours after `2016-06-30T23:00:00Z` is now `2016-07-01T01:00:00Z` instead of `2016-07-01T00:59:59Z` even though a leap second at the end of June 2016 makes that technically 2 hours and 1 second.  We expect that this is more likely to align with the expectations of WMS server software.
* Added option to specify `mobileDefaultViewerMode` in the `parameters` section of `config.json` to specify the default view mode when running on a mobile platform.
* Added support for `itemProperties` to `CswCatalogGroup`.
* Added `terria.urlEncode` function for use in feature info templates.
* Fixed a layout problem that caused the coordinates on the location bar to be displayed below the bar itself in Internet Explorer 11.
* Updated syntax to remove deprecation warnings with React version 15.5.

### 5.0.1

* Breaking changes:
  * Starting with this release, TerriaJS is meant to be built with Webpack 2.  The best way to upgrade your application is to merge from [TerriaMap](https://github.com/TerriaJS/TerriaMap).  If you run into trouble, post a message on the [TerriaJS forum](https://groups.google.com/forum/#!forum/terriajs).
  * Removed the following previously-deprecated modules: `registerKnockoutBindings` (no replacement), `AsyncFunctionResultCatalogItem` (now `ResultPendingCatalogItem`), `PlacesLikeMeFunction` (now `PlacesLikeMeCatalogFunction`), `SpatialDetailingFunction` (now `SpatialDetailingCatalogFunction`), and `WhyAmISpecialFunction` (now `WhyAmISpecialCatalogFunction`).
  * Removed `lib/Sass/StandardUserInterface.scss`.  It is no longer necessary to include this in your application.
  * Removed the previously-deprecated third pararameter, `getColorCallback`, of `DisplayVariablesConcept`.  Pass it inside the `options` parameter instead.
  * Removed the following previously-deprecated properties from `TableColumn`: `indicesIntoUniqueValues` (use `uniqueValues`), `indicesOrValues` (use `values`), `indicesOrNumericalValues` (use `uniqueValues` or `numericalValues`), and `usesIndicesIntoUniqueValues` (use `isEnum`).
  * Removed the previously-deprecated `dataSetID` property from `AbsIttCatalogItem`.  Use `datasetId` instead.
  * Removed the previously-deprecated `allowGroups` property from `CkanCatalogItem`.   Use `allowWmsGroups` or `allowWfsGroups` instead.
  * Removed the previously-deprecated `RegionMapping.setRegionColumnType` function.  Use the `setRegionColumnType` on an _instance_ of `RegionMapping` instead.
  * Removed the previously-deprecated `regionMapping.regionDetails[].column` and `.disambigColumn`. Use `.columnName` and `.disambigColumnName` instead.
  * Removed the previously-deprecated `options.regionMappingDefinitionsUrl` parameter from the `Terria` constructor.  Set the `regionMappingDefinitionsUrl` inside `parameters` in `config.json` instead.
* Fixed a bug in `WebMapServiceCatalogItem` that prevented TerriaJS from correctly determining the projections supported by a WMS layer when supported projections are inherited from parent layers.
* Changed "no value" colour of region-mapped data to fully transparent, not black.
* Fixed an issue where expanding a chart from an SDMX-JSON or SOS feature twice, with different data choices selected, would overwrite the previous chart.
* Improved SDMX-JSON items to still show properly, even if the `selectedInitially` property is invalid.
* Added `Score` column to `GNAFAddressGeocoder` to indicate relative quality, which maps as default variable.

### 4.10.5

* Improved error message when accessing the user's location under http with Chrome.
* When searching locations, the button to instead search the catalog is now above the results instead of below them.
* Changed "go to full screen mode" tooltip to "Hide workbench", and "Exit Full Screen" button to "Show Workbench".  The term "full screen" was misleading.
* Fixed a bug where a chartable (non-geo-spatial) CSV file with a column including the text "height" would not let the user choose the "height" column as the y-axis of a chart.
* Added support for non-default x-axes for charts via `<chart x-column="x">` and the new `tableStyle.xAxis` parameter.
* Added support for a `charSet` parameter on CSV catalog items, which overrides the server's mime-type if present.

### 4.10.4

* Added the ability for `CkanCatalogGroup` to receive results in pages, rather than all in one request.  This will happen automatically when the server returns partial results.
* Improved the performance of the catalog UI by not creating React elements for the contents of a group until that group is opened.
* Close polygons used as input to a `CatalogFunction` by making the last position the same as the first one.
* Added support for a new `nameInCatalog` property on all catalog members which overrides `name` when displayed in the catalog, if present.
* Added `terria.urlEncodeComponent` function for use in feature info templates.
* `yAxisMin` and `yAxisMax` are now honored when multiple charts are active, by using the minimum `yAxisMin` and the maximum `yAxisMax` of all charts.

### 4.10.3

* Locked third-party dependency proj4 to v2.3.x because v2.4.0 breaks our build.

### 4.10.2

* New sections are now merged info `CatalogMember.info` when `updateFromJson` is called multiple times, rather than the later `info` completely replacing the earlier one.  This is most useful when using `itemProperties` to override some of the info sections in a child catalog item.
* Fixed a bug where csv files with a date column would sometimes fail if a date is missing.

### 4.10.1

* Improved the SDMX-JSON catalog item to handle huge dimensions, allow a blacklist, handle bad responses better, and more.
* Fixed a bug that prevented the proxy from being used for loading legends, even in situations where it is necessary such as an `http` legend accessed from an `https` site.
* Added link to re-download local files, noting that TerriaJS may have done additional processing (eg. geocoding).

### 4.10.0

* Changed defaults:
  * `WebProcessingServiceCatalogFunction` now defaults to invoking the `Execute` service via an HTTP POST with XML encoding rather than an HTTP GET with KVP encoding.  This is a more sensible default because the WPS specification requires that servers support POST/XML while GET/KVP is optional.  Plus, POST/XML allows large input parameters, such as a polygon descibing all of Australia, to be successfully passed to the WPS process.  To force use of GET/KVP, set the `executeWithHttpGet` property to `true`.
* Fixed problems with third-party dependencies causing `npm install` and `npm run gulp` to fail.

### 4.9.0

* Added a help overlay system. A TerriaJS application can define a set of help sequences that interactively walk the user through a task, such as adding data to the map or changing map settings. The help sequences usually appear as a drop-down Help menu in the top-right corner.
* Fixed a bug with calculating bounding rectangles in `ArcGisCatalogItem` caused by changes to `proj4` package.
* Fixed a bug preventing chart axis labels from being visible on a white background.
* Fixed a bug that caused the Feedback panel to appear below the chart panel, making it difficult to use.

### 4.8.2

* Fixed a bug that prevented a `shareUrl` specified in `config.json` from actually being used by the `ShareDataService`.
* Adding a JSON init file by dropping it on the map or selecting it from the My Data tab no longer adds an entry to the Workbench and My Data catalog.
* WPS return type can now be `application/vnd.terriajs.catalog-member+json` which allows a json catalog member to be returned in WPS along with the usual attributes to control display.
* `chartLineColor` tableStyle attribute added, allowing per column specification of chart line color.
* Fixed a bug that caused a `WebMapServiceCatalogItem` inside a `WebMapServiceCatalogGroup` to revert to defaults from GetCapabilities instead of using shared properties.
* Fix a bug that prevented drawing the marker and zooming to the point when searching for a location in 2D.
* Fixed a bug where `WebMapTileServiceCatalogItem` would incorrectly interpret a bounding box and return only the lower left corner causing Cesium to crash on render.
* Fixed a bug that caused the feedback form to be submitted when unchecking "Share my map view".

### 4.8.1

* `CkanCatalogGroup` now automatically adds the type of the resource (e.g. `(WMS)`) after the name when a dataset contains multiple resources that can be turned into catalog items and `useResourceName` is false.
* Added support for ArcGIS FeatureServers to `CkanCatalogGroup` and `CkanCatalogItem`.  In order for `CkanCatalogGroup` to include FeatureServers, `includeEsriFeatureServer` must be set to true.
* Changed default URL for the share service from `/share` to `share` and made it configurable by specifying `shareUrl` in config.json.  This helps with deployments in subdirectories.

### 4.8.0

* Fixed a bug that prevented downloading data from the chart panel if the map was started in 2D mode.
* Changed the default opacity of table data to 0.8 from 0.6.
* Added the ability to read dates in the format "2017-Q2".
* Improved support for SDMX-JSON, including showing values as a percent of regional totals, showing the selected conditions in a more concise format, and fixing some bugs.
* Updated `TableCatalogItem`s to show a download URL in About This Dataset, which downloads the entire dataset as csv, even if the original data was more complex (eg. from an API).
* The icon specified to the `MenuPanel` / `DropdownPanel` theme can now be either the identifier of an icon from `Icon.GLYPHS` or an actual SVG `require`'d via the `svg-sprite-loader`.
* Fixed a bug that caused time-varying points from a CSV file to leave a trail on the 2D map.
* Add `Terria.filterStartDataCallback`.  This callback gives an application the opportunity to modify start (share) data supplied in a URL before TerriaJS loads it.
* Reduced the size of the initial TerriaJS JavaScript code by about 30% when starting in 2D mode.
* Upgraded to [Cesium 1.29](https://github.com/AnalyticalGraphicsInc/cesium/blob/1.29/CHANGES.md).

### 4.7.4

* Renamed `SpatialDetailingFunction`, `WhyAmISpecialFunction`, and `PlacesLikeMeFunction` to `SpatialDetailingCatalogFunction`, `WhyAmISpecialCatalogFunction`, and `PlacesLikeMeCatalogFunction`, respectively.  The old names will be removed in a future release.
* Fixed incorrect tooltip text for the Share button.
* Improved the build process and content of the user guide documentation.

### 4.7.3

* Canceled pending tile requests when removing a layer from the 2D map.  This should drastically improve the responsiveness when dragging the time slider of a time-dynamic layer in 2D mode.
* Added the data source and data service details to the "About this dataset" (preview) panel.
* Fixed a bug introduced in 4.7.2 which made the Feature Info panel background too pale.

### 4.7.2

* Updated GNAF API to new Lucene-based backend, which should improve performance.
* Updated custom `<chart>` tag to allow a `colors` attribute, containing comma separated css strings (one per column), allowing users to customize chart colors. The `colors` attribute in charts can also be passed through from a WPS ComplexData response.
* Updated styling of Give Feedback form.
* Improved consistency of "Search" and "Add Data" font sizes.
* Improved flexibility of Feature Info Panel styling.
* Fixed a bug that could cause an extra `/` to be added to end of URLs by `ArcGisMapServerCatalogItem`, causing some servers to reject the request.
* Added a workaround for a bug in Internet Explorer 11 on Windows 7 that could cause the user interface to hang.

### 4.7.1

* Fixed a bug where providing feedback did not properly share the map view.
* Updated to terriajs-server 2.6.2.
* Fixed a bug leading to oversized graphics being displayed from WPS calls.

### 4.7.0

* Added the ability for users to share their view of the map when providing feedback.
* Extra components can now be added to FeatureInfoSection.
* Updated "Download Data" in FeatureInfoSection to "Download Data for this Feature".
* Fixed the color of visited links in client apps with their own css variables.
* Fixed a bug that prevented the scale bar from displaying correctly.

### 4.6.1

* Added support for creating custom WPS types, and for reusing `Point`, `Polygon`, and `Region` editors in custom types.
* Fixed a bug that caused the legend to be missing for WMS catalog items where the legend came from GetCapabilities but the URL did not contain `GetLegendGraphic`.

### 4.6.0

* Changed defaults:
  * The `clipToRectangle` property of raster catalog items (`WebMapServiceCatalogItem`, `ArcGisMapServerCatalogItem`, etc.) now defaults to `true`.  It was `false` in previous releases.  Using `false` prevents features (especially point features) right at the edge of the layer's rectangle from being cut off when the server reports too tight a rectangle, but also causes the layer to load much more slowly in many cases.  Starting in this version, we favour performance and the much more common case that the rectangle can be trusted.
* Made `WebMapServiceCatalogItem` tolerant of a `GetCapabilities` where a `LegendURL` element does not have an `OnlineResource` or a `Dimension` does not have any values.
* Added support for 'Long' type hint to CSV data for specifying longitude.
* The marker indicating the location of a search result is now placed correctly on the terrain surface.
* `CatalogFunction` region parameters are now selected on the main map rather than the preview map.
* Some regions that were previously not selectable in Analytics, except via autocomplete, are now selectable.
* Added hover text that shows the position of data catalog search results in the full catalog.
* Widened scrollbars and improve their contrast.
* Removed the default maximum number of 10 results when searching the data catalog.
* Allow users to browse for JSON configuration files when adding "Local Data".
* Made it easier to use custom fonts and colors in applications built on TerriaJS, via new SCSS variables.
* Fixed a bug that caused a `CswCatalogGroup` to fail to load if the server had a `references` element without a `protocol`.

### 4.5.1

* The order of the legend for an `ArcGisMapServerCatalogItem` now matches the order used by ArcGIS itself.
* Large legends are now scaled down to fit within the width of the workbench panel.
* Improved the styling of links inside the Feature Information panel.
* Fixed a bug that could cause the Feature Information panel's close button to initially appear in the wrong place, and then jump to the right place when moving the mouse near it.

### 4.5.0

* Added support for the Sensor Observation Service format, via the `SensorObservationServiceCatalogItem`.
* Added support for end date columns in CSV data (automatic with column names containing `end_date`, `end date`, `end_time`, `end time`; or set in json file using `isEndDate` in `tableStyle.columns`.
* Fixed calculation of end dates for moving-point CSV files, which could lead to points disappearing periodically.
* Fixed a bug that prevented fractional seconds in time-varying WMS periodicity.
* Added the ability to the workbench UI to select the `style` to use to display a Web Map Service (WMS) layer when multiple styles are available.
* Added the ability to the workbench UI to select from among the available dimensions of a Web Map Service (WMS) layer.
* Improved the error reporting and handling when specifying invalid values for the WMS COLORSCALERANGE parameter in the UI.
* Added the ability to drag existing points when creating a `UserDrawing`.
* Fixed a bug that could cause nonsensical legends for CSV columns with all null values.
* Fixed a bug that prevented the Share panel from being used at all if the URL shortening service encountered an error.
* Fixed a bug that could cause an error when adding multiple catalog items to the map quickly.
* Tweaked the z-order of the window that appears when hovering over a chart series, so that it does not appear on top of the Feature Information panel.
* Fixed a bug that could lead to incorrect colors in a legend for a CSV file with explicit `colorBins` and cut off at a minimum and maximum.
* We now show the feature info panel the first time a dataset is added, containing a suggestion to click the map to learn more about a location.  Also improved the wording for the feature info panel when there is no data.
* Fixed support for time-varying feature info for vector tile based region mapping.
* `updateApplicationOnMessageFromParentWindow` now also allows messages from the `opener` window, i.e. the window that opened the page by calling `window.open`.  The parent or opener may now also send a message with an `allowOrigin` property to specify an origin that should be allowed to post messages.
* Fixed a bug that prevented charts from loading http urls from https.
* The `isNcWMS` property of `WebMapServiceCatalogItem` is now set to true, and the COLORSCALERANGE controls are available in the UI, for ncWMS2 servers.
* Added the ability to prevent CSVs with time and `id` columns from appearing as moving points, by setting `idColumns` to either `null` or `[]`.
* Fixed a bug that prevented default parameters to `CatalogFunction`s from being shown in the user interface.
* Fixed a problem that made `BooleanParameter`s show up incorrectly in the user interface.
* Embedded `<chart>` elements now support two new optional attributes:
   * `title`: overrides the title that would otherwise be derived from the name of the feature.
   * `hide-buttons`: If `"true"`, the Expand and Download buttons are hidden from the chart.
* Fixed a bug in embedded `<collapsible>` elements that prevented them from being expandable.
* Improved SDMX-JSON support to make it possible to change region type in the UI.
* Deprecated `RegionMapping.setRegionColumnType` in favour of `RegionMapping.prototype.setRegionColumnType`. `regionDetails[].column` and `.disambigColumn` have also been deprecated.

### 4.4.1

* Improved feature info display of time-varying region-mapped csvs, so that chart is still shown at times with no data.
* Fix visual hierarchy of groups and items in the catalog.

### 4.4.0

* Fixed a bug that caused Cesium (3D view) to crash when plotting a CSV with non-numerical data in the depth column.
* Added automatic time-series charts of attributes to the feature info of time-varying region-mapped csvs.
* Refactored Csv, AbsItt and Sdmx-Json catalog items to depend on a common `TableCatalogItem`. Deprecated `CsvCatalogItem.setActiveTimeColumn` in favour of `tableStructure.setActiveTimeColumn`.
* Error in geocoding addresses in csv files now shows in dialog box.
* Fixed CSS styling of the timeline and added padding to the feature info panel.
* Enhanced JSON support to recognise JSON5 format for user-added files.
* Deprecated `indicesIntoUniqueValues`, `indicesOrValues`, `indicesOrNumericalValues` and `usesIndicesIntoUniqueValues` in `TableColumn` (`isEnum` replaces `usesIndicesIntoUniqueValues`).
* Added support for explicitly colouring enum columns using a `tableStyle.colorBins` array of `{"value":v, "color":c}` objects
* Improved rendering speed when changing the display variable for large lat/lon csv files.
* Default to moving feature CSVs if a time, latitude, longitude and a column named `id` are present.
* Fixed a bug so units flow through to charts of moving CSV features.
* Fixed a bug that prevented the `contextItem` of a `CatalogFunction` from showing during location selection.
* Fixed a bug that caused `&amp;` to appear in some URLs instead of simply `&`, leading to an error when visiting the link.
* Added the ability to pass a LineString to a Web Processing Service.
* Fixed a bug that prevented `tableStyle.dataVariable` = `null` from working.
* Uses a smarter default column for CSV files.
* Fixed a bug that caused an error message to appear repeatedly when there was an error downloading tiles for a base map.
* Fixed a bug that caused WMS layer names and WFS type names to not be displayed on the dataset info page.
* We now preserve the state of the feature information panel when sharing.  This was lost in the transition to the new user interface in 4.0.0.
* Added a popup message when using region mapping on old browsers without an `ArrayBuffer` type (such as Internet Explorer 9).  These browsers won't support vector tile based region mapping.
* Fixed bug where generic parameters such as strings were not passed through to WPS services.
* Fixed a bug where the chart panel did not update with polled data files.
* Removed the Australian Hydrography layer from `createAustraliaBaseMapOptions`, as the source is no longer available.
* Fixed a bug that caused the GetCapabilities URL of a WMS catalog item to be shown even when `hideSource` was set to true.
* Newly-added user data is now automatically selected for the preview map.
* Fixed a bug where selecting a new column on a moving point CSV file did not update the chart in the feature info panel.
* Fixed dropdowns dropping from the bounds of the screen in Safari.
* Fixed a bug that prevented the feature info panel from updating with polled lat/lon csvs.
* Improved handing of missing data in charts, so that it is ignored instead of shown as 0.

### 4.3.3

* Use react-rangeslider 1.0.4 because 1.0.5 was published incorrectly.

### 4.3.2

* Fixed css styling of shorten URL checkbox.

### 4.3.1

* Added the ability to specify the URL to the `serverConfig` service in `config.json` as `parameters.serverConfigUrl`.

### 4.3.0

* Added `Terria.batchGeocoder` property.  If set, the batch geocoder is used to resolve addresses in CSV files so that they can be shown as points on the map.
* Added `GnafAddressGeocoder` to resolve Australian addresses using the GNAF API.
* Added a loading indicator for user-added files.
* Fixed a bug that prevented printing the map in the 2D mode.
* Fixed a bug when changing between x-axis units in the chart panel.
* Moved all Terria styles into CSS-modules code (except Leaflet) - `lib/Sass/StandardUserInterface.scss` no longer needs to be imported and now only includes styles for backwards compatibility.

### 4.2.1

* Fixed bug that prevented the preview map displaying on mobile devices.

### 4.2.0

* There is a known bug in this version which prevents the user from being able to choose a region for some Analytics functions.
* Added support for ArcGis FeatureServers, using the new catalog types `esri-featureServer` and `esri-featureServer-group`. Catalog type `esri-group` can load REST service, MapServer and FeatureServer endpoints. (For backwards compatibility, catalog type `esri-mapServer-group` continues to work for REST service as well as MapServer endpoints.)
* Enumeration parameter now defaults to what is shown in UI, and if parameter is optional, '' is default.
* Adds bulk geocoding capability for Australian addresses. So GnafAPI can be used with batches of addresses, if configured.
* Fixed a bug that caused the selection indicator to get small when near the right edge of the map and to overlap the side panel when past the left edge.
* Map controls and menus now become translucent while the explorer window (Data Catalog) is visible.
* Removed find-and-replace for cesium workers from the webpack build as it's done in terriajs-cesium now.
* Legend images that fail to load are now hidden entirely.
* Improved the appearance of the opacity slider and added a percentage display.
* AllowedValues for LiteralData WPS input now works even if only one value specified.
* Fixed bug in WPS polygon datatype to return valid polygon geojson.
* Fix regression: cursor changes in UserDrawing now functions in 2D as well as 3D.
* Updated to [Cesium](http://cesiumjs.org) 1.23 (from 1.20).  See the [change log](https://github.com/AnalyticalGraphicsInc/cesium/blob/1.23/CHANGES.md) for details.
* Fixed a bug which prevented feature info showing for Gpx-, Ogr-, WebFeatureService-, ArcGisFeatureServer-, and WebProcessingService- CatalogItems.
* Added support for a wider range of SDMX-JSON data files, including the ability to sum over dimensions via `aggregatedDimensionIds`.
* Added support for `tableStyle.colorBins` as array of values specifying the boundaries between the color bins in the legend, eg. `[3000, 3500, 3900, 4000]`. `colorBins` can still be an integer specifying the number of bins, in which case Terria determines the boundaries.
* Made explorer panel not rendered at all when hidden and made the preview map destroy itself when unmounted - this mitigates performance issues from having Leaflet running in the background on very busy vector datasets.
* Fixed a bug which prevented time-varying CZML feature info from updating.
* Added support for moving-point csv files, via an `idColumns` array on csv catalog items. By default, feature positions, color and size are interpolated between the known time values; set `isSampled` to false to prevent this. (Color and size are never interpolated when they are drawn from a text column.)
* Added support for polling csv files with a partial update, and by using `idColumns` to identify features across updates.
* Added a time series chart to the Feature Info Panel for sampled, moving features.
* Fixed a bug which sometimes prevented feature info from appearing when two region-mapped csv files were displayed.
* Fixed the preview map extent being one item behind what was actually selected.

### 4.1.2

* Fixed a bug that prevented sharing from working in Internet Explorer.

### 4.1.1

* Stopped IE9 from setting bizarre inline dimensions on custom branding images.
* Fixed workbench reordering in browsers other than Chrome.
* URLs on the dataset info page are now auto-selected by clicked, making them easier to copy.

### 4.1.0

* Made the column title for time-based CSV exports from chart default to 'date'
* Stopped the CSV creation webworker from being run multiple times on viewing a chart.
* Removed the empty circles from non-selected base maps on the Map settings panel.
* Prevented text from being selected when dragging the compass control.
* Added the `MeasureTool` to allow users to interactively measure the distance between points.
* Worked around a problem in the Websense Web Filter that caused it to block access to some of the TerriaJS Web Workers due to a URL in the license text in a comment in a source file.

### 4.0.2

* Fixed a bug that prevented opening catalog groups on iOS.
* Fixed a CSS warning.

### 4.0.1

* Fixed a bug that caused an error message to be formatted incorrectly when displayed to the user.

### 4.0.0

* Rewrote the TerriaJS user interface using React.  We believe the new interface is a drastic improvement, incorporating user feedback and the results of usability testing.  Currently, it is a bit harder to customize than our old user interface, so if your application has extensive customizations, we suggest delaying upgrading to this version for a little while logner.
* Added support for non-geospatial CSV files, which display in a new chart panel.
* Added support for customisable tags in Feature Info templates.
* Implemented [`<chart>` and `<collapsible>`](https://github.com/TerriaJS/terriajs/blob/4.0.0/lib/ReactViews/Custom/registerCustomComponentTypes.js#L52-L106) tags in Feature Info templates.
* Added support for [polling](https://github.com/TerriaJS/terriajs/blob/4.0.0/lib/Models/Polling.js) for updates to CSV files.
* `CswCatalogGroup` will now include Web Processing Services from the catalog if configured with `includeWps` set to true.
* `WebMapServiceCatalogItem` will now detect ncWMS servers and set isNcWMS to true.
* New `ShareDataService` which can store and resolve data. Currently it is used as a replacement for Google URL Shortener, which can't handle long URLs.
* New `ServerConfig` object which provides configuration information about the server, including which domains can be proxied for. This changes the way CorsProxy is initialised.
* Added partial support for the SDMX-JSON format.
* `UserDrawing` added for drawing lines and polygons on the map.
* CkanCatalogGroup's `filterQuery` items can now be specified as objects instead of URL-encoded strings.

### 3.5.0

* Ungrouped items in CKAN catalog items are now grouped under an item whose title is determined by .ungroupedTitle (default: "No group").
* CKAN's default search regex for KMLs also includes KMZ.
* Add documentation of camera properties.

### 3.4.0

* Support JSON5 (http://json5.org/) use in init files and config files, so comments can be used and object keys don't need to be quoted.
* Fixed a bug that caused the `corsProxyBaseUrl` specified in `config.json` to be ignored.
* Fixed a bug preventing downloading feature info data in CSV format if it contained nulls.
* Added support for the WMS Style/MetadataURL tag in layer description.
* Long titles in locally-generated titles now word-wrap in most web browsers.
* Long auto-generated legend titles now word wrap in most web browsers.

### 3.3.0

* Support `parameters` property in WebFeatureServiceCatalogItem to allow accessing URLs that need additional parameters.
* Fixed a bug where visiting a shared link with a time-series layer would crash load.
* Added a direct way to format numbers in feature info templates, eg. `{{#terria.formatNumber}}{"useGrouping": true, "maximumFractionDigits": 3}{{value}}{{/terria.formatNumber}}`. The quotes around the keys are optional.
* When the number of unique values in a CSV column exceeds the number of color bins available, the legend now displays "XX other values" as the label for the last bucket rather than simply "Other".
* CSV columns with up to 21 unique values can now be fully displayed in the legend.  Previously, the number of bins was limited to 9.
* Added `cycle` option to `tableColumnStyle.colorBinMethod` for enumeration-type CSV columns.  When the number of unique values in the column exceeds the number of color bins available, this option makes TerriaJS color all values by cycling through the available colors, rather than coloring only the most common values and lumping the rest into an "Other" bucket.
* Metadata and single data files (e.g. KML, GeoJSON) are now consistently cached for one day instead of two weeks.
* `WebMapServiceCatalogItem` now uses the legend for the `style` specified in `parameters` when possible.  It also now includes the `parameters` when building a `GetLegendGraphic` URL.
* Fixed a bug that prevented switching to the 3D view after starting the application in 2D mode.

### 3.2.1

* Fixed a bug on IE9 which prevented shortened URLs from loading.
* Fixed a map started with smooth terrain being unable to switch to 3D terrain.
* Fixed a bug in `CkanCatalogItem` that prevented it from using the proxy for dataset URLs.
* Fixed feature picking when displaying a point-based vector and a region mapped layer at the same time.
* Stopped generation of WMS intervals being dependent on JS dates and hence sensitive to DST time gaps.
* Fixed a bug which led to zero property values being considered time-varying in the Feature Info panel.
* Fixed a bug which prevented lat/lon injection into templates with time-varying properties.

### 3.2.0

* Deprecated in this version:
  - `CkanCatalogItem.createCatalogItemFromResource`'s `options` `allowGroups` has been replaced with `allowWmsGroups` and `allowWfsGroups`.
* Added support for WFS in CKAN items.
* Fixed bug which prevented the terria-server's `"proxyAllDomains": true` option from working.
* Added support in FeatureInfoTemplate for referencing csv columns by either their name in the csv file, or the name they are given via `TableStyle.columns...name` (if any).
* Improved CSV handling to ignore any blank lines, ie. those containing only commas.
* Fixed a bug in `CswCatalogGroup` that prevented it from working in Internet Explorer.

### 3.1.0

* Only trigger a search when the user presses enter or stops typing for 3 seconds.  This will greatly reduce the number of times that searches are performed, which is important with a geocoder like Bing Maps that counts each geocode as a transaction.
* Reduced the tendency for search to lock up the web browser while it is in progress.
* Include "engines" attribute in package.json to indicate required Node and NPM version.
* For WMS catalog items that have animated data, the initial time of the timeslider can be specified with `initialTimeSource` as `start`, `end`, `present` (nearest date to present), or with an ISO8601 date.
* Added ability to remove csv columns from the Now Viewing panel, using `"type": "HIDDEN"` in `tableStyle.columns`.

### 3.0.0

* TerriaJS-based application are now best built using Webpack instead of Browserify.
* Injected clicked lat and long into templates under `{{terria.coords.latitude}}` and `{{terria.coords.longitude}}`.
* Fixed an exception being thrown when selecting a region while another region highlight was still loading.
* Added `CesiumTerrainCatalogItem` to display a 3D surface model in a supported Cesium format.
* Added support for configuration of how time is displayed on the timeline - catalog items can now specify a dateFormat hash
    in their configuration that has formats for `timelineTic` (what is displayed on the timeline itself) and `currentTime`
    (which is the current time at the top-left).
* Fixed display when `tableStyle.colorBins` is 0.
* Added `fogSettings` option to init file to customize fog settings, introduced in Cesium 1.16.
* Improved zooming to csvs, to include a small margin around the points.
* Support ArcGis MapServer extents specified in a wider range of projections, including GDA MGA zones.
* WMS legends now use a bigger font, include labels, and are anti-aliased when we can determine that the server is Geoserver and supports these options.
* Updated to [Cesium](http://cesiumjs.org) 1.20.  Significant changes relevant to TerriaJS users include:
    * Fixed loading for KML `NetworkLink` to not append a `?` if there isn't a query string.
    * Fixed handling of non-standard KML `styleUrl` references within a `StyleMap`.
    * Fixed issue in KML where StyleMaps from external documents fail to load.
    * Added translucent and colored image support to KML ground overlays
    * `GeoJsonDataSource` now handles CRS `urn:ogc:def:crs:EPSG::4326`
    * Fix a race condition that would cause the terrain to continue loading and unloading or cause a crash when changing terrain providers. [#3690](https://github.com/AnalyticalGraphicsInc/cesium/issues/3690)
    * Fix issue where the `GroundPrimitive` volume was being clipped by the far plane. [#3706](https://github.com/AnalyticalGraphicsInc/cesium/issues/3706)
    * Fixed a reentrancy bug in `EntityCollection.collectionChanged`. [#3739](https://github.com/AnalyticalGraphicsInc/cesium/pull/3739)
    * Fixed a crash that would occur if you added and removed an `Entity` with a path without ever actually rendering it. [#3738](https://github.com/AnalyticalGraphicsInc/cesium/pull/3738)
    * Fixed issue causing parts of geometry and billboards/labels to be clipped. [#3748](https://github.com/AnalyticalGraphicsInc/cesium/issues/3748)
    * Fixed bug where transparent image materials were drawn black.
    * Fixed `Color.fromCssColorString` from reusing the input `result` alpha value in some cases.
* Added support for time-series data sets with gaps - these are skipped when scrubbing on the timeline or playing.

### 2.3.0

* Share links now contain details about the picked point, picked features and currently selected feature.
* Reorganised the display of disclaimers so that they're triggered by `CatalogGroup` and `CatalogItem` models, which trigger `terria.disclaimerEvent`, which is listened to by DisclaimerViewModel`. `DisclaimerViewModel` must be added by the map that's using Terria.
* Added a mechanism for hiding the source of a CatalogItem in the view info popup.
* Added the `hideSource` flag to the init json for hiding the source of a CatalogItem in the View Info popup.
* Fixed a bug where `CatalogMember.load` would return a new promise every time it was called, instead of retaining the one in progress.
* Added support for the `copyrightText` property for ArcGis layers - this now shows up in info under "Copyright Text"
* Showed a message in the catalog item info panel that informs the user that a catalog item is local and can't be shared.
* TerriaJS now obtains its list of domains that the proxy will proxy for from the `proxyableDomains/` service.  The URL can be overridden by setting `parameters.proxyableDomainsUrl` in `config.json`.
* Updated to [Cesium](http://cesiumjs.org) 1.19.  Significant changes relevant to TerriaJS users include:
    * Improved KML support.
        * Added support for `NetworkLink` refresh modes `onInterval`, `onExpire` and `onStop`. Includes support for `viewboundScale`, `viewFormat`, `httpQuery`.
        * Added partial support for `NetworkLinkControl` including `minRefreshPeriod`, `cookie` and `expires`.
        * Added support for local `StyleMap`. The `highlight` style is still ignored.
        * Added support for `root://` URLs.
        * Added more warnings for unsupported features.
        * Improved style processing in IE.

### 2.2.1

* Improved legend and coloring of ENUM (string) columns of CSV files, to sort first by frequency, then alphabetically.

### 2.2.0

* Warn user when the requested WMS layer doesn't exist, and try to provide a suggestion.
* Fixed the calculation of a CSV file's extent so that missing latitudes and longitudes are ignored, not treated as zero.
* Improved the user experience around uploading files in a format not directly supported by TerriaJS and optionally using the conversion service.
* Improved performance of large CSV files, especially the loading time, and the time taken to change the display variable of region-mapped files.
* Added support for CSV files with only location (lat/lon or region) columns, and no value columns, using a file-specific color. Revised GeoJSON display to draw from the same palette of colors.
* Fixed a bug that prevented GeoJSON styles from being applied correctly in some cases.
* Fixed an error when adding a CSV with one line of data.
* Fixed error when adding a CSV file with numeric column names.
* Polygons and polylines are now highlighted on click when the geometry is available.
* Improved legend and coloring of ENUM (string) columns of CSV files; only the most common values are colored differently, with the rest shown as 'Other'.
* Added support for running the automated tests on the local system (via `gulp test`), on BrowserStack (via `gulp test-browserstack`), and on Sauce Labs (via `gulp test-saucelabs`).
* Changed `tableStyle`'s `format` to only accept `useGrouping`, `maximumFractionDigits` and `styling: "percent"` options. Previously some other options may have worked in some browsers.
* Improved color palette for string (ENUM) columns of CSV files.
* Improved CSV loading to ignore any completely blank lines after the header row (ie. lines which do not even have commas).
* Added support for grouping catalog items retrieved from a CSW server according to criteria specified in the init file (via the `metadataGroups` property) or from a `domainSpecification` and a call to the `GetDomain` service on the CSW server.
* Added `UrlTemplateCatalogItem`, which can be used to access maps via a URL template.
* Improved ABS display (to hide the regions) when a concept is deselected.
* Improved readability of ArcGIS catalog items and legends by replacing underscores with spaces.
* `ArcGisMapServerCatalogItem` metadata is now cached by the proxy for only 24 hours.
* Improved the feature info panel to update the display of time-varying region-mapped CSV files for the current time.
* Updated to [Cesium](http://cesiumjs.org) 1.18.  Significant changes relevant to TerriaJS users include:
  * Improved terrain performance by up to 35%. Added support for fog near the horizon, which improves performance by rendering less terrain tiles and reduces terrain tile requests. [#3154](https://github.com/AnalyticalGraphicsInc/cesium/pull/3154)
  * Reduced the amount of GPU and CPU memory used by terrain by using compression. The CPU memory was reduced by up to 40%, and approximately another 25% in Chrome.
  * Fixed an issue where the sun texture is not generated correctly on some mobile devices. [#3141](https://github.com/AnalyticalGraphicsInc/cesium/issues/3141)
  * Cesium now honors window.devicePixelRatio on browsers that support the CSS imageRendering attribute. This greatly improves performance on mobile devices and high DPI displays by rendering at the browser-recommended resolution. This also reduces bandwidth usage and increases battery life in these cases.

### 2.1.1

* Fixed sharing of time-varying czml files; the timeline was not showing on the shared link.
* Fixed sharing of user-added time-varying csv files.
* Fixed a bug in `CkanCatalogItem` that made it build URLs incorrectly when given a base URL ending in a slash.

### 2.1.0

* Moved `TableColumn`, `TableStructure`, and the classes based on `Concept` to `lib/Map`. Moved `LegendHelper` to `lib/Models`.
* Added column-specific styling to CSV files, using a new `tableStyle.columns` json parameter. This is an object whose keys are column names or indices, and whose values are objects of column-specific tableStyle parameters. See the CSV column-specific group in `wwwroot/test/init/test-tablestyle.json` for an example. [#1097](https://github.com/TerriaJS/terriajs/issues/1097)
* Added the following column-specific `tableStyle` parameters:
  - `name`: renames the column.
  - `type`: sets the column type; can be one of LON, LAT, ALT, TIME, SCALAR, or ENUM.
  - `format`: sets the column number format, using the format of the [Javascript Intl options parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString), eg. `{"format": {"useGrouping": true, "maximumFractionDigits": 2}}` to add thousands separators to numbers and show only two decimal places. Only the `useGrouping`, `maximumFractionDigits` and `styling: "percent"` options are guaranteed to work in all browsers.
* Added column-specific formatting to the feature info panel for all file types, eg. `"featureInfoTemplate" : {"template": "{{SPEED}} m/s", "formats": {"SPEED": {"maximumFractionDigits": 2}}}`. The formatting options are the same as above.
* Changed the default number format in the Feature Info Panel to not separate thousands with commas.
* Fixed a bug that caused the content on the feature info panel to be rendered as pure HTML instead of as mixed HTML / Markdown.
* Changed the default for `tableStyle.replaceWithZeroValues` to `[]`, ie. nothing.
* Changed the default for `tableStyle.replaceWithNullValues` to `["-", "na", "NA"]`.
* Changed the default for `tableStyle.nullLabel` to '(No value)'.
* Application name and support email can now be set in config.json's "parameters" section as "appName" and "supportEmail".
* Fixed showWarnings in config json not being respected by CSV catalog items.
* Fixed hidden region mapped layers being displayed when variable selection changes.
* Fixed exporting raw data as CSV not escaping commas in the data itself.

### 2.0.1

* Fixed a bug that caused the last selected ABS concept not to appear in the feature info panel.

### 2.0.0

* The following previously-deprecated functionality was removed in this version:
  - `ArcGisMapServerCatalogGroup`
  - `CatalogItemControl`
  - `CatalogItemDownloadControl`
  - Calling `BrandBarViewModel.create` with more than one parameter.
  - `CatalogMemberControl.leftSideItemControls`
  - `CatalogMemberControl.rightSideItemControls`
  - `DataCatalogTabViewModel.getRightSideItemControls`
  - `DataCatalogTabViewModel.getLeftSideItemControls`
  - `registerCatalogItemControls`
  - `AusGlobeViewer`
* Streamlined CSV handling framework. Breaking changes include the APIs of (not including those which begin with `_`):
  - `CsvCatalogItem`: `rowProperties`, `rowPropertiesByCode`, `dynamicUpdate` have been removed.
  - `AbsIttCatalogItem`: Completely rewritten. The `dataSetID` json parameter has been deprecated in favor of `datasetId` (different capitalization).
  - For the 2011 Australian Census data, requires `sa4_code_2011` to appear as an alias in `regionMapping.json` (it was previously missing in NationalMap).
  - `TableDataSource`: Completely rewritten and moved from `Map` to `Models` directory. Handles csvs with latitude & longitude columns.
  - `RegionMapping`: Used instead of TableDataSource for region-mapped csvs.
  - `DataTable` and `DataVariable` have been replaced with new classes, `TableStructure` and `TableColumn`.
  - `RegionProvider`: `loadRegionsFromWfs`, `processRegionIds`, `applyReplacements`, `findRegionIndex` have been made internal functions.
  - `RegionProviderList`: `chooseRegionProvider` has been changed and renamed `getRegionDetails `.
  - `ColorMap`: `fromArray` and `fromString` have been removed, with the constructor taking on that functionality.
  - `LegendUrl` has been moved to the `Map` directory.
  - `TableStyle`: `loadColorMap` and `chooseColorMap` have been removed. Moved from `Map` to `Models` directory.
  - `FeatureInfoPanelSectionViewModel`: its constructor now takes a `FeatureInfoPanelViewModel` as its first argument, instead of `Terria`.
  - `Models/ModelError` has been replaced with `Core/TerriaError`.
* Removed blank feature info sections for uncoloured regions of region-mapped CSVs.
* Recognises the CSV datetime formats: YYYY, YYYY-MM and YYYY-MM-DD HH:MM(:SS).
* Introduced five new json tableStyle parameters:
  - `replaceWithZeroValues`: Defaults to `[null, "-"]`. These values are coloured as if they were zero if they appear in a list with numbers. `null` catches missing values.
  - `replaceWithNullValues`: Defaults to `["na", "NA"]`. These values are coloured as if they were null if they appear in a list with numbers.
  - `nullColor`: A css string. Defaults to black. This colour is used to display null values. It is also used to colour points when no variable is selected.
  - `nullLabel`: A string used to label null or blank values in the legend. Defaults to ''.
  - `timeColumn`: Provide the name or index (starting at 0) of a csv column, if any. Defaults to the first time column found, if any. Use `null` to explicitly disregard all time columns.
* Removed variables consisting only of html tags from the Now Viewing panel.
* Added support for the csv datetime formats: YYYY, YYYY-MM and YYYY-MM-DD HH:MM(:SS).
* Improved formatting of datetimes from csv files in the feature info panel.
* Removed variables consisting only of html tags from the Now Viewing panel.
* Improved handling of rows with missing dates in csv time columns.
* Introduced four new json tableStyle parameters:
  - `replaceWithZeroValues`: Defaults to `[null, '-']`. These values are coloured as if they were zero if they appear in a csv column with numbers. `null` catches missing values. These rows are ignored if they appear in a csv time column.
  - `replaceWithNullValues`: Defaults to `['na', 'NA']`. These values are coloured as if they were null if they appear in a csv column with numbers. These rows are ignored if they appear in a csv time column.
  - `nullColor`: A css string. Defaults to a dark blue. This colour is used to display null values (but it does not appear on the legend). It is also used to colour points when no variable is selected.
  - `timeColumn`: Provide the name or index (starting at 0) of a csv column, if any. Defaults to the first time column found, if any. Use `null` to explicitly disregard all time columns.
* Added id matching for catalog members:
* Improved formatting of datetimes from csv files in the feature info panel.
* Removed variables consisting only of HTML tags from the Now Viewing panel.
* Added ID matching for catalog members:
  - An `id` field can now be set in JSON for catalog members
  - When sharing an enabled catalog item via a share link, the share link will reference the catalog item's ID
    rather than its name as is done currently.
  - The ID of an item should be accessed via `uniqueId` - if a catalog member doesn't have an ID set, this returns a
    default value of the item's name plus the ID of its parent. This means that if all the ancestors of a catalog
    member have no ID set, its ID will be its full path in the catalog.
  - This means that if an item is renamed or moved, share links that reference it will still work.
  - A `shareKeys` property can be also be set that contains an array of all ids that should lead to this item. This means
    that a share link for an item that didn't previously have an ID set can still be used if it's moved, as long as it
    has its old default ID set in `shareKeys`
  - Old share links will still work as long as the items they lead to aren't renamed or moved.
  - Refactor of JSON serialization - now rather than passing a number of flags that determine what should and shouldn't be
    serialized, an `itemFilter` and `propertyFilter` are passed in options. These are usually composed of multiple filters,
    combined using `combineFilters`.
  - An index of all items currently in the catalog against all of that item's shareKeys is now maintained in `Catalog`
    and can be used for O(1) lookups of any item regardless of its location.
  - CatalogMembers now contain a reference to their parent CatalogGroup - this means that the catalog tree can now be
    traversed in both directions.
  - When serializing user-added items in the catalog, the children of `CatalogGroup`s with the `url` property set are
    not serialized. Settings like `opacity` for their descendants that need to be preserved are serialized separately.
* Generated legends now use SVG (vector) format, which look better on high resolution devices.
* Created new Legend class, making it easy to generate client-side legends for different kinds of data.
* Generate client-side legends for ArcGIS MapServer catalog items, by fetching JSON file, instead of just providing link to external page.
* Fix Leaflet feature selection when zoomed out enough that the world is repeated.
* Improved handling of lat/lon CSV files with missing latitude or longitude values.
* Fixed a bug that prevented `SocrataCataloGroup` from working in Internet Explorer 9.
* Added `CkanCatalogItem`, which can be used to reference a particular resource of any compatible type on a CKAN server.
* Fixed a bug that caused the Now Viewing tab to display incorrectly in Internet Explorer 11 when switching directly to it from the Data Catalogue tab.

### 1.0.54

* Fixed a bug in `AbsIttCatalogItem` that caused no legend to be displayed.

### 1.0.53

* Improved compatibility with Internet Explorer 9.
* Made `CswCatalogGroup` able to find geospatial datasets on more CSW servers.
* Allow WMS parameters to be specified in json in uppercase (eg. STYLES).

### 1.0.52

* Added `MapBoxMapCatalogItem`, which is especially useful for base maps. A valid access token must be provided.
* Added a `getContainer()` method to Terria's `currentViewer`.
* Dramatically improved the performance of region mapping.
* Introduced new quantisation (color binning) methods to dramatically improve the display of choropleths (numerical quantities displayed as colors) for CSV files, instead of always using linear. Four values for `colorBinMethod` are supported:
  * "auto" (default), usually means "ckmeans"
  * "ckmeans": use "CK means" method, an improved version of Jenks Even Breaks to form clusters of values that are as distinct as possible.
  * "quantile": use quantiles, evenly distributing values between bins
  * "none": use the previous linear color mapping method.
* The default style for CSV files is now 7 color bins with CK means method.
* Added support for color palettes from Color Brewer (colorbrewer2.org). Within `tableStyle`, use a value like `"colorPalette": "10-class BrBG"`.
* Improved the display of legends for CSV files, accordingly.
* URLs for legends are now encapsulated in a `LegendUrl` model, which accepts a mime type that will affect how the
  legend is rendered in the sidebar.
* Added support for the Socrata "new backend" with GeoJSON download to `SocrataCatalogGroup`.
* Moved URL config parameters to config.json, with sensible defaults. Specifically:
  *   regionMappingDefinitionsUrl: 'data/regionMapping.json',
  *   conversionServiceBaseUrl: '/convert/',
  *   proj4ServiceBaseUrl: '/proj4/',
  *   corsProxyBaseUrl: '/proxy/'
* Deprecated terria.regionMappingDefinitionsUrl (set it in config.json or leave it as default).

### 1.0.51

* Fixed a typo that prevented clearing the search query
* Added support for Nominatim search API hosted by OpenStreetMap (http://wiki.openstreetmap.org/wiki/Nominatim) with `NominatimSearchProviderViewModel`. This works by merging to 2 queries : one with the bounding parameter for the nearest results, and the other without the bounding parameter. The `countryCodes` property can be set to limit the result to a set of specific countries.
* Added `MapProgressBarViewModel`.  When added to the user interface with `MapProgressBarViewModel.create`, it shows a bar at the top of the map window indicating tile load progress.
* We no longer show the entity's ID (which is usually a meaningless GUID) on the feature info panel when the feature does not have a name.  Instead, we leave the area blank.
* Fixed a bug with time-dynamic imagery layers that caused features to be picked from the next time to be displayed, in addition to the current one.
* Replace `.` and `#` with `_` in property names meant to be used with `featureInfoTemplate`, so that these properties can be accessed by the [mustache](https://mustache.github.io/) templating engine.
* Added support for time-varying properties (e.g. from a CZML file) on the feature info panel.
* `Cesium.zoomTo` now takes the terrain height into account when zooming to a rectangle.

### 1.0.50

* Put a white background behind legend images to fix legend images with transparent background being nearly invisible.
* Search entries are no longer duplicated for catalog items that appear in multiple places in the Data Catalogue
* Fixed the layer order changing in Cesium when a CSV variable is chosen.
* Layer name is now shown in the catalog item info panel for ESRI ArcGIS MapServer layers.
* Retrieve WFS or WCS URL associated with WMS data sources using DescribeLayer if no dataUrl is present.
* Downgrade Leaflet to 0.7.3 to fix specific feature clicking problems with 2D maps.
* Use `PolylineGraphics` instead of `PolygonGraphics` for unfilled polygons with an outline width greater than 1.  This works around the fact that Cesium does not support polygons with outline width great than 1 on Windows due to a WebGL limitation.
* Sorted ABS age variables numerically, not alphabetically.
* Removed extra space at the bottom of base map buttons.
* Share links now remember the currently active tab in the `ExplorerPanelViewModel`.
* Fixed a bug that prevented region mapping from working over HTTPS.
* The proxy is now used to avoid a mixed content warning when accessing an HTTP dataset from an HTTPS deployment of TerriaJS.
* Added `CameraView.fromLookAt` and `CameraView.fromPositionHeadingPitchRoll` functions.  These functions can be used to position the camera in new ways.

### 1.0.49

* Fixed a bug that caused poor performance when clicking a point on the map with lots of features and then closing the feature information panel.
* Apply linkify, instead of markdown, to properties shown in the Feature Info Panel.
* Fixed a bug that prevented feature scaling by value.
* Fixed a bug that prevented the csv `displayDuration` from working.
* Fixed a bug that ignored which column of the csv file to show as the legend initially.
* `NowViewingTabViewModel` is now composed of a number of sections.  Each section is given the opportunity to determine whether it applies to each catalog item.  Custom sections may be added by adding them to NowViewingTabViewModel.sections`.
* `CsvCatalogItem` and `AbsIttCatalogItem` now expose a `concepts` property that can be used to adjust the display.
* Added `Terria.cesiumBaseUrl` property.
* The user interface container DOM element may now be provided to `TerriaViewer` by specifying `uiContainer` in its options.  Previously it always used an element named `ui`.
* Legend URLs are now accessed via the proxy, if applicable.
* Fixed a bug that prevented feature scaling by value.
* Added support for [Urthecast](https://www.urthecast.com/) with `UrthecastCatalogGroup`.
* Fixed a bug that caused a `TypeError` on load when the share URL included enabled datasets with an order different from their order in the catalog.
* Improved the message that is shown to the user when their browser supports WebGL but it has a "major performance caveat".
* Fixed a bug that could cause an exception in some browsers (Internet Explorer, Safari) when loading a GeoJSON with embedded styles.
* Fixed a bug with Leaflet 2D map where clicks on animation controls or timeline would also register on the map underneath causing undesired feature selection and, when double clicked, zooming (also removed an old hack that disabled dragging while using the timeline slider)
* Changed Australian Topography base map server and updated the associated thumbnail.
* Added `updateApplicationOnMessageFromParentWindow` function.  After an app calls this function at startup, TerriaJS can be controlled by its parent window when embedded in an `iframe` by messages sent with `window.postMessage`.

### 1.0.48

* Added the ability to disable feature picking for `ArcGisMapServerCatalogItem`.
* Disabled feature picking for the Australian Topography and Australian Hydrography base layers created by `createAustraliaBaseMapOptions`.

### 1.0.47

* Make it possible to disable CSV region mapping warnings with the `showWarnings` init parameter.
* The `name` of a feature from a CSV file is now taken from a `name` or `title` column, if it exists.  Previously the name was always "Site Data".
* Fixed a bug that caused time-dynamic WMS layers with just one time to not be displayed.
* Underscores are now replaced with spaces in the feature info panel for `GeoJsonCatalogItem`.
* Added Proj4 projections to the location bar. Clicking on the bar switches between lats/longs and projected coordinates. To enable this, set `useProjection` to `true`
* Show information for all WMS features when a location is clicked.
* Fixed a bug that caused an exception when running inside an `<iframe>` and the user's browser blocked 3rd-party cookies.
* HTML and Markdown text in catalog item metadata, feature information, etc. is now formatted in a more typical way.  For example, text inside `<h1>` now looks like a heading.  Previously, most HTML styling was stripped out.
* Supports FeatureInfoTemplates on all catalog item types (previously only available on ImageryLayers).
* Apply markdown to properties shown in the Feature Info Panel.
* Add `includeCzml` option to CkanCatalogGroup.
* Fixed a bug that caused `WebMapServiceCatalogItem` to incorrectly populate the catalog item's metadata with data from GetCapabilities when another layer had a `Title` with the same value as the expected layer's `Name`.
* Update the default Australian topography basemap to Geoscience Australia's new worldwide layer (http://www.ga.gov.au/gisimg/rest/services/topography/National_Map_Colour_Basemap/MapServer)
* Allow color maps in CSV catalog items to be expressed as strings: colorMapString: "red-white-blue".
* Updated to [Cesium](http://cesiumjs.org) 1.15.  Significant changes relevant to TerriaJS users include:
  * Added support for the [glTF 1.0](https://github.com/KhronosGroup/glTF/blob/master/specification/README.md) draft specification.
  * Added support for the glTF extensions [KHR_binary_glTF](https://github.com/KhronosGroup/glTF/tree/master/extensions/Khronos/KHR_binary_glTF) and [KHR_materials_common](https://github.com/KhronosGroup/glTF/tree/KHR_materials_common/extensions/Khronos/KHR_materials_common).
  * `ImageryLayerFeatureInfo` now has an `imageryLayer` property, indicating the layer that contains the feature.
  * Make KML invalid coordinate processing match Google Earth behavior. [#3124](https://github.com/AnalyticalGraphicsInc/cesium/pull/3124)

### 1.0.46

* Fixed an incorrect require (`URIjs` instead of `urijs`).

### 1.0.45

* Major refactor of `CsvCatalogItem`, splitting region-mapping functionality out into `RegionProvider` and `RegionProviderList`. Dozens of new test cases. In the process, fixed a number of bugs and added new features including:
  * Regions can be matched using regular expressions, enabling matching of messy fields like local government names ("Baw Baw", "Baw Baw Shire", "Baw Baw (S)", "Shire of Baw Baw" etc).
  * Regions can be matched using a second field for disambiguation (eg, "Campbelltown" + "SA")
  * Drag-and-dropped datasets with a time column behave much better: rather than a fixed time being allocated to each row, each row occupies all the time up until the next row is shown.
  * Enumerated fields are colour coded in lat-long files, consist with region-mapped files.
  * Feedback is now provided after region mapping, showing which regions failed to match, and which matched more than once.
  * Bug: Fields with names starting with 'lon', 'lat' etc were too aggressively matched.
  * Bug: Numeric codes beginning with zeros (eg, certain NT 08xx postcodes) were treated as numbers and failed to match.
  * Bug: Fields with names that could be interpreted as regions weren't available as data variables.
* Avoid mixed content warnings when using the CartoDB basemaps.
* Allow Composite catalog items
* Handle WMS time interval specifications (time/time and time/time/periodicity)
* Moved `url` property to base CatalogItem base class.  Previously it was defined separately on most derived catalog items.
* Most catalog items now automatically expose a `dataUrl` that is the same as their `url`.
* Added custom definable controls to `CatalogMember`s.
  * To define a control, subclass `CatalogMemberControl` and register the control in `ViewModels/registerCatalogMemberControl` with a unique control name, control class and required property name.
  * If a `CatalogMember` has a property with the required property name either directly on the member or in its `customProperties` object, the control will appear in the catalog with the member and will fire the `activate` function when clicked.
  * Controls can be registered to appear on both the left and right side using `registerLeftSideControl` and `registerRightSideControl` respectively.
  * An example can be seen in the `CatalogMemberDownloadControl`
  * Currently top level members do not show controls.
* The `LocationBarViewModel` now shows the latitude and longitude coordinates of the mouse cursor in 2D as well as 3D.
* The `LocationBarViewModel` no longer displays a misleading elevation of 0m when in "3D Smooth" mode.
* Added `@menu-bar-right-offset` LESS parameter to control the right position of the menu bar.
* Added `forceProxy` flag to all catalog members to indicate that an individual item should use the proxy regardless of whether the domain is in the list of domains to proxy.
* Allow a single layer of an ArcGIS MapServer to be added through the "Add Data" interface.
* Added `WfsFeaturesCatalogGroup`.  This group is populated with a catalog item for each feature queried from a WFS server.
* The Feature Info panel now shows all selected features in an accordion control.  Previously it only showed the first one.
* Added `featureInfoTemplate` property to `CatalogItem`.  It is used to provide a custom Markdown or HTML template to display when a feature in the catalog item is clicked.  The template is parameterized on the properties of the feature.
* Updated to [Cesium](http://cesiumjs.org) 1.14.  Significant changes relevant to TerriaJS users include:
  * Fixed issues causing the terrain and sky to disappear when the camera is near the surface. [#2415](https://github.com/AnalyticalGraphicsInc/cesium/issues/2415) and [#2271](https://github.com/AnalyticalGraphicsInc/cesium/issues/2271)
  * Fixed issues causing the terrain and sky to disappear when the camera is near the surface. [#2415](https://github.com/AnalyticalGraphicsInc/cesium/issues/2415) and [#2271](https://github.com/AnalyticalGraphicsInc/cesium/issues/2271)
  * Provided a workaround for Safari 9 where WebGL constants can't be accessed through `WebGLRenderingContext`. Now constants are hard-coded in `WebGLConstants`. [#2989](https://github.com/AnalyticalGraphicsInc/cesium/issues/2989)
  * Added a workaround for Chrome 45, where the first character in a label with a small font size would not appear. [#3011](https://github.com/AnalyticalGraphicsInc/cesium/pull/3011)
  * Fixed an issue with drill picking at low frame rates that would cause a crash. [#3010](https://github.com/AnalyticalGraphicsInc/cesium/pull/3010)

### 1.0.44

* Fixed a bug that could cause timeseries animation to "jump" when resuming play after it was paused.
* Make it possible for catalog item initialMessage to require confirmation, and to be shown every time.
* When catalog items are enabled, the checkbox now animates to indicate that loading is in progress.
* Add `mode=preview` option in the hash portion of the URL.  When present, it is assumed that TerriaJS is being used as a previewer and the "small screen warning" will not be shown.
* Added `maximumLeafletZoomLevel` constructor option to `TerriaViewer`, which can be used to force Leaflet to allow zooming closer than its default of level 18.
* Added the `attribution` property to catalog items.  The attribution is displayed on the map when the catalog item is enabled.
* Remove an unnecessary instance of the Cesium InfoBox class when viewing in 2D
* Fixed a bug that prevented `AbsIttCatalogGroup` from successfully loading its list of catalog items.
* Allow missing URLs on embedded data (eg. embedded czml data)
* Fixed a bug loading URLs for ArcGIS services names that start with a number.
* Updated to [Cesium](http://cesiumjs.org) 1.13.  Significant changes relevant to TerriaJS users include:
  * The default `CTRL + Left Click Drag` mouse behavior is now duplicated for `CTRL + Right Click Drag` for better compatibility with Firefox on Mac OS [#2913](https://github.com/AnalyticalGraphicsInc/cesium/pull/2913).
  * Fixed an issue where non-feature nodes prevented KML documents from loading. [#2945](https://github.com/AnalyticalGraphicsInc/cesium/pull/2945)

### 1.0.43

* Fixed a bug that prevent the opened/closed state of groups from being preserved when sharing.

### 1.0.42

* Added a `cacheDuration` property to all catalog items.  The new property is used to specify, using Varnish-like notation (e.g. '1d', '10000s') the default length of time to cache URLs related to the catalog item.
* Fix bug when generating share URLs containing CSV items.
* Improve wording about downloading data from non-GeoJSON-supporting WFS servers.

### 1.0.41

* Improvements to `AbsIttCatalogItem` caching from the Tools menu.

### 1.0.40

* `ArcGisMapServerCatalogItem` now shows "NoData" tiles by default even after showing the popup message saying that max zoom is exceeded.  This can be disabled by setting its `showTilesAfterMessage` property to false.

### 1.0.39

* Fixed a race condition in `AbsIttCatalogItem` that could cause the legend and map to show different state than the Now Viewing UI suggested.
* Fixed a bug where an ABS concept with a comma in its name (e.g. "South Eastern Europe,nfd(c)" in Country of Birth) would cause values for concept that follow to be misappropriated to the wrong concepts.

### 1.0.38

* `AbsIttCatalogItem` now allows the region type to be set on demand rather than only at load time.
* `CsvCatalogItem` can now have no display variable selected, in which case all points are the same color.

### 1.0.37

* Added `CswCatalogGroup` for populating a catalog by querying an OGC CSW service.
* Added `CatalogMember.infoSectionOrder` property, to allow the order of info sections to be configured per catalog item when necessary.
* Fixed a bug that prevented WMTS layers with a single `TileMatrixSetLink` from working correctly.
* Added support for WMTS layers that can only provide tiles in JPEG format.
* Fixed testing and caching of ArcGis layers from tools and added More information option for imagery layers.
* TerriaJS no longer requires Google Analytics.  If a global `ga` function exists, it is used just as before.  Otherwise, events are, by default, logged to the console.
* The default event analytics behavior can be specified by passing an instance of `ConsoleAnalytics` or `GoogleAnalytics` to the `Terria` constructor.  The API key to use with `GoogleAnalytics` can be specified explicitly to its constructor, or it can be specified in the `parameter.googleAnalyticsKey` property in `config.json`.
* Made polygons drastically faster in 2D.
* TerriaJS now shortens share URLs by default when a URL shortener is available.
* Added Google Analytics reporting of the application URL.  This is useful for tracking use of share URLs.
* Added the ability to specify a specific dynamic layer of an ArcGIS Server using just a URL.

### 1.0.36

* Calculate extent of TopoJSON files so that the viewer correctly pans+zooms when a TopoJSON file is loaded.
* Fixed a bug that caused the `Terria#clock` to keep ticking (and therefore using CPU / battery) once started even after selecting a non-time-dynamic dataset.
* Fixed a bug that caused the popup message to appear twice when a dataset failed to load.
* Added layer information to the Info popup for WMS datasets.
* Added ability to filter catalog search results by:
  * type: `is:wms`, `-is:esri-mapserver`. A result must match any 'is:' and no '-is:'.
  * url: `url:vic.gov.au`, `-url:nicta.com.au`. A result must match any 'url:', and no '-url:'.
* Added ability to control the number of catalog search results: `show:20`, `show:all`

### 1.0.35

* Polygons from GeoJSON datasets are now filled.
* Left-aligned feature info table column and added some space between columns.
* Added `EarthGravityModel1996`.
* Extended `LocationBarViewModel` to show heights relative to a geoid / mean sea level model.  By default, EGM96 is used.
* Added support for styling GeoJSON files, either in catalog (add .style{} object) or embedded directly in the file following the [SimpleStyle spec](https://github.com/mapbox/simplestyle-spec).
* Fixed a bug that caused the 3D view to use significant CPU time even when idle.
* Added CartoDB's Positron and Dark Matter base maps to `createGlobalBaseMapOptions`.
* Added support for subdomains to `OpenStreetMapCatalogItem`.

### 1.0.34

* Fixed a bug that prevented catalog items inside groups on the Search tab from being enabled.
* Added `PopupMessageConfirmationViewModel`. It prevents the Popup from being closed unless the confirm button is pressed. Can also optionally have a deny button with a custom action.
* Added support for discovering GeoJSON datasets from CKAN.
* Added support for zipped GeoJSON files.
* Made `KmlCatalogItem` use the proxy when required.
* Made `FeatureInfoPanelViewModel` use the white panel background in more cases.
* Significantly improved the experience on devices with small screens, such as phones.
* Fixed a bug that caused only the portion of a CKAN group name before the first comma to be used.

### 1.0.33

* Added the `legendUrls` property to allow a catalog item to optionally have multiple legend images.
* Added a popup message when zooming in to the "No Data" scales of an `ArcGisMapServerCatalogItem`.
* Added `CatalogGroup.sortFunction` property to allow custom sorting of catalog items within a group.
* Added `ImageryLayerCatalogItem.treat403AsError` property.
* Added a title text when hovering over the label of an enabled catalog item.  The title text informs the user that clicking will zoom to the item.
* Added `createBingBaseMapOptions` function.
* Added an option to `KnockoutMarkdownBinding` to optionally skip HTML sanitization and therefore to allow unsafe HTML.
* Upgraded to Cesium 1.11.
* `CatalogItem.zoomTo` can now zoom to much smaller bounding box rectangles.

### 1.0.32

* Fixed CKAN resource format matching for KML, CSV, and Esri REST.

### 1.0.31

* Added support for optionally generating shorter URLs when sharing by using the Google URL shortening service.

### 1.0.30

* `WebMapServiceCatalogItem` and `ArcGisMapServerCatalogItem` now augment directly-specified metadata with metadata queried from the server.
* "Data Details" and "Service Details" on the catalog item info panel are now collapsed by default.  This improves the performance of the panel and hides some overly technical details.
* `ArcGisMapServerCatalogItem.layers` can now specify layer names in addition to layer IDs.  Layer names are matched in a case-insensitive manner and only if a direct ID match is not found.
* `itemProperties` are now applied through the normal JSON loading mechanism, so properties that are represented differently in code and in JSON will now work as well.
* Added support for `csv-geo-*` (e.g. csv-geo-au) to `CkanCatalogGroup`.
* The format name used in CKAN can now be specified to `CkanCatalogGroup` using the `wmsResourceFormat`, `kmlResourceFormat`, `csvResourceFormat`, and `esriMapServerResourceFormat` properties.  These properties are all regular expressions.  When the format of a CKAN resource returned from `package_search` matches one of these regular expressions, it is treated as that type within TerriaJS.
* `CkanCatalogGroup` now fills the `dataUrl` property of created items by pointing to the dataset's page on CKAN.
* The catalog item information panel now displays `info` sections in a consistent order.  The order can be overridden by setting `CatalogItemInfoViewModel.infoSectionOrder`.
* An empty `description` or `info` section is no longer shown on the catalog item information panel.  This can be used to remove sections that would otherwise be populated from dataset metadata.

### 1.0.29

* Add support for loading init files via the proxy when necessary.
* Switched to using the updated URL for STK World Terrain, `//assets.agi.com/stk-terrain/v1/tilesets/world/tiles`.

### 1.0.28

* Fixed a bug that prevented links to non-image (e.g. ArcGIS Map Server) legends from appearing on the Now Viewing panel.

### 1.0.27

* Use terriajs-cesium 1.10.7, fixing a module load problem in really old browers like IE8.

### 1.0.25

* Fixed incorrect date formatting in the timeline and animation controls on Internet Explorer 9.
* Add support for CSV files with longitude and latitude columns but no numeric value column.  Such datasets are visualized as points with a default color and do not have a legend.
* The Feature Information popup is now automatically closed when the user changes the `AbsIttCatalogItem` filter.

### 1.0.24

* Deprecated:
  * Renamed `AusGlobeViewer` to `TerriaViewer`.  `AusGlobeViewer` will continue to work until 2.0 but using it will print a deprecation warning to the browser console.
  * `BrandBarViewModel.create` now takes a single `options` parameter.  The container element, which used to be specified as the first parameter, should now be specified as the `container` property of the `options` parameter.  The old function signature will continue to work until 2.0 but using it will print a deprecation warning to the browser console.
* `WebMapServiceCatalogItem` now determines its rectangle from the GetCapabilities metadata even when configured to use multiple WMS layers.
* Added the ability to specify the terrain URL or the `TerrainProvider` to use in the 3D view when constructing `TerriaViewer`.
* `AbsIttCatalogItem` styles can now be set using the `tableStyle` property, much like `CsvCatalogItem`.
* Improved `AbsIttCatalogItem`'s tolerance of errors from the server.
* `NavigationViewModel` can now be constructed with a list of `controls` to include, instead of the standard `ZoomInNavigationControl`, `ResetViewNavigationControl`, and `ZoomOutNavigationControl`.
* Fixed a bug that caused the brand bar to slide away with the explorer panel on Internet Explorer 9.

### 1.0.23

* Fixed a bug that prevented features from being pickable from ABS datasets on the 2D map.
* Fixed a bug that caused the Explorer Panel tabs to be missing or misaligned in Firefox.

### 1.0.22

* Changed to use JPEG instead of PNG format for the Natural Earth II basemap.  This makes the tile download substantially smaller.

### 1.0.21

* Added an `itemProperties` property to `AbsIttCatalogGroup`.
* Added a `nowViewingMessage` property to `CatalogItem`.  This message is shown by the `NowViewingAttentionGrabberViewModel` when the item is enabled.  Each unique message is shown only once.

### 1.0.20

* Added the ability to specify SVG icons on Explorer Panel tabs.
* Added an icon to the Search tab.
* Added support for accessing Australian Bureau of Statistics data via the ABS-ITT API, using `AbsIttCatalogGroup` and `AbsIttCatalogItem`.
* The Now Viewing panel now contains controls for selecting which column to show in CSV datasets.

### 1.0.19

* Added `NowViewingAttentionGrabberViewModel`.  It calls attention the Now Viewing tab the first time a catalog item is enabled.
* Added `isHidden` property to catalog items and groups.  Hidden items and groups do not show up in the catalog or in search results.

### 1.0.18

* Added `featureInfoFields` property to `CsvCatalogItem.tableStyle`.  It allows setting which fields to show in the Feature Info popup, and the name to use for each.
* Added `OpenStreetMapCatalogItem` for connecting to tile servers using the OpenStreetMap tiling scheme.
* Added `CkanCatalogGroup.allowEntireWmsServers` property.  When set and the group discovers a WMS resource without a layer parameter, it adds a catalog item for the entire server instead of ignoring the resource.
* Added `WebMapTileServiceCatalogGroup` and `WebMapTileServiceCatalogItem` for accessing WMTS servers.
* Handle the case of an `ArcGisMapServerCatalogItem` with an advertised extent that is outside the valid range.
* We now pass ArcGIS MapServer metadata, when it's available, through to Cesium's `ArcGisMapServerImageryProvider` so that it doesn't need to re-request the metadata.
* Changed the style of the Menu Bar to have visually-separate menu items.
* Added support for SVG menu item icons to `MenuBarViewModel`.
* Improved popup message box sizing.

### 1.0.17

* Upgraded to TerriajS Cesium 1.10.2.
* Added `ImageryLayerCatalogItem.isRequiredForRendering`.  This is set to false by default and to true for base maps.  Slow datasets with `isRequiredForRendering=false` are less likely to prevent other datasets from appearing in the 3D view.
* The "Dataset Testing" functionality (on the hidden Tools menu accessible by adding `#tools=1` to the URL) now gives up tile requests and considers them failed after two seconds.  It also outputs some JSON that can be used as the `blacklist` property to blacklist all of the datasets that timed out.
* Added a feature to count the total number of datasets from the hidden Tools menu.
* Fixed a bug that caused the 2D / 3D buttons the Maps menu to get out of sync with the actual state of the map after switching automatically to 2D due to a performance problem.

### 1.0.16

* Deprecated:
  * `ArcGisMapServerCatalogGroup` has been deprecated.  Please use `ArcGisCatalogGroup` instead.
* Replaced Cesium animation controller with TerriaJS animation controller.
* Replaced Cesium Viewer widget with the CesiumWidget when running Cesium.
* Added the ability to turn a complete ArcGIS Server, or individual folders within it, into a catalog group using `ArcGisCatalogGroup`.

### 1.0.15

* Fix imagery attribution on the 2D map.

### 1.0.14

* Fixed share URL generation when the application is not running at the root directory of its web server.
* Fixed a bug that caused Internet Explorer 8 users to see a blank page instead of a message saying their browser is incompatible.

### 1.0.13

* Breaking changes:
  * Added a required `@brand-bar-height` property.
* `ExplorerPanelViewModel` can now be created with `isOpen` initially set to false.
* TerriaJS now raises an error and hides the dataset when asked to show an `ImageryLayerCatalogItem` in Leaflet and that catalog item does not use the Web Mercator (EPSG:3857) projection.  Previously, the dataset would silently fail to display.
* Improved error handling in `CzmlCatalogItem`, `GeoJsonCatalogItem`, and `KmlCatalogItem`.
* Made the `clipToRectangle` property available on all `ImageryProvider`-based catalog items, not just `WebMapServiceCatalogItem`.
* Added `CatalogMember.isPromoted` property.  Promoted catalog groups and items are displayed above non-promoted groups and items.
* Add support for ArcGIS MapServer "Raster Layers" in addition to "Feature Layers".

### 1.0.12

* Allow Esri ArcGIS MapServers to be added via the "Add Data" panel.
* Adds `baseMapName` and `viewerMode` fields to init files and share links. `baseMapName` is any base map name in the map settings panel and `viewerMode` can be set to `'2d'` or `'3d'`.
* Added `tableStyle.legendTicks` property to `CsvCatalogItem`.  When specified, the generated legend will have the specified number of equally-spaced lines with labels in its legend.

### 1.0.11

* Fixed a bug that prevented HTML feature information from showing up with a white background in Internet Explorer 9 and 10.
* Fixed a bug that prevented WMS GetCapabilities properties, such as CRS, from being properly inherited from the root layer.
* Tweaked credit / attribution styling.

### 1.0.10

* Added support for a developer attribution on the map.
* Fixed a bug that could cause results from previous async catalog searches to appear in the search results.

### 1.0.9

* Show Cesium `ImageryProvider` tile credits / attribution in Leaflet when using `CesiumTileLayer`.

### 1.0.8

* `WebMapServiceCatalogGroup` now populates the catalog using the hierarchy of layers returned by the WMS server in GetCapabilities.  To keep the previous behavior, set the `flatten` property to true.
* Potentially breaking changes:
  * The `getFeatureInfoAsGeoJson` and `getFeatureInfoAsXml` properties have been removed.  Use `getFeatureInfoFormats` instead.
* Added support for text/html responses from WMS GetFeatureInfo.
* Make the `FeatureInfoPanelViewModel` use a white background when displaying a complete HTML document.
* `KnockoutMarkdownBinding` no longer tries to interpret complete HTML documents (i.e. those that contain an <html> tag) as Markdown.
* The feature info popup for points loaded from CSV files now shows numeric columns with a missing value as blank instead of as 1e-34.
* `ArcGisMapServerCatalogItem` now offers metadata, used to populate the Data Details and Service Details sections of the catalog item info panel.
* `ArcGisMapServerCatalogGroup` now populates a "Service Description" and a "Data Description" info section for each catalog item from the MapServer's metadata.
* The `metadataUrl` is now populated (and shown) from the regular MapServer URL.
* Added 'keepOnTop' flag support for imageryLayers in init file to allow a layer to serve as a mask.
* Added 'keepOnTop' support to region mapping to allow arbitrary masks based on supported regions.
* Checkboxes in the Data Catalogue and Search tabs now have a larger clickable area.

### 1.0.7

* `CatalogItemNameSearchProviderViewModel` now asynchronously loads groups so items in unloaded groups can be found, too.
* Do not automatically fly to the first location when pressing Enter in the Search input box.
* Changed `ArcGisMapServerCatalogItem` to interpret a `maxScale` of 0 from an ArcGIS MapServer as "not specified".
* Added an `itemProperties` property to `ArcGisMapServerCatalogGroup`, allowing properties of auto-discovered layers to be specified explicitly.
* Added `validDropElements`, `validDropClasses`, `invalidDropElements`, and `invalidDropClasses` properties to `DragDropViewModel` for finer control over where dropping is allowed.
* Arbitrary parameters can now be specified in `config.json` by adding them to the `parameters` property.


### 1.0.6

* Added support for region mapping based on region names instead of region numbers (example in `public/test/countries.csv`).
* Added support for time-dynamic region mapping (example in `public/test/droughts.csv`).
* Added the ability to specify CSV styling in the init file (example in `public/init/test.json`).
* Improved the appearance of the legends generated with region mapping.
* Added the ability to region-map countries (example in `public/test/countries.csv`).
* Elminated distracting "jumping" of the selection indicator when picking point features while zoomed in very close to the surface.
* Fixed a bug that caused features to be picked from all layers in an Esri MapServer, instead of just the visible ones.
* Added support for the WMS MinScaleDenominator property and the Esri MapServer maxScale property, preventing layers from disappearing when zoomed in to close to the surface.
* Polygons loaded from KML files are now placed on the terrain surface.
* The 3D viewer now shows Bing Maps imagery unmodified, matching the 2D viewer.  Previously, it applied a gamma correction.
* All catalog items now have an `info` property that allows arbitrary sections to be shown for the item in the info popup.
* `CkanCatalogGroup` now has a `groupBy` property to control whether catalog items are grouped by CKAN group ("group"), CKAN organization ("organization"), or not grouped at all ("none").
* `CkanCatalogGroup` now has a `useResourceName` property to control whether the name of the catalog item is derived from the resource (true), or the dataset itself (false).
* The catalog item info page now renders a much more complete set of Markdown and HTML elements.
