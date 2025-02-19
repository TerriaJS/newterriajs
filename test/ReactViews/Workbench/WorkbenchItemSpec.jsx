import WorkbenchItem, {
  WorkbenchItemRaw
} from "../../../lib/ReactViews/Workbench/WorkbenchItem";
import { getShallowRenderedOutput } from "../MoreShallowTools";
import React from "react";
import { sortable } from "react-anything-sortable";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import CatalogItem from "../../../lib/Models/CatalogItem";

describe("WorkbenchItem", function () {
  let terria, viewState, item;

  beforeEach(function () {
    terria = new Terria({ baseUrl: "./" });
    viewState = new ViewState({ terria, catalogSearchProvider: undefined });
    item = new CatalogItem(terria);
  });

  it("should be wrapped with the sortable HOC as the first HOC", function () {
    expect(Object.keys(sortable(WorkbenchItemRaw).propTypes)).toEqual(
      Object.keys(WorkbenchItem.propTypes)
    );

    const workbench = <WorkbenchItem />;
    const result = getShallowRenderedOutput(workbench);

    expect(result.props.onSortableItemMount).toBeDefined();

    expect(result.props.i18n).toBeUndefined();
    expect(result.props.t).toBeUndefined();
  });

  it("should render WorkbenchItemRaw with a given classname", function () {
    const workbench = (
      <WorkbenchItemRaw
        terria={terria}
        viewState={viewState}
        item={item}
        onTouchStart={() => {}}
        onMouseDown={() => {}}
        t={() => {}}
        className="pheature"
      />
    );
    const result = getShallowRenderedOutput(workbench);
    expect(result.props.className).toContain("pheature");
  });
});
