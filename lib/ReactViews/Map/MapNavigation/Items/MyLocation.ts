import i18next from "i18next";
import { action, observable, runInAction, makeObservable } from "mobx";
import { RefObject, createRef } from "react";
import CesiumCartographic from "terriajs-cesium/Source/Core/Cartographic";
import URI from "urijs";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import isDefined from "../../../../Core/isDefined";
import TerriaError from "../../../../Core/TerriaError";
import GeoJsonCatalogItem from "../../../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import createStratumInstance from "../../../../Models/Definition/createStratumInstance";
import Terria from "../../../../Models/Terria";
import ViewerMode from "../../../../Models/ViewerMode";
import { GLYPHS } from "../../../../Styled/Icon";
import StyleTraits from "../../../../Traits/TraitsClasses/StyleTraits";
import MapNavigationItemController from "../../../../ViewModels/MapNavigation/MapNavigationItemController";

interface PropTypes {
  terria: Terria;
}

export class MyLocation extends MapNavigationItemController {
  static id = "my-location";
  static displayName = "MyLocation";
  readonly terria: Terria;
  itemRef: RefObject<HTMLDivElement> = createRef();
  private readonly _marker: GeoJsonCatalogItem;
  @observable private watchId: number | undefined;
  @observable private flown: boolean | undefined;

  constructor(props: PropTypes) {
    super();
    makeObservable(this);
    this.terria = props.terria;
    this._marker = new GeoJsonCatalogItem(createGuid(), props.terria);
    this.zoomToMyLocation = this.zoomToMyLocation.bind(this);
    this.handleLocationError = this.handleLocationError.bind(this);
    this.augmentedVirtualityEnabled =
      this.augmentedVirtualityEnabled.bind(this);
    this.followMeEnabled = this.followMeEnabled.bind(this);
  }

  get glyph(): any {
    return GLYPHS.geolocationThick;
  }

  get viewerMode(): ViewerMode | undefined {
    return undefined;
  }

  @action.bound
  getLocation() {
    const t = i18next.t.bind(i18next);
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };
      if (!this.augmentedVirtualityEnabled()) {
        // When Augmented Virtuality is not enabled then just get a single position update.
        navigator.geolocation.getCurrentPosition(
          this.zoomToMyLocation,
          this.handleLocationError,
          options
        );
      } else {
        // When Augmented Virtuality is enabled then we effectively toggle into watch mode and the position is repeatedly updated.
        this.watchId = navigator.geolocation.watchPosition(
          this.zoomToMyLocation,
          this.handleLocationError,
          options
        );
      }
    } else {
      this.terria.raiseErrorToUser(
        new TerriaError({
          sender: this,
          title: t("location.errorGettingLocation"),
          message: t("location.browserCannotProvide")
        })
      );
    }
  }

  zoomToMyLocation(position: GeolocationPosition) {
    const t = i18next.t.bind(i18next);
    const longitude = position.coords.longitude;
    const latitude = position.coords.latitude;

    if (this.augmentedVirtualityEnabled()) {
      // Note: Specifying the value of 27500m here enables this function to approximately mimic the behaviour of
      //       the else case from the cameras initial view and when the viewer pan/zooms out to much.
      // We use the flag variable flown so that the user is flown to the current location when this function is
      // first fired, but subsequently the updates are jump location moves, since we assume that the movements are
      // small and flyTo performs badly when the increments are small (slow and unresponsive).
      this.terria.augmentedVirtuality.moveTo(
        CesiumCartographic.fromDegrees(longitude, latitude),
        27500,
        !isDefined(this.flown)
      );
      this.flown = true;
    } else {
      // west, south, east, north, result
      const rectangle = Rectangle.fromDegrees(
        longitude - 0.1,
        latitude - 0.1,
        longitude + 0.1,
        latitude + 0.1
      );
      this.terria.currentViewer.zoomTo(rectangle);
    }

    runInAction(() => {
      const name = t("location.myLocation");
      this._marker.setTrait(CommonStrata.user, "name", name);
      this._marker.setTrait(CommonStrata.user, "geoJsonData", {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        properties: {
          title: t("location.location"),
          longitude: longitude,
          latitude: latitude
        }
      });
      // Need to specify rectangle for ideal zoom to work properly in 3D map.
      const closeUpRange = 0.002;
      this._marker.setTrait(
        CommonStrata.user,
        "rectangle",
        new Rectangle(
          longitude - closeUpRange,
          latitude - closeUpRange,
          longitude + closeUpRange,
          latitude + closeUpRange
        )
      );
      this._marker.setTrait(
        CommonStrata.user,
        "style",
        createStratumInstance(StyleTraits, {
          "marker-size": "25",
          "marker-color": "#08ABD5",
          stroke: "#ffffff",
          "stroke-width": 3
        })
      );

      this.terria.workbench.add(this._marker);
    });
  }

  handleLocationError(err: GeolocationPositionError) {
    const t = i18next.t.bind(i18next);
    let message = err.message;
    if (message && message.indexOf("Only secure origins are allowed") === 0) {
      // This is actually the recommended way to check for this error.
      // https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only
      const uri = new URI(window.location);
      const secureUrl = uri.protocol("https").toString();
      message = t("location.originError", { secureUrl: secureUrl });
    } else if (err.code === err.PERMISSION_DENIED) {
      message = t("location.permissionDenied");
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      message = t("location.positionUnavailable");
    } else if (err.code === err.TIMEOUT) {
      message = t("location.timeout");
    }
    this.terria.raiseErrorToUser(
      new TerriaError({
        sender: this,
        title: t("location.errorGettingLocation"),
        message: message,
        showDetails: false
      })
    );
  }

  augmentedVirtualityEnabled() {
    return (
      isDefined(this.terria.augmentedVirtuality) &&
      this.terria.augmentedVirtuality.enabled
    );
  }

  followMeEnabled() {
    return !!isDefined(this.watchId);
  }

  @action.bound
  disableFollowMe() {
    if (isDefined(this.watchId)) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
      this.flown = undefined;
    }
  }

  handleClick() {
    if (this.followMeEnabled()) {
      this.disableFollowMe();
    } else {
      this.getLocation();
    }
  }
}
