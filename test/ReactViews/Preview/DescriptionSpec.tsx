import { runInAction } from "mobx";
import { act } from "react-dom/test-utils";
import { create, ReactTestRenderer } from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import Terria from "../../../lib/Models/Terria";
import updateModelFromJson from "../../../lib/Models/Definition/updateModelFromJson";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Description from "../../../lib/ReactViews/Preview/Description";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface/StandardTheme";

describe("DescriptionSpec", function() {
  let testRenderer: ReactTestRenderer;
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    wmsItem = new WebMapServiceCatalogItem("test", terria);

    runInAction(() => {
      wmsItem.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    });
    await wmsItem.loadMetadata();
  });

  it("renders metadataUrls", function() {
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <Description item={wmsItem} />
        </ThemeProvider>
      );
    });

    const metadataUrls = testRenderer.root.findAll(
      node =>
        node.props.className?.includes("description-metadataUrls") &&
        node.type === "a"
    );

    expect(metadataUrls.length).toEqual(1);

    expect(metadataUrls[0].children[0]).toBe("http://examplemetadata.com");
  });

  it("renders metadataUrl button", function() {
    runInAction(() => {
      updateModelFromJson(wmsItem, "definition", {
        metadataUrls: [{ title: "Some Title" }]
      });
    });

    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <Description item={wmsItem} />
        </ThemeProvider>
      );
    });

    const metadataUrls = testRenderer.root.findAll(
      node =>
        node.props.className?.includes("description-metadataUrls") &&
        node.type === "a"
    );

    expect(metadataUrls.length).toEqual(1);
    expect(typeof metadataUrls[0].children[0] !== "string").toBeTruthy();

    const child: any = metadataUrls[0].children[0];

    expect(child.props.children).toBe("Some Title");
  });
});
