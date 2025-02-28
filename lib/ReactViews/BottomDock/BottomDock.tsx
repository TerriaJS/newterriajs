import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import ChartPanel from "../Custom/Chart/ChartPanel";
import measureElement, { MeasureElementProps } from "../HOCs/measureElement";
import withControlledVisibility from "../HOCs/withControlledVisibility";
import Styles from "./bottom-dock.scss";
import ChartDisclaimer from "./ChartDisclaimer";
import Timeline from "./Timeline/Timeline";

interface PropsType {
  terria: Terria;
  viewState: ViewState;
}

@observer
class BottomDock extends Component<PropsType & MeasureElementProps> {
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
        className={`${Styles.bottomDock} ${
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
          background: ${(p: any) => p.theme.dark};
        `}
      >
        <div id="TJS-BottomDockFirstPortal" />
        <ChartDisclaimer terria={terria} viewState={this.props.viewState} />
        <ChartPanel terria={terria} viewState={this.props.viewState} />
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

export default withControlledVisibility(measureElement(BottomDock, false));
