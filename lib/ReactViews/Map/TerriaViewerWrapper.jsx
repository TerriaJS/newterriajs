import { Component } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import Styles from "./terria-viewer-wrapper.scss";

import Splitter from "./Splitter";
// eslint-disable-next-line no-unused-vars
import TerriaViewer from "../../ViewModels/TerriaViewer";

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {ViewState} viewState
 *
 * @extends {React.Component<Props>}
 */
@observer
class TerriaViewerWrapper extends Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  };

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

  componentWillUnmount() {
    this.props.terria.mainViewer.attached &&
      this.props.terria.mainViewer.detach();
  }

  render() {
    return (
      <aside className={Styles.container}>
        <div className={Styles.mapPlaceholder}>
          Loading the map, please wait...
        </div>
        <Splitter terria={this.props.terria} viewState={this.props.viewState} />
        <div
          id="cesiumContainer"
          className={Styles.cesiumContainer}
          ref={this.containerRef}
        />
      </aside>
    );
  }
}
module.exports = TerriaViewerWrapper;
