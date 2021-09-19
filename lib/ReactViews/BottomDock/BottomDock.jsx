"use strict";
import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import measureElement from "../../ReactViews/HOCs/measureElement";
import ChartPanel from "../Custom/Chart/ChartPanel";
import Styles from "./bottom-dock.scss";
import ChartDisclaimer from "./ChartDisclaimer";
import Timeline from "./Timeline/Timeline";

const BottomDock = observer(
  createReactClass({
    displayName: "BottomDock",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      heightFromMeasureElementHOC: PropTypes.number,
      domElementRef: PropTypes.func
    },

    handleClick() {
      runInAction(() => {
        this.props.viewState.topElement = "BottomDock";
      });
    },

    componentDidUpdate(prevProps) {
      if (
        prevProps.heightFromMeasureElementHOC !==
        this.props.heightFromMeasureElementHOC
      ) {
        this.props.viewState.setBottomDockHeight(
          this.props.heightFromMeasureElementHOC
        );
      }
    },

    render() {
      const { terria } = this.props;
      const top = terria.timelineStack.top;

      return (
        <div
          className={`${Styles.bottomDock} ${
            this.props.viewState.topElement === "BottomDock"
              ? "top-element"
              : ""
          }`}
          ref={element => {
            this.props.domElementRef(element);
            this.refToMeasure = element;
          }}
          tabIndex={0}
          onClick={this.handleClick}
          css={`
            background: ${p => p.theme.dark};
          `}
        >
          <ChartDisclaimer terria={terria} viewState={this.props.viewState} />
          <ChartPanel
            terria={terria}
            onHeightChange={this.onHeightChange}
            viewState={this.props.viewState}
          />
          <If condition={top}>
            <Timeline terria={terria} />
          </If>
          {/* Used for react portals - do not remove without updating portals using this */}
          <div id="TJS-BottomDockPortalForTool" />
        </div>
      );
    }
  })
);

module.exports = measureElement(BottomDock, false);
