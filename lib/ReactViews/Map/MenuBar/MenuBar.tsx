import classNames from "classnames";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import styled, { useTheme } from "styled-components";
import { useViewState } from "../../Context";
import withControlledVisibility from "../../HOCs/withControlledVisibility";
import LangPanel from "../Panels/LangPanel/LangPanel";
import SettingPanel from "../Panels/SettingPanel";
import SharePanel from "../Panels/SharePanel/SharePanel";
import ToolsPanel from "../Panels/ToolsPanel/ToolsPanel";
import HelpButton from "./HelpButton/HelpButton";
import StoryButton from "./StoryButton/StoryButton";

import IElementConfig from "../../../Models/IElementConfig";
import Styles from "./menu-bar.scss";

const StyledMenuBar = styled.div<{ trainerBarVisible: boolean }>`
  pointer-events: none;
  ${(p) =>
    p.trainerBarVisible &&
    `
    top: ${Number(p.theme.trainerHeight) + Number(p.theme.mapButtonTop)}px;
  `}
`;

interface PropsType {
  animationDuration?: number;
  menuItems: React.ReactElement[];
  menuLeftItems: React.ReactElement[];
  elementConfig?: IElementConfig;
}

// The map navigation region
const MenuBar = observer((props: PropsType) => {
  const theme = useTheme();
  const viewState = useViewState();
  const terria = viewState.terria;
  const menuItems = props.menuItems || [];
  const handleClick = () => {
    runInAction(() => {
      viewState.topElement = "MenuBar";
    });
  };

  const storyEnabled = terria.configParameters.storyEnabled;
  const enableTools = terria.userProperties.get("tools") === "1";

  return (
    <StyledMenuBar
      className={classNames(
        viewState.topElement === "MenuBar" ? "top-element" : "",
        Styles.menuBar,
        {
          [Styles.menuBarWorkbenchClosed]: viewState.isMapFullScreen
        }
      )}
      onClick={handleClick}
      trainerBarVisible={viewState.trainerBarVisible}
    >
      <section>
        <ul className={classNames(Styles.menu)}>
          {enableTools && (
            <li className={Styles.menuItem}>
              <ToolsPanel />
            </li>
          )}
          {!viewState.useSmallScreenInterface &&
            props.menuLeftItems.map((element, i) => (
              <li className={Styles.menuItem} key={i}>
                {element}
              </li>
            ))}
        </ul>
      </section>
      <section className={classNames(Styles.flex)}>
        <ul className={classNames(Styles.menu)}>
          <li className={Styles.menuItem}>
            <SettingPanel terria={terria} viewState={viewState} />
          </li>
          <li className={Styles.menuItem}>
            <HelpButton />
          </li>

          {terria.configParameters?.languageConfiguration?.enabled ? (
            <li className={Styles.menuItem}>
              <LangPanel
                terria={terria}
                smallScreen={viewState.useSmallScreenInterface}
              />
            </li>
          ) : null}
        </ul>
        {storyEnabled && (
          <ul className={classNames(Styles.menu)}>
            <li className={Styles.menuItem}>
              <StoryButton
                terria={terria}
                viewState={viewState}
                theme={theme}
              />
            </li>
          </ul>
        )}
        <ul className={classNames(Styles.menu)}>
          <li className={Styles.menuItem}>
            <SharePanel terria={terria} viewState={viewState} />
          </li>
        </ul>
        {!viewState.useSmallScreenInterface &&
          menuItems.map((element, i) => (
            <li className={Styles.menuItem} key={i}>
              {element}
            </li>
          ))}
      </section>
    </StyledMenuBar>
  );
});

export default withControlledVisibility(MenuBar);
