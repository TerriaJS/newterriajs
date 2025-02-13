import { action, computed, observable, makeObservable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiffableMixin from "../../../ModelMixins/DiffableMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import DateTimePicker from "../../BottomDock/Timeline/DateTimePicker";
import Text, { TextSpan } from "../../../Styled/Text";
import Box from "../../../Styled/Box";
import Button from "../../../Styled/Button";
import Spacing from "../../../Styled/Spacing";
import dateFormat from "dateformat";

interface PropsType extends WithTranslation {
  heading: string;
  item: DiffableMixin.Instance;
  externalOpenButton: React.RefObject<HTMLButtonElement>;
  onDateSet: () => void;
}

@observer
class DatePicker extends React.Component<PropsType> {
  @observable private isOpen = false;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
  }

  @computed
  get currentDate(): Date | undefined {
    const date = this.props.item.currentDiscreteJulianDate;
    return date && JulianDate.toDate(date);
  }

  @computed
  get formattedCurrentDate() {
    if (this.currentDate === undefined) {
      return;
    }
    const dateFormatting = undefined; // TODO
    const formattedDate =
      dateFormatting !== undefined
        ? dateFormat(this.currentDate, dateFormatting)
        : formatDateTime(this.currentDate);
    return formattedDate;
  }

  @action.bound
  toggleOpen(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    this.isOpen = !this.isOpen;
    // stopPropagation is required to prevent the datetime picker popup from closing when
    // the date button is clicked
    e.stopPropagation();
  }

  @action.bound
  setIsOpen(isOpen: boolean) {
    this.isOpen = isOpen;
  }

  @action.bound
  changeCurrentDate(date: Date) {
    this.props.item.setTrait(
      CommonStrata.user,
      "currentTime",
      date.toISOString()
    );
    this.props.onDateSet();
  }

  @action.bound
  moveToPreviousDate() {
    this.props.item.moveToPreviousDiscreteTime(CommonStrata.user);
    this.props.onDateSet();
  }

  @action.bound
  moveToNextDate() {
    this.props.item.moveToNextDiscreteTime(CommonStrata.user);
    this.props.onDateSet();
  }

  @action.bound
  onClickExternalButton(event: MouseEvent) {
    this.setIsOpen(true);
    // stopPropagation is required to prevent the datetime picker popup from closing when
    // the external button is clicked
    event.stopPropagation();
  }

  registerExternalButtonClick() {
    this.props.externalOpenButton.current?.addEventListener(
      "click",
      this.onClickExternalButton
    );
  }

  unregisterExternalButtonClick(
    externalOpenButton: React.RefObject<HTMLButtonElement>
  ) {
    externalOpenButton.current?.removeEventListener(
      "click",
      this.onClickExternalButton
    );
  }

  componentDidMount() {
    this.registerExternalButtonClick();
  }

  componentDidUpdate(prevProps: PropsType) {
    this.unregisterExternalButtonClick(prevProps.externalOpenButton);
    this.registerExternalButtonClick();
  }

  componentWillUnmount() {
    this.unregisterExternalButtonClick(this.props.externalOpenButton);
  }

  render() {
    const { heading, item, t } = this.props;
    return (
      <Box column centered flex={1}>
        <Spacing bottom={4} />
        <Box centered>
          <StyledIcon
            light
            styledWidth="21px"
            glyph={Icon.GLYPHS.calendar2}
            css={"margin-top:-2px;"}
          />
          <Spacing right={2} />
          <Text textLight extraLarge>
            {heading}
          </Text>
        </Box>
        <Spacing bottom={2} />
        <Box>
          <PrevButton
            disabled={item.isPreviousDiscreteTimeAvailable === false}
            title={t("diffTool.datePicker.previousDateTitle")}
            onClick={this.moveToPreviousDate}
          />
          <DateButton
            primary
            isOpen={this.isOpen}
            onClick={this.toggleOpen}
            title={t("diffTool.datePicker.dateButtonTitle")}
          >
            <TextSpan extraLarge>{this.formattedCurrentDate || "-"}</TextSpan>
          </DateButton>
          <NextButton
            disabled={item.isNextDiscreteTimeAvailable === false}
            title={t("diffTool.datePicker.nextDateTitle")}
            onClick={this.moveToNextDate}
          />
        </Box>
        <div
          style={{
            display: this.isOpen ? "block" : "none",
            position: "absolute"
          }}
        >
          <DateTimePicker
            currentDate={this.currentDate}
            dates={this.props.item.objectifiedDates}
            onChange={this.changeCurrentDate}
            openDirection="none"
            isOpen={this.isOpen}
            onOpen={() => this.setIsOpen(true)}
            onClose={() => this.setIsOpen(false)}
          />
        </div>
        <Spacing bottom={4} />
      </Box>
    );
  }
}

const PagerButton = styled(Button).attrs({
  iconProps: {
    css: "margin-right:0;"
  }
})`
  cursor: pointer;
  background-color: ${(props) => props.theme.colorPrimary};
  width: 40px;
  border: 1px solid transparent;

  ${({ theme }) => theme.centerWithFlex()}
  flex-direction: column;
`;

const PrevButton = styled(PagerButton).attrs({
  renderIcon: () => (
    <StyledIcon
      css="transform:rotate(90deg);"
      light
      styledWidth="15px"
      glyph={Icon.GLYPHS.arrowDown}
    />
  )
})`
  ${({ theme }) => theme.borderRadiusLeft(theme.radius40Button)}
  margin-right: 1px;
`;

const NextButton = styled(PagerButton).attrs({
  renderIcon: () => (
    <StyledIcon
      css="transform:rotate(270deg);"
      light
      styledWidth="15px"
      glyph={Icon.GLYPHS.arrowDown}
    />
  )
})`
  ${({ theme }) => theme.borderRadiusRight(theme.radius40Button)}
  margin-left: 1px;
`;

const DateButton = styled(Button)<{ isOpen: boolean }>`
  // z-index: 1000; // (Nanda): So that we don't loose the button clicks to the date picker popup
  z-index: 0;
  ${(props) => props.isOpen && `z-index: 1000;`};

  border-radius: 0px;
  border: 1px solid ${(props) => props.theme.colorPrimary};

  min-width: 235px;
  @media (max-width: ${(props: any) => props.theme.lg}px) {
    min-width: 150px;
  }
`;

export default withTranslation()(DatePicker);
