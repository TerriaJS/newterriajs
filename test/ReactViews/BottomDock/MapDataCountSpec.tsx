import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { runInAction } from "mobx";
import MapDataCount from "../../../lib/ReactViews/BottomDock/MapDataCount";

describe("MapDataCount", function () {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders", function () {
    expect(viewState.useSmallScreenInterface).toEqual(false);
    act(() => {
      testRenderer = create(
        <MapDataCount terria={terria} viewState={viewState} />
      );
    });
    const divs = testRenderer.root.findByType("div");
    expect(divs).toBeDefined();
  });

  it("doesn't render anything when in mobile UI via useSmallScreenInterface", function () {
    runInAction(() => (viewState.useSmallScreenInterface = true));
    expect(viewState.useSmallScreenInterface).toEqual(true);
    act(() => {
      testRenderer = create(
        <MapDataCount terria={terria} viewState={viewState} />
      );
    });
    expect(() => testRenderer.root.findByType("div")).toThrow();
  });
});
