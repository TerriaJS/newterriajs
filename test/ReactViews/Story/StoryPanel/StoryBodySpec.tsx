import StoryBody from "../../../../lib/ReactViews/Story/StoryPanel/StoryBody";
import { act } from "react-dom/test-utils";
import {
  ReactTestInstance,
  ReactTestRenderer,
  create
} from "react-test-renderer";

describe("StoryBody", function () {
  let testRenderer: ReactTestRenderer;

  it("should include embedded media using iframe tag with allowed sources and without interfering others", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe src="https://www.youtube.com/embed/1234" title="Testing me" referrerpolicy="unsafe-url" width="560" height="315" allow="autoplay; fullscreen"></iframe><iframe src="https://www.youtube-nocookie.com/embed/1234" title="Testing me" referrerpolicy="unsafe-url" width="560" height="315" allow="autoplay; fullscreen"></iframe><iframe src="https://player.vimeo.com/video/1234" title="Testing me" referrerpolicy="unsafe-url" width="560" height="315" allow="autoplay; fullscreen"></iframe><svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>external-20</title><g id="external-20" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><path d="M7,2 C7.55228475,2 8,2.44771525 8,3 C8,3.55228475 7.55228475,4 7,4 L4,4 L4,16 L16,16 L16,13 C16,12.4477153 16.4477153,12 17,12 C17.5522847,12 18,12.4477153 18,13 L18,17 C18,17.5522847 17.5522847,18 17,18 L3,18 C2.44771525,18 2,17.5522847 2,17 L2,3 C2,2.44771525 2.44771525,2 3,2 L7,2 Z M17,2 C17.5522847,2 18,2.44771525 18,3 L18,8 C18,8.55228475 17.5522847,9 17,9 C16.4477153,9 16,8.55228475 16,8 L16,5.294 L10.7071068,10.5872554 C10.3165825,10.9777797 9.68341751,10.9777797 9.29289322,10.5872554 C8.90236893,10.1967311 8.90236893,9.56356617 9.29289322,9.17304188 L14.465,4 L12,4 C11.4477153,4 11,3.55228475 11,3 C11,2.44771525 11.4477153,2 12,2 L17,2 Z" id="Mask" fill="blue"></path></g></svg>'
    };

    act(() => {
      testRenderer = create(<StoryBody isCollapsed={false} story={theStory} />);
    });

    const storyBody = testRenderer.root.findAllByType(StoryBody);
    expect(storyBody.length).toBe(1);

    const theInstance = (
      (
        (storyBody[0].children[0] as ReactTestInstance)
          .children[0] as ReactTestInstance
      ).children[0] as ReactTestInstance
    ).children[0] as ReactTestInstance;

    expect(theInstance.children.length).toBe(5);

    expect(theInstance.children[0] as string).toEqual("Story with video. ");

    let theIframeInstance = theInstance.children[1] as ReactTestInstance;
    expect(theIframeInstance.type).toBe("iframe");
    expect(Object.keys(theIframeInstance.props).length).toBe(4);
    expect(theIframeInstance.props.src).toBe(
      "https://www.youtube.com/embed/1234"
    );
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");

    theIframeInstance = theInstance.children[2] as ReactTestInstance;
    expect(theIframeInstance.type).toBe("iframe");
    expect(Object.keys(theIframeInstance.props).length).toBe(4);
    expect(theIframeInstance.props.src).toBe(
      "https://www.youtube-nocookie.com/embed/1234"
    );
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");

    theIframeInstance = theInstance.children[3] as ReactTestInstance;
    expect(theIframeInstance.type).toBe("iframe");
    expect(Object.keys(theIframeInstance.props).length).toBe(4);
    expect(theIframeInstance.props.src).toBe(
      "https://player.vimeo.com/video/1234"
    );
    expect(theIframeInstance.props.width).toBe("560");
    expect(theIframeInstance.props.height).toBe("315");

    const theSvgInstance = theInstance.children[4] as ReactTestInstance;
    expect(theSvgInstance.type).toBe("svg");
    expect(Object.keys(theSvgInstance.props).length).toBe(7);

    const theSvgTitle = theSvgInstance.children[0] as ReactTestInstance;
    expect(theSvgTitle.type).toBe("title");

    const theSvgG = theSvgInstance.children[1] as ReactTestInstance;
    expect(theSvgG.type).toBe("g");

    const theSvgGPath = theSvgG.children[0] as ReactTestInstance;
    expect(theSvgGPath.type).toBe("path");
    expect(Object.keys(theSvgGPath.props).length).toBe(3);
  });

  it("should exclude embedded media using iframe tag with any forbidden sources", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe src="https://www.youtube.com/embed/1234" width="560" height="315"></iframe><iframe src="https://any.forbidden.video.source" width="560" height="315"></iframe>'
    };

    act(() => {
      testRenderer = create(<StoryBody isCollapsed={false} story={theStory} />);
    });

    const storyBody = testRenderer.root.findAllByType(StoryBody);
    expect(storyBody.length).toBe(1);

    const theInstance = (
      (
        (storyBody[0].children[0] as ReactTestInstance)
          .children[0] as ReactTestInstance
      ).children[0] as ReactTestInstance
    ).children[0] as ReactTestInstance;

    expect(theInstance.children.length).toBe(1);
    expect(theInstance.children[0] as string).toEqual("Story with video. ");
  });

  it("should not add iframe tag if there is no iframe in the story text", function () {
    const theStory = {
      id: "some id",
      title: "test",
      text: 'Story with video. <iframe2 src="https://www.youtube.com/embed/1234" width="560" height="315"></iframe2>'
    };

    act(() => {
      testRenderer = create(<StoryBody isCollapsed={false} story={theStory} />);
    });

    const storyBody = testRenderer.root.findAllByType(StoryBody);
    expect(storyBody.length === 1);

    const theInstance = (
      (
        (storyBody[0].children[0] as ReactTestInstance)
          .children[0] as ReactTestInstance
      ).children[0] as ReactTestInstance
    ).children[0] as ReactTestInstance;

    expect(theInstance.children.length === 1);
    expect(theInstance.children[0] as string).toEqual("Story with video. ");
  });
});
