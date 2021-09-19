import { act } from "react-dom/test-utils";
import TestRenderer from "react-test-renderer";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Tool from "../../lib/ReactViews/Tools/Tool";

const TestComponent = () => <div>Test hello</div>;

describe("Tool", function() {
  let viewState: ViewState;

  beforeEach(function() {
    const terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });

  // The following specs are excluded as they will break in react version
  // 16.3.2, we can enable them after migrating to a newer version.
  xit("renders the item returned by getToolComponent", async function() {
    let rendered: any;
    await act(async () => {
      rendered = TestRenderer.create(
        <Tool
          toolName="test-tool"
          viewState={viewState}
          getToolComponent={() => TestComponent as any}
        />
      );
    });
    const testComponent = rendered.root.findByType(TestComponent);
    expect(testComponent).toBeDefined();
  });

  xit("renders the promised item returned by getToolComponent", async function() {
    let rendered: any;
    await act(async () => {
      rendered = TestRenderer.create(
        <Tool
          toolName="test-tool"
          viewState={viewState}
          getToolComponent={() => Promise.resolve(TestComponent as any)}
        />
      );
    });
    const testComponent = rendered.root.findByType(TestComponent);
    expect(testComponent).toBeDefined();
  });
});
