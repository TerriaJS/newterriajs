import { runInAction } from "mobx";
import { act } from "react-dom/test-utils";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Box from "../../lib/Styled/Box";
import { createWithContexts } from "./withContext";
import Disclaimer from "../../lib/ReactViews/Disclaimer";

describe("Disclaimer", function () {
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

  describe("with basic disclaimerSettings and disclaimerVisible set to true", function () {
    it("renders", function () {
      runInAction(() => {
        viewState.disclaimerSettings = {
          title: "Disclaimer",
          confirmText: "Ok",
          denyText: "Cancel",
          message: "Test"
        };
        viewState.disclaimerVisible = true;
      });
      act(() => {
        testRenderer = createWithContexts(viewState, <Disclaimer />);
      });
      const disclaimerContent = testRenderer.root.findAllByType(Box);
      expect(disclaimerContent.length).toBeTruthy();
    });
  });

  describe("with limited disclaimerSettings and disclaimerVisible set to true", function () {
    it("renders", function () {
      runInAction(() => {
        viewState.disclaimerSettings = {};
        viewState.disclaimerVisible = true;
      });
      act(() => {
        testRenderer = createWithContexts(viewState, <Disclaimer />);
      });
      const disclaimerContent = testRenderer.root.findAllByType(Box);
      expect(disclaimerContent.length).toBeTruthy();
    });
  });

  describe("with disclaimerVisible set to false", function () {
    it("does not render", function () {
      runInAction(() => {
        terria.configParameters.globalDisclaimer = undefined;
        viewState.disclaimerVisible = false;
      });
      act(() => {
        testRenderer = createWithContexts(viewState, <Disclaimer />);
      });
      const disclaimerContent = testRenderer.root.findAllByType(Box);
      expect(disclaimerContent.length).toBeFalsy();
    });
  });
});
