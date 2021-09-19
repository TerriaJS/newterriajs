"use strict";

import { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import MenuPanel from "../StandardUserInterface/customizable/MenuPanel.jsx";

import Styles from "./help-panel.scss";
import DropdownStyles from "../Map/Panels/panel.scss";
import helpIcon from "../../../wwwroot/images/icons/help.svg";

import { withTranslation } from "react-i18next";
import { action } from "mobx";
import { observer } from "mobx-react";

@observer
class HelpMenuPanelBasic extends Component {
  static propTypes = {
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      isOpen: false
    };
  }

  @action.bound
  setShowHelpMenu(bool) {
    this.props.viewState.showHelpMenu = bool;
  }

  render() {
    const dropdownTheme = {
      btn: Styles.btnShare,
      outer: Styles.sharePanel,
      inner: Styles.dropdownInner,
      icon: helpIcon
    };
    const isOpen = this.props.viewState.showHelpMenu;

    const { t } = this.props;

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText={t("helpMenu.btnText")}
        viewState={this.props.viewState}
        isOpen={isOpen}
        onDismissed={() => {
          this.setShowHelpMenu(false);
        }}
        btnTitle={t("helpMenu.btnTitle")}
        onOpenChanged={this.setShowHelpMenu}
        // forceClosed={this.props.viewState.showSatelliteGuidance}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <If condition={isOpen}>
          <div className={classNames(Styles.viewer, DropdownStyles.section)}>
            <label className={DropdownStyles.heading}>
              {t("helpMenu.helpMenuHeader")}
            </label>
            <ul className={Styles.viewerSelector}>
              <li className={Styles.listItem}>
                <button
                  onClick={action(() => {
                    this.setShowHelpMenu(false);
                    this.props.viewState.showWelcomeMessage = true;
                    this.props.viewState.topElement = "WelcomeMessage";
                  })}
                  className={Styles.btnViewer}
                >
                  {t("helpMenu.helpMenuOpenWelcome")}
                </button>
              </li>
              <li className={Styles.listItem}>
                <button
                  onClick={action(() => {
                    this.setShowHelpMenu(false);
                    this.props.viewState.showSatelliteGuidance = true;
                    this.props.viewState.topElement = "Guide";
                  })}
                  className={Styles.btnViewer}
                >
                  {t("helpMenu.helpMenuSatelliteGuideTitle")}
                </button>
              </li>
              <li className={Styles.listItem}>
                <a
                  target="_blank"
                  href="./help/help.html"
                  className={Styles.btnViewer}
                >
                  {t("helpMenu.helpMenuMoreHelpTitle")}
                </a>
              </li>
            </ul>
          </div>
        </If>
      </MenuPanel>
    );
  }
}

export default withTranslation()(HelpMenuPanelBasic);
