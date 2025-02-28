import { create } from "react-test-renderer";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../../../lib/ReactViews/StandardUserInterface";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import VideoGuide from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/VideoGuide";
import { runInAction } from "mobx";

describe("VideoGuide", function () {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  const videoName = "testVideo";

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders when videoGuideVisible is set to its videoName", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible(videoName);
    });
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <VideoGuide
            viewState={viewState}
            videoLink={"some.url"}
            background={"some_image.png"}
            videoName={videoName}
          />
        </ThemeProvider>
      );
    });
    const videoGuideComponents = testRenderer.root.findAllByType("div");
    expect(videoGuideComponents.length).toBeTruthy();
  });

  it("does not render when videoGuideVisible is an empty string", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible("");
    });
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <VideoGuide
            viewState={viewState}
            videoLink={"some.url"}
            background={"some_image.png"}
            videoName={videoName}
          />
        </ThemeProvider>
      );
    });
    const videoGuideComponents = testRenderer.root.findAllByType("div");
    expect(videoGuideComponents.length).toBeFalsy();
  });

  it("does not render when videoGuideVisible is a different string", function () {
    runInAction(() => {
      viewState.setVideoGuideVisible("someRandomString");
    });
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <VideoGuide
            viewState={viewState}
            videoLink={"some.url"}
            background={"some_image.png"}
            videoName={videoName}
          />
        </ThemeProvider>
      );
    });
    const videoGuideComponents = testRenderer.root.findAllByType("div");
    expect(videoGuideComponents.length).toBeFalsy();
  });
});
