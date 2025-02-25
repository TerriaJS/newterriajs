import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import ChartPanel from "../Custom/Chart/ChartPanel";
import measureElement, { MeasureElementProps } from "../HOCs/measureElement";
import withControlledVisibility from "../HOCs/withControlledVisibility";
import ChartDisclaimer from "./ChartDisclaimer";
import Timeline from "./Timeline/Timeline";
import { DefaultTheme, withTheme } from "styled-components";

interface PropsType {
  terria: Terria;
  viewState: ViewState;
  theme: DefaultTheme;
}

@observer
class BottomDock extends React.Component<PropsType & MeasureElementProps> {
  refToMeasure: HTMLDivElement | null = null;

  handleClick() {
    runInAction(() => {
      this.props.viewState.topElement = "BottomDock";
    });
  }

  componentDidUpdate(prevProps: PropsType & MeasureElementProps) {
    if (
      prevProps.heightFromMeasureElementHOC !==
      this.props.heightFromMeasureElementHOC
    ) {
      this.props.viewState.setBottomDockHeight(
        this.props.heightFromMeasureElementHOC ?? 0
      );
    }
  }

  render() {
    const { terria } = this.props;
    const top = terria.timelineStack.top;

    return (
      <div
        className={`${
          this.props.viewState.topElement === "BottomDock" ? "top-element" : ""
        }`}
        ref={(element) => {
          if (element !== null) {
            this.refToMeasure = element;
          }
        }}
        tabIndex={0}
        onClick={this.handleClick.bind(this)}
        css={`
          z-index: 10;
          bottom: 0;
          right: 0;
          position: relative;
        `}
      >
        <div id="TJS-BottomDockFirstPortal" />
        {!this.props.viewState.useSmallScreenInterface && (
          <>
            <ChartDisclaimer terria={terria} viewState={this.props.viewState} />
            <ChartPanel terria={terria} viewState={this.props.viewState} />
          </>
        )}
        {top && (
          <Timeline
            terria={terria}
            elementConfig={this.props.terria.elements.get("timeline")}
          />
        )}
        {/* Used for react portals - do not remove without updating portals using this */}
        <div id="TJS-BottomDockLastPortal" />
      </div>
    );
  }
}

export default withControlledVisibility(
  withTheme(measureElement(BottomDock, false))
);
