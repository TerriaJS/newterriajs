import Styles from "./cesium-timeline.scss";
import createReactClass from "create-react-class";
import dateFormat from "dateformat";
import { autorun, runInAction } from "mobx";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import WrappedTimeline from "terriajs-cesium-widgets/Source/Timeline/Timeline";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import { formatDate, formatDateTime, formatTime } from "./DateFormats";

const CesiumTimeline = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired
  },

  componentDidMount() {
    this.cesiumTimeline = new WrappedTimeline(
      this.timelineContainer,
      this.props.terria.timelineClock
    );

    this.cesiumTimeline.makeLabel = (time) => {
      if (defined(this.props.terria.timelineStack.top)) {
        const layer = this.props.terria.timelineStack.top;
        if (
          defined(layer.dateFormat) &&
          defined(layer.dateFormat.timelineTic)
        ) {
          return dateFormat(
            JulianDate.toDate(time),
            layer.dateFormat.timelineTic
          );
        }
      }
      // Adjust the label format as you zoom by using the visible timeline's start and end
      // (not the fixed this.props.terria.timelineClock.startTime and stopTime).
      const startJulian = this.cesiumTimeline._startJulian;
      const endJulian = this.cesiumTimeline._endJulian;
      const totalDays = JulianDate.daysDifference(endJulian, startJulian);
      if (totalDays > 14) {
        return formatDate(JulianDate.toDate(time), this.locale);
      } else if (totalDays < 1) {
        return formatTime(JulianDate.toDate(time), this.locale);
      }

      return formatDateTime(JulianDate.toDate(time), this.locale);
    };

    this.cesiumTimeline.addEventListener(
      "settime",
      (e) => {
        const clock = e.clock;
        clock.currentTime = e.timeJulian;
        clock.shouldAnimate = false;
        const timelineStack = this.props.terria.timelineStack;
        if (timelineStack.top) {
          runInAction(() => {
            timelineStack.syncToClock(CommonStrata.user);
          });
        }
        this.props.terria.currentViewer.notifyRepaintRequired();
      },
      false
    );

    this.disposeZoomAutorun = autorun(() => {
      const timelineStack = this.props.terria.timelineStack;
      const topLayer = timelineStack.top;
      if (topLayer) {
        this.cesiumTimeline.zoomTo(
          topLayer.startTimeAsJulianDate,
          topLayer.stopTimeAsJulianDate
        );
      }
    });

    this.resizeListener = () => {
      if (this.cesiumTimeline) {
        this.cesiumTimeline.resize();
      }
    };
    window.addEventListener("resize", this.resizeListener, false);
  },

  componentWillUnmount() {
    this.disposeZoomAutorun();
    window.removeEventListener("resize", this.resizeListener);
  },

  shouldComponentUpdate() {
    return false;
  },

  render() {
    return (
      <div
        className={Styles.cesiumTimeline}
        ref={(ref) => {
          this.timelineContainer = ref;
        }}
      />
    );
  }
});

export default CesiumTimeline;
