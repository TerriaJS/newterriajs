"use strict";
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import i18next from "i18next";
import { observable } from "mobx";
import {
  findAll,
  findAllWithClass,
  findAllWithType,
  findWithRef
} from "react-shallow-testutils";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import TimeIntervalCollectionProperty from "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty";
import loadJson from "../../lib/Core/loadJson";
import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../lib/ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import CzmlCatalogItem from "../../lib/Models/Catalog/CatalogItems/CzmlCatalogItem";
import CatalogMemberFactory from "../../lib/Models/Catalog/CatalogMemberFactory";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import upsertModelFromJson from "../../lib/Models/Definition/upsertModelFromJson";
import Terria from "../../lib/Models/Terria";
import Styles from "../../lib/ReactViews/FeatureInfo/feature-info-section.scss";
import { FeatureInfoSection } from "../../lib/ReactViews/FeatureInfo/FeatureInfoSection";
import mixTraits from "../../lib/Traits/mixTraits";
import DiscretelyTimeVaryingTraits from "../../lib/Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import FeatureInfoTraits from "../../lib/Traits/TraitsClasses/FeatureInfoTraits";
import MappableTraits from "../../lib/Traits/TraitsClasses/MappableTraits";
import {
  findAllEqualTo,
  findAllWithPropsChildEqualTo,
  getShallowRenderedOutput
} from "./MoreShallowTools";

let separator = ",";
if (typeof Intl === "object" && typeof Intl.NumberFormat === "function") {
  const thousand = Intl.NumberFormat().format(1000);
  if (thousand.length === 5) {
    separator = thousand[1];
  }
}

const contentClass = Styles.content;

function findAllWithHref(reactElement: any, text: any) {
  return findAll(
    reactElement,
    (element: any) => element && element.props && element.props.href === text
  );
}

// Takes the absolute value of the value and pads it to 2 digits i.e. 7->07, 17->17, -3->3, -13->13. It is expected that value is an integer is in the range [0, 99].
function absPad2(value: number) {
  return (Math.abs(value) < 10 ? "0" : "") + Math.abs(value);
}

describe("FeatureInfoSection", function() {
  let terria: Terria;
  let feature: any;
  let viewState: any;
  let catalogItem: TestModel;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    catalogItem = new TestModel("test", terria);

    viewState = {}; // Not important for tests, but is a required prop.
    const properties = {
      name: "Kay",
      foo: "bar",
      material: "steel",
      "material.process.#1": "smelted",
      size: "12345678.9012",
      efficiency: "0.2345678",
      date: "2017-11-23T08:47:53Z",
      owner_html: "Jay<br>Smith",
      ampersand: "A & B",
      lessThan: "A < B",
      unsafe: 'ok!<script>alert("gotcha")</script>'
    };
    feature = new Entity({
      name: "Bar",
      properties: properties
    });
  });

  it("renders a static description", function() {
    feature.description = {
      getValue: function() {
        return "<p>hi!</p>";
      },
      isConstant: true
    };
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllWithType(result, "p").length).toEqual(1);
    expect(findAllEqualTo(result, "hi!").length).toEqual(1);
  });

  it("does not render unsafe html", function() {
    feature.description = {
      getValue: function() {
        return '<script>alert("gotcha")</script><p>hi!</p>';
      },
      isConstant: true
    };
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllWithType(result, "script").length).toEqual(0);
    expect(findAllEqualTo(result, 'alert("gotcha")').length).toEqual(0);
    expect(findAllWithType(result, "p").length).toEqual(1);
    expect(findAllEqualTo(result, "hi!").length).toEqual(1);
  });

  function timeVaryingDescription() {
    const desc = new TimeIntervalCollectionProperty();
    desc.intervals.addInterval(
      new TimeInterval({
        start: JulianDate.fromDate(new Date("2010-01-01")),
        stop: JulianDate.fromDate(new Date("2011-01-01")),
        data: "<p>hi</p>"
      })
    );
    desc.intervals.addInterval(
      new TimeInterval({
        start: JulianDate.fromDate(new Date("2011-01-01")),
        stop: JulianDate.fromDate(new Date("2012-01-01")),
        data: "<p>bye</p>"
      })
    );
    return desc;
  }

  it("renders a time-varying description", function() {
    feature.description = timeVaryingDescription();
    catalogItem.setTrait(CommonStrata.user, "currentTime", "2011-06-30");

    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        catalogItem={catalogItem}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllEqualTo(result, "hi").length).toEqual(0);
    expect(findAllEqualTo(result, "bye").length).toEqual(1);

    catalogItem.setTrait(CommonStrata.user, "currentTime", "2010-06-30");

    const section2 = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        catalogItem={catalogItem}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result2 = getShallowRenderedOutput(section2);
    expect(findAllEqualTo(result2, "hi").length).toEqual(1);
    expect(findAllEqualTo(result2, "bye").length).toEqual(0);
  });

  it("handles features with no properties", function() {
    feature = new Entity({
      name: "Foot",
      description: "bart"
    });
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllEqualTo(result, "Foot").length).toEqual(1);
    expect(findAllEqualTo(result, "bart").length).toEqual(1);
  });

  it("handles html format feature info", function() {
    feature = new Entity({
      name: "Foo",
      description:
        "<html><head><title>GetFeatureInfo</title></head><body><table><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>"
    });
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllEqualTo(result, "Foo").length).toEqual(1);
    expect(findAllEqualTo(result, "BAR").length).toEqual(1);
  });

  it("handles html format feature info where markdown would break the html", function() {
    feature = new Entity({
      name: "Foo",
      description:
        "<html><head><title>GetFeatureInfo</title></head><body><table>\n\n    <tr>\n\n<th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>"
    });
    // Markdown applied to this description would pull out the lonely <tr> and make it <pre><code><tr>\n</code></pre> , so check this doesn't happen.
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllEqualTo(result, "<tr>\n").length).toEqual(0);
    expect(findAllEqualTo(result, "&lt;\n").length).toEqual(0); // Also cover the possibility that it might be encoded.
  });

  it("maintains and applies inline style attributes", function() {
    feature = new Entity({
      name: "Foo",
      description: '<div style="background:rgb(170, 187, 204)">countdown</div>'
    });
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    const divs = findAllWithPropsChildEqualTo(result, "countdown");
    expect(divs.length).toEqual(1);
    // Note #ABC is converted by IE11 to rgb(170, 187, 204), so just test that directly. Also IE11 adds space to the front, so strip all spaces out.
    expect(divs[0].props.style.background.replace(/ /g, "")).toEqual(
      "rgb(170,187,204)"
    );
  });

  it("does not break when html format feature info has style tag", function() {
    // Note this does not test that it actually uses the style tag for styling.
    feature = new Entity({
      name: "Foo",
      description:
        '<html><head><title>GetFeatureInfo</title></head><style>table.info tr {background:#fff;}</style><body><table class="info"><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>'
    });
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllEqualTo(result, "Foo").length).toEqual(1);
    expect(findAllEqualTo(result, "BAR").length).toEqual(1);
  });

  it("does not break when there are neither properties nor description", function() {
    feature = new Entity({
      name: "Vapid"
    });
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllEqualTo(result, "Vapid").length).toEqual(1);
    expect(findWithRef(result, "no-info")).toBeDefined();
  });

  it("shows properties if no description", function() {
    // Tests both static and potentially time-varying properties.
    feature = new Entity({
      name: "Meals",
      properties: {
        lunch: "eggs",
        dinner: {
          getValue: function() {
            return "ham";
          }
        }
      }
    });
    const section = (
      <FeatureInfoSection
        feature={feature}
        isOpen={true}
        viewState={viewState}
        t={() => {}}
      />
    );
    const result = getShallowRenderedOutput(section);
    expect(findAllEqualTo(result, "Meals").length).toEqual(1);
    expect(findAllEqualTo(result, "lunch").length).toEqual(1);
    expect(findAllEqualTo(result, "eggs").length).toEqual(1);
    expect(findAllEqualTo(result, "dinner").length).toEqual(1);
    expect(findAllEqualTo(result, "ham").length).toEqual(1);
  });

  describe("templating", function() {
    it("uses and completes a string-form featureInfoTemplate if present", function() {
      const template = "This is a {{material}} {{foo}}.";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "This is a steel bar.").length).toEqual(1);
    });

    it("can use _ to refer to . and # in property keys in the featureInfoTemplate", function() {
      const template = "Made from {{material_process__1}} {{material}}.";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Made from smelted steel.").length).toEqual(
        1
      );
    });

    it("formats large numbers without commas", function() {
      const template = "Size: {{size}}";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Size: 12345678.9012").length).toEqual(1);
    });

    it("can format numbers with commas", function() {
      const template = {
        template: "Size: {{size}}",
        formats: { size: { type: "number", useGrouping: true } }
      };
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllEqualTo(
          result,
          "Size: 12" + separator + "345" + separator + "678.9012"
        ).length
      ).toEqual(1);
    });

    it("formats numbers in the formats section with no type as if type were number", function() {
      const template = {
        template: "Size: {{size}}",
        formats: { size: { useGrouping: true } }
      };
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllEqualTo(
          result,
          "Size: 12" + separator + "345" + separator + "678.9012"
        ).length
      ).toEqual(1);
    });

    it("can format numbers using terria.formatNumber", function() {
      let template =
        "Base: {{#terria.formatNumber}}{{size}}{{/terria.formatNumber}}";
      template +=
        '  Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3}{{size}}{{/terria.formatNumber}}';
      template +=
        '  DP: {{#terria.formatNumber}}{"maximumFractionDigits":3}{{efficiency}}{{/terria.formatNumber}}';
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllEqualTo(
          result,
          "Base: 12345678.9012  Sep: 12" +
            separator +
            "345" +
            separator +
            "678.901  DP: 0.235"
        ).length
      ).toEqual(1);
    });

    it("can format numbers using terria.formatNumber without quotes", function() {
      let template =
        "Sep: {{#terria.formatNumber}}{useGrouping:true, maximumFractionDigits:3}{{size}}{{/terria.formatNumber}}";
      template +=
        "  DP: {{#terria.formatNumber}}{maximumFractionDigits:3}{{efficiency}}{{/terria.formatNumber}}";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllEqualTo(
          result,
          "Sep: 12" + separator + "345" + separator + "678.901  DP: 0.235"
        ).length
      ).toEqual(1);
    });

    it("can handle white text in terria.formatNumber", function() {
      const template =
        'Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3} \n {{size}}{{/terria.formatNumber}}';
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllEqualTo(
          result,
          "Sep: 12" + separator + "345" + separator + "678.901"
        ).length
      ).toEqual(1);
    });

    it("handles non-numbers terria.formatNumber", function() {
      const template =
        "Test: {{#terria.formatNumber}}text{{/terria.formatNumber}}";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Test: text").length).toEqual(1);
    });

    it("can use a dateFormatString when it is specified in terria.formatDateTime", function() {
      const template =
        'Test: {{#terria.formatDateTime}}{"format": "dd-mm-yyyy HH:MM:ss"}2017-11-23T08:47:53Z{{/terria.formatDateTime}}';
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      const date = new Date(Date.UTC(2017, 11, 23, 8, 47, 53));
      const formattedDate =
        absPad2(date.getDate()) +
        "-" +
        absPad2(date.getMonth()) +
        "-" +
        date.getFullYear() +
        " " +
        absPad2(date.getHours()) +
        ":" +
        absPad2(date.getMinutes()) +
        ":" +
        absPad2(date.getSeconds()); // E.g. "23-11-2017 19:47:53"
      expect(findAllEqualTo(result, "Test: " + formattedDate).length).toEqual(
        1
      );
    });

    it("defaults dateFormatString to isoDateTime when it is not specified in terria.formatDateTime", function() {
      const template =
        "Test: {{#terria.formatDateTime}}2017-11-23T08:47:53Z{{/terria.formatDateTime}}";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      const date = new Date(Date.UTC(2017, 11, 23, 8, 47, 53));
      const offset = -date.getTimezoneOffset();
      const offsetMinute = offset % 60;
      const offsetHour = (offset - offsetMinute) / 60;
      const timeZone =
        (offset >= 0 ? "+" : "-") +
        absPad2(offsetHour) +
        "" +
        absPad2(offsetMinute);
      const formattedDate =
        date.getFullYear() +
        "-" +
        absPad2(date.getMonth()) +
        "-" +
        absPad2(date.getDate()) +
        "T" +
        absPad2(date.getHours()) +
        ":" +
        absPad2(date.getMinutes()) +
        ":" +
        absPad2(date.getSeconds()) +
        timeZone; // E.g. "2017-11-23T19:47:53+1100"
      expect(findAllEqualTo(result, "Test: " + formattedDate).length).toEqual(
        1
      );
    });

    it("can format dates using the dateTime as the type within the formats section", function() {
      const template = {
        template: "Date: {{date}}",
        formats: { date: { type: "dateTime", format: "dd-mm-yyyy HH:MM:ss" } }
      };
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          catalogItem={catalogItem}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      const date = new Date(Date.UTC(2017, 11, 23, 8, 47, 53));
      const formattedDate =
        absPad2(date.getDate()) +
        "-" +
        absPad2(date.getMonth()) +
        "-" +
        date.getFullYear() +
        " " +
        absPad2(date.getHours()) +
        ":" +
        absPad2(date.getMinutes()) +
        ":" +
        absPad2(date.getSeconds()); // E.g. "23-11-2017 19:47:53"
      expect(findAllEqualTo(result, "Date: " + formattedDate).length).toEqual(
        1
      );
    });

    it("handles non-numbers in terria.formatDateTime", function() {
      const template =
        "Test: {{#terria.formatDateTime}}text{{/terria.formatDateTime}}";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Test: text").length).toEqual(1);
    });

    it("url encodes text components", function() {
      const template =
        "Test: {{#terria.urlEncodeComponent}}W/HO:E#1{{/terria.urlEncodeComponent}}";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Test: W%2FHO%3AE%231").length).toEqual(1);
    });

    it("url encodes sections of text", function() {
      const template =
        "Test: {{#terria.urlEncode}}http://example.com/a b{{/terria.urlEncode}}";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllWithHref(result, "http://example.com/a%20b").length
      ).toEqual(1);
    });

    it("does not escape ampersand as &amp;", function() {
      const template = { template: "Ampersand: {{ampersand}}" };
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Ampersand: A & B").length).toEqual(1);
      expect(findAllEqualTo(result, "&amp;").length).toEqual(0);
    });

    it("does not escape < as &lt;", function() {
      const template = { template: "Less than: {{lessThan}}" };
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Less than: A < B").length).toEqual(1);
      expect(findAllEqualTo(result, "&lt;").length).toEqual(0);
    });

    it("can embed safe html in template", function() {
      const template = "<div>Hello {{owner_html}}.</div>";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Hello Jay").length).toEqual(1);
      expect(findAllWithType(result, "br").length).toEqual(1);
      expect(findAllEqualTo(result, "Smith.").length).toEqual(1);
    });

    it("cannot embed unsafe html in template", function() {
      const template = "<div>Hello {{unsafe}}</div>";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Hello ok!").length).toEqual(1);
      expect(findAllWithType(result, "script").length).toEqual(0);
      expect(findAllEqualTo(result, 'alert("gotcha")').length).toEqual(0);
    });

    it("can use a json featureInfoTemplate with partials", function() {
      const template = {
        template: '<div class="jj">test {{>boldfoo}}</div>',
        partials: { boldfoo: "<b>{{foo}}</b>" }
      };
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllWithClass(result, "jk").length).toEqual(0); // just to be sure the null case gives 0.
      expect(findAllWithClass(result, "jj").length).toEqual(1);
      expect(findAllWithType(result, "b").length).toEqual(1);
      expect(findAllEqualTo(result, "test ").length).toEqual(1);
      expect(findAllEqualTo(result, "bar").length).toEqual(1);
    });

    it("sets the name from featureInfoTemplate", function() {
      const template = { name: "{{name}} {{foo}}" };
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={false}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      const nameElement = findAllWithClass(result, Styles.title)[0];
      const nameSpan = nameElement.props.children[0];
      const name = nameSpan.props.children;
      expect(name).toContain("Kay bar");
    });

    it("can access clicked lat and long", function() {
      const template =
        "<div>Clicked {{#terria.formatNumber}}{maximumFractionDigits:0}{{terria.coords.latitude}}{{/terria.formatNumber}}, {{#terria.formatNumber}}{maximumFractionDigits:0}{{terria.coords.longitude}}{{/terria.formatNumber}}</div>";
      const position = Ellipsoid.WGS84.cartographicToCartesian(
        Cartographic.fromDegrees(77, 44, 6)
      );
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          position={position}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Clicked 44, 77").length).toEqual(1);
    });

    it("can replace text, using terria.partialByName", function() {
      // Replace "Kay" of feature.properties.name with "Yak", or "This name" with "That name".
      const template = {
        template: "{{#terria.partialByName}}{{name}}{{/terria.partialByName}}",
        partials: {
          Bar: "Rab",
          Kay: "Yak",
          "This name": "That name"
        }
      };

      let section = (
        <FeatureInfoSection
          feature={feature} // feature.properties.name === "Kay";
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      let result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Yak").length).toEqual(1);
      expect(findAllEqualTo(result, "Kay").length).toEqual(0);

      feature.properties.name = "This name";
      section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "That name").length).toEqual(1);
      expect(findAllEqualTo(result, "Yak").length).toEqual(0);
    });

    it("does not replace text if no matching, using terria.partialByName", function() {
      const template = {
        template: "{{#terria.partialByName}}{{name}}{{/terria.partialByName}}",
        partials: {
          Bar: "Rab",
          NotKay: "Yak",
          "This name": "That name"
        }
      };

      const section = (
        <FeatureInfoSection
          feature={feature} // feature.properties.name === "Kay";
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Yak").length).toEqual(0);
      expect(findAllEqualTo(result, "Kay").length).toEqual(1);
    });

    it("can replace text and filter out unsafe replacement, using terria.partialByName", function() {
      const template = {
        template: "{{#terria.partialByName}}{{name}}{{/terria.partialByName}}",
        partials: {
          Bar: "Rab",
          Kay: "Yak!<script>alert('gotcha')</script>",
          This: "That"
        }
      };

      const section = (
        <FeatureInfoSection
          feature={feature} // feature.properties.name === "Kay";
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "Yak!").length).toEqual(1);
      expect(findAllEqualTo(result, "Yak!alert('gotcha')").length).toEqual(0);
      expect(findAllEqualTo(result, "alert('gotcha')").length).toEqual(0);
      expect(
        findAllEqualTo(result, "Yak!<script>alert('gotcha')</script>").length
      ).toEqual(0);
      expect(findAllEqualTo(result, "Kay").length).toEqual(0);
    });

    /*
    // v8 version does not support this feature at the moment. See https://github.com/TerriaJS/terriajs/issues/5685
     
    it("can access the current time", function() {
      const template = "<div class='rrrr'>Time: {{terria.currentTime}}</div>";
      catalogItem._discreteTimes = ["2017-11-23", "2018-01-03"];

      // const timeInterval = new TimeInterval({
      //   start: JulianDate.fromIso8601("2017-11-23T19:47:53+11:00"),
      //   stop: JulianDate.fromIso8601("2018-01-03T07:05:00Z"),
      //   isStartIncluded: true,
      //   isStopIncluded: false
      // });
      // const intervals = new TimeIntervalCollection([timeInterval]);
      // const availableDate = JulianDate.toDate(timeInterval.start);
      // catalogItem.intervals = intervals;
      // catalogItem.availableDates = [availableDate];

      // catalogItem.canUseOwnClock = true;
      // catalogItem.useOwnClock = true;

      // catalogItem.clock.currentTime = JulianDate.fromIso8601(
      //   "2017-12-19T17:13:11+07:00"
      // );

      catalogItem.setTrait(CommonStrata.user, "currentTime", "2017-12-01");

      terria.timelineClock.currentTime = JulianDate.fromIso8601(
        "2001-01-01T01:01:01+01:00"
      ); // An decoy date to make sure that we are indeed using the catalog items clock and not terria.clock.
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          catalogItem={catalogItem}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, catalogItem._discreteTimes[0]).length).toEqual(
        1
      );
    });
*/
    it("can render a recursive featureInfoTemplate", function() {
      const template = {
        template: "<ul>{{>show_children}}</ul>",
        partials: {
          show_children:
            "{{#children}}<li>{{name}}<ul>{{>show_children}}</ul></li>{{/children}}"
        }
      };
      feature.properties.merge({
        children: [
          {
            name: "Alice",
            children: [
              { name: "Bailey", children: null },
              { name: "Beatrix", children: null }
            ]
          },
          {
            name: "Xavier",
            children: [
              { name: "Yann", children: null },
              { name: "Yvette", children: null }
            ]
          }
        ]
      });
      // const recursedHtml = ''
      //     + '<ul>'
      //     +   '<li>Alice'
      //     +       '<ul>'
      //     +           '<li>' + 'Bailey' + '<ul></ul>' + '</li>'
      //     +           '<li>' + 'Beatrix' + '<ul></ul>' + '</li>'
      //     +       '</ul>'
      //     +   '</li>'
      //     +   '<li>Xavier'
      //     +       '<ul>'
      //     +           '<li>' + 'Yann' + '<ul></ul>' + '</li>'
      //     +           '<li>' + 'Yvette' + '<ul></ul>' + '</li>'
      //     +       '</ul>'
      //     +   '</li>'
      //     + '</ul>';
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          template={template}
          viewState={viewState}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      const content = findAllWithClass(result, contentClass)[0];
      expect(findAllWithType(content, "ul").length).toEqual(7);
      expect(findAllWithType(content, "li").length).toEqual(6);
    });
  });

  describe("raw data", function() {
    beforeEach(function() {
      feature.description = {
        getValue: function() {
          return "<p>hi!</p>";
        },
        isConstant: true
      };
    });

    it("does not appear if no template", function() {
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          viewState={viewState}
          t={i18next.t}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllEqualTo(result, "featureInfo.showCuratedData").length
      ).toEqual(0);
      expect(findAllEqualTo(result, "featureInfo.showRawData").length).toEqual(
        0
      );
    });

    it('shows "Show Raw Data" if template', function() {
      const template = "Test";
      const section = (
        <FeatureInfoSection
          feature={feature}
          isOpen={true}
          viewState={viewState}
          template={template}
          t={i18next.getFixedT("cimode")}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(
        findAllEqualTo(result, "featureInfo.showCuratedData").length
      ).toEqual(0);
      expect(findAllEqualTo(result, "featureInfo.showRawData").length).toEqual(
        1
      );
    });
  });

  describe("CZML templating", function() {
    beforeEach(function() {});

    it("uses and completes a string-form featureInfoTemplate", async function() {
      // target = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br />
      //           <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
      const json = await loadJson("test/init/czml-with-template-0.json");
      const czmlItem = upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        {}
      ).throwIfUndefined() as CzmlCatalogItem;

      await czmlItem.loadMapItems();

      const czmlData = czmlItem.mapItems;
      expect(czmlData.length).toBeGreaterThan(0);
      const czmlFeature = czmlData[0].entities.values[0];
      const section = (
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen={true}
          viewState={viewState}
          template={czmlItem.featureInfoTemplate}
          t={() => {}}
        />
      );
      const result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "ABC").length).toEqual(1);
      expect(findAllEqualTo(result, "2010").length).toEqual(1);
      expect(findAllEqualTo(result, "14.4").length).toEqual(1);
      expect(findAllEqualTo(result, "2012").length).toEqual(1);
      expect(findAllEqualTo(result, "10.7").length).toEqual(1);
    });

    it("uses and completes a time-varying, string-form featureInfoTemplate", async function() {
      // targetBlank = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td></td></tr></tbody></table><br />
      //                <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
      // targetABC = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br />
      //              <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
      // targetDEF = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>DEF</td></tr></tbody></table><br />
      //              <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
      const json = await loadJson("test/init/czml-with-template-1.json");
      const czmlItem = upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        "definition",
        json,
        {}
      ).throwIfUndefined() as CzmlCatalogItem;

      await czmlItem.loadMapItems();

      const czmlData = czmlItem.mapItems;
      expect(czmlData.length).toBeGreaterThan(0);
      const czmlFeature = czmlData[0].entities.values[0];
      czmlItem.setTrait(CommonStrata.user, "currentTime", "2010-02-02");
      let section = (
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen={true}
          catalogItem={czmlItem}
          viewState={viewState}
          template={czmlItem.featureInfoTemplate}
          t={() => {}}
        />
      );
      let result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "ABC").length).toEqual(0);
      expect(findAllEqualTo(result, "DEF").length).toEqual(0);
      czmlItem.setTrait(CommonStrata.user, "currentTime", "2012-02-02");
      section = (
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen={true}
          catalogItem={czmlItem}
          viewState={viewState}
          template={czmlItem.featureInfoTemplate}
          t={() => {}}
        />
      );
      result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "ABC").length).toEqual(1);
      expect(findAllEqualTo(result, "DEF").length).toEqual(0);

      czmlItem.setTrait(CommonStrata.user, "currentTime", "2014-02-02");
      section = (
        <FeatureInfoSection
          feature={czmlFeature}
          isOpen={true}
          catalogItem={czmlItem}
          viewState={viewState}
          template={czmlItem.featureInfoTemplate}
          t={() => {}}
        />
      );
      result = getShallowRenderedOutput(section);
      expect(findAllEqualTo(result, "ABC").length).toEqual(0);
      expect(findAllEqualTo(result, "DEF").length).toEqual(1);
    });
  });
});

// Test time varying item
// Mixins: discretely time varying & Mappable mixins
// Traits: traits for the above

class TestModelTraits extends mixTraits(
  FeatureInfoTraits,
  MappableTraits,
  DiscretelyTimeVaryingTraits
) {}

class TestModel extends MappableMixin(
  DiscretelyTimeVaryingMixin(CatalogMemberMixin(CreateModel(TestModelTraits)))
) {
  get mapItems(): MapItem[] {
    throw new Error("Method not implemented.");
  }
  protected forceLoadMapItems(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  @observable _discreteTimes: string[] = [];
  get discreteTimes() {
    return this._discreteTimes.map(t => ({ time: t, tag: undefined }));
  }
}
