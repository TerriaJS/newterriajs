"use strict";

import { findAllWithType } from "react-shallow-testutils";
import Chart from "../../lib/ReactViews/Custom/Chart/Chart";
import parseCustomHtmlToReact from "../../lib/ReactViews/Custom/parseCustomHtmlToReact";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";

describe("parseCustomHtmlToReact and registerCustomComponentTypes", function () {
  beforeEach(function () {
    registerCustomComponentTypes();
  });

  it("parses a chart with a src attribute", function () {
    const result = parseCustomHtmlToReact(
      '<chart src="http://example.com"></chart>'
    );
    const charts = findAllWithType(result, Chart);
    expect(charts.length).toEqual(1);
    const chart = charts[0];
    expect(chart.props.url).toEqual("http://example.com");
  });

  it("parses a chart with a data attribute containing csv", function () {
    // Both line feeds (\n) and backslash-n ("\n" or \\n here) work.
    const result = parseCustomHtmlToReact(
      '<chart data="x,y\n1,2\\n3,4\n5,6"></chart>'
    );
    const charts = findAllWithType(result, Chart);
    expect(charts.length).toEqual(1);
    const chart = charts[0];
    expect(chart.props.tableStructure).toBeDefined();
    expect(chart.props.tableStructure.columns.length).toEqual(2);
    expect(chart.props.tableStructure.columns[1].values.length).toEqual(3);
  });

  it("parses a chart with a data attribute containing json", function () {
    // Use &quot; for quotes.
    const result = parseCustomHtmlToReact(
      '<chart data="[[&quot;x&quot;,&quot;y&quot;,&quot;z&quot;],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]"></chart>'
    );
    const charts = findAllWithType(result, Chart);
    expect(charts.length).toEqual(1);
    const chart = charts[0];
    expect(chart.props.tableStructure).toBeDefined();
    expect(chart.props.tableStructure.columns.length).toEqual(3);
    expect(chart.props.tableStructure.columns[2].values.length).toEqual(4);
  });

  it("parses a chart with child csv", function () {
    // Both line feeds (\n) and backslash-n ("\n" or \\n here) work.
    const result = parseCustomHtmlToReact("<chart>x,y\n1,2\\n3,4\n5,6</chart>");
    const charts = findAllWithType(result, Chart);
    expect(charts.length).toEqual(1);
    const chart = charts[0];
    expect(chart.props.tableStructure).toBeDefined();
    expect(chart.props.tableStructure.columns.length).toEqual(2);
    expect(chart.props.tableStructure.columns[1].values.length).toEqual(3);
  });

  it("parses a chart with child json", function () {
    // This is nicer, as you can use real quotes.
    const result = parseCustomHtmlToReact(
      '<chart>[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]</chart>'
    );
    const charts = findAllWithType(result, Chart);
    expect(charts.length).toEqual(1);
    const chart = charts[0];
    expect(chart.props.tableStructure).toBeDefined();
    expect(chart.props.tableStructure.columns.length).toEqual(3);
    expect(chart.props.tableStructure.columns[2].values.length).toEqual(4);
  });
  // TODO: add tests for badly formed data strings.
});
