import isDefined from "../Core/isDefined";
import { TerriaErrorSeverity } from "../Core/TerriaError";
import type Terria from "../Models/Terria";

export default function updateApplicationOnMessageFromParentWindow(
  terria: Terria,
  window: Window
) {
  let allowOrigin: string | undefined;

  window.addEventListener(
    "message",
    async function (event: MessageEvent<any>) {
      let origin = event.origin;
      if (!isDefined(origin) && isDefined((event as any).originalEvent)) {
        // For Chrome, the origin property is in the event.originalEvent object.
        origin = (event as any).originalEvent.origin;
      }

      if (
        (!isDefined(allowOrigin) || origin !== allowOrigin) && // allowed origin in url hash parameter
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
}
