import Amplify, { Auth } from "aws-amplify";
import classNames from "classnames";
import createReactClass from "create-react-class";
import "inobounce";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { Link, Route, Switch } from "react-router-dom";
import awsconfig from "../../aws-exports";
import arrayContains from "../../Core/arrayContains";
import { RCChangeUrlParams } from "../../Models/Receipt";
import { Medium, Small } from "../Generic/Responsive";
import SatelliteGuide from "../Guide/SatelliteGuide.jsx";
import ProgressBar from "../Map/ProgressBar.jsx";
import RCBuilder from "../RCBuilder/RCBuilder";
import RCLogin from "../RCLogin/RCLogin";
import SidePanelSectorTabs from "../RCSectorPanel/SidePanelSectorTabs";
import WelcomeMessage from "../WelcomeMessage/WelcomeMessage.jsx";
import MapNavigation from "./../Map/MapNavigation.jsx";
import RCMenuBar from "./../Map/RCMenuBar.jsx";
import MobileHeader from "./../Mobile/MobileHeader.jsx";
import MapInteractionWindow from "./../Notification/MapInteractionWindow.jsx";
import Notification from "./../Notification/Notification.jsx";
import ObserveModelMixin from "./../ObserveModelMixin";
import RCHotspotSummary from "./../RCHotspotSummary/RCHotspotSummary.jsx";
import FullScreenButton from "./../SidePanel/FullScreenButton.jsx";
import SidePanel from "./../SidePanel/SidePanel.jsx";
import RCStoryPanel from "./../Story/RCStoryPanel.jsx";
import StoryBuilder from "./../Story/StoryBuilder.jsx";
import ToolPanel from "./../ToolPanel.jsx";
// import FeatureInfoPanel from "../FeatureInfo/FeatureInfoPanel.jsx";
import MapColumn from "./MapColumn.jsx";
import processCustomElements from "./processCustomElements";
import Styles from "./StandardUserInterface.scss";

Amplify.configure(awsconfig);
Auth.configure(awsconfig);

export const showStoryPrompt = (viewState, terria) => {
  terria.configParameters.showFeaturePrompts &&
    terria.configParameters.storyEnabled &&
    terria.stories.length === 0 &&
    viewState.toggleFeaturePrompt("story", true);
};
const animationDuration = 250;
const StandardUserInterface = createReactClass({
  displayName: "StandardUserInterface",
  mixins: [ObserveModelMixin],

  propTypes: {
    /**
     * Terria instance
     */
    terria: PropTypes.object.isRequired,
    /**
     * All the base maps.
     */
    allBaseMaps: PropTypes.array,
    viewState: PropTypes.object.isRequired,
    minimumLargeScreenWidth: PropTypes.number,
    version: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.element
    ]),
    t: PropTypes.func.isRequired
  },

  getDefaultProps() {
    return { minimumLargeScreenWidth: 768 };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    const { t } = this.props;
    const that = this;
    // only need to know on initial load
    this.dragOverListener = e => {
      if (
        !e.dataTransfer.types ||
        !arrayContains(e.dataTransfer.types, "Files")
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      that.acceptDragDropFile();
    };

    this.resizeListener = () => {
      this.props.viewState.useSmallScreenInterface = this.shouldUseMobileInterface();
    };

    window.addEventListener("resize", this.resizeListener, false);

    this.resizeListener();

    if (
      this.props.terria.configParameters.storyEnabled &&
      this.props.terria.stories &&
      this.props.terria.stories.length &&
      !this.props.viewState.storyShown
    ) {
      this.props.viewState.notifications.push({
        title: t("sui.notifications.title"),
        message: t("sui.notifications.message"),
        confirmText: t("sui.notifications.confirmText"),
        denyText: t("sui.notifications.denyText"),
        confirmAction: () => {
          this.props.viewState.storyShown = true;
        },
        denyAction: () => {
          this.props.viewState.storyShown = false;
        },
        type: "story",
        width: 300
      });
    }
  },

  async componentDidMount() {
    // this.props.viewState.isHotspotsFiltered = false;
    this._wrapper.addEventListener("dragover", this.dragOverListener, false);
    showStoryPrompt(this.props.viewState, this.props.terria);
    //
    // First web enters, read the params
    // Wait for router-dom to set before loading the init params: async
    //
    await new Promise(resolve => setTimeout(resolve, 500));
    RCChangeUrlParams(undefined, this.props.viewState);
  },

  componentWillUnmount() {
    window.removeEventListener("resize", this.resizeListener, false);
    document.removeEventListener("dragover", this.dragOverListener, false);
  },

  acceptDragDropFile() {
    this.props.viewState.isDraggingDroppingFile = true;
    // if explorer window is already open, we open my data tab
    if (this.props.viewState.explorerPanelIsVisible) {
      this.props.viewState.openUserData();
    }
  },

  shouldUseMobileInterface() {
    return document.body.clientWidth < this.props.minimumLargeScreenWidth;
  },

  render() {
    const { t, viewState, terria } = this.props;
    const customElements = processCustomElements(
      viewState.useSmallScreenInterface,
      this.props.children
    );

    const allBaseMaps = this.props.allBaseMaps;

    const showStoryBuilder =
      viewState.storyBuilderShown && !this.shouldUseMobileInterface();
    const showStoryPanel =
      terria.configParameters.storyEnabled &&
      terria.stories.length &&
      viewState.storyShown &&
      !viewState.explorerPanelIsVisible &&
      !viewState.storyBuilderShown;

    const showHotspotSummary = viewState.hotspotSummaryEnabled;

    return (
      <div className={Styles.storyWrapper}>
        <WelcomeMessage viewState={viewState} />
        <div
          className={classNames(Styles.uiRoot, {
            [Styles.withStoryBuilder]: showStoryBuilder
          })}
          ref={w => (this._wrapper = w)}
        >
          <div className={Styles.ui}>
            <div className={Styles.uiInner}>
              {/* Moved side panel to left */}
              <If
                condition={!viewState.hideMapUi() && !viewState.showToolPanel()}
              >
                <Small>
                  <MobileHeader
                    terria={terria}
                    menuItems={customElements.menu}
                    viewState={viewState}
                    version={this.props.version}
                    allBaseMaps={allBaseMaps}
                  />
                </Small>
                <Small>
                  <div className={Styles.middleContainer}>
                    <section
                      className={classNames(
                        Styles.map,
                        showStoryPanel && Styles.smallMap
                      )}
                    >
                      <ProgressBar terria={terria} />
                      <MapColumn
                        terria={terria}
                        viewState={viewState}
                        customFeedbacks={customElements.feedback}
                      />
                    </section>

                    {showStoryPanel ? (
                      <div className={Styles.storyPanelWrapper}>
                        <RCStoryPanel terria={terria} viewState={viewState} />
                      </div>
                    ) : null}

                    {!(showStoryPanel || showHotspotSummary) && (
                      <div className={Styles.tabsContainer}>
                        <SidePanelSectorTabs
                          terria={terria}
                          viewState={viewState}
                        />
                      </div>
                    )}

                    {showHotspotSummary && (
                      <RCHotspotSummary viewState={viewState} />
                    )}
                  </div>
                </Small>
                <Medium>
                  <section className={Styles.map}>
                    <ProgressBar terria={terria} />
                    <MapColumn
                      terria={terria}
                      viewState={viewState}
                      customFeedbacks={customElements.feedback}
                    />
                  </section>
                </Medium>
                <Medium>
                  <div
                    className={classNames(
                      Styles.sidePanel,
                      viewState.topElement === "SidePanel" ? "top-element" : "",
                      {
                        [Styles.sidePanelHide]: viewState.isMapFullScreen
                      }
                    )}
                    tabIndex={0}
                    onClick={() => {
                      viewState.topElement = "SidePanel";
                    }}
                  >
                    <div style={{ textAlign: "end" }}>
                      <Link to="/">Home</Link> |
                      <Link to="/builder">Builder</Link> |
                      <Link to="/users">Users</Link>
                    </div>
                    <hr />

                    <Switch>
                      <Route exact path="/">
                        {showHotspotSummary && (
                          <RCHotspotSummary viewState={viewState} />
                        )}

                        {!(showStoryPanel || showHotspotSummary) && (
                          <SidePanelSectorTabs
                            terria={terria}
                            viewState={viewState}
                          />
                        )}
                        {showStoryPanel ? (
                          <RCStoryPanel terria={terria} viewState={viewState} />
                        ) : null}
                      </Route>

                      <Route path="/builder">
                        <RCBuilder viewState={viewState} />
                      </Route>

                      <Route path="/users">
                        <RCLogin viewState={viewState} />
                      </Route>
                    </Switch>

                    {/*{showHotspotSummary && (*/}
                    {/*  <RCHotspotSummary viewState={viewState} />*/}
                    {/*)}*/}

                    {/*{!(showStoryPanel || showHotspotSummary) && (*/}
                    {/*  <SidePanelSectorTabs*/}
                    {/*    terria={terria}*/}
                    {/*    viewState={viewState}*/}
                    {/*  />*/}
                    {/*)}*/}
                    {/*{showStoryPanel ? (*/}
                    {/*  <RCStoryPanel terria={terria} viewState={viewState} />*/}
                    {/*) : null}*/}
                    <SidePanel terria={terria} viewState={viewState} />
                  </div>
                </Medium>
              </If>

              <If condition={viewState.showToolPanel()}>
                <ToolPanel viewState={viewState} />
              </If>

              <Medium>
                <div
                  className={classNames(Styles.showWorkbenchButton, {
                    [Styles.showWorkbenchButtonisVisible]:
                      viewState.isMapFullScreen,
                    [Styles.showWorkbenchButtonisNotVisible]: !this.props
                      .viewState.isMapFullScreen
                  })}
                >
                  <FullScreenButton
                    terria={terria}
                    viewState={viewState}
                    minified={false}
                    btnText={t("sui.showWorkbench")}
                    animationDuration={animationDuration}
                  />
                </div>
              </Medium>
            </div>
          </div>

          <If condition={!viewState.hideMapUi()}>
            <Medium>
              <div
                className={classNames({
                  [Styles.explorerPanelIsVisible]:
                    viewState.explorerPanelIsVisible,
                  [Styles.NavigationMap]: true
                })}
              >
                {/* <MenuBar
                    terria={terria}
                    viewState={viewState}
                    allBaseMaps={allBaseMaps}
                    menuItems={customElements.menu}
                    animationDuration={animationDuration}
                  /> */}
                <RCMenuBar terria={terria} viewState={viewState} />
                <MapNavigation
                  terria={terria}
                  viewState={viewState}
                  navItems={customElements.nav}
                />
              </div>
            </Medium>
          </If>

          <Notification viewState={viewState} />
          <SatelliteGuide terria={terria} viewState={viewState} />
          <MapInteractionWindow terria={terria} viewState={viewState} />

          {/* <If
              condition={
                !customElements.feedback.length &&
                terria.configParameters.feedbackUrl &&
                !viewState.hideMapUi()
              }
            >
              <aside className={Styles.feedback}>
                <FeedbackForm viewState={viewState} />
              </aside>
            </If> */}

          <div
            className={classNames(
              Styles.featureInfo,
              viewState.topElement === "FeatureInfo" ? "top-element" : "",
              {
                [Styles.featureInfoFullScreen]: viewState.isMapFullScreen
              }
            )}
            tabIndex={0}
            onClick={() => {
              viewState.topElement = "FeatureInfo";
            }}
          >
            {/*RC TODO: uncomment if there is a need to show the info popup when clicking on map */}
            {/*<FeatureInfoPanel terria={terria} viewState={viewState} />*/}
          </div>
          {/* <DragDropFile terria={terria} viewState={viewState} />
          <DragDropNotification
            lastUploadedFiles={viewState.lastUploadedFiles}
            viewState={viewState}
            t={this.props.t}
          /> */}
        </div>
        {terria.configParameters.storyEnabled && (
          <StoryBuilder
            isVisible={showStoryBuilder}
            terria={terria}
            viewState={viewState}
            animationDuration={animationDuration}
          />
        )}
      </div>
    );
  }
});

export const StandardUserInterfaceWithoutTranslation = StandardUserInterface;

export default withTranslation()(StandardUserInterface);
// export default withTranslation()(StandardUserInterface);
