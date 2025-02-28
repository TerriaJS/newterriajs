import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { runInAction } from "mobx";
import Prompt from "../../../lib/ReactViews/Generic/Prompt";
import Caret from "../../../lib/ReactViews/Generic/Caret";

describe("HelpPrompt", function () {
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

  describe("with basic props, when welcome message is enabled on startup", function () {
    it("does not render when welcome message is visible", function () {
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
            displayDelay={0}
            dismissText={""}
            dismissAction={() => {}}
            content={<>foo</>}
          />
        );
      });
      const promptCaret = testRenderer.root.findAllByType(Caret);
      expect(promptCaret.length).toBeFalsy();
    });

    it("renders when welcome message is not visible", function () {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = true;
        viewState.showWelcomeMessage = false;
      });
      act(() => {
        testRenderer = create(
          <Prompt
            isVisible={
              (terria.configParameters.showWelcomeMessage ?? false) &&
              !viewState.showWelcomeMessage
            }
            displayDelay={0}
            dismissText={""}
            dismissAction={() => {}}
            content={<>foo</>}
          />
        );
      });
      const promptCaret = testRenderer.root.findAllByType(Caret);
      expect(promptCaret.length).toBeTruthy();
    });
  });

  describe("when welcome message is disabled on startup", function () {
    it("does not render", function () {
      runInAction(() => {
        terria.configParameters.showWelcomeMessage = false;
      });
      act(() => {
        testRenderer = create(
          <Prompt
            isVisible={
              (terria.configParameters.showWelcomeMessage ?? false) &&
              !viewState.showWelcomeMessage
            }
            displayDelay={0}
            dismissText={""}
            dismissAction={() => {}}
            content={<>foo</>}
          />
        );
      });
      const promptCaret = testRenderer.root.findAllByType(Caret);
      expect(promptCaret.length).toBeFalsy();
    });
  });
});
