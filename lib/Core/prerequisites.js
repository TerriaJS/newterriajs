// This file is loaded by TerriaMap's entry.js prior to loading index.js.
// It is mostly useful for installing polyfills.
import "core-js/features/symbol";
import "core-js/features/global-this";
import "regenerator-runtime/runtime";
import { configure } from "mobx";

configure({
  computedRequiresReaction: true,
  enforceActions: "observed"
});
