import { action, computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import { sortable } from "react-anything-sortable";
import { WithTranslation, withTranslation, TFunction } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import getPath from "../../Core/getPath";
import CatalogMemberMixin, {
  getName
} from "../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { BaseModel } from "../../Models/Definition/Model";
import ViewState from "../../ReactViewModels/ViewState";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Checkbox from "../../Styled/Checkbox/Checkbox";
import Icon, { StyledIcon } from "../../Styled/Icon";
import { Li } from "../../Styled/List";
import Spacing from "../../Styled/Spacing";
import { TextSpan } from "../../Styled/Text";
import Loader from "../Loader";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import WorkbenchItemControls from "./Controls/WorkbenchItemControls";

interface IProps extends WithTranslation {
  theme: DefaultTheme;
  item: BaseModel;
  onMouseDown(): void;
  onTouchStart(): void;
  viewState: ViewState;
  className: any;
  style: any;
  t: TFunction;
  setWrapperState(): void;
}

@observer
class WorkbenchItemRaw extends Component<IProps> {
  static displayName = "WorkbenchItem";
  constructor(props: IProps) {
    super(props);
    makeObservable(this);
  }

  @action.bound
  toggleDisplay() {
    if (!CatalogMemberMixin.isMixedInto(this.props.item)) return;
    this.props.item.setTrait(
      CommonStrata.user,
      "isOpenInWorkbench",
      !this.props.item.isOpenInWorkbench
    );
  }

  @action.bound
  toggleVisibility() {
    if (MappableMixin.isMixedInto(this.props.item))
      this.props.item.setTrait(
        CommonStrata.user,
        "show",
        !this.props.item.show
      );
  }

  /** If workbench item is CatalogMember use CatalogMemberTraits.isOpenInWorkbench
   * Otherwise, defaults to true
   */
  @computed
  get isOpen(): boolean {
    if (!CatalogMemberMixin.isMixedInto(this.props.item)) return true;
    return this.props.item.isOpenInWorkbench;
  }

  render() {
    const { item, t } = this.props;

    const isLoading =
      (CatalogMemberMixin.isMixedInto(item) && item.isLoading) ||
      (ReferenceMixin.isMixedInto(item) && item.isLoadingReference);

    return (
      <StyledLi style={this.props.style} className={this.props.className}>
        <Box fullWidth justifySpaceBetween padded styledMinHeight="38px">
          <Box fullWidth>
            <Box left fullWidth paddedHorizontally centered>
              <DraggableBox
                onMouseDown={this.props.onMouseDown}
                onTouchStart={this.props.onTouchStart}
                title={getPath(item, " → ")}
                fullWidth
              >
                {!(item as any).isMappable && !isLoading && (
                  <BoxSpan paddedHorizontally displayInlineBlock>
                    <Box padded>
                      <StyledIcon
                        styledHeight={"18px"}
                        light
                        glyph={Icon.GLYPHS.lineChart}
                      />
                    </Box>
                  </BoxSpan>
                )}
                {MappableMixin.isMixedInto(item) ? (
                  <Box
                    left
                    verticalCenter
                    css={`
                      padding-left: 5px;
                    `}
                  >
                    <Checkbox
                      id="workbenchtoggleVisibility"
                      isChecked={item.show}
                      title={t("workbench.toggleVisibility")}
                      onChange={() => this.toggleVisibility()}
                      css={`
                        overflow-wrap: anywhere;
                      `}
                      textProps={{ medium: true, fullWidth: true }}
                    >
                      <TextSpan
                        medium
                        maxLines={!this.isOpen ? 2 : false}
                        title={getName(item)}
                      >
                        {getName(item)}
                      </TextSpan>
                    </Checkbox>
                  </Box>
                ) : (
                  <TextSpan
                    medium
                    textLight
                    maxLines={!this.isOpen ? 2 : false}
                    title={getName(item)}
                    css={`
                      overflow-wrap: anywhere;
                    `}
                  >
                    {getName(item)}
                  </TextSpan>
                )}
              </DraggableBox>
            </Box>
          </Box>
          {CatalogMemberMixin.isMixedInto(item) ? (
            <Box centered paddedHorizontally>
              {item.isPrivate && (
                <BoxSpan paddedHorizontally>
                  <PrivateIndicator inWorkbench />
                </BoxSpan>
              )}
              <RawButton onClick={() => this.toggleDisplay()}>
                <BoxSpan padded>
                  {this.isOpen ? (
                    <StyledIcon
                      styledHeight={"8px"}
                      light
                      glyph={Icon.GLYPHS.opened}
                    />
                  ) : (
                    <StyledIcon
                      styledHeight={"8px"}
                      light
                      glyph={Icon.GLYPHS.closed}
                    />
                  )}
                </BoxSpan>
              </RawButton>
            </Box>
          ) : null}
        </Box>
        {this.isOpen && (
          <>
            <Spacing
              bottom={2}
              css={`
                border-top: 1px solid ${this.props.theme.dark};
              `}
            />
            <Box column paddedHorizontally={2}>
              <WorkbenchItemControls
                item={this.props.item}
                viewState={this.props.viewState}
              />
              {isLoading ? (
                <Box paddedVertically>
                  <Loader light />
                </Box>
              ) : null}
            </Box>
            <Spacing bottom={2} />
          </>
        )}
      </StyledLi>
    );
  }
}

const DraggableBox = styled(Box)`
  cursor: move;
`;

const StyledLi = styled(Li)`
  background: ${(p) => p.theme.darkWithOverlay};
  color: ${(p) => p.theme.textLight};
  border-radius: 4px;
  margin-bottom: 5px;
  width: 100%;
`;

export default sortable(withTranslation()(withTheme(WorkbenchItemRaw)));
