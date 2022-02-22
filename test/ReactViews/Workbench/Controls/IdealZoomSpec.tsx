import React from "react";
import { act } from "react-dom/test-utils";
import TestRenderer, { ReactTestRenderer } from "react-test-renderer";
import Terria from "../../../../lib/Models/Terria";
import Cesium3DTilesCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/Cesium3DTilesCatalogItem";

// @ts-ignore
import ViewingControls from "../../../../lib/ReactViews/Workbench/Controls/ViewingControls";
import ViewState from "../../../../lib/ReactViewModels/ViewState";

import CesiumMath from "terriajs-cesium/Source/Core/Math";

describe("Ideal Zoom", function() {
  let terria: Terria;
  let theItem: Cesium3DTilesCatalogItem;
  let testRenderer: ReactTestRenderer;
  let viewState: ViewState;
  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    theItem = new Cesium3DTilesCatalogItem("my3dtiles", terria);
    theItem.setTrait("definition", "url", "/test/Cesium3DTiles/tileset.json");

    const options = {
      terria: terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    };
    viewState = new ViewState(options);
  });

  it("should use default camera view if no parameters are given.", async function() {
    await theItem.loadMapItems();

    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root?.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    expect(theCameraView.direction).toBe(undefined);
    expect(theCameraView.position).toBe(undefined);
    expect(theCameraView.up).toBe(undefined);

    // The rectangle values are from default camera view.
    const rectangle = {
      east: 3.141592653589793,
      north: 1.5707963267948966,
      south: -1.5707963267948966,
      west: -3.141592653589793
    };
    expect(theCameraView.rectangle?.east).toBeCloseTo(rectangle.east, 6);
    expect(theCameraView.rectangle?.north).toBeCloseTo(rectangle.north, 6);
    expect(theCameraView.rectangle?.south).toBeCloseTo(rectangle.south, 6);
    expect(theCameraView.rectangle?.west).toBeCloseTo(rectangle.west, 6);
  });

  it("should customise camera view if the given parameters are valid.", async function() {
    const idealZoom = {
      targetLongitude: 150.60832,
      targetLatitude: -34.19483,
      targetHeight: 200,
      heading: 180,
      pitch: 15,
      range: 200
    };
    theItem.setTrait("definition", "idealZoom", idealZoom);
    await theItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    const directionX = 0.6595071845691584;
    const directionY = -0.37148703631220265;
    const directionZ = -0.6534888333809832;
    expect(theCameraView.direction?.x).toBeCloseTo(directionX, 6);
    expect(theCameraView.direction?.y).toBeCloseTo(directionY, 6);
    expect(theCameraView.direction?.z).toBeCloseTo(directionZ, 6);

    const positionX = -4601657.155837906;
    const positionY = 2592020.25230978;
    const positionZ = -3564324.3086873693;
    expect(theCameraView.position?.x).toBeCloseTo(positionX, 6);
    expect(theCameraView.position?.y).toBeCloseTo(positionY, 6);
    expect(theCameraView.position?.z).toBeCloseTo(positionZ, 6);

    const upX = -0.5693750748843667;
    const upY = 0.3207174448857751;
    const upZ = -0.7569361562551771;
    expect(theCameraView.up?.x).toBeCloseTo(upX, 6);
    expect(theCameraView.up?.y).toBeCloseTo(upY, 6);
    expect(theCameraView.up?.z).toBeCloseTo(upZ, 6);

    // The rectangle values are calculated from the given idealZoom parameters,
    // i.e., the customised camera's direction, position and up parameters.
    // A 2D viewer will zoom to this rectangle only.
    const rectangle = {
      east: 2.6286473947864932,
      north: -0.5967760407704654,
      south: -0.596848700549,
      west: 2.628574735007959
    };
    expect(theCameraView.rectangle?.east).toBeCloseTo(rectangle.east, 6);
    expect(theCameraView.rectangle?.north).toBeCloseTo(rectangle.north, 6);
    expect(theCameraView.rectangle?.south).toBeCloseTo(rectangle.south, 6);
    expect(theCameraView.rectangle?.west).toBeCloseTo(rectangle.west, 6);
  });

  it("should override the using home camera rule.", async function() {
    // Using home camera rule might kick in given the wrapped rectangle.
    const wrappedRectangle = {
      east: 511,
      north: -33,
      west: 149,
      south: -35
    };
    theItem.setTrait("definition", "rectangle", wrappedRectangle);

    // But using home camera rule will be orverridden by idealZoom.
    const idealZoom = {
      targetLongitude: 150.60832,
      targetLatitude: -34.19483,
      targetHeight: 200,
      heading: 180,
      pitch: 15,
      range: 200
    };
    theItem.setTrait("definition", "idealZoom", idealZoom);

    await theItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    const directionX = 0.6595071845691584;
    const directionY = -0.37148703631220265;
    const directionZ = -0.6534888333809832;
    expect(theCameraView.direction?.x).toBeCloseTo(directionX, 6);
    expect(theCameraView.direction?.y).toBeCloseTo(directionY, 6);
    expect(theCameraView.direction?.z).toBeCloseTo(directionZ, 6);

    const positionX = -4601657.155837906;
    const positionY = 2592020.25230978;
    const positionZ = -3564324.3086873693;
    expect(theCameraView.position?.x).toBeCloseTo(positionX, 6);
    expect(theCameraView.position?.y).toBeCloseTo(positionY, 6);
    expect(theCameraView.position?.z).toBeCloseTo(positionZ, 6);

    const upX = -0.5693750748843667;
    const upY = 0.3207174448857751;
    const upZ = -0.7569361562551771;
    expect(theCameraView.up?.x).toBeCloseTo(upX, 6);
    expect(theCameraView.up?.y).toBeCloseTo(upY, 6);
    expect(theCameraView.up?.z).toBeCloseTo(upZ, 6);

    // The rectangle values are calculated from the given idealZoom parameters,
    // i.e., the customised camera's direction, position and up parameters.
    // A 2D viewer will zoom to this rectangle only.
    const rectangle = {
      east: 2.6286473947864932,
      north: -0.5967760407704654,
      south: -0.596848700549,
      west: 2.628574735007959
    };
    expect(theCameraView.rectangle?.east).toBeCloseTo(rectangle.east, 6);
    expect(theCameraView.rectangle?.north).toBeCloseTo(rectangle.north, 6);
    expect(theCameraView.rectangle?.south).toBeCloseTo(rectangle.south, 6);
    expect(theCameraView.rectangle?.west).toBeCloseTo(rectangle.west, 6);
  });

  it("should use default camera view if the given parameters are invalid.", async function() {
    const idealZoom = {
      targetLongitude: undefined,
      targetLatitude: undefined,
      targetHeight: 200,
      heading: 180,
      pitch: 15,
      range: 200
    };
    theItem.setTrait("definition", "idealZoom", idealZoom);
    await theItem.loadMapItems();

    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root?.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    expect(theCameraView.direction).toBe(undefined);
    expect(theCameraView.position).toBe(undefined);
    expect(theCameraView.up).toBe(undefined);
  });

  it("should use initialCamera if the given parameters are complete.", async function() {
    const initialCamera = {
      west: 143.85665964592238,
      south: -37.5588985189224,
      east: 143.85932639124115,
      north: -37.55761610087383,
      position: {
        x: -4088564.111098504,
        y: 2985823.720726511,
        z: -3867066.0705771768
      },
      direction: {
        x: 0.25654239033528903,
        y: 0.8049473516085732,
        z: 0.5350194044138963
      },
      up: {
        x: -0.6168995401836412,
        y: 0.5624968267277541,
        z: -0.5504836757274634
      }
    };

    theItem.setTrait("definition", "initialCamera", initialCamera);
    await theItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    expect(theCameraView.direction?.x).toBeCloseTo(
      initialCamera.direction.x,
      6
    );
    expect(theCameraView.direction?.y).toBeCloseTo(
      initialCamera.direction.y,
      6
    );
    expect(theCameraView.direction?.z).toBeCloseTo(
      initialCamera.direction.z,
      6
    );

    expect(theCameraView.position?.x).toBeCloseTo(initialCamera.position.x, 6);
    expect(theCameraView.position?.y).toBeCloseTo(initialCamera.position.y, 6);
    expect(theCameraView.position?.z).toBeCloseTo(initialCamera.position.z, 6);

    expect(theCameraView.up?.x).toBeCloseTo(initialCamera.up.x, 6);
    expect(theCameraView.up?.y).toBeCloseTo(initialCamera.up.y, 6);
    expect(theCameraView.up?.z).toBeCloseTo(initialCamera.up.z, 6);

    expect(theCameraView.rectangle?.east).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.east),
      6
    );
    expect(theCameraView.rectangle?.north).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.north),
      6
    );
    expect(theCameraView.rectangle?.south).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.south),
      6
    );
    expect(theCameraView.rectangle?.west).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.west),
      6
    );
  });

  it("should use given rectangle if any other values are missing in initialCamera.", async function() {
    const initialCamera = {
      west: 143.85665964592238,
      south: -37.5588985189224,
      east: 143.85932639124115,
      north: -37.55761610087383,
      position: {
        x: -4088564.111098504,
        y: 2985823.720726511,
        z: undefined
      },
      direction: {
        x: 0.25654239033528903,
        y: 0.8049473516085732,
        z: 0.5350194044138963
      },
      up: {
        x: -0.6168995401836412,
        y: 0.5624968267277541,
        z: -0.5504836757274634
      }
    };

    theItem.setTrait("definition", "initialCamera", initialCamera);
    await theItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    expect(theCameraView.direction).toBe(undefined);
    expect(theCameraView.position).toBe(undefined);
    expect(theCameraView.up).toBe(undefined);

    expect(theCameraView.rectangle?.east).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.east),
      6
    );
    expect(theCameraView.rectangle?.north).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.north),
      6
    );
    expect(theCameraView.rectangle?.south).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.south),
      6
    );
    expect(theCameraView.rectangle?.west).toBeCloseTo(
      CesiumMath.toRadians(initialCamera.west),
      6
    );
  });

  it("should use default camera view if missing any required rectagle parameters in initialCamera.", async function() {
    const initialCamera = {
      west: undefined,
      south: -37.5588985189224,
      east: 143.85932639124115,
      north: -37.55761610087383,
      position: {
        x: -4088564.111098504,
        y: 2985823.720726511,
        z: -3867066.0705771768
      },
      direction: {
        x: 0.25654239033528903,
        y: 0.8049473516085732,
        z: 0.5350194044138963
      },
      up: {
        x: -0.6168995401836412,
        y: 0.5624968267277541,
        z: -0.5504836757274634
      }
    };

    theItem.setTrait("definition", "initialCamera", initialCamera);
    await theItem.loadMapItems();
    act(() => {
      testRenderer = TestRenderer.create(
        <ViewingControls item={theItem} viewState={viewState} />
      );
    });

    testRenderer.root.findAllByType("button")[0].props.onClick();
    const theCameraView = terria.currentViewer.getCurrentCameraView();

    expect(theCameraView.direction).toBe(undefined);
    expect(theCameraView.position).toBe(undefined);
    expect(theCameraView.up).toBe(undefined);

    // The rectangle values are from default camera view.
    const rectangle = {
      east: 3.141592653589793,
      north: 1.5707963267948966,
      south: -1.5707963267948966,
      west: -3.141592653589793
    };
    expect(theCameraView.rectangle?.east).toBeCloseTo(rectangle.east, 6);
    expect(theCameraView.rectangle?.north).toBeCloseTo(rectangle.north, 6);
    expect(theCameraView.rectangle?.south).toBeCloseTo(rectangle.south, 6);
    expect(theCameraView.rectangle?.west).toBeCloseTo(rectangle.west, 6);
  });
});
