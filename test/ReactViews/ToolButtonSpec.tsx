import TestRenderer from "react-test-renderer";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Icon from "../../lib/Styled/Icon";
import MapIconButton from "../../lib/ReactViews/MapIconButton/MapIconButton";

const TestComponent = () => <div>Test hello</div>;

describe("ToolButton", function() {
  let viewState: ViewState;
  let rendered: TestRenderer.ReactTestRenderer;

  beforeEach(function() {
    const terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });
});
