import {
  action,
  IReactionDisposer,
  observable,
  reaction,
  runInAction,
  makeObservable
} from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled from "styled-components";
import isDefined from "../../../Core/isDefined";
import {
  ObjectifiedDates,
  ObjectifiedYears
} from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import Button, { RawButton } from "../../../Styled/Button";
import { scrollBars } from "../../../Styled/mixins";
import Spacing from "../../../Styled/Spacing";
import Icon from "../../../Styled/Icon";
import { formatDateTime } from "./DateFormats";
import dateFormat from "dateformat";
import DatePicker from "react-datepicker";

function daysInMonth(month: number, year: number) {
  const n = new Date(year, month, 0).getDate();
  return (Array.apply as any)(null, { length: n }).map(
    Number.call,
    Number
  ) as number[];
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const GridItem = styled.span<{ active: boolean }>`
  background: ${(p) => p.theme.overlay};
  ${(p) =>
    p.active &&
    `
    & {
      background: ${p.theme.colorPrimary};
    }
    opacity: 0.9;
   `}
`;

const GridRowInner = styled.span<{ marginRight: string }>`
  display: table-row;
  padding: 3px;
  border-radius: 3px;

  span {
    display: inline-block;
    height: 10px;
    width: 2px;
    margin-top: 1px;
    margin-right: ${(p) => p.marginRight}px;
  }
`;

const Grid = styled.div`
  display: block;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  color: ${(p: any) => p.theme.textLight};
  padding: 0px 5px;
  border-radius: 3px;
  margin-top: -20px;
`;

const GridHeading = styled.div`
  text-align: center;
  color: ${(p: any) => p.theme.textLight};
  font-size: 12px;
  margin-bottom: 10px;
`;

export const GridRow = styled.div`
  :hover {
    background: ${(p) => p.theme.overlay};
    cursor: pointer;
  }
`;

const GridLabel = styled.span`
  float: left;
  display: inline-block;
  width: 35px;
  font-size: 10px;
  padding-left: 3px;
`;

const GridBody = styled.div`
  height: calc(100% - 30px);
  overflow: auto;
  ${scrollBars()}
`;

const BackButton = styled(RawButton)`
  display: inline-block;
  z-index: 99;
  position: relative;

  svg {
    height: 15px;
    width: 20px;
    fill: ${(p: any) => p.theme.textLight};
    display: inline-block;
    vertical-align: bottom;
  }

  &[disabled],
  &:disabled {
    opacity: 0.1;
  }
`;

export const DateButton = styled(Button).attrs({
  primary: true,
  textProps: { medium: true }
})`
  width: calc(100% - 20px);
  margin: 3px 5px;
  border-radius: 4px;
`;

interface PropsType extends WithTranslation {
  dates: ObjectifiedDates;
  currentDate?: Date; // JS Date object - must be an element of props.dates, or null/undefined.
  onChange: (date: Date) => void;
  openDirection?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  dateFormat?: string;
}

type Granularity = "century" | "year" | "month" | "day" | "time" | "hour";

@observer
class DateTimePicker extends Component<PropsType> {
  public static defaultProps = {
    openDirection: "down"
  };

  @observable
  currentDateIndice: {
    century?: number;
    year?: number;
    month?: number;
    day?: number;
    time?: Date;
    hour?: number;
    granularity: Granularity;
  } = { granularity: "century" };

  private currentDateAutorunDisposer: IReactionDisposer | undefined;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
  }

  UNSAFE_componentWillMount() {
    const datesObject = this.props.dates;
    let defaultCentury: number | undefined;
    let defaultYear: number | undefined;
    let defaultMonth: number | undefined;
    let defaultDay: number | undefined;
    let defaultGranularity: Granularity = "century";

    if (datesObject.index.length === 1) {
      // only one century
      const soleCentury = datesObject.index[0];
      const dataFromThisCentury = datesObject[soleCentury];
      defaultCentury = soleCentury;

      if (dataFromThisCentury.index.length === 1) {
        // only one year, check if this year has only one month
        const soleYear = dataFromThisCentury.index[0];
        const dataFromThisYear = dataFromThisCentury[soleYear];
        defaultYear = soleYear;
        defaultGranularity = "year";

        if (dataFromThisYear.index.length === 1) {
          // only one month data from this one year, need to check day then
          const soleMonth = dataFromThisYear.index[0];
          const dataFromThisMonth = dataFromThisYear[soleMonth];
          defaultMonth = soleMonth;
          defaultGranularity = "month";

          if (dataFromThisMonth.index.length === 1) {
            // only one day has data
            defaultDay = dataFromThisMonth.index[0];
          }
        }
      }
    }
    this.currentDateIndice = {
      century: defaultCentury,
      year: defaultYear,
      month: defaultMonth,
      day: defaultDay,
      granularity: defaultGranularity
    };

    window.addEventListener("click", this.closePickerEventHandler);

    // Update currentDateIndice when currentDate changes
    this.currentDateAutorunDisposer = reaction(
      () => this.props.currentDate,
      () => {
        // The current date must be one of the available item.dates, or null/undefined.
        const currentDate = this.props.currentDate;
        if (isDefined(currentDate)) {
          Object.assign(this.currentDateIndice, {
            day: isDefined(this.currentDateIndice.day)
              ? currentDate.getDate()
              : undefined,
            month: isDefined(this.currentDateIndice.month)
              ? currentDate.getMonth()
              : undefined,
            year: isDefined(this.currentDateIndice.year)
              ? currentDate.getFullYear()
              : undefined,
            century: isDefined(this.currentDateIndice.century)
              ? Math.floor(currentDate.getFullYear() / 100)
              : undefined,
            time: currentDate
          });
        }
      },
      { fireImmediately: true }
    );
  }

  componentWillUnmount() {
    if (this.currentDateAutorunDisposer) {
      this.currentDateAutorunDisposer();
    }
    window.removeEventListener("click", this.closePickerEventHandler);
  }

  @action.bound
  closePickerEventHandler() {
    this.closePicker();
  }

  closePicker(newTime?: Date) {
    if (newTime !== undefined) {
      runInAction(() => (this.currentDateIndice.time = newTime));
    }

    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  renderCenturyGrid(datesObject: ObjectifiedDates) {
    const centuries = datesObject.index;
    if (datesObject.dates && datesObject.dates.length >= 12) {
      return (
        <Grid>
          <GridHeading>Select a century</GridHeading>
          {centuries.map((c) => (
            <DateButton
              key={c}
              css={`
                display: inline-block;
                width: 40%;
              `}
              onClick={() =>
                runInAction(() => (this.currentDateIndice.century = c))
              }
            >
              {c}00
            </DateButton>
          ))}
        </Grid>
      );
    } else {
      return this.renderList(datesObject.dates);
    }
  }

  renderYearGrid(datesObject: ObjectifiedYears) {
    if (datesObject.dates && datesObject.dates.length > 12) {
      const years = datesObject.index;
      const monthOfYear = (Array.apply as any)(null, { length: 12 }).map(
        Number.call,
        Number
      ) as number[];
      return (
        <Grid>
          <GridHeading>Select a year</GridHeading>
          <GridBody>
            {years.map((y) => (
              <GridRow
                key={y}
                onClick={() =>
                  runInAction(() => {
                    this.currentDateIndice.year = y;
                    this.currentDateIndice.month = undefined;
                    this.currentDateIndice.day = undefined;
                    this.currentDateIndice.time = undefined;
                  })
                }
              >
                <GridLabel>{y}</GridLabel>
                <GridRowInner marginRight="11">
                  {monthOfYear.map((m) => (
                    <GridItem
                      // className={datesObject[y][m] ? Styles.activeGrid : ""}
                      active={isDefined(datesObject[y][m])}
                      key={m}
                    />
                  ))}
                </GridRowInner>
              </GridRow>
            ))}
          </GridBody>
        </Grid>
      );
    } else {
      return this.renderList(datesObject.dates);
    }
  }

  renderMonthGrid(datesObject: ObjectifiedYears) {
    const year = this.currentDateIndice.year;
    if (!isDefined(year)) {
      return null;
    }
    if (datesObject[year].dates && datesObject[year].dates.length > 12) {
      return (
        <Grid>
          <GridHeading>
            <BackButton
              title={this.props.t("dateTime.back")}
              onClick={() => {
                runInAction(() => {
                  this.currentDateIndice.year = undefined;
                  this.currentDateIndice.month = undefined;
                  this.currentDateIndice.day = undefined;
                  this.currentDateIndice.time = undefined;
                });
              }}
            >
              {year}
            </BackButton>
          </GridHeading>
          <GridBody>
            {monthNames.map((m, i) => (
              <GridRow
                css={`
                  ${!isDefined(datesObject[year][i])
                    ? `:hover {
                  background: transparent;
                  cursor: default;
                }`
                    : ""}
                `}
                key={m}
                onClick={() =>
                  isDefined(datesObject[year][i]) &&
                  runInAction(() => {
                    this.currentDateIndice.month = i;
                    this.currentDateIndice.day = undefined;
                    this.currentDateIndice.time = undefined;
                  })
                }
              >
                <GridLabel>{m}</GridLabel>
                <GridRowInner marginRight="3">
                  {daysInMonth(i + 1, year).map((d) => (
                    <GridItem
                      active={
                        isDefined(datesObject[year][i]) &&
                        isDefined(datesObject[year][i][d + 1])
                      }
                      key={d}
                    />
                  ))}
                </GridRowInner>
              </GridRow>
            ))}
          </GridBody>
        </Grid>
      );
    } else {
      return this.renderList(datesObject[year].dates);
    }
  }

  renderDayView(datesObject: ObjectifiedYears) {
    if (
      !isDefined(this.currentDateIndice.year) ||
      !isDefined(this.currentDateIndice.month)
    ) {
      return null;
    }

    const dayObject =
      datesObject[this.currentDateIndice.year][this.currentDateIndice.month];
    if (dayObject.dates.length > 1) {
      // Create one date object per day, using an arbitrary time. This does it via Object.keys and moment().
      const daysToDisplay = dayObject.dates;
      const selected = isDefined(this.currentDateIndice.day)
        ? dayObject[this.currentDateIndice.day].dates[0]
        : null;

      return (
        <div
          css={`
            text-align: center;
            margin-top: -10px;
          `}
        >
          <div>
            <BackButton
              title={this.props.t("dateTime.back")}
              onClick={() =>
                runInAction(() => {
                  this.currentDateIndice.year = undefined;
                  this.currentDateIndice.month = undefined;
                  this.currentDateIndice.day = undefined;
                  this.currentDateIndice.time = undefined;
                })
              }
            >
              {this.currentDateIndice.year}
            </BackButton>
            &nbsp;
            <BackButton
              title={this.props.t("dateTime.back")}
              onClick={() =>
                runInAction(() => {
                  this.currentDateIndice.month = undefined;
                  this.currentDateIndice.day = undefined;
                  this.currentDateIndice.time = undefined;
                })
              }
            >
              {monthNames[this.currentDateIndice.month]}
            </BackButton>
            <Spacing bottom={1} />
          </div>
          <DatePicker
            inline
            onChange={(date: Date | null, _event: any) =>
              runInAction(() => {
                this.currentDateIndice.day = date?.getDate();
              })
            }
            includeDates={daysToDisplay}
            selected={selected}
          />
        </div>
      );
    } else {
      return this.renderList(
        datesObject[this.currentDateIndice.year][this.currentDateIndice.month]
          .dates
      );
    }
  }

  renderList(items: Date[]) {
    if (isDefined(items)) {
      return (
        <Grid>
          <GridHeading>Select a time</GridHeading>
          <GridBody>
            {items.map((item) => (
              <DateButton
                key={formatDateTime(item)}
                onClick={() => {
                  this.closePicker(item);
                  this.props.onChange(item);
                }}
              >
                {isDefined(this.props.dateFormat)
                  ? dateFormat(item, this.props.dateFormat)
                  : formatDateTime(item)}
              </DateButton>
            ))}
          </GridBody>
        </Grid>
      );
    }
  }

  renderHourView(datesObject: ObjectifiedYears) {
    if (
      !isDefined(this.currentDateIndice.year) ||
      !isDefined(this.currentDateIndice.month) ||
      !isDefined(this.currentDateIndice.day)
    ) {
      return null;
    }
    const timeOptions = datesObject[this.currentDateIndice.year][
      this.currentDateIndice.month
    ][this.currentDateIndice.day].dates.map((m) => ({
      value: m,
      label: formatDateTime(m)
    }));

    if (timeOptions.length > 24) {
      return (
        <Grid>
          <GridHeading>
            {`Select an hour on ${this.currentDateIndice.day} ${
              monthNames[this.currentDateIndice.month + 1]
            } ${this.currentDateIndice.year}`}{" "}
          </GridHeading>
          <GridBody>
            {datesObject[this.currentDateIndice.year][
              this.currentDateIndice.month
            ][this.currentDateIndice.day].index.map((item) => (
              <DateButton
                key={item}
                onClick={() =>
                  runInAction(() => {
                    this.currentDateIndice.hour = item;
                  })
                }
              >
                <span>
                  {item} : 00 - {item + 1} : 00
                </span>{" "}
                <span>
                  (
                  {
                    datesObject[this.currentDateIndice.year!][
                      this.currentDateIndice.month!
                    ][this.currentDateIndice.day!][item].length
                  }{" "}
                  options)
                </span>
              </DateButton>
            ))}
          </GridBody>
        </Grid>
      );
    } else {
      return this.renderList(
        datesObject[this.currentDateIndice.year][this.currentDateIndice.month][
          this.currentDateIndice.day
        ].dates
      );
    }
  }

  renderMinutesView(datesObject: ObjectifiedYears) {
    if (
      !isDefined(this.currentDateIndice.year) ||
      !isDefined(this.currentDateIndice.month) ||
      !isDefined(this.currentDateIndice.day) ||
      !isDefined(this.currentDateIndice.hour)
    ) {
      return null;
    }
    const options =
      datesObject[this.currentDateIndice.year][this.currentDateIndice.month][
        this.currentDateIndice.day
      ][this.currentDateIndice.hour];
    return this.renderList(options);
  }

  @action
  goBack() {
    if (isDefined(this.currentDateIndice.time)) {
      if (!isDefined(this.currentDateIndice.month)) {
        this.currentDateIndice.year = undefined;
        this.currentDateIndice.day = undefined;
      }

      if (!isDefined(this.currentDateIndice.hour)) {
        this.currentDateIndice.day = undefined;
      }

      if (!isDefined(this.currentDateIndice.day)) {
        this.currentDateIndice.month = undefined;
      }

      this.currentDateIndice.hour = undefined;
      this.currentDateIndice.time = undefined;
    } else if (isDefined(this.currentDateIndice.hour)) {
      this.currentDateIndice.hour = undefined;
    } else if (isDefined(this.currentDateIndice.day)) {
      this.currentDateIndice.day = undefined;
    } else if (isDefined(this.currentDateIndice.month)) {
      this.currentDateIndice.month = undefined;
    } else if (isDefined(this.currentDateIndice.year)) {
      this.currentDateIndice.year = undefined;
    } else if (isDefined(this.currentDateIndice.century)) {
      this.currentDateIndice.century = undefined;
    }
  }

  toggleDatePicker() {
    if (!this.props.isOpen) {
      this.props.onOpen();
    } else {
      this.props.onClose();
    }
  }

  render() {
    if (this.props.dates) {
      const datesObject = this.props.dates;
      return (
        <div
          css={`
            color: ${(p: any) => p.theme.textLight};
            display: table-cell;
            width: 30px;
            height: 30px;
          `}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {this.props.isOpen && (
            <div
              css={`
                background: ${(p: any) => p.theme.dark};
                width: 260px;
                height: 300px;
                border: 1px solid ${(p: any) => p.theme.grey};
                border-radius: 5px;
                padding: 5px;
                position: relative;
                top: -170px;
                left: 0;
                z-index: 100;

                ${this.props.openDirection === "down"
                  ? `
                  top: 40px;
                  left: -190px;
                `
                  : ""}
              `}
              className={"scrollbars"}
            >
              <BackButton
                title={this.props.t("dateTime.back")}
                css={`
                  padding-bottom: 5px;
                  padding-right: 5px;
                `}
                disabled={
                  !isDefined(
                    this.currentDateIndice[this.currentDateIndice.granularity]
                  )
                }
                type="button"
                onClick={() => this.goBack()}
              >
                <Icon glyph={Icon.GLYPHS.left} />
              </BackButton>
              {!isDefined(this.currentDateIndice.century) &&
                this.renderCenturyGrid(datesObject)}
              {isDefined(this.currentDateIndice.century) &&
                !isDefined(this.currentDateIndice.year) &&
                this.renderYearGrid(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                !isDefined(this.currentDateIndice.month) &&
                this.renderMonthGrid(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                isDefined(this.currentDateIndice.month) &&
                !isDefined(this.currentDateIndice.day) &&
                this.renderDayView(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                isDefined(this.currentDateIndice.month) &&
                isDefined(this.currentDateIndice.day) &&
                !isDefined(this.currentDateIndice.hour) &&
                this.renderHourView(
                  datesObject[this.currentDateIndice.century!]
                )}
              {isDefined(this.currentDateIndice.year) &&
                isDefined(this.currentDateIndice.month) &&
                isDefined(this.currentDateIndice.day) &&
                isDefined(this.currentDateIndice.hour) &&
                this.renderMinutesView(
                  datesObject[this.currentDateIndice.century!]
                )}
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }
}

export default withTranslation()(DateTimePicker);
