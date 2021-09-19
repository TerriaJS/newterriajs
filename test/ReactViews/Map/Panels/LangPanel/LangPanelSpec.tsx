import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";

import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";

import LangPanel from "../../../../../lib/ReactViews/Map/Panels/LangPanel/LangPanel";

describe("LangPanel", function() {
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

  it("should not render if there is no langauge config", function() {
    act(() => {
      testRenderer = create(<LangPanel terria={terria} smallScreen={false} />);
    });

    expect(testRenderer.toJSON()).toBeNull();
  });

  it("should render if language are provided in config", function() {
    terria.updateParameters({
      languageConfiguration: {
        enabled: true,
        debug: false,
        languages: {
          en: "English",
          fr: "Français",
          af: "Afrikaans"
        },
        fallbackLanguage: "en"
      }
    });
    act(() => {
      testRenderer = create(<LangPanel terria={terria} smallScreen={false} />);
    });

    expect(testRenderer.toJSON()).toBeDefined();
  });
});
