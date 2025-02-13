import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import PointOnMap from "../../../../lib/ReactViews/Custom/Chart/PointOnMap";

describe("PointOnMap", function () {
  let terria: Terria;
  let testRenderer: ReactTestRenderer;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  it("adds the point as an overlay on mount", async function () {
    act(() => {
      testRenderer = TestRenderer.create(
        <PointOnMap
          terria={terria}
          color="red"
          point={{ latitude: -37.814, longitude: 144.96332 }}
        />
      );
    });
    const pointItem: GeoJsonCatalogItem = terria.overlays
      .items[0] as GeoJsonCatalogItem;
    expect(pointItem).toBeDefined();
    expect(pointItem instanceof GeoJsonCatalogItem).toBe(true);
    if (pointItem) {
      await pointItem.loadMapItems();
      expect(pointItem.style["marker-color"]).toBe("red");
      const geometry: any = pointItem.geoJsonData?.geometry;
      expect(geometry.type).toBe("Point");
      expect(geometry.coordinates).toEqual([144.96332, -37.814]);
    }
  });

  it("it removes the point from overlay on umount", function () {
    act(() => {
      testRenderer = TestRenderer.create(
        <PointOnMap
          terria={terria}
          color="red"
          point={{ latitude: -37.814, longitude: 144.96332 }}
        />
      );
    });
    expect(terria.overlays.items.length).toBe(1);
    testRenderer.unmount();
    expect(terria.overlays.items.length).toBe(0);
  });
});
