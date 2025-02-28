import { runInAction } from "mobx";
import { act } from "react-dom/test-utils";
import { create, ReactTestRenderer } from "react-test-renderer";
import { ThemeProvider } from "styled-components";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebMapServiceCatalogItem from "../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../lib/Models/Terria";
import Description from "../../../lib/ReactViews/Preview/Description";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface";

describe("DescriptionSpec", function () {
  let testRenderer: ReactTestRenderer;
  let terria: Terria;
  let wmsItem: WebMapServiceCatalogItem;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });
    wmsItem = new WebMapServiceCatalogItem("test", terria);

    runInAction(() => {
      wmsItem.setTrait("definition", "url", "test/WMS/single_metadata_url.xml");
    });
    await wmsItem.loadMetadata();
  });

  it("renders metadataUrls", function () {
    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <Description item={wmsItem} />
        </ThemeProvider>
      );
    });

    const metadataUrls = testRenderer.root.findAll(
      (node) =>
        node.props.className?.includes("description-metadataUrls") &&
        node.type === "a"
    );

    expect(metadataUrls.length).toEqual(1);

    expect(metadataUrls[0].children[0]).toBe("http://examplemetadata.com");
  });

  it("renders metadataUrl button", function () {
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
      (node) =>
        node.props.className?.includes("description-metadataUrls") &&
        node.type === "a"
    );

    expect(metadataUrls.length).toEqual(1);
    expect(typeof metadataUrls[0].children[0] !== "string").toBeTruthy();

    const child: any = metadataUrls[0].children[0];

    expect(child.props.children).toBe("Some Title");
  });

  it("renders dataUrls", function () {
    runInAction(() => {
      updateModelFromJson(wmsItem, "definition", {
        metadataUrls: [{ title: "Some Title" }],
        dataUrls: [
          {
            url: "http://exampledata.com",
            type: "wfs-complete"
          }
        ]
      });
    });

    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <Description item={wmsItem} />
        </ThemeProvider>
      );
    });

    const dataUrls = testRenderer.root.findAll(
      (node) =>
        node.props.className?.includes("description-dataUrls") &&
        node.type === "a"
    );

    expect(dataUrls.length).toEqual(1);

    expect(dataUrls[0].children[0]).toBe("http://exampledata.com");
  });

  it("renders metadataUrl button", function () {
    runInAction(() => {
      updateModelFromJson(wmsItem, "definition", {
        metadataUrls: [{ title: "Some Title" }],
        dataUrls: [
          {
            url: "http://exampledata.com",
            type: "wfs-complete",
            title: "some link"
          }
        ]
      });
    });

    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <Description item={wmsItem} />
        </ThemeProvider>
      );
    });

    const dataUrls = testRenderer.root.findAll(
      (node) =>
        node.props.className?.includes("description-dataUrls") &&
        node.type === "a"
    );

    expect(dataUrls.length).toEqual(1);
    expect(typeof dataUrls[0].children[0] !== "string").toBeTruthy();

    const child: any = dataUrls[0].children[0];

    expect(child.props.children).toBe("some link");
  });

  it("respects hideDefaultDescription", function () {
    const geoJsonItem = new GeoJsonCatalogItem("test-geojson", terria);
    runInAction(() => {
      geoJsonItem.setTrait(CommonStrata.definition, "description", "test");
    });

    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <Description item={geoJsonItem} />
        </ThemeProvider>
      );
    });

    const showDescription = testRenderer.root.findAll(
      (node) => node.type === "p"
    );

    expect(showDescription.length).toEqual(1);
    expect(showDescription[0].children[0]).toBe("test");

    runInAction(() => {
      geoJsonItem.setTrait(CommonStrata.definition, "description", "");
    });

    const showDefaultDescription = testRenderer.root.findAll(
      (node) => node.type === "p"
    );

    expect(showDefaultDescription.length).toEqual(1);
    expect(showDefaultDescription[0].children[0]).toBe(
      "description.dataNotLocal"
    );

    runInAction(() => {
      geoJsonItem.setTrait(
        CommonStrata.definition,
        "hideDefaultDescription",
        true
      );
    });

    const showNoDescription = testRenderer.root.findAll(
      (node) => node.type === "p"
    );

    expect(showNoDescription.length).toEqual(0);
  });
});
