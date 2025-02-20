import i18next from "i18next";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import Resource from "terriajs-cesium/Source/Core/Resource";
import TileProviderError from "terriajs-cesium/Source/Core/TileProviderError";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import WebMapServiceImageryProvider from "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider";
import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import TileErrorHandlerMixin from "../../lib/ModelMixins/TileErrorHandlerMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import Terria from "../../lib/Models/Terria";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import mixTraits from "../../lib/Traits/mixTraits";
import ImageryProviderTraits from "../../lib/Traits/TraitsClasses/ImageryProviderTraits";
import UrlTraits from "../../lib/Traits/TraitsClasses/UrlTraits";

class TestCatalogItem extends TileErrorHandlerMixin(
  MappableMixin(
    CreateModel(
      mixTraits(
        UrlTraits,
        ImageryProviderTraits,
        MappableTraits,
        CatalogMemberTraits
      )
    )
  )
) {
  constructor(
    name: string,
    terria: Terria,
    readonly imageryProvider: ImageryProvider
  ) {
    super(name, terria);
    this.tileRetryOptions = {
      ...this.tileRetryOptions,
      retries: 3,
      minTimeout: 0,
      maxTimeout: 0,
      randomize: false
    };
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  get mapItems(): MapItem[] {
    return [
      {
        imageryProvider: this.imageryProvider,
        show: true,
        alpha: 1,
        clippingRectangle: undefined
      }
    ];
  }
}

describe("TileErrorHandlerMixin", function () {
  let item: TestCatalogItem;
  let imageryProvider: ImageryProvider;

  const newError = (
    statusCode: number | undefined,
    timesRetried = 0
  ): TileProviderError => {
    const httpError = new RequestErrorEvent(statusCode) as any as Error;
    return new TileProviderError(
      imageryProvider,
      "Something broke",
      42,
      42,
      42,
      timesRetried,
      httpError
    );
  };

  // A convenience function to call tile load error while returning a promise
  // that waits for its completion.
  function onTileLoadError(item: TestCatalogItem, error: TileProviderError) {
    item.onTileLoadError(error);
    return new Promise<void>((resolve, reject) => {
      const retry: { then?: any; otherwise: any } = error.retry as any;
      if (retry && retry.then) {
        retry.then(resolve).catch(reject);
      } else {
        resolve();
      }
    });
  }

  beforeEach(function () {
    imageryProvider = new WebMapServiceImageryProvider({
      url: "/foo",
      layers: "0"
    });
    item = new TestCatalogItem("test", new Terria(), imageryProvider);
    item.setTrait(CommonStrata.user, "url", "/foo");
  });

  it("gives up silently if the failed tile is outside the extent of the item", async function () {
    item.setTrait(CommonStrata.user, "rectangle", {
      west: 106.9,
      east: 120.9,
      north: 4.1,
      south: 4.3
    });
    try {
      await onTileLoadError(item, newError(400));
    } catch {}
    expect(item.tileFailures).toBe(0);
  });

  describe("when statusCode is between 400 and 499", function () {
    it("gives up silently if statusCode is 403 and treat403AsError is false", async function () {
      try {
        item.tileErrorHandlingOptions.setTrait(
          CommonStrata.user,
          "treat403AsError",
          false
        );
        await onTileLoadError(item, newError(403));
      } catch {}
      expect(item.tileFailures).toBe(0);
    });

    it("gives up silently if statusCode is 404 and treat404AsError is false", async function () {
      try {
        item.tileErrorHandlingOptions.setTrait(
          CommonStrata.user,
          "treat404AsError",
          false
        );
        await onTileLoadError(item, newError(404));
      } catch {}
      expect(item.tileFailures).toBe(0);
    });

    it("fails otherwise", async function () {
      item.tileErrorHandlingOptions.setTrait(
        CommonStrata.user,
        "treat403AsError",
        true
      );
      item.tileErrorHandlingOptions.setTrait(
        CommonStrata.user,
        "treat404AsError",
        true
      );
      try {
        await Promise.all([
          onTileLoadError(item, newError(403, 0)),
          onTileLoadError(item, newError(404, 1)),
          onTileLoadError(item, newError(randomIntBetween(400, 499), 2))
        ]);
      } catch {}
      expect(item.tileFailures).toBe(3);
    });
  });

  describe("when statusCode is between 500 and 599", function () {
    it("retries fetching the tile using xhr", async function () {
      try {
        const error = newError(randomIntBetween(500, 599));
        spyOn(Resource, "fetchImage").and.callFake(() =>
          Promise.reject(error.error)
        );
        await onTileLoadError(item, error);
      } catch (_e) {}
      expect(Resource.fetchImage).toHaveBeenCalled();
    });
  });

  describe("when statusCode is undefined", function () {
    let raiseEvent: jasmine.Spy;

    beforeEach(function () {
      raiseEvent = spyOn(item.terria, "raiseErrorToUser");
      item.tileErrorHandlingOptions.setTrait(
        CommonStrata.user,
        "thresholdBeforeDisablingItem",
        0
      );
    });

    it("gives up silently if ignoreUnknownTileErrors is true", async function () {
      item.tileErrorHandlingOptions.setTrait(
        CommonStrata.user,
        "ignoreUnknownTileErrors",
        true
      );
      try {
        await onTileLoadError(item, newError(undefined));
      } catch {}
      expect(item.tileFailures).toBe(0);
      expect(raiseEvent.calls.count()).toBe(0);
    });

    it("fails with bad image error if the error defines a target element", async function () {
      try {
        const tileProviderError: TileProviderError = newError(undefined);

        tileProviderError.error = {
          ...tileProviderError.error,
          target: {}
        } as Error;
        await onTileLoadError(item, tileProviderError);
      } catch {}
      expect(item.tileFailures).toBe(1);
      expect(raiseEvent.calls.count()).toBe(1);
      expect(raiseEvent.calls.argsFor(0)[0]?.message).toContain(
        i18next.t("models.imageryLayer.tileErrorMessageII")
      );
    });

    it("otherwise, it fails with unknown error", async function () {
      try {
        await onTileLoadError(item, newError(undefined));
      } catch {}
      expect(item.tileFailures).toBe(1);
      expect(raiseEvent.calls.count()).toBe(1);
      expect(raiseEvent.calls.argsFor(0)[0]?.message).toContain(
        i18next.t("models.imageryLayer.unknownTileErrorMessage")
      );
    });
  });

  describe("when performing xhr retries", function () {
    it("it fails after retrying a maximum of specified number of times", async function () {
      try {
        const error = newError(randomIntBetween(500, 599));
        spyOn(Resource, "fetchImage").and.callFake(() =>
          Promise.reject(error.error)
        );
        await onTileLoadError(item, error);
      } catch {}
      expect(Resource.fetchImage).toHaveBeenCalledTimes(
        !Array.isArray(item.tileRetryOptions)
          ? item.tileRetryOptions.retries ?? 0
          : 0
      );
      expect(item.tileFailures).toBe(1);
    });

    it("tells the map to reload the tile again if an xhr attempt succeeds", async function () {
      spyOn(Resource, "fetchImage").and.returnValue(Promise.resolve());
      await onTileLoadError(item, newError(randomIntBetween(500, 599)));
      expect(item.tileFailures).toBe(0);
    });

    it("fails if the xhr succeeds but the map fails to load the tile for more than 5 times", async function () {
      try {
        spyOn(Resource, "fetchImage").and.returnValue(Promise.resolve());
        await onTileLoadError(item, newError(randomIntBetween(500, 599), 0));
        await onTileLoadError(item, newError(randomIntBetween(500, 599), 1));
        await onTileLoadError(item, newError(randomIntBetween(500, 599), 2));
        await onTileLoadError(item, newError(randomIntBetween(500, 599), 3));
        await onTileLoadError(item, newError(randomIntBetween(500, 599), 4));
        await onTileLoadError(item, newError(randomIntBetween(500, 599), 5));
      } catch {}
      expect(item.tileFailures).toEqual(1);
    });

    it("gives up silently if the item is hidden", async function () {
      try {
        const error = newError(randomIntBetween(500, 599));
        spyOn(Resource, "fetchImage").and.callFake(() =>
          Promise.reject(error.error)
        );
        const result = onTileLoadError(item, error);
        item.setTrait(CommonStrata.user, "show", false);
        await result;
      } catch {}
      expect(item.tileFailures).toEqual(0);
    });
  });

  describe("when a tile fails more than the threshold number of times", function () {
    beforeEach(function () {
      item.tileErrorHandlingOptions.setTrait(
        CommonStrata.user,
        "thresholdBeforeDisablingItem",
        1
      );
    });

    it("reports the last error to the user", async function () {
      spyOn(item.terria, "raiseErrorToUser");
      try {
        await onTileLoadError(item, newError(undefined));
      } catch {}
      try {
        await onTileLoadError(item, newError(undefined, 1));
      } catch {}
      expect(item.tileFailures).toBe(2);
      expect(item.terria.raiseErrorToUser).toHaveBeenCalled();
    });

    it("disables the catalog item", async function () {
      expect(item.show).toBe(true);
      try {
        await onTileLoadError(item, newError(undefined));
      } catch {}
      try {
        await onTileLoadError(item, newError(undefined, 1));
      } catch {}
      expect(item.show).toBe(false);
    });
  });

  it("resets tileFailures to 0 when there is an intervening success", async function () {
    const error = newError(undefined);
    expect(item.tileFailures).toBe(0);

    try {
      await onTileLoadError(item, error);
    } catch {}
    expect(item.tileFailures).toBe(1);

    try {
      error.timesRetried = 1;
      await onTileLoadError(item, error);
    } catch {}
    expect(item.tileFailures).toBe(2);

    try {
      error.timesRetried = 0;
      await onTileLoadError(item, error);
    } catch {}
    expect(item.tileFailures).toBe(1);
  });

  it("calls `handleTileError` if the item defines it", async function () {
    item.handleTileError = (promise) => promise;
    spyOn(item, "handleTileError");
    try {
      await onTileLoadError(item, newError(400));
    } catch {}
    expect(item.handleTileError).toHaveBeenCalledTimes(1);
  });
});

function randomIntBetween(first: number, last: number) {
  return Math.floor(first + Math.random() * (last - first));
}
