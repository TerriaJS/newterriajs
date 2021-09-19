import { observer } from "mobx-react";

import classNames from "classnames";
import createReactClass from "create-react-class";
import Icon from "../../../../Styled/Icon";
import Box from "../../../../Styled/Box";
import PropTypes from "prop-types";

import DataCatalog from "../../../DataCatalog/DataCatalog.jsx";
import DataPreview from "../../../Preview/DataPreview.jsx";
import AddData from "./AddData.jsx";
import { withTranslation, Trans } from "react-i18next";

import Styles from "./my-data-tab.scss";

// My data tab include Add data section and preview section
const MyDataTab = observer(
  createReactClass({
    displayName: "MyDataTab",

    propTypes: {
      terria: PropTypes.object,
      viewState: PropTypes.object,
      localDataTypes: PropTypes.arrayOf(PropTypes.object),
      remoteDataTypes: PropTypes.arrayOf(PropTypes.object),
      onFileAddFinished: PropTypes.func.isRequired,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {
        activeTab: null
      };
    },

    hasUserAddedData() {
      return this.props.terria.catalog.userAddedDataGroup.members.length > 0;
    },

    changeTab(active) {
      this.setState({
        activeTab: active
      });
    },

    resetTab() {
      this.setState({
        activeTab: null
      });
    },

    renderTabs() {
      const { t } = this.props;
      const tabs = [
        {
          id: "local",
          caption: t("addData.localTitle")
        },
        {
          id: "web",
          caption: t("addData.webTitle")
        }
      ];
      return (
        <ul className={Styles.tabList}>
          <For each="tab" of={tabs}>
            <li className={Styles.tabListItem} key={tab.id}>
              <button
                type="button"
                onClick={this.changeTab.bind(null, tab.id)}
                title={tab.caption}
                className={classNames(Styles.tabListBtn, {
                  [Styles.isActive]: this.state.activeTab === tab.id
                })}
                css={`
                  color: ${p => p.theme.colorPrimary};
                  &:hover,
                  &:focus {
                    color: ${p => p.theme.grey};
                  }
                  svg {
                    fill: ${p => p.theme.colorPrimary};
                  }
                `}
              >
                <Icon glyph={Icon.GLYPHS[tab.id]} />
                {tab.caption}
              </button>
            </li>
          </For>
        </ul>
      );
    },

    renderPromptBox() {
      if (this.hasUserAddedData()) {
        const { t } = this.props;
        return (
          <div className={Styles.dataTypeTab}>
            <div className={Styles.dndBox}>
              <Icon glyph={Icon.GLYPHS.upload} />
              {t("addData.dragDrop")}
            </div>
          </div>
        );
      }

      return (
        <div className={Styles.dataTypeTab}>
          <div className={Styles.dndBoxInfo}>
            <Trans i18nKey="addData.infoText">
              <div>Drag and drop a file here to view it locally on the map</div>
              <div>(it won’t be saved or uploaded to the internet)</div>
            </Trans>
            <div className={Styles.tabCenter}>{this.renderTabs()}</div>
          </div>
          <div className={Styles.dndBox}>
            <Icon glyph={Icon.GLYPHS.upload} />
          </div>
        </div>
      );
    },

    render() {
      const showTwoColumn = this.hasUserAddedData() & !this.state.activeTab;
      const { t } = this.props;
      return (
        <Box className={Styles.root}>
          <div
            className={classNames({
              [Styles.leftCol]: showTwoColumn,
              [Styles.oneCol]: !showTwoColumn
            })}
          >
            <If condition={this.state.activeTab}>
              <button
                type="button"
                onClick={this.resetTab}
                className={Styles.btnBackToMyData}
                css={`
                  color: ${p => p.theme.colorPrimary};
                  &:hover,
                  &:focus {
                    border: 1px solid ${p => p.theme.colorPrimary};
                  }
                  svg {
                    fill: ${p => p.theme.colorPrimary};
                  }
                `}
              >
                <Icon glyph={Icon.GLYPHS.left} />
                {t("addData.back")}
              </button>
              <AddData
                terria={this.props.terria}
                viewState={this.props.viewState}
                activeTab={this.state.activeTab}
                resetTab={this.resetTab}
                localDataTypes={this.props.localDataTypes}
                remoteDataTypes={this.props.remoteDataTypes}
                onFileAddFinished={this.props.onFileAddFinished}
              />
            </If>
            <If condition={showTwoColumn}>
              <Box flexShrinkZero column>
                <p className={Styles.explanation}>
                  <Trans i18nKey="addData.note">
                    <strong>Note: </strong>Data added in this way is not saved
                    or made visible to others.
                  </Trans>
                </p>
                <div className={Styles.tabLeft}>{this.renderTabs()}</div>

                <ul className={Styles.dataCatalog}>
                  <DataCatalog
                    items={
                      this.props.terria.catalog.userAddedDataGroup.memberModels
                    }
                    removable={true}
                    viewState={this.props.viewState}
                    terria={this.props.terria}
                  />
                </ul>
              </Box>
            </If>
            <If condition={!this.state.activeTab}>{this.renderPromptBox()}</If>
          </div>
          <If condition={showTwoColumn}>
            <Box styledWidth="60%">
              <DataPreview
                terria={this.props.terria}
                viewState={this.props.viewState}
                previewed={this.props.viewState.userDataPreviewedItem}
              />
            </Box>
          </If>
        </Box>
      );
    }
  })
);

module.exports = withTranslation()(MyDataTab);
