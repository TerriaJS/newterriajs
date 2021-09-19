"use strict";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import HelpScreenWindow from "./HelpScreenWindow";
import ObscureOverlay from "./ObscureOverlay";

const HelpOverlay = createReactClass({
  displayName: "HelpOverlay",

  propTypes: {
    helpViewState: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      screens: undefined,
      index: undefined,
      currentRectangle: undefined,
      previousRectangle: undefined
    };
  },

  cancel() {
    if (defined(this.setIntervalId)) {
      clearInterval(this.setIntervalId);
    }
    this.setState({
      screens: undefined,
      index: undefined,
      currentRectangle: undefined,
      previousRectangle: undefined
    });
    this.props.helpViewState.currentScreen = undefined;
  },

  help(screens, i) {
    if (i === 0) {
      // If this is the first help screen in a sequence, locate the highlighted element and track the rectangle
      // to make sure the overlay and help screen move with the element.
      const that = this;
      this.setIntervalId = setInterval(function() {
        if (!defined(that.state.screens)) {
          return;
        }
        if (that.props.helpViewState.cancel) {
          // Has been cancelled from somewhere else. Abort!
          that.cancel();
        }
        const i = that.state.index;
        const currentScreen =
          that.state && that.state.screens && that.state.screens[i];
        if (
          currentScreen &&
          typeof currentScreen.preDisplayHook === "function"
        ) {
          currentScreen.preDisplayHook(that.props.viewState);
        }
        updateCurrentRectangle(that, currentScreen);

        if (
          !that.props.helpViewState.advance &&
          defined(that.state) &&
          defined(that.state.previousRectangle) &&
          that.state.previousRectangle === that.state.currentRectangle
        ) {
          return;
        }

        if (defined(that.state) && defined(that.state.currentRectangle)) {
          currentScreen.rectangle = that.state.currentRectangle;
          currentScreen.currentScreenNumber = i + 1;
          currentScreen.totalNumberOfScreens = that.state.screens.length;
          currentScreen.onNext = function() {
            if (typeof currentScreen.postDisplayHook === "function") {
              currentScreen.postDisplayHook(that.props.viewState);
            }
            if (i + 1 >= that.state.screens.length) {
              that.cancel();
            } else {
              that.help(that.state.screens, i + 1);
            }
          };
          that.props.helpViewState.currentScreen = currentScreen;
          // Processed current rectangle, set as previous.
          that.setState({ previousRectangle: that.state.currentRectangle });
        }

        if (that.props.helpViewState.advance) {
          // Has been manually advanced from somewhere else. Next screen!
          that.props.helpViewState.advance = false;
          currentScreen.onNext();
        }
      }, 10);
    }
    this.props.helpViewState.cancel = false;
    this.setState({
      screens: screens,
      index: i,
      currentRectangle: undefined,
      previousRectangle: undefined
    });
  },

  executeSequence() {
    if (defined(this.props.helpViewState.currentSequence)) {
      if (defined(this.setIntervalId)) {
        clearInterval(this.setIntervalId);
      }
      this.help(this.props.helpViewState.currentSequence.screens, 0);
      // To prevent executeSequence from triggering again before we start a new sequence.
      this.props.helpViewState.currentSequence = undefined;
    }
  },

  componentDidMount() {
    this.executeSequence();
  },

  componentDidUpdate() {
    this.executeSequence();
  },

  render() {
    return (
      <div aria-hidden={!this.props.helpViewState.currentSequence}>
        <ObscureOverlay helpViewState={this.props.helpViewState} />
        <HelpScreenWindow helpViewState={this.props.helpViewState} />
      </div>
    );
  }
});

/**
 * Reset currentRectangle to the bounding rectangle of the highlighted element.
 * @private
 */
function updateCurrentRectangle(component, currentScreen) {
  if (!defined(currentScreen)) {
    return;
  }
  const highlightedElement = document.getElementsByClassName(
    currentScreen.highlightedComponentId
  );
  if (defined(highlightedElement[0])) {
    const screenRect = highlightedElement[0].getBoundingClientRect();
    component.setState({ currentRectangle: screenRect });
  }
}

export default HelpOverlay;
