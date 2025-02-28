import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import Box from "../../Styled/Box";
import ActionBarPortal from "../ActionBar/ActionBarPortal";
import BottomDock from "../BottomDock/BottomDock";
import { useViewState } from "../Context";
import Loader from "../Loader";
import SlideUpFadeIn from "../Transitions/SlideUpFadeIn/SlideUpFadeIn";
import { BottomBar } from "./BottomBar";
import BottomLeftBar from "./BottomLeftBar/BottomLeftBar";
import { MapNavigation } from "./MapNavigation";
import MenuBar from "./MenuBar/MenuBar";
import { ProgressBar } from "./ProgressBar";
import { TerriaViewerWrapper } from "./TerriaViewerWrapper";
import Toast from "./Toast";

interface IMapColumnProps {
  animationDuration: number;
  customElements: any;
}

/**
 * Right-hand column that contains the map, controls that sit over the map and sometimes the bottom dock containing
 * the timeline and charts.
 */
export const MapColumn: FC<IMapColumnProps> = observer(
  ({ customElements, animationDuration }) => {
    const viewState = useViewState();
    const { t } = useTranslation();

    return (
      <Box
        column
        fullWidth
        fullHeight
        css={`
          * {
            box-sizing: border-box;
          }
        `}
      >
        <Box column fullWidth fullHeight>
          <div
            css={{
              position: "absolute",
              top: "0",
              left: "0",
              zIndex: 1,
              width: "100%"
            }}
          >
            <ProgressBar />
          </div>
          {!viewState.hideMapUi && (
            <div
              css={`
                ${viewState.explorerPanelIsVisible && "opacity: 0.3;"}
              `}
            >
              <MenuBar
                menuItems={customElements.menu}
                menuLeftItems={customElements.menuLeft}
                animationDuration={animationDuration}
                elementConfig={viewState.terria.elements.get("menu-bar")}
              />
              <MapNavigation
                viewState={viewState}
                navItems={customElements.nav}
                elementConfig={viewState.terria.elements.get("map-navigation")}
              />
            </div>
          )}
          <Box
            position="absolute"
            css={{ top: "0", zIndex: 0 }}
            fullWidth
            fullHeight
          >
            <TerriaViewerWrapper />
          </Box>
          {!viewState.hideMapUi && (
            <>
              <BottomLeftBar />
              <ActionBarPortal show={viewState.isActionBarVisible} />
              <SlideUpFadeIn isVisible={viewState.isMapZooming}>
                <Toast>
                  <Loader
                    message={t("toast.mapIsZooming")}
                    textProps={{
                      style: {
                        padding: "0 5px"
                      }
                    }}
                  />
                </Toast>
              </SlideUpFadeIn>
              <Box
                position="absolute"
                fullWidth
                css={{ bottom: "0", left: "0" }}
              >
                <BottomBar />
              </Box>

              {viewState.terria.configParameters.printDisclaimer && (
                <a
                  css={`
                    display: none;
                    @media print {
                      display: block;
                      width: 100%;
                      clear: both;
                    }
                  `}
                  href={viewState.terria.configParameters.printDisclaimer.url}
                >
                  {viewState.terria.configParameters.printDisclaimer.text}
                </a>
              )}
            </>
          )}
        </Box>
        <div>
          {!viewState.hideMapUi && (
            <BottomDock
              terria={viewState.terria}
              viewState={viewState}
              elementConfig={viewState.terria.elements.get("bottom-dock")}
            />
          )}
        </div>
      </Box>
    );
  }
);

export default MapColumn;
