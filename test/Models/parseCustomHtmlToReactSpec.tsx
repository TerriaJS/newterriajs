"use strict";

// import Chart from "../../lib/ReactViews/Custom/Chart";
import { render, screen } from "@testing-library/react";
import parseCustomHtmlToReact from "../../lib/ReactViews/Custom/parseCustomHtmlToReact";
import registerCustomComponentTypes from "../../lib/ReactViews/Custom/registerCustomComponentTypes";
import Collapsible from "../../lib/ReactViews/Custom/Collapsible/Collapsible";

describe("parseCustomHtmlToReact and registerCustomComponentTypes", function () {
  beforeEach(function () {
    registerCustomComponentTypes();
  });

  it("parses a div", function () {
    const result = parseCustomHtmlToReact("<div>Foo</div>");
    expect(result.type).toEqual("div");

    render(result);
    expect(screen.getByText("Foo")).toBeVisible();
  });

  it("parses a collapsible", function () {
    const result = parseCustomHtmlToReact(
      '<collapsible title="Untitled">Bar</collapsible>',
      {},
      false,
      {
        ADD_TAGS: ["collapsible"]
      }
    );

    expect(result.props.title).toEqual("Untitled");
    expect(result.type).toEqual(Collapsible);
    expect(result.props.children[0]).toEqual("Bar");
  });

  it("decodes HTML entities in text nodes and in attributes", function () {
    const result = parseCustomHtmlToReact(
      '<a href="https://programs.communications.gov.au/geoserver/ows?service=WMS&amp;version=1.3.0&amp;request=GetCapabilities">https://programs.communications.gov.au/geoserver/ows?service=WMS&amp;version=1.3.0&amp;request=GetCapabilities</a>'
    );

    render(result);
    const link = screen.getByRole("link", {
      name: "https://programs.communications.gov.au/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities"
    });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute(
      "href",
      "https://programs.communications.gov.au/geoserver/ows?service=WMS&version=1.3.0&request=GetCapabilities"
    );
  });
});

describe("Parse html to react", () => {
  it("should open link in new tab", function () {
    const html = '<a href="https://www.csiro.au/">csiro</a>';
    const reactComponent = parseCustomHtmlToReact(html);
    render(reactComponent);
    expect(screen.getByRole("link", { name: "csiro" })).toBeVisible();

    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "rel",
      "noreferrer noopener"
    );
    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "href",
      "https://www.csiro.au/"
    );
    expect(
      screen.getByRole("link", { name: "csiro" }).getElementsByClassName("icon")
        .length
    ).toBe(1);
  });

  it("should correctly parse style attributes on a tag", function () {
    const html =
      '<a href="https://www.csiro.au/" style="color:yellow" >csiro</a>';
    const reactComponent = parseCustomHtmlToReact(html);
    render(reactComponent);

    expect(screen.getByRole("link", { name: "csiro" })).toBeVisible();
    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "style",
      "color: yellow;"
    );
    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "rel",
      "noreferrer noopener"
    );
    expect(
      screen.getByRole("link", { name: "csiro" }).getElementsByClassName("icon")
        .length
    ).toBe(1);
  });

  it("should correctly parse empty style attributes on a tag", function () {
    const html = '<a href="https://www.csiro.au/" style="" >csiro</a>';
    const reactComponent = parseCustomHtmlToReact(html);
    render(reactComponent);

    expect(screen.getByRole("link", { name: "csiro" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "csiro" }).getAttribute("style")
    ).toBeNull();
    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(screen.getByRole("link", { name: "csiro" })).toHaveAttribute(
      "rel",
      "noreferrer noopener"
    );
  });
});
