import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import getPath from "../../Core/getPath";
// eslint-disable-next-line no-unused-vars
import Terria from "../../Models/Terria";
// eslint-disable-next-line no-unused-vars
import ViewState from "../../ReactViewModels/ViewState";
import BadgeBar from "../BadgeBar";
import Icon from "../../Styled/Icon";
import Styles from "./workbench.scss";
import WorkbenchList from "./WorkbenchList";
import {
  Category,
  DataSourceAction
} from "../../Core/AnalyticEvents/analyticEvents";

/**
 * @typedef {object} Props
 * @prop {Terria} terria
 * @prop {ViewState} viewState
 * @prop {function} t
 *
 * @extends {React.Component<Props>}
 */
const Workbench = observer(
  createReactClass({
    displayName: "Workbench",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    collapseAll() {
      runInAction(() => {
        this.props.terria.workbench.collapseAll();
      });
    },
    expandAll() {
      runInAction(() => {
        this.props.terria.workbench.expandAll();
      });
    },
    removeAll() {
      this.props.terria.workbench.items.forEach(item => {
        this.props.terria.analytics?.logEvent(
          Category.dataSource,
          DataSourceAction.removeAllFromWorkbench,
          getPath(item)
        );
      });

      runInAction(() => {
        this.props.terria.workbench.removeAll();
        this.props.terria.timelineStack.items.clear();
      });
    },

    render() {
      const { t } = this.props;
      const shouldExpandAll = this.props.terria.workbench.shouldExpandAll;
      return (
        <div className={Styles.workbench}>
          <BadgeBar
            label={t("workbench.label")}
            badge={this.props.terria.workbench.items.length}
          >
            <button
              type="button"
              onClick={this.removeAll}
              className={Styles.removeButton}
            >
              <Icon glyph={Icon.GLYPHS.remove} /> {t("workbench.removeAll")}
            </button>
            {shouldExpandAll ? (
              <button
                type="button"
                onClick={this.expandAll}
                className={Styles.removeButton}
              >
                {t("workbench.expandAll")}
              </button>
            ) : (
              <button
                type="button"
                onClick={this.collapseAll}
                className={Styles.removeButton}
              >
                {t("workbench.collapseAll")}
              </button>
            )}
          </BadgeBar>
          <WorkbenchList
            viewState={this.props.viewState}
            terria={this.props.terria}
          />
        </div>
      );
    }
  })
);

export default withTranslation()(Workbench);
