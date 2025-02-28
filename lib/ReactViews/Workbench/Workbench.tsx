import { action, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import { withTranslation, WithTranslation, TFunction } from "react-i18next";
import getPath from "../../Core/getPath";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { TextSpan } from "../../Styled/Text";
import BadgeBar from "../BadgeBar";
import Icon, { StyledIcon } from "../../Styled/Icon";
import WorkbenchList from "./WorkbenchList";
import {
  Category,
  DataSourceAction
} from "../../Core/AnalyticEvents/analyticEvents";

interface IProps extends WithTranslation {
  terria: Terria;
  viewState: ViewState;
  t: TFunction;
}

@observer
class Workbench extends Component<IProps> {
  constructor(props: IProps) {
    super(props);
    makeObservable(this);
  }

  @action.bound
  collapseAll() {
    runInAction(() => {
      this.props.terria.workbench.collapseAll();
    });
  }

  @action.bound
  expandAll() {
    runInAction(() => {
      this.props.terria.workbench.expandAll();
    });
  }

  @action.bound
  removeAll() {
    this.props.terria.workbench.items.forEach((item) => {
      this.props.terria.analytics?.logEvent(
        Category.dataSource,
        DataSourceAction.removeAllFromWorkbench,
        getPath(item)
      );
      this.props.terria.removeSelectedFeaturesForModel(item);
    });
    this.props.terria.workbench.removeAll();
    (this.props.terria.timelineStack.items as any).clear();
  }

  render() {
    const { t } = this.props;
    const shouldExpandAll = this.props.terria.workbench.shouldExpandAll;
    return (
      <Box column fullWidth styledMinHeight={"0"}>
        <BadgeBar
          label={t("workbench.label")}
          badge={this.props.terria.workbench.items.length}
        >
          <RawButton
            onClick={this.removeAll}
            css={`
              display: flex;
              align-items: center;
              padding: 0 5px;
              svg {
                vertical-align: middle;
                padding-right: 4px;
              }
            `}
          >
            <StyledIcon
              glyph={Icon.GLYPHS.remove}
              light
              styledWidth={"12px"}
              displayInline
            />
            <TextSpan textLight small>
              {t("workbench.removeAll")}
            </TextSpan>
          </RawButton>
          {shouldExpandAll ? (
            <RawButton
              onClick={this.expandAll}
              css={`
                display: flex;
                align-items: center;
                padding-left: 5px;
              `}
            >
              <TextSpan textLight small>
                {t("workbench.expandAll")}
              </TextSpan>
            </RawButton>
          ) : (
            <RawButton
              onClick={this.collapseAll}
              css={`
                display: flex;
                align-items: center;
                padding-left: 5px;
              `}
            >
              <TextSpan textLight small>
                {t("workbench.collapseAll")}
              </TextSpan>
            </RawButton>
          )}
        </BadgeBar>
        <WorkbenchList
          viewState={this.props.viewState}
          terria={this.props.terria}
        />
      </Box>
    );
  }
}

export default withTranslation()(Workbench);
