import { runInAction } from "mobx";
import { observer, useLocalObservable } from "mobx-react";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import isDefined from "../../../Core/isDefined";
import {
  ObjectifiedDates,
  ObjectifiedYears,
  type ObjectifiedDays,
  type ObjectifiedHours,
  type ObjectifiedMonths
} from "../../../ModelMixins/DiscretelyTimeVaryingMixin";
import Button, { RawButton } from "../../../Styled/Button";
import Icon from "../../../Styled/Icon";
import { CenturyView } from "./DatePicker/CenturyView";
import { DayView } from "./DatePicker/DayView";
import { HourView } from "./DatePicker/HourView";
import { MonthView } from "./DatePicker/MonthView";
import { TimeListView } from "./DatePicker/TimeListView";
import { YearView } from "./DatePicker/YearView";

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

interface PropsType {
  dates: ObjectifiedDates;
  currentDate?: Date; // JS Date object - must be an element of props.dates, or null/undefined.
  onChange: (date: Date) => void;
  openDirection?: string;
  isOpen: boolean;
  onClose: () => void;
  dateFormat?: string;
}

enum GranularityEnum {
  century,
  year,
  month,
  day,
  hour,
  minutes
}

type DateTimeView =
  | "time"
  | "century"
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minutes";

interface DateTimePickerStore {
  century?: number;
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  selectedDate?: Date;

  // Computed values
  get currentView(): {
    view: DateTimeView;
    dates:
      | ObjectifiedDates
      | ObjectifiedYears
      | ObjectifiedMonths
      | ObjectifiedDays
      | ObjectifiedHours
      | Date[];
  };
  get granularity(): GranularityEnum;
  get canGoBack(): boolean;

  // Actions
  setDate(date: Date | undefined): void;
  clearSelection(): void;
  goBack(): void;
  selectCentury(century: number): void;
  selectYear(year: number): void;
  selectMonth(month: number): void;
  selectDay(day: number | undefined): void;
  selectHour(hour: number): void;
}

const DateTimePicker: React.FC<PropsType> = ({
  dates,
  currentDate,
  onChange,
  openDirection = "down",
  isOpen,
  onClose,
  dateFormat
}) => {
  const { t } = useTranslation();

  const store = useLocalObservable<DateTimePickerStore>(() => {
    let defaultCentury: number | undefined;
    let defaultYear: number | undefined;
    let defaultMonth: number | undefined;
    let defaultDay: number | undefined;
    let defaultGranularity: GranularityEnum = GranularityEnum.century;

    if (dates) {
      if (dates.index.length === 1) {
        // only one century
        const soleCentury = dates.index[0];
        const dataFromThisCentury = dates[soleCentury];
        defaultCentury = soleCentury;
        defaultGranularity = GranularityEnum.year;

        if (dataFromThisCentury.index.length === 1) {
          // only one year, check if this year has only one month
          const soleYear = dataFromThisCentury.index[0];
          const dataFromThisYear = dataFromThisCentury[soleYear];
          defaultYear = soleYear;
          defaultGranularity = GranularityEnum.month;

          if (dataFromThisYear.index.length === 1) {
            // only one month data from this one year, need to check day then
            const soleMonth = dataFromThisYear.index[0];
            const dataFromThisMonth = dataFromThisYear[soleMonth];
            defaultMonth = soleMonth;
            defaultGranularity = GranularityEnum.day;

            if (dataFromThisMonth.index.length === 1) {
              // only one day has data
              defaultDay = dataFromThisMonth.index[0];
              defaultGranularity = GranularityEnum.hour;
            }
          }
        }
      }
    }
    return {
      century: defaultCentury,
      year: defaultYear,
      month: defaultMonth,
      day: defaultDay,
      hour: undefined as number | undefined,
      time: undefined as Date | undefined,
      get currentView(): DateTimePickerStore["currentView"] {
        const { century, year, month, day, hour } = this;

        if (!isDefined(century)) {
          return dates.dates.length >= 12
            ? { view: "century", dates }
            : { view: "time", dates: dates.dates };
        }

        const centuryData = dates[century];
        if (!isDefined(year)) {
          return centuryData.dates.length > 12
            ? { view: "year", dates: centuryData }
            : { view: "time", dates: centuryData.dates };
        }

        const yearData = centuryData[year];
        if (!isDefined(month)) {
          return yearData.dates.length > 12
            ? { view: "month", dates: yearData }
            : { view: "time", dates: yearData.dates };
        }

        const monthData = yearData[month];
        if (!isDefined(day)) {
          return monthData.dates.length > 31
            ? { view: "day", dates: monthData }
            : { view: "time", dates: monthData.dates };
        }

        const dayData = monthData[day];
        if (!isDefined(hour)) {
          return dayData.dates.length > 24
            ? { view: "hour", dates: dayData }
            : { view: "time", dates: dayData.dates };
        }

        return {
          view: "time",
          dates: dayData[hour]
        };
      },

      get granularity() {
        if (!isDefined(this.century)) return GranularityEnum.century;
        if (!isDefined(this.year)) return GranularityEnum.year;
        if (!isDefined(this.month)) return GranularityEnum.month;
        if (!isDefined(this.day)) return GranularityEnum.day;
        if (!isDefined(this.hour)) return GranularityEnum.hour;
        return GranularityEnum.minutes;
      },

      get canGoBack() {
        return this.granularity > defaultGranularity;
      },

      goBack() {
        if (this.selectedDate) {
          if (!isDefined(this.month)) {
            this.year = undefined;
            this.day = undefined;
          }
          if (!isDefined(this.hour)) {
            this.day = undefined;
          }
          if (!isDefined(this.day)) {
            this.month = undefined;
          }
          this.hour = undefined;
          this.selectedDate = undefined;
        } else if (isDefined(this.hour)) this.hour = undefined;
        else if (isDefined(this.day)) this.day = undefined;
        else if (isDefined(this.month)) this.month = undefined;
        else if (isDefined(this.year)) this.year = undefined;
        else if (isDefined(this.century)) this.century = undefined;
        this.selectedDate = undefined;
      },

      clearSelection() {
        this.century = undefined;
        this.year = undefined;
        this.month = undefined;
        this.day = undefined;
        this.hour = undefined;
        this.selectedDate = undefined;
      },

      setDate(date: Date | undefined) {
        if (!date) {
          this.clearSelection();
          return;
        }

        this.selectedDate = date;
      },

      selectCentury(century: number) {
        this.century = century;
        this.year = undefined;
        this.month = undefined;
        this.day = undefined;
        this.hour = undefined;
        this.selectedDate = undefined;
      },

      selectYear(year: number) {
        this.year = year;
        this.month = undefined;
        this.day = undefined;
        this.hour = undefined;
        this.selectedDate = undefined;
      },

      selectMonth(month: number) {
        this.month = month;
        this.day = undefined;
        this.hour = undefined;
        this.selectedDate = undefined;
      },

      selectDay(day: number | undefined) {
        this.day = day;
        this.hour = undefined;
        this.selectedDate = undefined;
      },

      selectHour(hour: number) {
        this.hour = hour;
        this.selectedDate = undefined;
      }
    };
  });

  useEffect(() => {
    window.addEventListener("click", onClose);
    return () => {
      window.removeEventListener("click", onClose);
    };
  }, [onClose]);

  useEffect(() => {
    if (isDefined(currentDate)) {
      runInAction(() => {
        store.day = isDefined(store.day) ? currentDate.getDate() : undefined;
        store.month = isDefined(store.month)
          ? currentDate.getMonth()
          : undefined;
        store.year = isDefined(store.year)
          ? currentDate.getFullYear()
          : undefined;
        store.century = isDefined(store.century)
          ? Math.floor(currentDate.getFullYear() / 100)
          : undefined;
        store.selectedDate = currentDate;
      });
    }
  }, [currentDate, store]);

  if (!dates || !isOpen) return null;

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

          ${openDirection === "down"
            ? `
          top: 40px;
          left: -190px;
        `
            : ""}
        `}
        className={"scrollbars"}
      >
        <div
          css={`
            padding-bottom: 5px;
            padding-right: 5px;
          `}
        >
          <BackButton
            title={t("dateTime.back")}
            disabled={!store.canGoBack}
            type="button"
            onClick={store.goBack}
          >
            <Icon glyph={Icon.GLYPHS.left} />
          </BackButton>
        </div>

        {(store.currentView.view === "time" ||
          store.currentView.view === "minutes") && (
          <TimeListView
            items={store.currentView.dates as Date[]}
            dateFormatString={dateFormat}
            onTimeSelected={(time) => {
              store.setDate(time);
              onChange(time);
              onClose();
            }}
          />
        )}
        {store.currentView.view === "century" && (
          <CenturyView
            datesObject={store.currentView.dates as ObjectifiedDates}
            onSelectCentury={store.selectCentury}
          />
        )}
        {store.currentView.view === "year" && (
          <YearView
            datesObject={store.currentView.dates as ObjectifiedYears}
            onSelectYear={store.selectYear}
          />
        )}
        {store.currentView.view === "month" && (
          <MonthView
            year={store.year!}
            datesObject={store.currentView.dates as ObjectifiedMonths}
            onSelectMonth={store.selectMonth}
            onBack={store.goBack}
          />
        )}
        {store.currentView.view === "day" && (
          <DayView
            year={store.year!}
            month={store.month!}
            datesObject={store.currentView.dates as ObjectifiedDays}
            selectedDay={store.day}
            onSelectDay={(date) => store.selectDay(date?.getDate())}
            onBackToYear={() => {
              store.selectYear(store.year!);
            }}
            onBackToMonth={() => {
              store.selectMonth(store.month!);
            }}
          />
        )}
        {store.currentView.view === "hour" && (
          <HourView
            year={store.year!}
            month={store.month!}
            day={store.day!}
            datesObject={store.currentView.dates as ObjectifiedHours}
            onSelectHour={store.selectHour}
          />
        )}
      </div>
    </div>
  );
};

export default observer(DateTimePicker);
