import { action, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
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
import MappableMixin from "../../ModelMixins/MappableMixin";

interface IProps extends WithTranslation {
  terria: Terria;
  viewState: ViewState;
  t: TFunction;
}

@observer
class Workbench extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
    makeObservable(this);
  }

  disableAll() {
    this.props.terria.workbench.disableAll();
  }

  enableAll() {
    this.props.terria.workbench.enableAll();
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

    // show enable all button if some items are disabled
    const showEnableAll = this.props.terria.workbench.items
      .filter((it): it is MappableMixin.Instance =>
        MappableMixin.isMixedInto(it)
      )
      .every((it) => !it.show);

    return (
      <Box column fullWidth styledMinHeight={"0"} flex={1}>
        <BadgeBar
          label={t("workbench.label")}
          badge={this.props.terria.workbench.items.length}
        >
          {showEnableAll ? (
            <RawButton
              onClick={() => this.enableAll()}
              css={`
                display: flex;
                align-items: center;
                padding-left: 5px;
                min-width: 90px;
                justify-content: space-evenly;
              `}
            >
              <StyledIcon
                glyph={Icon.GLYPHS.enable}
                light
                styledWidth={"12px"}
                displayInline
              />
              <TextSpan textLight small>
                {t("workbench.enableAll")}
              </TextSpan>
            </RawButton>
          ) : (
            <RawButton
              onClick={() => this.disableAll()}
              css={`
                display: flex;
                align-items: center;
                padding-left: 5px;
                min-width: 90px;
                justify-content: space-evenly;
              `}
            >
              <StyledIcon
                glyph={Icon.GLYPHS.disable}
                light
                styledWidth={"12px"}
                displayInline
              />
              <TextSpan textLight small>
                {t("workbench.disableAll")}
              </TextSpan>
            </RawButton>
          )}
          {shouldExpandAll ? (
            <RawButton
              onClick={this.expandAll}
              css={`
                display: flex;
                align-items: center;
                padding-left: 5px;
                min-width: 90px;
                justify-content: space-evenly;
              `}
            >
              <StyledIcon
                glyph={Icon.GLYPHS.expandAll}
                light
                styledWidth={"12px"}
                displayInline
              />
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
                min-width: 90px;
                justify-content: space-evenly;
              `}
            >
              <StyledIcon
                glyph={Icon.GLYPHS.collapse}
                light
                styledWidth={"12px"}
                displayInline
              />
              <TextSpan textLight small>
                {t("workbench.collapseAll")}
              </TextSpan>
            </RawButton>
          )}
          <RawButton
            onClick={this.removeAll}
            css={`
              display: flex;
              align-items: center;
              padding: 0 5px;
              min-width: 90px;
              justify-content: space-evenly;
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
