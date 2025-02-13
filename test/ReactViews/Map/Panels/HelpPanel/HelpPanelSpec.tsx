import { runInAction } from "mobx";
import { act } from "react-dom/test-utils";
import Terria from "../../../../../lib/Models/Terria";
import ViewState from "../../../../../lib/ReactViewModels/ViewState";
import HelpPanelItem from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpPanelItem";
import HelpVideoPanel from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpVideoPanel";
import StyledHtml from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/StyledHtml";
import Text from "../../../../../lib/Styled/Text";
import { createWithContexts } from "../../../withContext";
import HelpPanel from "../../../../../lib/ReactViews/Map/Panels/HelpPanel/HelpPanel";

describe("HelpPanel", function () {
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

  describe("with no help content in config", function () {
    it("does not render any items in help", function () {
      act(() => {
        testRenderer = createWithContexts(viewState, <HelpPanel />);
      });

      const helpItems = testRenderer.root.findAllByType(HelpPanelItem);
      expect(helpItems.length).toBeFalsy();
    });
  });

  describe("with no text, videos and images in helpContent", function () {
    beforeEach(() => {
      runInAction(() => {
        terria.configParameters.helpContent = [
          {
            itemName: "test"
          }
        ];
      });
      act(() => {
        testRenderer = createWithContexts(viewState, <HelpPanel />);
      });
    });

    it("renders 1 help menu item", function () {
      const helpItems = testRenderer.root.findAllByType(HelpPanelItem);
      expect(helpItems.length).toBe(1);
    });

    it("does not render any text on the help menu buttons", function () {
      const helpItem = testRenderer.root.findByType(HelpPanelItem);
      expect(() => {
        helpItem.findByType(Text);
      }).toThrow();
    });

    it("does not render any text in video panel", function () {
      const videoPanel = testRenderer.root.findByType(HelpVideoPanel);
      expect(videoPanel.props.htmlContent).toBeFalsy();
      expect(() => {
        videoPanel.findByType(StyledHtml);
      }).toThrow();
    });

    it("does not render any images in video panel", function () {
      const videoPanel = testRenderer.root.findByType(HelpVideoPanel);
      expect(() => {
        videoPanel.findByProps({ className: "tjs-help-panel__videoLink" });
      }).toThrow();
    });
  });

  describe("when help item with text, video and image in helpContent is selected", function () {
    beforeEach(() => {
      runInAction(() => {
        terria.configParameters.helpContent = [
          {
            itemName: "test",
            markdownText:
              "# Test\n\nHello, this is just a test\n\nThis is another paragraph",
            videoUrl: "https://www.youtube-nocookie.com/embed/NTtSM70rIvI",
            placeholderImage:
              "https://img.youtube.com/vi/NTtSM70rIvI/maxresdefault.jpg"
          }
        ];
        viewState.selectedHelpMenuItem = "test";
      });
      act(() => {
        testRenderer = createWithContexts(viewState, <HelpPanel />);
      });
    });

    it("renders 3 styled html components", function () {
      const styledHtml = testRenderer.root.findByType(StyledHtml);
      expect(styledHtml).toBeDefined();
      expect(styledHtml.findAllByType(Text).length).toBe(3);
    });

    it("renders the video component", function () {
      const videoComponent = testRenderer.root.findByProps({
        className: "tjs-help-panel__videoLink"
      });
      expect(videoComponent).toBeDefined();
    });
  });
});
