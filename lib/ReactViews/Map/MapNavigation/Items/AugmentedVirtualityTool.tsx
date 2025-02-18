import i18next from "i18next";
import { action, computed, observable, makeObservable } from "mobx";
import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import AugmentedVirtuality from "../../../../Models/AugmentedVirtuality";
import Terria from "../../../../Models/Terria";
import ViewerMode from "../../../../Models/ViewerMode";
import ViewState from "../../../../ReactViewModels/ViewState";
import { GLYPHS, Icon } from "../../../../Styled/Icon";
import MapNavigationItemController from "../../../../ViewModels/MapNavigation/MapNavigationItemController";
import MapIconButton from "../../../MapIconButton/MapIconButton";

interface IAugmentedVirtuality {
  augmentedVirtuality: AugmentedVirtuality;
}

interface IProps extends IAugmentedVirtuality {
  terria: Terria;
  viewState: ViewState;
  experimentalWarning?: boolean;
}

export const AR_TOOL_ID = "AR_TOOL";

async function requestDeviceMotionPermission(): Promise<"granted" | "denied"> {
  const requestPermission: () => Promise<"granted" | "denied"> =
    window.DeviceMotionEvent &&
    typeof (DeviceMotionEvent as any).requestPermission === "function"
      ? (DeviceMotionEvent as any).requestPermission
      : () => Promise.resolve("granted");
  return requestPermission();
}

async function requestDeviceOrientationPermission(): Promise<
  "granted" | "denied"
> {
  const requestPermission: () => Promise<"granted" | "denied"> =
    window.DeviceOrientationEvent &&
    typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ? (DeviceOrientationEvent as any).requestPermission
      : () => Promise.resolve("granted");
  return requestPermission();
}

export class AugmentedVirtualityController extends MapNavigationItemController {
  @observable experimentalWarningShown = false;

  constructor(private props: IProps) {
    super();
    makeObservable(this);
  }

  @computed
  get active(): boolean {
    return this.props.augmentedVirtuality.active;
  }

  get glyph(): { id: string } {
    return this.active ? GLYPHS.arOn : GLYPHS.arOff;
  }

  get viewerMode(): ViewerMode {
    return ViewerMode.Cesium;
  }

  @action.bound
  activate() {
    // Make the AugmentedVirtuality module avaliable elsewhere.
    this.props.terria.augmentedVirtuality = this.props.augmentedVirtuality;
    // feature detect for new ios 13
    // it seems you don't need to ask for both, but who knows, ios 14 / something
    // could change again
    requestDeviceMotionPermission()
      .then((permissionState) => {
        if (permissionState !== "granted") {
          console.error("couldn't get access for motion events");
        }
      })
      .catch(console.error);

    requestDeviceOrientationPermission()
      .then((permissionState) => {
        if (permissionState !== "granted") {
          console.error("couldn't get access for orientation events");
        }
      })
      .catch(console.error);

    const { experimentalWarning = true } = this.props;

    if (experimentalWarning !== false && !this.experimentalWarningShown) {
      this.experimentalWarningShown = true;
      this.props.viewState.terria.notificationState.addNotificationToQueue({
        title: i18next.t("AR.title"),
        message: i18next.t("AR.experimentalFeatureMessage"),
        confirmText: i18next.t("AR.confirmText")
      });
    }
    this.props.augmentedVirtuality.activate();
  }

  deactivate() {
    this.props.augmentedVirtuality.deactivate();
  }
}

export class AugmentedVirtualityRealignController extends MapNavigationItemController {
  @observable experimentalWarningShown = false;
  @observable realignHelpShown = false;
  @observable resetRealignHelpShown = false;
  augmentedVirtuality: AugmentedVirtuality;

  constructor(private props: IProps) {
    super();
    makeObservable(this);
    this.augmentedVirtuality = props.augmentedVirtuality;
  }

  @computed
  get glyph(): { id: string } {
    return !this.augmentedVirtuality.manualAlignmentSet
      ? GLYPHS.arRealign
      : GLYPHS.arResetAlignment;
  }

  get viewerMode(): ViewerMode {
    return ViewerMode.Cesium;
  }

  @computed
  get visible(): boolean {
    return this.props.augmentedVirtuality.active && super.visible;
  }

  handleClick(): void {
    if (!this.augmentedVirtuality.manualAlignmentSet) {
      this.handleClickRealign();
    } else if (!this.augmentedVirtuality.manualAlignment) {
      this.handleClickResetRealign();
    }
  }

  @action.bound
  handleClickRealign() {
    if (!this.realignHelpShown) {
      this.realignHelpShown = true;

      this.props.viewState.terria.notificationState.addNotificationToQueue({
        title: i18next.t("AR.manualAlignmentTitle"),
        message: i18next.t("AR.manualAlignmentMessage", {
          img: '<img width="100%" src="./build/TerriaJS/images/ar-realign-guide.gif" />'
        }),
        confirmText: i18next.t("AR.confirmText")
      });
    }

    this.augmentedVirtuality.toggleManualAlignment();
  }

  @action.bound
  handleClickResetRealign() {
    if (!this.resetRealignHelpShown) {
      this.resetRealignHelpShown = true;
      this.props.viewState.terria.notificationState.addNotificationToQueue({
        title: i18next.t("AR.resetAlignmentTitle"),
        message: i18next.t("AR.resetAlignmentMessage"),
        confirmText: i18next.t("AR.confirmText")
      });
    }

    this.augmentedVirtuality.resetAlignment();
  }
}

export const AugmentedVirtualityRealign: FC<
  React.PropsWithChildren<{
    arRealignController: AugmentedVirtualityRealignController;
  }>
> = observer(
  (props: { arRealignController: AugmentedVirtualityRealignController }) => {
    const augmentedVirtuality = props.arRealignController.augmentedVirtuality;
    const realignment = augmentedVirtuality.manualAlignment;
    const { t } = useTranslation();
    return !augmentedVirtuality.manualAlignmentSet ? (
      <StyledMapIconButton
        noExpand
        blink={realignment}
        iconElement={() => <Icon glyph={GLYPHS.arRealign} />}
        title={t("AR.btnRealign")}
        onClick={props.arRealignController.handleClickRealign}
      />
    ) : (
      <MapIconButton
        noExpand
        iconElement={() => <Icon glyph={GLYPHS.arResetAlignment} />}
        title={t("AR.btnResetRealign")}
        onClick={props.arRealignController.handleClickResetRealign}
      />
    );
  }
);

export class AugmentedVirtualityHoverController extends MapNavigationItemController {
  constructor(private props: IAugmentedVirtuality) {
    super();
    makeObservable(this);
  }

  get glyph(): { id: string } {
    const hoverLevel = this.props.augmentedVirtuality.hoverLevel;
    // Note: We use the image of the next level that we will be changing to, not the level the we are currently at.
    switch (hoverLevel) {
      case 0:
        return GLYPHS.arHover0;
      case 1:
        return GLYPHS.arHover1;
      case 2:
        return GLYPHS.arHover2;
      default:
        return GLYPHS.arHover0;
    }
  }

  get viewerMode(): ViewerMode {
    return ViewerMode.Cesium;
  }

  @computed
  get visible(): boolean {
    return this.props.augmentedVirtuality.active && super.visible;
  }

  handleClick(): void {
    this.props.augmentedVirtuality.toggleHoverHeight();
  }
}

const StyledMapIconButton = styled(MapIconButton)<{ blink: boolean }>`
  svg {
    ${(p) =>
      p.blink &&
      `
      -webkit-animation-name: blinker;
      -webkit-animation-duration: 1s;
      -webkit-animation-timing-function: linear;
      -webkit-animation-iteration-count: infinite;

      -moz-animation-name: blinker;
      -moz-animation-duration: 1s;
      -moz-animation-timing-function: linear;
      -moz-animation-iteration-count: infinite;

      animation-name: blinker;
      animation-duration: 1s;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    `}
  }

  @-moz-keyframes blinker {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @-webkit-keyframes blinker {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes blinker {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;
