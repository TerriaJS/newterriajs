const create: any = require("react-test-renderer").create;
import { runInAction } from "mobx";
import { ThemeProvider } from "styled-components";
import { act } from "react-dom/test-utils";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import TrainerBar from "../../../../lib/ReactViews/Map/TrainerBar/TrainerBar";
import { terriaTheme } from "../../../../lib/ReactViews/StandardUserInterface/StandardTheme";
import TestHelpContent from "./test-help-content";
import Box from "../../../../lib/Styled/Box";

describe("TrainerBar", function() {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  describe("with basic props", function() {
    it("mounts without problems", function() {
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <TrainerBar terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });

      const trainerBarRender = testRenderer.root;
      expect(trainerBarRender).toBeDefined();
      expect(() => {
        trainerBarRender.findByType("div");
      }).toThrow();
    });
    it("renders nothing when setTrainerBarVisible is false", function() {
      runInAction(() => {
        terria.updateParameters({
          regionMappingDefinitionsUrl: "",
          initFragmentPaths: [],
          storyEnabled: false,
          helpContent: [TestHelpContent as any]
        });
        viewState.setTrainerBarVisible(false);
      });
      expect(viewState.trainerBarVisible).toEqual(false);
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <TrainerBar terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });

      const divs = testRenderer.root.findAllByType("div");
      const buttons = testRenderer.root.findAllByType("button");
      const boxes = testRenderer.root.findAllByType(Box);

      expect(divs.length).toEqual(0);
      expect(buttons.length).toEqual(0);
      expect(boxes.length).toEqual(0);
    });
    it("renders a button to toggle visibility", function() {
      runInAction(() => {
        terria.updateParameters({
          regionMappingDefinitionsUrl: "",
          initFragmentPaths: [],
          storyEnabled: false,
          helpContent: [TestHelpContent as any]
        });
        viewState.setTrainerBarVisible(true);
      });
      act(() => {
        testRenderer = create(
          <ThemeProvider theme={terriaTheme}>
            <TrainerBar terria={terria} viewState={viewState} />
          </ThemeProvider>
        );
      });

      const divs = testRenderer.root.findAllByType("div");
      const buttons = testRenderer.root.findAllByType("button");
      const boxes = testRenderer.root.findAllByType(Box);
      expect(divs.length).toBeTruthy();
      expect(buttons.length).toBeTruthy();
      expect(boxes.length).toBeTruthy();
    });
  });
});
