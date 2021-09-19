const create: any = require("react-test-renderer").create;
import { act } from "react-dom/test-utils";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { runInAction } from "mobx";
const Prompt: any = require("../../../lib/ReactViews/Generic/Prompt").default;
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface/StandardTheme";
import Caret from "../../../lib/ReactViews/Generic/Caret";

describe("HelpPrompt", function() {
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

  describe("with basic props, when welcome message is enabled on startup", function() {
    it("does not render when welcome message is visible", function() {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = true;
        viewState.showWelcomeMessage = true;
      });
      act(() => {
        testRenderer = create(
          <Prompt
            isVisible={
              terria.configParameters.showWelcomeMessage &&
              !viewState.showWelcomeMessage
            }
            theme={terriaTheme}
          />
        );
      });
      const promptCaret = testRenderer.root.findAllByType(Caret);
      expect(promptCaret.length).toBeFalsy();
    });

    it("renders when welcome message is not visible", function() {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = true;
        viewState.showWelcomeMessage = false;
      });
      act(() => {
        testRenderer = create(
          <Prompt
            isVisible={
              terria.configParameters.showWelcomeMessage &&
              !viewState.showWelcomeMessage
            }
            theme={terriaTheme}
          />
        );
      });
      const promptCaret = testRenderer.root.findAllByType(Caret);
      expect(promptCaret.length).toBeTruthy();
    });
  });

  describe("when welcome message is disabled on startup", function() {
    it("does not render", function() {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = false;
      });
      act(() => {
        testRenderer = create(
          <Prompt
            isVisible={
              terria.configParameters.showWelcomeMessage &&
              !viewState.showWelcomeMessage
            }
            theme={terriaTheme}
          />
        );
      });
      const promptCaret = testRenderer.root.findAllByType(Caret);
      expect(promptCaret.length).toBeFalsy();
    });
  });
});
