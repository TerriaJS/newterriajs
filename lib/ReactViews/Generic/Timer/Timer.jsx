import React from "react";
import PropTypes from "prop-types";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import { createTimer, startTimer as startTimerAnimation } from "./drawTimer";
import Styles from "./timer.scss";

// Set the name of the hidden property and the change event for visibility
let hidden;
let visibilityChange;
if (typeof document.hidden !== "undefined") {
  // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

class Timer extends React.PureComponent {
  constructor(props) {
    super(props);

    // We need a unique selector for the timer container. If there are multiple timers, we need to know which one to
    // draw to.
    this.containerId = "timer-container-" + createGuid();
  }

  // Calculates how long the timer should run for (in seconds).
  calculateTimerInterval() {
    if (this.props.stop > this.props.start) {
      return (this.props.stop - this.props.start) / 1000;
    }

    // This is technically an error, but it's not a serious one or one that we should expose to the user, so we
    // ignore it
    return 0;
  }

  calculateElaspedTime() {
    const elapsed = Math.floor(
      new Date().getTime() / 1000 - this.props.start / 1000
    );
    if (elapsed > 0) {
      return elapsed;
    }
    return 0;
  }

  startTimer() {
    // only start the timer if the current time is after the start time passed in through props
    if (new Date().getTime() > this.props.start) {
      startTimerAnimation(
        this.props.radius,
        this.calculateTimerInterval(),
        this.containerId,
        Styles.elapsedTime,
        Styles.backgroundCircle,
        this.calculateElaspedTime()
      );
    }
  }

  componentDidUpdate() {
    this.startTimer();
  }

  componentDidMount() {
    const handleVisibilityChange = () => {
      // If the visibility has changed, and the document isn't hidden, then it has just been shown again after being
      // hidden
      if (!document[hidden]) {
        this.startTimer();
      }
    };

    document.addEventListener(visibilityChange, handleVisibilityChange, false);

    createTimer(
      this.props.radius,
      this.containerId,
      Styles.elapsedTime,
      Styles.backgroundCircle
    );

    this.startTimer();
  }

  componentWillUnmount() {
    document.removeEventListener(visibilityChange, this.handleVisibilityChange);
  }

  render() {
    return (
      <div
        id={this.containerId}
        className={Styles.timer}
        title={this.props.tooltipText}
      />
    );
  }
}

Timer.propTypes = {
  start: PropTypes.number.isRequired, // When the timer should start. Unix timestamp, ms since epoch.
  // Using a value type like number instead of Date, which is a reference type, means that PureCompoment's default
  // shouldComponentUpdate behaves how we want it to. Otherwise, every time the prop is set to a new object, the
  // component will update, rather than only if the value of the object has changed.
  stop: PropTypes.number.isRequired, // When the timer should stop. Unix timestamp, ms since epoch.
  radius: PropTypes.number.isRequired, // the radius of the timer circle
  tooltipText: PropTypes.string
};

export default Timer;
