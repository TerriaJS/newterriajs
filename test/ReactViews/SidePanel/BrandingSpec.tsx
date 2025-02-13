import TestRenderer from "react-test-renderer";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Branding from "../../../lib/ReactViews/SidePanel/Branding";
import { createWithContexts } from "../withContext";
// import Branding from "../../../lib/ReactViews/SidePanel/Branding";

describe("Branding", function () {
  let terria: Terria;
  let viewState: ViewState;
  let rendered: TestRenderer.ReactTestRenderer;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders without issues", function () {
    terria.configParameters.brandBarElements = ["<a href='blah'>a thing</a>"];
    rendered = createWithContexts(viewState, <Branding />);
    expect(rendered.root.findByType("a")).toBeDefined();
  });
  it("renders when provided displayOne inside of index", function () {
    terria.configParameters.brandBarElements = [
      "<details><summary>a thing</summary></details>"
    ];
    terria.configParameters.displayOneBrand = 0;
    rendered = rendered = createWithContexts(viewState, <Branding />);
    expect(rendered.root.findByType("details")).toBeDefined();
    expect(() => {
      rendered.root.findByType("a");
    }).toThrow();
  });
  it("renders when provided displayOne inside of index, but targetting empty string", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<progress>progress is a html element!</progress>"
    ];
    terria.configParameters.displayOneBrand = 0;
    rendered = rendered = createWithContexts(viewState, <Branding />);
    expect(rendered.root.findByType("progress")).toBeDefined();
    expect(() => {
      rendered.root.findByType("span");
    }).toThrow();
  });
  it("renders when provided displayOne outside of index", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<meter>meter is a html element!</meter>"
    ];
    terria.configParameters.displayOneBrand = 5;
    rendered = rendered = createWithContexts(viewState, <Branding />);
    expect(rendered.root.findByType("meter")).toBeDefined();
    expect(() => {
      rendered.root.findByType("progress");
    }).toThrow();
  });
  it("renders brandBarElements when provided brandBarSmallElements", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<meter>meter is a html element!</meter>"
    ];

    terria.configParameters.brandBarSmallElements = [
      "<small>small is a html element!</small>",
      "<a>a is a html element!</a>"
    ];
    terria.configParameters.displayOneBrand = 1;
    rendered = rendered = createWithContexts(viewState, <Branding />);
    expect(rendered.root.findByType("meter")).toBeDefined();
  });

  it("renders when provided brandBarSmallElements and ignores displayOneBrand", function () {
    terria.configParameters.brandBarElements = [
      "",
      "<meter>meter is a html element!</meter>"
    ];

    terria.configParameters.brandBarSmallElements = [
      "<small>small is a html element!</small>",
      "<a>a is a html element!</a>"
    ];
    terria.configParameters.displayOneBrand = 1;
    viewState.useSmallScreenInterface = true;
    rendered = rendered = createWithContexts(viewState, <Branding />);
    expect(rendered.root.findByType("small")).toBeDefined();
    expect(rendered.root.findByType("a")).toBeDefined();
    expect(() => {
      rendered.root.findByType("meter");
    }).toThrow();
  });
});
