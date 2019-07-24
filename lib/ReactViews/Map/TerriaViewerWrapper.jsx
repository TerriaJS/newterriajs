import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

// import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Styles from "./terria-viewer-wrapper.scss";

import Splitter from "./Splitter";
// eslint-disable-next-line no-unused-vars
import TerriaViewer from "../../ViewModels/TerriaViewer";
// eslint-disable-next-line no-unused-vars
import Terria from "../../Models/Terria";
// eslint-disable-next-line no-unused-vars
import ViewState from "../../ReactViewModels/ViewState";
import { runInAction } from "mobx";

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {ViewState} viewState
 *
 * @extends {React.Component<Props>}
 */
@observer
class TerriaViewerWrapper extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  };
  lastMouseX = -1;
  lastMouseY = -1;

  /**
   * @argument {HTMLDivElement} container
   */
  containerRef = container => {
    this.props.terria.mainViewer.attached &&
      this.props.terria.mainViewer.detach();
    if (container !== null) {
      this.props.terria.mainViewer.attach(container);
    }
  };

  componentDidMount() {
    // Create the map/globe.
    // this.terriaViewer = TerriaViewer.create(this.props.terria, {
    //     terrain: this.props.terria.configParameters.cesiumTerrainUrl,
    //     developerAttribution: {
    //         text: 'Data61',
    //         link: 'http://www.csiro.au/en/Research/D61'
    //     }
    // });
    if (this.props.terria.baseMaps.length > 0) {
      runInAction(() => {
        this.props.terria.mainViewer.baseMap = this.props.terria.baseMaps[0].mappable;
      });
    }
  }

  componentWillUnmount() {
    this.props.terria.mainViewer.attached &&
      this.props.terria.mainViewer.detach();
  }

  onMouseMove(event) {
    // Avoid duplicate mousemove events.  Why would we get duplicate mousemove events?  I'm glad you asked:
    // http://stackoverflow.com/questions/17818493/mousemove-event-repeating-every-second/17819113
    // I (Kevin Ring) see this consistently on my laptop when Windows Media Player is running.
    // if (event.clientX === this.lastMouseX && event.clientY === this.lastMouseY) {
    //     return;
    // }
    // this.lastMouseX = event.clientX;
    // this.lastMouseY = event.clientY;
    // if (this.props.terria.cesium) {
    //     const rect = this.mapElement.getBoundingClientRect();
    //     const position = new Cartesian2(event.clientX - rect.left, event.clientY - rect.top);
    //     this.props.viewState.mouseCoords.updateCoordinatesFromCesium(this.props.terria, position);
    // } else if (this.props.terria.leaflet) {
    //     this.props.viewState.mouseCoords.updateCoordinatesFromLeaflet(this.props.terria, event.nativeEvent);
    // }
  }

  render() {
    return (
      <aside className={Styles.container}>
        <div className={Styles.mapPlaceholder}>
          Loading the map, please wait...
        </div>
        <Splitter terria={this.props.terria} />
        <div
          id="cesiumContainer"
          className={Styles.cesiumContainer}
          ref={this.containerRef}
          onMouseMove={this.onMouseMove}
        />
      </aside>
    );
  }
}
module.exports = TerriaViewerWrapper;
