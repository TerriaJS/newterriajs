import { create } from "react-test-renderer";
import ViewingControls from "../../../../lib/ReactViews/Workbench/Controls/ViewingControls";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import SimpleCatalogItem from "../../../Helpers/SimpleCatalogItem";
import * as ViewingControlsMenu from "../../../../lib/ViewModels/ViewingControlsMenu";
import Icon from "../../../../lib/Styled/Icon";
import { runInAction } from "mobx";

describe("ViewingControls", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("shows viewing controls added through `viewState.globalViewingControls`", function () {
    const simpleItem = new SimpleCatalogItem("simple", terria);
    runInAction(() => {
      // Open the ViewingControls menu for this item
      viewState.workbenchItemWithOpenControls = simpleItem.uniqueId;
    });
    ViewingControlsMenu.addMenuItem(viewState, () => ({
      name: "View details",
      icon: Icon.GLYPHS.eye,
      iconTitle: "View more details",
      onClick: () => {}
    }));
    const render = create(
      <ViewingControls viewState={viewState} item={simpleItem} />
    );
    const viewMoreDetailsMenuItem = render.root.findByProps({
      title: "View more details"
    });
    expect(viewMoreDetailsMenuItem).toBeDefined();
  });
});
