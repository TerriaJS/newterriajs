import Story, { StoryRaw } from "../../../lib/ReactViews/Story/Story";
import { getShallowRenderedOutput } from "../MoreShallowTools";
import { sortable } from "react-anything-sortable";

describe("Story", function () {
  it("should be wrapped with the sortable HOC as the first HOC", function () {
    expect(Object.keys(sortable(StoryRaw).propTypes)).toEqual(
      Object.keys(Story.propTypes)
    );

    const story = <Story />;
    const result = getShallowRenderedOutput(story);

    expect(result.props.onSortableItemMount).toBeDefined();

    expect(result.props.i18n).toBeUndefined();
    expect(result.props.t).toBeUndefined();
  });
});
