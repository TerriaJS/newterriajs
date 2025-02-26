import toGeoJSON from "@mapbox/togeojson";
import i18next from "i18next";
import { computed, makeObservable, override } from "mobx";
import getFilenameFromUri from "terriajs-cesium/Source/Core/getFilenameFromUri";
import { FeatureCollectionWithCrs } from "../../../Core/GeoJson";
import isDefined from "../../../Core/isDefined";
import loadText from "../../../Core/loadText";
import readText from "../../../Core/readText";
import { networkRequestError } from "../../../Core/TerriaError";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import GpxCatalogItemTraits from "../../../Traits/TraitsClasses/GpxCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

class GpxCatalogItem extends GeoJsonMixin(CreateModel(GpxCatalogItemTraits)) {
  static readonly type = "gpx";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return GpxCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.gpx.name");
  }

  private _gpxFile?: File;

  setFileInput(file: File) {
    this._gpxFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._gpxFile);
  }

  private loadGpxText(text: string) {
    const dom = new DOMParser().parseFromString(text, "text/xml");
    return toGeoJSON.gpx(dom);
  }

  protected async forceLoadGeojsonData(): Promise<FeatureCollectionWithCrs> {
    let data: string | undefined;
    if (isDefined(this.gpxString)) {
      data = this.gpxString;
    } else if (isDefined(this._gpxFile)) {
      data = await readText(this._gpxFile);
    } else if (isDefined(this.url)) {
      data = await loadText(proxyCatalogItemUrl(this, this.url));
    }

    if (!data) {
      throw networkRequestError({
        sender: this,
        title: i18next.t("models.gpx.errorLoadingTitle"),
        message: i18next.t("models.gpx.errorLoadingMessage", {
          appName: this.terria.appName
        })
      });
    }

    return this.loadGpxText(data);
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @override
  get name() {
    if (this.url && super.name === this.url) {
      return getFilenameFromUri(this.url);
    }
    return super.name;
  }
}

export default GpxCatalogItem;
