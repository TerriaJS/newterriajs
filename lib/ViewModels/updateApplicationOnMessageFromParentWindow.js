import { TerriaErrorSeverity } from "../Core/TerriaError";
import defined from "terriajs-cesium/Source/Core/defined";

const updateApplicationOnMessageFromParentWindow = function (terria, window) {
  let allowOrigin;

  window.addEventListener(
    "message",
    async function (event) {
      let origin = event.origin;
      if (!defined(origin) && defined(event.originalEvent)) {
        // For Chrome, the origin property is in the event.originalEvent object.
        origin = event.originalEvent.origin;
      }

      if (
        (!defined(allowOrigin) || origin !== allowOrigin) && // allowed origin in url hash parameter
        event.source !== window.parent && // iframe parent
        event.source !== window.opener
      ) {
        // caller of window.open
        return;
      }

      // receive allowOrigin
      if (
        (event.source === window.opener || event.source === window.parent) &&
        event.data.allowOrigin
      ) {
        allowOrigin = event.data.allowOrigin;
        delete event.data.allowOrigin;
      }

      // Ignore react devtools
      if (/^react-devtools/gi.test(event.data.source)) {
        return;
      }

      (
        await terria.updateFromStartData(
          event.data,
          "Start data from message from parent window",
          TerriaErrorSeverity.Error
        )
      ).raiseError(terria);
    },
    false
  );

  if (window.parent !== window) {
    window.parent.postMessage("ready", "*");
  }

  if (window.opener) {
    window.opener.postMessage("ready", "*");
  }
};

export default updateApplicationOnMessageFromParentWindow;
