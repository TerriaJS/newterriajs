import dateFormat from "dateformat";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import { WithTranslation, withTranslation, TFunction } from "react-i18next";
import styled from "styled-components";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import isDefined from "../../../Core/isDefined";
import DiscretelyTimeVaryingMixin from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Spacing from "../../../Styled/Spacing";
import Text, { TextSpan } from "../../../Styled/Text";
import { formatDateTime } from "../../BottomDock/Timeline/DateFormats";
import DateTimePicker from "../../BottomDock/Timeline/DateTimePicker";

interface IState {
  isOpen: boolean;
}

interface IProps extends WithTranslation {
  item: DiscretelyTimeVaryingMixin.Instance;
  t: TFunction;
}

@observer
class DateTimeSelectorSection extends Component<IProps, IState> {
  state: IState = {
    isOpen: false
  };

  constructor(props: IProps) {
    super(props);
    this.changeDateTime = this.changeDateTime.bind(this);
    this.onTimelineButtonClicked = this.onTimelineButtonClicked.bind(this);
    this.onShowOnChartButtonClicked =
      this.onShowOnChartButtonClicked.bind(this);
    this.onPreviousButtonClicked = this.onPreviousButtonClicked.bind(this);
    this.onNextButtonClicked = this.onNextButtonClicked.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.toggleOpen = this.toggleOpen.bind(this);
  }

  changeDateTime(time: Date) {
    const item = this.props.item;

    // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
    item.terria.timelineStack.promoteToTop(item);

    runInAction(() => {
      // Set the time on the item, set it to use its own clock, update the imagery and repaint.
      item.setTrait(
        CommonStrata.user,
        "currentTime",
        JulianDate.toIso8601(JulianDate.fromDate(time))
      );
    });
    item.terria.currentViewer.notifyRepaintRequired();
  }

  onTimelineButtonClicked() {
    const item = this.props.item;
    const terria = item.terria;
    if (terria.timelineStack.items.indexOf(item) >= 0) {
      terria.timelineStack.remove(item);
    } else {
      terria.timelineStack.addToTop(item);
    }
    item.terria.currentViewer.notifyRepaintRequired();
  }

  onShowOnChartButtonClicked() {
    const item = this.props.item;
    runInAction(() => {
      item.setTrait(
        CommonStrata.user,
        "showInChartPanel",
        !item.showInChartPanel
      );
    });
  }

  onPreviousButtonClicked() {
    const item = this.props.item;

    // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
    item.terria.timelineStack.promoteToTop(item);

    item.moveToPreviousDiscreteTime(CommonStrata.user);

    // Repaint imagery on layers that don't subscribe to clock changes.
    item.terria.currentViewer.notifyRepaintRequired();
  }

  onNextButtonClicked() {
    const item = this.props.item;

    // Give this item focus on the timeline (if it is connected to the timeline), so that the user can select all available dates for this item.
    item.terria.timelineStack.promoteToTop(item);

    item.moveToNextDiscreteTime(CommonStrata.user);

    // Repaint imagery on layers that don't subscribe to clock changes.
    item.terria.currentViewer.notifyRepaintRequired();
  }

  onOpen() {
    this.setState({
      isOpen: true
    });
  }

  onClose() {
    this.setState({
      isOpen: false
    });
  }

  toggleOpen(event: any) {
    this.setState({
      isOpen: !this.state.isOpen
    });
    event.stopPropagation();
  }

  render() {
    const { t } = this.props;
    let discreteTime;
    let format;
    const item = this.props.item;
    const discreteTimes = item.discreteTimesAsSortedJulianDates;
    const disableDateTimeSelector = item.disableDateTimeSelector;

    if (
      !isDefined(discreteTimes) ||
      discreteTimes.length === 0 ||
      disableDateTimeSelector
    ) {
      return null;
    }

    if (isDefined(item.currentDiscreteJulianDate)) {
      const time = JulianDate.toDate(item.currentDiscreteJulianDate);
      if (isDefined(item.dateFormat)) {
        format = item.dateFormat;
        discreteTime = dateFormat(time, item.dateFormat);
      } else {
        discreteTime = formatDateTime(time);
      }
    }

    const attachedToTimeline = item.terria.timelineStack.contains(item);

    return (
      <Box column paddedVertically>
        <Text medium textLight id={"dateTimeSelectorLabel"}>
          {item.timeLabel ?? t("dateTime.selectorLabel")}
        </Text>
        <Spacing bottom={1} />
        <Box fullWidth justifySpaceBetween styledHeight={"30px"} gap>
          <Box
            backgroundColor="rgba(250, 250, 250, 0.2)"
            css={`
              border-radius: 2px;
              flex-grow: 1;
            `}
          >
            <StyledButton
              disabled={!item.isPreviousDiscreteTimeAvailable}
              onClick={this.onPreviousButtonClicked}
              title={t("dateTime.previous")}
              css={`
                border-right: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 2px 0 0 2px;
              `}
            >
              <StyledIcon glyph={GLYPHS.previous} styledWidth={"8px"} />
            </StyledButton>
            <StyledButton
              onClick={this.toggleOpen}
              title={t("dateTime.selectTime")}
              id="current-date-btn"
              css={`
                flex-grow: 1;
                padding: 0 10px;
              `}
            >
              <TextSpan large textLight id="current-date">
                {isDefined(discreteTime)
                  ? discreteTime
                  : t("dateTime.outOfRange")}
              </TextSpan>
            </StyledButton>
            <StyledButton
              disabled={!item.isNextDiscreteTimeAvailable}
              onClick={this.onNextButtonClicked}
              title={t("dateTime.next")}
              css={`
                border-left: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 0 2px 2px 0;
              `}
            >
              <StyledIcon glyph={GLYPHS.next} styledWidth={"8px"} />
            </StyledButton>
            <div
              css={`
                width: 0;
                height: 0;
              `}
              title={t("dateTime.selectTime")}
            >
              <DateTimePicker
                currentDate={
                  item.currentDiscreteJulianDate === undefined
                    ? undefined
                    : JulianDate.toDate(item.currentDiscreteJulianDate)
                }
                dates={item.objectifiedDates}
                onChange={this.changeDateTime}
                openDirection="down"
                isOpen={this.state.isOpen}
                onClose={this.onClose}
                dateFormat={format}
              />
            </div>
          </Box>
          <TimelineButton
            active={attachedToTimeline}
            type="button"
            onClick={this.onTimelineButtonClicked}
            title={t("dateTime.useTimeline")}
          >
            <StyledIcon light styledWidth={"20px"} glyph={GLYPHS.timeline} />
          </TimelineButton>
          <TimelineButton
            active={item.showInChartPanel}
            type="button"
            onClick={this.onShowOnChartButtonClicked}
            title={t("dateTime.availableTimeChart")}
          >
            <StyledIcon light styledWidth={"20px"} glyph={GLYPHS.lineChart} />
          </TimelineButton>
        </Box>
      </Box>
    );
  }
}

const StyledButton = styled(RawButton)`
  padding: 10px;
  ${(props) =>
    props.disabled &&
    `&[disabled],
    &[disabled]:hover,
    &[disabled]:focus {
      opacity: 0.4;
      cursor: default;
      outline: 0;
      background: rgba(250, 250, 250, 0.2);
    }
  `}
`;

const TimelineButton = styled(RawButton)<{ active: boolean }>`
  padding: 0 5px;
  border-radius: 2px;
  background-color: rgba(250, 250, 250, 0.2);
  ${(props) =>
    props.active &&
    `
      background-color: ${props.theme.colorPrimary};
      color: ${props.theme.textLight};
      &:hover,
      &:focus {
        color: ${props.theme.textLight};
      }
  `}
`;

export default withTranslation()(DateTimeSelectorSection);
