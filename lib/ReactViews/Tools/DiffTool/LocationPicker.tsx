import { action, observable, reaction } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import LatLonHeight from "../../../Core/LatLonHeight";
import PickedFeatures from "../../../Map/PickedFeatures";
import { addMarker, removeMarker } from "../../../Models/LocationMarkerUtils";
import MapInteractionMode, { UIMode } from "../../../Models/MapInteractionMode";
import Terria from "../../../Models/Terria";
import Loader from "../../Loader";

interface PropsType {
  terria: Terria;
  location?: LatLonHeight;
  onPicking: (pickingLocation: LatLonHeight) => void;
  onPicked: (
    pickedFeatures: PickedFeatures,
    pickedLocation: LatLonHeight
  ) => void;
}

@observer
export default class LocationPicker extends Component<PropsType> {
  @observable private pickMode?: MapInteractionMode;
  @observable private currentPick?: PickedFeatures;
  @observable private pickDisposer?: () => void;

  @action
  setupPicker() {
    const { terria, location, onPicking, onPicked } = this.props;
    this.pickMode = new MapInteractionMode({
      message: "",
      messageAsNode: <div></div>,
      uiMode: UIMode.Difference
    });
    addInteractionModeToMap(terria, this.pickMode);
    if (location) showMarker(terria, location);

    this.pickDisposer = reaction(
      () => this.pickMode!.pickedFeatures,
      action((newPick: PickedFeatures | undefined) => {
        if (newPick === undefined || newPick.pickPosition === undefined) {
          return;
        }

        this.pickMode!.customUi = () => (
          <Loader message={`Querying ${location ? "new" : ""} position...`} />
        );

        const position = cartesianToDegrees(newPick.pickPosition);
        showMarker(this.props.terria, position);

        this.currentPick = newPick;
        onPicking(position);
        newPick.allFeaturesAvailablePromise?.then(() => {
          if (newPick === this.currentPick) {
            onPicked(newPick, position);
          }
        });
      })
    );
  }

  @action
  destroyPicker() {
    const { terria } = this.props;
    if (this.pickMode) {
      removeInteractionModeFromMap(terria, this.pickMode);
    }
    removeMarker(terria);
    this.pickMode = undefined;
    this.currentPick = undefined;
    this.pickDisposer?.();
    this.pickDisposer = undefined;
  }

  componentDidMount() {
    this.setupPicker();
  }

  componentDidUpdate() {
    this.destroyPicker();
    this.setupPicker();
  }

  componentWillUnmount() {
    this.destroyPicker();
  }

  render() {
    return null;
  }
}

function addInteractionModeToMap(terria: Terria, mode: MapInteractionMode) {
  terria.mapInteractionModeStack.push(mode);
}

function removeInteractionModeFromMap(
  terria: Terria,
  mode: MapInteractionMode
) {
  const [currentMode] = terria.mapInteractionModeStack.slice(-1);
  if (currentMode === mode) {
    terria.mapInteractionModeStack.pop();
  }
}

function showMarker(terria: Terria, location: LatLonHeight) {
  addMarker(terria, {
    name: "User selection",
    location,
    customMarkerIcon: require("../../../../wwwroot/images/difference-pin.png")
  });
}

function cartesianToDegrees(cartesian: Cartesian3) {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
  return {
    longitude: CesiumMath.toDegrees(carto.longitude),
    latitude: CesiumMath.toDegrees(carto.latitude)
  };
}
