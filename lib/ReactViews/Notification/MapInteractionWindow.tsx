import classNames from "classnames";
import { Lambda, observable, reaction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import styled from "styled-components";
import isDefined from "../../Core/isDefined";
import MapInteractionMode, { UIMode } from "../../Models/MapInteractionMode";
import ViewState from "../../ReactViewModels/ViewState";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import { withViewState } from "../Context";
import Styles from "./map-interaction-window.scss";

const MapInteractionWindowWrapper = styled.div<{ isDiffTool: boolean }>`
  ${(props) =>
    props.isDiffTool &&
    `
    display: none;
    top: initial;
    bottom: 100px;
    min-width: 330px;
    width: auto;

    box-sizing: border-box;
    padding: 10px 15px;
    background: ${props.theme.colorSecondary};
    color:${props.theme.textLight};
  `}
`;

@observer
class MapInteractionWindow extends Component<{
  viewState: ViewState;
}> {
  displayName = "MapInteractionWindow";

  private disposeMapInteractionObserver?: Lambda;

  @observable currentInteractionMode?: MapInteractionMode;

  constructor(props: { viewState: ViewState }) {
    super(props);
    makeObservable(this);
  }

  componentWillUnmount() {
    // this.removeContextItem();
    if (typeof this.currentInteractionMode?.onEnable === "function") {
      this.currentInteractionMode.onEnable(this.props.viewState);
    }

    if (this.disposeMapInteractionObserver) {
      this.disposeMapInteractionObserver();
    }
  }

  componentDidMount() {
    this.disposeMapInteractionObserver = reaction(
      () =>
        this.props.viewState.terria.mapInteractionModeStack.length > 0 &&
        this.props.viewState.terria.mapInteractionModeStack[
          this.props.viewState.terria.mapInteractionModeStack.length - 1
        ],
      () => {
        const mapInteractionMode =
          this.props.viewState.terria.mapInteractionModeStack[
            this.props.viewState.terria.mapInteractionModeStack.length - 1
          ];

        if (mapInteractionMode !== this.currentInteractionMode) {
          this.currentInteractionMode = mapInteractionMode;
        }

        if (typeof this.currentInteractionMode?.onEnable === "function") {
          this.currentInteractionMode.onEnable(this.props.viewState);
        }
      }
    );
  }

  // /* eslint-disable-next-line camelcase */
  // UNSAFE_componentWillReceiveProps(nextProps: any) {
  //   // Only enable context item if MapInteractionWindow is rendering
  //   if (isDefined(this.currentInteractionMode)) {
  //     this.enableContextItem(nextProps);
  //   } else {
  //     this.removeContextItem();
  //   }
  // }

  // enableContextItem(props: any) {
  //   this.removeContextItem();
  //   if (
  //     defined(props.viewState.previewedItem) &&
  //     defined(props.viewState.previewedItem.contextItem)
  //   ) {
  //     props.viewState.previewedItem.contextItem.isEnabled = true;
  //     this._lastContextItem = props.viewState.previewedItem.contextItem;
  //   }
  // }

  // removeContextItem() {
  //   if (defined(this._lastContextItem)) {
  //     this._lastContextItem.isEnabled = false;
  //     this._lastContextItem = undefined;
  //   }
  // }

  render() {
    const isActive =
      isDefined(this.currentInteractionMode) &&
      !this.currentInteractionMode.invisible;

    const windowClass = classNames(Styles.window, {
      [Styles.isActive]: isActive
    });

    const isDiffTool =
      this.currentInteractionMode?.uiMode === UIMode.Difference;

    return (
      <MapInteractionWindowWrapper
        className={windowClass}
        aria-hidden={!isActive}
        isDiffTool={isDiffTool}
      >
        <div
          className={classNames({
            [Styles.content]: !isDiffTool
          })}
        >
          {isDefined(this.currentInteractionMode) &&
            parseCustomHtmlToReact(this.currentInteractionMode.message())}
          {isDefined(this.currentInteractionMode) &&
            this.currentInteractionMode.messageAsNode()}
        </div>
        {typeof this.currentInteractionMode?.customUi === "function" &&
          this.currentInteractionMode.customUi()}
        {this.currentInteractionMode?.onCancel && (
          <button
            type="button"
            onClick={this.currentInteractionMode.onCancel}
            className={Styles.btn}
          >
            {this.currentInteractionMode.buttonText}
          </button>
        )}
      </MapInteractionWindowWrapper>
    );
  }
}

export default withViewState(MapInteractionWindow);
