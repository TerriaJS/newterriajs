"use strict";
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import { runInAction } from "mobx";
import { findWithType } from "react-shallow-testutils";
import PickedFeatures from "../../lib/Map/PickedFeatures";
import CompositeCatalogItem from "../../lib/Models/Catalog/CatalogItems/CompositeCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Feature from "../../lib/Models/Feature";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
// import Entity from 'terriajs-cesium/Source/DataSources/Entity';
import {
  determineCatalogItem,
  FeatureInfoPanel
} from "../../lib/ReactViews/FeatureInfo/FeatureInfoPanel";
import Loader from "../../lib/ReactViews/Loader";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import { getShallowRenderedOutput } from "./MoreShallowTools";

// var separator = ',';
// if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
//     separator = (Intl.NumberFormat().format(1000)[1]);
// }

describe("FeatureInfoPanel", function() {
  let terria: Terria;
  // let feature;
  let viewState: ViewState;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  it("has isVisible class when viewState.featureInfoPanelIsVisible is true", function() {
    viewState.featureInfoPanelIsVisible = true;
    const panel = (
      <FeatureInfoPanel terria={terria} viewState={viewState} t={() => {}} />
    );
    const result = getShallowRenderedOutput(panel);
    expect(result.props.children.props.className).toContain("is-visible");
  });

  it("displays loader while asychronously loading feature information", function() {
    var pickedFeatures = new PickedFeatures();
    pickedFeatures.allFeaturesAvailablePromise = Promise.resolve();
    runInAction(() => {
      terria.pickedFeatures = pickedFeatures;
    });
    const panel = (
      <FeatureInfoPanel terria={terria} viewState={viewState} t={() => {}} />
    );
    const result = getShallowRenderedOutput(panel);
    expect(findWithType(result, Loader)).toBeDefined();
  });

  it("does not have isVisible class when viewState.featureInfoPanelIsVisible is false", function() {
    viewState.featureInfoPanelIsVisible = false;
    const panel = (
      <FeatureInfoPanel terria={terria} viewState={viewState} t={() => {}} />
    );
    const result = getShallowRenderedOutput(panel);
    expect(result.props.children.props.className).not.toContain("is-visible");
  });

  // This test won't work for two reasons:
  //   - the behaviour it tests occurs in ComponentDidMount
  //   - FeatureInfoPanel doesn't have FeatureInfoSections - there is a FeatureInfoCatalogItem layer in between.
  //
  // it('shows an open section even if none have any info', function() {
  //     const feature1 = new Entity({
  //         name: 'Foo'
  //     });
  //     const feature2 = new Entity({
  //         name: 'Bar'
  //     });
  //     var pickedFeatures = new PickedFeatures();
  //     pickedFeatures.allFeaturesAvailablePromise = runLater(function() {
  //         pickedFeatures.features = [feature1, feature2];
  //     });
  //     terria.pickedFeatures = pickedFeatures;
  //     const panel = <FeatureInfoPanel terria={terria} viewState={viewState}/>;
  //     const result = getShallowRenderedOutput(panel);
  //     const sections = findAllWithType(result, FeatureInfoSection);
  //     expect(sections.length).toEqual(2);
  //     expect(sections[0].props.isOpen).toBe(true);
  // });

  describe("determineCatalogItem", function() {
    let simple1: SimpleCatalogItem,
      simple2: SimpleCatalogItem,
      composite: CompositeCatalogItem;
    let feature1: Feature, feature2: Feature;
    beforeEach(function() {
      feature1 = new Feature({});
      simple1 = new SimpleCatalogItem("simple1", terria);
      feature1._catalogItem = simple1;
      feature2 = new Feature({});
      simple2 = new SimpleCatalogItem("simple2", terria);
      feature2._catalogItem = simple2;
      composite = new CompositeCatalogItem("composite", terria);
      composite.add(CommonStrata.definition, simple1);
      composite.add(CommonStrata.definition, simple2);
    });
    it("determines which catalog item a feature belongs to", function() {
      terria.workbench.items = [simple1, simple2];
      expect(determineCatalogItem(terria.workbench, feature1)).toBe(simple1);
      expect(determineCatalogItem(terria.workbench, feature2)).toBe(simple2);
    });
    it("special cases features from composite models", function() {
      terria.workbench.items = [composite];
      expect(determineCatalogItem(terria.workbench, feature1)).toBe(simple1);
      expect(determineCatalogItem(terria.workbench, feature2)).toBe(simple2);
      // Features from a member of a composite model are determined to belong to
      // the member model, instead of the composite one.
    });
  });
});
