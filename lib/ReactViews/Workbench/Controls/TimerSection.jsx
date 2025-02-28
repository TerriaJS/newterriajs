import { Component } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import defined from "terriajs-cesium/Source/Core/defined";
import Timer from "../../Generic/Timer/Timer";
import { withTranslation } from "react-i18next";
import Styles from "./timer-section.scss";

@observer
class TimerSection extends Component {
  static propTypes = {
    item: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      secondsLeft: 0
    };
  }

  isEnabled() {
    return (
      // only show refresh timer for refresh intervals less than 30 minutes
      defined(this.props.item) &&
      this.props.item.isPolling &&
      defined(this.props.item.nextScheduledUpdateTime) &&
      this.props.item.refreshInterval < 30 * 60 * 1000
    );
  }

  getCountdownDuration() {
    // How many seconds until our next update?
    return Math.round(
      (this.props.item.nextScheduledUpdateTime.getTime() -
        new Date().getTime()) /
        1000
    );
  }

  getTimerStartTime() {
    return new Date(
      this.props.item.nextScheduledUpdateTime -
        this.props.item.refreshInterval * 1000
    );
  }

  // Ticks down the countdown clock
  countdown() {
    if (this.state.secondsLeft > 0) {
      this.setState((state) => {
        return {
          secondsLeft: state.secondsLeft - 1
        };
      });
    } else {
      // Stop.
      clearInterval(this.interval);
    }
  }

  startCountdown() {
    this.setState({
      secondsLeft: this.getCountdownDuration()
    });
    this.interval = setInterval(() => this.countdown(), 1000);
  }

  getCountdownString() {
    const date = new Date(null);
    date.setSeconds(this.state.secondsLeft);

    const addLeadingZeroIfRequired = (numString) =>
      numString.length < 2 ? "0" + numString : numString;

    const minutes = addLeadingZeroIfRequired(date.getMinutes().toString());
    const seconds = addLeadingZeroIfRequired(date.getSeconds().toString());

    return `00:${minutes}:${seconds}`;
  }

  componentDidUpdate() {
    if (!this.isEnabled()) {
      return;
    }

    if (this.nextUpdate !== this.props.item.nextScheduledUpdateTime) {
      if (defined(this.interval)) {
        clearInterval(this.interval);
      }
      this.startCountdown();
      this.nextUpdate = this.props.item.nextScheduledUpdateTime;
    }
  }

  componentDidMount() {
    if (!this.isEnabled()) {
      return;
    }

    this.startCountdown();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const { t } = this.props;
    return this.isEnabled() ? (
      <div className={Styles.section}>
        <div className={Styles.timerContainer}>
          <Timer
            tooltipText={t("timer.nextScheduledUpdateTime", {
              scheduledUpdateTime: this.props.item.nextScheduledUpdateTime
            })}
            radius={10}
            start={this.getTimerStartTime().getTime()}
            stop={this.props.item.nextScheduledUpdateTime.getTime()}
          />
        </div>
        <span>
          {t("timer.nextScheduledUpdateCountdown", {
            timeCountdown: this.getCountdownString()
          })}
        </span>
      </div>
    ) : null;
  }
}

export default withTranslation()(TimerSection);
