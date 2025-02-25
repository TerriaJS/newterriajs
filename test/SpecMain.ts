/// <reference types="jasmine" />
import "../lib/Core/prerequisites";
import "jasmine-ajax";
import { configure, spy } from "mobx";
import i18next from "i18next";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import JasmineDOM from "@testing-library/jasmine-dom";

configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  // Turn off safeDescriptors required for spying on computed items
  // TODO: mobx docs says this should only be enabled when need and not globally,
  // see if we can remove this global setting
  safeDescriptors: false
});

registerCatalogMembers();

// Fail the test if a MobX computed property throws an exception.
spy((event) => {
  if (event.type === "error") {
    fail(event.message);
  }
});

beforeAll(async function () {
  jasmine.addMatchers(JasmineDOM);
  await i18next.init({
    lng: "cimode",
    debug: false,
    resources: {}
  });
});

jasmine.getEnv().addReporter({
  specDone: (result) =>
    (result.failedExpectations || []).forEach((expectation) =>
      console.warn(expectation.stack)
    )
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
