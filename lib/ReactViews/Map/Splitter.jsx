import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Styles from "./splitter.scss";
import { observer } from "mobx-react";
import { runInAction } from "mobx";

// Feature detect support for passive: true in event subscriptions.
// See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
let passiveSupported = false;
try {
  const options = Object.defineProperty({}, "passive", {
    get: function() {
      passiveSupported = true;
      return true;
    }
  });

  window.addEventListener("test", null, options);
  window.removeEventListener("test", null, options);
} catch (err) {}

const notPassive = passiveSupported ? { passive: false } : false;

const Splitter = observer(
  createReactClass({
    displayName: "Splitter",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      thumbSize: PropTypes.number,
      padding: PropTypes.number,
      t: PropTypes.func.isRequired
    },

    getDefaultProps() {
      return {
        thumbSize: 42,
        padding: 0
      };
    },

    componentDidMount() {
      const that = this;
      window.addEventListener("resize", function() {
        that.forceRefresh();
      });
    },

    componentWillUnmount() {
      this.unsubscribe();
    },

    forceRefresh() {
      const smallChange =
        this.props.terria.splitPosition < 0.5 ? 0.0001 : -0.0001; // Make sure never <0 or >1.
      runInAction(() => {
        this.props.terria.splitPosition += smallChange;
      });
    },

    startDrag(event) {
      const viewer = this.props.terria.currentViewer;
      viewer.pauseMapInteraction();

      // While dragging is in progress, subscribe to document-level movement and up events.
      document.addEventListener("mousemove", this.drag, notPassive);
      document.addEventListener("touchmove", this.drag, notPassive);
      document.addEventListener("mouseup", this.stopDrag, notPassive);
      document.addEventListener("touchend", this.stopDrag, notPassive);

      event.preventDefault();
      event.stopPropagation();
    },

    drag(event) {
      let clientX = event.clientX;
      let clientY = event.clientY;
      if (event.targetTouches && event.targetTouches.length > 0) {
        clientX = event.targetTouches.item(0).clientX;
        clientY = event.targetTouches.item(0).clientY;
      }

      const viewer = this.props.terria.mainViewer.currentViewer;
      const container = viewer.getContainer();
      const mapRect = container.getBoundingClientRect();

      const that = this;
      function computeSplitFraction(startBound, endBound, position) {
        const difference = endBound - startBound;
        const fraction = (position - startBound) / difference;

        const min =
          startBound + that.props.padding + that.props.thumbSize * 0.5;
        const max = endBound - that.props.padding - that.props.thumbSize * 0.5;
        const minFraction = (min - startBound) / difference;
        const maxFraction = (max - startBound) / difference;

        return Math.min(maxFraction, Math.max(minFraction, fraction));
      }
      let splitFractionX = computeSplitFraction(
        mapRect.left,
        mapRect.right,
        clientX
      );
      let splitFractionY = computeSplitFraction(
        mapRect.top,
        mapRect.bottom,
        clientY
      );

      // We compute the maximum and minium windows bounds as a percentage so that we can always apply the bounds
      // restriction as a percentage for consistency (we currently use absolute values for X and percentage values for
      // Y, but always apply the constraint as a percentage).
      // We use absolute pixel values for horizontal restriction because of the fixed UI elements which occupy an
      // absolute amount of screen relestate and 100 px seems like a fine amount for the current UI.
      const minX = computeSplitFraction(
        mapRect.left,
        mapRect.right,
        mapRect.left + 100
      );
      const maxX = computeSplitFraction(
        mapRect.left,
        mapRect.right,
        mapRect.right - 100
      );
      // Resctrict to within +/-30% of the center vertically (so we don't run into the top and bottom UI elements).
      const minY = 0.2;
      const maxY = 0.8;

      splitFractionX = Math.min(maxX, Math.max(minX, splitFractionX));
      splitFractionY = Math.min(maxY, Math.max(minY, splitFractionY));

      runInAction(() => {
        this.props.terria.splitPosition = splitFractionX;
        this.props.terria.splitPositionVertical = splitFractionY;
      });

      event.preventDefault();
      event.stopPropagation();
    },

    stopDrag(event) {
      this.unsubscribe();

      const viewer = this.props.terria.currentViewer;
      // Ensure splitter stays in sync with map
      this.props.viewState.triggerResizeEvent();

      viewer.resumeMapInteraction();

      event.preventDefault();
      event.stopPropagation();
    },

    unsubscribe() {
      document.removeEventListener("mousemove", this.drag, notPassive);
      document.removeEventListener("touchmove", this.drag, notPassive);
      document.removeEventListener("mouseup", this.stopDrag, notPassive);
      document.removeEventListener("touchend", this.stopDrag, notPassive);
      window.removeEventListener("resize", this.forceRefresh);
    },

    getPosition() {
      const canvasWidth = this.props.terria.currentViewer.getContainer()
        .clientWidth;
      const canvasHeight = this.props.terria.currentViewer.getContainer()
        .clientHeight;
      return {
        x: this.props.terria.splitPosition * canvasWidth,
        y: this.props.terria.splitPositionVertical * canvasHeight
      };
    },

    render() {
      if (
        !this.props.terria.showSplitter ||
        !this.props.terria.currentViewer.canShowSplitter ||
        !this.props.terria.currentViewer.getContainer()
      ) {
        return null;
      }

      const thumbWidth = this.props.thumbSize;
      const position = this.getPosition();

      const dividerStyle = {
        left: position.x + "px",
        backgroundColor: this.props.terria.baseMapContrastColor
      };

      const thumbStyle = {
        left: position.x + "px",
        top: position.y + "px",
        width: thumbWidth + "px",
        height: thumbWidth + "px",
        marginLeft: "-" + thumbWidth * 0.5 + "px",
        marginTop: "-" + thumbWidth * 0.5 + "px",
        lineHeight: thumbWidth - 2 + "px",
        borderRadius: thumbWidth * 0.5 + "px",
        fontSize: thumbWidth - 12 + "px"
      };

      const { t } = this.props;

      return (
        <div>
          <div className={Styles.dividerWrapper}>
            <div className={Styles.divider} style={dividerStyle} />
          </div>
          <button
            className={Styles.thumb}
            style={thumbStyle}
            onClick={e => e.preventDefault()}
            onMouseDown={this.startDrag}
            onTouchStart={this.startDrag}
            title={t("splitterTool.title")}
          >
            <StyledIcon glyph={GLYPHS.splitter} />
          </button>
        </div>
      );
    }
  })
);

module.exports = withTranslation()(Splitter);
