// CompassSpec.tsx
import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface";
import Compass from "../../../../../lib/ReactViews/Map/MapNavigation/Items/Compass/Compass";
import { StyledIcon } from "../../../../../lib/Styled/Icon";

describe("Compass", function () {
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
    it("renders", function () {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <Compass
              theme={terriaTheme}
              viewState={viewState}
              terria={terria}
            />
          </ThemeProvider>
        );
      });

      const icons = testRenderer.root.findAllByType(StyledIcon);
      expect(icons.length).toBeTruthy();
    });
  });
});
