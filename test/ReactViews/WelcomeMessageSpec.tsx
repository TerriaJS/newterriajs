import { runInAction } from "mobx";
import { act } from "react-dom/test-utils";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import { WelcomeMessagePure } from "../../lib/ReactViews/WelcomeMessage/WelcomeMessage";
import { createWithContexts } from "./withContext";
import WelcomeMessage from "../../lib/ReactViews/WelcomeMessage/WelcomeMessage";

describe("WelcomeMessage", function () {
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

  it("renders when showWelcomeMessage is set to true in config file", function () {
    runInAction(() => (terria.configParameters.showWelcomeMessage = true));
    act(() => {
      testRenderer = createWithContexts(viewState, <WelcomeMessage />);
    });
    const welcomeMessagePure = testRenderer.root.findByType(WelcomeMessagePure);
    expect(welcomeMessagePure.props.showWelcomeMessage).toEqual(true);
  });

  it("doesn't render when showWelcomeMessage is set to true in config file", function () {
    runInAction(() => (terria.configParameters.showWelcomeMessage = false));
    act(() => {
      testRenderer = createWithContexts(viewState, <WelcomeMessage />);
    });
    const welcomeMessagePure = testRenderer.root.findByType(WelcomeMessagePure);
    expect(welcomeMessagePure.props.showWelcomeMessage).toEqual(false);
  });
});
