import { computed, observable } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import clone from "terriajs-cesium/Source/Core/clone";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import ShadowMode from "terriajs-cesium/Source/Scene/ShadowMode";
import isDefined from "../Core/isDefined";
import loadJson from "../Core/loadJson";
import makeRealPromise from "../Core/makeRealPromise";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import Cesium3DTilesCatalogItemTraits, {
  OptionsTraits
} from "../Traits/Cesium3DCatalogItemTraits";
import CreateModel from "./CreateModel";
import Feature from "./Feature";
import Mappable from "./Mappable";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import raiseErrorToUser from "./raiseErrorToUser";

class ObservableCesium3DTileset extends Cesium3DTileset {
  _catalogItem?: Cesium3DTilesCatalogItem;
  @observable destroyed = false;

  destroy() {
    super.destroy();
    this.destroyed = true;
  }
}

export default class Cesium3DTilesCatalogItem
  extends AsyncMappableMixin(
    CatalogMemberMixin(CreateModel(Cesium3DTilesCatalogItemTraits))
  )
  implements Mappable {
  static readonly type = "3d-tiles";
  readonly type = Cesium3DTilesCatalogItem.type;
  readonly typeName = "Cesium 3D Tiles";

  readonly canZoomTo = true;
  readonly showsInfo = true;

  private tileset?: ObservableCesium3DTileset;

  get isMappable() {
    return true;
  }

  protected forceLoadMetadata() {
    return Promise.resolve();
  }

  protected get loadMapItemsPromise() {
    return (async () => {
      const tileset = this.createTileset(
        this.url,
        this.ionAssetId,
        this.ionAccessToken,
        this.ionServer,
        this.optionsObj
      );

      if (isDefined(tileset) && !tileset.destroyed) {
        this.tileset = tileset;
      }
    })();
  }

  @computed get mapItems() {
    if (this.isLoadingMapItems || !isDefined(this.tileset)) {
      return [];
    }

    this.tileset.style = this.cesiumTileStyle;
    this.tileset.shadows = this.cesiumShadows;
    this.tileset.show = this.show;
    return [this.tileset];
  }

  @computed get optionsObj() {
    const options: any = {};
    if (isDefined(this.options)) {
      Object.keys(OptionsTraits.traits).forEach(name => {
        options[name] = (<any>this.options)[name];
      });
    }
    return options;
  }

  private createTileset(
    url: string | undefined,
    ionAssetId: number | undefined,
    ionAccessToken: string | undefined,
    ionServer: string | undefined,
    options: any
  ) {
    if (!isDefined(url) && !isDefined(ionAssetId)) {
      return;
    }

    let resource: Promise<IonResource> | Resource | undefined;
    if (isDefined(ionAssetId)) {
      resource = <Promise<IonResource>>makeRealPromise(
        IonResource.fromAssetId(ionAssetId, {
          accessToken:
            ionAccessToken || this.terria.configParameters.cesiumIonAccessToken,
          server: ionServer
        })
      ).catch(e => {
        raiseErrorToUser(this.terria, e);
      });
    } else if (isDefined(url)) {
      resource = new Resource({ url });
    }

    if (!isDefined(resource)) {
      return;
    }

    const tileset = new ObservableCesium3DTileset({
      ...options,
      url: resource
    });

    tileset._catalogItem = this;
    return tileset;
  }

  @computed get showExpressionFromFilters() {
    if (!isDefined(this.filters)) {
      return;
    }
    const terms = this.filters.map(filter => {
      if (!isDefined(filter.property)) {
        return "";
      }

      const property =
        "${feature['" + filter.property.replace(/'/g, "\\'") + "']}";
      const min =
        isDefined(filter.minimumValue) &&
        isDefined(filter.minimumShown) &&
        filter.minimumShown > filter.minimumValue
          ? property + " >= " + filter.minimumShown
          : "";
      const max =
        isDefined(filter.maximumValue) &&
        isDefined(filter.maximumShown) &&
        filter.maximumShown < filter.maximumValue
          ? property + " <= " + filter.maximumShown
          : "";
      return [min, max].filter(x => x.length > 0).join(" && ");
    });

    const showExpression = terms.join("&&");
    if (showExpression.length > 0) {
      return showExpression;
    }
  }

  @computed get cesiumTileStyle() {
    if (!isDefined(this.style) && !isDefined(this.showExpressionFromFilters)) {
      return;
    }
    const style = clone(this.style || {});
    if (isDefined(this.showExpressionFromFilters)) {
      style.show = this.showExpressionFromFilters;
    }
    return new Cesium3DTileStyle(style);
  }

  @computed get cesiumShadows() {
    switch (this.shadows.toLowerCase()) {
      case "none":
        return ShadowMode.DISABLED;
      case "both":
        return ShadowMode.ENABLED;
      case "cast":
        return ShadowMode.CAST_ONLY;
      case "receive":
        return ShadowMode.RECEIVE_ONLY;
      default:
        return ShadowMode.DISABLED;
    }
  }

  getFeaturesFromPickResult(_screenPosition: Cartesian2, pickResult: any) {
    if (pickResult instanceof Cesium3DTileFeature) {
      const properties: { [name: string]: unknown } = {};
      pickResult.getPropertyNames().forEach(name => {
        properties[name] = pickResult.getProperty(name);
      });

      const result = new Feature({
        properties: properties
      });

      result._catalogItem = this;
      result._cesium3DTileFeature = pickResult;

      (async () => {
        if (isDefined(this.featureInfoUrlTemplate)) {
          const resource = new Resource({
            url: proxyCatalogItemUrl(this, this.featureInfoUrlTemplate, "0d"),
            templateValues: properties
          });
          try {
            const featureInfo = await loadJson(resource);
            Object.keys(featureInfo).forEach(property => {
              result.properties.addProperty(property, featureInfo[property]);
            });
          } catch (e) {
            result.properties.addProperty(
              "Error",
              "Unable to retrieve feature details from:\n\n" + resource.url
            );
          }
        }
      })();
      return result;
    }
  }
}
