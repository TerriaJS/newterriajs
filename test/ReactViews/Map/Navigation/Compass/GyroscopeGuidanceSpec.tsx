import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import { GyroscopeGuidance } from "../../../../../lib/ReactViews/Map/MapNavigation/Items/Compass/GyroscopeGuidance";
import MapIconButton from "../../../../../lib/ReactViews/MapIconButton/MapIconButton";

describe("GyroscopeGuidance", function () {
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

  describe("with basic props", function () {
    it("renders with 1 button", function () {
      act(() => {
        testRenderer = create(
          <GyroscopeGuidance
            handleHelp={() => {}}
            onClose={() => {}}
            viewState={viewState}
          />
        );
      });

      const buttons = testRenderer.root.findAllByType(MapIconButton);
      expect(buttons.length).toBeTruthy();
      expect(buttons.length).toEqual(1);
    });
  });
});
