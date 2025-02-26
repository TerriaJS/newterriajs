import i18next from "i18next";
import { computed, makeObservable, runInAction } from "mobx";
import {
  GeomType,
  LabelRule,
  LineSymbolizer,
  PaintRule,
  PolygonSymbolizer
} from "protomaps-leaflet";
import { JsonObject } from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import TerriaError from "../../../Core/TerriaError";
import ProtomapsImageryProvider from "../../../Map/ImageryProvider/ProtomapsImageryProvider";
import { mapboxStyleJsonToProtomaps } from "../../../Map/Vector/Protomaps/mapboxStyleJsonToProtomaps";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import LegendTraits, {
  LegendItemTraits
} from "../../../Traits/TraitsClasses/LegendTraits";
import MapboxVectorTileCatalogItemTraits from "../../../Traits/TraitsClasses/MapboxVectorTileCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

class MapboxVectorTileLoadableStratum extends LoadableStratum(
  MapboxVectorTileCatalogItemTraits
) {
  static stratumName = "MapboxVectorTileLoadable";

  constructor(
    readonly item: MapboxVectorTileCatalogItem,
    readonly styleJson: JsonObject | undefined
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new MapboxVectorTileLoadableStratum(
      newModel as MapboxVectorTileCatalogItem,
      this.styleJson
    ) as this;
  }

  static async load(item: MapboxVectorTileCatalogItem) {
    let styleJson: JsonObject | undefined;
    if (item.styleUrl) {
      try {
        styleJson = await loadJson(proxyCatalogItemUrl(item, item.styleUrl));
      } catch (e) {
        throw TerriaError.from(
          e,
          `Failed to load style JSON from url ${item.styleUrl}`
        );
      }
    }
    return new MapboxVectorTileLoadableStratum(item, styleJson);
  }

  get style() {
    return this.styleJson;
  }

  get opacity() {
    return 1;
  }

  @computed get legends() {
    if (!this.item.fillColor && !this.item.lineColor) return [];
    return [
      createStratumInstance(LegendTraits, {
        items: [
          createStratumInstance(LegendItemTraits, {
            color: this.item.fillColor,
            outlineColor: this.item.lineColor,
            outlineWidth: this.item.lineColor ? 1 : undefined,
            title: this.item.name
          })
        ]
      })
    ];
  }
}

StratumOrder.addLoadStratum(MapboxVectorTileLoadableStratum.stratumName);

class MapboxVectorTileCatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(MapboxVectorTileCatalogItemTraits)))
) {
  static readonly type = "mvt";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return MapboxVectorTileCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.mapboxVectorTile.name");
  }

  async forceLoadMetadata() {
    const stratum = await MapboxVectorTileLoadableStratum.load(this);
    runInAction(() => {
      this.strata.set(MapboxVectorTileLoadableStratum.stratumName, stratum);
    });
  }

  @computed
  get parsedJsonStyle() {
    if (this.style) {
      return mapboxStyleJsonToProtomaps(this.style, {});
    }
    return undefined;
  }

  @computed
  /** Convert traits into paint rules:
   * - `layer` and `fillColor`/`lineColor` into simple rules
   * - `parsedJsonStyle`
   */
  get paintRules(): PaintRule[] {
    const rules: PaintRule[] = [];

    if (this.layer) {
      if (this.fillColor) {
        rules.push({
          dataLayer: this.layer,
          symbolizer: new PolygonSymbolizer({ fill: this.fillColor }),
          minzoom: this.minimumZoom,
          maxzoom: this.maximumZoom,
          // Only apply polygon/fill symbolizer to polygon features (otherwise it will also apply to line features)
          filter: (_z, f) => f.geomType === GeomType.Polygon
        });
      }
      if (this.lineColor) {
        rules.push({
          dataLayer: this.layer,
          symbolizer: new LineSymbolizer({ color: this.lineColor }),
          minzoom: this.minimumZoom,
          maxzoom: this.maximumZoom
        });
      }
    }

    if (this.parsedJsonStyle) {
      rules.push(...this.parsedJsonStyle.paintRules);
    }

    return rules;
  }

  @computed
  get labelRules(): LabelRule[] {
    if (this.parsedJsonStyle) {
      return this.parsedJsonStyle.labelRules;
    }
    return [];
  }

  @computed
  get imageryProvider(): ProtomapsImageryProvider | undefined {
    if (this.url === undefined) {
      return;
    }

    return new ProtomapsImageryProvider({
      terria: this.terria,
      // Use the URL as the id, this is needed for backward compatibility with MapboxImageryProvider, for when picking features (as it uses the URL as the id)
      id: this.url,
      data: proxyCatalogItemUrl(this, this.url),
      minimumZoom: this.minimumZoom,
      maximumNativeZoom: this.maximumNativeZoom,
      maximumZoom: this.maximumZoom,
      rectangle: this.cesiumRectangle,
      credit: this.attribution,
      paintRules: this.paintRules,
      labelRules: this.labelRules,
      idProperty: this.idProperty
    });
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems(): MapItem[] {
    if (this.isLoadingMapItems || this.imageryProvider === undefined) {
      return [];
    }

    return [
      {
        imageryProvider: this.imageryProvider,
        show: this.show,
        alpha: this.opacity,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
  }
}

export default MapboxVectorTileCatalogItem;
