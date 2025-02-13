import { act } from "react-dom/test-utils";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Tool from "../../lib/ReactViews/Tools/Tool";
import { createWithContexts } from "./withContext";

const TestComponent = () => <div>Test hello</div>;

describe("Tool", function () {
  let viewState: ViewState;

  beforeEach(function () {
    const terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  // The following specs are excluded as they will break in react version
  // 16.3.2, we can enable them after migrating to a newer version.
  xit("renders the item returned by getToolComponent", function () {
    let rendered: any;
    act(() => {
      rendered = createWithContexts(
        viewState,
        <Tool
          toolName="test-tool"
          getToolComponent={() => TestComponent as any}
        />
      );
    });
    const testComponent = rendered.root.findByType(TestComponent);
    expect(testComponent).toBeDefined();
  });

  xit("renders the promised item returned by getToolComponent", function () {
    let rendered: any;
    act(() => {
      rendered = createWithContexts(
        viewState,
        <Tool
          toolName="test-tool"
          getToolComponent={() => Promise.resolve(TestComponent as any)}
        />
      );
    });
    const testComponent = rendered.root.findByType(TestComponent);
    expect(testComponent).toBeDefined();
  });
});
