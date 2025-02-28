import dateFormat from "dateformat";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import withControlledVisibility from "../../HOCs/withControlledVisibility";
import CesiumTimeline from "./CesiumTimeline";
import { formatDateTime } from "./DateFormats";
import DateTimePicker from "./DateTimePicker";
import Styles from "./timeline.scss";
import TimelineControls from "./TimelineControls";

@observer
class Timeline extends Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    locale: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isPickerOpen: false
    };
  }

  componentDidMount() {
    this.props.terria.timelineStack.activate();
  }

  componentWillUnmount() {
    this.props.terria.timelineStack.deactivate();
  }

  changeDateTime(time) {
    this.props.terria.timelineClock.currentTime = JulianDate.fromDate(
      new Date(time)
    );
    this.props.terria.timelineStack.syncToClock(CommonStrata.user);
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  onOpenPicker() {
    this.setState({
      isPickerOpen: true
    });
  }

  onClosePicker() {
    this.setState({
      isPickerOpen: false
    });
  }

  render() {
    const terria = this.props.terria;
    const catalogItem = terria.timelineStack.top;
    if (
      !defined(catalogItem) ||
      !defined(catalogItem.currentTimeAsJulianDate)
    ) {
      return null;
    }
    const { t } = this.props;

    const jsDate = JulianDate.toDate(catalogItem.currentTimeAsJulianDate);
    const timelineStack = this.props.terria.timelineStack;
    let currentTime;
    if (defined(timelineStack.top) && defined(timelineStack.top.dateFormat)) {
      currentTime = dateFormat(
        jsDate,
        this.props.terria.timelineStack.top.dateFormat
      );
    } else {
      currentTime = formatDateTime(jsDate, this.props.locale);
    }

    const discreteTimes = catalogItem.discreteTimesAsSortedJulianDates;
    const objectifiedDates = catalogItem.objectifiedDates;
    const currentDiscreteJulianDate = catalogItem.currentDiscreteJulianDate;

    return (
      <div className={Styles.timeline}>
        <div
          className={Styles.textRow}
          css={`
            background: ${(p) => p.theme.dark};
          `}
        >
          <div
            className={Styles.textCell}
            title={t("dateTime.timeline.textCell")}
          >
            <div className={Styles.layerNameTruncated}>{catalogItem.name}</div>
            {currentTime}
          </div>
        </div>
        <div className={Styles.controlsRow}>
          <TimelineControls
            clock={terria.timelineClock}
            analytics={terria.analytics}
            currentViewer={terria.currentViewer}
          />
          {defined(discreteTimes) &&
            discreteTimes.length !== 0 &&
            defined(currentDiscreteJulianDate) && (
              <DateTimePicker
                currentDate={JulianDate.toDate(currentDiscreteJulianDate)}
                dates={objectifiedDates}
                onChange={() => this.changeDateTime()}
                openDirection="up"
                isOpen={this.state.isPickerOpen}
                onOpen={() => this.onOpenPicker()}
                onClose={() => this.onClosePicker()}
                dateFormat={catalogItem.dateFormat}
              />
            )}
          <CesiumTimeline terria={terria} />
        </div>
      </div>
    );
  }
}

export default withControlledVisibility(withTranslation()(Timeline));
