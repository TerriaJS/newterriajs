import i18next from "i18next";
import { configure, runInAction } from "mobx";
import { GeomType } from "protomaps-leaflet";
import Color from "terriajs-cesium/Source/Core/Color";
import Request from "terriajs-cesium/Source/Core/Request";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import ProtomapsImageryProvider from "../../../../lib/Map/ImageryProvider/ProtomapsImageryProvider";
import { ProtomapsArcGisPbfSource } from "../../../../lib/Map/Vector/Protomaps/ProtomapsArcGisPbfSource";
import { GEOJSON_SOURCE_LAYER_NAME } from "../../../../lib/Map/Vector/Protomaps/ProtomapsGeojsonSource";
import { isDataSource } from "../../../../lib/ModelMixins/MappableMixin";
import ArcGisFeatureServerCatalogItem from "../../../../lib/Models/Catalog/Esri/ArcGisFeatureServerCatalogItem";
import { convertEsriPointSizeToPixels } from "../../../../lib/Models/Catalog/Esri/esriStyleToTableStyle";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../../../lib/Models/Definition/createStratumInstance";
import Terria from "../../../../lib/Models/Terria";
import TableColumnType from "../../../../lib/Table/TableColumnType";
import TablePointStyleTraits, {
  PointSymbolTraits
} from "../../../../lib/Traits/TraitsClasses/Table/PointStyleTraits";
import TableStyleTraits from "../../../../lib/Traits/TraitsClasses/Table/StyleTraits";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = _loadWithXhr as any;

describe("ArcGisFeatureServerCatalogItem", function () {
  const featureServerUrl =
    "http://example.com/arcgis/rest/services/Water_Network/FeatureServer/2";

  const featureServerUrl2 =
    "http://example.com/arcgis/rest/services/Parks/FeatureServer/3";

  const featureServerUrlStyleLines =
    "http://example.com/arcgis/rest/services/styles/FeatureServer/0";

  const featureServerUrlTiled =
    "http://example.com/arcgis/rest/services/tiled/FeatureServer/0";

  const featureServerUrlMulti =
    "http://example.com/arcgis/rest/services/Water_Network_Multi/FeatureServer/2";

  let terria: Terria;
  let item: ArcGisFeatureServerCatalogItem;

  let xhrSpy: jasmine.Spy;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new ArcGisFeatureServerCatalogItem("test", terria);

    let multiCallCount = 0;

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    // NOTE: When writing tests for this catalog item, you will always need to specify a `maxFeatures` trait or ensure
    // that once all feature data has been requested, the mock server below returns 0 features.
    xhrSpy = spyOn(loadWithXhr, "load").and.callFake((...args: any[]) => {
      let url = args[0];
      const originalUrl = url as string;
      url = url.replace(/^.*\/FeatureServer/, "FeatureServer");
      url = url.replace(
        /FeatureServer\/[0-9]+\/query\?f=json.*$/i,
        "layer.json"
      );

      if (originalUrl.match("Water_Network/FeatureServer")) {
        url = url.replace(/FeatureServer\/2\/?\?.*/i, "2.json");
        args[0] = "test/ArcGisFeatureServer/Water_Network/" + url;
      } else if (originalUrl.match("Parks/FeatureServer")) {
        url = url.replace(/FeatureServer\/3\/?\?.*/i, "3.json");
        args[0] = "test/ArcGisFeatureServer/Parks/" + url;
      } else if (originalUrl.match("styles/FeatureServer")) {
        url = url.replace(/FeatureServer\/0\/?\?.*/i, "lines.json");
        args[0] = "test/ArcGisFeatureServer/styles/" + url;
      }
      // Tiled feature server - pick feature request
      else if (originalUrl.match("tiled/FeatureServer/0/query/query")) {
        args[0] = "test/ArcGisFeatureServer/Tiled/feature-pick.geojson";
      }
      // Tiled feature server - tile request
      else if (originalUrl.match("tiled/FeatureServer/0/query")) {
        args[0] = "test/ArcGisFeatureServer/Tiled/test-tile.pbf";
      }
      // Tiled feature server - metadata request
      else if (originalUrl.match("tiled/FeatureServer")) {
        url = url.replace(/FeatureServer\/0\/?\?.*/i, "act-veg-map.json");
        args[0] = "test/ArcGisFeatureServer/Tiled/" + url;
      } else if (originalUrl.match("Water_Network_Multi/FeatureServer")) {
        // We're getting this feature service in multiple requests, so we need to return different data on subsequent
        // calls
        console.log("multicall count", multiCallCount, originalUrl);
        if (url.includes("layer")) {
          multiCallCount++;
        }
        if (url.includes("layer") && multiCallCount > 1) {
          url = url.replace("layer.json", "layerB.json");
        }
        url = url.replace(/FeatureServer\/2\/?\?.*/i, "2.json");
        args[0] = "test/ArcGisFeatureServer/Water_Network_Multi/" + url;
      }

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function () {
    expect(item.type).toBe("esri-featureServer");
    expect(item.typeName).toBe(
      i18next.t("models.arcGisFeatureServerCatalogItem.name")
    );
  });

  it("supports show info", function () {
    expect(item.disableAboutData).toBeFalsy();
  });

  describe("after loading metadata", function () {
    beforeEach(async function () {
      runInAction(() => {
        item.setTrait("definition", "url", featureServerUrl);
      });
      await item.loadMetadata();
    });

    it("defines a rectangle", function () {
      expect(item.rectangle).toBeDefined();
      if (item.rectangle) {
        expect(item.rectangle.west).toEqual(-179.999987937519);
        expect(item.rectangle.south).toEqual(-55.90222504885724);
        expect(item.rectangle.east).toEqual(179.999987937519);
        expect(item.rectangle.north).toEqual(81.29054454173075);
      }
    });

    it("defines min/max scale denominator", function () {
      expect(item.minScaleDenominator).toEqual(0);
      expect(item.maxScaleDenominator).toEqual(0);
    });

    it("supports zooming to extent", function () {
      expect(item.disableZoomTo).toBeFalsy();
    });

    it("defines info", function () {
      const dataDescription = i18next.t(
        "models.arcGisMapServerCatalogItem.dataDescription"
      );
      const copyrightText = i18next.t(
        "models.arcGisMapServerCatalogItem.copyrightText"
      );

      expect(item.info.map(({ name }) => name)).toEqual([
        dataDescription,
        copyrightText
      ]);
      expect(item.info.map(({ content }) => content)).toEqual([
        "Water Data",
        "Water Copyright"
      ]);
    });
  });

  describe("after loading metadata - layer with min/max extent", function () {
    beforeEach(async function () {
      runInAction(() => {
        item.setTrait("definition", "url", featureServerUrl2);
      });
      await item.loadMetadata();
    });

    it("defines a rectangle", function () {
      expect(item.rectangle).toBeDefined();
      if (item.rectangle) {
        expect(item.rectangle.west).toEqual(150.01467801477867);
        expect(item.rectangle.south).toEqual(-34.33741590494015);
        expect(item.rectangle.east).toEqual(151.34389995591835);
        expect(item.rectangle.north).toEqual(-32.99606922215397);
      }
    });

    it("defines min/max scale denominator", function () {
      expect(item.minScaleDenominator).toEqual(36111);
      expect(item.maxScaleDenominator).toEqual(18489298);
    });

    it("for tiled services - limits imagery provider using MinMaxLevelMixin", async function () {
      runInAction(() => {
        item.setTrait("definition", "tileRequests", true);
      });

      expect("imageryProvider" in item.mapItems[0]).toBeTruthy();
      if ("imageryProvider" in item.mapItems[0]) {
        const imageryProvider = item.mapItems[0]
          .imageryProvider as ProtomapsImageryProvider;

        expect(
          imageryProvider.source instanceof ProtomapsArcGisPbfSource
        ).toBeTruthy();

        expect(imageryProvider.minimumLevel).toEqual(0);
        expect(imageryProvider.softMinimumLevel).toEqual(5);
        expect(imageryProvider.maximumLevel).toEqual(14);

        // Expect image to be empty
        const test = await imageryProvider.requestImage(0, 0, 0, new Request());
        expect(test.width).toEqual(1);
        expect(test.height).toEqual(1);
      }
    });
  });

  describe("loadMapItems - geojson query", function () {
    it("properly loads a single layer", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrl);
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
        item.setTrait(CommonStrata.definition, "tileRequests", false);
      });

      await item.loadMapItems();

      expect(item.mapItems.length).toEqual(1);
      const mapItem = item.mapItems[0];

      console.log(item.mapItems);
      expect(isDataSource(mapItem)).toBeTruthy();
      expect(
        isDataSource(mapItem) ? mapItem.entities.values.length : 0
      ).toEqual(13);

      // 1 call for metadata, and 1 call for features
      expect(xhrSpy).toHaveBeenCalledTimes(2);
    });

    it("properly loads a single layer with multiple requests", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrlMulti);
        item.setTrait(CommonStrata.definition, "featuresPerRequest", 10);
        item.setTrait(CommonStrata.definition, "tileRequests", false);
      });

      await item.loadMapItems();

      expect(item.mapItems.length).toEqual(1);

      const mapItem = item.mapItems[0];
      expect(isDataSource(mapItem)).toBeTruthy();
      expect(
        isDataSource(mapItem) ? mapItem.entities.values.length : 0
      ).toEqual(13);

      // 1 call for metadata, and 2 calls for features
      expect(xhrSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("loadMapItems - tiled query", function () {
    it("properly loads a layer", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
      });

      await item.loadMapItems();

      expect(item.tileRequests).toBeTruthy();
      expect(item.maxTiledFeatures).toEqual(100000);
      expect(item.featuresPerTileRequest).toEqual(4000);
      expect(item.maxRecordCountFactor).toEqual(1);
      expect(item.supportsQuantization).toEqual(true);
      expect(item.objectIdField).toEqual("OBJECTID");
      expect(item.outFields).toEqual(["OBJECTID", "class"]);

      expect(item.mapItems.length).toEqual(1);
      const mapItem = item.mapItems[0];

      expect("imageryProvider" in mapItem).toBeTruthy();
      if ("imageryProvider" in mapItem) {
        const imageryProvider =
          mapItem.imageryProvider as ProtomapsImageryProvider;

        expect(
          imageryProvider.source instanceof ProtomapsArcGisPbfSource
        ).toBeTruthy();
      }

      expect(item.dataColumnMajor).toEqual([
        ["OBJECTID"],
        ["GlobalID"],
        ["actGUID"],
        ["vegCommunity"],
        ["umcID"],
        ["tecACT"],
        ["tecEPBC"],
        ["tecID"],
        ["actConservationStatus"],
        ["nationalConservationStatus"],
        ["treesp1"],
        ["treesp2"],
        ["treesp3"],
        ["shrubsp1"],
        ["shrubsp2"],
        ["shrubsp3"],
        ["groundsp1"],
        ["groundsp2"],
        ["groundsp3"],
        ["hectares"],
        ["height_mean"],
        ["height_stdev"],
        ["canopyCover"],
        ["underCover"],
        ["structure"],
        ["formation"],
        ["class"],
        ["grassyStructure"],
        ["lastVegCommunity"],
        ["landscape"],
        ["lossReason"],
        ["lossYear"],
        ["Shape__Area"],
        ["Shape__Length"]
      ]);
      expect(item.activeTableStyle.colorColumn?.name).toEqual("class");
      expect(item.activeTableStyle.colorColumn?.type).toEqual(
        TableColumnType.text
      );
      expect(item.activeTableStyle.tableColorMap.type).toEqual("enum");
    });

    describe("ProtomapsImageryProvider - ArcGisPbfSource", function () {
      it("fetch tile - with single request", async function () {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
        });

        await item.loadMapItems();

        const mapItem = item.mapItems[0];

        expect("imageryProvider" in mapItem).toBeTruthy();
        if ("imageryProvider" in mapItem) {
          const imageryProvider =
            mapItem.imageryProvider as ProtomapsImageryProvider;

          expect(
            imageryProvider.source instanceof ProtomapsArcGisPbfSource
          ).toBeTruthy();

          const source = imageryProvider.source as ProtomapsArcGisPbfSource;

          // Fetch a tile - this tile will return a single polygon
          const tileFeatures = await source.get(
            { x: 241014, y: 157088, z: 18 },
            256
          );

          expect(xhrSpy.calls.argsFor(1)[0]).toBe(
            "http://example.com/arcgis/rest/services/tiled/FeatureServer/0/query/?quantizationParameters={%22extent%22%3A{%22xmin%22%3A16807260.418200623%2C%22ymin%22%3A-3977343.4390479317%2C%22xmax%22%3A16807451.510771338%2C%22ymax%22%3A-3977152.346477219}%2C%22spatialReference%22%3A{%22wkid%22%3A102100%2C%22latestWkid%22%3A3857}%2C%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%2C%22tolerance%22%3A0.5971642834774684}&f=pbf&resultType=tile&inSR=102100&geometry={%22xmin%22%3A16807260.418200623%2C%22ymin%22%3A-3977343.4390479317%2C%22xmax%22%3A16807451.510771338%2C%22ymax%22%3A-3977152.346477219}&geometryType=esriGeometryEnvelope&outFields=OBJECTID%2Cclass&where=1%3D1&maxRecordCountFactor=1&resultRecordCount=4000&outSR=102100&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0.5971642834774684&outSpatialReference=102100&precision=8&resultOffset=0"
          );

          const features = tileFeatures.get(GEOJSON_SOURCE_LAYER_NAME);

          expect(features?.length).toEqual(1);
          expect(features?.[0].props.OBJECTID).toEqual(1003937);
          expect(features?.[0].geomType).toEqual(GeomType.Polygon);
        }
      });

      it("fetch tile - with multiple requests", async function () {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
          // set feature per tile request to 1 - this will trigger a second request
          // Due to how XHR requests are mocked, still will load the same tile twice - so we will get 2 identical features
          item.setTrait(CommonStrata.definition, "featuresPerTileRequest", 1);
          item.setTrait(CommonStrata.definition, "maxTiledFeatures", 2);
        });

        await item.loadMapItems();

        const mapItem = item.mapItems[0];

        expect("imageryProvider" in mapItem).toBeTruthy();
        if ("imageryProvider" in mapItem) {
          const imageryProvider =
            mapItem.imageryProvider as ProtomapsImageryProvider;

          expect(
            imageryProvider.source instanceof ProtomapsArcGisPbfSource
          ).toBeTruthy();

          const source = imageryProvider.source as ProtomapsArcGisPbfSource;

          // Fetch a tile - this tile will return a single polygon
          const tileFeatures = await source.get(
            { x: 241014, y: 157088, z: 18 },
            256
          );

          expect(xhrSpy.calls.argsFor(1)[0]).toBe(
            "http://example.com/arcgis/rest/services/tiled/FeatureServer/0/query/?quantizationParameters={%22extent%22%3A{%22xmin%22%3A16807260.418200623%2C%22ymin%22%3A-3977343.4390479317%2C%22xmax%22%3A16807451.510771338%2C%22ymax%22%3A-3977152.346477219}%2C%22spatialReference%22%3A{%22wkid%22%3A102100%2C%22latestWkid%22%3A3857}%2C%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%2C%22tolerance%22%3A0.5971642834774684}&f=pbf&resultType=tile&inSR=102100&geometry={%22xmin%22%3A16807260.418200623%2C%22ymin%22%3A-3977343.4390479317%2C%22xmax%22%3A16807451.510771338%2C%22ymax%22%3A-3977152.346477219}&geometryType=esriGeometryEnvelope&outFields=OBJECTID%2Cclass&where=1%3D1&maxRecordCountFactor=1&resultRecordCount=1&outSR=102100&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0.5971642834774684&outSpatialReference=102100&precision=8&resultOffset=0"
          );

          expect(xhrSpy.calls.argsFor(2)[0]).toBe(
            "http://example.com/arcgis/rest/services/tiled/FeatureServer/0/query/?quantizationParameters={%22extent%22%3A{%22xmin%22%3A16807260.418200623%2C%22ymin%22%3A-3977343.4390479317%2C%22xmax%22%3A16807451.510771338%2C%22ymax%22%3A-3977152.346477219}%2C%22spatialReference%22%3A{%22wkid%22%3A102100%2C%22latestWkid%22%3A3857}%2C%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%2C%22tolerance%22%3A0.5971642834774684}&f=pbf&resultType=tile&inSR=102100&geometry={%22xmin%22%3A16807260.418200623%2C%22ymin%22%3A-3977343.4390479317%2C%22xmax%22%3A16807451.510771338%2C%22ymax%22%3A-3977152.346477219}&geometryType=esriGeometryEnvelope&outFields=OBJECTID%2Cclass&where=1%3D1&maxRecordCountFactor=1&resultRecordCount=1&outSR=102100&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0.5971642834774684&outSpatialReference=102100&precision=8&resultOffset=1"
          );

          const features = tileFeatures.get(GEOJSON_SOURCE_LAYER_NAME);

          expect(features?.length).toEqual(2);
          expect(features?.[0].props.OBJECTID).toEqual(1003937);
          expect(features?.[0].geomType).toEqual(GeomType.Polygon);

          expect(features?.[1].props.OBJECTID).toEqual(1003937);
          expect(features?.[1].geomType).toEqual(GeomType.Polygon);
        }
      });

      it("pick feature", async function () {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
        });

        await item.loadMapItems();

        expect(item.allowFeaturePicking).toBeTruthy();

        const mapItem = item.mapItems[0];

        expect("imageryProvider" in mapItem).toBeTruthy();
        if ("imageryProvider" in mapItem) {
          const imageryProvider =
            mapItem.imageryProvider as ProtomapsImageryProvider;

          expect(
            imageryProvider.source instanceof ProtomapsArcGisPbfSource
          ).toBeTruthy();

          const source = imageryProvider.source as ProtomapsArcGisPbfSource;

          // Fetch a tile - this tile will return a single polygon
          const pickedFeatures = await source.pickFeatures(
            0,
            0,
            18,
            2.635084429672604,
            -0.5866868013895533
          );

          expect(xhrSpy.calls.argsFor(1)[0]).toBe(
            "http://example.com/arcgis/rest/services/tiled/FeatureServer/0/query/query?f=geojson&sr=4326&geometryType=esriGeometryPoint&geometry={%22x%22%3A150.9792164808778%2C%22y%22%3A-33.61467761565137%2C%22spatialReference%22%3A{%22wkid%22%3A4326}}&outFields=*&returnGeometry=false&outSR=4326&spatialRel=esriSpatialRelIntersects&units=esriSRUnit_Meter&distance=2.3886566162109375&where=1%3D1"
          );

          expect(pickedFeatures?.length).toEqual(1);

          const feature = pickedFeatures?.[0];
          expect(feature.description?.startsWith("<table")).toBeTruthy();
          expect(feature.properties?.OBJECTID).toEqual(994364);
          expect(feature.properties.shapeuuid).toEqual(
            "0c28d4c1-5b56-3698-8a39-c7b02b238a55"
          );
        }
      });

      it("allowFeaturePicking=false", async function () {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
          item.setTrait(CommonStrata.definition, "allowFeaturePicking", false);
        });

        await item.loadMapItems();

        expect(item.allowFeaturePicking).toEqual(false);

        const mapItem = item.mapItems[0];

        expect("imageryProvider" in mapItem).toBeTruthy();
        if ("imageryProvider" in mapItem) {
          const imageryProvider =
            mapItem.imageryProvider as ProtomapsImageryProvider;

          expect(
            imageryProvider.source instanceof ProtomapsArcGisPbfSource
          ).toBeTruthy();

          const source = imageryProvider.source as ProtomapsArcGisPbfSource;

          const pickedFeatures = await source.pickFeatures(
            0,
            0,
            18,
            2.635084429672604,
            -0.5866868013895533
          );

          expect(pickedFeatures?.length).toEqual(0);
        }
      });

      it("sets parameters correctly", async function () {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
          item.setTrait(CommonStrata.definition, "supportsQuantization", false);
          item.setTrait(CommonStrata.definition, "maxRecordCountFactor", 2);
          item.setTrait(CommonStrata.definition, "outFields", ["testOutField"]);
          item.setTrait(
            CommonStrata.definition,
            "objectIdField",
            "testObjectId"
          );
        });

        await item.loadMapItems();

        const mapItem = item.mapItems[0];

        expect("imageryProvider" in mapItem).toBeTruthy();
        if ("imageryProvider" in mapItem) {
          const imageryProvider =
            mapItem.imageryProvider as ProtomapsImageryProvider;

          expect(
            imageryProvider.source instanceof ProtomapsArcGisPbfSource
          ).toBeTruthy();

          const source = imageryProvider.source as ProtomapsArcGisPbfSource;

          // Fetch a tile
          await source.get({ x: 241014, y: 157088, z: 18 }, 256);

          expect(xhrSpy.calls.argsFor(1)[0]).toBe(
            "http://example.com/arcgis/rest/services/tiled/FeatureServer/0/query/?f=pbf&resultType=tile&inSR=102100&geometry={%22xmin%22%3A16807260.418200623%2C%22ymin%22%3A-3977343.4390479317%2C%22xmax%22%3A16807451.510771338%2C%22ymax%22%3A-3977152.346477219}&geometryType=esriGeometryEnvelope&outFields=testObjectId%2CtestOutField&where=1%3D1&maxRecordCountFactor=2&resultRecordCount=4000&outSR=102100&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0.5971642834774684&outSpatialReference=102100&precision=8&resultOffset=0"
          );
        }
      });

      it("disables tiling if unsupported styles are used", async function () {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
        });

        await item.loadMapItems();

        expect(item.tileRequests).toEqual(true);

        runInAction(() => {
          item.setTrait(CommonStrata.definition, "styles", [
            createStratumInstance(TableStyleTraits, {
              point: createStratumInstance(TablePointStyleTraits, {
                null: createStratumInstance(PointSymbolTraits, {
                  marker: "custom"
                })
              })
            })
          ]);
        });

        expect(item.tileRequests).toEqual(false);
      });

      it("disables tiling if forceCesiumPrimitives is true", async function () {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "url", featureServerUrlTiled);
        });

        await item.loadMapItems();

        expect(item.tileRequests).toEqual(true);

        runInAction(() => {
          item.setTrait(CommonStrata.definition, "forceCesiumPrimitives", true);
        });

        expect(item.tileRequests).toEqual(false);
      });
    });
  });

  describe("updateEntityWithEsriStyle", function () {
    it("correctly uses symbol.outline.color to style polyline.", async function () {
      runInAction(() => {
        item.setTrait(CommonStrata.definition, "url", featureServerUrl2);
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
      });

      await item.loadMetadata();
      await item.loadMapItems();

      const outlineWidth = convertEsriPointSizeToPixels(1);
      const fillColor = Color.fromBytes(215, 203, 247, 255).toCssColorString();
      const outlineColor = Color.fromBytes(
        110,
        110,
        110,
        255
      ).toCssColorString();

      expect(item.activeTableStyle.outlineStyleMap.traitValues.null.color).toBe(
        outlineColor
      );
      expect(item.activeTableStyle.outlineStyleMap.traitValues.null.width).toBe(
        outlineWidth
      );
      expect(item.activeTableStyle.colorTraits.nullColor).toBe(fillColor);
    });
  });

  describe("esriSLS", function () {
    it("properly loads features", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          featureServerUrlStyleLines
        );
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
        item.setTrait(CommonStrata.definition, "tileRequests", false);
      });
      await item.loadMapItems();

      expect(item.mapItems.length).toEqual(1);
      const dataSource = item.mapItems[0];
      expect(
        !isDataSource(dataSource) && dataSource.imageryProvider
      ).toBeTruthy();
      expect(item.featureCounts.line).toEqual(13);
    });

    it("properly styles features", async function () {
      runInAction(() => {
        item.setTrait(
          CommonStrata.definition,
          "url",
          featureServerUrlStyleLines
        );
        item.setTrait(CommonStrata.definition, "maxFeatures", 20);
      });
      await item.loadMapItems();

      expect(item.mapItems).toBeDefined();
      expect(item.mapItems.length).toEqual(1);

      const tableStyle = item.activeTableStyle;
      expect(tableStyle.colorColumn?.name).toBe("id1");
      expect(tableStyle.colorTraits.nullColor).toBe("rgb(252,146,31)");
      expect(
        tableStyle.colorTraits.enumColors.map((col) => ({
          value: col.value,
          color: col.color
        }))
      ).toEqual([
        {
          value: "1",
          color: "rgb(237,81,81)"
        },
        {
          value: "2",
          color: "rgb(20,158,206)"
        },
        {
          value: "3",
          color: "rgb(167,198,54)"
        },
        {
          value: "4",
          color: "rgb(158,85,156)"
        },
        {
          value: "5",
          color: "rgb(252,146,31)"
        },
        {
          value: "6",
          color: "rgb(255,222,62)"
        },
        {
          value: "7",
          color: "rgb(247,137,216)"
        },
        {
          value: "8",
          color: "rgb(183,129,74)"
        },
        {
          value: "9",
          color: "rgb(60,175,153)"
        },
        {
          value: "10",
          color: "rgb(107,107,214)"
        },
        {
          value: "11",
          color: "rgb(181,71,121)"
        },
        {
          value: "12",
          color: "#ffffff"
        }
      ]);

      expect(tableStyle.pointStyleMap.column?.name).toBe("id1");

      expect(tableStyle.pointStyleMap.traitValues.null).toEqual({
        marker: "point",
        pixelOffset: [0, 0],
        width: 6,
        height: 16,
        rotation: 0,
        scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
      });

      expect(tableStyle.pointStyleMap.traitValues.enum).toEqual([
        {
          legendTitle: "1",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "1",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "2",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "2",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "3",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "3",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "4",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "4",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "5",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "5",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "6",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "6",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "7",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "7",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "8",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "8",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "9",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "9",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "10",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "10",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "11",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "11",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        },
        {
          legendTitle: "12",
          marker: "point",
          pixelOffset: [0, 0],
          width: 2,
          height: 16,
          value: "12",
          rotation: 0,
          scaleByDistance: { near: 0, nearValue: 1, far: 1, farValue: 1 }
        }
      ]);

      expect(tableStyle.outlineStyleMap.column?.name).toBe("id1");

      expect(tableStyle.outlineStyleMap.traitValues.null).toEqual({
        color: "rgb(252,146,31)",
        dash: [6, 6],
        width: 6
      });

      expect(tableStyle.outlineStyleMap.traitValues.enum).toEqual([
        {
          color: "rgb(237,81,81)",
          dash: [],
          legendTitle: "1",
          width: 2,
          value: "1"
        },
        {
          color: "rgb(20,158,206)",
          dash: [1, 3],
          legendTitle: "2",
          width: 2,
          value: "2"
        },
        {
          color: "rgb(167,198,54)",
          dash: [6, 6],
          legendTitle: "3",
          width: 2,
          value: "3"
        },
        {
          color: "rgb(158,85,156)",
          dash: [4, 3, 1, 3],
          legendTitle: "4",
          width: 2,
          value: "4"
        },
        {
          color: "rgb(252,146,31)",
          dash: [8, 3, 1, 3, 1, 3],
          legendTitle: "5",
          width: 2,
          value: "5"
        },
        {
          color: "rgb(255,222,62)",
          dash: [8, 3],
          legendTitle: "6",
          width: 2,
          value: "6"
        },
        {
          color: "rgb(247,137,216)",
          dash: [8, 3, 1, 3],
          legendTitle: "7",
          width: 2,
          value: "7"
        },
        {
          color: "rgb(183,129,74)",
          dash: [4, 1],
          legendTitle: "8",
          width: 2,
          value: "8"
        },
        {
          color: "rgb(60,175,153)",
          dash: [1, 1],
          legendTitle: "9",
          width: 2,
          value: "9"
        },
        {
          color: "rgb(107,107,214)",
          dash: [4, 1, 1, 1],
          legendTitle: "10",
          width: 2,
          value: "10"
        },
        {
          color: "rgb(181,71,121)",
          dash: [4, 1, 1, 1, 1, 1],
          legendTitle: "11",
          width: 2,
          value: "11"
        },
        {
          dash: [],
          legendTitle: "12",
          width: 2,
          value: "12"
        }
      ]);
    });
  });
});
