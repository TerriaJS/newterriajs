"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import EventHelper from "terriajs-cesium/Source/Core/EventHelper";
import Styles from "./progress-bar.scss";

// The map navigation region
const ProgressBar = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      visible: "hidden"
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.eventHelper = new EventHelper();

    this.eventHelper.add(
      this.props.terria.tileLoadProgressEvent,
      this.setProgress
    );

    // TODO - is this actually needed now? load events always get called when
    // changing viewer. if still reuqired,
    // clear progress when new viewer observed, rather than mounting to a 'current viewer'

    // // Clear progress when the viewer changes so we're not left with an invalid progress bar hanging on the screen.
    // this.eventHelper.add(
    //   this.props.terria.currentViewer.beforeViewerChanged,
    //   this.setProgress.bind(this, 0, 0)
    // );
  },

  setProgress(remaining, max) {
    const rawPercentage = (1 - remaining / max) * 100;
    const sanitisedPercentage = Math.floor(remaining > 0 ? rawPercentage : 100);

    this.setState({
      percentage: sanitisedPercentage
    });
  },

  componentWillUnmount() {
    this.eventHelper.removeAll();
  },

  render() {
    const width = this.state.percentage + "%";
    const visibility = this.state.percentage < 100 ? "visible" : "hidden";
    const complete = this.state.percentage === 100;

    return (
      <div
        className={classNames(Styles.progressBar, {
          [Styles.complete]: complete
        })}
        style={{ visibility, width }}
      />
    );
  }
});
module.exports = ProgressBar;
