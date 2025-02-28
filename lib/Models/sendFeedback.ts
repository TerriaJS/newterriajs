import i18next from "i18next";
import isDefined from "../Core/isDefined";
import loadWithXhr from "../Core/loadWithXhr";
import TerriaError from "../Core/TerriaError";
import {
  buildShareLink,
  buildShortShareLink,
  canShorten
} from "../ReactViews/Map/Panels/SharePanel/BuildShareLink";
import Terria from "./Terria";

export default function sendFeedback(options: {
  terria: Terria;
  title?: string;
  name: string;
  email: string;
  sendShareURL: boolean;
  comment: string;
  additionalParameters?: Record<string, string | undefined>;
}) {
  if (!isDefined(options) || !isDefined(options.terria)) {
    throw TerriaError.from("options.terria is required.");
  }

  const terria = options.terria;

  if (!isDefined(terria.configParameters.feedbackUrl)) {
    raiseError(terria, "`terria.configParameters.feedbackUrl` is not defined");
    return;
  }
  const feedbackUrl = terria.configParameters.feedbackUrl;

  const shareLinkPromise = options.sendShareURL
    ? canShorten(terria)
      ? buildShortShareLink(terria)
      : Promise.resolve(buildShareLink(terria))
    : Promise.resolve("Not shared");

  return shareLinkPromise
    .then((shareLink) => {
      const feedbackData: Record<string, string | undefined> = {
        title: options.title,
        name: options.name,
        email: options.email,
        shareLink: shareLink,
        comment: options.comment
      };
      if (
        options.additionalParameters &&
        terria.serverConfig &&
        terria.serverConfig.config &&
        terria.serverConfig.config.additionalFeedbackParameters
      ) {
        terria.serverConfig.config.additionalFeedbackParameters.forEach(
          ({ name }: any) => {
            feedbackData[name] = options.additionalParameters?.[name];
          }
        );
      }
      return loadWithXhr({
        url: feedbackUrl,
        responseType: "json",
        method: "POST",
        data: JSON.stringify(feedbackData),
        headers: {
          "Content-Type": "application/json"
        }
      });
    })
    .then(function (json) {
      if (json instanceof String) {
        json = JSON.parse(json.toString());
      }
      if (typeof json === "string") {
        json = JSON.parse(json);
      }

      if (!json || !json.result || json.result !== "SUCCESS") {
        raiseError(
          terria,
          `Failed to parse response from server: \`${JSON.stringify(json)}\``
        );
        return false;
      } else {
        terria.notificationState.addNotificationToQueue({
          title: i18next.t("models.feedback.thanksTitle"),
          message: i18next.t("models.feedback.thanksMessage", {
            appName: terria.appName
          })
        });
        return true;
      }
    })
    .catch(function (e) {
      raiseError(terria, e);
      return false;
    });
}

function raiseError(terria: Terria, error: unknown) {
  terria.raiseErrorToUser(
    TerriaError.from(error, {
      title: i18next.t("models.feedback.unableToSendTitle"),
      message: i18next.t("models.feedback.unableToSendTitle")
    })
  );
}
