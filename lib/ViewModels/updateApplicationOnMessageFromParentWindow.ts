import { TerriaErrorSeverity } from "terriajs/lib/Core/TerriaError";
import isDefined from "../Core/isDefined";
import { isJsonBoolean, isJsonObject, isJsonString } from "../Core/Json";
import Terria from "../Models/Terria";
import { BaseModel } from "../Models/Definition/Model";

type ReadyMessage = "ready";

interface StartDataMessage {
  data: unknown;
  type?: "addStartData"; // This is the default message (if type is not provided) for backwards compatibility
}

interface applyInitSource {
  type: "applyInitSource";
  replaceStratum?: boolean;
  data: unknown;
}

interface ModelActionMessage {
  type: "model";
  action: "remove";
  id: string;
}

type MessageTypes = StartDataMessage | ModelActionMessage | applyInitSource;

export type WindowMessage =
  | (
      | {
          allowOrigin?: string;
          source?: string;
        }
      | MessageTypes
    )
  | ReadyMessage;

export type ResponseMessage = Required<Pick<MessageTypes, "type">> & {
  ready: true;
};

function updateApplicationOnMessageFromParentWindow(
  terria: Terria,
  window: Window
) {
  let allowOrigin: string;

  const postMessage: (message: ResponseMessage, targetOrigin: string) => void =
    window.parent !== window
      ? window.parent.postMessage
      : window.opener
      ? window.opener.postMessage
      : undefined;

  window.addEventListener(
    "message",
    async function (event) {
      console.log(event);
      let origin = event.origin;
      if (
        !isDefined(origin) &&
        "originalEvent" in event &&
        isJsonObject(event.originalEvent) &&
        isJsonString(event.originalEvent.origin)
      ) {
        // For Chrome, the origin property is in the event.originalEvent object.
        origin = event.originalEvent.origin;
      }

      if (
        (!isDefined(allowOrigin) || origin !== allowOrigin) && // allowed origin in url hash parameter
        event.source !== window.parent && // iframe parent
        event.source !== window.opener
      ) {
        // caller of window.open
        return;
      }

      if (isJsonObject(event.data)) {
        // Ignore response ready messages
        if ("ready" in event.data) {
          return;
        }

        // receive allowOrigin
        if (
          (event.source === window.opener || event.source === window.parent) &&
          isJsonString(event.data.allowOrigin)
        ) {
          allowOrigin = event.data.allowOrigin;
          delete event.data.allowOrigin;
        }

        // Ignore react devtools
        if (
          isJsonString(event.data.source) &&
          /^react-devtools/gi.test(event.data.source)
        ) {
          return;
        }

        // Reset models
        if (
          isJsonObject(event.data) &&
          "type" in event.data &&
          event.data.type === "model" &&
          isJsonString(event.data.action) &&
          isJsonString(event.data.id)
        ) {
          if (event.data.action === "remove") {
            const model = terria.getModelById(BaseModel, event.data.id);
            if (model) terria.removeModelReferences(model);
          }
          postMessage({ type: "model", ready: true }, "*");
          return;
        }

        // Load init source
        if (
          isJsonObject(event.data) &&
          "type" in event.data &&
          event.data.type === "applyInitSource" &&
          isJsonObject(event.data.data)
        ) {
          await terria.applyInitData({
            initData: event.data.data,
            replaceStratum: isJsonBoolean(event.data.replaceStratum)
              ? event.data.replaceStratum
              : undefined
          });
          postMessage({ type: "applyInitSource", ready: true }, "*");
          return;
        }

        // Default message type is startData
        (
          await terria.updateFromStartData(
            event.data,
            "Start data from message from parent window",
            TerriaErrorSeverity.Error
          )
        ).raiseError(terria);
        postMessage({ type: "addStartData", ready: true }, "*");
      }
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

export default updateApplicationOnMessageFromParentWindow;
