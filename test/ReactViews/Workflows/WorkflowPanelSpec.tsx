import TestRenderer, { act, ReactTestRenderer } from "react-test-renderer";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import WorkflowPanel from "../../../lib/ReactViews/Workflow/WorkflowPanel";

describe("WorkflowPanel", function () {
  let terria: Terria;
  let viewState: ViewState;
  let testRenderer: ReactTestRenderer;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "./data/regionMapping.json";
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("sets isWorkflowPanelActive when opened", function () {
    expect(viewState.terria.isWorkflowPanelActive).toBe(false);
    act(() => {
      TestRenderer.create(
        <WorkflowPanel
          viewState={viewState}
          title="test"
          icon={{ id: "test-icon" }}
          closeButtonText="close"
          onClose={() => {}}
        />
      );
    });
    expect(viewState.terria.isWorkflowPanelActive).toBe(true);
  });

  it("unsets isWorkflowPanelActive sidepanel when closed", function (done) {
    act(() => {
      testRenderer = TestRenderer.create(
        <WorkflowPanel
          viewState={viewState}
          title="test"
          icon={{ id: "test-icon" }}
          closeButtonText="close"
          onClose={() => {}}
        />
      );
    });
    expect(viewState.terria.isWorkflowPanelActive).toBe(true);
    testRenderer.unmount();
    // Wait for the unmount to complete, this will be properly fixed as part of testing environment improvement
    setTimeout(() => {
      expect(viewState.terria.isWorkflowPanelActive).toBe(false);
    }, 0);
    done();
  });
});
