import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import PickedFeatures from "../Map/PickedFeatures/PickedFeatures";
import { observable, makeObservable } from "mobx";
import ViewState from "../ReactViewModels/ViewState";
import { ReactNode } from "react";

export enum UIMode {
  Difference
}

interface Options {
  onCancel?: () => void;
  message: string;
  messageAsNode?: ReactNode;
  customUi?: () => unknown;
  buttonText?: string;
  uiMode?: UIMode; // diff tool hack for now
  onEnable?: (viewState: ViewState) => void;
  invisible?: boolean;
}

/**
 * A mode for interacting with the map.
 */
export default class MapInteractionMode {
  readonly onCancel?: () => void;

  readonly buttonText: string;
  readonly uiMode: UIMode;

  readonly invisible: boolean;

  @observable
  customUi: (() => any) | undefined;

  @observable
  message: () => string;

  @observable
  messageAsNode: () => ReactNode;

  @observable
  pickedFeatures?: PickedFeatures;

  onEnable?: (viewState: ViewState) => void;

  constructor(options: Options) {
    makeObservable(this);
    /**
     * Gets or sets a callback that is invoked when the user cancels the interaction mode.  If this property is undefined,
     * the interaction mode cannot be canceled.
     */
    this.onCancel = options.onCancel;

    /**
     * Gets or sets the details of a custom user interface for this map interaction mode. This property is not used by
     * the `MapInteractionMode` itself, so it can be anything that is suitable for the user interface. In the standard
     * React-based user interface included with TerriaJS, this property is a function that is called with no parameters
     * and is expected to return a React component.
     */
    this.customUi = options.customUi;

    /**
     * Gets or sets the html formatted message displayed on the map when in this mode.
     */
    this.message = function () {
      return options.message;
    };

    /**
     * Gets or sets the react node displayed on the map when in this mode.
     */
    this.messageAsNode = function () {
      return options.messageAsNode;
    };

    /**
     * Set the text of the button for the dialog the message is displayed on.
     */
    this.buttonText = defaultValue(options.buttonText, "Cancel");

    /**
     * Gets or sets the features that are currently picked.
     */
    this.pickedFeatures = undefined;

    /**
     * Gets or sets whether to use the diff tool UI+styles
     */
    this.uiMode = defaultValue(options.uiMode, undefined);

    /**
     * Determines whether a rectangle will be requested from the user rather than a set of pickedFeatures.
     */
    // this.drawRectangle = defaultValue(options.drawRectangle, false);
    this.onEnable = options.onEnable;

    this.invisible = defaultValue(options.invisible, false);
  }
}
