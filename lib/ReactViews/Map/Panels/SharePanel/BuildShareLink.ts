import { uniq } from "lodash-es";
import { runInAction, toJS } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import URI from "urijs";
import hashEntity from "../../../../Core/hashEntity";
import isDefined from "../../../../Core/isDefined";
import TerriaError from "../../../../Core/TerriaError";
import ReferenceMixin from "../../../../ModelMixins/ReferenceMixin";
import CommonStrata from "../../../../Models/Definition/CommonStrata";
import { BaseModel } from "../../../../Models/Definition/Model";
import saveStratumToJson from "../../../../Models/Definition/saveStratumToJson";
import GlobeOrMap from "../../../../Models/GlobeOrMap";
import HasLocalData from "../../../../Models/HasLocalData";
import {
  InitSourceData,
  InitSourcePickedFeatures,
  ShareInitSourceData,
  ViewModeJson
} from "../../../../Models/InitSource";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import getDereferencedIfExists from "../../../../Core/getDereferencedIfExists";
import CatalogMemberMixin from "../../../../ModelMixins/CatalogMemberMixin";

/** User properties (generated from URL hash parameters) to add to share link URL in PRODUCTION environment.
 * If in Dev, we add all user properties.
 */
const userPropsToShare = ["hideExplorerPanel", "activeTabId"];

export const SHARE_VERSION = "8.0.0";

/** Create base share link URL - with `hashParameters` applied on top.
 * This will copy over some `userProperties` - see `userPropsToShare`
 */
function buildBaseShareUrl(
  terria: Terria,
  hashParams: { [key: string]: string }
) {
  const uri = new URI(document.baseURI).fragment("").search("");

  const usefulSubs = new URL(document.URL).hash
    .split(/[#&]/)
    .filter((elem) =>
      elem !== "" && !elem.includes("share=") && !elem.includes("start=")
    );
  usefulSubs.forEach(sub => { uri.addSearch(sub) });

  if (terria.developmentEnv) {
    uri.addSearch(toJS(terria.userProperties));
  } else {
    userPropsToShare.forEach((key) =>
      uri.addSearch({ [key]: terria.userProperties.get(key) })
    );
  }

  uri.addSearch(hashParams);

  return uri.fragment(uri.query()).query("").toString();
}

/**
 * Builds a share link that reflects the state of the passed Terria instance.
 *
 * @param terria The terria instance to serialize.
 * @param {ViewState} [viewState] The viewState to read whether we're viewing the catalog or not
 * @param {Object} [options] Options for building the share link.
 * @param {Boolean} [options.includeStories=true] True to include stories in the share link, false to exclude them.
 * @returns {String} A URI that will rebuild the current state when viewed in a browser.
 */
export function buildShareLink(
  terria: Terria,
  viewState?: ViewState,
  options = { includeStories: true }
) {
  return buildBaseShareUrl(terria, {
    start: JSON.stringify(getShareData(terria, viewState, options))
  });
}

/**
 * Like {@link buildShareLink}, but shortens the result using {@link Terria#urlShortener}.
 *
 * @returns {Promise<String>} A promise that will return the shortened url when complete.
 */
export async function buildShortShareLink(
  terria: Terria,
  viewState?: ViewState,
  options = { includeStories: true }
) {
  if (!isDefined(terria.shareDataService))
    throw TerriaError.from(
      "Could not generate share token - `shareDataService` is `undefined`"
    );

  const token = await terria.shareDataService?.getShareToken(
    getShareData(terria, viewState, options)
  );

  if (typeof token === "string") {
    return buildBaseShareUrl(terria, {
      share: token
    });
  }
  throw TerriaError.from("Could not generate share token");
}

/**
 * Returns just the JSON that defines the current view.
 * @param  {Terria} terria The Terria object.
 * @param  {ViewState} [viewState] Current viewState.
 * @return {Object}
 */
export function getShareData(
  terria: Terria,
  viewState?: ViewState,
  options = { includeStories: true }
): ShareInitSourceData {
  return runInAction(() => {
    const { includeStories } = options;
    const initSource: InitSourceData = {};
    const initSources = [initSource];

    addStratum(terria, CommonStrata.user, initSource);
    addWorkbench(terria, initSource);
    addTimelineItems(terria, initSource);
    addViewSettings(terria, viewState, initSource);
    addFeaturePicking(terria, initSource);
    if (includeStories) {
      // info that are not needed in scene share data
      addStories(terria, initSource);
    }

    return {
      version: SHARE_VERSION,
      initSources: initSources
    };
  });
}

/**
 * Serialise all model data from a given stratum except feature highlight
 * and serialise all ancestors of any models serialised
 * @param {Terria} terria
 * @param {CommonStrata} stratumId
 * @param {Object} initSource
 */
function addStratum(
  terria: Terria,
  stratumId: string,
  initSource: InitSourceData
) {
  initSource.stratum = stratumId;
  initSource.models = {};

  terria.modelValues.forEach((model) => {
    if (model.uniqueId === GlobeOrMap.featureHighlightID) return;
    const force = terria.workbench.contains(model);
    addModelStratum(terria, model, stratumId, force, initSource);
  });

  // Go through knownContainerUniqueIds and make sure they exist in models
  Object.keys(initSource.models).forEach((modelId) => {
    const model = terria.getModelById(BaseModel, modelId);
    if (model)
      model.completeKnownContainerUniqueIds.forEach((containerId) => {
        if (!initSource.models?.[containerId]) {
          const containerModel = terria.getModelById(BaseModel, containerId);
          if (containerModel)
            addModelStratum(
              terria,
              containerModel,
              stratumId,
              true,
              initSource
            );
        }
      });
  });
}

function addWorkbench(terria: Terria, initSource: InitSourceData) {
  initSource.workbench = terria.workbench.itemIds.filter(isShareable(terria));
}

function addTimelineItems(terria: Terria, initSources: InitSourceData) {
  initSources.timeline = terria.timelineStack.itemIds.filter(
    isShareable(terria)
  );
}

function addModelStratum(
  terria: Terria,
  model: BaseModel,
  stratumId: string,
  force: boolean,
  initSource: InitSourceData
) {
  const models = initSource.models;

  const id = model.uniqueId;

  if (!id || !models || models?.[id] !== undefined) {
    return;
  }

  const stratum = model.strata.get(stratumId);

  const dereferenced = ReferenceMixin.isMixedInto(model)
    ? model.target
    : undefined;
  const dereferencedStratum = dereferenced
    ? dereferenced.strata.get(stratumId)
    : undefined;

  if (!force && stratum === undefined && dereferencedStratum === undefined) {
    return;
  }

  if (!isShareable(terria)(id)) {
    return;
  }

  models[id] = stratum ? saveStratumToJson(model.traits, stratum) : {};

  if (dereferenced && dereferencedStratum) {
    models[id].dereferenced = saveStratumToJson(
      dereferenced.traits,
      dereferencedStratum
    );
  }

  if (
    model.knownContainerUniqueIds &&
    model.knownContainerUniqueIds.length > 0
  ) {
    models[id].knownContainerUniqueIds = model.knownContainerUniqueIds.slice();
  }

  const members = toJS(models[id].members);

  if (Array.isArray(members)) {
    models[id].members = uniq(
      models[id].members?.filter((member) =>
        typeof member === "string" ? isShareable(terria)(member) : false
      )
    );
  }

  models[id].type = model.type;
}

/**
 * Returns a function which determines whether a modelId represents a model that can be shared
 * @param  {Object} terria The Terria object.
 * @return {Function} The function which determines whether a modelId can be shared
 */
export function isShareable(terria: Terria) {
  return function (modelId: string) {
    const model = terria.getModelById(BaseModel, modelId);

    if (CatalogMemberMixin.isMixedInto(model) && !model.shareable) {
      return false;
    }

    // If this is a Reference, then use the model.target, otherwise use the model
    const dereferenced =
      typeof model === "undefined"
        ? model
        : getDereferencedIfExists(terria.getModelById(BaseModel, modelId)!);

    if (
      CatalogMemberMixin.isMixedInto(dereferenced) &&
      !dereferenced.shareable
    ) {
      return false;
    }

    return (
      model &&
      ((HasLocalData.is(dereferenced) && !dereferenced.hasLocalData) ||
        !HasLocalData.is(dereferenced))
    );
  };
}

/**
 * Is it currently possible to generate short URLs?
 * @param  {Object} terria The Terria object.
 * @return {Boolean}
 */
export function canShorten(terria: Terria) {
  return terria.shareDataService && terria.shareDataService.isUsable;
}

/**
 * Adds the details of the current view to the init sources.
 * @private
 */
function addViewSettings(
  terria: Terria,
  viewState?: ViewState,
  initSource: InitSourceData = {}
) {
  const viewer = terria.mainViewer;

  // const time = {
  //   dayNumber: terria.timelineClock.currentTime.dayNumber,
  //   secondsOfDay: terria.timelineClock.currentTime.secondsOfDay
  // };

  let viewerMode: ViewModeJson;
  if (terria.mainViewer.viewerMode === "cesium") {
    if (terria.mainViewer.viewerOptions.useTerrain) {
      viewerMode = "3d";
    } else {
      viewerMode = "3dSmooth";
    }
  } else {
    viewerMode = "2d";
  }

  initSource.initialCamera = terria.currentViewer
    .getCurrentCameraView()
    .toJson();
  initSource.homeCamera = terria.mainViewer.homeCamera.toJson();
  initSource.viewerMode = viewerMode;

  initSource.showSplitter = terria.showSplitter;
  initSource.splitPosition = terria.splitPosition;

  initSource.settings = {
    baseMaximumScreenSpaceError: terria.baseMaximumScreenSpaceError,
    useNativeResolution: terria.useNativeResolution,
    alwaysShowTimeline: terria.timelineStack.alwaysShowingTimeline,
    baseMapId: viewer.baseMap?.uniqueId,
    terrainSplitDirection: terria.terrainSplitDirection,
    depthTestAgainstTerrainEnabled: terria.depthTestAgainstTerrainEnabled
  };

  if (isDefined(viewState)) {
    const itemIdToUse = viewState.viewingUserData()
      ? isDefined(viewState.userDataPreviewedItem) &&
        viewState.userDataPreviewedItem.uniqueId
      : isDefined(viewState.previewedItem) && viewState.previewedItem.uniqueId;

    // don't persist the not-visible-to-user previewed id in the case of sharing from outside the catalog
    if (viewState.explorerPanelIsVisible && itemIdToUse) {
      initSource.previewedItemId = itemIdToUse;
    }
  }
}

/**
 * Add details of currently picked features.
 * @private
 */
function addFeaturePicking(terria: Terria, initSource: InitSourceData) {
  if (
    isDefined(terria.pickedFeatures) &&
    terria.pickedFeatures.features.length > 0 &&
    terria.pickedFeatures.pickPosition
  ) {
    const positionInRadians = Ellipsoid.WGS84.cartesianToCartographic(
      terria.pickedFeatures.pickPosition
    );

    const pickedFeatures: InitSourcePickedFeatures = {
      providerCoords: terria.pickedFeatures.providerCoords,
      pickCoords: {
        lat: CesiumMath.toDegrees(positionInRadians.latitude),
        lng: CesiumMath.toDegrees(positionInRadians.longitude),
        height: positionInRadians.height
      }
    };

    if (isDefined(terria.selectedFeature)) {
      // Sometimes features have stable ids and sometimes they're randomly generated every time, so include both
      // id and name as a fallback.
      pickedFeatures.current = {
        name: terria.selectedFeature.name,
        hash: hashEntity(terria.selectedFeature, terria)
      };
    }

    // Remember the ids of vector features only, the raster ones we can reconstruct from providerCoords.
    pickedFeatures.entities = terria.pickedFeatures.features
      .filter((feature) => !isDefined(feature.imageryLayer?.imageryProvider))
      .map((entity) => {
        return {
          name: entity.name,
          hash: hashEntity(entity, terria)
        };
      });

    initSource.pickedFeatures = pickedFeatures;
  }
}

function addStories(terria: Terria, initSource: InitSourceData) {
  if (isDefined(terria.stories)) {
    initSource.stories = terria.stories.slice();
  }
}
