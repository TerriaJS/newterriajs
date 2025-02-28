import { Component } from "react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import Guide from "./Guide.jsx";
import satelliteGuideData from "./satelliteGuideData.js";
import { action, makeObservable } from "mobx";
import { observer } from "mobx-react";

export const SATELLITE_GUIDE_KEY = "satelliteGuidance";

@observer
class SatelliteGuide extends Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor() {
    super();
    makeObservable(this);
  }

  @action.bound
  handleMakeTopElement() {
    this.props.viewState.topElement = "Guide";
  }

  @action.bound
  setShowSatelliteGuidance(bool) {
    this.props.viewState.showSatelliteGuidance = bool;
  }

  render() {
    const { terria, viewState, t } = this.props;
    const guideData = satelliteGuideData(t);
    return (
      <Guide
        terria={terria}
        guideKey={SATELLITE_GUIDE_KEY}
        guideData={guideData}
        setShowGuide={(bool) => {
          this.setShowSatelliteGuidance(bool);
          // If we're closing for any reason, set prompted to true
          if (!bool) {
            viewState.toggleFeaturePrompt("satelliteGuidance", true, true);
          }
        }}
      />
    );
  }
}

export default withTranslation()(SatelliteGuide);
