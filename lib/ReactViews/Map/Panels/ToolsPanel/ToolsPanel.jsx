"use strict";

import { observer } from "mobx-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import MenuPanel from "../../../StandardUserInterface/customizable/MenuPanel";
import { useViewState } from "../../../Context";
import DropdownStyles from "../panel.scss";
import CountDatasets from "./CountDatasets";
import Styles from "./tools-panel.scss";
import withControlledVisibility from "../../../HOCs/withControlledVisibility";

const ToolsPanel = observer(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [resultsMessage, setResultsMessage] = useState("");
  const dropdownTheme = {
    btn: Styles.btnShare,
    outer: Styles.ToolsPanel,
    inner: Styles.dropdownInner,
    icon: "settings"
  };
  const { t } = useTranslation();
  const viewState = useViewState();
  return (
    <MenuPanel
      theme={dropdownTheme}
      btnText={t("toolsPanel.btnText")}
      viewState={viewState}
      btnTitle={t("toolsPanel.btnTitle")}
      onOpenChanged={setIsOpen}
      isOpen={isOpen}
      smallScreen={viewState.useSmallScreenInterface}
    >
      {isOpen && (
        <div className={DropdownStyles.section}>
          <div className={Styles.this}>
            <CountDatasets updateResults={setResultsMessage} />
          </div>
        </div>
      )}
      <div className={Styles.results}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: resultsMessage }} />
      </div>
    </MenuPanel>
  );
});

export default withControlledVisibility(ToolsPanel);
