import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DateTimePicker from "../../../lib/ReactViews/BottomDock/Timeline/DateTimePicker";
import { objectifyDates } from "../../../lib/ModelMixins/DiscretelyTimeVaryingMixin";

describe("DateTimePicker1", () => {
  describe("centuries", () => {
    it("render centuries grid with 12 or more centuries", () => {
      const dates = new Array(12)
        .fill(0)
        .map((_, i) => new Date(2000 + i * 100, 0, 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("2000")).toBeVisible();
      expect(screen.getByText("2100")).toBeVisible();
    });

    it("render time list view with less than 12 centuries", () => {
      const dates = new Array(11)
        .fill(0)
        .map((_, i) => new Date(2000 + i * 100, 0, 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("01/01/2000, 00:00:00")).toBeVisible();
      expect(screen.getByText("01/01/2100, 00:00:00")).toBeVisible();
    });
  });

  describe("years view", () => {
    it("should render grid view with more than 12 years and only one century", () => {
      const dates = new Array(13)
        .fill(0)
        .map((_, i) => new Date(2000 + i, 0, 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("2000")).toBeVisible();
      expect(screen.getByText("2011")).toBeVisible();
    });

    it("should render time list view with less than 12 years and only one century", () => {
      const dates = new Array(11)
        .fill(0)
        .map((_, i) => new Date(2000 + i, 0, 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("01/01/2000, 00:00:00")).toBeVisible();
      expect(screen.getByText("01/01/2010, 00:00:00")).toBeVisible();
    });
  });

  describe("months view", () => {
    it("should render grid view with more than 12 dates in only one year", () => {
      const dates = new Array(13).fill(0).map((_, i) => new Date(2000, 1, i));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("Jan")).toBeVisible();
      expect(screen.getByText("Feb")).toBeVisible();
    });

    it("should render time list view with 12 dates or less in only one year", () => {
      const dates = new Array(12).fill(0).map((_, i) => new Date(2000, 1, i));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("31/01/2000, 00:00:00")).toBeVisible();
      expect(screen.getByText("04/02/2000, 00:00:00")).toBeVisible();
    });
  });

  describe("days view", () => {
    it("should render date picker with more than 31 dates for a single month", () => {
      const dates = new Array(32)
        .fill(0)
        .map((_, i) => new Date(2000, 1, 1, i + 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(
        screen.getByLabelText("Choose Tuesday, February 1st, 2000")
      ).toBeVisible();
      expect(
        screen.getByLabelText("Not available Friday, February 4th, 2000")
      ).toBeVisible();
      expect(screen.getByText("Feb")).toBeVisible();
    });

    it("should render time list view with less than 31 dates for a single month", () => {
      const dates = new Array(25)
        .fill(0)
        .map((_, i) => new Date(2000, 1, i + 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("01/02/2000, 00:00:00")).toBeVisible();
      expect(screen.getByText("04/02/2000, 00:00:00")).toBeVisible();
    });
  });

  describe("hours view", () => {
    it("should render hours grid with more 24 times for a single day", () => {
      const dates = new Array(25)
        .fill(0)
        .map((_, i) => new Date(2000, 1, 1, 1, i + 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("1 : 00 - 2 : 00")).toBeVisible();
      expect(screen.getByText("(25 options)")).toBeVisible();
    });

    it("should render time list view with less than 24 times for a single day", () => {
      const dates = new Array(23)
        .fill(0)
        .map((_, i) => new Date(2000, 1, 1, 1, i * 2));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("01/02/2000, 01:02:00")).toBeVisible();
      expect(screen.getByText("01/02/2000, 01:44:00")).toBeVisible();
    });
  });

  describe("current date", () => {
    it("should show the least granularity view when current date is provided", async () => {
      const dates = new Array(35)
        .fill(0)
        .map((_, i) => new Date(2000, 1, 1, 1, i + 1, 0));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
          currentDate={new Date(2000, 1, 1, 1, 1, 0)}
        />
      );

      expect(screen.getByText("1 : 00 - 2 : 00")).toBeVisible();
    });

    it("should show the least granularity view when current date is provided 2", async () => {
      const dates = new Array(20)
        .fill(0)
        .map((_, i) => new Date(2000, 1, 1, i + 1, 0, 0));
      const dates2 = new Array(20)
        .fill(0)
        .map((_, i) => new Date(2000, 1, 2, i + 1, 0, 0));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates([...dates, ...dates2])}
          onChange={onChange}
          isOpen
          onClose={onClose}
          currentDate={new Date(2000, 1, 1, 1, 1, 0)}
        />
      );

      expect(
        screen.getByLabelText("Choose Tuesday, February 1st, 2000")
      ).toBeVisible();
    });
  });

  describe("selection and close", () => {
    it("should call onChange with the selected date", async () => {
      const dates = new Array(25)
        .fill(0)
        .map((_, i) => new Date(2000, 1, i + 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );
      await userEvent.click(screen.getByText("04/02/2000, 00:00:00"));
      expect(onChange).toHaveBeenCalledWith(dates[3]);
    });

    it("should propagate selection from century to minute", async () => {
      const centuries = new Array(2)
        .fill(0)
        .map((_, i) => new Date(2000 + i * 100, 0, 1));
      const years = new Array(13)
        .fill(0)
        .map((_, i) => new Date(2000 + i, 0, 1));
      const days = new Array(30)
        .fill(0)
        .map((_, i) => new Date(2001, 0, i + 1));
      const hours = new Array(24)
        .fill(0)
        .map((_, i) => new Date(2001, 0, 1, i));
      const minutes = new Array(60)
        .fill(0)
        .map((_, i) => new Date(2001, 0, 1, 0, i));

      const dates = [...centuries, ...years, ...days, ...hours, ...minutes];

      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      await userEvent.click(screen.getByText("2000"));

      await userEvent.click(screen.getByText("2001"));

      await userEvent.click(screen.getByText("Jan"));

      await userEvent.click(
        screen.getByLabelText("Choose Monday, January 1st, 2001")
      );

      await userEvent.click(screen.getByText("0 : 00 - 1 : 00"));

      await userEvent.click(screen.getByText("01/01/2001, 00:01:00"));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(new Date(2001, 0, 1, 0, 1, 0));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("go back", () => {
    it("should go back to previous view when back button is clicked", async () => {
      const centuries = new Array(2)
        .fill(0)
        .map((_, i) => new Date(2000 + i * 100, 0, 1));
      const years = new Array(13)
        .fill(0)
        .map((_, i) => new Date(2000 + i, 0, 1));
      const days = new Array(30)
        .fill(0)
        .map((_, i) => new Date(2001, 0, i + 1));
      const hours = new Array(24)
        .fill(0)
        .map((_, i) => new Date(2001, 0, 1, i));
      const minutes = new Array(60)
        .fill(0)
        .map((_, i) => new Date(2001, 0, 1, 0, i));

      const dates = [...centuries, ...years, ...days, ...hours, ...minutes];

      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      await userEvent.click(screen.getByText("2000"));

      await userEvent.click(screen.getByText("2001"));

      await userEvent.click(screen.getByText("Jan"));

      await userEvent.click(
        screen.getByLabelText("Choose Monday, January 1st, 2001")
      );

      await userEvent.click(screen.getByText("0 : 00 - 1 : 00"));

      await userEvent.click(
        screen.getByRole("button", { name: "dateTime.back" })
      );

      expect(screen.getByText("Select an hour on 1 Feb 2001")).toBeVisible();
      expect(screen.getByText("0 : 00 - 1 : 00")).toBeVisible();

      await userEvent.click(
        screen.getByRole("button", { name: "dateTime.back" })
      );

      expect(
        screen.getByLabelText("Choose Monday, January 1st, 2001")
      ).toBeVisible();

      await userEvent.click(
        screen.getByRole("button", { name: "dateTime.back" })
      );

      expect(screen.getByText("Jan")).toBeVisible();

      await userEvent.click(
        screen.getByRole("button", { name: "dateTime.back" })
      );

      expect(screen.getByText("Select a year")).toBeVisible();
      expect(screen.getByText("2001")).toBeVisible();

      await userEvent.click(
        screen.getByRole("button", { name: "dateTime.back" })
      );

      expect(screen.getByText("Select a century")).toBeVisible();
      expect(screen.getByText("2000")).toBeVisible();

      expect(
        screen.getByRole("button", { name: "dateTime.back" })
      ).toBeDisabled();
    });

    it("should not go back to month view when there is no multiple months data", async () => {
      const dates = new Array(25)
        .fill(0)
        .map((_, i) => new Date(2000, 1, i + 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(
        screen.getByRole("button", { name: "dateTime.back" })
      ).toBeDisabled();
    });

    it("should not go back to centuries data when there is no multiple centuries", () => {
      const dates = new Array(25)
        .fill(0)
        .map((_, i) => new Date(2000 + i, 1, 1));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(
        screen.getByRole("button", { name: "dateTime.back" })
      ).toBeDisabled();
    });

    it("should not go back to year view data when there is no multiple years data", () => {
      const dates = new Array(25)
        .fill(0)
        .map((_, i) => new Date(2000, 1, i - 5));
      const onChange = jasmine.createSpy("onChange");
      const onClose = jasmine.createSpy("onClose");

      render(
        <DateTimePicker
          dates={objectifyDates(dates)}
          onChange={onChange}
          isOpen
          onClose={onClose}
        />
      );

      expect(screen.getByText("Jan")).toBeVisible();
      expect(
        screen.getByRole("button", { name: "dateTime.back" })
      ).toBeDisabled();
    });
  });
});
