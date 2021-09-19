"use strict";

import { Component } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
const parseCustomHtmlToReact = require("../Custom/parseCustomHtmlToReact")
  .default;
import Styles from "./map-interaction-window.scss";
import classNames from "classnames";
import { observer } from "mobx-react";
import MapInteractionMode, { UIMode } from "../../Models/MapInteractionMode";
import { observable, Lambda, reaction } from "mobx";
import isDefined from "../../Core/isDefined";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

const MapInteractionWindowWrapper = styled.div<{ isDiffTool: boolean }>`
  ${props =>
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
export default class MapInteractionWindow extends Component<{
  terria: Terria;
  viewState: ViewState;
}> {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object
  };

  displayName = "MapInteractionWindow";

  private disposeMapInteractionObserver?: Lambda;

  @observable currentInteractionMode?: MapInteractionMode;

  componentWillUnmount() {
    // this.removeContextItem();
    if (typeof this.currentInteractionMode?.onEnable === "function") {
      this.currentInteractionMode.onEnable(this.props.viewState);
    }

    this.disposeMapInteractionObserver && this.disposeMapInteractionObserver();
  }

  componentDidMount() {
    this.disposeMapInteractionObserver = reaction(
      () =>
        this.props.terria.mapInteractionModeStack.length > 0 &&
        this.props.terria.mapInteractionModeStack[
          this.props.terria.mapInteractionModeStack.length - 1
        ],
      () => {
        const mapInteractionMode = this.props.terria.mapInteractionModeStack[
          this.props.terria.mapInteractionModeStack.length - 1
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
